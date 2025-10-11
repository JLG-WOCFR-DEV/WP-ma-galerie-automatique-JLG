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
            include_svg: true,
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

describe('trigger scenario filtering', () => {
    let helpers;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '<main></main>';

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        global.Swiper = function() {};
    });

    afterEach(() => {
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        document.body.innerHTML = '';
    });

    const createLinkWithImage = (href, imgConfig = {}) => {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        const img = document.createElement('img');

        Object.entries(imgConfig).forEach(([key, value]) => {
            if (key === 'dataset') {
                Object.entries(value).forEach(([datasetKey, datasetValue]) => {
                    img.dataset[datasetKey] = datasetValue;
                });
                return;
            }

            img.setAttribute(key, value);
        });

        link.appendChild(img);
        return { link, img };
    };

    it('accepts direct file links matching image sources', () => {
        window.mga_settings = { trigger_scenario: 'self-linked-media', include_svg: true };
        ({ helpers } = require('../../ma-galerie-automatique/assets/js/gallery-slideshow'));

        const imageUrl = 'https://example.com/uploads/photo.jpg';
        const { link } = createLinkWithImage(imageUrl, {
            src: 'https://example.com/uploads/photo-300x200.jpg',
            dataset: { fullUrl: imageUrl },
        });

        expect(helpers.linkMatchesTriggerScenario(link)).toBe(true);
    });

    it('rejects attachment page links when self-linked scenario is active', () => {
        window.mga_settings = { trigger_scenario: 'self-linked-media', include_svg: true };
        ({ helpers } = require('../../ma-galerie-automatique/assets/js/gallery-slideshow'));

        const { link } = createLinkWithImage('https://example.com/?attachment_id=42', {
            src: 'https://example.com/uploads/photo-300x200.jpg',
            dataset: { fullUrl: 'https://example.com/uploads/photo.jpg' },
        });

        expect(helpers.linkMatchesTriggerScenario(link)).toBe(false);
    });

    it('falls back to permissive behaviour for the default trigger scenario', () => {
        window.mga_settings = { trigger_scenario: 'linked-media', include_svg: true };
        ({ helpers } = require('../../ma-galerie-automatique/assets/js/gallery-slideshow'));

        const { link } = createLinkWithImage('https://example.com/elsewhere.jpg', {
            src: 'https://example.com/uploads/photo-300x200.jpg',
        });

        expect(helpers.linkMatchesTriggerScenario(link)).toBe(true);
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

describe('start_on_clicked_image behaviour', () => {
    const originalMatchMedia = window.matchMedia;
    let instances;

    function bootstrap(overrides = {}, options = {}) {
        jest.resetModules();

        const defaultMarkup = `
            <main>
                <a href="https://example.com/high-1.jpg" data-mga-gallery="set">
                    <img src="https://example.com/thumb-1.jpg" alt="Première" />
                </a>
                <a href="https://example.com/high-2.jpg" data-mga-gallery="set">
                    <img src="https://example.com/thumb-2.jpg" alt="Deuxième" />
                </a>
            </main>
        `;

        const markup = typeof options.markup === 'string' ? options.markup : defaultMarkup;

        document.body.innerHTML = markup;

        Object.defineProperty(document, 'readyState', {
            value: 'complete',
            configurable: true,
        });

        const matchMediaMatches = Boolean(options.prefersReducedMotion);

        window.matchMedia = jest.fn().mockReturnValue({
            matches: matchMediaMatches,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
        });

        const factory = createSwiperMockFactory();
        instances = factory.instances;
        global.Swiper = function(...args) {
            const created = factory.SwiperMock(...args);
            if (created.slides.length === 0 && created.el) {
                created.slides = Array.from(created.el.querySelectorAll('.swiper-slide'));
            }
            return created;
        };

        window.mga_settings = Object.assign({
            allowBodyFallback: true,
            include_svg: true,
            loop: false,
            background_style: 'echo',
            autoplay_start: false,
            delay: 4,
            thumbs_layout: 'bottom',
            groupAttribute: 'data-mga-gallery',
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
        }, overrides);

        const module = require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
        return module.__testExports;
    }

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

    it('ouvre la visionneuse sur l’image cliquée lorsque l’option est active', () => {
        bootstrap({ start_on_clicked_image: true });
        const links = document.querySelectorAll('a');
        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(instances.main).toBeTruthy();
        expect(instances.main.params.initialSlide).toBe(1);
    });

    it('honore la variante camelCase de la configuration', () => {
        bootstrap({ startOnClickedImage: true });
        const links = document.querySelectorAll('a');
        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(instances.main).toBeTruthy();
        expect(instances.main.params.initialSlide).toBe(1);
    });

    it('revient au début lorsque l’option est désactivée', () => {
        bootstrap({ start_on_clicked_image: false });
        const links = document.querySelectorAll('a');
        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(instances.main).toBeTruthy();
        expect(instances.main.params.initialSlide).toBe(0);
    });

    it('respecte l’image cliquée lorsque le mode CSS est nécessaire', () => {
        const originalRaf = window.requestAnimationFrame;

        try {
            window.requestAnimationFrame = jest.fn((cb) => {
                if (typeof cb === 'function') {
                    cb();
                }
                return 1;
            });

            bootstrap({ start_on_clicked_image: true }, { prefersReducedMotion: true });
            const links = document.querySelectorAll('a');
            links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

            expect(instances.main).toBeTruthy();
            expect(instances.main.params.cssMode).toBe(true);
            expect(instances.main.slideToLoop).not.toHaveBeenCalled();
            expect(instances.main.slideTo).toHaveBeenCalledWith(1, 0);
        } finally {
            if (typeof originalRaf === 'function') {
                window.requestAnimationFrame = originalRaf;
            } else {
                delete window.requestAnimationFrame;
            }
        }
    });

    it('ouvre la visionneuse même si les images n’ont pas de miniature explicite', () => {
        const markupSansMiniatures = `
            <main>
                <a href="https://example.com/high-1.jpg">
                    <img alt="Première" />
                </a>
                <a href="https://example.com/high-2.jpg">
                    <img alt="Deuxième" />
                </a>
            </main>
        `;

        bootstrap({ start_on_clicked_image: true }, { markup: markupSansMiniatures });

        const links = document.querySelectorAll('a');
        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(instances.main).toBeTruthy();
        expect(instances.main.params.initialSlide).toBe(1);
    });

    it('garde les interactions standards lorsque la boucle est active malgré la réduction des animations', () => {
        bootstrap({ start_on_clicked_image: true, loop: true }, { prefersReducedMotion: true });
        const links = document.querySelectorAll('a');
        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(instances.main).toBeTruthy();
        expect(instances.main.params.cssMode).toBe(false);
        expect(instances.main.slideToLoop).toHaveBeenCalledWith(1, 0);
    });
});

describe('include_svg flag behaviour', () => {
    const originalMatchMedia = window.matchMedia;
    let instances;

    function bootstrap(overrides = {}) {
        jest.resetModules();

        document.body.innerHTML = `
            <main>
                <a href="https://example.com/vector.svg" data-mga-gallery="set">
                    <img src="https://example.com/vector-thumb.svg" alt="SVG" />
                </a>
                <a href="https://example.com/photo.jpg" data-mga-gallery="set">
                    <img src="https://example.com/photo-thumb.jpg" alt="Photo" />
                </a>
            </main>
        `;

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

        const factory = createSwiperMockFactory();
        instances = factory.instances;
        global.Swiper = function(...args) {
            const created = factory.SwiperMock(...args);
            if (created.slides.length === 0 && created.el) {
                created.slides = Array.from(created.el.querySelectorAll('.swiper-slide'));
            }
            return created;
        };

        window.mga_settings = Object.assign({
            allowBodyFallback: true,
            include_svg: true,
            loop: false,
            background_style: 'echo',
            autoplay_start: false,
            delay: 4,
            groupAttribute: 'data-mga-gallery',
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
        }, overrides);

        require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
    }

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

    it('ignores SVG triggers when include_svg is disabled', () => {
        bootstrap({ include_svg: false });

        const links = document.querySelectorAll('a');
        links[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(instances.main).toBeFalsy();

        links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(instances.main).toBeTruthy();
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
            include_svg: true,
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
        expect(playPauseButton.getAttribute('title')).toBe('Lancer le diaporama');

        autoplayHandlers.autoplayStart();
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('true');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Mettre le diaporama en pause');
        expect(playPauseButton.getAttribute('title')).toBe('Mettre le diaporama en pause');

        autoplayHandlers.autoplayStop();
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('false');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Lancer le diaporama');
        expect(playPauseButton.getAttribute('title')).toBe('Lancer le diaporama');

        playPauseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('true');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Mettre le diaporama en pause');
        expect(playPauseButton.getAttribute('title')).toBe('Mettre le diaporama en pause');

        playPauseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(playPauseButton.getAttribute('aria-pressed')).toBe('false');
        expect(playPauseButton.getAttribute('aria-label')).toBe('Lancer le diaporama');
        expect(playPauseButton.getAttribute('title')).toBe('Lancer le diaporama');
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
            include_svg: true,
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

    it('wires roving tabindex keyboard navigation for thumbnails', () => {
        const controls = viewer.querySelectorAll('.mga-thumbs-swiper .swiper-slide .mga-thumb-button');
        expect(thumbKeydownRegistrations).toHaveLength(controls.length);

        const [firstControl, secondControl] = controls;

        expect(firstControl.getAttribute('aria-current')).toBe('true');
        expect(firstControl.getAttribute('tabindex')).toBe('0');
        expect(secondControl.getAttribute('tabindex')).toBe('-1');

        const firstListenerEntry = thumbKeydownRegistrations.find((entry) => entry.target === firstControl);
        const secondListenerEntry = thumbKeydownRegistrations.find((entry) => entry.target === secondControl);

        expect(firstListenerEntry).toBeTruthy();
        expect(secondListenerEntry).toBeTruthy();

        mainInstance.slideToLoop.mockClear();
        mainInstance.slideTo.mockClear();
        if (thumbsInstance && typeof thumbsInstance.slideTo === 'function') {
            thumbsInstance.slideTo.mockClear();
        }

        const arrowRightEvent = { key: 'ArrowRight', preventDefault: jest.fn() };
        firstListenerEntry.listener.call(firstControl, arrowRightEvent);
        expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

        expect(mainInstance.slideToLoop).not.toHaveBeenCalled();
        expect(mainInstance.slideTo).toHaveBeenCalledWith(1);
        if (thumbsInstance && typeof thumbsInstance.slideTo === 'function') {
            expect(thumbsInstance.slideTo).toHaveBeenCalledWith(1);
        }
        expect(secondControl.getAttribute('aria-current')).toBe('true');
        expect(secondControl.getAttribute('tabindex')).toBe('0');
        expect(firstControl.getAttribute('tabindex')).toBe('-1');

        mainInstance.slideToLoop.mockClear();
        mainInstance.slideTo.mockClear();
        if (thumbsInstance && typeof thumbsInstance.slideTo === 'function') {
            thumbsInstance.slideTo.mockClear();
        }

        const arrowLeftEvent = { key: 'ArrowLeft', preventDefault: jest.fn() };
        secondListenerEntry.listener.call(secondControl, arrowLeftEvent);
        expect(arrowLeftEvent.preventDefault).toHaveBeenCalled();

        expect(mainInstance.slideToLoop).not.toHaveBeenCalled();
        expect(mainInstance.slideTo).toHaveBeenCalledWith(0);
        if (thumbsInstance && typeof thumbsInstance.slideTo === 'function') {
            expect(thumbsInstance.slideTo).toHaveBeenCalledWith(0);
        }
        expect(firstControl.getAttribute('aria-current')).toBe('true');
        expect(firstControl.getAttribute('tabindex')).toBe('0');
        expect(secondControl.getAttribute('tabindex')).toBe('-1');
    });
});

describe('thumbnail layout selection', () => {
    const originalMatchMedia = window.matchMedia;
    let baseSettings;
    let instances;

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

        const factory = createSwiperMockFactory();
        instances = factory.instances;
        global.Swiper = function(...args) {
            const created = factory.SwiperMock(...args);
            if (created.slides.length === 0 && created.el) {
                created.slides = Array.from(created.el.querySelectorAll('.swiper-slide'));
            }
            return created;
        };

        baseSettings = {
            allowBodyFallback: true,
            include_svg: true,
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
    });

    afterEach(() => {
        delete window.mga_settings;
        delete global.Swiper;
        delete document.readyState;
        window.matchMedia = originalMatchMedia;
    });

    function openViewerWithLayout(layout) {
        window.mga_settings = {
            ...baseSettings,
            thumbs_layout: layout,
        };

        const module = require('../../ma-galerie-automatique/assets/js/gallery-slideshow');
        const { __testExports: testExports } = module;
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

        return viewer;
    }

    it('applies a sidebar layout when configured', () => {
        const viewer = openViewerWithLayout('left');

        expect(viewer.classList.contains('mga-thumbs-left')).toBe(true);

        const thumbsContainer = viewer.querySelector('.mga-thumbs-swiper');
        expect(thumbsContainer).not.toBeNull();
        expect(instances.thumbs).toBeTruthy();
        expect(instances.thumbs.params.direction).toBe('vertical');
        expect(instances.thumbs.params.breakpoints).toEqual(
            expect.objectContaining({
                0: expect.objectContaining({ direction: 'horizontal' }),
                769: expect.objectContaining({ direction: 'vertical' }),
            }),
        );
    });

    it('hides the thumbnail swiper when requested', () => {
        const viewer = openViewerWithLayout('hidden');

        expect(viewer.classList.contains('mga-thumbs-hidden')).toBe(true);
        expect(viewer.querySelector('.mga-thumbs-swiper')).toBeNull();
        expect(instances.thumbs).toBeNull();
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
            include_svg: true,
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

    it('removes the share control when no share actions remain available', () => {
        expect(shareButton).not.toBeNull();

        Object.defineProperty(navigator, 'share', {
            configurable: true,
            writable: true,
            value: undefined,
        });

        window.dispatchEvent(new CustomEvent('mga:share-preferences-change', {
            detail: {
                share_channels: {},
                share_copy: false,
                share_download: false,
            },
        }));

        const updatedShareButton = viewer.querySelector('#mga-share');
        expect(updatedShareButton).toBeNull();
    });

    it('restores the share control when valid custom share templates are provided', () => {
        expect(shareButton).not.toBeNull();

        Object.defineProperty(navigator, 'share', {
            configurable: true,
            writable: true,
            value: undefined,
        });

        window.dispatchEvent(new CustomEvent('mga:share-preferences-change', {
            detail: {
                share_channels: {},
                share_copy: false,
                share_download: false,
            },
        }));

        let refreshedShareButton = viewer.querySelector('#mga-share');
        expect(refreshedShareButton).toBeNull();

        window.dispatchEvent(new CustomEvent('mga:share-preferences-change', {
            detail: {
                share_channels: {
                    reseau_perso: {
                        enabled: true,
                        template: 'https://reseau.example/share?u=%url%',
                        label: 'Réseau Perso',
                        icon: 'link',
                    },
                },
                share_copy: false,
                share_download: false,
            },
        }));

        refreshedShareButton = viewer.querySelector('#mga-share');
        expect(refreshedShareButton).not.toBeNull();

        refreshedShareButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        const shareModal = document.getElementById('mga-share-modal');
        expect(shareModal).not.toBeNull();
        expect(shareModal?.classList.contains('is-visible')).toBe(true);

        const shareOptions = shareModal?.querySelectorAll('.mga-share-option') || [];
        expect(shareOptions.length).toBeGreaterThan(0);

        const customOption = Array.from(shareOptions).find((option) => option.getAttribute('data-share-key') === 'reseau_perso');
        expect(customOption).toBeTruthy();
    });
});
