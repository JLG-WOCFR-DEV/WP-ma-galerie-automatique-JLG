/**
 * @jest-environment jsdom
 */

describe('safeFocus helper', () => {
    let safeFocus;
    let originalFocus;

    beforeEach(() => {
        jest.resetModules();
        ({ safeFocus } = require('../../ma-galerie-automatique/assets/js/admin-script'));
        originalFocus = HTMLElement.prototype.focus;
    });

    afterEach(() => {
        HTMLElement.prototype.focus = originalFocus;
    });

    it('falls back to calling focus without options when options cause an error', () => {
        const fallbackSpy = jest.fn();

        const mockFocus = jest.fn(function(options) {
            if (arguments.length === 0) {
                fallbackSpy();
                return;
            }

            const descriptor = options ? Object.getOwnPropertyDescriptor(options, 'preventScroll') : null;

            if (descriptor && typeof descriptor.get === 'function') {
                descriptor.get.call(options);
                return;
            }

            throw new TypeError('Focus options are not supported');
        });

        HTMLElement.prototype.focus = mockFocus;

        const element = document.createElement('button');

        expect(() => safeFocus(element, { preventScroll: true })).not.toThrow();

        expect(mockFocus.mock.calls.some((call) => call.length > 0)).toBe(true);
        const lastCallArgs = mockFocus.mock.calls[mockFocus.mock.calls.length - 1] || [];
        expect(lastCallArgs.length).toBe(0);
        expect(fallbackSpy).toHaveBeenCalledTimes(1);
    });
});
