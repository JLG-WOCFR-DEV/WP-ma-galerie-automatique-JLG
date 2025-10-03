(function() {
    "use strict";

    const mgaI18n = window.wp && window.wp.i18n ? window.wp.i18n : null;
    const mga__ = mgaI18n && typeof mgaI18n.__ === 'function' ? mgaI18n.__ : ( text ) => text;
    const TOKEN_REGEX = /%(\d+\$)?[sd]/g;
    const fallbackSprintf = ( format, ...args ) => {
        let autoIndex = 0;

        return String(format).replace(TOKEN_REGEX, (match, position) => {
            let argIndex;
            const type = match.charAt(match.length - 1);

            if (position) {
                const numericIndex = parseInt(position.slice(0, -1), 10);

                if (Number.isNaN(numericIndex) || numericIndex <= 0) {
                    return '';
                }

                argIndex = numericIndex - 1;
            } else {
                argIndex = autoIndex;
                autoIndex += 1;
            }

            const value = argIndex >= 0 && argIndex < args.length ? args[argIndex] : undefined;

            if (type === 'd') {
                const coerced = parseInt(value, 10);
                return Number.isNaN(coerced) ? '' : String(coerced);
            }

            if (typeof value === 'undefined') {
                return '';
            }

            return String(value);
        });
    };

    const mgaSprintf = mgaI18n && typeof mgaI18n.sprintf === 'function'
        ? mgaI18n.sprintf
        : fallbackSprintf;

    const DEFAULT_EFFECT = 'slide';
    const DEFAULT_SPEED = 600;
    const DEFAULT_EASING = 'ease-out';
    const ALLOWED_EFFECTS = [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ];
    const HEAVY_EFFECTS = new Set( [ 'cube', 'coverflow', 'flip' ] );
    const ALLOWED_EASINGS = [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ];

    const sanitizeEffect = ( rawEffect ) => {
        if ( typeof rawEffect !== 'string' ) {
            return DEFAULT_EFFECT;
        }

        const normalized = rawEffect.trim().toLowerCase();
        return ALLOWED_EFFECTS.includes( normalized ) ? normalized : DEFAULT_EFFECT;
    };

    const sanitizeSpeed = ( rawSpeed ) => {
        const parsed = parseInt( rawSpeed, 10 );

        if ( Number.isNaN( parsed ) ) {
            return DEFAULT_SPEED;
        }

        return Math.min( Math.max( parsed, 100 ), 5000 );
    };

    const sanitizeEasing = ( rawEasing ) => {
        if ( typeof rawEasing !== 'string' ) {
            return DEFAULT_EASING;
        }

        const normalized = rawEasing.trim().toLowerCase();
        return ALLOWED_EASINGS.includes( normalized ) ? normalized : DEFAULT_EASING;
    };

    const applyTransitionEasing = ( swiperInstance, easing ) => {
        if ( ! swiperInstance || ! swiperInstance.wrapperEl ) {
            return;
        }

        swiperInstance.wrapperEl.style.transitionTimingFunction = easing;
    };

    function updateEchoBackground(viewer, imageUrl) {
        if (!viewer) {
            return;
        }

        const bgContainer = viewer.querySelector('.mga-echo-bg');
        if (!bgContainer) return;

        const newImg = document.createElement('img');
        newImg.className = 'mga-echo-bg__image';
        let hasLoaded = false;

        const handleLoad = () => {
            if (hasLoaded) {
                return;
            }
            hasLoaded = true;
            const oldImg = bgContainer.querySelector('.mga-visible');
            if (oldImg) {
                oldImg.classList.remove('mga-visible');
                setTimeout(() => { if(oldImg.parentElement) oldImg.parentElement.removeChild(oldImg); }, 400);
            }
            bgContainer.appendChild(newImg);
            setTimeout(() => newImg.classList.add('mga-visible'), 10);
        };

        newImg.onload = handleLoad;
        newImg.src = imageUrl;

        if (newImg.complete) {
            setTimeout(() => handleLoad());
        }
    }

    function updateAutoplayButtonState(viewer, isRunning) {
        if (!viewer) {
            return;
        }

        const playPauseButton = viewer.querySelector('#mga-play-pause');
        if (!playPauseButton) {
            return;
        }

        playPauseButton.setAttribute('aria-pressed', isRunning ? 'true' : 'false');
        playPauseButton.setAttribute(
            'aria-label',
            isRunning
                ? mga__( 'Mettre le diaporama en pause', 'lightbox-jlg' )
                : mga__( 'Lancer le diaporama', 'lightbox-jlg' )
        );
    }

    function initGalleryViewer() {
        const settings = window.mga_settings || {};
        const IMAGE_FILE_PATTERN = /\.(jpe?g|png|gif|bmp|webp|avif|svg)(?:\?.*)?(?:#.*)?$/i;
        const noop = () => {};
        const normalizeFlag = (value, defaultValue = true) => {
            if (typeof value === 'undefined') {
                return defaultValue;
            }

            if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();

                if (['false', '0', 'no', 'off'].includes(normalized)) {
                    return false;
                }

                if (['true', '1', 'yes', 'on'].includes(normalized)) {
                    return true;
                }
            }

            if (typeof value === 'number') {
                return value !== 0;
            }

            return Boolean(value);
        };
        const debug = window.mgaDebug || {
            enabled: false,
            init: noop,
            log: noop,
            updateInfo: noop,
            onForceOpen: noop,
            stopTimer: noop,
            restartTimer: noop,
            table: noop,
            shareAction: noop,
        };
        const showZoom = normalizeFlag(settings.show_zoom, true);
        const showDownload = normalizeFlag(settings.show_download, true);
        const showShare = normalizeFlag(settings.show_share, true);
        const showFullscreen = normalizeFlag(settings.show_fullscreen, true);
        const showThumbsMobile = normalizeFlag(settings.show_thumbs_mobile, true);
        const shareCopyEnabled = normalizeFlag(settings.share_copy, true);
        const shareDownloadEnabled = normalizeFlag(settings.share_download, true);
        const shareChannels = settings.share_channels && typeof settings.share_channels === 'object'
            ? settings.share_channels
            : {};
        const shareTargetLabels = {
            facebook: mga__( 'Facebook', 'lightbox-jlg' ),
            twitter: mga__( 'Twitter', 'lightbox-jlg' ),
            linkedin: mga__( 'LinkedIn', 'lightbox-jlg' ),
            pinterest: mga__( 'Pinterest', 'lightbox-jlg' ),
        };
        const shareActionLabels = {
            copy: mga__( 'Copier le lien', 'lightbox-jlg' ),
            download: mga__( 'Téléchargement rapide', 'lightbox-jlg' ),
            native: mga__( "Partager via l'appareil", 'lightbox-jlg' ),
        };
        const optionalToolbarHandlers = [];
        const SCROLL_LOCK_CLASS = 'mga-scroll-locked';
        let mainSwiper = null;
        let thumbsSwiper = null;
        let cleanupAutoplayPreferenceListener = null;
        let autoplayWasRunningBeforePreferenceChange = false;
        const preloadedUrls = new Set();
        let resizeTimeout;
        let isResizeListenerAttached = false;
        let initialBodyOverflow = null;
        let initialBodyPaddingRight = null;
        let bodyOverflowWasModified = false;
        let bodyPaddingRightWasModified = false;
        let bodyScrollLockClassAdded = false;
        let lastFocusedElementBeforeViewer = null;
        let viewerFocusTrapHandler = null;
        let currentGalleryImages = [];
        let shareModal = null;
        let shareModalIsOpen = false;
        let shareModalInvoker = null;
        let shareModalKeydownHandler = null;

        debug.init();

        if (showZoom) {
            optionalToolbarHandlers.push({
                selector: '#mga-zoom',
                handler: () => {
                    if (mainSwiper && mainSwiper.zoom) {
                        mainSwiper.zoom.toggle();
                        return true;
                    }

                    return false;
                },
            });
        }

        if (showDownload) {
            optionalToolbarHandlers.push({
                selector: '#mga-download',
                handler: (event) => {
                    event.preventDefault();
                    const highResUrl = getActiveHighResUrl();
                    if (highResUrl) {
                        const didDownload = triggerImageDownload(highResUrl);
                        if (!didDownload) {
                            debug.log(mga__( "Impossible de lancer le téléchargement de l’image active.", 'lightbox-jlg' ), true);
                        }
                    } else {
                        debug.log(mga__( "URL haute résolution introuvable pour l’image active.", 'lightbox-jlg' ), true);
                    }

                    return true;
                },
            });
        }

        if (showShare) {
            optionalToolbarHandlers.push({
                selector: '#mga-share',
                handler: (event) => {
                    event.preventDefault();
                    const activeData = getActiveImageData();
                    if (!activeData || !activeData.image) {
                        debug.log(mga__( "Impossible de partager l’image active.", 'lightbox-jlg' ), true);
                        return true;
                    }

                    const shared = openSharePanel(activeData.image);
                    if (!shared) {
                        debug.log(mga__( "Aucune option de partage disponible pour l’image active.", 'lightbox-jlg' ), true);
                    }

                    return true;
                },
            });
        }

        if (showFullscreen) {
            optionalToolbarHandlers.push({
                selector: '#mga-fullscreen',
                handler: (event, viewer) => {
                    if (!viewer) {
                        return false;
                    }

                    const { request: requestFullscreen, exit: exitFullscreen, element: fullscreenElement } = resolveFullscreenApi(viewer);

                    if (!fullscreenElement) {
                        if (requestFullscreen) {
                            try {
                                const result = requestFullscreen();
                                if (result && typeof result.catch === 'function') {
                                    result.catch(err => debug.log(mgaSprintf(mga__( 'Erreur plein écran : %s', 'lightbox-jlg' ), err.message), true));
                                }
                            } catch (err) {
                                debug.log(mgaSprintf(mga__( 'Erreur plein écran : %s', 'lightbox-jlg' ), err.message), true);
                            }
                        } else {
                            debug.log(mga__( 'API plein écran indisponible sur ce navigateur.', 'lightbox-jlg' ), true);
                        }
                    } else if (exitFullscreen) {
                        try {
                            const result = exitFullscreen();
                            if (result && typeof result.catch === 'function') {
                                result.catch(err => debug.log(mgaSprintf(mga__( 'Erreur de sortie du plein écran : %s', 'lightbox-jlg' ), err.message), true));
                            }
                        } catch (err) {
                            debug.log(mgaSprintf(mga__( 'Erreur de sortie du plein écran : %s', 'lightbox-jlg' ), err.message), true);
                        }
                    } else {
                        debug.log(mga__( 'API de fermeture du plein écran indisponible sur ce navigateur.', 'lightbox-jlg' ), true);
                    }

                    return true;
                },
            });
        }

        function resolveEventTarget(event) {
            if (!event || !event.target) {
                return null;
            }

            const target = event.target;

            if (target instanceof Element) {
                return target;
            }

            if (target && typeof target === 'object') {
                if (target.parentElement instanceof Element) {
                    return target.parentElement;
                }

                if (target.parentNode instanceof Element) {
                    return target.parentNode;
                }
            }

            return null;
        }

        function getActiveImageData() {
            if (!Array.isArray(currentGalleryImages) || !currentGalleryImages.length) {
                return null;
            }

            const fallbackIndex = mainSwiper && typeof mainSwiper.activeIndex === 'number'
                ? mainSwiper.activeIndex
                : 0;
            const activeIndex = mainSwiper && typeof mainSwiper.realIndex === 'number'
                ? mainSwiper.realIndex
                : fallbackIndex;

            const activeImage = currentGalleryImages[activeIndex];

            if (!activeImage) {
                return null;
            }

            return { image: activeImage, index: activeIndex };
        }

        function getActiveHighResUrl() {
            const activeData = getActiveImageData();
            if (!activeData) {
                return null;
            }

            const { image } = activeData;

            if (image && typeof image.highResUrl === 'string' && image.highResUrl) {
                return image.highResUrl;
            }

            return null;
        }

        function triggerImageDownload(imageUrl) {
            if (typeof imageUrl !== 'string' || !imageUrl) {
                return false;
            }

            if (!document.body || typeof document.body.appendChild !== 'function') {
                debug.log(mga__( 'Téléchargement impossible : document.body indisponible.', 'lightbox-jlg' ), true);
                return false;
            }

            let link = null;

            try {
                link = document.createElement('a');
                link.href = imageUrl;
                link.rel = 'noopener';

                const urlParts = imageUrl.split('/').filter(Boolean);
                const fallbackName = urlParts.length ? urlParts[urlParts.length - 1] : 'image';
                link.download = fallbackName;

                document.body.appendChild(link);
                link.click();
                return true;
            } catch (error) {
                debug.log(mgaSprintf(mga__( "Échec du téléchargement : %s", 'lightbox-jlg' ), error.message), true);
                return false;
            } finally {
                if (link && link.parentNode === document.body) {
                    document.body.removeChild(link);
                }
            }
        }

        function hasNativeShareSupport() {
            return typeof navigator !== 'undefined' && navigator && typeof navigator.share === 'function';
        }

        function ensureShareModal(viewer) {
            if (!showShare) {
                return null;
            }

            if (shareModal && shareModal.container && shareModal.container.parentElement === viewer) {
                return shareModal;
            }

            const modalContainer = document.createElement('div');
            modalContainer.id = 'mga-share-modal';
            modalContainer.className = 'mga-share-modal';
            modalContainer.setAttribute('role', 'dialog');
            modalContainer.setAttribute('aria-modal', 'true');
            modalContainer.setAttribute('aria-hidden', 'true');
            modalContainer.setAttribute('hidden', 'hidden');

            const overlay = document.createElement('div');
            overlay.className = 'mga-share-modal__overlay';
            overlay.setAttribute('aria-hidden', 'true');
            modalContainer.appendChild(overlay);

            const dialog = document.createElement('div');
            dialog.className = 'mga-share-modal__dialog';
            dialog.setAttribute('role', 'document');
            dialog.setAttribute('tabindex', '-1');
            modalContainer.appendChild(dialog);

            const header = document.createElement('div');
            header.className = 'mga-share-modal__header';
            dialog.appendChild(header);

            const title = document.createElement('h2');
            title.id = 'mga-share-title';
            title.className = 'mga-share-modal__title';
            title.textContent = mga__( 'Partager cette image', 'lightbox-jlg' );
            header.appendChild(title);

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'mga-share-modal__close';
            closeButton.setAttribute('aria-label', mga__( 'Fermer la fenêtre de partage', 'lightbox-jlg' ));
            closeButton.innerHTML = '&times;';
            header.appendChild(closeButton);

            const body = document.createElement('div');
            body.className = 'mga-share-modal__body';
            dialog.appendChild(body);

            const description = document.createElement('p');
            description.id = 'mga-share-description';
            description.className = 'mga-share-modal__description';
            description.textContent = mga__( 'Choisissez une option de partage :', 'lightbox-jlg' );
            body.appendChild(description);

            const list = document.createElement('ul');
            list.className = 'mga-share-modal__list';
            list.setAttribute('data-mga-share-list', 'true');
            body.appendChild(list);

            const feedback = document.createElement('p');
            feedback.className = 'mga-share-modal__feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            body.appendChild(feedback);

            dialog.setAttribute('aria-describedby', description.id);
            viewer.appendChild(modalContainer);

            const onOverlayClick = () => closeShareModal({ reason: 'overlay' });
            const onCloseClick = () => closeShareModal({ reason: 'close-button' });

            overlay.addEventListener('click', onOverlayClick);
            closeButton.addEventListener('click', onCloseClick);
            list.addEventListener('click', onShareModalListClick);

            shareModal = {
                container: modalContainer,
                dialog,
                list,
                closeButton,
                overlay,
                feedback,
                description,
                payload: null,
                options: [],
            };

            return shareModal;
        }

        function resetShareModalFeedback() {
            if (!shareModal || !shareModal.feedback) {
                return;
            }

            shareModal.feedback.textContent = '';
            shareModal.feedback.removeAttribute('data-mga-state');
        }

        function setShareModalFeedback(message, isError = false) {
            if (!shareModal || !shareModal.feedback) {
                return;
            }

            shareModal.feedback.textContent = message || '';

            if (isError) {
                shareModal.feedback.setAttribute('data-mga-state', 'error');
            } else if (message) {
                shareModal.feedback.setAttribute('data-mga-state', 'success');
            } else {
                shareModal.feedback.removeAttribute('data-mga-state');
            }
        }

        function populateShareModal(modalInstance, options, sharePayload) {
            if (!modalInstance || !modalInstance.list) {
                return;
            }

            resetShareModalFeedback();

            while (modalInstance.list.firstChild) {
                modalInstance.list.removeChild(modalInstance.list.firstChild);
            }

            modalInstance.options = Array.isArray(options) ? options : [];
            modalInstance.payload = sharePayload || {};

            modalInstance.list.setAttribute('data-mga-share-count', String(modalInstance.options.length));

            modalInstance.options.forEach((option) => {
                const item = document.createElement('li');
                item.className = 'mga-share-modal__item';

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'mga-share-option';
                button.setAttribute('data-share-type', option.type);
                button.setAttribute('data-share-key', option.key);
                button.setAttribute('data-share-label', option.label);

                if (option.template) {
                    button.setAttribute('data-share-template', option.template);
                }

                button.textContent = option.label;
                item.appendChild(button);
                modalInstance.list.appendChild(item);
            });
        }

        function buildShareOptions(sharePayload) {
            const options = [];

            Object.keys(shareChannels).forEach((channelKey) => {
                const config = shareChannels[channelKey];

                if (!config || typeof config !== 'object') {
                    return;
                }

                const enabled = typeof config.enabled === 'boolean' ? config.enabled : Boolean(config.enabled);
                const template = typeof config.template === 'string' ? config.template.trim() : '';

                if (!enabled || !template) {
                    return;
                }

                const label = shareTargetLabels[channelKey] || channelKey;

                options.push({
                    type: 'social',
                    key: channelKey,
                    label,
                    template,
                });
            });

            if (shareCopyEnabled) {
                options.push({
                    type: 'copy',
                    key: 'copy',
                    label: shareActionLabels.copy,
                });
            }

            if (shareDownloadEnabled) {
                options.push({
                    type: 'download',
                    key: 'download',
                    label: shareActionLabels.download,
                });
            }

            if (hasNativeShareSupport()) {
                options.push({
                    type: 'native',
                    key: 'native',
                    label: shareActionLabels.native,
                });
            }

            return options;
        }

        function getShareModalFocusableElements(modalInstance) {
            if (!modalInstance || !modalInstance.dialog) {
                return [];
            }

            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
            ];

            return Array.from(
                modalInstance.dialog.querySelectorAll(focusableSelectors.join(','))
            ).filter((element) => !element.hasAttribute('disabled'));
        }

        function onShareModalKeydown(event) {
            if (!shareModalIsOpen || !shareModal) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                closeShareModal({ reason: 'escape' });
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = getShareModalFocusableElements(shareModal);

            if (!focusable.length) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === first || !shareModal.dialog.contains(activeElement)) {
                    event.preventDefault();
                    last.focus();
                }
            } else if (activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function openShareModal(modalInstance, invokerButton) {
            if (!modalInstance || !modalInstance.container) {
                return false;
            }

            modalInstance.container.removeAttribute('hidden');
            modalInstance.container.setAttribute('aria-hidden', 'false');
            modalInstance.container.classList.add('is-visible');

            shareModalIsOpen = true;
            shareModalInvoker = invokerButton || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
            shareModalKeydownHandler = onShareModalKeydown;

            document.addEventListener('keydown', shareModalKeydownHandler, true);

            if (invokerButton) {
                invokerButton.setAttribute('aria-expanded', 'true');
            }

            const focusable = getShareModalFocusableElements(modalInstance);

            if (focusable.length) {
                focusable[0].focus();
            } else if (modalInstance.closeButton) {
                modalInstance.closeButton.focus();
            }

            debug.shareAction('open', {
                options: modalInstance.options.map((option) => option.key),
            });

            return true;
        }

        function closeShareModal({ restoreFocus = true, reason = 'manual' } = {}) {
            if (!shareModal || !shareModal.container || !shareModalIsOpen) {
                return;
            }

            shareModal.container.classList.remove('is-visible');
            shareModal.container.setAttribute('aria-hidden', 'true');
            shareModal.container.setAttribute('hidden', 'hidden');

            if (shareModalKeydownHandler) {
                document.removeEventListener('keydown', shareModalKeydownHandler, true);
                shareModalKeydownHandler = null;
            }

            const shareButtonElement = document.getElementById('mga-share');

            if (shareButtonElement) {
                shareButtonElement.setAttribute('aria-expanded', 'false');
            }

            shareModalIsOpen = false;

            if (restoreFocus && shareModalInvoker && typeof shareModalInvoker.focus === 'function') {
                shareModalInvoker.focus();
            }

            shareModalInvoker = null;

            debug.shareAction('close', { reason });
        }

        function buildShareUrl(template, sharePayload) {
            if (typeof template !== 'string' || !template) {
                return '';
            }

            const payload = sharePayload || {};
            const replacements = {
                url: payload.url || '',
                text: payload.text || payload.title || '',
                title: payload.title || payload.text || '',
            };

            return template.replace(/%([a-z]+)%/gi, (match, key) => {
                const normalized = key.toLowerCase();

                if (!Object.prototype.hasOwnProperty.call(replacements, normalized)) {
                    return '';
                }

                return encodeURIComponent(replacements[normalized]);
            });
        }

        function copyToClipboard(text) {
            if (typeof text !== 'string') {
                return Promise.reject(new Error('invalid-text'));
            }

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                return navigator.clipboard.writeText(text);
            }

            return new Promise((resolve, reject) => {
                try {
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.setAttribute('readonly', '');
                    textarea.style.position = 'absolute';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textarea);

                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error('execCommand-failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }

        function onShareModalListClick(event) {
            if (!shareModal || !shareModal.list || !shareModalIsOpen) {
                return;
            }

            const trigger = event.target instanceof Element
                ? event.target.closest('button[data-share-type]')
                : null;

            if (!trigger) {
                return;
            }

            event.preventDefault();

            const shareType = trigger.getAttribute('data-share-type');
            const shareKey = trigger.getAttribute('data-share-key') || '';
            const shareLabel = trigger.getAttribute('data-share-label') || shareKey;
            const payload = shareModal.payload || {};

            if ('social' === shareType) {
                const template = trigger.getAttribute('data-share-template') || '';
                const shareUrl = buildShareUrl(template, payload);

                if (!shareUrl) {
                    setShareModalFeedback(mga__( 'Impossible de générer le lien de partage.', 'lightbox-jlg' ), true);
                    debug.shareAction('social', { target: shareKey, success: false, reason: 'invalid-url' });
                    return;
                }

                let popup = null;

                if (typeof window !== 'undefined' && window && typeof window.open === 'function') {
                    popup = window.open(shareUrl, '_blank', 'noopener');
                }

                if (popup) {
                    setShareModalFeedback(
                        mgaSprintf(
                            mga__( 'Ouverture de %s dans un nouvel onglet.', 'lightbox-jlg' ),
                            shareLabel
                        )
                    );
                    debug.shareAction('social', { target: shareKey, success: true, url: shareUrl });
                } else {
                    setShareModalFeedback(
                        mgaSprintf(
                            mga__( 'Impossible d’ouvrir %s. Vérifiez votre bloqueur de fenêtres.', 'lightbox-jlg' ),
                            shareLabel
                        ),
                        true
                    );
                    debug.shareAction('social', { target: shareKey, success: false, url: shareUrl });
                }

                return;
            }

            if ('copy' === shareType) {
                if (!payload.url) {
                    setShareModalFeedback(mga__( 'Aucun lien à copier pour cette image.', 'lightbox-jlg' ), true);
                    debug.shareAction('copy', { success: false, reason: 'missing-url' });
                    return;
                }

                copyToClipboard(payload.url)
                    .then(() => {
                        setShareModalFeedback(mga__( 'Lien copié dans le presse-papiers.', 'lightbox-jlg' ));
                        debug.shareAction('copy', { success: true });
                    })
                    .catch((error) => {
                        setShareModalFeedback(mga__( 'Impossible de copier le lien. Essayez le raccourci clavier.', 'lightbox-jlg' ), true);
                        debug.shareAction('copy', { success: false, reason: error && error.message ? error.message : 'copy-error' });
                    });

                return;
            }

            if ('download' === shareType) {
                if (!payload.url) {
                    setShareModalFeedback(mga__( 'Aucun fichier à télécharger pour cette image.', 'lightbox-jlg' ), true);
                    debug.shareAction('download', { success: false, reason: 'missing-url' });
                    return;
                }

                const didDownload = triggerImageDownload(payload.url);

                if (didDownload) {
                    setShareModalFeedback(mga__( 'Téléchargement de l’image lancé.', 'lightbox-jlg' ));
                    debug.shareAction('download', { success: true });
                } else {
                    setShareModalFeedback(mga__( 'Impossible de lancer le téléchargement.', 'lightbox-jlg' ), true);
                    debug.shareAction('download', { success: false });
                }

                return;
            }

            if ('native' === shareType) {
                if (!hasNativeShareSupport()) {
                    setShareModalFeedback(mga__( 'Le partage natif n’est pas pris en charge sur ce navigateur.', 'lightbox-jlg' ), true);
                    debug.shareAction('native', { success: false, reason: 'unsupported' });
                    return;
                }

                try {
                    const shareResult = navigator.share(payload);
                    debug.shareAction('native', { success: true });
                    closeShareModal({ restoreFocus: false, reason: 'native-share' });

                    if (shareResult && typeof shareResult.catch === 'function') {
                        shareResult.catch((error) => {
                            const message = error && error.message
                                ? error.message
                                : mga__( 'Partage annulé.', 'lightbox-jlg' );
                            debug.shareAction('native', { success: false, reason: message });
                        });
                    }
                } catch (error) {
                    setShareModalFeedback(
                        mgaSprintf(
                            mga__( 'Partage natif impossible : %s', 'lightbox-jlg' ),
                            error && error.message ? error.message : 'unknown'
                        ),
                        true
                    );
                    debug.shareAction('native', { success: false, reason: error && error.message ? error.message : 'error' });
                }

                return;
            }

            debug.shareAction('unknown', { type: shareType });
        }

        function openSharePanel(imageData) {
            if (!imageData || typeof imageData.highResUrl !== 'string' || !imageData.highResUrl) {
                return false;
            }

            const viewer = document.getElementById('mga-viewer');
            if (!viewer) {
                return false;
            }

            const modalInstance = ensureShareModal(viewer);
            if (!modalInstance) {
                return false;
            }

            const caption = typeof imageData.caption === 'string' ? imageData.caption.trim() : '';
            const documentTitle = typeof document !== 'undefined' && document && typeof document.title === 'string'
                ? document.title
                : '';

            const sharePayload = { url: imageData.highResUrl };

            if (caption) {
                sharePayload.text = caption;
            }

            if (caption || documentTitle) {
                sharePayload.title = caption || documentTitle;
            }

            const options = buildShareOptions(sharePayload);

            if (!options.length) {
                debug.shareAction('no-options', { url: imageData.highResUrl });
                return false;
            }

            populateShareModal(modalInstance, options, sharePayload);

            const shareButton = viewer.querySelector('#mga-share');

            const opened = openShareModal(modalInstance, shareButton || null);

            if (!opened) {
                return false;
            }

            return true;
        }

        /**
         * Swiper peut afficher des avertissements « Swiper Loop Warning » lorsque
         * l'option `loop` est active mais que la configuration n'offre pas assez
         * de diapositives. Plutôt que de modifier `console.warn`, on vérifie
         * localement que la configuration dispose d'un nombre de diapositives
         * suffisant. Si ce n'est pas le cas, on désactive la boucle pour cette
         * instance uniquement et on trace l'information via le logger de debug.
         */
        function createSwiperInstance(container, config) {
            if (typeof Swiper !== 'function') {
                const message = mga__( 'ERREUR : La dépendance Swiper est introuvable. Initialisation annulée.', 'lightbox-jlg' );
                if (debug && typeof debug.log === 'function') {
                    debug.log(message, true);
                } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
                    console.error(message);
                }
                return null;
            }
            if (!config || !config.loop) {
                return new Swiper(container, config);
            }

            const slidesCount = container ? container.querySelectorAll('.swiper-slide').length : 0;

            const resolveMaxSlidesPerView = (swiperConfig) => {
                const values = [];
                const collect = (value) => {
                    if (typeof value === 'number' && !Number.isNaN(value)) {
                        values.push(Math.ceil(value));
                    }
                };

                collect(swiperConfig.slidesPerView);

                if (swiperConfig.breakpoints && typeof swiperConfig.breakpoints === 'object') {
                    Object.values(swiperConfig.breakpoints).forEach(bpConfig => {
                        if (bpConfig && typeof bpConfig === 'object') {
                            collect(bpConfig.slidesPerView);
                        }
                    });
                }

                return values.length ? Math.max(...values) : 1;
            };

            const maxSlidesPerView = resolveMaxSlidesPerView(config);
            const explicitLoopedSlides = typeof config.loopedSlides === 'number' ? Math.max(0, Math.floor(config.loopedSlides)) : maxSlidesPerView;
            const additionalSlides = typeof config.loopAdditionalSlides === 'number' ? Math.max(0, Math.floor(config.loopAdditionalSlides)) : 0;
            const slidesPerGroup = typeof config.slidesPerGroup === 'number' ? Math.max(1, Math.floor(config.slidesPerGroup)) : 1;
            const centeredSlidesBonus = config.centeredSlides ? 1 : 0;

            const computedLoopedSlides = explicitLoopedSlides + additionalSlides;
            const minimumSlidesRequired = Math.max(computedLoopedSlides + 1, slidesPerGroup + centeredSlidesBonus + 1, 2);

            if (slidesCount >= minimumSlidesRequired) {
                return new Swiper(container, config);
            }

            const safeConfig = Object.assign({}, config);
            let safeLoopedSlides = explicitLoopedSlides;
            let safeAdditionalSlides = additionalSlides;

            if (slidesCount > 1) {
                safeLoopedSlides = Math.min(explicitLoopedSlides, Math.max(slidesCount - 1, 1));
                const remainingCapacity = Math.max(slidesCount - 1 - safeLoopedSlides, 0);
                safeAdditionalSlides = Math.min(additionalSlides, remainingCapacity);
            } else {
                safeConfig.loop = false;
            }

            safeConfig.loopedSlides = safeLoopedSlides;
            safeConfig.loopAdditionalSlides = safeAdditionalSlides;

            const logMessage = safeConfig.loop
                ? `Loop ajustée (instance locale) : ${slidesCount} slide(s), boucle recalibrée à ${safeLoopedSlides} + ${safeAdditionalSlides} slide(s) additionnelles.`
                : `Loop désactivée (instance locale) : ${slidesCount} slide disponible, boucle inutilisable.`;

            if (debug && typeof debug.log === 'function') {
                debug.log(logMessage);
            } else if (typeof console !== 'undefined' && typeof console.info === 'function') {
                console.info(logMessage);
            }

            return new Swiper(container, safeConfig);
        }

        // --- FONCTIONS UTILITAIRES ---
        let focusSupportsOptionsCache = null;

        function detectFocusOptionsSupport() {
            if (focusSupportsOptionsCache !== null) {
                return focusSupportsOptionsCache;
            }

            focusSupportsOptionsCache = false;

            if (
                typeof window === 'undefined' ||
                typeof document === 'undefined' ||
                typeof document.createElement !== 'function' ||
                typeof HTMLElement === 'undefined' ||
                !HTMLElement.prototype ||
                typeof HTMLElement.prototype.focus !== 'function'
            ) {
                return focusSupportsOptionsCache;
            }

            const testElement = document.createElement('button');
            const root = document.body || document.documentElement;

            try {
                testElement.type = 'button';

                if (root && typeof root.appendChild === 'function') {
                    root.appendChild(testElement);
                }

                HTMLElement.prototype.focus.call(testElement, {
                    get preventScroll() {
                        focusSupportsOptionsCache = true;
                        return true;
                    },
                });
            } catch (error) {
                focusSupportsOptionsCache = false;
            } finally {
                if (testElement.parentNode && typeof testElement.parentNode.removeChild === 'function') {
                    testElement.parentNode.removeChild(testElement);
                }
            }

            return focusSupportsOptionsCache;
        }

        function safeFocus(element, options = { preventScroll: true }) {
            if (!element || typeof element.focus !== 'function') {
                return;
            }

            const canUseOptions = options && detectFocusOptionsSupport();

            if (canUseOptions) {
                try {
                    element.focus(options);
                    return;
                } catch (error) {
                    // Fallback to focusing without options if an error occurs.
                }
            }

            element.focus();
        }

        function resolveFullscreenApi(target) {
            const doc = document;
            const apiMap = [
                { request: 'requestFullscreen', exit: 'exitFullscreen', element: 'fullscreenElement' },
                { request: 'webkitRequestFullscreen', exit: 'webkitExitFullscreen', element: 'webkitFullscreenElement' },
                { request: 'webkitRequestFullScreen', exit: 'webkitCancelFullScreen', element: 'webkitCurrentFullScreenElement' },
                { request: 'mozRequestFullScreen', exit: 'mozCancelFullScreen', element: 'mozFullScreenElement' },
                { request: 'msRequestFullscreen', exit: 'msExitFullscreen', element: 'msFullscreenElement' },
            ];

            const result = {
                request: null,
                exit: null,
                element: null,
            };

            const elementCandidates = [
                'fullscreenElement',
                'webkitFullscreenElement',
                'webkitCurrentFullScreenElement',
                'mozFullScreenElement',
                'msFullscreenElement',
            ];

            for (const prop of elementCandidates) {
                if (typeof doc[prop] !== 'undefined' && doc[prop]) {
                    result.element = doc[prop];
                    break;
                }
            }

            for (const entry of apiMap) {
                if (!result.request && target && typeof target[entry.request] === 'function') {
                    result.request = target[entry.request].bind(target);
                }
                if (!result.exit && typeof doc[entry.exit] === 'function') {
                    result.exit = doc[entry.exit].bind(doc);
                }
                if (result.request && result.exit && result.element) {
                    break;
                }
            }

            return result;
        }

        function isExplicitFallbackAllowed(linkElement) {
            if (!linkElement) return false;
            if (linkElement.hasAttribute('data-mga-allow-fallback')) return true;
            if (linkElement.dataset) {
                const allowFlag = linkElement.dataset.mgaAllowFallback;
                if (typeof allowFlag !== 'undefined' && allowFlag !== '0' && allowFlag !== 'false') {
                    return true;
                }
                if (linkElement.dataset.mgaHighres) {
                    return true;
                }
                const linkType = linkElement.dataset.type || linkElement.dataset.wpType;
                if (typeof linkType === 'string' && linkType.toLowerCase() === 'attachment') {
                    return true;
                }
            }
            const rel = linkElement.getAttribute('rel');
            if (rel && rel.split(/\s+/).includes('mga-allow-fallback')) {
                return true;
            }
            const dataType = linkElement.getAttribute('data-type');
            if (typeof dataType === 'string' && dataType.toLowerCase() === 'attachment') {
                return true;
            }
            const href = linkElement.getAttribute('href');
            if (typeof href === 'string') {
                if (/[?&]attachment_id=\d+/i.test(href)) {
                    return true;
                }
                if (/\/attachment\//i.test(href)) {
                    return true;
                }
                try {
                    const baseHref = (typeof window !== 'undefined' && window.location)
                        ? window.location.href
                        : undefined;
                    const url = new URL(href, baseHref);
                    if (url.searchParams && url.searchParams.has('attachment_id')) {
                        return true;
                    }
                } catch (error) {
                    // Ignored : l'URL relative sera déjà couverte par les expressions régulières ci-dessus.
                }
            }
            return false;
        }

        function getImageDataAttributes(innerImg, options = {}) {
            if (!innerImg) return null;

            const { excludeLarge = false } = options;

            const attributePriority = [
                'data-mga-highres',
                'data-full-url',
                'data-large-file',
                'data-orig-file',
                'data-src',
                'data-lazy-src'
            ];
            const datasetToAttributesMap = {
                mgaHighres: 'data-mga-highres',
                fullUrl: 'data-full-url',
                largeFile: 'data-large-file',
                origFile: 'data-orig-file',
                src: 'data-src',
                lazySrc: 'data-lazy-src'
            };
            const collected = [];

            for (const attr of attributePriority) {
                const value = innerImg.getAttribute(attr);
                if (value) {
                    collected.push({ key: attr, value: value.trim() });
                }
            }

            if (innerImg.dataset) {
                for (const [datasetKey, attributeName] of Object.entries(datasetToAttributesMap)) {
                    const datasetValue = innerImg.dataset[datasetKey];
                    if (datasetValue && !collected.some(item => item.key === attributeName)) {
                        collected.push({ key: attributeName, value: datasetValue.trim() });
                    }
                }
            }

            if (!collected.length) {
                return null;
            }

            if (excludeLarge) {
                const largeKeys = new Set(['data-full-url', 'data-large-file', 'data-orig-file']);
                const lightweightPreference = ['data-src', 'data-lazy-src', 'data-mga-highres'];
                const hasLightweightAlternative = collected.some(item => !largeKeys.has(item.key));

                if (hasLightweightAlternative) {
                    for (const preferredKey of lightweightPreference) {
                        const candidate = collected.find(item => item.key === preferredKey && item.value);
                        if (candidate) {
                            return candidate.value;
                        }
                    }

                    const fallbackCandidate = collected.find(item => !largeKeys.has(item.key) && item.value);
                    if (fallbackCandidate) {
                        return fallbackCandidate.value;
                    }
                }
            }

            const firstEntry = collected.find(item => item.value);
            return firstEntry ? firstEntry.value : null;
        }

        function sanitizeThumbnailUrl(candidate) {
            if (typeof candidate !== 'string') {
                return '';
            }

            const trimmed = candidate.trim();
            if (!trimmed) {
                return '';
            }

            if (/^(?:about:|javascript:)/i.test(trimmed)) {
                return '';
            }

            if (/^(?:data:|blob:)/i.test(trimmed)) {
                return '';
            }

            return trimmed;
        }

        function sanitizeHighResUrl(candidate) {
            if (typeof candidate !== 'string') {
                return '';
            }

            const trimmed = candidate.trim();
            if (!trimmed) {
                return '';
            }

            if (/^\/\//.test(trimmed)) {
                const location = typeof window !== 'undefined' ? window.location : null;
                const protocol = location && typeof location.protocol === 'string'
                    ? location.protocol.toLowerCase()
                    : '';
                if (protocol === 'http:' || protocol === 'https:') {
                    return `${protocol}${trimmed}`;
                }
                return `https:${trimmed}`;
            }

            if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
                if (!/^https?:/i.test(trimmed)) {
                    return '';
                }
                return trimmed;
            }

            return trimmed;
        }

        function resolveThumbnailUrl(innerImg) {
            if (!innerImg) {
                return '';
            }

            const preferredSources = [
                typeof innerImg.currentSrc === 'string' ? innerImg.currentSrc : '',
                typeof innerImg.src === 'string' ? innerImg.src : '',
            ];

            for (const source of preferredSources) {
                const sanitized = sanitizeThumbnailUrl(source);
                if (sanitized) {
                    return sanitized;
                }
            }

            const dataAttributeUrl = getImageDataAttributes(innerImg, { excludeLarge: true });
            return sanitizeThumbnailUrl(dataAttributeUrl);
        }

        function parseSrcset(innerImg) {
            if (!innerImg || !innerImg.srcset) {
                return null;
            }

            const entries = innerImg.srcset
                .split(',')
                .map(entry => entry.trim())
                .filter(entry => entry.length > 0)
                .map(entry => {
                    const parts = entry.split(/\s+/);
                    const candidateUrl = parts[0];
                    let score = 0;
                    if (parts[1]) {
                        const descriptor = parts[1].trim();
                        if (/^[0-9]+w$/i.test(descriptor)) {
                            score = parseInt(descriptor, 10);
                        } else if (/^[0-9]*\.?[0-9]+x$/i.test(descriptor)) {
                            score = parseFloat(descriptor) * 1000;
                        }
                    }
                    return { url: candidateUrl, score };
                })
                .filter(candidate => candidate.url);

            if (!entries.length) {
                return null;
            }

            entries.sort((a, b) => b.score - a.score);
            return entries[0].url;
        }

        function getHighResUrl(linkElement) {
            if (!linkElement) return null;

            const href = linkElement.getAttribute('href') || '';
            const isMediaHref = IMAGE_FILE_PATTERN.test(href);
            const fallbackAllowed = isMediaHref || isExplicitFallbackAllowed(linkElement);
            const sanitizedHref = isMediaHref ? sanitizeHighResUrl(href) : null;

            if (fallbackAllowed && linkElement.dataset && linkElement.dataset.mgaHighres) {
                const sanitizedDatasetUrl = sanitizeHighResUrl(linkElement.dataset.mgaHighres);
                if (sanitizedDatasetUrl) {
                    return sanitizedDatasetUrl;
                }
            }

            const innerImg = linkElement.querySelector('img');
            if (!innerImg) return null;

            if (fallbackAllowed) {
                const dataAttrUrl = getImageDataAttributes(innerImg);
                const sanitizedDataAttrUrl = sanitizeHighResUrl(dataAttrUrl);
                if (sanitizedDataAttrUrl) {
                    return sanitizedDataAttrUrl;
                }
            }

            if (!fallbackAllowed) {
                return null;
            }

            const srcsetUrl = sanitizeHighResUrl(parseSrcset(innerImg));
            if (srcsetUrl) {
                return srcsetUrl;
            }

            if (sanitizedHref) {
                return sanitizedHref;
            }

            const currentSrc = sanitizeHighResUrl(innerImg.currentSrc);
            if (currentSrc) {
                return currentSrc;
            }

            const fallbackSrc = sanitizeHighResUrl(innerImg.src);
            if (fallbackSrc) {
                return fallbackSrc;
            }

            return null;
        }

        function getViewer() {
            let viewer = document.getElementById('mga-viewer');
            if (!viewer) {
                debug.log(mga__( 'Viewer non trouvé. Création à la volée...', 'lightbox-jlg' ));

                const SVG_NS = 'http://www.w3.org/2000/svg';
                const createSvgElement = (tag, attributes = {}) => {
                    const element = document.createElementNS(SVG_NS, tag);
                    Object.keys(attributes).forEach(attr => {
                        element.setAttribute(attr, attributes[attr]);
                    });
                    return element;
                };

                viewer = document.createElement('div');
                viewer.id = 'mga-viewer';
                viewer.className = 'mga-viewer';
                viewer.classList.toggle('mga-has-caption', false);
                viewer.style.display = 'none';
                viewer.setAttribute('role', 'dialog');
                viewer.setAttribute('aria-modal', 'true');
                viewer.setAttribute('aria-labelledby', 'mga-viewer-title');
                viewer.setAttribute('tabindex', '-1');

                const viewerTitle = document.createElement('span');
                viewerTitle.id = 'mga-viewer-title';
                viewerTitle.className = 'mga-screen-reader-text';
                viewerTitle.textContent = mga__( 'Visionneuse d’images', 'lightbox-jlg' );
                viewer.appendChild(viewerTitle);

                const echoBg = document.createElement('div');
                echoBg.className = 'mga-echo-bg';
                viewer.appendChild(echoBg);

                const header = document.createElement('div');
                header.className = 'mga-header';
                viewer.appendChild(header);

                const counter = document.createElement('div');
                counter.id = 'mga-counter';
                counter.className = 'mga-counter';
                header.appendChild(counter);

                const captionContainer = document.createElement('div');
                captionContainer.className = 'mga-caption-container';
                captionContainer.setAttribute('role', 'status');
                captionContainer.setAttribute('aria-live', 'polite');
                header.appendChild(captionContainer);

                const caption = document.createElement('p');
                caption.id = 'mga-caption';
                caption.className = 'mga-caption';
                captionContainer.appendChild(caption);

                const captionLiveRegion = document.createElement('span');
                captionLiveRegion.className = 'mga-screen-reader-text mga-caption-live';
                captionContainer.appendChild(captionLiveRegion);

                const toolbar = document.createElement('div');
                toolbar.className = 'mga-toolbar';
                header.appendChild(toolbar);

                const playPauseButton = document.createElement('button');
                playPauseButton.type = 'button';
                playPauseButton.id = 'mga-play-pause';
                playPauseButton.className = 'mga-toolbar-button';
                playPauseButton.setAttribute('aria-pressed', 'false');
                playPauseButton.setAttribute('aria-label', mga__( 'Lancer le diaporama', 'lightbox-jlg' ));
                toolbar.appendChild(playPauseButton);

                const timerSvg = createSvgElement('svg', { class: 'mga-timer-svg', viewBox: '0 0 36 36' });
                const timerBgPath = createSvgElement('path', {
                    class: 'mga-timer-bg',
                    d: 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831',
                });
                const timerProgressPath = createSvgElement('path', {
                    class: 'mga-timer-progress',
                    d: 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831',
                });
                timerSvg.appendChild(timerBgPath);
                timerSvg.appendChild(timerProgressPath);
                playPauseButton.appendChild(timerSvg);

                const playIcon = createSvgElement('svg', {
                    class: 'mga-icon mga-play-icon',
                    viewBox: '0 0 24 24',
                    fill: 'currentColor',
                });
                const playPath = createSvgElement('path', { d: 'M8 5v14l11-7z' });
                playIcon.appendChild(playPath);
                playPauseButton.appendChild(playIcon);

                const pauseIcon = createSvgElement('svg', {
                    class: 'mga-icon mga-pause-icon',
                    viewBox: '0 0 24 24',
                    fill: 'currentColor',
                });
                pauseIcon.style.display = 'none';
                const pausePath = createSvgElement('path', { d: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' });
                pauseIcon.appendChild(pausePath);
                playPauseButton.appendChild(pauseIcon);

                updateAutoplayButtonState(viewer, false);

                if (showZoom) {
                    const zoomButton = document.createElement('button');
                    zoomButton.type = 'button';
                    zoomButton.id = 'mga-zoom';
                    zoomButton.className = 'mga-toolbar-button';
                    zoomButton.setAttribute('aria-label', mga__( 'Zoom', 'lightbox-jlg' ));
                    toolbar.appendChild(zoomButton);

                    const zoomIcon = createSvgElement('svg', {
                        class: 'mga-icon',
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                    });
                    const zoomPrimaryPath = createSvgElement('path', {
                        d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
                    });
                    const zoomSecondaryPath = createSvgElement('path', {
                        d: 'M10 9h-1v-1H8v1H7v1h1v1h1v-1h1V9z',
                    });
                    zoomIcon.appendChild(zoomPrimaryPath);
                    zoomIcon.appendChild(zoomSecondaryPath);
                    zoomButton.appendChild(zoomIcon);
                }

                if (showDownload) {
                    const downloadButton = document.createElement('button');
                    downloadButton.type = 'button';
                    downloadButton.id = 'mga-download';
                    downloadButton.className = 'mga-toolbar-button';
                    downloadButton.setAttribute('aria-label', mga__( 'Télécharger l’image', 'lightbox-jlg' ));
                    toolbar.appendChild(downloadButton);

                    const downloadIcon = createSvgElement('svg', {
                        class: 'mga-icon mga-download-icon',
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                    });
                    const downloadArrow = createSvgElement('path', {
                        d: 'M5 20h14v-2H5v2zm7-16l-5 5h3v4h4v-4h3l-5-5z',
                    });
                    downloadIcon.appendChild(downloadArrow);
                    downloadButton.appendChild(downloadIcon);
                }

                if (showShare) {
                    const shareButton = document.createElement('button');
                    shareButton.type = 'button';
                    shareButton.id = 'mga-share';
                    shareButton.className = 'mga-toolbar-button';
                    shareButton.setAttribute('aria-label', mga__( 'Partager l’image', 'lightbox-jlg' ));
                    shareButton.setAttribute('aria-haspopup', 'dialog');
                    shareButton.setAttribute('aria-expanded', 'false');
                    toolbar.appendChild(shareButton);

                    const shareIcon = createSvgElement('svg', {
                        class: 'mga-icon mga-share-icon',
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                    });
                    const sharePath = createSvgElement('path', {
                        d: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11A2.99 2.99 0 0 0 18 7.91c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.03.47.09.7L8.07 9.7A2.99 2.99 0 0 0 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.03-.82l7.05 4.12c-.06.23-.08.46-.08.7 0 1.65 1.34 2.99 3 2.99s3-1.34 3-2.99-1.34-3-3-3z',
                    });
                    shareIcon.appendChild(sharePath);
                    shareButton.appendChild(shareIcon);
                }

                if (showFullscreen) {
                    const fullscreenButton = document.createElement('button');
                    fullscreenButton.type = 'button';
                    fullscreenButton.id = 'mga-fullscreen';
                    fullscreenButton.className = 'mga-toolbar-button';
                    fullscreenButton.setAttribute('aria-label', mga__( 'Plein écran', 'lightbox-jlg' ));
                    toolbar.appendChild(fullscreenButton);

                    const fullscreenIcon = createSvgElement('svg', {
                        class: 'mga-icon',
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                    });
                    const fullscreenPath = createSvgElement('path', {
                        d: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5V14h-2v3zM14 5v2h3v3h2V5h-5z',
                    });
                    fullscreenIcon.appendChild(fullscreenPath);
                    fullscreenButton.appendChild(fullscreenIcon);
                }

                toolbar.setAttribute('data-mga-optional-buttons', String(optionalToolbarHandlers.length));

                const closeButton = document.createElement('button');
                closeButton.type = 'button';
                closeButton.id = 'mga-close';
                closeButton.className = 'mga-toolbar-button';
                closeButton.setAttribute('aria-label', mga__( 'Fermer', 'lightbox-jlg' ));
                toolbar.appendChild(closeButton);

                const closeIcon = createSvgElement('svg', {
                    class: 'mga-icon',
                    viewBox: '0 0 24 24',
                    fill: 'currentColor',
                });
                const closePath = createSvgElement('path', {
                    d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
                });
                closeIcon.appendChild(closePath);
                closeButton.appendChild(closeIcon);

                const mainSwiper = document.createElement('div');
                mainSwiper.className = 'swiper mga-main-swiper';
                viewer.appendChild(mainSwiper);

                const mainWrapper = document.createElement('div');
                mainWrapper.className = 'swiper-wrapper';
                mainWrapper.id = 'mga-main-wrapper';
                mainSwiper.appendChild(mainWrapper);

                const nextButton = document.createElement('button');
                nextButton.type = 'button';
                nextButton.className = 'swiper-button-next mga-nav-button';
                nextButton.id = 'mga-next';
                nextButton.setAttribute('aria-label', mga__( 'Image suivante', 'lightbox-jlg' ));
                nextButton.setAttribute('title', mga__( 'Image suivante', 'lightbox-jlg' ));
                mainSwiper.appendChild(nextButton);

                const prevButton = document.createElement('button');
                prevButton.type = 'button';
                prevButton.className = 'swiper-button-prev mga-nav-button';
                prevButton.id = 'mga-prev';
                prevButton.setAttribute('aria-label', mga__( 'Image précédente', 'lightbox-jlg' ));
                prevButton.setAttribute('title', mga__( 'Image précédente', 'lightbox-jlg' ));
                mainSwiper.appendChild(prevButton);

                const thumbsSwiper = document.createElement('div');
                thumbsSwiper.className = 'swiper mga-thumbs-swiper';
                viewer.appendChild(thumbsSwiper);

                const thumbsWrapper = document.createElement('div');
                thumbsWrapper.className = 'swiper-wrapper';
                thumbsWrapper.id = 'mga-thumbs-wrapper';
                thumbsSwiper.appendChild(thumbsWrapper);

                if (showShare) {
                    const createdShareModal = ensureShareModal(viewer);
                    if (createdShareModal) {
                        const shareButtonElement = viewer.querySelector('#mga-share');
                        if (shareButtonElement) {
                            shareButtonElement.setAttribute('aria-controls', 'mga-share-modal');
                        }
                    }
                }

                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(viewer);
                }

                if (viewer && viewer.parentNode) debug.log(mga__( 'Viewer créé et ajouté au body avec succès.', 'lightbox-jlg' ));
                else debug.log(mga__( 'ERREUR CRITIQUE : Échec de la création du viewer !', 'lightbox-jlg' ), true);
            }
            return viewer;
        }

        // --- LOGIQUE PRINCIPALE ---
        debug.log(mga__( 'Script initialisé et prêt.', 'lightbox-jlg' ));
        debug.updateInfo('mga-debug-status', mga__( 'Prêt', 'lightbox-jlg' ), '#4CAF50');

        const defaultContentSelectors = [
            '.wp-block-post-content',
            '.entry-content',
            '.post-content',
            '.site-main',
            '.content-area',
            'main',
            '.hentry',
            '#primary',
            '#main'
        ];
        const configuredSelectors = Array.isArray(settings.contentSelectors) ? settings.contentSelectors : [];
        const contentSelectors = Array.from(
            new Set(configuredSelectors.concat(defaultContentSelectors).filter(Boolean))
        );
        let contentArea = null;
        let foundSelector = mga__( 'Aucune zone détectée', 'lightbox-jlg' );
        for (const selector of contentSelectors) {
            let area = null;

            try {
                area = document.querySelector(selector);
            } catch (error) {
                const errorMessage = mgaSprintf(
                    mga__( 'Sélecteur CSS invalide ignoré : %s', 'lightbox-jlg' ),
                    selector
                );
                const errorDetails = error && error.message ? ` (${error.message})` : '';
                const logMessage = `${errorMessage}${errorDetails}`;

                if (debug && typeof debug.log === 'function') {
                    debug.log(logMessage, true);
                } else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
                    console.warn(logMessage);
                }

                continue;
            }

            if (area) {
                contentArea = area;
                foundSelector = selector;
                break;
            }
        }

        if (!contentArea && settings.allowBodyFallback === true && document.body) {
            contentArea = document.body;
            foundSelector = mga__( '<body> (opt-in fallback)', 'lightbox-jlg' );
        }

        if (!contentArea) {
            debug.updateInfo('mga-debug-content-area', foundSelector, '#F44336');
            debug.log(mga__( 'Aucune zone de contenu valide détectée. Initialisation du diaporama interrompue.', 'lightbox-jlg' ), true);
            return;
        }

        debug.updateInfo('mga-debug-content-area', foundSelector, '#4CAF50');
        
        const FALLBACK_GROUP_ID = '__mga-default-group__';
        const configuredGroupAttribute = typeof settings.groupAttribute === 'string'
            ? settings.groupAttribute.trim()
            : '';

        const REL_GROUP_PREFIX = 'mga-group:';
        const GENERIC_REL_TOKENS = new Set(['nofollow', 'noreferrer', 'noopener', 'opener', 'external']);

        const extractRelGroupToken = (relValue) => {
            if (typeof relValue !== 'string') {
                return null;
            }

            const tokens = relValue
                .split(/\s+/)
                .map(token => token.trim())
                .filter(Boolean);

            for (const token of tokens) {
                if (token.toLowerCase().startsWith(REL_GROUP_PREFIX)) {
                    const suffix = token.slice(REL_GROUP_PREFIX.length).trim();
                    if (suffix) {
                        return suffix;
                    }
                }
            }

            for (const token of tokens) {
                const normalized = token.toLowerCase();
                if (!normalized || GENERIC_REL_TOKENS.has(normalized)) {
                    continue;
                }

                if (normalized.includes(':')) {
                    continue;
                }

                return token;
            }

            return null;
        };

        const resolveLinkGroupId = (link) => {
            if (!(link instanceof Element)) {
                return FALLBACK_GROUP_ID;
            }

            const relGroupToken = extractRelGroupToken(link.getAttribute('rel'));
            if (relGroupToken) {
                return `rel:${relGroupToken}`;
            }

            const attributeCandidates = [];

            if (configuredGroupAttribute) {
                attributeCandidates.push(configuredGroupAttribute);
            }

            attributeCandidates.push('data-mga-gallery');

            const normalizedConfiguredGroupAttribute = configuredGroupAttribute
                ? configuredGroupAttribute.toLowerCase()
                : '';

            for (const attrName of attributeCandidates) {
                if (!attrName) {
                    continue;
                }

                if (attrName.toLowerCase() === 'rel') {
                    continue;
                }

                const rawValue = link.getAttribute(attrName);
                if (typeof rawValue !== 'string') {
                    continue;
                }

                const trimmed = rawValue.trim();
                if (!trimmed) {
                    continue;
                }

                return `${attrName}:${trimmed}`;
            }

            if (normalizedConfiguredGroupAttribute === 'href') {
                const hrefValue = link.getAttribute('href');
                if (typeof hrefValue === 'string') {
                    const trimmedHref = hrefValue.trim();
                    if (trimmedHref) {
                        return `href:${trimmedHref}`;
                    }
                }
            }

            return FALLBACK_GROUP_ID;
        };

        const getTriggerLinks = (shouldUpdateDebug = true) => {
            const links = Array.from(contentArea.querySelectorAll('a')).filter(a => a.querySelector('img'));
            const grouped = links.reduce((accumulator, link) => {
                const groupId = resolveLinkGroupId(link);
                if (!accumulator[groupId]) {
                    accumulator[groupId] = [];
                }
                accumulator[groupId].push(link);
                return accumulator;
            }, {});

            if (shouldUpdateDebug) {
                const groupCount = Object.keys(grouped).length;
                const summary = `${links.length} (${groupCount} groupe${groupCount > 1 ? 's' : ''} après filtrage)`;
                debug.updateInfo('mga-debug-trigger-img', summary);
            }

            return grouped;
        };

        const sharedHelpers = {
            resolveLinkGroupId,
            isExplicitFallbackAllowed,
            sanitizeHighResUrl,
            sanitizeThumbnailUrl,
            resolveThumbnailUrl,
            getImageDataAttributes,
        };

        if (typeof module !== 'undefined' && module.exports) {
            module.exports.helpers = sharedHelpers;
        }

        const { cleanup: triggerObserverCleanup, active: hasActiveObserver } = (() => {
            if (typeof MutationObserver !== 'function') {
                return { cleanup: noop, active: false };
            }

            if (!debug.enabled) {
                return { cleanup: noop, active: false };
            }

            const observer = new MutationObserver(() => {
                getTriggerLinks();
            });

            observer.observe(contentArea, { childList: true, subtree: true });

            return {
                cleanup: () => observer.disconnect(),
                active: true,
            };
        })();

        getTriggerLinks();

        if (hasActiveObserver) {
            window.addEventListener('beforeunload', triggerObserverCleanup);
        }

        debug.onForceOpen(() => {
            debug.log(mga__( "Clic sur 'Forcer l'ouverture'.", 'lightbox-jlg' ));
            const testImages = [
                {
                    highResUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%230073aa%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2248%22%20fill%3D%22%23ffffff%22%3EImage%20Test%201%3C%2Ftext%3E%3C%2Fsvg%3E',
                    thumbUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%230073aa%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2218%22%20fill%3D%22%23ffffff%22%3EThumb%201%3C%2Ftext%3E%3C%2Fsvg%3E',
                    caption: mga__( 'Ceci est la première image de test.', 'lightbox-jlg' ),
                },
                {
                    highResUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23f44336%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23ff9800%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2248%22%20fill%3D%22%23ffffff%22%3EImage%20Test%202%3C%2Ftext%3E%3C%2Fsvg%3E',
                    thumbUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22gradThumb%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23f44336%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23ff9800%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22url(%23gradThumb)%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2218%22%20fill%3D%22%23ffffff%22%3EThumb%202%3C%2Ftext%3E%3C%2Fsvg%3E',
                    caption: mga__( 'Ceci est la seconde image de test.', 'lightbox-jlg' ),
                },
            ];
            const previouslyFocusedElement = document.activeElement;
            lastFocusedElementBeforeViewer = previouslyFocusedElement;
            const viewerOpened = openViewer(testImages, 0);
            if (!viewerOpened) {
                lastFocusedElementBeforeViewer = null;
            }
        });

        contentArea.addEventListener('click', function (e) {
            if (e.defaultPrevented) {
                return;
            }

            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            const eventTarget = resolveEventTarget(e);
            if (!eventTarget) {
                return;
            }

            const targetLink = eventTarget.closest('a');
            if (!targetLink) {
                return;
            }

            const linkTarget = targetLink.getAttribute('target');
            if (typeof linkTarget === 'string' && linkTarget.toLowerCase() === '_blank') {
                return;
            }

            if (targetLink.hasAttribute('download')) {
                return;
            }

            if (targetLink.querySelector('img')) {
                debug.log(mga__( 'Clic sur un lien contenant une image.', 'lightbox-jlg' ));

                const clickedHighResUrl = getHighResUrl(targetLink);
                if (!clickedHighResUrl) {
                    debug.log(mga__( "URL haute résolution introuvable pour le lien cliqué.", 'lightbox-jlg' ));
                    return;
                }

                const groupedTriggerLinks = getTriggerLinks();
                const clickedGroupId = resolveLinkGroupId(targetLink);
                const triggerLinks = groupedTriggerLinks[clickedGroupId] || [];

                debug.log(mgaSprintf(
                    mga__( 'Préparation de la galerie pour le groupe %s.', 'lightbox-jlg' ),
                    clickedGroupId,
                ));

                const clickedTriggerIndex = triggerLinks.indexOf(targetLink);
                if (clickedTriggerIndex === -1) {
                    debug.log(mga__( "ERREUR : Lien déclencheur introuvable dans la collection actuelle.", 'lightbox-jlg' ), true);
                    return;
                }

                const galleryData = [];
                triggerLinks.forEach((link, index) => {
                    const innerImg = link.querySelector('img');
                    if (!innerImg) return;

                    const highResUrl = getHighResUrl(link);
                    if (!highResUrl) return;

                    const thumbUrl = resolveThumbnailUrl(innerImg);

                    if (!thumbUrl) {
                        return;
                    }

                    let caption = '';
                    const figure = link.closest('figure');
                    if (figure) {
                        const figcaption = figure.querySelector('figcaption');
                        if (figcaption) caption = figcaption.textContent.trim();
                    }
                    if (!caption) {
                        caption = innerImg.alt || '';
                    }

                    galleryData.push({ highResUrl, thumbUrl, caption, triggerIndex: index });
                });

                debug.log(mgaSprintf(mga__( '%d images valides préparées pour la galerie.', 'lightbox-jlg' ), galleryData.length));
                debug.table(galleryData);

                const startIndex = galleryData.findIndex(img => img.triggerIndex === clickedTriggerIndex);

                if (startIndex !== -1) {
                    const previouslyFocusedElement = document.activeElement;
                    lastFocusedElementBeforeViewer = previouslyFocusedElement;
                    const viewerOpened = openViewer(galleryData, startIndex);
                    if (viewerOpened) {
                        e.preventDefault();
                    } else {
                        lastFocusedElementBeforeViewer = null;
                    }
                } else {
                    debug.log(mga__( "ERREUR : L'image cliquée n'a pas été trouvée dans la galerie construite.", 'lightbox-jlg' ), true);
                    debug.log(mgaSprintf(mga__( 'URL cliquée recherchée : %s', 'lightbox-jlg' ), clickedHighResUrl), true);
                }
            }
        });

        function openViewer(images, startIndex) {
            debug.log(mgaSprintf(mga__( 'openViewer appelé avec %1$d images, index %2$d.', 'lightbox-jlg' ), images.length, startIndex));
            if (debug && typeof debug.restartTimer === 'function') {
                debug.restartTimer();
            }
            const viewer = getViewer();
            if (!viewer) return false;

            viewer.className = 'mga-viewer';
            viewer.classList.toggle('mga-has-caption', false);
            if (settings.background_style === 'blur') viewer.classList.add('mga-has-blur');
            if (settings.background_style === 'texture') viewer.classList.add('mga-has-texture');
            if (!showThumbsMobile) {
                viewer.classList.add('mga-hide-thumbs-mobile');
            }

            try {
                if (mainSwiper) {
                    mainSwiper.destroy(true, true);
                }
                if (thumbsSwiper) {
                    thumbsSwiper.destroy(true, true);
                }
                mainSwiper = null;
                thumbsSwiper = null;
                preloadedUrls.clear();

                const mainWrapper = viewer.querySelector('#mga-main-wrapper');
                const thumbsWrapper = viewer.querySelector('#mga-thumbs-wrapper');
                mainWrapper.textContent = '';
                thumbsWrapper.textContent = '';

                const createThumbAriaLabel = (image, position) => {
                    if (image && image.caption) {
                        return mgaSprintf(
                            mga__( 'Afficher la diapositive %s : %s', 'lightbox-jlg' ),
                            String(position),
                            image.caption
                        );
                    }

                    return mgaSprintf(
                        mga__( 'Afficher la diapositive %s', 'lightbox-jlg' ),
                        String(position)
                    );
                };

                const handleThumbNavigation = (targetIndex) => {
                    if (mainSwiper && !mainSwiper.destroyed) {
                        if (typeof mainSwiper.slideToLoop === 'function') {
                            mainSwiper.slideToLoop(targetIndex);
                        } else if (typeof mainSwiper.slideTo === 'function') {
                            mainSwiper.slideTo(targetIndex);
                        }
                    }

                    if (thumbsSwiper && !thumbsSwiper.destroyed && typeof thumbsSwiper.slideTo === 'function') {
                        thumbsSwiper.slideTo(targetIndex);
                    }
                };

                images.forEach((img, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.setAttribute('data-slide-index', index);

                    const spinner = document.createElement('div');
                    spinner.className = 'mga-spinner';
                    spinner.style.display = 'none';
                    slide.appendChild(spinner);

                    const zoomContainer = document.createElement('div');
                    zoomContainer.className = 'swiper-zoom-container';

                    const mainImg = document.createElement('img');
                    mainImg.setAttribute('loading', 'lazy');
                    mainImg.setAttribute('src', img.highResUrl);
                    mainImg.setAttribute('alt', img.caption);
                    zoomContainer.appendChild(mainImg);

                    slide.appendChild(zoomContainer);
                    mainWrapper.appendChild(slide);

                    const thumbSlide = document.createElement('div');
                    thumbSlide.className = 'swiper-slide';

                    const thumbButton = document.createElement('button');
                    thumbButton.type = 'button';
                    thumbButton.className = 'mga-thumb-button';
                    thumbButton.setAttribute('data-slide-index', String(index));
                    thumbButton.setAttribute('aria-label', createThumbAriaLabel(img, index + 1));

                    const thumbImg = document.createElement('img');
                    thumbImg.setAttribute('loading', 'lazy');
                    thumbImg.setAttribute('src', img.thumbUrl);
                    thumbImg.setAttribute('alt', img.caption);
                    thumbButton.appendChild(thumbImg);

                    const activateThumb = (event) => {
                        if (event) {
                            event.preventDefault();
                        }
                        handleThumbNavigation(index);
                    };

                    thumbButton.addEventListener('click', activateThumb);

                    thumbSlide.appendChild(thumbButton);

                    thumbsWrapper.appendChild(thumbSlide);
                });
                debug.log(mga__( 'Wrappers HTML remplis avec URLs optimisées.', 'lightbox-jlg' ));

                initSwiper(viewer, images);
                if (!mainSwiper) {
                    const cancelMessage = mga__( 'Visionneuse annulée : Swiper n’a pas pu être initialisé.', 'lightbox-jlg' );
                    if (debug && typeof debug.log === 'function') {
                        debug.log(cancelMessage, true);
                    } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
                        console.error(cancelMessage);
                    }
                    viewer.style.display = 'none';
                    return false;
                }

                currentGalleryImages = Array.isArray(images) ? images : [];

                if (typeof mainSwiper.slideToLoop === 'function') {
                    mainSwiper.slideToLoop(startIndex, 0);
                } else if (typeof mainSwiper.slideTo === 'function') {
                    mainSwiper.slideTo(startIndex, 0);
                }
                if (settings.background_style === 'echo' && images[startIndex] && images[startIndex].highResUrl) {
                    updateEchoBackground(viewer, images[startIndex].highResUrl);
                }
                updateInfo(viewer, images, startIndex);
                viewer.style.display = 'flex';
                if (!lastFocusedElementBeforeViewer) {
                    lastFocusedElementBeforeViewer = document.activeElement;
                }
                setupViewerFocusManagement(viewer);
                const previousOverflow = document.body.style.overflow;
                const previousPaddingRight = document.body.style.paddingRight;
                initialBodyOverflow = previousOverflow;
                initialBodyPaddingRight = previousPaddingRight;

                let computedPaddingRight = 0;
                if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                    const bodyComputedStyle = window.getComputedStyle(document.body);
                    computedPaddingRight = parseFloat(bodyComputedStyle.paddingRight) || 0;
                } else if (previousPaddingRight) {
                    const parsedPadding = parseFloat(previousPaddingRight);
                    computedPaddingRight = Number.isNaN(parsedPadding) ? 0 : parsedPadding;
                }

                const scrollbarWidth = (typeof window !== 'undefined' && typeof window.innerWidth === 'number' && typeof document !== 'undefined' && document.documentElement)
                    ? Math.max(window.innerWidth - document.documentElement.clientWidth, 0)
                    : 0;

                if (scrollbarWidth > 0) {
                    document.body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
                    bodyPaddingRightWasModified = true;
                } else {
                    bodyPaddingRightWasModified = false;
                }

                if (document.body.classList.contains(SCROLL_LOCK_CLASS)) {
                    bodyScrollLockClassAdded = false;
                } else {
                    document.body.classList.add(SCROLL_LOCK_CLASS);
                    bodyScrollLockClassAdded = true;
                }

                if (previousOverflow !== 'hidden') {
                    document.body.style.overflow = 'hidden';
                    bodyOverflowWasModified = true;
                } else {
                    bodyOverflowWasModified = false;
                }
                debug.log(mga__( 'Galerie affichée avec succès.', 'lightbox-jlg' ));
                if (!isResizeListenerAttached) {
                    window.addEventListener('resize', handleResize);
                    isResizeListenerAttached = true;
                }
                return true;
            } catch (error) {
                debug.log(mgaSprintf(mga__( 'ERREUR dans openViewer : %s', 'lightbox-jlg' ), error.message), true);
                console.error(error);
                viewer.style.display = 'none';
                return false;
            }
        }

        function getFocusableViewerElements(viewer) {
            const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            return Array.from(viewer.querySelectorAll(selectors)).filter(element => {
                if (element.disabled) return false;
                if (element.getAttribute('aria-hidden') === 'true') return false;
                const rect = element.getBoundingClientRect();
                return !!(rect.width || rect.height || element.getClientRects().length);
            });
        }

        function setupViewerFocusManagement(viewer) {
            if (!viewer.hasAttribute('tabindex')) {
                viewer.setAttribute('tabindex', '-1');
            }

            if (viewerFocusTrapHandler) {
                viewer.removeEventListener('keydown', viewerFocusTrapHandler, true);
            }

            viewerFocusTrapHandler = function(e) {
                if (e.key !== 'Tab') return;

                const focusable = getFocusableViewerElements(viewer);

                if (!focusable.length) {
                    e.preventDefault();
                    safeFocus(viewer);
                    return;
                }

                const currentIndex = focusable.indexOf(document.activeElement);
                let nextIndex = currentIndex;

                if (e.shiftKey) {
                    if (currentIndex <= 0) {
                        nextIndex = focusable.length - 1;
                    } else {
                        nextIndex = currentIndex - 1;
                    }
                } else {
                    if (currentIndex === -1 || currentIndex === focusable.length - 1) {
                        nextIndex = 0;
                    } else {
                        nextIndex = currentIndex + 1;
                    }
                }

                e.preventDefault();
                safeFocus(focusable[nextIndex]);
            };

            viewer.addEventListener('keydown', viewerFocusTrapHandler, true);

            const closeButton = viewer.querySelector('#mga-close');
            const target = closeButton && closeButton.offsetParent !== null ? closeButton : viewer;
            if (target && typeof target.focus === 'function') {
                safeFocus(target);
            }
        }

        function initSwiper(viewer, images) {
            if (typeof cleanupAutoplayPreferenceListener === 'function') {
                cleanupAutoplayPreferenceListener();
                cleanupAutoplayPreferenceListener = null;
            }
            autoplayWasRunningBeforePreferenceChange = false;

            const sanitizedEffect = sanitizeEffect(settings.effect);
            const sanitizedSpeed = sanitizeSpeed(settings.speed);
            const sanitizedEasing = sanitizeEasing(settings.easing);

            const mainSwiperContainer = viewer.querySelector('.mga-main-swiper');
            const thumbsSwiperContainer = viewer.querySelector('.mga-thumbs-swiper');

            thumbsSwiper = createSwiperInstance(thumbsSwiperContainer, {
                spaceBetween: 10,
                slidesPerView: 'auto',
                freeMode: true,
                watchSlidesProgress: true,
                passiveListeners: true,
            });

            if (thumbsSwiper) {
                applyTransitionEasing(thumbsSwiper, sanitizedEasing);
            }

            if (!thumbsSwiper) {
                const thumbsMessage = mga__( 'Initialisation des miniatures Swiper impossible. La visionneuse fonctionnera sans elles.', 'lightbox-jlg' );
                if (debug && typeof debug.log === 'function') {
                    debug.log(thumbsMessage, true);
                } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
                    console.error(thumbsMessage);
                }
            }

            // L'instance principale peut activer `loop` en fonction des réglages.
            // On passe par le wrapper pour atténuer l'avertissement Swiper localement.
            const autoplayConfig = {
                delay: parseInt(settings.delay, 10) * 1000 || 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
            };

            const prefersReducedMotionQuery = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
                ? window.matchMedia('(prefers-reduced-motion: reduce)')
                : null;

            const prefersReducedMotion = !!(prefersReducedMotionQuery && prefersReducedMotionQuery.matches);

            let resolvedEffect = sanitizedEffect;
            let resolvedSpeed = sanitizedSpeed;
            let enableCssMode = false;

            if (prefersReducedMotion) {
                enableCssMode = true;

                if (HEAVY_EFFECTS.has(resolvedEffect)) {
                    if (debug && typeof debug.log === 'function') {
                        debug.log(mga__( 'Effet 3D désactivé pour respecter la préférence de réduction des animations.', 'lightbox-jlg' ));
                    }
                    resolvedEffect = DEFAULT_EFFECT;
                }

                resolvedSpeed = Math.min(resolvedSpeed, 300);
            }

            const shouldUseCssMode = enableCssMode && resolvedEffect === 'slide';

            const handleAutoplayStart = () => {
                debug.log(mga__( 'Autoplay DÉMARRÉ.', 'lightbox-jlg' ));
                viewer.querySelector('.mga-play-icon').style.display = 'none';
                viewer.querySelector('.mga-pause-icon').style.display = 'inline-block';
                updateAutoplayButtonState(viewer, true);
            };

            const handleAutoplayStop = () => {
                debug.log(mga__( 'Autoplay ARRÊTÉ.', 'lightbox-jlg' ));
                viewer.querySelector('.mga-play-icon').style.display = 'inline-block';
                viewer.querySelector('.mga-pause-icon').style.display = 'none';
                const progressCircle = viewer.querySelector('.mga-timer-progress');
                if (progressCircle) {
                    progressCircle.style.strokeDashoffset = 100;
                }
                debug.updateInfo('mga-debug-autoplay-time', mga__( 'Stoppé', 'lightbox-jlg' ));
                updateAutoplayButtonState(viewer, false);
            };

            const mainSwiperConfig = {
                zoom: showZoom,
                spaceBetween: 10,
                loop: !!settings.loop,
                effect: resolvedEffect,
                speed: resolvedSpeed,
                cssMode: shouldUseCssMode,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                on: {
                    init: function(swiper) {
                        preloadNeighboringImages(images, swiper.realIndex);
                    },
                    slideChange: function (swiper) { 
                        updateInfo(viewer, images, swiper.realIndex);
                        if (settings.background_style === 'echo') updateEchoBackground(viewer, images[swiper.realIndex].highResUrl);
                    },
                    slideChangeTransitionEnd: function() {
                        if (thumbsSwiper && !thumbsSwiper.destroyed) {
                           thumbsSwiper.update();
                        }
                        preloadNeighboringImages(images, this.realIndex);
                    },
                    autoplayTimeLeft(s, time, progress) {
                        const progressCircle = viewer.querySelector('.mga-timer-progress');
                        if (progressCircle) progressCircle.style.strokeDashoffset = 100 - (progress * 100);
                        debug.updateInfo('mga-debug-autoplay-time', mgaSprintf(mga__( '%ss', 'lightbox-jlg' ), (time / 1000).toFixed(2)));
                    },
                    slideChangeTransitionStart: function(swiper) {
                        const slide = swiper.slides[swiper.activeIndex];
                        const img = slide.querySelector('img');
                        if (img && !img.complete) {
                            debug.log(mgaSprintf(mga__( "Chargement de l'image %s...", 'lightbox-jlg' ), slide.dataset.slideIndex));
                            slide.querySelector('.mga-spinner').style.display = 'block';
                            img.onload = () => {
                                debug.log(mgaSprintf(mga__( 'Image %s chargée.', 'lightbox-jlg' ), slide.dataset.slideIndex));
                                slide.querySelector('.mga-spinner').style.display = 'none';
                            };
                        }
                    },
                    autoplayStart: handleAutoplayStart,
                    autoplayStop: handleAutoplayStop,
                    touchStart: () => { debug.log(mga__( 'Interaction manuelle DÉTECTÉE (touch).', 'lightbox-jlg' )); },
                    sliderMove: () => { debug.log(mga__( 'Interaction manuelle DÉTECTÉE (drag).', 'lightbox-jlg' )); }
                },
            };

            if (resolvedEffect === 'fade') {
                mainSwiperConfig.fadeEffect = { crossFade: true };
            }

            if (!prefersReducedMotion) {
                mainSwiperConfig.autoplay = Object.assign({}, autoplayConfig);
            }

            if (thumbsSwiper) {
                mainSwiperConfig.thumbs = { swiper: thumbsSwiper };
            }

            const originalInitHandler = mainSwiperConfig.on.init;
            mainSwiperConfig.on.init = function(swiper) {
                if (typeof originalInitHandler === 'function') {
                    originalInitHandler.call(this, swiper);
                }
                applyTransitionEasing(swiper, sanitizedEasing);
            };

            const originalSetTransition = mainSwiperConfig.on.setTransition;
            mainSwiperConfig.on.setTransition = function(swiper) {
                if (typeof originalSetTransition === 'function') {
                    originalSetTransition.apply(this, arguments);
                }
                const targetSwiper = swiper && swiper.wrapperEl ? swiper : this;
                applyTransitionEasing(targetSwiper, sanitizedEasing);
            };

            if (typeof module !== 'undefined' && module.exports) {
                module.exports.__testExports = module.exports.__testExports || {};
                module.exports.__testExports.getAutoplayHandlers = () => ({
                    autoplayStart: handleAutoplayStart,
                    autoplayStop: handleAutoplayStop,
                });
            }

            mainSwiper = createSwiperInstance(mainSwiperContainer, mainSwiperConfig);

            if (!mainSwiper) {
                const mainMessage = mga__( 'Initialisation du Swiper principal impossible. Visionneuse indisponible.', 'lightbox-jlg' );
                if (debug && typeof debug.log === 'function') {
                    debug.log(mainMessage, true);
                } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
                    console.error(mainMessage);
                }
                return;
            }

            applyTransitionEasing(mainSwiper, sanitizedEasing);

            const autoplayInstance = mainSwiper.autoplay;
            const hasAutoplayModule = !!(autoplayInstance && typeof autoplayInstance.start === 'function' && typeof autoplayInstance.stop === 'function');

            const applyAutoplayParams = () => {
                if (!mainSwiper || mainSwiper.destroyed) {
                    return;
                }

                if (mainSwiper.params && typeof mainSwiper.params === 'object') {
                    const paramsAutoplay = mainSwiper.params.autoplay && typeof mainSwiper.params.autoplay === 'object'
                        ? mainSwiper.params.autoplay
                        : (mainSwiper.params.autoplay = {});
                    Object.assign(paramsAutoplay, autoplayConfig);
                }

                if (mainSwiper.originalParams && typeof mainSwiper.originalParams === 'object') {
                    const originalAutoplay = mainSwiper.originalParams.autoplay && typeof mainSwiper.originalParams.autoplay === 'object'
                        ? mainSwiper.originalParams.autoplay
                        : (mainSwiper.originalParams.autoplay = {});
                    Object.assign(originalAutoplay, autoplayConfig);
                }
            };

            if (!hasAutoplayModule) {
                if (!prefersReducedMotion) {
                    debug.log(mga__( 'L’extension autoplay de Swiper est indisponible.', 'lightbox-jlg' ), true);
                }
            } else {
                if (!prefersReducedMotion) {
                    applyAutoplayParams();
                    if (settings.autoplay_start) {
                        autoplayInstance.start();
                    } else {
                        autoplayInstance.stop();
                    }
                } else {
                    autoplayInstance.stop();
                }

                if (prefersReducedMotionQuery) {
                    const handleReducedMotionChange = (event) => {
                        if (!mainSwiper || mainSwiper.destroyed) {
                            return;
                        }

                        const instance = mainSwiper.autoplay;
                        if (!instance || typeof instance.start !== 'function' || typeof instance.stop !== 'function') {
                            return;
                        }

                        const matchesReducedMotion = !!event.matches;
                        const targetEffect = matchesReducedMotion && HEAVY_EFFECTS.has(sanitizedEffect)
                            ? DEFAULT_EFFECT
                            : sanitizedEffect;
                        const targetSpeed = matchesReducedMotion ? Math.min(sanitizedSpeed, 300) : sanitizedSpeed;
                        const targetCssMode = matchesReducedMotion && targetEffect === 'slide';

                        if (matchesReducedMotion) {
                            autoplayWasRunningBeforePreferenceChange = Boolean(instance.running);
                            instance.stop();
                            if (targetEffect !== sanitizedEffect && debug && typeof debug.log === 'function') {
                                debug.log(mga__( 'Effet de transition réduit suite au changement de préférence système.', 'lightbox-jlg' ));
                            }
                        } else {
                            const shouldResume = autoplayWasRunningBeforePreferenceChange || !!settings.autoplay_start;
                            autoplayWasRunningBeforePreferenceChange = false;
                            applyAutoplayParams();
                            if (targetEffect !== sanitizedEffect && debug && typeof debug.log === 'function') {
                                debug.log(mga__( 'Effet de transition restauré après désactivation de la réduction des animations.', 'lightbox-jlg' ));
                            }
                            if (shouldResume) {
                                instance.start();
                            } else if (instance.running) {
                                instance.stop();
                            }
                        }

                        resolvedEffect = targetEffect;
                        resolvedSpeed = targetSpeed;

                        if (mainSwiper.params && typeof mainSwiper.params === 'object') {
                            mainSwiper.params.effect = targetEffect;
                            mainSwiper.params.speed = targetSpeed;
                            mainSwiper.params.cssMode = targetCssMode;

                            if (targetEffect === 'fade') {
                                mainSwiper.params.fadeEffect = Object.assign({}, mainSwiper.params.fadeEffect || {}, { crossFade: true });
                            } else if (mainSwiper.params.fadeEffect) {
                                delete mainSwiper.params.fadeEffect;
                            }
                        }

                        if (mainSwiper.originalParams && typeof mainSwiper.originalParams === 'object') {
                            mainSwiper.originalParams.effect = targetEffect;
                            mainSwiper.originalParams.speed = targetSpeed;
                            mainSwiper.originalParams.cssMode = targetCssMode;

                            if (targetEffect === 'fade') {
                                mainSwiper.originalParams.fadeEffect = Object.assign({}, mainSwiper.originalParams.fadeEffect || {}, { crossFade: true });
                            } else if (mainSwiper.originalParams.fadeEffect) {
                                delete mainSwiper.originalParams.fadeEffect;
                            }
                        }

                        applyTransitionEasing(mainSwiper, sanitizedEasing);
                        if (thumbsSwiper && !thumbsSwiper.destroyed) {
                            applyTransitionEasing(thumbsSwiper, sanitizedEasing);
                        }

                        if (typeof mainSwiper.update === 'function') {
                            mainSwiper.update();
                        }
                    };

                    if (typeof prefersReducedMotionQuery.addEventListener === 'function') {
                        prefersReducedMotionQuery.addEventListener('change', handleReducedMotionChange);
                        cleanupAutoplayPreferenceListener = () => {
                            prefersReducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
                        };
                    } else if (typeof prefersReducedMotionQuery.addListener === 'function') {
                        prefersReducedMotionQuery.addListener(handleReducedMotionChange);
                        cleanupAutoplayPreferenceListener = () => {
                            prefersReducedMotionQuery.removeListener(handleReducedMotionChange);
                        };
                    }
                }
            }
        }
        
        function preloadNeighboringImages(images, currentIndex) {
            const nextIndex = (currentIndex + 1) % images.length;
            const prevIndex = (currentIndex - 1 + images.length) % images.length;
            
            [nextIndex, prevIndex].forEach(index => {
                const imageUrl = images[index]?.highResUrl;
                if (imageUrl && !preloadedUrls.has(imageUrl)) {
                    debug.log(mgaSprintf(mga__( "Préchargement de l'image %s", 'lightbox-jlg' ), index));
                    const img = new Image();
                    img.src = imageUrl;
                    preloadedUrls.add(imageUrl);
                }
            });
        }

        function updateInfo(viewer, images, index) {
            if (!viewer || !images[index]) {
                return;
            }

            const captionContainer = viewer.querySelector('.mga-caption-container');
            const captionElement = viewer.querySelector('#mga-caption');
            const counterElement = viewer.querySelector('#mga-counter');
            const liveRegion = captionContainer ? captionContainer.querySelector('.mga-caption-live') : null;

            const imageData = images[index];
            const captionText = imageData.caption || '';
            viewer.classList.toggle('mga-has-caption', Boolean(captionText));
            const counterText = mgaSprintf(mga__( '%1$s / %2$s', 'lightbox-jlg' ), index + 1, images.length);
            const announcementCounterText = mgaSprintf(mga__( 'Image %1$s sur %2$s', 'lightbox-jlg' ), index + 1, images.length);
            const announcementText = captionText ? `${announcementCounterText}. ${captionText}` : announcementCounterText;

            if (captionElement) {
                captionElement.textContent = captionText;
                captionElement.style.display = captionText ? '' : 'none';
            }

            if (counterElement) {
                counterElement.textContent = counterText;
            }

            if (liveRegion && liveRegion.textContent !== announcementText) {
                liveRegion.textContent = announcementText;
            }
        }

        document.body.addEventListener('click', function(e) {
            const viewer = document.getElementById('mga-viewer');
            if (!viewer || viewer.style.display === 'none') return;
            const eventTarget = resolveEventTarget(e);
            if (!eventTarget) {
                return;
            }
            const clickedInsideViewer = viewer.contains(eventTarget);
            const clickedInsideMainSwiper = Boolean(eventTarget.closest('.mga-main-swiper'));
            const clickedInsideHeader = Boolean(eventTarget.closest('.mga-header'));
            const clickedInsideThumbs = Boolean(eventTarget.closest('.mga-thumbs-swiper'));

            if (
                eventTarget === viewer ||
                (clickedInsideViewer && !clickedInsideMainSwiper && !clickedInsideHeader && !clickedInsideThumbs)
            ) {
                closeViewer(viewer);
                return;
            }
            if (eventTarget.closest('#mga-close')) {
                closeViewer(viewer);
                return;
            }
            if (eventTarget.closest('#mga-play-pause')) {
                if (mainSwiper && mainSwiper.autoplay) {
                    const autoplayInstance = mainSwiper.autoplay;
                    const willRun = !autoplayInstance.running;
                    if (willRun) {
                        autoplayInstance.start();
                    } else {
                        autoplayInstance.stop();
                    }
                    updateAutoplayButtonState(viewer, willRun);
                }
            }
            if (optionalToolbarHandlers.length) {
                for (let i = 0; i < optionalToolbarHandlers.length; i += 1) {
                    const handlerConfig = optionalToolbarHandlers[i];
                    if (eventTarget.closest(handlerConfig.selector)) {
                        handlerConfig.handler(e, viewer);
                        return;
                    }
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            const viewer = document.getElementById('mga-viewer');
            if (!viewer || viewer.style.display === 'none') return;
            switch (e.key) {
                case 'Escape': closeViewer(viewer); break;
                case 'ArrowLeft': if (mainSwiper) mainSwiper.slidePrev(); break;
                case 'ArrowRight': if (mainSwiper) mainSwiper.slideNext(); break;
            }
        });

        if (typeof module !== 'undefined' && module.exports) {
            module.exports.__testExports = module.exports.__testExports || {};
            module.exports.__testExports.openViewer = openViewer;
            module.exports.__testExports.getViewer = getViewer;
            module.exports.__testExports.getActiveHighResUrl = getActiveHighResUrl;
            module.exports.__testExports.triggerImageDownload = triggerImageDownload;
            module.exports.__testExports.openSharePanel = openSharePanel;
            module.exports.__testExports.getActiveImageData = getActiveImageData;
            module.exports.__testExports.getShareChannels = () => shareChannels;
            module.exports.__testExports.getShareOptions = () => (shareModal && Array.isArray(shareModal.options)) ? shareModal.options : [];
        }

        function closeViewer(viewer) {
            const { exit: exitFullscreen, element: fullscreenElement } = resolveFullscreenApi(viewer);
            if (fullscreenElement) {
                if (exitFullscreen) {
                    try {
                        const result = exitFullscreen();
                        if (result && typeof result.catch === 'function') {
                            result.catch(err => debug.log(mgaSprintf(mga__( 'Erreur de sortie du plein écran : %s', 'lightbox-jlg' ), err.message), true));
                        }
                    } catch (err) {
                        debug.log(mgaSprintf(mga__( 'Erreur de sortie du plein écran : %s', 'lightbox-jlg' ), err.message), true);
                    }
                } else {
                    debug.log(mga__( 'API de fermeture du plein écran indisponible sur ce navigateur.', 'lightbox-jlg' ), true);
                }
            }
            if(mainSwiper && mainSwiper.autoplay) {
                mainSwiper.autoplay.stop();
            }
            closeShareModal({ restoreFocus: false, reason: 'viewer-close' });
            resetShareModalFeedback();
            if (typeof cleanupAutoplayPreferenceListener === 'function') {
                cleanupAutoplayPreferenceListener();
                cleanupAutoplayPreferenceListener = null;
            }
            autoplayWasRunningBeforePreferenceChange = false;
            window.removeEventListener('resize', handleResize);
            isResizeListenerAttached = false;
            if (viewerFocusTrapHandler) {
                viewer.removeEventListener('keydown', viewerFocusTrapHandler, true);
                viewerFocusTrapHandler = null;
            }
            viewer.style.display = 'none';
            if (bodyPaddingRightWasModified) {
                document.body.style.paddingRight = initialBodyPaddingRight;
            }
            if (bodyOverflowWasModified) {
                document.body.style.overflow = initialBodyOverflow;
            }
            if (bodyScrollLockClassAdded) {
                document.body.classList.remove(SCROLL_LOCK_CLASS);
            }
            initialBodyOverflow = null;
            initialBodyPaddingRight = null;
            bodyOverflowWasModified = false;
            bodyPaddingRightWasModified = false;
            bodyScrollLockClassAdded = false;
            debug.log(mga__( 'Galerie fermée.', 'lightbox-jlg' ));
            debug.stopTimer();
            currentGalleryImages = [];
            if (lastFocusedElementBeforeViewer && typeof lastFocusedElementBeforeViewer.focus === 'function') {
                safeFocus(lastFocusedElementBeforeViewer);
            }
            lastFocusedElementBeforeViewer = null;
        }

        function handleResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (mainSwiper && mainSwiper.el && !mainSwiper.destroyed) {
                    const autoplayInstance = mainSwiper.autoplay;
                    const wasRunning = Boolean(autoplayInstance && autoplayInstance.running);
                    debug.log(mga__( 'Redimensionnement détecté. Mise à jour de Swiper.', 'lightbox-jlg' ));
                    mainSwiper.update();
                    if(thumbsSwiper && !thumbsSwiper.destroyed) thumbsSwiper.update();
                    if (wasRunning && mainSwiper.autoplay && typeof mainSwiper.autoplay.start === 'function') {
                        mainSwiper.autoplay.start();
                        debug.log(mga__( 'Autoplay relancé après redimensionnement.', 'lightbox-jlg' ));
                    }
                }
            }, 250);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleryViewer);
    } else {
        initGalleryViewer();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports.updateEchoBackground = updateEchoBackground;
        module.exports.updateAutoplayButtonState = updateAutoplayButtonState;
    }
})();
