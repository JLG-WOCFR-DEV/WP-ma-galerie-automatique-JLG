/**
 * @jest-environment jsdom
 */

describe('mgaDebug panel accessibility enhancements', () => {
    let consoleInfoMock;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
        document.body.innerHTML = '';

        consoleInfoMock = jest.spyOn(console, 'info').mockImplementation(() => {});

        require('../../ma-galerie-automatique/assets/js/src/debug');

        if (window.mgaDebug && typeof window.mgaDebug.init === 'function') {
            window.mgaDebug.init();
        }
    });

    afterEach(() => {
        if (window.mgaDebug && typeof window.mgaDebug.destroy === 'function') {
            window.mgaDebug.destroy('test-cleanup');
        }

        jest.runOnlyPendingTimers();
        jest.clearAllTimers();
        jest.useRealTimers();

        delete window.mgaDebug;
        document.body.innerHTML = '';

        if (consoleInfoMock) {
            consoleInfoMock.mockRestore();
            consoleInfoMock = undefined;
        }
    });

    it('applies structural classes and aria attributes to the debug panel', () => {
        const panel = document.getElementById('mga-debug-panel');
        expect(panel).not.toBeNull();
        expect(panel.classList.contains('mga-debug-panel')).toBe(true);
        expect(panel.getAttribute('role')).toBe('region');
        expect(panel.getAttribute('aria-expanded')).toBe('true');
        expect(panel.getAttribute('aria-live')).toBe('polite');

        const status = panel.querySelector('#mga-debug-status');
        expect(status).not.toBeNull();
        expect(status.classList.contains('mga-debug-status')).toBe(true);
        expect(status.classList.contains('mga-debug-value')).toBe(true);
        expect(status.getAttribute('role')).toBe('status');
        expect(status.getAttribute('aria-live')).toBe('polite');

        const log = panel.querySelector('#mga-debug-log');
        expect(log).not.toBeNull();
        expect(log.classList.contains('mga-debug-log')).toBe(true);
        expect(log.getAttribute('role')).toBe('log');
        expect(log.getAttribute('aria-live')).toBe('polite');

        const announcer = document.getElementById('mga-debug-announcer');
        expect(announcer).not.toBeNull();
        expect(announcer.classList.contains('mga-debug-announcer')).toBe(true);
        expect(announcer.getAttribute('role')).toBe('status');
    });

    it('updates tone classes when updateInfo is invoked', () => {
        const status = document.getElementById('mga-debug-status');
        expect(status).not.toBeNull();

        window.mgaDebug.updateInfo('mga-debug-status', 'OK', 'success');
        expect(status.classList.contains('mga-debug-value--success')).toBe(true);
        expect(status.classList.contains('mga-debug-value--error')).toBe(false);

        window.mgaDebug.updateInfo('mga-debug-status', 'Erreur', 'error');
        expect(status.classList.contains('mga-debug-value--error')).toBe(true);
        expect(status.classList.contains('mga-debug-value--success')).toBe(false);
    });

    it('announces visibility changes when the panel is destroyed', () => {
        const announcer = document.getElementById('mga-debug-announcer');
        expect(announcer).not.toBeNull();

        window.mgaDebug.destroy('test-close');

        expect(announcer.textContent).toBe('Panneau de debug MGA masqué');
    });
});
