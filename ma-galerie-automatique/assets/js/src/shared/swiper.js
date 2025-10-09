const DEFAULT_TIMEOUT = 12000;

const getTimestamp = (global) => {
    if (global && global.performance && typeof global.performance.now === 'function') {
        return global.performance.now();
    }

    return Date.now();
};

const getDocument = (global) => (global && global.document) || null;

const getMetricsStore = (global) => {
    if (!global) {
        return null;
    }

    if (!global.mgaSwiperMetrics || typeof global.mgaSwiperMetrics !== 'object') {
        global.mgaSwiperMetrics = { events: [] };
    }

    if (!Array.isArray(global.mgaSwiperMetrics.events)) {
        global.mgaSwiperMetrics.events = [];
    }

    return global.mgaSwiperMetrics;
};

const recordMetric = (global, namespace, event, detail) => {
    const store = getMetricsStore(global);

    if (!store) {
        return;
    }

    store.events.push({
        namespace: namespace || 'default',
        event,
        detail: detail || {},
        timestamp: getTimestamp(global),
    });

    if (typeof global.dispatchEvent === 'function') {
        try {
            const customEvent = new global.CustomEvent('mga:swiper-metric', {
                detail: {
                    namespace: namespace || 'default',
                    event,
                    payload: detail || {},
                },
            });
            global.dispatchEvent(customEvent);
        } catch (error) {
            // Ignore CustomEvent support issues.
        }
    }
};

const normalizeAttempts = (config) => {
    if (!config || typeof config !== 'object') {
        return [];
    }

    const rawAttempts = Array.isArray(config.attempts) ? config.attempts : [];

    return rawAttempts
        .map((attempt) => {
            if (!attempt || typeof attempt !== 'object') {
                return null;
            }

            if (attempt.enabled === false) {
                return null;
            }

            const key = typeof attempt.key === 'string' && attempt.key ? attempt.key : 'fallback';
            const js = attempt.js && typeof attempt.js === 'object' ? attempt.js : {};
            const css = attempt.css && typeof attempt.css === 'object' ? attempt.css : null;
            const inject = attempt.inject !== false;

            const jsSrc = typeof js.src === 'string' && js.src ? js.src : '';

            if (!jsSrc) {
                return null;
            }

            return {
                key,
                label: typeof attempt.label === 'string' && attempt.label ? attempt.label : key,
                js: {
                    src: jsSrc,
                    integrity: typeof js.integrity === 'string' && js.integrity ? js.integrity : null,
                    crossOrigin: typeof js.crossOrigin === 'string' && js.crossOrigin ? js.crossOrigin : null,
                    referrerPolicy: typeof js.referrerPolicy === 'string' && js.referrerPolicy ? js.referrerPolicy : null,
                },
                css: css && typeof css.href === 'string' && css.href
                    ? {
                        href: css.href,
                        integrity: typeof css.integrity === 'string' && css.integrity ? css.integrity : null,
                        crossOrigin: typeof css.crossOrigin === 'string' && css.crossOrigin ? css.crossOrigin : null,
                        referrerPolicy: typeof css.referrerPolicy === 'string' && css.referrerPolicy ? css.referrerPolicy : null,
                    }
                    : null,
                timeout: typeof attempt.timeout === 'number' && attempt.timeout > 0
                    ? attempt.timeout
                    : DEFAULT_TIMEOUT,
                inject,
            };
        })
        .filter(Boolean);
};

const loadStylesheet = (global, attempt, namespace) => {
    if (!attempt || !attempt.css) {
        return Promise.resolve();
    }

    const doc = getDocument(global);

    if (!doc) {
        return Promise.resolve();
    }

    const existing = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
        .find((link) => link.href === attempt.css.href);

    if (existing) {
        return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = attempt.css.href;
        link.dataset.mgaSwiperSource = attempt.key;

        if (attempt.css.integrity) {
            link.integrity = attempt.css.integrity;
        }

        if (attempt.css.crossOrigin) {
            link.crossOrigin = attempt.css.crossOrigin;
        } else if (attempt.css.integrity) {
            link.crossOrigin = 'anonymous';
        }

        if (attempt.css.referrerPolicy) {
            link.referrerPolicy = attempt.css.referrerPolicy;
        }

        link.onload = () => {
            recordMetric(global, namespace, 'css_load_success', { source: attempt.key });
            resolve(link);
        };

        link.onerror = () => {
            recordMetric(global, namespace, 'css_load_error', { source: attempt.key });
            reject(new Error('Stylesheet load error'));
        };

        doc.head.appendChild(link);
        recordMetric(global, namespace, 'css_load_start', { source: attempt.key, href: attempt.css.href });
    });
};

