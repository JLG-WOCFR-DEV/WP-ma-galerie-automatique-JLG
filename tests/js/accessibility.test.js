describe('accessibility helpers', () => {
    let helpers;

    beforeEach(() => {
        jest.resetModules();
        helpers = require('../../ma-galerie-automatique/assets/js/src/accessibility.js');
    });

    it('builds autoplay action labels with translation', () => {
        const translate = jest.fn(() => 'translated');
        expect(helpers.getAutoplayActionLabel(translate, true)).toBe('translated');
        expect(translate).toHaveBeenCalledWith('Mettre le diaporama en pause', 'lightbox-jlg');

        translate.mockClear();
        expect(helpers.getAutoplayActionLabel(translate, false)).toBe('translated');
        expect(translate).toHaveBeenCalledWith('Lancer le diaporama', 'lightbox-jlg');
    });

    it('builds autoplay labels without translation function', () => {
        expect(helpers.getAutoplayActionLabel(null, true)).toBe('Mettre le diaporama en pause');
    });

    it('creates thumb aria labels with captions', () => {
        const translate = jest.fn((text) => text);
        const sprintf = jest.fn((pattern, ...values) => {
            if (values.length === 2) {
                return `${values[0]} - ${values[1]}`;
            }
            return `${values[0]}`;
        });

        const result = helpers.createThumbAriaLabel(translate, sprintf, { caption: 'Une image' }, 3);
        expect(translate).toHaveBeenCalledWith('Afficher la diapositive %s : %s', 'lightbox-jlg');
        expect(sprintf).toHaveBeenCalledWith('Afficher la diapositive %s : %s', '3', 'Une image');
        expect(result).toBe('3 - Une image');
    });

    it('creates thumb aria labels without caption', () => {
        const result = helpers.createThumbAriaLabel(null, null, {}, 5);
        expect(result).toBe('Afficher la diapositive 5');
    });
});
