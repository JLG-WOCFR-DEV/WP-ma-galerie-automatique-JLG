/**
 * @jest-environment jsdom
 */

describe('updateEchoBackground', () => {
    let updateEchoBackground;
    const originalCreateElement = document.createElement.bind(document);

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
        document.body.innerHTML = '';

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        global.Swiper = function() {};

        ({ updateEchoBackground } = require('../../ma-galerie-automatique/assets/js/gallery-slideshow'));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        delete global.Swiper;
        delete document.readyState;
    });

    it('applies the mga-visible class when the image is already cached', () => {
        const viewer = document.createElement('div');
        const bgContainer = document.createElement('div');
        bgContainer.className = 'mga-echo-bg';
        const oldImg = document.createElement('img');
        oldImg.className = 'mga-echo-bg__image mga-visible';
        bgContainer.appendChild(oldImg);
        viewer.appendChild(bgContainer);
        document.body.appendChild(viewer);

        jest.spyOn(document, 'createElement').mockImplementation((tagName, ...args) => {
            const element = originalCreateElement(tagName, ...args);
            if (tagName.toLowerCase() === 'img') {
                Object.defineProperty(element, 'complete', {
                    configurable: true,
                    value: true,
                });
            }
            return element;
        });

        updateEchoBackground(viewer, 'https://example.com/image.jpg');

        jest.advanceTimersByTime(10);

        const images = bgContainer.querySelectorAll('img');
        expect(images.length).toBe(2);
        const newImg = images[1];
        expect(newImg.classList.contains('mga-visible')).toBe(true);
        expect(oldImg.classList.contains('mga-visible')).toBe(false);
    });
});
