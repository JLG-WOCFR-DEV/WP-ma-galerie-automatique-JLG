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

describe('autoplay accessibility handlers', () => {
    let testExports;
    let playPauseButton;
    let autoplayHandlers;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '<main></main>';

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        window.matchMedia = jest.fn().mockReturnValue({
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
        });

        window.mga_settings = {
            allowBodyFallback: true,
            loop: false,
            background_style: 'echo',
            autoplay_start: false,
            delay: 4,
        };

        global.Swiper = jest.fn().mockImplementation((container, config) => {
            const instance = {
                el: container,
                destroyed: false,
                params: {},
                originalParams: {},
                update: jest.fn(),
                slides: [],
                activeIndex: 0,
            };

            const slide = document.createElement('div');
            const img = document.createElement('img');
            slide.appendChild(img);
            instance.slides.push(slide);

            if (config && config.on) {
                instance.autoplay = {
                    running: false,
                    start: jest.fn(() => {
                        instance.autoplay.running = true;
                        if (typeof config.on.autoplayStart === 'function') {
                            config.on.autoplayStart();
                        }
                    }),
                    stop: jest.fn(() => {
                        instance.autoplay.running = false;
                        if (typeof config.on.autoplayStop === 'function') {
                            config.on.autoplayStop();
                        }
                    }),
                };
                instance.realIndex = 0;
            } else {
                instance.autoplay = null;
            }

            return instance;
        });

        const module = require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
        testExports = module.__testExports;

        const viewer = testExports.getViewer();
        testExports.openViewer([
            {
                highResUrl: 'https://example.com/high-1.jpg',
                thumbUrl: 'https://example.com/thumb-1.jpg',
                caption: 'Image 1',
            },
            {
                highResUrl: 'https://example.com/high-2.jpg',
                thumbUrl: 'https://example.com/thumb-2.jpg',
                caption: 'Image 2',
            },
        ], 0);

        playPauseButton = viewer.querySelector('#mga-play-pause');
        autoplayHandlers = testExports.getAutoplayHandlers();
    });

    afterEach(() => {
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        window.matchMedia = originalMatchMedia;
    });

    it('updates aria attributes when handlers are invoked', () => {
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('false');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Lancer le diaporama');

        autoplayHandlers.autoplayStart();
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('true');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Mettre le diaporama en pause');

        autoplayHandlers.autoplayStop();
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('false');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Lancer le diaporama');

        playPauseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('true');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Mettre le diaporama en pause');

        playPauseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('false');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Lancer le diaporama');
    });
});
