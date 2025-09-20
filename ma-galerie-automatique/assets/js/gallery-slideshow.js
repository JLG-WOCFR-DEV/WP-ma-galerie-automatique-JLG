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

    document.addEventListener('DOMContentLoaded', function() {
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
            table: noop,
        };
        let mainSwiper = null;
        let thumbsSwiper = null;
        const preloadedUrls = new Set();
        let resizeTimeout;
        let isResizeListenerAttached = false;
        let initialBodyOverflow = null;
        let bodyOverflowWasModified = false;
        let lastFocusedElementBeforeViewer = null;
        let viewerFocusTrapHandler = null;

        debug.init();

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
            }
            const rel = linkElement.getAttribute('rel');
            if (rel && rel.split(/\s+/).includes('mga-allow-fallback')) {
                return true;
            }
            return false;
        }

        function getImageDataAttributes(innerImg) {
            if (!innerImg) return null;
            const attributes = [
                'data-mga-highres',
                'data-full-url',
                'data-large-file',
                'data-orig-file',
                'data-src',
                'data-lazy-src'
            ];
            for (const attr of attributes) {
                const value = innerImg.getAttribute(attr);
                if (value) {
                    return value;
                }
            }
            if (innerImg.dataset) {
                const datasetCandidates = ['mgaHighres', 'fullUrl', 'largeFile', 'origFile', 'src', 'lazySrc'];
                for (const candidate of datasetCandidates) {
                    if (innerImg.dataset[candidate]) {
                        return innerImg.dataset[candidate];
                    }
                }
            }
            return null;
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

            if (linkElement.dataset && linkElement.dataset.mgaHighres) {
                return linkElement.dataset.mgaHighres;
            }

            const innerImg = linkElement.querySelector('img');
            if (!innerImg) return null;

            const dataAttrUrl = getImageDataAttributes(innerImg);
            if (dataAttrUrl) {
                return dataAttrUrl;
            }

            const href = linkElement.getAttribute('href') || '';
            const isMediaHref = IMAGE_FILE_PATTERN.test(href);
            const fallbackAllowed = isMediaHref || isExplicitFallbackAllowed(linkElement);

            if (!fallbackAllowed) {
                return null;
            }

            const srcsetUrl = parseSrcset(innerImg);
            if (srcsetUrl) {
                return srcsetUrl;
            }

            if (innerImg.currentSrc) {
                return innerImg.currentSrc;
            }

            if (innerImg.src) {
                return innerImg.src;
            }

            if (isMediaHref) {
                return href;
            }

            return null;
        }

        function getViewer() {
            let viewer = document.getElementById('mga-viewer');
            if (!viewer) {
                debug.log(mga__( 'Viewer non trouvé. Création à la volée...', 'lightbox-jlg' ));
                const viewerHTML = `
                    <div id="mga-viewer" class="mga-viewer" style="display: none;" role="dialog" aria-modal="true">
                        <div class="mga-echo-bg"></div>
                        
                        <div class="mga-header">
                            <div id="mga-counter" class="mga-counter"></div>
                            <div class="mga-caption-container"><p id="mga-caption" class="mga-caption"></p></div>
                            <div class="mga-toolbar">
                                <button id="mga-play-pause" class="mga-toolbar-button" aria-label="${mga__( 'Play/Pause', 'lightbox-jlg' )}">
                                    <svg class="mga-timer-svg" viewBox="0 0 36 36"><path class="mga-timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="mga-timer-progress" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                    <svg class="mga-icon mga-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    <svg class="mga-icon mga-pause-icon" style="display:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                </button>
                                <button id="mga-zoom" class="mga-toolbar-button" aria-label="${mga__( 'Zoom', 'lightbox-jlg' )}"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/><path d="M10 9h-1v-1H8v1H7v1h1v1h1v-1h1V9z"/></svg></button>
                                <button id="mga-fullscreen" class="mga-toolbar-button" aria-label="${mga__( 'Plein écran', 'lightbox-jlg' )}"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5V14h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
                                <button id="mga-close" class="mga-toolbar-button" aria-label="${mga__( 'Fermer', 'lightbox-jlg' )}"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                            </div>
                        </div>

                        <div class="swiper mga-main-swiper"><div class="swiper-wrapper" id="mga-main-wrapper"></div><div class="swiper-button-next"></div><div class="swiper-button-prev"></div></div>
                        <div class="swiper mga-thumbs-swiper"><div class="swiper-wrapper" id="mga-thumbs-wrapper"></div></div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', viewerHTML);
                viewer = document.getElementById('mga-viewer');
                if (viewer) {
                    viewer.setAttribute('tabindex', '-1');
                }
                if (viewer) debug.log(mga__( 'Viewer créé et ajouté au body avec succès.', 'lightbox-jlg' ));
                else debug.log(mga__( 'ERREUR CRITIQUE : Échec de la création du viewer !', 'lightbox-jlg' ), true);
            }
            return viewer;
        }

        // --- LOGIQUE PRINCIPALE ---
        debug.log(mga__( 'Script initialisé et prêt.', 'lightbox-jlg' ));
        debug.updateInfo('mga-debug-status', mga__( 'Prêt', 'lightbox-jlg' ), '#4CAF50');

        const contentSelectors = ['.wp-block-post-content', '.entry-content', '.post-content'];
        let contentArea = document.body;
        let foundSelector = mga__( '<body> (fallback)', 'lightbox-jlg' );
        for (const selector of contentSelectors) {
            const area = document.querySelector(selector);
            if (area) {
                contentArea = area;
                foundSelector = selector;
                break;
            }
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
                { highResUrl: 'https://placehold.co/800x600/0073aa/ffffff?text=Image+Test+1', thumbUrl: 'https://placehold.co/150x150/0073aa/ffffff?text=Thumb+1', caption: mga__( 'Ceci est la première image de test.', 'lightbox-jlg' ) },
                { highResUrl: 'https://placehold.co/800x600/F44336/ffffff?text=Image+Test+2', thumbUrl: 'https://placehold.co/150x150/F44336/ffffff?text=Thumb+2', caption: mga__( 'Ceci est la seconde image de test.', 'lightbox-jlg' ) }
            ];
            lastFocusedElementBeforeViewer = document.activeElement;
            openViewer(testImages, 0);
        });

        contentArea.addEventListener('click', function (e) {
            if (e.defaultPrevented) {
                return;
            }

            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            const targetLink = e.target.closest('a');
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

                const galleryData = triggerLinks.map(link => {
                    const innerImg = link.querySelector('img');
                    if (!innerImg) return null;

                    const highResUrl = getHighResUrl(link);
                    if (!highResUrl) return null;

                    const thumbUrl = innerImg.src;

                    let caption = '';
                    const figure = link.closest('figure');
                    if (figure) {
                        const figcaption = figure.querySelector('figcaption');
                        if (figcaption) caption = figcaption.textContent.trim();
                    }
                    if (!caption) {
                        caption = innerImg.alt || '';
                    }

                    return { highResUrl, thumbUrl, caption };
                }).filter(Boolean);

                debug.log(mgaSprintf(mga__( '%d images valides préparées pour la galerie.', 'lightbox-jlg' ), galleryData.length));
                debug.table(galleryData);

                const startIndex = galleryData.findIndex(img => img.highResUrl === clickedHighResUrl);

                if (startIndex !== -1) {
                    e.preventDefault();
                    lastFocusedElementBeforeViewer = document.activeElement;
                    openViewer(galleryData, startIndex);
                } else {
                    debug.log(mga__( "ERREUR : L'image cliquée n'a pas été trouvée dans la galerie construite.", 'lightbox-jlg' ), true);
                    debug.log(mgaSprintf(mga__( 'URL cliquée recherchée : %s', 'lightbox-jlg' ), clickedHighResUrl), true);
                }
            }
        });

        function openViewer(images, startIndex) {
            debug.log(mgaSprintf(mga__( 'openViewer appelé avec %1$d images, index %2$d.', 'lightbox-jlg' ), images.length, startIndex));
            const viewer = getViewer();
            if (!viewer) return;

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
                    return;
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
                initialBodyOverflow = previousOverflow;
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
            } catch (error) {
                debug.log(mgaSprintf(mga__( 'ERREUR dans openViewer : %s', 'lightbox-jlg' ), error.message), true);
                console.error(error);
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
                    viewer.focus({ preventScroll: true });
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
                focusable[nextIndex].focus({ preventScroll: true });
            };

            viewer.addEventListener('keydown', viewerFocusTrapHandler, true);

            const closeButton = viewer.querySelector('#mga-close');
            const target = closeButton && closeButton.offsetParent !== null ? closeButton : viewer;
            if (target && typeof target.focus === 'function') {
                target.focus({ preventScroll: true });
            }
        }

        function initSwiper(viewer, images) {
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
            const mainSwiperConfig = {
                zoom: true,
                spaceBetween: 10,
                loop: !!settings.loop && images.length > 2,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                autoplay: {
                    delay: parseInt(settings.delay, 10) * 1000 || 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                },
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

            if (!mainSwiper.autoplay) {
                debug.log(mga__( 'L’extension autoplay de Swiper est indisponible.', 'lightbox-jlg' ), true);
            } else if (settings.autoplay_start) {
                mainSwiper.autoplay.start();
            } else {
                 mainSwiper.autoplay.stop();
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
            if (e.target.closest('#mga-close')) closeViewer(viewer);
            if (e.target.closest('#mga-play-pause')) { if (mainSwiper && mainSwiper.autoplay && mainSwiper.autoplay.running) mainSwiper.autoplay.stop(); else if (mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.start(); }
            if (e.target.closest('#mga-zoom')) { if (mainSwiper && mainSwiper.zoom) mainSwiper.zoom.toggle(); }
            if (e.target.closest('#mga-fullscreen')) {
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
            window.removeEventListener('resize', handleResize);
            isResizeListenerAttached = false;
            if (viewerFocusTrapHandler) {
                viewer.removeEventListener('keydown', viewerFocusTrapHandler, true);
                viewerFocusTrapHandler = null;
            }
            viewer.style.display = 'none';
            if (bodyOverflowWasModified) {
                document.body.style.overflow = initialBodyOverflow;
            }
            initialBodyOverflow = null;
            bodyOverflowWasModified = false;
            debug.log(mga__( 'Galerie fermée.', 'lightbox-jlg' ));
            debug.stopTimer();
            if (lastFocusedElementBeforeViewer && typeof lastFocusedElementBeforeViewer.focus === 'function') {
                lastFocusedElementBeforeViewer.focus({ preventScroll: true });
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
    });
})();
