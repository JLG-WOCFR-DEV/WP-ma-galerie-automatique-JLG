(function() {
    "use strict";

    const mgaI18n = window.wp && window.wp.i18n ? window.wp.i18n : null;
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

    function initGalleryViewer() {
        const settings = window.mga_settings || {};
        const IMAGE_FILE_PATTERN = /\.(jpe?g|png|gif|bmp|webp|avif|svg)(?:\?.*)?(?:#.*)?$/i;
        const noop = () => {};
        const debug = window.mgaDebug || {
            enabled: false,
            init: noop,
            log: noop,
            updateInfo: noop,
            onForceOpen: noop,
            stopTimer: noop,
            restartTimer: noop,
            table: noop,
        };
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

        debug.init();

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
                header.appendChild(captionContainer);

                const caption = document.createElement('p');
                caption.id = 'mga-caption';
                caption.className = 'mga-caption';
                captionContainer.appendChild(caption);

                const toolbar = document.createElement('div');
                toolbar.className = 'mga-toolbar';
                header.appendChild(toolbar);

                const playPauseButton = document.createElement('button');
                playPauseButton.type = 'button';
                playPauseButton.id = 'mga-play-pause';
                playPauseButton.className = 'mga-toolbar-button';
                playPauseButton.setAttribute('aria-label', mga__( 'Play/Pause', 'lightbox-jlg' ));
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

                const nextButton = document.createElement('div');
                nextButton.className = 'swiper-button-next';
                mainSwiper.appendChild(nextButton);

                const prevButton = document.createElement('div');
                prevButton.className = 'swiper-button-prev';
                mainSwiper.appendChild(prevButton);

                const thumbsSwiper = document.createElement('div');
                thumbsSwiper.className = 'swiper mga-thumbs-swiper';
                viewer.appendChild(thumbsSwiper);

                const thumbsWrapper = document.createElement('div');
                thumbsWrapper.className = 'swiper-wrapper';
                thumbsWrapper.id = 'mga-thumbs-wrapper';
                thumbsSwiper.appendChild(thumbsWrapper);

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
        
        const getTriggerLinks = (shouldUpdateDebug = true) => {
            const links = Array.from(contentArea.querySelectorAll('a')).filter(a => a.querySelector('img'));
            if (shouldUpdateDebug) {
                debug.updateInfo('mga-debug-trigger-img', links.length);
            }
            return links;
        };

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

                const triggerLinks = getTriggerLinks();

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
            if (settings.background_style === 'blur') viewer.classList.add('mga-has-blur');
            if (settings.background_style === 'texture') viewer.classList.add('mga-has-texture');

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

                    const thumbImg = document.createElement('img');
                    thumbImg.setAttribute('loading', 'lazy');
                    thumbImg.setAttribute('src', img.thumbUrl);
                    thumbImg.setAttribute('alt', img.caption);
                    thumbSlide.appendChild(thumbImg);

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

            const mainSwiperContainer = viewer.querySelector('.mga-main-swiper');
            const thumbsSwiperContainer = viewer.querySelector('.mga-thumbs-swiper');

            thumbsSwiper = createSwiperInstance(thumbsSwiperContainer, {
                spaceBetween: 10,
                slidesPerView: 'auto',
                freeMode: true,
                watchSlidesProgress: true,
                passiveListeners: true,
            });

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

            const mainSwiperConfig = {
                zoom: true,
                spaceBetween: 10,
                loop: !!settings.loop,
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
                    autoplayStart: () => { debug.log(mga__( 'Autoplay DÉMARRÉ.', 'lightbox-jlg' )); viewer.querySelector('.mga-play-icon').style.display = 'none'; viewer.querySelector('.mga-pause-icon').style.display = 'inline-block'; },
                    autoplayStop: () => { debug.log(mga__( 'Autoplay ARRÊTÉ.', 'lightbox-jlg' )); viewer.querySelector('.mga-play-icon').style.display = 'inline-block'; viewer.querySelector('.mga-pause-icon').style.display = 'none'; const progressCircle = viewer.querySelector('.mga-timer-progress'); if (progressCircle) progressCircle.style.strokeDashoffset = 100; debug.updateInfo('mga-debug-autoplay-time', mga__( 'Stoppé', 'lightbox-jlg' )); },
                    touchStart: () => { debug.log(mga__( 'Interaction manuelle DÉTECTÉE (touch).', 'lightbox-jlg' )); },
                    sliderMove: () => { debug.log(mga__( 'Interaction manuelle DÉTECTÉE (drag).', 'lightbox-jlg' )); }
                },
            };

            if (!prefersReducedMotion) {
                mainSwiperConfig.autoplay = Object.assign({}, autoplayConfig);
            }

            if (thumbsSwiper) {
                mainSwiperConfig.thumbs = { swiper: thumbsSwiper };
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

                        if (matchesReducedMotion) {
                            autoplayWasRunningBeforePreferenceChange = Boolean(instance.running);
                            instance.stop();
                        } else {
                            const shouldResume = autoplayWasRunningBeforePreferenceChange || !!settings.autoplay_start;
                            autoplayWasRunningBeforePreferenceChange = false;
                            applyAutoplayParams();
                            if (shouldResume) {
                                instance.start();
                            } else if (instance.running) {
                                instance.stop();
                            }
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

        function updateEchoBackground(viewer, imageUrl) {
            const bgContainer = viewer.querySelector('.mga-echo-bg');
            if (!bgContainer) return;
            const newImg = document.createElement('img');
            newImg.className = 'mga-echo-bg__image';
            newImg.src = imageUrl;
            newImg.onload = () => {
                const oldImg = bgContainer.querySelector('.mga-visible');
                if (oldImg) {
                    oldImg.classList.remove('mga-visible');
                    setTimeout(() => { if(oldImg.parentElement) oldImg.parentElement.removeChild(oldImg); }, 400);
                }
                bgContainer.appendChild(newImg);
                setTimeout(() => newImg.classList.add('mga-visible'), 10);
            };
        }

        function updateInfo(viewer, images, index) {
            if (images[index]) {
                viewer.querySelector('#mga-caption').textContent = images[index].caption;
                viewer.querySelector('.mga-caption-container').style.visibility = images[index].caption ? 'visible' : 'hidden';
                viewer.querySelector('#mga-counter').textContent = mgaSprintf(mga__( '%1$s / %2$s', 'lightbox-jlg' ), index + 1, images.length);
            }
        }

        document.body.addEventListener('click', function(e) {
            const viewer = document.getElementById('mga-viewer');
            if (!viewer || viewer.style.display === 'none') return;
            const eventTarget = resolveEventTarget(e);
            if (!eventTarget) {
                return;
            }
            if (eventTarget.closest('#mga-close')) closeViewer(viewer);
            if (eventTarget.closest('#mga-play-pause')) { if (mainSwiper && mainSwiper.autoplay && mainSwiper.autoplay.running) mainSwiper.autoplay.stop(); else if (mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.start(); }
            if (eventTarget.closest('#mga-zoom')) { if (mainSwiper && mainSwiper.zoom) mainSwiper.zoom.toggle(); }
            if (eventTarget.closest('#mga-fullscreen')) {
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
})();
