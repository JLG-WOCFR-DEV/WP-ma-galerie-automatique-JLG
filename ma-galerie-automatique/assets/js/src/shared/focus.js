let focusSupportsOptionsCache = null;

export const detectFocusOptionsSupport = () => {
    if (focusSupportsOptionsCache !== null) {
        return focusSupportsOptionsCache;
    }

    focusSupportsOptionsCache = false;

    const doc = typeof window !== 'undefined' ? window.document : null;

    if (
        !doc ||
        typeof doc.createElement !== 'function' ||
        typeof window.HTMLElement === 'undefined' ||
        !window.HTMLElement.prototype ||
        typeof window.HTMLElement.prototype.focus !== 'function'
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

        window.HTMLElement.prototype.focus.call(testElement, {
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
};

export const safeFocus = (element, options = { preventScroll: true }) => {
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
};

export const exposeOnWindow = () => {
    if (typeof window === 'undefined') {
        return;
    }

    if (!window.mgaFocusUtils || typeof window.mgaFocusUtils !== 'object') {
        window.mgaFocusUtils = {};
    }

    window.mgaFocusUtils.detectFocusOptionsSupport = detectFocusOptionsSupport;
    window.mgaFocusUtils.safeFocus = safeFocus;
};

export default {
    detectFocusOptionsSupport,
    safeFocus,
    exposeOnWindow,
};
