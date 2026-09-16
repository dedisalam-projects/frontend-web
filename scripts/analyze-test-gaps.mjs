import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

function findSpecFiles(dir, fileList = []) {
    if (!existsSync(dir)) return fileList;
    const files = readdirSync(dir);
    for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            findSpecFiles(fullPath, fileList);
        } else if (file.endsWith('.spec.ts')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function parseE2ETests(specPaths) {
    const tests = [];
    for (const specPath of specPaths) {
        const content = readFileSync(specPath, 'utf-8');
        const relativePath = specPath.replace(/\\/g, '/').split('/e2e/')[1] || specPath;

        // Extract any URLs in the whole file or beforeEach
        const fileUrls = Array.from(content.matchAll(/(?:goto|waitForURL)\(\s*(?:[A-Z0-9_]*URL|[`'"]([^`'"]+)[`'"])/g)).map((m) => {
            const raw = m[0];
            if (raw.includes('LANDING_URL')) return 'http://localhost:4001';
            if (raw.includes('AUTH_URL')) return 'http://localhost:4002';
            if (raw.includes('USERS_URL')) return 'http://localhost:4000/users';
            if (raw.includes('DASHBOARD_URL')) return 'http://localhost:4000';
            return m[1] || '';
        });
        if (content.includes('USERS_URL') || relativePath.includes('users')) {
            fileUrls.push('http://localhost:4000/users');
        }

        // Match test blocks
        const testRegex = /test\(\s*(['"`])(.*?)\1\s*,\s*async\s*\(\s*\{([^}]+)\}\s*\)\s*=>\s*\{([\s\S]*?)(?=\n\s*(?:test|test\.describe|\}\);))/g;
        let match;
        while ((match = testRegex.exec(content)) !== null) {
            const title = match[2];
            const body = match[4];

            // Extract target URLs visited
            const urlMatches = Array.from(body.matchAll(/goto\(\s*[`'"]([^`'"]+)[`'"]/g)).map((m) => m[1]);
            const waitForUrlMatches = Array.from(body.matchAll(/waitForURL\(\s*(?:\/([^\/]+)\/|[`'"]([^`'"]+)[`'"])/g)).map((m) => m[1] || m[2]);

            // Extract clicked elements
            const clickMatches = Array.from(body.matchAll(/locator\(\s*[`'"]([^`'"]+)[`'"]\s*\)\s*\.click/g)).map((m) => m[1]);

            // Extract filled elements
            const fillMatches = Array.from(body.matchAll(/locator\(\s*[`'"]([^`'"]+)[`'"]\s*\)\s*\.fill/g)).map((m) => m[1]);

            tests.push({
                file: `e2e/${relativePath}`,
                title,
                urls: [...new Set([...urlMatches, ...waitForUrlMatches, ...fileUrls])],
                clicks: clickMatches,
                fills: fillMatches,
                rawBody: body + '\n' + content
            });
        }
    }
    return tests;
}

function analyzeGaps() {
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
    console.log('\x1b[1m\x1b[36m%s\x1b[0m', '  User Journey & Test Gap Analyzer');
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

    const journeysPath = resolve(process.cwd(), 'user-journeys.json');
    if (!existsSync(journeysPath)) {
        console.error('\x1b[31mError: user-journeys.json not found!\x1b[0m');
        console.error('Please run "npm run test:crawl" first to discover user journeys.\n');
        process.exit(1);
    }

    const journeyData = JSON.parse(readFileSync(journeysPath, 'utf-8'));
    const specFiles = findSpecFiles(resolve(process.cwd(), 'e2e'));
    const existingTests = parseE2ETests(specFiles);

    console.log(`Loaded \x1b[1m${journeyData.journeys.length}\x1b[0m discovered journeys from crawler.`);
    console.log(`Scanned \x1b[1m${specFiles.length}\x1b[0m spec files with \x1b[1m${existingTests.length}\x1b[0m test cases in e2e/.\n`);

    const coveredJourneys = [];
    const missingJourneys = [];

    for (const journey of journeyData.journeys) {
        let isCovered = false;
        let coveringTest = null;

        for (const test of existingTests) {
            // Check if test visits or interacts with the journey target
            const target = journey.to || '';
            const action = journey.action.toLowerCase();

            const urlMatch = test.urls.some((u) => {
                if (target.includes('4001') && (u.includes('4001') || u === '/' || u === '')) return true;
                if (target.includes('4002') && u.includes('4002')) return true;
                if (target.includes('4000') && u.includes('4000')) return true;
                if (target.includes('users') && u.includes('users')) return true;
                if (target.includes('login') && u.includes('login')) return true;
                return false;
            });

            // Action keyword match
            const actionMatch =
                (action.includes('superadmin') && test.rawBody.includes('superadmin')) ||
                (action.includes('new') && (test.rawBody.includes('New') || test.rawBody.includes('.pi-plus'))) ||
                (action.includes('filter') && (test.rawBody.includes('Search') || test.rawBody.includes('filter'))) ||
                (action.includes('cta') && (test.rawBody.includes('Get Started') || test.rawBody.includes('4002'))) ||
                (action.includes('landing') && test.file.includes('landing')) ||
                (action.includes('sort') && test.rawBody.includes('sort'));

            if (urlMatch && actionMatch) {
                isCovered = true;
                coveringTest = { file: test.file, title: test.title };
                break;
            } else if (urlMatch && journey.type === 'navigation' && !action.includes('sort') && !action.includes('filter')) {
                // General navigation coverage
                isCovered = true;
                coveringTest = { file: test.file, title: test.title };
                break;
            }
        }

        if (isCovered) {
            coveredJourneys.push({ journey, coveringTest });
        } else {
            missingJourneys.push({ journey });
        }
    }

    const total = journeyData.journeys.length;
    const coveredCount = coveredJourneys.length;
    const coveragePercent = total > 0 ? ((coveredCount / total) * 100).toFixed(1) : '0.0';

    // ── Print Report ────────────────────────────────────────────────────────
    console.log('\x1b[1mCovered User Journeys:\x1b[0m');
    coveredJourneys.forEach(({ journey, coveringTest }) => {
        console.log(`  \x1b[32m✔ [COVERED]\x1b[0m ${journey.action}`);
        console.log(`    \x1b[90m↳ Tested by: ${coveringTest.file} > "${coveringTest.title}"\x1b[0m`);
    });

    if (missingJourneys.length > 0) {
        console.log('\n\x1b[1m\x1b[33mUntested User Journeys (Test Gaps):\x1b[0m');
        missingJourneys.forEach(({ journey }, idx) => {
            console.log(`  \x1b[31m✘ [GAP #${idx + 1}]\x1b[0m ${journey.action}`);
            console.log(`    \x1b[90m↳ Target: ${journey.to} (Type: ${journey.type})\x1b[0m`);
        });
    }

    console.log('\n\x1b[36m════════════════════════════════════════════════════════════════\x1b[0m');
    console.log(`\x1b[1mUser Journey Coverage Score:\x1b[0m \x1b[35m${coveragePercent}%\x1b[0m (${coveredCount}/${total} journeys)`);
    console.log(`Untested Test Gaps: \x1b[1m\x1b[31m${missingJourneys.length}\x1b[0m`);
    console.log('\x1b[36m════════════════════════════════════════════════════════════════\x1b[0m\n');

    // ── Export Report JSON ──────────────────────────────────────────────────
    const report = {
        generatedAt: new Date().toISOString(),
        score: {
            coveragePercent: Number(coveragePercent),
            coveredJourneys: coveredCount,
            totalJourneys: total,
            gapCount: missingJourneys.length
        },
        covered: coveredJourneys,
        gaps: missingJourneys,
        recommendations: missingJourneys.map((g, idx) => ({
            id: `REC-${idx + 1}`,
            targetAction: g.journey.action,
            targetUrl: g.journey.to,
            suggestedSpec: g.journey.to.includes('4002')
                ? 'e2e/auth/untested-routes.spec.ts'
                : g.journey.to.includes('users')
                  ? 'e2e/dashboard/users-crud.spec.ts'
                  : 'e2e/dashboard/navigation.spec.ts'
        }))
    };

    const outReportPath = resolve(process.cwd(), 'test-gaps-report.json');
    writeFileSync(outReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Detailed report saved to: \x1b[34m${outReportPath}\x1b[0m\n`);
}

analyzeGaps();
