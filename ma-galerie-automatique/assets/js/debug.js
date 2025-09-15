(function(global) {
    "use strict";

    const state = {
        panel: null,
        logContainer: null,
        timerInterval: null,
        startTime: 0,
        active: false,
        forceOpenAttached: false,
    };

    function createPanel() {
        if (state.panel) {
            return state.panel;
        }

        const existing = document.getElementById('mga-debug-panel');
        if (existing) {
            state.panel = existing;
            state.logContainer = existing.querySelector('#mga-debug-log');
            return state.panel;
        }

        const panel = document.createElement('div');
        panel.id = 'mga-debug-panel';
        panel.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #23282d; color: #fff; border: 2px solid #0073aa; padding: 15px; font-family: monospace; font-size: 12px; z-index: 999999; max-width: 450px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);';
        panel.innerHTML = `
            <h4 style="margin: 0 0 10px; padding: 0 0 10px; border-bottom: 1px solid #444; font-size: 14px;">Debug MGA Performance</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div><strong>Chronomètre réel:</strong><div id="mga-debug-realtime" style="font-size: 16px; color: #4CAF50;">0.00s</div></div>
                <div><strong>Timer Autoplay:</strong><div id="mga-debug-autoplay-time" style="font-size: 16px; color: #FFC107;">N/A</div></div>
            </div>
            <button id="mga-force-open" style="background: #0073aa; color: white; border: none; padding: 8px 12px; cursor: pointer; margin-top: 10px; width: 100%;">Forcer l'ouverture (Test)</button>
            <div id="mga-log-container" style="margin-top: 15px; max-height: 200px; overflow-y: auto; background: #111; padding: 5px;">
                 <h5 style="margin:0 0 5px; padding:0; color: #ccc;">Journal d'événements :</h5>
                 <div id="mga-debug-log"></div>
            </div>
        `;
        document.body.appendChild(panel);
        state.panel = panel;
        state.logContainer = panel.querySelector('#mga-debug-log');
        state.forceOpenAttached = false;
        return panel;
    }

    function ensureActive() {
        if (!state.active) {
            return false;
        }
        if (!state.panel) {
            createPanel();
        }
        return !!state.panel;
    }

    function startTimer() {
        if (!ensureActive()) {
            return;
        }
        stopTimer();
        state.startTime = performance.now();
        state.timerInterval = setInterval(() => {
            updateInfo('mga-debug-realtime', ((performance.now() - state.startTime) / 1000).toFixed(2) + 's', '#4CAF50');
        }, 100);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    function init() {
        if (!state.active) {
            createPanel();
            state.active = true;
        } else if (!state.panel) {
            createPanel();
        }
        startTimer();
    }

    function log(message, isError = false) {
        const time = (performance.now() / 1000).toFixed(3);
        const method = isError ? 'error' : 'log';
        if (typeof console !== 'undefined' && typeof console[method] === 'function') {
            console[method](`MGA [${time}s]: ${message}`);
        }
        if (!ensureActive() || !state.logContainer) {
            return;
        }
        const entry = document.createElement('p');
        entry.style.cssText = `margin: 2px 5px; padding: 0; color: ${isError ? '#F44336' : '#4CAF50'}; font-size: 11px; word-break: break-all;`;
        entry.innerHTML = `<span style="color:#888;">[${time}s]</span> > ${message}`;
        state.logContainer.appendChild(entry);
        state.logContainer.scrollTop = state.logContainer.scrollHeight;
    }

    function updateInfo(key, value, color = '#fff') {
        if (!ensureActive()) {
            return;
        }
        const element = document.getElementById(key);
        if (element) {
            element.textContent = value;
            element.style.color = color;
        }
    }

    function onForceOpen(callback) {
        if (!ensureActive() || typeof callback !== 'function') {
            return;
        }
        const panel = createPanel();
        const button = panel.querySelector('#mga-force-open');
        if (button && !state.forceOpenAttached) {
            button.addEventListener('click', callback);
            state.forceOpenAttached = true;
        }
    }

    function table(data) {
        if (typeof console !== 'undefined' && typeof console.table === 'function') {
            console.table(data);
        }
    }

    global.mgaDebug = {
        enabled: true,
        init,
        log,
        updateInfo,
        onForceOpen,
        stopTimer,
        table,
    };
})(window);