const loadScript = (global, attempt, namespace) => {
    if (!attempt || !attempt.js || !attempt.js.src) {
        return Promise.reject(new Error('Invalid attempt configuration'));
    }

    const doc = getDocument(global);

    if (!doc) {
        return Promise.reject(new Error('Document unavailable'));
    }

    const existing = Array.from(doc.querySelectorAll('script'))
        .find((script) => script.src === attempt.js.src && !script.hasAttribute('data-mga-swiper-failed'));

    if (existing) {
        return new Promise((resolve, reject) => {
            if (typeof global.Swiper === 'function') {
                existing.setAttribute('data-mga-swiper-loaded', 'true');
                recordMetric(global, namespace, 'js_already_available', { source: attempt.key });
                resolve(existing);
                return;
            }

            if (typeof existing.hasAttribute === 'function' && existing.hasAttribute('data-mga-swiper-loaded')) {
                resolve(existing);
                return;
            }

            existing.addEventListener('load', () => {
                existing.setAttribute('data-mga-swiper-loaded', 'true');
                resolve(existing);
            });
            existing.addEventListener('error', () => {
                existing.setAttribute('data-mga-swiper-failed', 'true');
                reject(new Error('Existing script failed'));
            });

            recordMetric(global, namespace, 'js_existing_observed', { source: attempt.key });
        });
    }

    return new Promise((resolve, reject) => {
        const script = doc.createElement('script');
        script.src = attempt.js.src;
        script.async = false;
        script.dataset.mgaSwiperSource = attempt.key;

        if (attempt.js.integrity) {
            script.integrity = attempt.js.integrity;
        }

        if (attempt.js.crossOrigin) {
            script.crossOrigin = attempt.js.crossOrigin;
        } else if (attempt.js.integrity) {
            script.crossOrigin = 'anonymous';
        }

        if (attempt.js.referrerPolicy) {
            script.referrerPolicy = attempt.js.referrerPolicy;
        }

        let timeoutId = null;

        const cleanup = () => {
            if (timeoutId) {
                global.clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        script.onload = () => {
            cleanup();
            script.setAttribute('data-mga-swiper-loaded', 'true');
            recordMetric(global, namespace, 'js_load_success', { source: attempt.key });
            resolve(script);
        };

        script.onerror = () => {
            cleanup();
            script.setAttribute('data-mga-swiper-failed', 'true');
            recordMetric(global, namespace, 'js_load_error', { source: attempt.key });
            reject(new Error('Script load error'));
        };

        timeoutId = global.setTimeout(() => {
            cleanup();
            script.setAttribute('data-mga-swiper-failed', 'true');
            recordMetric(global, namespace, 'js_load_timeout', { source: attempt.key, timeout: attempt.timeout });
            reject(new Error('Script load timeout'));
        }, attempt.timeout || DEFAULT_TIMEOUT);

        doc.head.appendChild(script);
        recordMetric(global, namespace, 'js_load_start', { source: attempt.key, src: attempt.js.src });
    });
};

const getLoaderState = (global) => {
    if (!global) {
        return { promise: null };
    }

    if (!global.mgaSwiperLoaderState || typeof global.mgaSwiperLoaderState !== 'object') {
        global.mgaSwiperLoaderState = { promise: null };
    }

    return global.mgaSwiperLoaderState;
};

const attemptLoad = (global, attempt, namespace) => {
    if (!attempt || !attempt.inject) {
        return Promise.resolve();
    }

    if (typeof global.Swiper === 'function') {
        return Promise.resolve(global.Swiper);
    }

    recordMetric(global, namespace, 'attempt_start', { source: attempt.key });

    return loadStylesheet(global, attempt, namespace)
        .catch(() => null)
        .then(() => loadScript(global, attempt, namespace))
        .then(() => {
            if (typeof global.Swiper === 'function') {
                recordMetric(global, namespace, 'attempt_success', { source: attempt.key });
                return global.Swiper;
            }

            recordMetric(global, namespace, 'attempt_no_global', { source: attempt.key });
            throw new Error('Swiper global missing after load');
        })
        .catch((error) => {
            recordMetric(global, namespace, 'attempt_error', {
                source: attempt.key,
                message: error && error.message ? error.message : String(error),
            });
            throw error;
        });
};

const runAttemptsSequentially = (global, attempts, namespace) => {
    return attempts.reduce((promise, attempt) => {
        return promise.catch(() => attemptLoad(global, attempt, namespace));
    }, Promise.reject(new Error('initial')));
};

const getConfig = (global, explicitConfig) => {
    if (explicitConfig && typeof explicitConfig === 'object') {
        return explicitConfig;
    }

    if (global && global.mgaSwiperLoaderConfig && typeof global.mgaSwiperLoaderConfig === 'object') {
        return global.mgaSwiperLoaderConfig;
    }

    if (global && global.mgaAdminConfig && typeof global.mgaAdminConfig === 'object' && global.mgaAdminConfig.swiper) {
        return global.mgaAdminConfig.swiper;
    }

    return null;
};

export const ensureSwiper = (global = window, options = {}) => {
    const namespace = typeof options.namespace === 'string' && options.namespace
        ? options.namespace
        : 'default';

    if (!global) {
        return Promise.reject(new Error('Global scope unavailable'));
    }

    if (typeof global.Swiper === 'function') {
        recordMetric(global, namespace, 'already_available', {});
        return Promise.resolve(global.Swiper);
    }

    const config = getConfig(global, options.config);
    const attempts = normalizeAttempts(config);

    if (!attempts.length) {
        recordMetric(global, namespace, 'no_attempts_configured', {});
        return Promise.reject(new Error('No Swiper attempts configured'));
    }

    const state = getLoaderState(global);

    if (state.promise) {
        return state.promise;
    }

    recordMetric(global, namespace, 'bootstrap', {
        version: config && config.version ? config.version : null,
        attempts: attempts.map((attempt) => attempt.key),
    });

    state.promise = runAttemptsSequentially(global, attempts, namespace)
        .catch(() => {
            if (typeof global.Swiper === 'function') {
                return global.Swiper;
            }

            recordMetric(global, namespace, 'fatal', {});
            throw new Error('Swiper could not be loaded');
        })
        .then(() => {
            if (typeof global.Swiper === 'function') {
                recordMetric(global, namespace, 'ready', {});
                return global.Swiper;
            }

            recordMetric(global, namespace, 'fatal', {});
            throw new Error('Swiper global unavailable');
        })
        .finally(() => {
            state.promise = null;
        });

    return state.promise;
};

export const getSwiperLoaderConfig = (global = window) => getConfig(global, null);

