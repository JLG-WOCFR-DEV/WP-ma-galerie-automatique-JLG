(function() {
    "use strict";

    document.addEventListener('DOMContentLoaded', function() {
        const settings = window.mga_settings || {};
        let debugPanel = null;
        let debugLogContainer = null;
        let mainSwiper = null;
        let thumbsSwiper = null;
        const preloadedUrls = new Set();
        let debugTimerInterval = null;
        let resizeTimeout;

        // --- FONCTIONS DE DÉBOGAGE ---
        function createDebugPanel() {
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
            debugLogContainer = panel.querySelector('#mga-debug-log');
            return panel;
        }

        function logDebug(message, isError = false) {
            const time = (performance.now() / 1000).toFixed(3);
            console[isError ? 'error' : 'log'](`MGA [${time}s]: ${message}`);
            if (!debugLogContainer) return;
            const p = document.createElement('p');
            p.style.cssText = `margin: 2px 5px; padding: 0; color: ${isError ? '#F44336' : '#4CAF50'}; font-size: 11px; word-break: break-all;`;
            p.innerHTML = `<span style="color:#888;">[${time}s]</span> > ${message}`;
            debugLogContainer.appendChild(p);
            debugLogContainer.scrollTop = debugLogContainer.scrollHeight;
        }

        function updateDebugInfo(key, value, color = '#fff') {
            if (!debugPanel) return;
            const el = document.getElementById(key);
            if (el) {
                el.textContent = value;
                el.style.color = color;
            }
        }
        
        // --- FONCTIONS UTILITAIRES ---
        function getHighResUrl(linkElement) {
            if (!linkElement) return null;
            if (/\.(jpe?g|png|gif|webp)$/i.test(linkElement.href)) return linkElement.href;
            const innerImg = linkElement.querySelector('img');
            if (innerImg && innerImg.srcset) {
                const sources = innerImg.srcset.split(',').map(s => {
                    const parts = s.trim().split(' ');
                    return { url: parts[0], width: parseInt(parts[1], 10) || 0 };
                }).filter(source => source.url && source.width > 0);
                if (sources.length > 0) {
                    sources.sort((a, b) => b.width - a.width);
                    return sources[0].url;
                }
            }
            if (innerImg) return innerImg.src;
            return null;
        }

        function getViewer() {
            let viewer = document.getElementById('mga-viewer');
            if (!viewer) {
                logDebug('Viewer non trouvé. Création à la volée...');
                const viewerHTML = `
                    <div id="mga-viewer" class="mga-viewer" style="display: none;" role="dialog" aria-modal="true">
                        <div class="mga-echo-bg"></div>
                        
                        <div class="mga-header">
                            <div id="mga-counter" class="mga-counter"></div>
                            <div class="mga-caption-container"><p id="mga-caption" class="mga-caption"></p></div>
                            <div class="mga-toolbar">
                                <button id="mga-play-pause" class="mga-toolbar-button" aria-label="Play/Pause">
                                    <svg class="mga-timer-svg" viewBox="0 0 36 36"><path class="mga-timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="mga-timer-progress" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                    <svg class="mga-icon mga-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    <svg class="mga-icon mga-pause-icon" style="display:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                </button>
                                <button id="mga-zoom" class="mga-toolbar-button" aria-label="Zoom"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/><path d="M10 9h-1v-1H8v1H7v1h1v1h1v-1h1V9z"/></svg></button>
                                <button id="mga-fullscreen" class="mga-toolbar-button" aria-label="Fullscreen"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5V14h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
                                <button id="mga-close" class="mga-toolbar-button" aria-label="Close"><svg class="mga-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                            </div>
                        </div>

                        <div class="swiper mga-main-swiper"><div class="swiper-wrapper" id="mga-main-wrapper"></div><div class="swiper-button-next"></div><div class="swiper-button-prev"></div></div>
                        <div class="swiper mga-thumbs-swiper"><div class="swiper-wrapper" id="mga-thumbs-wrapper"></div></div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', viewerHTML);
                viewer = document.getElementById('mga-viewer');
                if (viewer) logDebug('Viewer créé et ajouté au body avec succès.');
                else logDebug('ERREUR CRITIQUE: Échec de la création du viewer !', true);
            }
            return viewer;
        }

        // --- LOGIQUE PRINCIPALE ---
        if (settings.debug_mode) {
            debugPanel = createDebugPanel();
            let startTime = performance.now();
            debugTimerInterval = setInterval(() => {
                updateDebugInfo('mga-debug-realtime', ((performance.now() - startTime) / 1000).toFixed(2) + 's');
            }, 100);
        }

        logDebug('Script initialisé et prêt.');
        updateDebugInfo('mga-debug-status', 'Prêt', '#4CAF50');

        const contentSelectors = ['.wp-block-post-content', '.entry-content', '.post-content'];
        let contentArea = document.body;
        let foundSelector = '<body> (fallback)';
        for (const selector of contentSelectors) {
            const area = document.querySelector(selector);
            if (area) {
                contentArea = area;
                foundSelector = selector;
                break;
            }
        }
        updateDebugInfo('mga-debug-content-area', foundSelector, '#4CAF50');
        
        const triggerLinks = Array.from(contentArea.querySelectorAll('a')).filter(a => a.querySelector('img'));
        updateDebugInfo('mga-debug-trigger-img', triggerLinks.length);

        if (settings.debug_mode) {
            document.getElementById('mga-force-open').addEventListener('click', function() {
                logDebug("Clic sur 'Forcer l'ouverture'.");
                const testImages = [
                    { highResUrl: 'https://placehold.co/800x600/0073aa/ffffff?text=Image+Test+1', thumbUrl: 'https://placehold.co/150x150/0073aa/ffffff?text=Thumb+1', caption: 'Ceci est la première image de test.' },
                    { highResUrl: 'https://placehold.co/800x600/F44336/ffffff?text=Image+Test+2', thumbUrl: 'https://placehold.co/150x150/F44336/ffffff?text=Thumb+2', caption: 'Ceci est la seconde image de test.' }
                ];
                openViewer(testImages, 0);
            });
        }

        contentArea.addEventListener('click', function (e) {
            const targetLink = e.target.closest('a');
            if (targetLink && targetLink.querySelector('img')) {
                logDebug("Clic sur un lien contenant une image.");
                e.preventDefault();
                e.stopPropagation();

                const galleryData = triggerLinks.map(link => {
                    const innerImg = link.querySelector('img');
                    if (!innerImg) return null;

                    const highResUrl = getHighResUrl(link);
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
                }).filter(item => item && item.highResUrl);
                
                logDebug(`${galleryData.length} images valides préparées pour la galerie.`);
                if(settings.debug_mode) console.table(galleryData);

                const clickedHighResUrl = getHighResUrl(targetLink);
                const startIndex = galleryData.findIndex(img => img.highResUrl === clickedHighResUrl);
                
                if (startIndex !== -1) {
                    openViewer(galleryData, startIndex);
                } else {
                    logDebug("ERREUR: L'image cliquée n'a pas été trouvée dans la galerie construite.", true);
                    logDebug(`URL cliquée cherchée : ${clickedHighResUrl}`, true);
                }
            }
        }, true);

        function openViewer(images, startIndex) {
            logDebug(`openViewer appelé avec ${images.length} images, index ${startIndex}.`);
            const viewer = getViewer();
            if (!viewer) return;

            viewer.className = 'mga-viewer';
            if (settings.background_style === 'blur') viewer.classList.add('mga-has-blur');
            if (settings.background_style === 'texture') viewer.classList.add('mga-has-texture');
            
            try {
                if (mainSwiper) mainSwiper.destroy(true, true);
                if (thumbsSwiper) thumbsSwiper.destroy(true, true);
                preloadedUrls.clear();

                const mainWrapper = viewer.querySelector('#mga-main-wrapper');
                const thumbsWrapper = viewer.querySelector('#mga-thumbs-wrapper');
                mainWrapper.innerHTML = '';
                thumbsWrapper.innerHTML = '';

                images.forEach((img, index) => {
                    mainWrapper.innerHTML += `
                        <div class="swiper-slide" data-slide-index="${index}">
                            <div class="mga-spinner" style="display: none;"></div>
                            <div class="swiper-zoom-container">
                                <img src="${img.highResUrl}" alt="${img.caption}" loading="lazy">
                            </div>
                        </div>`;
                    
                    thumbsWrapper.innerHTML += `<div class="swiper-slide"><img src="${img.thumbUrl}" alt="${img.caption}" loading="lazy"></div>`;
                });
                logDebug('Wrappers HTML remplis avec URLs optimisées.');

                initSwiper(viewer, images);
                mainSwiper.slideToLoop(startIndex, 0);
                updateInfo(viewer, images, startIndex);
                viewer.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                logDebug('Galerie affichée avec succès.');
            } catch (error) {
                logDebug(`ERREUR dans openViewer: ${error.message}`, true);
                console.error(error);
            }
        }

        function initSwiper(viewer, images) {
            const mainSwiperContainer = viewer.querySelector('.mga-main-swiper');
            const thumbsSwiperContainer = viewer.querySelector('.mga-thumbs-swiper');

            // On intercepte console.warn pour masquer l'avertissement de Swiper
            const originalWarn = console.warn;
            console.warn = function(...args) {
                if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Swiper Loop Warning')) {
                    return; // On ne fait rien pour ce message spécifique
                }
                originalWarn.apply(console, args);
            };

            thumbsSwiper = new Swiper(thumbsSwiperContainer, { 
                spaceBetween: 10, 
                slidesPerView: 'auto', 
                freeMode: true, 
                watchSlidesProgress: true,
                passiveListeners: true, 
            });
            
            mainSwiper = new Swiper(mainSwiperContainer, {
                zoom: true,
                spaceBetween: 10, 
                loop: !!settings.loop && images.length > 2, 
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                thumbs: { swiper: thumbsSwiper },
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
                        updateDebugInfo('mga-debug-autoplay-time', (time / 1000).toFixed(2) + 's');
                    },
                    slideChangeTransitionStart: function(swiper) {
                        const slide = swiper.slides[swiper.activeIndex];
                        const img = slide.querySelector('img');
                        if (img && !img.complete) {
                            logDebug(`Chargement de l'image ${slide.dataset.slideIndex}...`);
                            slide.querySelector('.mga-spinner').style.display = 'block';
                            img.onload = () => {
                                logDebug(`Image ${slide.dataset.slideIndex} chargée.`);
                                slide.querySelector('.mga-spinner').style.display = 'none';
                            };
                        }
                    },
                    autoplayStart: () => { logDebug('Autoplay DÉMARRÉ.'); viewer.querySelector('.mga-play-icon').style.display = 'none'; viewer.querySelector('.mga-pause-icon').style.display = 'inline-block'; },
                    autoplayStop: () => { logDebug('Autoplay ARRÊTÉ.'); viewer.querySelector('.mga-play-icon').style.display = 'inline-block'; viewer.querySelector('.mga-pause-icon').style.display = 'none'; const progressCircle = viewer.querySelector('.mga-timer-progress'); if (progressCircle) progressCircle.style.strokeDashoffset = 100; updateDebugInfo('mga-debug-autoplay-time', 'Stoppé'); },
                    touchStart: () => { logDebug('Interaction manuelle DÉTECTÉE (touch).'); },
                    sliderMove: () => { logDebug('Interaction manuelle DÉTECTÉE (drag).'); }
                },
            });

            // On restaure la fonction console.warn originale
            console.warn = originalWarn;

            if (settings.autoplay_start) {
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
                    logDebug(`Préchargement de l'image ${index}`);
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
                viewer.querySelector('#mga-counter').textContent = `${index + 1} / ${images.length}`;
            }
        }

        document.body.addEventListener('click', function(e) {
            const viewer = document.getElementById('mga-viewer');
            if (!viewer || viewer.style.display === 'none') return;
            if (e.target.closest('#mga-close')) closeViewer(viewer);
            if (e.target.closest('#mga-play-pause')) { if (mainSwiper && mainSwiper.autoplay && mainSwiper.autoplay.running) mainSwiper.autoplay.stop(); else if (mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.start(); }
            if (e.target.closest('#mga-zoom')) { if (mainSwiper && mainSwiper.zoom) mainSwiper.zoom.toggle(); }
            if (e.target.closest('#mga-fullscreen')) { if (!document.fullscreenElement) viewer.requestFullscreen().catch(err => logDebug('Erreur plein écran: ' + err.message, true)); else document.exitFullscreen(); }
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
            window.removeEventListener('resize', handleResize);
            if (document.fullscreenElement) document.exitFullscreen();
            if(mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.stop();
            viewer.style.display = 'none';
            document.body.style.overflow = '';
            logDebug('Galerie fermée.');
            if (debugTimerInterval) {
                clearInterval(debugTimerInterval);
                debugTimerInterval = null;
            }
        }

        function handleResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (mainSwiper && mainSwiper.el && !mainSwiper.destroyed) {
                    const wasRunning = mainSwiper.autoplay.running;
                    logDebug('Redimensionnement détecté. Mise à jour de Swiper.');
                    mainSwiper.update();
                    if(thumbsSwiper && !thumbsSwiper.destroyed) thumbsSwiper.update();
                    if (wasRunning) {
                        mainSwiper.autoplay.start();
                        logDebug('Autoplay relancé après redimensionnement.');
                    }
                }
            }, 250);
        }
        window.addEventListener('resize', handleResize);
    });
})();