/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(
    __dirname,
    '../../ma-galerie-automatique/assets/css/gallery-slideshow.css'
);
const css = fs.readFileSync(cssPath, 'utf8');

describe('lightbox layout CSS', () => {
    it('pins the thumbnail strip to the bottom so the slideshow can grow', () => {
        expect(css).toMatch(/\.mga-viewer\s*\{[^}]*justify-content:\s*flex-end/s);
        expect(css).toMatch(/\.mga-thumbs-swiper\s*\{[^}]*flex:\s*0 0 auto/s);
        expect(css).toMatch(/\.mga-main-swiper\s*\{[^}]*flex:\s*1 1 auto/s);
    });

    it('keeps captions in the top chrome and only overflows onto the image when too long', () => {
        expect(css).toMatch(/\.mga-header\s*\{[^}]*position:\s*relative/s);
        expect(css).toMatch(/\.mga-caption-container\s*\{[^}]*max-height:\s*2\.7em/s);
        expect(css).toMatch(/\.mga-caption-container\s*\{[^}]*flex:\s*1 1 0/s);
        expect(css).toMatch(/\.mga-caption-container\s*\{[^}]*overflow:\s*visible/s);
        expect(css).toMatch(/\.mga-caption\s*\{[^}]*max-height:\s*8\.1em/s);
    });

    it('does not let the top chrome steal fullscreen prev/next pointer hits', () => {
        expect(css).toMatch(/\.mga-header\s*\{[^}]*pointer-events:\s*none/s);
        expect(css).toMatch(/\.mga-header\s+\.mga-toolbar-button[^{]*\{[^}]*pointer-events:\s*auto/s);
        expect(css).toMatch(/\.mga-header\s+\.mga-caption[^{]*\{[^}]*pointer-events:\s*auto/s);
        expect(css).toMatch(/\.mga-echo-bg\s*\{[^}]*pointer-events:\s*none/s);
        expect(css).toMatch(/\.mga-nav-hitarea--prev\s*\{[^}]*left:\s*0/s);
        expect(css).toMatch(/\.mga-nav-hitarea--next\s*\{[^}]*right:\s*0/s);
        expect(css).toMatch(/\.mga-main-swiper \.swiper-button-next,[\s\S]*?pointer-events:\s*auto/);
        expect(css).not.toMatch(/\.mga-main-swiper\s*\{[^}]*pointer-events:\s*none/s);
        expect(css).toMatch(/\.mga-viewer:fullscreen \.mga-thumbs-swiper\s*,\s*\n\.mga-viewer:-webkit-full-screen \.mga-thumbs-swiper,\s*\n\.mga-viewer\.mga-is-fullscreen \.mga-thumbs-swiper\s*\{[^}]*display:\s*none/s);
        expect(css).not.toMatch(/\.mga-viewer:fullscreen \.mga-caption-container\s*\{[^}]*display:\s*none/s);
        expect(css).toMatch(/\.mga-viewer:fullscreen \.mga-main-swiper \.swiper-button-next/);
        expect(css).toMatch(/\.mga-viewer:-webkit-full-screen \.mga-main-swiper \.swiper-button-next/);
        expect(css).toMatch(/\.mga-viewer\.mga-is-fullscreen \.mga-main-swiper \.swiper-button-next/);
    });
});
