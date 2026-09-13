import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const apps = [
    { name: 'dashboard', port: 4000, color: '\x1b[34m' }, // Blue
    { name: 'landing', port: 4001, color: '\x1b[32m' }, // Green
    { name: 'auth', port: 4002, color: '\x1b[35m' } // Magenta
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}  Sakai-NG Micro-Frontends - Development Orchestrator${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}`);

// Step 1: Ensure shared-ui library is built
const sharedUiDist = resolve(process.cwd(), 'dist', 'shared-ui');
if (!existsSync(sharedUiDist)) {
    console.log(`\n${YELLOW}[shared-ui] dist/shared-ui not found. Building shared-ui first...${RESET}`);
    try {
        execSync(`${npxCmd} ng build shared-ui`, { stdio: 'inherit', shell: true });
        console.log(`${BOLD}\x1b[32m[shared-ui] Library built successfully!${RESET}\n`);
    } catch (err) {
        console.error(`\x1b[31m[shared-ui] Failed to build shared-ui library.${RESET}`, err);
        process.exit(1);
    }
} else {
    console.log(`\x1b[32m[shared-ui] Found existing dist/shared-ui.${RESET}`);
}

console.log(`\n${BOLD}Starting development servers:${RESET}`);
apps.forEach((app) => {
    console.log(`  - ${app.color}${app.name.padEnd(10)}${RESET} -> http://localhost:${app.port}`);
});
console.log(`  - \x1b[33mbackend   ${RESET} -> http://localhost:3000 (API Gateway)\n`);

const runningProcesses = [];

function killChild(child) {
    if (!child || !child.pid) return;
    try {
        if (isWindows) {
            execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
        } else {
            child.kill('SIGTERM');
        }
    } catch {
        // Process might already be dead
    }
}

function cleanup() {
    console.log(`\n${YELLOW}Shutting down all development servers...${RESET}`);
    for (const { child, name } of runningProcesses) {
        killChild(child);
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
    for (const { child } of runningProcesses) {
        killChild(child);
    }
});

// Step 2: Spawn dev servers
for (const app of apps) {
    const prefix = `${app.color}[${app.name}:${app.port}]${RESET} `;
    const child = spawn(npxCmd, ['ng', 'serve', app.name, '--port', String(app.port)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProcesses.push({ child, name: app.name });

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                process.stdout.write(`${prefix}${line}\n`);
            }
        }
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                process.stderr.write(`${prefix}${line}\n`);
            }
        }
    });

    child.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`${prefix}exited with code ${code}`);
        }
    });
}
