'use strict';

const DEFAULT_FALLBACK_GROUP_ID = '__mga-default-group__';
const DEFAULT_IMAGE_FILE_PATTERN = /\.(jpe?g|png|gif|bmp|webp|avif|svg)(?:\?.*)?(?:#.*)?$/i;

function resolveLinkGroupId(link, options = {}) {
    const {
        fallbackGroupId = DEFAULT_FALLBACK_GROUP_ID,
        configuredGroupAttribute = '',
    } = options;

    if (!(link instanceof Element)) {
        return fallbackGroupId;
    }

    const attributeCandidates = [];
    const trimmedConfiguredAttribute = typeof configuredGroupAttribute === 'string'
        ? configuredGroupAttribute.trim()
        : '';

    if (trimmedConfiguredAttribute) {
        attributeCandidates.push(trimmedConfiguredAttribute);
    }

    attributeCandidates.push('data-mga-gallery', 'rel');

    for (const attrName of attributeCandidates) {
        if (!attrName) {
            continue;
        }

        const rawValue = link.getAttribute(attrName);
        if (typeof rawValue === 'string') {
            const trimmed = rawValue.trim();
            if (trimmed) {
                return `${attrName}:${trimmed}`;
            }
        }
    }

    if (trimmedConfiguredAttribute) {
        const hrefValue = link.getAttribute('href');
        if (typeof hrefValue === 'string') {
            const trimmedHref = hrefValue.trim();
            if (trimmedHref) {
                return `href:${trimmedHref}`;
            }
        }
    }

    return fallbackGroupId;
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
        const linkType = linkElement.dataset.type || linkElement.dataset.wpType;
        if (typeof linkType === 'string' && linkType.toLowerCase() === 'attachment') {
            return true;
        }
    }
    const rel = linkElement.getAttribute('rel');
    if (rel && rel.split(/\s+/).includes('mga-allow-fallback')) {
        return true;
    }
    const dataType = linkElement.getAttribute('data-type');
    if (typeof dataType === 'string' && dataType.toLowerCase() === 'attachment') {
        return true;
    }
    const href = linkElement.getAttribute('href');
    if (typeof href === 'string') {
        if (/[?&]attachment_id=\d+/i.test(href)) {
            return true;
        }
        if (/\/attachment\//i.test(href)) {
            return true;
        }
        try {
            const baseHref = (typeof window !== 'undefined' && window.location)
                ? window.location.href
                : undefined;
            const url = new URL(href, baseHref);
            if (url.searchParams && url.searchParams.has('attachment_id')) {
                return true;
            }
        } catch (error) {
            // Relative URLs already handled above.
        }
    }
    return false;
}

function sanitizeHighResUrl(candidate) {
    if (typeof candidate !== 'string') {
        return '';
    }

    const trimmed = candidate.trim();
    if (!trimmed) {
        return '';
    }

    if (/^\/\//.test(trimmed)) {
        const location = typeof window !== 'undefined' ? window.location : null;
        const protocol = location && typeof location.protocol === 'string'
            ? location.protocol.toLowerCase()
            : '';
        if (protocol === 'http:' || protocol === 'https:') {
            return `${protocol}${trimmed}`;
        }
        return `https:${trimmed}`;
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
        if (!/^https?:/i.test(trimmed)) {
            return '';
        }
        return trimmed;
    }

    return trimmed;
}

function getImageDataAttributes(innerImg, options = {}) {
    if (!innerImg) return null;

    const { excludeLarge = false } = options;

    const attributePriority = [
        'data-mga-highres',
        'data-full-url',
        'data-large-file',
        'data-orig-file',
        'data-src',
        'data-lazy-src'
    ];
    const datasetToAttributesMap = {
        mgaHighres: 'data-mga-highres',
        fullUrl: 'data-full-url',
        largeFile: 'data-large-file',
        origFile: 'data-orig-file',
        src: 'data-src',
        lazySrc: 'data-lazy-src'
    };
    const collected = [];

    for (const attr of attributePriority) {
        const value = innerImg.getAttribute(attr);
        if (value) {
            collected.push({ key: attr, value: value.trim() });
        }
    }

    if (innerImg.dataset) {
        for (const [datasetKey, attributeName] of Object.entries(datasetToAttributesMap)) {
            const datasetValue = innerImg.dataset[datasetKey];
            if (datasetValue && !collected.some(item => item.key === attributeName)) {
                collected.push({ key: attributeName, value: datasetValue.trim() });
            }
        }
    }

    if (!collected.length) {
        return null;
    }

    if (excludeLarge) {
        const largeKeys = new Set(['data-full-url', 'data-large-file', 'data-orig-file']);
        const lightweightPreference = ['data-src', 'data-lazy-src', 'data-mga-highres'];
        const hasLightweightAlternative = collected.some(item => !largeKeys.has(item.key));

        if (hasLightweightAlternative) {
            for (const preferredKey of lightweightPreference) {
                const candidate = collected.find(item => item.key === preferredKey && item.value);
                if (candidate) {
                    return candidate.value;
                }
            }

            const fallbackCandidate = collected.find(item => !largeKeys.has(item.key) && item.value);
            if (fallbackCandidate) {
                return fallbackCandidate.value;
            }
        }
    }

    const firstEntry = collected.find(item => item.value);
    return firstEntry ? firstEntry.value : null;
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

function getHighResUrl(linkElement, options = {}) {
    if (!linkElement) return null;

    const {
        imageFilePattern = DEFAULT_IMAGE_FILE_PATTERN,
    } = options;

    const href = linkElement.getAttribute('href') || '';
    const isMediaHref = imageFilePattern.test(href);
    const fallbackAllowed = isMediaHref || isExplicitFallbackAllowed(linkElement);
    const sanitizedHref = isMediaHref ? sanitizeHighResUrl(href) : null;

    if (fallbackAllowed && linkElement.dataset && linkElement.dataset.mgaHighres) {
        const sanitizedDatasetUrl = sanitizeHighResUrl(linkElement.dataset.mgaHighres);
        if (sanitizedDatasetUrl) {
            return sanitizedDatasetUrl;
        }
    }

    const innerImg = linkElement.querySelector('img');
    if (!innerImg) return null;

    if (fallbackAllowed) {
        const dataAttrUrl = getImageDataAttributes(innerImg);
        const sanitizedDataAttrUrl = sanitizeHighResUrl(dataAttrUrl);
        if (sanitizedDataAttrUrl) {
            return sanitizedDataAttrUrl;
        }
    }

    if (!fallbackAllowed) {
        return null;
    }

    const srcsetUrl = sanitizeHighResUrl(parseSrcset(innerImg));
    if (srcsetUrl) {
        return srcsetUrl;
    }

    if (sanitizedHref) {
        return sanitizedHref;
    }

    const currentSrc = sanitizeHighResUrl(innerImg.currentSrc);
    if (currentSrc) {
        return currentSrc;
    }

    const fallbackSrc = sanitizeHighResUrl(innerImg.src);
    if (fallbackSrc) {
        return fallbackSrc;
    }

    return null;
}

module.exports = {
    resolveLinkGroupId,
    isExplicitFallbackAllowed,
    sanitizeHighResUrl,
    getHighResUrl,
    getImageDataAttributes,
    parseSrcset,
};
