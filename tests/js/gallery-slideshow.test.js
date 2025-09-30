const fs = require('fs');
const path = require('path');

function loadPreloadNeighboringImagesFactory() {
    const filePath = path.resolve(__dirname, '../../ma-galerie-automatique/assets/js/gallery-slideshow.js');
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    const match = scriptContent.match(/function preloadNeighboringImages\(images, currentIndex\) {([\s\S]*?)\n        }/);

    if (!match) {
        throw new Error('Unable to locate preloadNeighboringImages in gallery-slideshow.js');
    }

    const functionSource = `function preloadNeighboringImages(images, currentIndex) {${match[1]}\n        }`;

    return new Function('preloadedUrls', 'debug', 'mgaSprintf', 'mga__', 'Image', `\n        ${functionSource}\n        return preloadNeighboringImages;\n    `);
}

describe('preloadNeighboringImages', () => {
    it('skips preloading when a neighboring image is undefined', () => {
        const createPreloader = loadPreloadNeighboringImagesFactory();
        const preloadedUrls = new Set();
        const debug = { log: jest.fn() };
        const mgaSprintf = (format, value) => format.replace('%s', String(value));
        const mga__ = (text) => text;
        const imageInstances = [];

        function ImageMock() {
            imageInstances.push(this);
        }

        const preloadNeighboringImages = createPreloader(preloadedUrls, debug, mgaSprintf, mga__, ImageMock);
        const images = [
            { highResUrl: 'https://example.com/image-1.jpg' },
            undefined,
            { highResUrl: 'https://example.com/image-3.jpg' },
        ];

        expect(() => preloadNeighboringImages(images, 0)).not.toThrow();

        expect(preloadedUrls.has('https://example.com/image-3.jpg')).toBe(true);
        expect(preloadedUrls.has(undefined)).toBe(false);
        expect(imageInstances).toHaveLength(1);
        expect(imageInstances[0].src).toBe('https://example.com/image-3.jpg');
        expect(debug.log).toHaveBeenCalledTimes(1);
    });
});
