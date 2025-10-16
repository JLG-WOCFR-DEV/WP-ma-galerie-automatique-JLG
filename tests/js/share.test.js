describe('share helpers', () => {
    let helpers;
    const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(global, 'navigator');

    beforeEach(() => {
        jest.resetModules();
        helpers = require('../../ma-galerie-automatique/assets/js/src/share.js');
    });

    afterEach(() => {
        if (originalNavigatorDescriptor) {
            Object.defineProperty(global, 'navigator', originalNavigatorDescriptor);
        } else {
            delete global.navigator;
        }
    });

    it('builds human friendly labels from keys', () => {
        expect(helpers.buildLabelFromKey('custom-share_option')).toBe('Custom Share Option');
        expect(helpers.buildLabelFromKey('')).toBe('');
    });

    it('normalizes share channels from arrays and objects', () => {
        const normalizedArray = helpers.normalizeShareChannels([
            { key: 'facebook', template: 'https://fb.com?u=%url%', enabled: true },
            { slug: 'twitter', label: 'Twitter', template: 'https://twitter.com?u=%url%', icon: 'bird', enabled: '1' },
            { key: 'facebook', template: 'https://duplicate.test', enabled: 'on' },
        ]);

        expect(normalizedArray).toEqual([
            expect.objectContaining({ key: 'facebook', enabled: true }),
            expect.objectContaining({ key: 'twitter', label: 'Twitter', icon: 'bird' }),
        ]);

        const normalizedObject = helpers.normalizeShareChannels({
            mastodon: { template: 'https://example.social/share?text=%text%', enabled: 'true' },
            copy: { label: 'Copie', template: 'https://example.test', enabled: false },
        });

        expect(normalizedObject).toEqual([
            expect.objectContaining({ key: 'mastodon', enabled: true }),
            expect.objectContaining({ key: 'copy', enabled: false }),
        ]);
    });

    it('builds encoded share urls from templates', () => {
        const url = helpers.buildShareUrl('https://example.com?u=%url%&text=%text%&title=%title%', {
            url: 'https://example.com/photo.jpg?size=large',
            text: 'Bonjour le monde',
        });

        expect(url).toBe('https://example.com?u=https%3A%2F%2Fexample.com%2Fphoto.jpg%3Fsize%3Dlarge&text=Bonjour%20le%20monde&title=Bonjour%20le%20monde');
    });

    it('detects native share support', () => {
        Object.defineProperty(global, 'navigator', { value: {}, configurable: true, writable: true });
        expect(helpers.hasNativeShareSupport()).toBe(false);

        const shareFn = jest.fn();
        Object.defineProperty(global, 'navigator', { value: { share: shareFn }, configurable: true, writable: true });
        expect(helpers.hasNativeShareSupport()).toBe(true);
    });
});
