/* eslint-disable no-underscore-dangle */
(function(global) {
    const mgaAdminI18n = global.wp && global.wp.i18n ? global.wp.i18n : null;
    const mgaAdmin__ = mgaAdminI18n && typeof mgaAdminI18n.__ === 'function' ? mgaAdminI18n.__ : ( text ) => text;
    const TOKEN_REGEX = /%(\d+\$)?[sd]/g;
    const fallbackSprintf = ( format, ...args ) => {
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

    const mgaAdminSprintf = mgaAdminI18n && typeof mgaAdminI18n.sprintf === 'function'
        ? mgaAdminI18n.sprintf
        : fallbackSprintf;

    const resolveFocusUtils = () => {
        if (global.mgaFocusUtils && typeof global.mgaFocusUtils === 'object') {
            return global.mgaFocusUtils;
        }

        if (typeof require === 'function') {
            try {
                return require('./utils/focus-utils');
            } catch (error) {
                // Ignore resolution errors in non-CommonJS environments.
            }
        }

        return null;
    };

    const focusUtils = resolveFocusUtils();

    const fallbackSafeFocus = (element) => {
        if (!element || typeof element.focus !== 'function') {
            return;
        }

        try {
            element.focus();
        } catch (error) {
            // Ignore focus errors in environments without focus support.
        }
    };

    const safeFocus = focusUtils && typeof focusUtils.safeFocus === 'function'
        ? focusUtils.safeFocus
        : fallbackSafeFocus;

    const detectFocusOptionsSupport = focusUtils && typeof focusUtils.detectFocusOptionsSupport === 'function'
        ? focusUtils.detectFocusOptionsSupport
        : () => false;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            detectFocusOptionsSupport,
            safeFocus,
        };
    }

    const doc = global.document;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SHARE_ICON_LIBRARY = {
        facebook: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H8.08V12h2.36V9.88c0-2.33 1.38-3.62 3.5-3.62 0.72 0 1.48 0.13 1.48 0.13v1.63h-0.83c-0.82 0-1.08 0.51-1.08 1.04V12h1.84l-0.29 1.89h-1.55v6.99C18.34 21.12 22 16.99 22 12z' },
            ],
        },
        twitter: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M22.46 6c-0.77 0.35-1.6 0.59-2.46 0.69a4.29 4.29 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.3 3.9 12.13 12.13 0 0 1-8.82-4.47 4.28 4.28 0 0 0 1.33 5.72 4.25 4.25 0 0 1-1.94-0.54v0.05a4.28 4.28 0 0 0 3.43 4.2 4.3 4.3 0 0 1-1.93 0.07 4.28 4.28 0 0 0 4 2.97 8.58 8.58 0 0 1-5.3 1.83 12.1 12.1 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-0.19-0.01-0.39-0.01-0.58A8.7 8.7 0 0 0 22.46 6z' },
            ],
        },
        linkedin: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M20.45 3H3.55A1.55 1.55 0 0 0 2 4.55v14.9C2 20.3 2.7 21 3.55 21h16.9c0.85 0 1.55-0.7 1.55-1.55V4.55C22 3.7 21.3 3 20.45 3zM8.34 18H5.67V9.67h2.67V18zM7 8.5a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zM18.33 18h-2.67v-4.1c0-0.98-0.02-2.24-1.36-2.24-1.36 0-1.56 1.06-1.56 2.16V18h-2.67V9.67h2.56v1.14h0.04c0.36-0.68 1.24-1.4 2.56-1.4 2.74 0 3.25 1.8 3.25 4.13V18z' },
            ],
        },
        pinterest: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M12 2C6.48 2 2 6.31 2 11.42c0 3.89 2.68 7.23 6.44 8.41-0.09-0.71-0.17-1.8 0.03-2.58 0.18-0.77 1.15-4.9 1.15-4.9s-0.29-0.58-0.29-1.45c0-1.36 0.79-2.37 1.78-2.37 0.84 0 1.24 0.63 1.24 1.38 0 0.84-0.53 2.09-0.8 3.25-0.23 1 0.5 1.81 1.48 1.81 1.78 0 3.14-1.87 3.14-4.57 0-2.39-1.72-4.07-4.18-4.07-2.85 0-4.52 2.14-4.52 4.35 0 0.86 0.33 1.79 0.74 2.29 0.08 0.1 0.09 0.19 0.07 0.29-0.07 0.31-0.23 1-0.26 1.13-0.04 0.18-0.14 0.22-0.32 0.13-1.2-0.56-1.95-2.29-1.95-3.68 0-3 2.18-5.76 6.29-5.76 3.3 0 5.87 2.35 5.87 5.5 0 3.28-2.06 5.93-4.92 5.93-0.96 0-1.86-0.5-2.17-1.08l-0.59 2.24c-0.21 0.83-0.78 1.87-1.16 2.5 0.87 0.27 1.78 0.42 2.72 0.42 5.52 0 10-4.31 10-9.42C22 6.31 17.52 2 12 2z' },
            ],
        },
        whatsapp: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M20.52 3.48A10.5 10.5 0 0 0 2.47 13.3l-1.45 5.28 5.4-1.41A10.5 10.5 0 1 0 20.52 3.48zm-8.5 17.54a8.75 8.75 0 0 1-4.46-1.22l-0.32-0.19-3.21 0.84 0.86-3.13-0.2-0.32a8.75 8.75 0 1 1 7.33 3.99zm4.78-6.53c-0.26-0.13-1.53-0.76-1.77-0.84-0.24-0.09-0.41-0.13-0.58 0.13-0.17 0.26-0.66 0.84-0.8 1.02-0.15 0.17-0.29 0.2-0.55 0.07-0.26-0.13-1.09-0.4-2.07-1.3-0.76-0.68-1.27-1.52-1.42-1.78-0.15-0.26-0.02-0.4 0.11-0.53 0.11-0.11 0.26-0.29 0.39-0.43 0.13-0.15 0.17-0.26 0.26-0.43 0.09-0.17 0.04-0.32-0.02-0.45-0.07-0.13-0.58-1.39-0.8-1.91-0.21-0.5-0.43-0.43-0.58-0.43-0.15 0-0.32-0.02-0.49-0.02-0.17 0-0.43 0.06-0.66 0.32-0.24 0.26-0.89 0.87-0.89 2.13s0.91 2.47 1.03 2.64c0.13 0.17 1.79 2.73 4.34 3.83 0.61 0.26 1.08 0.41 1.45 0.53 0.61 0.19 1.16 0.16 1.6 0.1 0.49-0.07 1.53-0.62 1.75-1.22 0.21-0.6 0.21-1.11 0.15-1.22-0.06-0.1-0.24-0.16-0.5-0.29z' },
            ],
        },
        telegram: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M21.5 2.5l-19 7.5c-1.3 0.52-1.29 2.35 0.02 2.85l4.8 1.9 1.9 4.8c0.5 1.31 2.34 1.32 2.85 0.02l7.5-19c0.42-1.06-0.64-2.12-1.67-1.67zM10 14l-1 4-1.5-3.8 8.3-6.2-5.8 6z' },
            ],
        },
        email: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z' },
            ],
        },
        link: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M10.59 13.41a1 1 0 0 1 0-1.41l2-2a1 1 0 1 1 1.41 1.41l-2 2a1 1 0 0 1-1.41 0zm-2.83 2.83a3 3 0 0 1 0-4.24l2-2a3 3 0 0 1 4.24 0 1 1 0 0 1-1.41 1.41 1 1 0 0 0-1.41 0l-2 2a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l1-1a1 1 0 1 1 1.41 1.41l-1 1a3 3 0 0 1-4.24 0zm8.48-8.48a3 3 0 0 0-4.24 0l-1 1a1 1 0 0 1-1.41-1.41l1-1a5 5 0 1 1 7.07 7.07l-2 2a5 5 0 0 1-7.07 0 1 1 0 0 1 1.41-1.41 3 3 0 0 0 4.24 0l2-2a3 3 0 0 0 0-4.24z' },
            ],
        },
        generic: {
            viewBox: '0 0 24 24',
            paths: [
                { d: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z' },
                { d: 'M13 17h-2v-2h2zm0-4h-2V7h2z' },
            ],
        },
    };

    const sanitizeIconKey = (value) => {
        if (typeof value !== 'string') {
            return '';
        }

        return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    };

    const createSvgElement = (tag, attributes = {}) => {
        if (!doc || typeof doc.createElementNS !== 'function') {
            return null;
        }

        const element = doc.createElementNS(SVG_NS, tag);

        Object.keys(attributes).forEach((attr) => {
            element.setAttribute(attr, attributes[attr]);
        });

        return element;
    };

    const createShareIconPreview = (iconKey) => {
        const sanitizedKey = sanitizeIconKey(iconKey);
        const definition = SHARE_ICON_LIBRARY[sanitizedKey] || SHARE_ICON_LIBRARY.generic;
        const svg = createSvgElement('svg', {
            viewBox: definition.viewBox,
            fill: 'currentColor',
            'aria-hidden': 'true',
            focusable: 'false',
        });

        if (!svg) {
            return null;
        }

        if (Array.isArray(definition.paths)) {
            definition.paths.forEach((pathDefinition) => {
                const path = createSvgElement('path', pathDefinition);

                if (path) {
                    svg.appendChild(path);
                }
            });
        }

        return svg;
    };

    const SHARE_TEMPLATE_SAMPLE = {
        url: 'https://exemple.com/galerie/photo-01',
        text: 'Une photo remarquable',
        title: 'Collection studio',
    };

    const SHARE_TEMPLATE_PLACEHOLDERS = {
        '%url%': SHARE_TEMPLATE_SAMPLE.url,
        '%text%': SHARE_TEMPLATE_SAMPLE.text,
        '%title%': SHARE_TEMPLATE_SAMPLE.title,
    };

    const SHARE_TEMPLATE_SCHEMES = ['http', 'https', 'mailto', 'tel', 'sms'];

    const isValidHexColor = (value) => {
        if (typeof value !== 'string') {
            return false;
        }

        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
    };

    if (!doc || typeof doc.addEventListener !== 'function') {
        return;
    }

    doc.addEventListener('DOMContentLoaded', function() {
        const navTabs = Array.from(doc.querySelectorAll('.mga-admin-wrap .nav-tab'));
        const tabContents = Array.from(doc.querySelectorAll('.mga-admin-wrap .tab-content'));

        const activateTab = (tab, focusTab = true) => {
            if (!tab) {
                return;
            }

            navTabs.forEach((t) => {
                t.classList.remove('nav-tab-active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });

            tabContents.forEach((panel) => {
                panel.classList.remove('active');
                panel.setAttribute('aria-hidden', 'true');
                panel.setAttribute('hidden', 'hidden');
            });

            tab.classList.add('nav-tab-active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            const targetSelector = tab.getAttribute('href');
            const targetPanel = targetSelector ? doc.querySelector(targetSelector) : null;

            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.setAttribute('aria-hidden', 'false');
                targetPanel.removeAttribute('hidden');
            }

            if (focusTab) {
                safeFocus(tab);
            }
        };

        const focusAdjacentTab = (currentTab, direction) => {
            const currentIndex = navTabs.indexOf(currentTab);

            if (currentIndex === -1) {
                return;
            }

            const targetIndex = (currentIndex + direction + navTabs.length) % navTabs.length;
            activateTab(navTabs[targetIndex]);
        };

        navTabs.forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                activateTab(tab, false);
            });

            tab.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        event.preventDefault();
                        focusAdjacentTab(tab, 1);
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        event.preventDefault();
                        focusAdjacentTab(tab, -1);
                        break;
                    case 'Home':
                        event.preventDefault();
                        activateTab(navTabs[0]);
                        break;
                    case 'End':
                        event.preventDefault();
                        activateTab(navTabs[navTabs.length - 1]);
                        break;
                    case ' ':
                    case 'Enter':
                        event.preventDefault();
                        activateTab(tab);
                        break;
                    default:
                        break;
                }
            });
        });

        const initSettingsNavigation = () => {
            const layout = doc.querySelector('[data-mga-settings-layout]');

            if (!layout) {
                return;
            }

            const sections = Array.from(layout.querySelectorAll('[data-mga-settings-section]'));

            if (sections.length === 0) {
                return;
            }

            const navList = layout.querySelector('[data-mga-settings-nav]');
            const navLinks = navList ? Array.from(navList.querySelectorAll('[data-mga-section-link]')) : [];
            const linkBySection = new Map();
            const navItemBySection = new Map();
            const viewToggle = layout.querySelector('[data-mga-view-toggle]');
            const viewSelect = viewToggle ? viewToggle.querySelector('[data-mga-view-select]') : null;
            const VIEW_STORAGE_KEY = 'mga-settings-view-mode';

            const readStoredViewMode = () => {
                if (typeof global.localStorage === 'undefined') {
                    return 'essential';
                }

                try {
                    const stored = global.localStorage.getItem(VIEW_STORAGE_KEY);
                    return stored === 'advanced' ? 'advanced' : 'essential';
                } catch (error) {
                    return 'essential';
                }
            };

            let currentViewMode = readStoredViewMode();

            const syncViewSelect = () => {
                if (viewSelect) {
                    viewSelect.value = currentViewMode;
                }
            };

            const persistViewMode = () => {
                if (typeof global.localStorage === 'undefined') {
                    return;
                }

                try {
                    global.localStorage.setItem(VIEW_STORAGE_KEY, currentViewMode);
                } catch (error) {
                    // Ignore storage access restrictions.
                }
            };

            const updateLayoutViewMode = () => {
                layout.setAttribute('data-mga-view-mode', currentViewMode);
            };

            const getSectionVisibility = (section) => {
                if (!section) {
                    return 'advanced';
                }

                const visibility = section.getAttribute('data-mga-visibility');
                return visibility === 'essential' ? 'essential' : 'advanced';
            };

            const searchInput = layout.querySelector('[data-mga-settings-search]');
            const emptyState = layout.querySelector('[data-mga-search-empty]');
            const highlightTimeouts = new WeakMap();

            const isSearchActive = () => layout.getAttribute('data-mga-search-active') === 'true';

            const updateEmptyState = (visibleCount, searchActive) => {
                if (!emptyState) {
                    return;
                }

                if (searchActive && visibleCount === 0) {
                    emptyState.removeAttribute('hidden');
                } else {
                    emptyState.setAttribute('hidden', 'hidden');
                }
            };

            const setActiveLink = (section) => {
                if (!section) {
                    return;
                }

                linkBySection.forEach((link, candidate) => {
                    if (candidate === section) {
                        link.setAttribute('aria-current', 'true');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            };

            const clearHighlights = () => {
                sections.forEach((section) => {
                    section.removeAttribute('data-mga-section-highlight');

                    if (highlightTimeouts.has(section)) {
                        global.clearTimeout(highlightTimeouts.get(section));
                        highlightTimeouts.delete(section);
                    }
                });
            };

            const highlightSection = (section) => {
                if (!section) {
                    return;
                }

                section.setAttribute('data-mga-section-highlight', 'true');

                if (highlightTimeouts.has(section)) {
                    global.clearTimeout(highlightTimeouts.get(section));
                }

                const timeoutId = global.setTimeout(() => {
                    section.removeAttribute('data-mga-section-highlight');
                    highlightTimeouts.delete(section);
                }, 1600);

                highlightTimeouts.set(section, timeoutId);
            };

            const filterSections = (rawQuery) => {
                const query = typeof rawQuery === 'string' ? rawQuery.trim().toLowerCase() : '';
                const searchActive = query.length > 0;
                let visibleCount = 0;

                if (searchActive) {
                    layout.setAttribute('data-mga-search-active', 'true');
                } else {
                    layout.removeAttribute('data-mga-search-active');
                    clearHighlights();
                }

                sections.forEach((section) => {
                    const link = linkBySection.get(section);
                    const navItem = navItemBySection.get(section);

                    if (!searchActive) {
                        const hide = currentViewMode === 'essential' && getSectionVisibility(section) === 'advanced';

                        if (hide) {
                            section.setAttribute('hidden', 'hidden');

                            if (link) {
                                link.setAttribute('hidden', 'hidden');
                                link.removeAttribute('aria-current');
                            }

                            if (navItem) {
                                navItem.setAttribute('hidden', 'hidden');
                            }

                            return;
                        }

                        section.removeAttribute('hidden');

                        if (link) {
                            link.removeAttribute('hidden');
                        }

                        if (navItem) {
                            navItem.removeAttribute('hidden');
                        }

                        return;
                    }

                    const text = (section.textContent || '').toLowerCase();
                    const isMatch = text.includes(query);

                    if (isMatch) {
                        section.removeAttribute('hidden');
                        section.setAttribute('data-mga-section-highlight', 'true');
                        visibleCount += 1;

                        if (link) {
                            link.removeAttribute('hidden');
                        }

                        if (navItem) {
                            navItem.removeAttribute('hidden');
                        }
                    } else {
                        section.setAttribute('hidden', 'hidden');
                        section.removeAttribute('data-mga-section-highlight');

                        if (link) {
                            link.setAttribute('hidden', 'hidden');
                            link.removeAttribute('aria-current');
                        }

                        if (navItem) {
                            navItem.setAttribute('hidden', 'hidden');
                        }
                    }
                });

                if (searchActive) {
                    const firstMatch = sections.find((section) => !section.hasAttribute('hidden'));

                    if (firstMatch) {
                        setActiveLink(firstMatch);
                    }
                }

                updateEmptyState(visibleCount, searchActive);
            };

            const applyViewMode = (nextMode, options = {}) => {
                const normalized = nextMode === 'advanced' ? 'advanced' : 'essential';

                if (normalized === currentViewMode && !options.force) {
                    return;
                }

                currentViewMode = normalized;
                syncViewSelect();
                updateLayoutViewMode();

                if (options.persist !== false) {
                    persistViewMode();
                }

                const currentQuery = searchInput ? searchInput.value || '' : '';
                filterSections(currentQuery);
            };

            navLinks.forEach((link) => {
                const href = link.getAttribute('href');

                if (!href || href.charAt(0) !== '#') {
                    return;
                }

                const target = layout.querySelector(href);

                if (!target) {
                    return;
                }

                linkBySection.set(target, link);
                const navItem = link.closest('[data-mga-visibility]');

                if (navItem) {
                    navItemBySection.set(target, navItem);
                }

                link.addEventListener('click', (event) => {
                    event.preventDefault();

                    if (target.hasAttribute('hidden')) {
                        target.removeAttribute('hidden');
                    }

                    try {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch (error) {
                        if (typeof target.scrollIntoView === 'function') {
                            target.scrollIntoView();
                        }
                    }

                    setActiveLink(target);
                    highlightSection(target);

                    const focusOptions = detectFocusOptionsSupport() ? { preventScroll: true } : undefined;

                    if (typeof global.requestAnimationFrame === 'function') {
                        global.requestAnimationFrame(() => {
                            safeFocus(target, focusOptions);
                        });
                    } else {
                        safeFocus(target, focusOptions);
                    }
                });
            });

            syncViewSelect();
            updateLayoutViewMode();

            if (viewSelect) {
                viewSelect.addEventListener('change', (event) => {
                    applyViewMode(event.target.value || 'essential');
                });
            }

            if ('IntersectionObserver' in global) {
                let lastVisibleSection = null;

                const observer = new IntersectionObserver((entries) => {
                    if (isSearchActive()) {
                        return;
                    }

                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            lastVisibleSection = entry.target;
                        }
                    });

                    if (lastVisibleSection) {
                        setActiveLink(lastVisibleSection);
                    }
                }, {
                    rootMargin: '-40% 0px -40% 0px',
                    threshold: 0.1,
                });

                sections.forEach((section) => observer.observe(section));
            } else {
                const handleScroll = () => {
                    if (isSearchActive()) {
                        return;
                    }

                    let bestSection = null;
                    let bestOffset = Infinity;
                    const scrollY = global.pageYOffset || doc.documentElement.scrollTop || 0;

                    sections.forEach((section) => {
                        const rect = section.getBoundingClientRect();
                        const absoluteTop = rect.top + scrollY;
                        const delta = Math.abs(absoluteTop - scrollY - 140);

                        if (delta < bestOffset) {
                            bestSection = section;
                            bestOffset = delta;
                        }
                    });

                    if (bestSection) {
                        setActiveLink(bestSection);
                    }
                };

                global.addEventListener('scroll', handleScroll, { passive: true });
                handleScroll();
            }

            if (searchInput) {
                searchInput.addEventListener('input', (event) => {
                    filterSections(event.target.value || '');
                });

                filterSections(searchInput.value || '');
            } else {
                updateEmptyState(sections.length, false);
            }

            applyViewMode(currentViewMode, { force: true, persist: false });

            if (!isSearchActive()) {
                setActiveLink(sections[0]);
            }
        };

        initSettingsNavigation();

        // Live update for range sliders
        const bindRangeToOutput = (sliderId, outputId, displayFormatter, ariaFormatter) => {
            const slider = doc.getElementById(sliderId);
            const output = doc.getElementById(outputId);

            if (!slider || !output) {
                return;
            }

            const updateOutput = () => {
                const value = slider.value;
                const displayValue = typeof displayFormatter === 'function'
                    ? displayFormatter(value)
                    : value;
                const ariaValue = typeof ariaFormatter === 'function'
                    ? ariaFormatter(value)
                    : displayValue;

                if (typeof output.value !== 'undefined') {
                    output.value = displayValue;
                }

                output.textContent = displayValue;
                slider.setAttribute('aria-valuenow', value);
                slider.setAttribute('aria-valuetext', ariaValue);
            };

            slider.addEventListener('input', updateOutput);
            updateOutput();
        };

        bindRangeToOutput(
            'mga_thumb_size',
            'mga_thumb_size_value',
            (value) => mgaAdminSprintf(mgaAdmin__('%spx', 'lightbox-jlg'), value),
            (value) => mgaAdminSprintf(mgaAdmin__('%s pixels', 'lightbox-jlg'), value)
        );

        bindRangeToOutput(
            'mga_thumb_size_mobile',
            'mga_thumb_size_mobile_value',
            (value) => mgaAdminSprintf(mgaAdmin__('%spx', 'lightbox-jlg'), value),
            (value) => mgaAdminSprintf(mgaAdmin__('%s pixels', 'lightbox-jlg'), value)
        );

        bindRangeToOutput(
            'mga_bg_opacity',
            'mga_bg_opacity_value',
            (value) => value,
            (value) => mgaAdminSprintf(mgaAdmin__('%s opacity', 'lightbox-jlg'), value)
        );

        const accentColorInput = doc.getElementById('mga_accent_color');
        const accentColorPreview = doc.getElementById('mga_accent_color_preview');

        if (accentColorInput) {
            const defaultColorAttr = accentColorInput.getAttribute('data-default-color');
            const fallbackColor = isValidHexColor(defaultColorAttr) ? defaultColorAttr : '#ffffff';

            const applyPreviewColor = (rawColor) => {
                const color = isValidHexColor(rawColor) ? rawColor : fallbackColor;

                if (accentColorPreview) {
                    accentColorPreview.style.backgroundColor = color;
                }

                return color;
            };

            applyPreviewColor(accentColorInput.value);

            const maybeJQuery = global.jQuery;

            if (maybeJQuery && typeof maybeJQuery.fn === 'object' && typeof maybeJQuery.fn.wpColorPicker === 'function') {
                maybeJQuery(accentColorInput).wpColorPicker({
                    change(event, ui) {
                        const colorValue = ui && ui.color ? ui.color.toString() : event.target.value;
                        applyPreviewColor(colorValue);
                    },
                    clear() {
                        const defaultColor = accentColorInput.getAttribute('data-default-color') || fallbackColor;
                        maybeJQuery(accentColorInput).val(defaultColor);
                        applyPreviewColor(defaultColor);
                    },
                });

                maybeJQuery(accentColorInput).on('input', (event) => {
                    applyPreviewColor(event.target.value);
                });
            } else {
                accentColorInput.addEventListener('input', () => {
                    applyPreviewColor(accentColorInput.value);
                });
            }
        }

        const initLivePreview = () => {
            const previewContainer = doc.querySelector('[data-mga-live-preview]');

            if (!previewContainer) {
                return;
            }

            const previewMock = previewContainer.querySelector('[data-mga-live-preview-mock]');
            const effectLabel = previewContainer.querySelector('[data-mga-preview-effect]');
            const thumbsContainer = previewContainer.querySelector('[data-mga-preview-thumbs]');
            const toolbarActions = {
                zoom: previewContainer.querySelector('[data-preview-action="zoom"]'),
                download: previewContainer.querySelector('[data-preview-action="download"]'),
                share: previewContainer.querySelector('[data-preview-action="share"]'),
                cta: previewContainer.querySelector('[data-preview-action="cta"]'),
                fullscreen: previewContainer.querySelector('[data-preview-action="fullscreen"]'),
            };

            const effectNameMap = {
                slide: mgaAdmin__('glissement', 'lightbox-jlg'),
                fade: mgaAdmin__('fondu', 'lightbox-jlg'),
                cube: mgaAdmin__('cube 3D', 'lightbox-jlg'),
                coverflow: mgaAdmin__('coverflow', 'lightbox-jlg'),
                flip: mgaAdmin__('flip 3D', 'lightbox-jlg'),
            };

            const setAccent = (value) => {
                if (!previewMock) {
                    return;
                }

                const color = isValidHexColor(value) ? value : '#6366f1';
                previewMock.style.setProperty('--mga-preview-accent', color);
            };

            const setOverlay = (value) => {
                if (!previewMock) {
                    return;
                }

                const numeric = parseFloat(value);

                if (Number.isNaN(numeric)) {
                    return;
                }

                const clamped = Math.min(Math.max(numeric, 0), 1);
                previewMock.style.setProperty('--mga-preview-overlay', `rgba(15, 23, 42, ${clamped})`);
            };

            const setBackgroundStyle = (style) => {
                if (!previewMock) {
                    return;
                }

                const normalized = typeof style === 'string' && style ? style : 'echo';
                previewMock.setAttribute('data-preview-style', normalized);
            };

            const toggleAction = (name, enabled) => {
                const action = toolbarActions[name];

                if (!action) {
                    return;
                }

                action.setAttribute('data-preview-hidden', enabled ? 'false' : 'true');
                action.setAttribute('aria-hidden', enabled ? 'false' : 'true');
            };

            const setThumbScale = (value) => {
                if (!thumbsContainer) {
                    return;
                }

                const numeric = parseFloat(value);

                if (Number.isNaN(numeric)) {
                    thumbsContainer.style.setProperty('--mga-preview-thumb-scale', '1');
                    return;
                }

                const normalized = Math.min(Math.max(numeric / 90, 0.6), 1.4);
                thumbsContainer.style.setProperty('--mga-preview-thumb-scale', normalized.toString());
            };

            const updateEffectLabel = () => {
                if (!effectLabel) {
                    return;
                }

                const effectSelect = doc.getElementById('mga_effect');
                const delayInput = doc.getElementById('mga_delay');
                const speedInput = doc.getElementById('mga_speed');
                const effectValue = effectSelect ? effectSelect.value : '';
                const delayValue = delayInput ? delayInput.value || '4' : '4';
                const speedValue = speedInput ? speedInput.value || '600' : '600';
                const effectLabelText = effectNameMap[effectValue] || mgaAdmin__('personnalisée', 'lightbox-jlg');

                effectLabel.textContent = mgaAdminSprintf(
                    mgaAdmin__('Transition : %1$s • %2$ss / %3$sms', 'lightbox-jlg'),
                    effectLabelText,
                    delayValue,
                    speedValue
                );
            };

            const bindPreviewControl = (id, handler, events = ['change']) => {
                const element = doc.getElementById(id);

                if (!element || typeof handler !== 'function') {
                    return;
                }

                const invoke = () => {
                    if (element.type === 'checkbox') {
                        handler(element.checked, element);
                    } else {
                        handler(element.value, element);
                    }
                };

                events.forEach((eventName) => {
                    element.addEventListener(eventName, invoke);
                });

                invoke();
            };

            bindPreviewControl('mga_accent_color', setAccent, ['input', 'change']);
            bindPreviewControl('mga_bg_opacity', setOverlay, ['input', 'change']);
            bindPreviewControl('mga_background_style', setBackgroundStyle);
            bindPreviewControl('mga_thumb_size', setThumbScale, ['input', 'change']);
            bindPreviewControl('mga_show_zoom', (checked) => toggleAction('zoom', checked));
            bindPreviewControl('mga_show_download', (checked) => toggleAction('download', checked));
            bindPreviewControl('mga_show_share', (checked) => toggleAction('share', checked));
            bindPreviewControl('mga_show_cta', (checked) => toggleAction('cta', checked));
            bindPreviewControl('mga_show_fullscreen', (checked) => toggleAction('fullscreen', checked));
            bindPreviewControl('mga_effect', updateEffectLabel);
            bindPreviewControl('mga_delay', updateEffectLabel, ['input', 'change']);
            bindPreviewControl('mga_speed', updateEffectLabel, ['input', 'change']);
        };

        initLivePreview();

        const stylePresetExport = global.mgaStylePresets && typeof global.mgaStylePresets === 'object'
            ? global.mgaStylePresets
            : {};
        const stylePresets = stylePresetExport.presets && typeof stylePresetExport.presets === 'object'
            ? stylePresetExport.presets
            : {};
        const presetSelect = doc.getElementById('mga_style_preset');
        const applyPresetButton = doc.querySelector('[data-mga-apply-style-preset]');
        const resetPresetButton = doc.querySelector('[data-mga-reset-style-preset]');
        const presetDescription = doc.querySelector('[data-mga-style-preset-description]');
        let isApplyingPreset = false;

        const maybeDispatchEvent = (element, eventType) => {
            if (!element || typeof element.dispatchEvent !== 'function') {
                return;
            }

            try {
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
            } catch (error) {
                if (typeof doc.createEvent === 'function') {
                    try {
                        const fallbackEvent = doc.createEvent('Event');
                        fallbackEvent.initEvent(eventType, true, true);
                        element.dispatchEvent(fallbackEvent);
                    } catch (fallbackError) {
                        // Ignore unsupported event creation paths.
                    }
                }
            }
        };

        const setNumericInputValue = (id, value) => {
            const input = doc.getElementById(id);

            if (!input) {
                return;
            }

            input.value = value;
            maybeDispatchEvent(input, 'input');
            maybeDispatchEvent(input, 'change');
        };

        const setRangeInputValue = setNumericInputValue;

        const setSelectValue = (id, value) => {
            const select = doc.getElementById(id);

            if (!select) {
                return;
            }

            select.value = value;
            maybeDispatchEvent(select, 'change');
        };

        const setCheckboxValue = (id, value) => {
            const checkbox = doc.getElementById(id);

            if (!checkbox) {
                return;
            }

            checkbox.checked = Boolean(value);
            maybeDispatchEvent(checkbox, 'change');
        };

        const setAccentColorValue = (value) => {
            if (!accentColorInput) {
                return;
            }

            const targetColor = typeof value === 'string' ? value : '';
            const maybeJQuery = global.jQuery;

            if (maybeJQuery && typeof maybeJQuery.fn === 'object' && typeof maybeJQuery.fn.wpColorPicker === 'function') {
                const picker = maybeJQuery(accentColorInput);

                if (picker && typeof picker.wpColorPicker === 'function') {
                    picker.wpColorPicker('color', targetColor);
                    return;
                }
            }

            accentColorInput.value = targetColor;
            maybeDispatchEvent(accentColorInput, 'change');
        };

        const applyPresetSettings = (settings) => {
            if (!settings || typeof settings !== 'object') {
                return;
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'delay')) {
                setNumericInputValue('mga_delay', settings.delay);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'speed')) {
                setNumericInputValue('mga_speed', settings.speed);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'effect')) {
                setSelectValue('mga_effect', settings.effect);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'easing')) {
                setSelectValue('mga_easing', settings.easing);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'thumbs_layout')) {
                setSelectValue('mga_thumbs_layout', settings.thumbs_layout);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'thumb_size')) {
                setRangeInputValue('mga_thumb_size', settings.thumb_size);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'thumb_size_mobile')) {
                setRangeInputValue('mga_thumb_size_mobile', settings.thumb_size_mobile);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_thumbs_mobile')) {
                setCheckboxValue('mga_show_thumbs_mobile', settings.show_thumbs_mobile);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'accent_color')) {
                setAccentColorValue(settings.accent_color);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'bg_opacity')) {
                setRangeInputValue('mga_bg_opacity', settings.bg_opacity);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'background_style')) {
                setSelectValue('mga_background_style', settings.background_style);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'autoplay_start')) {
                setCheckboxValue('mga_autoplay_start', settings.autoplay_start);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'loop')) {
                setCheckboxValue('mga_loop', settings.loop);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_zoom')) {
                setCheckboxValue('mga_show_zoom', settings.show_zoom);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_download')) {
                setCheckboxValue('mga_show_download', settings.show_download);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_share')) {
                setCheckboxValue('mga_show_share', settings.show_share);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_cta')) {
                setCheckboxValue('mga_show_cta', settings.show_cta);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'show_fullscreen')) {
                setCheckboxValue('mga_show_fullscreen', settings.show_fullscreen);
            }
        };

        const updatePresetDescription = () => {
            if (!presetDescription) {
                return;
            }

            const key = presetSelect ? presetSelect.value : '';

            if (key && stylePresets[key] && stylePresets[key].description) {
                presetDescription.textContent = stylePresets[key].description;
                return;
            }

            const customDescription = typeof stylePresetExport.customDescription === 'string'
                ? stylePresetExport.customDescription
                : '';

            presetDescription.textContent = customDescription;
        };

        const markPresetAsCustom = () => {
            if (isApplyingPreset || !presetSelect) {
                return;
            }

            if (presetSelect.value === '') {
                return;
            }

            presetSelect.value = '';
            updatePresetDescription();
        };

        const registerPresetWatcher = (id) => {
            const element = doc.getElementById(id);

            if (!element) {
                return;
            }

            const eventNames = ['change'];

            if (element.tagName === 'INPUT' && ['text', 'number', 'range'].includes(element.type)) {
                eventNames.push('input');
            }

            eventNames.forEach((eventName) => {
                element.addEventListener(eventName, markPresetAsCustom);
            });
        };

        if (presetSelect) {
            updatePresetDescription();
            presetSelect.addEventListener('change', updatePresetDescription);
        }

        if (applyPresetButton) {
            applyPresetButton.addEventListener('click', (event) => {
                event.preventDefault();

                if (!presetSelect) {
                    return;
                }

                const key = presetSelect.value;

                if (!key || !stylePresets[key]) {
                    return;
                }

                isApplyingPreset = true;
                applyPresetSettings(stylePresets[key].settings || {});
                isApplyingPreset = false;
                updatePresetDescription();
            });
        }

        if (resetPresetButton) {
            resetPresetButton.addEventListener('click', (event) => {
                event.preventDefault();

                const defaults = stylePresetExport.defaults || {};

                if (defaults && typeof defaults === 'object' && Object.keys(defaults).length > 0) {
                    isApplyingPreset = true;
                    applyPresetSettings(defaults);
                    isApplyingPreset = false;
                }

                if (presetSelect) {
                    presetSelect.value = '';
                }

                updatePresetDescription();
            });
        }

        [
            'mga_delay',
            'mga_speed',
            'mga_effect',
            'mga_easing',
            'mga_thumb_size',
            'mga_thumb_size_mobile',
            'mga_thumbs_layout',
            'mga_accent_color',
            'mga_bg_opacity',
            'mga_background_style',
            'mga_show_thumbs_mobile',
            'mga_autoplay_start',
            'mga_loop',
            'mga_show_zoom',
            'mga_show_download',
            'mga_show_share',
            'mga_show_cta',
            'mga_show_fullscreen',
        ].forEach(registerPresetWatcher);

        const shareRepeater = doc.querySelector('[data-share-repeater]');

        if (shareRepeater) {
            initShareRepeater(shareRepeater);
        }

        const selectorsWrapper = doc.querySelector('[data-mga-content-selectors]');

        if (selectorsWrapper) {
            const selectorsList = selectorsWrapper.querySelector('[data-mga-content-selectors-list]');
            const selectorsTextarea = selectorsWrapper.querySelector('[data-mga-content-selectors-textarea]');
            const template = doc.getElementById('mga-content-selector-template');
            const placeholder = selectorsWrapper.getAttribute('data-mga-selector-placeholder') || '';
            let isSyncingSelectors = false;
            let addRow = () => {};

            if (selectorsList) {
                const queryRows = () => selectorsList.querySelectorAll('[data-mga-content-selector-row]');
                const queryInputs = () => selectorsList.querySelectorAll('[data-mga-content-selector-input]');
                const hasEmptyRow = () => Array.from(queryInputs()).some((input) => input.value.trim() === '');

                const updateRemoveState = () => {
                    const rows = queryRows();
                    const disable = rows.length <= 1;

                    rows.forEach((row) => {
                        const removeButton = row.querySelector('[data-mga-remove-selector]');

                        if (removeButton) {
                            removeButton.disabled = disable;
                            removeButton.setAttribute('aria-disabled', disable ? 'true' : 'false');
                        }
                    });
                };

                const getRowValues = () => Array.from(queryInputs()).map((input) => input.value.trim()).filter((value) => value !== '');

                const syncTextareaFromRows = () => {
                    if (!selectorsTextarea || isSyncingSelectors) {
                        return;
                    }

                    const values = getRowValues();
                    isSyncingSelectors = true;
                    selectorsTextarea.value = values.join('\n');
                    isSyncingSelectors = false;
                };

                const bindRow = (row) => {
                    if (!row || row.getAttribute('data-mga-selector-bound') === 'true') {
                        return;
                    }

                    const removeButton = row.querySelector('[data-mga-remove-selector]');

                    if (removeButton) {
                        removeButton.addEventListener('click', (event) => {
                            event.preventDefault();
                            const rows = queryRows();

                            if (rows.length <= 1) {
                                const input = row.querySelector('[data-mga-content-selector-input]');

                                if (input) {
                                    input.value = '';
                                    syncTextareaFromRows();
                                }

                                return;
                            }

                            row.remove();
                            updateRemoveState();
                            syncTextareaFromRows();
                        });
                    }

                    const input = row.querySelector('[data-mga-content-selector-input]');

                    if (input) {
                        input.addEventListener('input', () => {
                            if (!isSyncingSelectors) {
                                syncTextareaFromRows();
                            }
                        });

                        input.addEventListener('keydown', (event) => {
                            if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
                                return;
                            }

                            event.preventDefault();

                            if (!hasEmptyRow() && typeof addRow === 'function') {
                                addRow('');
                                return;
                            }

                            const rows = queryRows();

                            if (rows.length === 0) {
                                return;
                            }

                            const lastRow = rows[rows.length - 1];

                            if (!lastRow) {
                                return;
                            }

                            const lastInput = lastRow.querySelector('[data-mga-content-selector-input]');

                            if (lastInput && lastInput !== event.target) {
                                safeFocus(lastInput);
                            }
                        });

                        if (placeholder && !input.getAttribute('placeholder')) {
                            input.setAttribute('placeholder', placeholder);
                        }
                    }

                    row.setAttribute('data-mga-selector-bound', 'true');
                };

                const createRow = (value = '') => {
                    let row = null;

                    if (template && template.content) {
                        const fragment = doc.importNode(template.content, true);

                        row = fragment.firstElementChild;
                        if (row) {
                            const input = row.querySelector('[data-mga-content-selector-input]');

                            if (input) {
                                input.value = value;

                                if (placeholder) {
                                    input.setAttribute('placeholder', placeholder);
                                }
                            }

                            bindRow(row);

                            return row;
                        }
                    }

                    row = doc.createElement('div');
                    row.className = 'mga-content-selectors__row';
                    row.setAttribute('data-mga-content-selector-row', '');

                    const input = doc.createElement('input');
                    input.type = 'text';
                    input.className = 'regular-text';
                    input.setAttribute('data-mga-content-selector-input', '');
                    input.value = value;

                    if (placeholder) {
                        input.setAttribute('placeholder', placeholder);
                    }

                    row.appendChild(input);

                    const removeButton = doc.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'button-link mga-content-selectors__remove';
                    removeButton.setAttribute('data-mga-remove-selector', '');
                    removeButton.textContent = mgaAdmin__('Retirer', 'lightbox-jlg');
                    row.appendChild(removeButton);

                    bindRow(row);

                    return row;
                };

                const renderRows = (values) => {
                    selectorsList.innerHTML = '';

                    if (values.length === 0) {
                        const emptyRow = createRow('');
                        if (emptyRow) {
                            selectorsList.appendChild(emptyRow);
                        }
                    } else {
                        values.forEach((value) => {
                            const row = createRow(value);

                            if (row) {
                                selectorsList.appendChild(row);
                            }
                        });
                    }

                    updateRemoveState();
                };

                const syncRowsFromTextarea = () => {
                    if (!selectorsTextarea || isSyncingSelectors) {
                        return;
                    }

                    const values = selectorsTextarea.value
                        .split(/\r\n|\r|\n/)
                        .map((selector) => selector.trim())
                        .filter((selector) => selector.length > 0);

                    isSyncingSelectors = true;
                    renderRows(values);
                    isSyncingSelectors = false;
                };

                addRow = (value = '') => {
                    const row = createRow(value);

                    if (row) {
                        selectorsList.appendChild(row);
                        updateRemoveState();

                        const input = row.querySelector('[data-mga-content-selector-input]');

                        if (input) {
                            safeFocus(input);
                        }
                    }

                    syncTextareaFromRows();
                };

                if (selectorsTextarea) {
                    syncRowsFromTextarea();

                    selectorsTextarea.addEventListener('input', () => {
                        if (!isSyncingSelectors) {
                            syncRowsFromTextarea();
                        }
                    });
                } else {
                    renderRows([]);
                }

                const addButton = selectorsWrapper.querySelector('[data-mga-add-selector]');

                if (addButton) {
                    addButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        addRow();
                    });
                }
            }
        }
        function initShareRepeater(container) {
            const list = container.querySelector('[data-share-repeater-list]');
            const addButton = container.querySelector('[data-share-repeater-add]');
            const template = doc.getElementById('mga-share-channel-template');

            if (!list || !template) {
                return;
            }

            let uidSeed = Date.now();

            const generateUid = () => {
                uidSeed += 1;
                return `mga-share-channel-${uidSeed}`;
            };

            const ensureItemUid = (item) => {
                if (!item) {
                    return null;
                }

                if (!item.dataset.shareUid || item.dataset.shareUid.trim() === '') {
                    item.dataset.shareUid = generateUid();
                }

                return item.dataset.shareUid;
            };

            const applyUid = (item) => {
                const uid = ensureItemUid(item);

                if (!uid) {
                    return;
                }

                const idElements = item.querySelectorAll('[data-share-id-suffix]');

                idElements.forEach((element) => {
                    const suffix = element.getAttribute('data-share-id-suffix');

                    if (!suffix) {
                        return;
                    }

                    const id = `${uid}-${suffix}`;

                    if (element.tagName === 'LABEL') {
                        element.setAttribute('for', id);
                    } else {
                        element.id = id;
                    }
                });
            };

            const refreshItemTitle = (item) => {
                if (!item) {
                    return;
                }

                const title = item.querySelector('[data-share-repeater-title]');

                if (!title) {
                    return;
                }

                const labelInput = item.querySelector('[data-share-field="label"]');
                const keyInput = item.querySelector('[data-share-field="key"]');
                const labelValue = labelInput && typeof labelInput.value === 'string' ? labelInput.value.trim() : '';
                const keyValue = keyInput && typeof keyInput.value === 'string' ? keyInput.value.trim() : '';
                const fallback = keyValue ? keyValue.toUpperCase() : mgaAdmin__('Nouveau canal', 'lightbox-jlg');

                title.textContent = labelValue || fallback;
            };

            const updateIconPreview = (item) => {
                if (!item) {
                    return;
                }

                const preview = item.querySelector('[data-share-icon-preview]');
                const select = item.querySelector('[data-share-field="icon"]');

                if (!preview) {
                    return;
                }

                const iconKey = select ? select.value : '';
                const iconSvg = createShareIconPreview(iconKey);

                preview.innerHTML = '';

                if (iconSvg) {
                    preview.appendChild(iconSvg);
                }

                const summaryIcon = item.querySelector('[data-share-preview-icon]');

                if (summaryIcon) {
                    summaryIcon.innerHTML = '';

                    const summarySvg = createShareIconPreview(iconKey);

                    if (summarySvg) {
                        summaryIcon.appendChild(summarySvg);
                    }
                }
            };

            const getShareField = (item, key) => {
                if (!item || !key) {
                    return null;
                }

                return item.querySelector(`[data-share-field="${key}"]`);
            };

            const getShareFieldValue = (item, key) => {
                const field = getShareField(item, key);
                const value = field && typeof field.value === 'string' ? field.value.trim() : '';
                return value;
            };

            const buildSharePreviewUrl = (template) => {
                if (typeof template !== 'string') {
                    return '';
                }

                let previewValue = template;

                Object.keys(SHARE_TEMPLATE_PLACEHOLDERS).forEach((token) => {
                    const replacement = encodeURIComponent(SHARE_TEMPLATE_PLACEHOLDERS[token]);
                    previewValue = previewValue.replace(new RegExp(token, 'gi'), replacement);
                });

                return previewValue;
            };

            const hasRequiredPlaceholder = (template) => /%url%/i.test(typeof template === 'string' ? template : '');

            const isTemplateSchemeValid = (template) => {
                if (typeof template !== 'string') {
                    return false;
                }

                const trimmed = template.trim();

                if (trimmed === '') {
                    return false;
                }

                const scheme = trimmed.split(':')[0].toLowerCase();

                if (!SHARE_TEMPLATE_SCHEMES.includes(scheme)) {
                    return false;
                }

                if (scheme === 'http' || scheme === 'https') {
                    return /^https?:\/\//i.test(trimmed);
                }

                return true;
            };

            const applyFieldError = (field, messageElement, message) => {
                const hasMessage = typeof message === 'string' && message !== '';

                if (field) {
                    if (hasMessage) {
                        field.classList.add('mga-field-error');
                        field.setAttribute('aria-invalid', 'true');
                    } else {
                        field.classList.remove('mga-field-error');
                        field.removeAttribute('aria-invalid');
                    }
                }

                if (messageElement) {
                    if (hasMessage) {
                        messageElement.textContent = message;
                        messageElement.removeAttribute('hidden');
                    } else {
                        messageElement.textContent = '';
                        messageElement.setAttribute('hidden', 'hidden');
                    }
                }
            };

            const updateSharePreview = (item) => {
                if (!item) {
                    return;
                }

                const preview = item.querySelector('[data-share-preview]');

                if (!preview) {
                    return;
                }

                const labelElement = preview.querySelector('[data-share-preview-label]');
                const urlElement = preview.querySelector('[data-share-preview-url]');
                const labelValue = getShareFieldValue(item, 'label');
                const keyValue = getShareFieldValue(item, 'key');
                const fallbackLabel = keyValue ? keyValue.toUpperCase() : mgaAdmin__('Nouveau canal', 'lightbox-jlg');

                if (labelElement) {
                    labelElement.textContent = labelValue || fallbackLabel;
                }

                if (urlElement) {
                    const templateValue = getShareFieldValue(item, 'template');

                    if (templateValue) {
                        const previewUrl = buildSharePreviewUrl(templateValue);
                        urlElement.textContent = previewUrl;
                        urlElement.setAttribute('data-preview-empty', 'false');
                        urlElement.title = previewUrl;
                    } else {
                        urlElement.textContent = mgaAdmin__('Complétez le modèle pour générer un lien.', 'lightbox-jlg');
                        urlElement.setAttribute('data-preview-empty', 'true');
                        urlElement.removeAttribute('title');
                    }
                }
            };

            const validateShareItems = () => {
                const items = Array.from(list.querySelectorAll('[data-share-repeater-item]'));
                const keyOccurrences = items.reduce((accumulator, item) => {
                    const keyValue = getShareFieldValue(item, 'key').toLowerCase();

                    if (keyValue) {
                        accumulator[keyValue] = (accumulator[keyValue] || 0) + 1;
                    }

                    return accumulator;
                }, {});

                items.forEach((item) => {
                    const keyInput = getShareField(item, 'key');
                    const templateInput = getShareField(item, 'template');
                    const keyMessageEl = item.querySelector('[data-share-error="key"]');
                    const templateMessageEl = item.querySelector('[data-share-error="template"]');
                    const rawKeyValue = getShareFieldValue(item, 'key');
                    const normalizedKey = rawKeyValue.toLowerCase();
                    let keyMessage = '';

                    if (!rawKeyValue) {
                        keyMessage = mgaAdmin__('Renseignez une clé pour ce canal.', 'lightbox-jlg');
                    } else if (!/^[a-z0-9_-]+$/i.test(rawKeyValue)) {
                        keyMessage = mgaAdmin__('Utilisez uniquement des lettres, chiffres ou tirets.', 'lightbox-jlg');
                    } else if (keyOccurrences[normalizedKey] > 1) {
                        keyMessage = mgaAdmin__('Chaque clé doit être unique.', 'lightbox-jlg');
                    }

                    applyFieldError(keyInput, keyMessageEl, keyMessage);

                    const templateValue = getShareFieldValue(item, 'template');
                    let templateMessage = '';

                    if (!templateValue) {
                        templateMessage = mgaAdmin__('Renseignez un modèle d’URL.', 'lightbox-jlg');
                    } else if (!hasRequiredPlaceholder(templateValue)) {
                        templateMessage = mgaAdmin__('Ajoutez au moins le jeton %url% pour construire le lien.', 'lightbox-jlg');
                    } else if (!isTemplateSchemeValid(templateValue)) {
                        templateMessage = mgaAdmin__('Indiquez une URL valide (http, https, mailto, tel ou sms).', 'lightbox-jlg');
                    }

                    applyFieldError(templateInput, templateMessageEl, templateMessage);
                });
            };

            const updateItemNames = () => {
                const items = Array.from(list.querySelectorAll('[data-share-repeater-item]'));

                items.forEach((item, index) => {
                    const baseName = `mga_settings[share_channels][${index}]`;
                    const fields = item.querySelectorAll('[data-share-field]');

                    fields.forEach((field) => {
                        const fieldKey = field.getAttribute('data-share-field');

                        if (!fieldKey) {
                            return;
                        }

                        let effectiveKey = fieldKey;

                        if (fieldKey === 'enabled-hidden') {
                            effectiveKey = 'enabled';
                        }

                        field.name = `${baseName}[${effectiveKey}]`;
                    });

                    applyUid(item);
                    refreshItemTitle(item);
                    updateIconPreview(item);
                    updateSharePreview(item);
                });

                validateShareItems();
            };

            const focusItemField = (item) => {
                if (!item) {
                    return;
                }

                const target = item.querySelector('[data-share-field="label"]') || item;
                safeFocus(target);
            };

            list.addEventListener('input', (event) => {
                const target = event.target;

                if (!target) {
                    return;
                }

                const item = target.closest('[data-share-repeater-item]');

                if (!item) {
                    return;
                }

                if (target.matches('[data-share-field="label"], [data-share-field="key"]')) {
                    refreshItemTitle(item);
                }

                if (target.matches('[data-share-field="icon"]')) {
                    updateIconPreview(item);
                }

                updateSharePreview(item);
                validateShareItems();
            });

            list.addEventListener('change', (event) => {
                const target = event.target;

                if (!target || !target.matches('[data-share-field="icon"]')) {
                    return;
                }

                const item = target.closest('[data-share-repeater-item]');

                if (item) {
                    updateIconPreview(item);
                    updateSharePreview(item);
                    validateShareItems();
                }
            });

            list.addEventListener('click', (event) => {
                const button = event.target.closest('[data-share-action]');

                if (!button) {
                    return;
                }

                event.preventDefault();

                const action = button.getAttribute('data-share-action');
                const item = button.closest('[data-share-repeater-item]');

                if (!item) {
                    return;
                }

                if (action === 'remove') {
                    const nextFocusItem = item.nextElementSibling || item.previousElementSibling;

                    if (item.parentNode === list) {
                        list.removeChild(item);
                    }

                    updateItemNames();

                    if (nextFocusItem) {
                        focusItemField(nextFocusItem);
                    }

                    return;
                }

                if (action === 'move-up') {
                    const previous = item.previousElementSibling;

                    if (previous) {
                        list.insertBefore(item, previous);
                        updateItemNames();
                        focusItemField(item);
                    }

                    return;
                }

                if (action === 'move-down') {
                    const next = item.nextElementSibling;

                    if (next) {
                        list.insertBefore(next, item);
                        updateItemNames();
                        focusItemField(item);
                    }
                }
            });

            if (addButton) {
                addButton.addEventListener('click', (event) => {
                    event.preventDefault();

                    const fragment = doc.importNode(template.content, true);
                    const newItem = fragment.querySelector('[data-share-repeater-item]');

                    if (!newItem) {
                        return;
                    }

                    list.appendChild(newItem);
                    updateItemNames();
                    focusItemField(newItem);
                });
            }

            updateItemNames();
        }
    });
})(typeof window !== 'undefined' ? window : globalThis);
