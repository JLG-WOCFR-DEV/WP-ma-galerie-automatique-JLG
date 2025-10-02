/**
 * @jest-environment jsdom
 */

describe('gallery shared helpers', () => {
    const bootstrapHelpers = (settings = {}) => {
        jest.resetModules();

        document.body.innerHTML = '';

        const contentArea = document.createElement('div');
        contentArea.className = 'entry-content';
        document.body.appendChild(contentArea);

        Object.defineProperty(document, 'readyState', {
            configurable: true,
            value: 'complete',
        });

        window.mga_settings = settings;
        window.mgaDebug = {
            enabled: false,
            init: jest.fn(),
            log: jest.fn(),
            updateInfo: jest.fn(),
            onForceOpen: jest.fn(),
            stopTimer: jest.fn(),
            restartTimer: jest.fn(),
            table: jest.fn(),
        };

        window.Swiper = jest.fn().mockReturnValue({
            destroy: jest.fn(),
            update: jest.fn(),
            autoplay: { start: jest.fn(), stop: jest.fn() },
        });

        const module = require('../../../src/frontend/viewer.ts');

        const init = module.initGalleryViewer || module.default;
        if (typeof init === 'function') {
            init();
        }

        delete document.readyState;

        return module.helpers;
    };

    afterEach(() => {
        jest.resetModules();
        delete window.mga_settings;
        delete window.mgaDebug;
        delete window.Swiper;
        delete window.mgaGalleryHelpers;
        document.body.innerHTML = '';
    });

    describe('resolveLinkGroupId', () => {
        it('prefers configured attributes and trims values', () => {
            const helpers = bootstrapHelpers({ groupAttribute: 'data-test-group' });

            const customLink = document.createElement('a');
            customLink.setAttribute('data-test-group', ' group-1 ');
            expect(helpers.resolveLinkGroupId(customLink)).toBe('data-test-group:group-1');

            const fallbackLink = document.createElement('a');
            fallbackLink.setAttribute('data-mga-gallery', ' gallery-two ');
            expect(helpers.resolveLinkGroupId(fallbackLink)).toBe('data-mga-gallery:gallery-two');

            const relLink = document.createElement('a');
            relLink.setAttribute('rel', ' gallery-three ');
            expect(helpers.resolveLinkGroupId(relLink)).toBe('rel:gallery-three');

            expect(helpers.resolveLinkGroupId(null)).toBe('__mga-default-group__');
        });

        it('falls back to href values when configured', () => {
            const helpers = bootstrapHelpers({ groupAttribute: 'href' });

            const hrefLink = document.createElement('a');
            hrefLink.setAttribute('href', 'https://example.com/full.jpg');

            expect(helpers.resolveLinkGroupId(hrefLink)).toBe('href:https://example.com/full.jpg');
        });
    });

    describe('isExplicitFallbackAllowed', () => {
        it('detects attachments and explicit flags', () => {
            const helpers = bootstrapHelpers();

            const datasetLink = document.createElement('a');
            datasetLink.dataset.type = 'attachment';
            expect(helpers.isExplicitFallbackAllowed(datasetLink)).toBe(true);

            const hrefLink = document.createElement('a');
            hrefLink.setAttribute('href', 'https://example.com/?attachment_id=42');
            expect(helpers.isExplicitFallbackAllowed(hrefLink)).toBe(true);

            const attributeLink = document.createElement('a');
            attributeLink.setAttribute('data-mga-allow-fallback', '0');
            expect(helpers.isExplicitFallbackAllowed(attributeLink)).toBe(true);

            const neutralLink = document.createElement('a');
            expect(helpers.isExplicitFallbackAllowed(neutralLink)).toBe(false);
        });
    });

    describe('URL sanitisation', () => {
        it('normalises protocol-relative and trims unsafe values', () => {
            const helpers = bootstrapHelpers();

            expect(helpers.sanitizeHighResUrl('  https://example.com/image.jpg  '))
                .toBe('https://example.com/image.jpg');

            const expectedProtocol = window.location.protocol || 'https:';
            expect(helpers.sanitizeHighResUrl('//cdn.example.com/image.jpg'))
                .toBe(`${expectedProtocol}//cdn.example.com/image.jpg`);

            expect(helpers.sanitizeHighResUrl('ftp://example.com/image.jpg')).toBe('');
            expect(helpers.sanitizeHighResUrl('javascript:alert(1)')).toBe('');

            expect(helpers.sanitizeThumbnailUrl(' https://example.com/thumb.jpg '))
                .toBe('https://example.com/thumb.jpg');
            expect(helpers.sanitizeThumbnailUrl('data:image/png;base64,AAAA')).toBe('');
            expect(helpers.sanitizeThumbnailUrl('javascript:alert(1)')).toBe('');
        });
    });

    describe('thumbnail resolution', () => {
        it('prefers lightweight data attributes over large sources', () => {
            const helpers = bootstrapHelpers();

            const img = document.createElement('img');

            Object.defineProperty(img, 'currentSrc', {
                configurable: true,
                get: () => 'javascript:alert(1)',
            });

            Object.defineProperty(img, 'src', {
                configurable: true,
                get: () => 'blob:unsafe',
                set: () => {},
            });

            img.setAttribute('data-full-url', 'https://example.com/large.jpg');
            img.setAttribute('data-src', ' https://example.com/small.jpg ');
            img.dataset.lazySrc = 'https://example.com/lazy-small.jpg';

            expect(helpers.getImageDataAttributes(img, { excludeLarge: true }))
                .toBe('https://example.com/small.jpg');
            expect(helpers.resolveThumbnailUrl(img)).toBe('https://example.com/small.jpg');
        });

        it('falls back to first available attribute when only large sources exist', () => {
            const helpers = bootstrapHelpers();

            const img = document.createElement('img');

            Object.defineProperty(img, 'currentSrc', {
                configurable: true,
                get: () => 'javascript:alert(1)',
            });

            Object.defineProperty(img, 'src', {
                configurable: true,
                get: () => 'about:blank',
                set: () => {},
            });

            img.setAttribute('data-full-url', 'https://example.com/large-only.jpg');

            expect(helpers.getImageDataAttributes(img, { excludeLarge: true }))
                .toBe('https://example.com/large-only.jpg');
            expect(helpers.resolveThumbnailUrl(img)).toBe('https://example.com/large-only.jpg');
        });
    });
});

