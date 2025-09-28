(function(global) {
    "use strict";

    const mgaI18n = global.wp && global.wp.i18n ? global.wp.i18n : null;
    const mga__ = mgaI18n && typeof mgaI18n.__ === 'function' ? mgaI18n.__ : ( text ) => text;
    const mgaSprintf = mgaI18n && typeof mgaI18n.sprintf === 'function'
        ? mgaI18n.sprintf
        : ( format, ...args ) => {
            let index = 0;
            return format.replace(/%s/g, () => {
                const replacement = typeof args[index] !== 'undefined' ? args[index] : '';
                index += 1;
                return replacement;
            });
        };

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

        const title = document.createElement('h4');
        title.style.cssText = 'margin: 0 0 10px; padding: 0 0 10px; border-bottom: 1px solid #444; font-size: 14px;';
        title.textContent = mga__( 'Debug MGA Performance', 'lightbox-jlg' );
        panel.appendChild(title);

        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px;';

        const statusCard = document.createElement('div');
        statusCard.style.cssText = 'background: #1c1f23; padding: 6px 8px; border-radius: 4px; grid-column: 1 / -1;';
        const statusLabel = document.createElement('strong');
        statusLabel.style.cssText = 'display: block; margin-bottom: 4px; color: #ccc;';
        statusLabel.textContent = mga__( 'Statut :', 'lightbox-jlg' );
        const statusValue = document.createElement('div');
        statusValue.id = 'mga-debug-status';
        statusValue.style.cssText = 'font-size: 14px; color: #4CAF50;';
        statusValue.textContent = mga__( 'Inconnu', 'lightbox-jlg' );
        statusCard.appendChild(statusLabel);
        statusCard.appendChild(statusValue);
        statsGrid.appendChild(statusCard);

        const realtimeCard = document.createElement('div');
        realtimeCard.style.cssText = 'background: #1c1f23; padding: 6px 8px; border-radius: 4px;';
        const realtimeLabel = document.createElement('strong');
        realtimeLabel.style.cssText = 'display: block; margin-bottom: 4px; color: #ccc;';
        realtimeLabel.textContent = mga__( 'Chronomètre réel :', 'lightbox-jlg' );
        const realtimeValue = document.createElement('div');
        realtimeValue.id = 'mga-debug-realtime';
        realtimeValue.style.cssText = 'font-size: 16px; color: #4CAF50;';
        realtimeValue.textContent = mgaSprintf( mga__( '%ss', 'lightbox-jlg' ), '0.00' );
        realtimeCard.appendChild(realtimeLabel);
        realtimeCard.appendChild(realtimeValue);
        statsGrid.appendChild(realtimeCard);

        const autoplayCard = document.createElement('div');
        autoplayCard.style.cssText = 'background: #1c1f23; padding: 6px 8px; border-radius: 4px;';
        const autoplayLabel = document.createElement('strong');
        autoplayLabel.style.cssText = 'display: block; margin-bottom: 4px; color: #ccc;';
        autoplayLabel.textContent = mga__( 'Timer Autoplay :', 'lightbox-jlg' );
        const autoplayValue = document.createElement('div');
        autoplayValue.id = 'mga-debug-autoplay-time';
        autoplayValue.style.cssText = 'font-size: 16px; color: #FFC107;';
        autoplayValue.textContent = mga__( 'N/A', 'lightbox-jlg' );
        autoplayCard.appendChild(autoplayLabel);
        autoplayCard.appendChild(autoplayValue);
        statsGrid.appendChild(autoplayCard);

        const contentCard = document.createElement('div');
        contentCard.style.cssText = 'background: #1c1f23; padding: 6px 8px; border-radius: 4px;';
        const contentLabel = document.createElement('strong');
        contentLabel.style.cssText = 'display: block; margin-bottom: 4px; color: #ccc;';
        contentLabel.textContent = mga__( 'Zone de contenu :', 'lightbox-jlg' );
        const contentValue = document.createElement('div');
        contentValue.id = 'mga-debug-content-area';
        contentValue.style.cssText = 'font-size: 13px; color: #03A9F4; word-break: break-all;';
        contentValue.textContent = mga__( 'N/A', 'lightbox-jlg' );
        contentCard.appendChild(contentLabel);
        contentCard.appendChild(contentValue);
        statsGrid.appendChild(contentCard);

        const triggerCard = document.createElement('div');
        triggerCard.style.cssText = 'background: #1c1f23; padding: 6px 8px; border-radius: 4px;';
        const triggerLabel = document.createElement('strong');
        triggerLabel.style.cssText = 'display: block; margin-bottom: 4px; color: #ccc;';
        triggerLabel.textContent = mga__( 'Images déclencheuses :', 'lightbox-jlg' );
        const triggerValue = document.createElement('div');
        triggerValue.id = 'mga-debug-trigger-img';
        triggerValue.style.cssText = 'font-size: 14px; color: #FFC107;';
        triggerValue.textContent = mga__( '0', 'lightbox-jlg' );
        triggerCard.appendChild(triggerLabel);
        triggerCard.appendChild(triggerValue);
        statsGrid.appendChild(triggerCard);

        panel.appendChild(statsGrid);

        const forceButton = document.createElement('button');
        forceButton.id = 'mga-force-open';
        forceButton.style.cssText = 'background: #0073aa; color: white; border: none; padding: 8px 12px; cursor: pointer; margin-top: 10px; width: 100%;';
        forceButton.textContent = mga__( "Forcer l'ouverture (Test)", 'lightbox-jlg' );
        panel.appendChild(forceButton);

        const logContainer = document.createElement('div');
        logContainer.id = 'mga-log-container';
        logContainer.style.cssText = 'margin-top: 15px; max-height: 200px; overflow-y: auto; background: #111; padding: 5px;';

        const logTitle = document.createElement('h5');
        logTitle.style.cssText = 'margin:0 0 5px; padding:0; color: #ccc;';
        logTitle.textContent = mga__( "Journal d'événements :", 'lightbox-jlg' );
        logContainer.appendChild(logTitle);

        const logContent = document.createElement('div');
        logContent.id = 'mga-debug-log';
        logContainer.appendChild(logContent);

        panel.appendChild(logContainer);

        document.body.appendChild(panel);
        state.panel = panel;
        state.logContainer = logContent;
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
            updateInfo(
                'mga-debug-realtime',
                mgaSprintf(mga__( '%ss', 'lightbox-jlg' ), ((performance.now() - state.startTime) / 1000).toFixed(2)),
                '#4CAF50'
            );
        }, 100);
    }

    function restartTimer() {
        startTimer();
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

    function normalizeMessage(message) {
        if (typeof message === 'string') {
            return message;
        }
        if (message instanceof Error && message.message) {
            return message.message;
        }
        if (typeof message === 'object' && message !== null) {
            try {
                return JSON.stringify(message);
            } catch (error) {
                return String(message);
            }
        }
        if (typeof message === 'undefined' || message === null) {
            return '';
        }
        return String(message);
    }

    function log(message, isError = false) {
        const time = (performance.now() / 1000).toFixed(3);
        const method = isError ? 'error' : 'log';
        const normalizedMessage = normalizeMessage(message);
        if (typeof console !== 'undefined' && typeof console[method] === 'function') {
            console[method](mgaSprintf(mga__( 'MGA [%1$ss] : %2$s', 'lightbox-jlg' ), time, normalizedMessage));
        }
        if (!ensureActive() || !state.logContainer) {
            return;
        }
        const entry = document.createElement('p');
        entry.style.cssText = `margin: 2px 5px; padding: 0; color: ${isError ? '#F44336' : '#4CAF50'}; font-size: 11px; word-break: break-all;`;
        const timestamp = document.createElement('span');
        timestamp.style.color = '#888';
        timestamp.textContent = mgaSprintf(mga__( '[%ss]', 'lightbox-jlg' ), time);
        entry.appendChild(timestamp);
        entry.appendChild(document.createTextNode(' > '));
        entry.appendChild(document.createTextNode(normalizedMessage));
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
        restartTimer,
        table,
    };
})(window);
