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

describe('resolveLinkGroupId rel token filtering', () => {
    let helpers;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '<main></main>';

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        window.mga_settings = {
            allowBodyFallback: true,
            groupAttribute: 'href',
        };

        global.Swiper = function() {};

        window.matchMedia = jest.fn().mockReturnValue({
            matches: false,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        });

        ({ helpers } = require('../../ma-galerie-automatique/assets/js/gallery-slideshow'));
    });

    afterEach(() => {
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        document.body.innerHTML = '';

        if (typeof originalMatchMedia === 'undefined') {
            delete window.matchMedia;
        } else {
            window.matchMedia = originalMatchMedia;
        }
    });

    it('ignores generic rel tokens but groups targeted tokens', () => {
        const linkA = document.createElement('a');
        linkA.setAttribute('href', '#a');
        linkA.setAttribute('rel', 'nofollow');

        const linkB = document.createElement('a');
        linkB.setAttribute('href', '#b');
        linkB.setAttribute('rel', 'nofollow');

        const linkC = document.createElement('a');
        linkC.setAttribute('href', '#c');
        linkC.setAttribute('rel', 'nofollow mga-group:galerie-a');

        const linkD = document.createElement('a');
        linkD.setAttribute('href', '#d');
        linkD.setAttribute('rel', 'mga-group:galerie-a noopener');

        expect(helpers.resolveLinkGroupId(linkA)).toBe('href:#a');
        expect(helpers.resolveLinkGroupId(linkB)).toBe('href:#b');
        expect(helpers.resolveLinkGroupId(linkC)).toBe('rel:galerie-a');
        expect(helpers.resolveLinkGroupId(linkD)).toBe('rel:galerie-a');
    });
});

function createSwiperMockFactory() {
    const instances = {
        main: null,
        thumbs: null,
    };

    const SwiperMock = jest.fn().mockImplementation((container, config = {}) => {
        const element = container || document.createElement('div');
        const isMain = element.classList.contains('mga-main-swiper');
        const instance = {
            el: element,
            destroyed: false,
            params: config,
            originalParams: config,
            update: jest.fn(),
            destroy: jest.fn(),
            slides: Array.from(element.querySelectorAll('.swiper-slide')),
            activeIndex: 0,
            realIndex: 0,
            slideTo: jest.fn(),
            slideToLoop: jest.fn(),
        };

        if (isMain) {
            instances.main = instance;
            if (config && config.on) {
                instance.autoplay = {
                    running: false,
                    start: jest.fn(() => {
                        instance.autoplay.running = true;
                        if (typeof config.on.autoplayStart === 'function') {
                            config.on.autoplayStart(instance);
                        }
                    }),
                    stop: jest.fn(() => {
                        instance.autoplay.running = false;
                        if (typeof config.on.autoplayStop === 'function') {
                            config.on.autoplayStop(instance);
                        }
                    }),
                };
            } else {
                instance.autoplay = null;
            }
        } else {
            instances.thumbs = instance;
            instance.autoplay = null;
        }

        if (config && config.on && typeof config.on.init === 'function') {
            config.on.init(instance);
        }

        return instance;
    });

    return { SwiperMock, instances };
}

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
            share_channels: {
                facebook: {
                    enabled: true,
                    template: 'https://www.facebook.com/sharer/sharer.php?u=%url%',
                },
                twitter: {
                    enabled: true,
                    template: 'https://twitter.com/intent/tweet?url=%url%&text=%text%',
                },
            },
            share_copy: true,
            share_download: true,
        };

        const { SwiperMock } = createSwiperMockFactory();
        global.Swiper = SwiperMock;

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

describe('thumbnail accessibility controls', () => {
    const originalMatchMedia = window.matchMedia;
    let testExports;
    let viewer;
    let mainInstance;
    let thumbsInstance;
    let addEventListenerSpy;
    let thumbKeydownRegistrations;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '<main></main>';

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        thumbKeydownRegistrations = [];

        const originalAddEventListener = Element.prototype.addEventListener;
        addEventListenerSpy = jest.spyOn(Element.prototype, 'addEventListener').mockImplementation(function(type, listener, options) {
            if (type === 'keydown' && this && this.classList && this.classList.contains('mga-thumb-button')) {
                thumbKeydownRegistrations.push({ target: this, listener });
            }
            return originalAddEventListener.call(this, type, listener, options);
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
            share_channels: {
                facebook: {
                    enabled: true,
                    template: 'https://www.facebook.com/sharer/sharer.php?u=%url%',
                },
                twitter: {
                    enabled: true,
                    template: 'https://twitter.com/intent/tweet?url=%url%&text=%text%',
                },
            },
            share_copy: true,
            share_download: true,
        };

        const { SwiperMock, instances } = createSwiperMockFactory();
        global.Swiper = function(...args) {
            const createdInstance = SwiperMock(...args);
            mainInstance = instances.main || mainInstance;
            thumbsInstance = instances.thumbs || thumbsInstance;
            if (createdInstance.slides.length === 0 && createdInstance.el) {
                createdInstance.slides = Array.from(createdInstance.el.querySelectorAll('.swiper-slide'));
            }
            return createdInstance;
        };

        const module = require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
        testExports = module.__testExports;

        viewer = testExports.getViewer();
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
        mainInstance = instances.main;
        thumbsInstance = instances.thumbs;
    });

    afterEach(() => {
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        window.matchMedia = originalMatchMedia;
        mainInstance = null;
        thumbsInstance = null;
        if (addEventListenerSpy) {
            addEventListenerSpy.mockRestore();
        }
    });

    it('renders focusable thumbnail controls with accessibility metadata', () => {
        const controls = viewer.querySelectorAll('.mga-thumbs-swiper .swiper-slide .mga-thumb-button');
        expect(controls.length).toBe(2);

        const first = controls[0];
        expect(first.tagName).toBe('BUTTON');
        expect(first.getAttribute('type')).toBe('button');
        expect(first.getAttribute('aria-label')).toBe('Afficher la diapositive 1 : Image 1');
    });

    it('relies on native keyboard activation without custom keydown handlers', () => {
        const controls = viewer.querySelectorAll('.mga-thumbs-swiper .swiper-slide .mga-thumb-button');
        const secondControl = controls[1];

        expect(thumbKeydownRegistrations).toHaveLength(0);

        secondControl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(mainInstance).toBeTruthy();
        expect(thumbsInstance).toBeTruthy();
        expect(mainInstance.slideToLoop).toHaveBeenCalledWith(1);
        expect(mainInstance.slideTo).not.toHaveBeenCalled();
        if (thumbsInstance && typeof thumbsInstance.slideTo === 'function') {
            expect(thumbsInstance.slideTo).toHaveBeenCalledWith(1);
        }
    });
});

