/**
 * @jest-environment jsdom
 */

describe('focus utils safeFocus helper', () => {
    let safeFocus;

    beforeEach(() => {
        jest.resetModules();
        ({ safeFocus } = require('../../ma-galerie-automatique/assets/js/utils/focus-utils'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('falls back to calling focus without options when options cause an error', () => {
        const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function() {
            if (arguments.length > 0) {
                throw new TypeError('Focus options are not supported');
            }
        });

        const element = document.createElement('button');

        expect(() => safeFocus(element, { preventScroll: true })).not.toThrow();

        expect(focusSpy).toHaveBeenCalledTimes(2);
        expect(focusSpy.mock.calls[0].length).toBe(1);
        expect(focusSpy.mock.calls[1].length).toBe(0);
    });
});
