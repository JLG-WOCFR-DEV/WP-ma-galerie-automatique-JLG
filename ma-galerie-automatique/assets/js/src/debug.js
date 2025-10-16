import { createSprintf, createTranslate, resolveI18n } from './shared';

(function(global) {
    "use strict";

    const mgaI18n = resolveI18n(global);
    const mga__ = createTranslate(mgaI18n);
    const mgaSprintf = createSprintf(mgaI18n);

    const state = {
        panel: null,
        logContainer: null,
        timerInterval: null,
        startTime: 0,
        active: false,
        forceOpenAttached: false,
        announcer: null,
    };

    const TONE_CLASSES = {
        default: 'mga-debug-value--default',
        success: 'mga-debug-value--success',
        warning: 'mga-debug-value--warning',
        error: 'mga-debug-value--error',
        info: 'mga-debug-value--info',
        accent: 'mga-debug-value--accent',
    };

    const TONE_CLASS_LIST = Object.values(TONE_CLASSES);

    function ensureAnnouncer() {
        if (state.announcer && document.body.contains(state.announcer)) {
            return state.announcer;
        }

        let announcer = document.getElementById('mga-debug-announcer');

        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'mga-debug-announcer';
            announcer.className = 'mga-debug-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }

        state.announcer = announcer;
        return announcer;
    }

    function announcePanelState(isOpen) {
        const announcer = ensureAnnouncer();
        if (!announcer) {
            return;
        }

        announcer.textContent = isOpen
            ? mga__( 'Panneau de debug MGA affiché', 'lightbox-jlg' )
            : mga__( 'Panneau de debug MGA masqué', 'lightbox-jlg' );
    }

    function createPanel() {
        if (state.panel) {
            return state.panel;
        }

        const existing = document.getElementById('mga-debug-panel');
        if (existing) {
            state.panel = existing;
            state.logContainer = existing.querySelector('#mga-debug-log');
            state.panel.setAttribute('aria-expanded', 'true');
            const announcer = ensureAnnouncer();
            if (announcer) {
                announcer.textContent = '';
            }
            announcePanelState(true);
            return state.panel;
        }

        const panel = document.createElement('div');
        panel.id = 'mga-debug-panel';
        panel.className = 'mga-debug-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', mga__( 'Panneau de diagnostic MGA', 'lightbox-jlg' ));
        panel.setAttribute('aria-live', 'polite');
        panel.setAttribute('aria-expanded', 'true');

        const title = document.createElement('h4');
        title.className = 'mga-debug-title';
        title.textContent = mga__( 'Debug MGA Performance', 'lightbox-jlg' );
        panel.appendChild(title);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'mga-debug-grid';

        const statusCard = document.createElement('div');
        statusCard.className = 'mga-debug-card mga-debug-card--full';
        const statusLabel = document.createElement('strong');
        statusLabel.className = 'mga-debug-label';
        statusLabel.textContent = mga__( 'Statut :', 'lightbox-jlg' );
        const statusValue = document.createElement('div');
        statusValue.id = 'mga-debug-status';
        statusValue.className = 'mga-debug-value mga-debug-status ' + TONE_CLASSES.default;
        statusValue.setAttribute('role', 'status');
        statusValue.setAttribute('aria-live', 'polite');
        statusValue.setAttribute('aria-atomic', 'true');
        statusValue.textContent = mga__( 'Inconnu', 'lightbox-jlg' );
        statusCard.appendChild(statusLabel);
        statusCard.appendChild(statusValue);
        statsGrid.appendChild(statusCard);

        const realtimeCard = document.createElement('div');
        realtimeCard.className = 'mga-debug-card';
        const realtimeLabel = document.createElement('strong');
        realtimeLabel.className = 'mga-debug-label';
        realtimeLabel.textContent = mga__( 'Chronomètre réel :', 'lightbox-jlg' );
        const realtimeValue = document.createElement('div');
        realtimeValue.id = 'mga-debug-realtime';
        realtimeValue.className = 'mga-debug-value ' + TONE_CLASSES.success;
        realtimeValue.setAttribute('aria-live', 'polite');
        realtimeValue.setAttribute('aria-atomic', 'true');
        realtimeValue.textContent = mgaSprintf( mga__( '%ss', 'lightbox-jlg' ), '0.00' );
        realtimeCard.appendChild(realtimeLabel);
        realtimeCard.appendChild(realtimeValue);
        statsGrid.appendChild(realtimeCard);

        const autoplayCard = document.createElement('div');
        autoplayCard.className = 'mga-debug-card';
        const autoplayLabel = document.createElement('strong');
        autoplayLabel.className = 'mga-debug-label';
        autoplayLabel.textContent = mga__( 'Timer Autoplay :', 'lightbox-jlg' );
        const autoplayValue = document.createElement('div');
        autoplayValue.id = 'mga-debug-autoplay-time';
        autoplayValue.className = 'mga-debug-value ' + TONE_CLASSES.warning;
        autoplayValue.setAttribute('aria-live', 'polite');
        autoplayValue.setAttribute('aria-atomic', 'true');
        autoplayValue.textContent = mga__( 'N/A', 'lightbox-jlg' );
        autoplayCard.appendChild(autoplayLabel);
        autoplayCard.appendChild(autoplayValue);
        statsGrid.appendChild(autoplayCard);

        const contentCard = document.createElement('div');
        contentCard.className = 'mga-debug-card';
        const contentLabel = document.createElement('strong');
        contentLabel.className = 'mga-debug-label';
        contentLabel.textContent = mga__( 'Zone de contenu :', 'lightbox-jlg' );
        const contentValue = document.createElement('div');
        contentValue.id = 'mga-debug-content-area';
        contentValue.className = 'mga-debug-value mga-debug-value--info mga-debug-value--wrap';
        contentValue.setAttribute('aria-live', 'polite');
        contentValue.setAttribute('aria-atomic', 'true');
        contentValue.textContent = mga__( 'N/A', 'lightbox-jlg' );
        contentCard.appendChild(contentLabel);
        contentCard.appendChild(contentValue);
        statsGrid.appendChild(contentCard);

        const triggerCard = document.createElement('div');
        triggerCard.className = 'mga-debug-card';
        const triggerLabel = document.createElement('strong');
        triggerLabel.className = 'mga-debug-label';
        triggerLabel.textContent = mga__( 'Images déclencheuses :', 'lightbox-jlg' );
        const triggerValue = document.createElement('div');
        triggerValue.id = 'mga-debug-trigger-img';
        triggerValue.className = 'mga-debug-value ' + TONE_CLASSES.warning;
        triggerValue.setAttribute('aria-live', 'polite');
        triggerValue.setAttribute('aria-atomic', 'true');
        triggerValue.textContent = mga__( '0', 'lightbox-jlg' );
        triggerCard.appendChild(triggerLabel);
        triggerCard.appendChild(triggerValue);
        statsGrid.appendChild(triggerCard);

        const slidesCard = document.createElement('div');
        slidesCard.className = 'mga-debug-card mga-debug-card--full';
        const slidesLabel = document.createElement('strong');
        slidesLabel.className = 'mga-debug-label';
        slidesLabel.textContent = mga__( 'Médias visibles :', 'lightbox-jlg' );
        const slidesValue = document.createElement('div');
        slidesValue.id = 'mga-debug-visible-slides';
        slidesValue.className = 'mga-debug-value ' + TONE_CLASSES.accent;
        slidesValue.setAttribute('aria-live', 'polite');
        slidesValue.setAttribute('aria-atomic', 'true');
        slidesValue.textContent = mga__( 'N/A', 'lightbox-jlg' );
        slidesCard.appendChild(slidesLabel);
        slidesCard.appendChild(slidesValue);
        statsGrid.appendChild(slidesCard);

        panel.appendChild(statsGrid);

        const forceButton = document.createElement('button');
        forceButton.id = 'mga-force-open';
        forceButton.type = 'button';
        forceButton.className = 'mga-debug-button';
        forceButton.textContent = mga__( "Forcer l'ouverture (Test)", 'lightbox-jlg' );
        panel.appendChild(forceButton);

        const logContainer = document.createElement('div');
        logContainer.id = 'mga-log-container';
        logContainer.className = 'mga-debug-log-container';
        logContainer.setAttribute('role', 'region');
        logContainer.setAttribute('aria-label', mga__( "Journal d'événements", 'lightbox-jlg' ));

        const logTitle = document.createElement('h5');
        logTitle.className = 'mga-debug-log-title';
        logTitle.textContent = mga__( "Journal d'événements :", 'lightbox-jlg' );
        logContainer.appendChild(logTitle);

        const logContent = document.createElement('div');
        logContent.id = 'mga-debug-log';
        logContent.className = 'mga-debug-log';
        logContent.setAttribute('role', 'log');
        logContent.setAttribute('aria-live', 'polite');
        logContent.setAttribute('aria-relevant', 'additions');
        logContainer.appendChild(logContent);

        panel.appendChild(logContainer);

        ensureAnnouncer();

        document.body.appendChild(panel);
        state.panel = panel;
        state.logContainer = logContent;
        state.forceOpenAttached = false;
        announcePanelState(true);
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
                'success'
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

    function destroy(options = {}) {
        const reason = typeof options === 'string'
            ? options
            : (options && typeof options.reason === 'string' ? options.reason : 'manual');

        stopTimer();

        if (state.panel) {
            state.panel.setAttribute('aria-expanded', 'false');
        }

        announcePanelState(false);

        if (state.panel && state.panel.parentNode) {
            state.panel.parentNode.removeChild(state.panel);
        }

        state.panel = null;
        state.logContainer = null;
        state.forceOpenAttached = false;
        state.active = false;

        if (typeof console !== 'undefined' && typeof console.info === 'function') {
            const label = reason && typeof reason === 'string' && reason.trim()
                ? reason.trim()
                : 'manual';
            console.info(mgaSprintf(mga__( 'Debug MGA désactivé (%s).', 'lightbox-jlg' ), label));
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
        entry.className = 'mga-debug-log-entry ' + (isError ? 'mga-debug-log-entry--error' : 'mga-debug-log-entry--info');

        const timestamp = document.createElement('span');
        timestamp.className = 'mga-debug-log-timestamp';
        timestamp.textContent = mgaSprintf(mga__( '[%ss]', 'lightbox-jlg' ), time);
        entry.appendChild(timestamp);

        const separator = document.createElement('span');
        separator.className = 'mga-debug-log-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = ' › ';
        entry.appendChild(separator);

        const messageNode = document.createElement('span');
        messageNode.className = 'mga-debug-log-message';
        messageNode.textContent = normalizedMessage;
        entry.appendChild(messageNode);

        state.logContainer.appendChild(entry);
        state.logContainer.scrollTop = state.logContainer.scrollHeight;
    }

    function shareAction(action, details = {}) {
        const normalizedAction = typeof action === 'string' && action ? action : 'unknown';
        const hasDetails = details && typeof details === 'object' && Object.keys(details).length > 0;
        const message = hasDetails
            ? mgaSprintf(
                mga__( 'Partage [%1$s] : %2$s', 'lightbox-jlg' ),
                normalizedAction,
                normalizeMessage(details)
            )
            : mgaSprintf(mga__( 'Partage [%s]', 'lightbox-jlg' ), normalizedAction);

        log(message);

        if (hasDetails && typeof console !== 'undefined' && typeof console.table === 'function') {
            try {
                console.table(details);
            } catch (error) {
                console.debug(details);
            }
        }
    }

    function updateInfo(key, value, tone = 'default') {
        if (!ensureActive()) {
            return;
        }
        const element = document.getElementById(key);
        if (element) {
            element.textContent = value;
            if (element.classList) {
                element.classList.add('mga-debug-value');
                element.classList.remove(...TONE_CLASS_LIST);
                const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.default;
                element.classList.add(toneClass);
            }
        }
    }

    function updateVisibleSlides(text) {
        updateInfo('mga-debug-visible-slides', text, 'accent');
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
        updateVisibleSlides,
        onForceOpen,
        stopTimer,
        restartTimer,
        table,
        shareAction,
        destroy,
    };
})(window);
