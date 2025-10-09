const TOKEN_REGEX = /%(\d+\$)?[sd]/g;

const createFallbackSprintf = () => (format, ...args) => {
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

export const createSprintf = (i18n) => {
    if (i18n && typeof i18n.sprintf === 'function') {
        return i18n.sprintf;
    }

    return createFallbackSprintf();
};

export const createTranslate = (i18n) => {
    if (i18n && typeof i18n.__ === 'function') {
        return i18n.__;
    }

    return (text) => text;
};

export const resolveI18n = (globalObject) => {
    if (!globalObject || typeof globalObject !== 'object') {
        return null;
    }

    if (globalObject.wp && globalObject.wp.i18n) {
        return globalObject.wp.i18n;
    }

    return null;
};

export const getSharedI18n = () => resolveI18n(typeof window !== 'undefined' ? window : globalThis);

export const getSharedSprintf = () => createSprintf(getSharedI18n());

export const getSharedTranslate = () => createTranslate(getSharedI18n());

export default {
    createSprintf,
    createTranslate,
    getSharedI18n,
    getSharedSprintf,
    getSharedTranslate,
};
