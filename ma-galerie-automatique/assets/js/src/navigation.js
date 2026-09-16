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

const findImageLinkInRoot = (root) => {
    if (!root || typeof root.querySelector !== 'function') {
        return null;
    }

    const img = root.querySelector('a img');
    if (!img || typeof img.closest !== 'function') {
        return null;
    }

    return img.closest('a');
};

const resolveTriggerLinkFromEventTarget = (eventTarget) => {
    if (!eventTarget || typeof eventTarget.closest !== 'function') {
        return null;
    }

    const closestLink = eventTarget.closest('a');
    if (closestLink) {
        if (typeof closestLink.querySelector === 'function' && closestLink.querySelector('img')) {
            return closestLink;
        }

        // Liens de crédit dans une légende : ne pas détourner le clic.
        return null;
    }

    const figure = eventTarget.closest('figure');
    if (figure) {
        const figureLink = findImageLinkInRoot(figure);
        if (figureLink) {
            return figureLink;
        }
    }

    const captionHost = eventTarget.closest('.wp-caption, .wp-block-image, .gallery-item');
    if (captionHost) {
        return findImageLinkInRoot(captionHost);
    }

    return null;
};

const POINTER_NAV_PREV_SELECTOR = '#mga-prev, .swiper-button-prev, .mga-nav-hitarea--prev';
const POINTER_NAV_NEXT_SELECTOR = '#mga-next, .swiper-button-next, .mga-nav-hitarea--next';
const POINTER_NAV_IGNORE_SELECTOR = [
    '.mga-toolbar',
    '.mga-toolbar-button',
    '.mga-share-modal',
    '.mga-thumbs-swiper',
    '.mga-cta-button',
    '.mga-caption a',
    '#mga-close',
    '#mga-play-pause',
    '#mga-zoom',
    '#mga-fullscreen',
    '#mga-share',
    '#mga-download',
].join(', ');
const SIDE_NAV_EDGE_RATIO = 0.2;
const SIDE_NAV_MIN_EDGE_PX = 56;
const FULLSCREEN_CHANGE_EVENTS = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
];

const resolvePointerNavDirection = (eventTarget) => {
    if (!eventTarget || typeof eventTarget.closest !== 'function') {
        return null;
    }

    if (eventTarget.closest(POINTER_NAV_PREV_SELECTOR)) {
        return 'prev';
    }

    if (eventTarget.closest(POINTER_NAV_NEXT_SELECTOR)) {
        return 'next';
    }

    return null;
};

const shouldIgnorePointerNavTarget = (eventTarget) => {
    if (!eventTarget || typeof eventTarget.closest !== 'function') {
        return true;
    }

    return Boolean(eventTarget.closest(POINTER_NAV_IGNORE_SELECTOR));
};

const resolveSideNavDirection = (clientX, rect, options = {}) => {
    if (!rect || typeof clientX !== 'number' || !Number.isFinite(clientX)) {
        return null;
    }

    const width = Number(rect.width);
    if (!width || width <= 0) {
        return null;
    }

    const ratio = typeof options.edgeRatio === 'number' ? options.edgeRatio : SIDE_NAV_EDGE_RATIO;
    const minEdge = typeof options.minEdgePx === 'number' ? options.minEdgePx : SIDE_NAV_MIN_EDGE_PX;
    const edge = Math.min(Math.max(width * ratio, minEdge), width / 2);
    const left = typeof rect.left === 'number' ? rect.left : 0;
    const x = clientX - left;

    if (x <= edge) {
        return 'prev';
    }

    if (x >= width - edge) {
        return 'next';
    }

    return null;
};

const isElementFullscreen = (element, doc = typeof document !== 'undefined' ? document : null) => {
    if (!element || !doc) {
        return false;
    }

    const fullscreenElement = doc.fullscreenElement
        || doc.webkitFullscreenElement
        || doc.webkitCurrentFullScreenElement
        || doc.mozFullScreenElement
        || doc.msFullscreenElement
        || null;

    if (!fullscreenElement) {
        return false;
    }

    if (fullscreenElement === element) {
        return true;
    }

    return typeof element.contains === 'function' && element.contains(fullscreenElement);
};

const navigateSwiperSlide = (swiper, direction, options = {}) => {
    if (!swiper || swiper.destroyed) {
        return false;
    }

    const slidesCount = Number.isInteger(options.slidesCount)
        ? options.slidesCount
        : (Array.isArray(swiper.slides) ? swiper.slides.length : 0);

    if (slidesCount <= 0) {
        return false;
    }

    const currentIndex = typeof swiper.realIndex === 'number'
        ? swiper.realIndex
        : (typeof swiper.activeIndex === 'number' ? swiper.activeIndex : 0);

    const loopEnabled = !!(swiper.params && swiper.params.loop);
    const delta = direction === 'prev' ? -1 : 1;
    let targetIndex = currentIndex + delta;

    if (targetIndex < 0) {
        targetIndex = loopEnabled ? slidesCount - 1 : 0;
    } else if (targetIndex >= slidesCount) {
        targetIndex = loopEnabled ? 0 : slidesCount - 1;
    }

    if (targetIndex === currentIndex) {
        return false;
    }

    const autoplay = swiper.autoplay;
    const wasRunning = !!(autoplay && autoplay.running);

    if (wasRunning) {
        if (typeof autoplay.stop === 'function') {
            autoplay.stop();
        } else if (typeof autoplay.pause === 'function') {
            autoplay.pause();
        }
    }

    if (swiper.params && swiper.params.loop && typeof swiper.slideToLoop === 'function') {
        swiper.slideToLoop(targetIndex);
    } else if (typeof swiper.slideTo === 'function') {
        swiper.slideTo(targetIndex);
    } else if (delta < 0 && typeof swiper.slidePrev === 'function') {
        swiper.slidePrev();
    } else if (typeof swiper.slideNext === 'function') {
        swiper.slideNext();
    }

    if (wasRunning) {
        if (typeof autoplay.start === 'function') {
            autoplay.start();
        } else if (typeof autoplay.resume === 'function') {
            autoplay.resume();
        }
    }

    return true;
};

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
    findImageLinkInRoot,
    resolveTriggerLinkFromEventTarget,
    navigateSwiperSlide,
    resolvePointerNavDirection,
    shouldIgnorePointerNavTarget,
    resolveSideNavDirection,
    isElementFullscreen,
    FULLSCREEN_CHANGE_EVENTS,
};
