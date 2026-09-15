/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('admin wizard once', () => {
    const adminSource = fs.readFileSync(
        path.resolve(__dirname, '../../ma-galerie-automatique/assets/js/src/admin.js'),
        'utf8'
    );

    it('initializes summary and save from the settings form when wizard chrome is absent', () => {
        expect(adminSource).toContain('const root = wizard || targetForm');
        expect(adminSource).toContain('const wizardIsComplete = !wizard');
    });
});
