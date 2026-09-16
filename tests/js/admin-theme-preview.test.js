/**
 * @jest-environment jsdom
 */

describe('admin dark theme confined to live preview', () => {
    const bootAdmin = () => {
        require('../../ma-galerie-automatique/assets/js/src/admin.js');

        try {
            document.dispatchEvent(new Event('DOMContentLoaded'));
        } catch (error) {
            // Live preview / Swiper can throw in jsdom; theme is applied first.
        }
    };

    beforeEach(() => {
        jest.resetModules();

        window.matchMedia = jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
        }));

        window.localStorage.clear();

        document.body.innerHTML = `
            <div class="wrap mga-admin-wrap">
                <h1>Lightbox - JLG</h1>
                <div class="notice notice-success"><p>Réglages enregistrés.</p></div>
                <form data-mga-settings-form>
                    <select data-mga-theme-select>
                        <option value="light" selected>Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="system">Système</option>
                    </select>
                    <div class="mga-live-preview" data-mga-live-preview>
                        <div data-mga-live-preview-mock></div>
                    </div>
                    <p class="submit">
                        <button type="submit" class="button button-primary" data-mga-step-submit>Enregistrer</button>
                    </p>
                </form>
            </div>
        `;
    });

    it('keeps the dark theme on the preview and off the wp-admin wrap', () => {
        bootAdmin();

        const wrap = document.querySelector('.mga-admin-wrap');
        const preview = document.querySelector('[data-mga-live-preview]');
        const select = document.querySelector('[data-mga-theme-select]');
        const notice = document.querySelector('.notice');

        select.value = 'dark';
        select.dispatchEvent(new Event('change', { bubbles: true }));

        expect(wrap.getAttribute('data-mga-theme')).not.toBe('dark');
        expect(wrap.classList.contains('is-theme-dark')).toBe(false);
        expect(preview.getAttribute('data-mga-theme')).toBe('dark');
        expect(preview.classList.contains('is-theme-dark')).toBe(true);
        expect(notice.closest('[data-mga-theme="dark"]')).toBeNull();
    });

    it('does not stamp a theme on the wrap when the preference is light', () => {
        bootAdmin();

        const wrap = document.querySelector('.mga-admin-wrap');
        const preview = document.querySelector('[data-mga-live-preview]');

        expect(wrap.hasAttribute('data-mga-theme')).toBe(false);
        expect(preview.getAttribute('data-mga-theme')).toBe('light');
    });
});
