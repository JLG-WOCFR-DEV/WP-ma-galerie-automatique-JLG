(function() {
    'use strict';

    const root = window || {};
    const wp = root.wp || {};
    const i18n = wp.i18n || {};
    const dataStore = wp.data || null;
    const domReady = typeof wp.domReady === 'function'
        ? wp.domReady
        : function(callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        };

    const __ = typeof i18n.__ === 'function' ? i18n.__ : function(text) { return text; };

    const editorSettings = root.mgaBlockEditorPreview || {};
    const defaultNote = __('Lightbox active', 'lightbox-jlg');
    const noteText = typeof editorSettings.noteText === 'string' && editorSettings.noteText.trim()
        ? editorSettings.noteText.trim()
        : defaultNote;
    const reusableSuffix = __('Reusable block', 'lightbox-jlg');
    const reusableNote = noteText + ' · ' + reusableSuffix;

    const supportedBlocks = Array.isArray(editorSettings.supportedBlocks)
        ? editorSettings.supportedBlocks.filter(function(name) {
            return typeof name === 'string' && name.trim().length > 0;
        })
        : [];
    const supportedSet = supportedBlocks.length ? new Set(supportedBlocks) : null;

    const canvasSelector = '.block-editor-block-list__layout';
    const blockSelector = '.block-editor-block-list__block[data-type]';
    const linkClass = 'mga-editor-preview__link';
    const imageClass = 'mga-editor-preview__image';
    const activeClass = 'mga-editor-preview--lightbox';
    const noteAttr = 'data-mga-lightbox-note';
    const IMAGE_PATTERN = /\.(?:jpe?g|png|gif|bmp|webp|avif|svg)(?:\?.*)?(?:#.*)?$/i;

    const raf = typeof root.requestAnimationFrame === 'function'
        ? root.requestAnimationFrame.bind(root)
        : function(callback) { return setTimeout(callback, 16); };

    let rafId = null;
    let mutationObserver = null;
    const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [ 'href', 'class', 'data-type' ],
    };

    function scheduleUpdate() {
        if (rafId) {
            return;
        }

        rafId = raf(function() {
            rafId = null;
            updateHighlights();
        });
    }

    function isSupportedBlockName(blockName) {
        if (!blockName) {
            return false;
        }

        if (!supportedSet) {
            return true;
        }

        return supportedSet.has(blockName);
    }

    function markReusableBlocks(canvas) {
        if (!canvas) {
            return;
        }

        const reusableBlocks = canvas.querySelectorAll(blockSelector + '[data-type="core/block"]');
        reusableBlocks.forEach(function(reusable) {
            const childActive = reusable.querySelector(blockSelector + '.' + activeClass + ':not([data-type="core/block"])');

            if (childActive) {
                reusable.classList.add(activeClass);
                reusable.setAttribute(noteAttr, reusableNote);
            } else {
                reusable.classList.remove(activeClass);
                reusable.removeAttribute(noteAttr);
            }
        });
    }

    function cleanupCanvas(canvas) {
        if (!canvas) {
            return;
        }

        canvas.querySelectorAll('.' + imageClass).forEach(function(image) {
            image.classList.remove(imageClass);
        });

        canvas.querySelectorAll('.' + linkClass).forEach(function(link) {
            link.classList.remove(linkClass);
        });

        canvas.querySelectorAll(blockSelector + '.' + activeClass).forEach(function(block) {
            block.classList.remove(activeClass);
            block.removeAttribute(noteAttr);
        });
    }

    function updateHighlights() {
        const canvas = document.querySelector(canvasSelector);

        if (!canvas) {
            return;
        }

        if (mutationObserver) {
            mutationObserver.disconnect();
        }

        cleanupCanvas(canvas);

        const blocks = canvas.querySelectorAll(blockSelector);

        blocks.forEach(function(block) {
            const blockName = block.getAttribute('data-type') || '';

            if (!isSupportedBlockName(blockName)) {
                return;
            }

            let hasEligibleLink = false;

            block.querySelectorAll('a[href]').forEach(function(anchor) {
                if (!(anchor instanceof Element)) {
                    return;
                }

                const href = anchor.getAttribute('href');

                if (!href || !IMAGE_PATTERN.test(href)) {
                    return;
                }

                const linkedImage = anchor.querySelector('img');

                if (!linkedImage) {
                    return;
                }

                if (anchor.closest('[data-mga-lightbox-ignore="true"]')) {
                    return;
                }

                anchor.classList.add(linkClass);
                linkedImage.classList.add(imageClass);
                hasEligibleLink = true;
            });

            if (hasEligibleLink) {
                block.classList.add(activeClass);
                block.setAttribute(noteAttr, noteText);
            }
        });

        markReusableBlocks(canvas);

        if (mutationObserver) {
            mutationObserver.observe(canvas, observerConfig);
        }
    }

    function preventNavigation(event) {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const anchor = target.closest('a.' + linkClass);

        if (!anchor) {
            return;
        }

        if (!anchor.closest(canvasSelector)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    }

    function preventKeyboardNavigation(event) {
        if ('Enter' !== event.key) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const anchor = target.closest('a.' + linkClass);

        if (!anchor) {
            return;
        }

        if (!anchor.closest(canvasSelector)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    }

    function observeCanvas(canvas) {
        if (!('MutationObserver' in root) || !canvas) {
            return;
        }

        if (!mutationObserver) {
            mutationObserver = new MutationObserver(scheduleUpdate);
        } else {
            mutationObserver.disconnect();
        }

        mutationObserver.observe(canvas, observerConfig);
    }

    function bootstrap() {
        const canvas = document.querySelector(canvasSelector);

        if (!canvas) {
            return false;
        }

        observeCanvas(canvas);
        updateHighlights();

        return true;
    }

    domReady(function() {
        if (!bootstrap()) {
            (function waitForCanvas() {
                if (bootstrap()) {
                    return;
                }

                raf(waitForCanvas);
            })();
        }

        document.addEventListener('click', preventNavigation, true);
        document.addEventListener('keydown', preventKeyboardNavigation, true);

        if (dataStore && typeof dataStore.subscribe === 'function') {
            dataStore.subscribe(scheduleUpdate);
        }
    });
})();