describe('download button integration', () => {
    const originalMatchMedia = window.matchMedia;
    const originalNavigatorShare = navigator.share;
    let testExports;
    let viewer;
    let downloadButton;
    let shareButton;
    let clickSpy;
    let shareMock;

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
            share_channels: {
                facebook: {
                    enabled: true,
                    template: 'https://www.facebook.com/sharer/sharer.php?u=%url%',
                },
                twitter: {
                    enabled: true,
                    template: 'https://twitter.com/intent/tweet?url=%url%&text=%text%',
                },
            },
            share_copy: true,
            share_download: true,
        };

        const { SwiperMock } = createSwiperMockFactory();
        global.Swiper = function(...args) {
            const createdInstance = SwiperMock(...args);
            if (createdInstance.slides.length === 0 && createdInstance.el) {
                createdInstance.slides = Array.from(createdInstance.el.querySelectorAll('.swiper-slide'));
            }
            return createdInstance;
        };

        const module = require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
        testExports = module.__testExports;

        viewer = testExports.getViewer();
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

        downloadButton = viewer.querySelector('#mga-download');
        shareButton = viewer.querySelector('#mga-share');
        clickSpy = jest.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {});

        shareMock = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            writable: true,
            value: shareMock,
        });
    });

    afterEach(() => {
        if (clickSpy && typeof clickSpy.mockRestore === 'function') {
            clickSpy.mockRestore();
        }
        shareMock = null;
        if (typeof originalNavigatorShare === 'undefined') {
            delete navigator.share;
        } else {
            Object.defineProperty(navigator, 'share', {
                configurable: true,
                writable: true,
                value: originalNavigatorShare,
            });
        }
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        window.matchMedia = originalMatchMedia;
    });

    it('renders download control and triggers download for the active image', () => {
        expect(downloadButton).not.toBeNull();
        expect(testExports.getActiveHighResUrl()).toBe('https://example.com/high-1.jpg');

        const appendSpy = jest.spyOn(document.body, 'appendChild');
        const removeSpy = jest.spyOn(document.body, 'removeChild');
        const initialClickCount = clickSpy.mock.calls.length;

        try {
            downloadButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            const appendedAnchorCall = appendSpy.mock.calls.find(call => call[0] && call[0].tagName === 'A');
            expect(appendedAnchorCall).toBeTruthy();
            const appendedAnchor = appendedAnchorCall[0];
            expect(appendedAnchor.href).toBe('https://example.com/high-1.jpg');
            expect(appendedAnchor.download).toBe('high-1.jpg');

            const newClickInstances = clickSpy.mock.instances.slice(initialClickCount);
            const anchorClickInstance = newClickInstances.find(instance => instance && instance.tagName === 'A');
            expect(anchorClickInstance).toBe(appendedAnchor);

            const removedAnchorCall = removeSpy.mock.calls.find(call => call[0] === appendedAnchor);
            expect(removedAnchorCall).toBeTruthy();
        } finally {
            appendSpy.mockRestore();
            removeSpy.mockRestore();
        }
    });

    it('renders share control and opens the custom share modal with options', () => {
        expect(shareButton).not.toBeNull();
        const shareModal = document.getElementById('mga-share-modal');

        expect(shareModal).not.toBeNull();
        expect(shareModal?.getAttribute('aria-hidden')).toBe('true');

        shareButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(shareMock).not.toHaveBeenCalled();
        expect(shareModal?.classList.contains('is-visible')).toBe(true);
        expect(shareButton.getAttribute('aria-expanded')).toBe('true');

        const shareOptions = shareModal?.querySelectorAll('.mga-share-option') || [];
        expect(shareOptions.length).toBeGreaterThan(0);

        const socialOption = Array.from(shareOptions).find((button) => button.getAttribute('data-share-type') === 'social');
        const copyOption = Array.from(shareOptions).find((button) => button.getAttribute('data-share-type') === 'copy');

        expect(socialOption).toBeTruthy();
        expect(copyOption).toBeTruthy();
    });
});
