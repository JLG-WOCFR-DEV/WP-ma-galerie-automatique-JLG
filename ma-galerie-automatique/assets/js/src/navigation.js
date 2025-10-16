const DEFAULT_EFFECT = 'slide';
const DEFAULT_SPEED = 600;
const DEFAULT_EASING = 'ease-out';
const ALLOWED_EFFECTS = ['slide', 'fade', 'cube', 'coverflow', 'flip'];
const HEAVY_EFFECTS = new Set(['cube', 'coverflow', 'flip']);
const ALLOWED_EASINGS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'];
const DEFAULT_THUMBS_LAYOUT = 'bottom';
const ALLOWED_THUMBS_LAYOUTS = ['bottom', 'left', 'hidden'];

const sanitizeEffect = (rawEffect) => {
    if (typeof rawEffect !== 'string') {
        return DEFAULT_EFFECT;
    }

    const normalized = rawEffect.trim().toLowerCase();
    return ALLOWED_EFFECTS.includes(normalized) ? normalized : DEFAULT_EFFECT;
};

const sanitizeSpeed = (rawSpeed) => {
    const parsed = parseInt(rawSpeed, 10);

    if (Number.isNaN(parsed)) {
        return DEFAULT_SPEED;
    }

    return Math.min(Math.max(parsed, 100), 5000);
};

const sanitizeEasing = (rawEasing) => {
    if (typeof rawEasing !== 'string') {
        return DEFAULT_EASING;
    }

    const normalized = rawEasing.trim().toLowerCase();
    return ALLOWED_EASINGS.includes(normalized) ? normalized : DEFAULT_EASING;
};

const sanitizeThumbsLayout = (rawLayout) => {
    if (typeof rawLayout !== 'string') {
        return DEFAULT_THUMBS_LAYOUT;
    }

    const normalized = rawLayout.trim().toLowerCase();
    return ALLOWED_THUMBS_LAYOUTS.includes(normalized) ? normalized : DEFAULT_THUMBS_LAYOUT;
};

const isHeavyEffect = (effect) => HEAVY_EFFECTS.has(effect);

export {
    DEFAULT_EFFECT,
    DEFAULT_SPEED,
    DEFAULT_EASING,
    DEFAULT_THUMBS_LAYOUT,
    sanitizeEffect,
    sanitizeSpeed,
    sanitizeEasing,
    sanitizeThumbsLayout,
    isHeavyEffect,
};
