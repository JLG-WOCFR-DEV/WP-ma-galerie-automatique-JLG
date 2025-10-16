import { sanitizeIconKey } from './shared';

const buildLabelFromKey = (key) => {
    if (typeof key !== 'string' || key.trim() === '') {
        return '';
    }

    return key
        .trim()
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
};

function normalizeShareChannels(rawChannels) {
    const entries = [];

    if (Array.isArray(rawChannels)) {
        rawChannels.forEach((channel) => {
            entries.push(channel);
        });
    } else if (rawChannels && typeof rawChannels === 'object') {
        Object.keys(rawChannels).forEach((key) => {
            const candidate = rawChannels[key];

            if (candidate && typeof candidate === 'object') {
                entries.push(Object.assign({ key }, candidate));
            }
        });
    }

    const seenKeys = new Set();

    return entries.reduce((accumulator, entry) => {
        if (!entry || typeof entry !== 'object') {
            return accumulator;
        }

        let rawKey = '';

        if (typeof entry.key === 'string') {
            rawKey = entry.key;
        } else if (typeof entry.slug === 'string') {
            rawKey = entry.slug;
        }

        let key = sanitizeIconKey(rawKey);

        if (!key && typeof entry.label === 'string') {
            key = sanitizeIconKey(entry.label.replace(/\s+/g, '-'));
        }

        if (!key || seenKeys.has(key)) {
            return accumulator;
        }

        seenKeys.add(key);

        const label = typeof entry.label === 'string' && entry.label.trim()
            ? entry.label.trim()
            : buildLabelFromKey(key);

        const template = typeof entry.template === 'string'
            ? entry.template.trim()
            : '';

        const icon = sanitizeIconKey(entry.icon || key) || key;

        const enabled = entry.enabled === true
            || entry.enabled === '1'
            || entry.enabled === 1
            || entry.enabled === 'true'
            || entry.enabled === 'on';

        accumulator.push({
            key,
            label,
            template,
            icon,
            enabled,
        });

        return accumulator;
    }, []);
}

const hasNativeShareSupport = () => typeof navigator !== 'undefined'
    && navigator
    && typeof navigator.share === 'function';

const buildShareUrl = (template, sharePayload) => {
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
};

export {
    buildLabelFromKey,
    normalizeShareChannels,
    hasNativeShareSupport,
    buildShareUrl,
};
