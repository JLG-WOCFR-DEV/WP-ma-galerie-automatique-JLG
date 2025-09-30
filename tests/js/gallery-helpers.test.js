const {
    resolveLinkGroupId,
    isExplicitFallbackAllowed,
    sanitizeHighResUrl,
    getHighResUrl,
    getImageDataAttributes,
} = require('../../ma-galerie-automatique/assets/js/utils/gallery-helpers');

describe('gallery helpers', () => {
    describe('resolveLinkGroupId', () => {
        test('groups by configured attribute when provided', () => {
            const link = document.createElement('a');
            link.setAttribute('data-custom-group', ' featured ');

            const groupId = resolveLinkGroupId(link, {
                fallbackGroupId: '__fallback__',
                configuredGroupAttribute: 'data-custom-group',
            });

            expect(groupId).toBe('data-custom-group:featured');
        });

        test('falls back to rel attribute when custom attribute missing', () => {
            const link = document.createElement('a');
            link.setAttribute('rel', ' gallery-one mga-lightbox ');

            const groupId = resolveLinkGroupId(link, {
                fallbackGroupId: '__fallback__',
                configuredGroupAttribute: '',
            });

            expect(groupId).toBe('rel:gallery-one mga-lightbox');
        });

        test('uses href fallback when configured attribute is enabled', () => {
            const link = document.createElement('a');
            link.setAttribute('href', ' https://example.com/image.jpg ');

            const groupId = resolveLinkGroupId(link, {
                fallbackGroupId: '__fallback__',
                configuredGroupAttribute: 'data-custom-group',
            });

            expect(groupId).toBe('href:https://example.com/image.jpg');
        });
    });

    describe('isExplicitFallbackAllowed', () => {
        test('detects attachment via dataset type', () => {
            const link = document.createElement('a');
            link.dataset.type = 'attachment';

            expect(isExplicitFallbackAllowed(link)).toBe(true);
        });

        test('detects attachment via URL parameter', () => {
            const link = document.createElement('a');
            link.setAttribute('href', '/media/?attachment_id=42');

            expect(isExplicitFallbackAllowed(link)).toBe(true);
        });
    });

    describe('sanitizeHighResUrl', () => {
        test('rejects unsafe schemes', () => {
            expect(sanitizeHighResUrl('javascript:alert(1)')).toBe('');
            expect(sanitizeHighResUrl('data:text/plain;base64,abcd')).toBe('');
            expect(sanitizeHighResUrl('ftp://example.com/file.jpg')).toBe('');
        });

        test('normalises protocol-relative URLs', () => {
            const result = sanitizeHighResUrl('//example.com/image.jpg');
            expect(result.startsWith('http')).toBe(true);
            expect(result.endsWith('image.jpg')).toBe(true);
        });
    });

    describe('getHighResUrl', () => {
        test('prefers explicit high resolution dataset when fallback allowed', () => {
            const link = document.createElement('a');
            link.setAttribute('href', 'https://example.com/thumb.jpg');
            link.dataset.mgaHighres = 'https://cdn.example.com/highres.jpg';
            const img = document.createElement('img');
            img.src = 'https://example.com/thumb.jpg';
            link.appendChild(img);

            expect(getHighResUrl(link)).toBe('https://cdn.example.com/highres.jpg');
        });

        test('falls back to currentSrc when only thumbnail sources available', () => {
            const link = document.createElement('a');
            link.setAttribute('href', '/not-an-image');
            link.dataset.mgaAllowFallback = '1';
            const img = document.createElement('img');
            Object.defineProperty(img, 'currentSrc', {
                value: 'https://example.com/thumb.webp',
                configurable: true,
            });
            img.src = 'https://example.com/backup.jpg';
            link.appendChild(img);

            expect(getHighResUrl(link)).toBe('https://example.com/thumb.webp');
        });
    });

    describe('getImageDataAttributes', () => {
        test('prefers lightweight entries when excludeLarge is true', () => {
            const img = document.createElement('img');
            img.setAttribute('data-full-url', 'https://example.com/full.jpg');
            img.setAttribute('data-src', 'https://example.com/thumb.jpg');
            img.setAttribute('data-lazy-src', 'https://example.com/lazy-thumb.jpg');

            const result = getImageDataAttributes(img, { excludeLarge: true });

            expect(result).toBe('https://example.com/thumb.jpg');
        });
    });
});
