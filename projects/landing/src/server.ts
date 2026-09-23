import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Serve static files from /browser with aggressive caching
 */
app.use(
    express.static(browserDistFolder, {
        maxAge: '1y',
        index: false,
        redirect: false,
        setHeaders: (res, filePath) => {
            // Allow caching for all static assets (hashed filenames)
            if (/\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot|svg|png|ico)$/.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        }
    })
);

/**
 * Serve prerendered index.html directly for root path (avoids SSR overhead)
 */
app.get('/', (req, res, next) => {
    try {
        let html = readFileSync(join(browserDistFolder, 'index.html'), 'utf8');
        // Remove modulepreload links that delay initial render
        // chunk-CrXOoJy3.js (Angular framework) doesn't need to be preloaded
        // since the SSR HTML can paint before Angular hydration starts
        html = html.replace(/<link rel="modulepreload" href="[^"]+"><\/link>|<link rel="modulepreload" href="[^"]+">/g, '');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(html);
    } catch {
        next();
    }
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
    angularApp
        .handle(req)
        .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
        .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
    const port = process.env['PORT'] || 4001;
    app.listen(port, (error) => {
        if (error) {
            throw error;
        }

        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
