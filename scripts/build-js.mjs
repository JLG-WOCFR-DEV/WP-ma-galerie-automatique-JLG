import { build } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const outdir = resolve(projectRoot, 'ma-galerie-automatique/assets/js/dist');

const entryPoints = {
    admin: resolve(projectRoot, 'ma-galerie-automatique/assets/js/src/admin.js'),
    'gallery-slideshow': resolve(projectRoot, 'ma-galerie-automatique/assets/js/src/gallery-slideshow.js'),
    debug: resolve(projectRoot, 'ma-galerie-automatique/assets/js/src/debug.js'),
};

await build({
    entryPoints,
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ['es2018'],
    format: 'iife',
    platform: 'browser',
    outdir,
    logLevel: 'info',
});
