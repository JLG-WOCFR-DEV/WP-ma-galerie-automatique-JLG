describe('navigation helpers', () => {
    let helpers;

    beforeEach(() => {
        jest.resetModules();
        helpers = require('../../ma-galerie-automatique/assets/js/src/navigation.js');
    });

    it('sanitizes effect names', () => {
        expect(helpers.sanitizeEffect('Fade')).toBe('fade');
        expect(helpers.sanitizeEffect('unknown')).toBe(helpers.DEFAULT_EFFECT);
    });

    it('sanitizes transition speeds', () => {
        expect(helpers.sanitizeSpeed('200')).toBe(200);
        expect(helpers.sanitizeSpeed('fast')).toBe(helpers.DEFAULT_SPEED);
        expect(helpers.sanitizeSpeed('50')).toBe(100);
        expect(helpers.sanitizeSpeed('9000')).toBe(5000);
    });

    it('sanitizes easing functions', () => {
        expect(helpers.sanitizeEasing(' ease-in-out ')).toBe('ease-in-out');
        expect(helpers.sanitizeEasing(null)).toBe(helpers.DEFAULT_EASING);
    });

    it('sanitizes thumbs layout values', () => {
        expect(helpers.sanitizeThumbsLayout('LEFT')).toBe('left');
        expect(helpers.sanitizeThumbsLayout('unknown')).toBe(helpers.DEFAULT_THUMBS_LAYOUT);
    });

    it('detects heavy effects', () => {
        expect(helpers.isHeavyEffect('cube')).toBe(true);
        expect(helpers.isHeavyEffect('slide')).toBe(false);
    });
});
