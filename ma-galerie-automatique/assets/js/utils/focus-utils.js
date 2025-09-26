/* eslint-disable no-underscore-dangle */
(function(global) {
    let focusSupportsOptionsCache = null;

    function detectFocusOptionsSupport() {
        if (focusSupportsOptionsCache !== null) {
            return focusSupportsOptionsCache;
        }

        focusSupportsOptionsCache = false;

        const doc = global.document;

        if (
            !doc ||
            typeof doc.createElement !== 'function' ||
            typeof global.HTMLElement === 'undefined' ||
            !global.HTMLElement.prototype ||
            typeof global.HTMLElement.prototype.focus !== 'function'
        ) {
            return focusSupportsOptionsCache;
        }

        const testElement = doc.createElement('button');
        const root = doc.body || doc.documentElement;

        try {
            testElement.type = 'button';

            if (root && typeof root.appendChild === 'function') {
                root.appendChild(testElement);
            }

            global.HTMLElement.prototype.focus.call(testElement, {
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
                // Ignore and fall back to focusing without options.
            }
        }

        element.focus();
    }

    const focusUtils = {
        detectFocusOptionsSupport,
        safeFocus,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = focusUtils;
    }

    if (global && typeof global === 'object') {
        if (!global.mgaFocusUtils || typeof global.mgaFocusUtils !== 'object') {
            global.mgaFocusUtils = {};
        }

        global.mgaFocusUtils.detectFocusOptionsSupport = detectFocusOptionsSupport;
        global.mgaFocusUtils.safeFocus = safeFocus;
    }
})(typeof window !== 'undefined' ? window : globalThis);
