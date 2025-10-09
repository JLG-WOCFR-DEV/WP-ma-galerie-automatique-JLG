/* eslint-disable no-underscore-dangle */
import {
    createIconPreview,
    createSprintf,
    createTranslate,
    detectFocusOptionsSupport,
    exposeOnWindow,
    resolveI18n,
    safeFocus,
    sanitizeIconKey,
} from './shared';

(function(global) {
    exposeOnWindow();

    const mgaAdminI18n = resolveI18n(global);
    const mgaAdmin__ = createTranslate(mgaAdminI18n);
    const mgaAdminSprintf = createSprintf(mgaAdminI18n);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            detectFocusOptionsSupport,
            safeFocus,
        };
    }

    const doc = global.document;

    const createShareIconPreview = (iconKey) => {
        const preview = createIconPreview(doc, sanitizeIconKey(iconKey));

        if (!preview) {
            return null;
        }

        const svg = preview.querySelector('svg');

        return svg || preview;
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
        const form = doc.querySelector('[data-mga-settings-form]') || doc.querySelector('.mga-admin-wrap form');
        const adminRoot = doc.querySelector('.mga-admin-wrap');
        let scheduleSummaryRefresh = () => {};

        const THEME_STORAGE_KEY = 'mgaAdminThemePreference';
        const THEME_OPTIONS = ['light', 'dark', 'system'];
        const themeSelect = adminRoot ? adminRoot.querySelector('[data-mga-theme-select]') : null;
        const systemThemeQuery = typeof global.matchMedia === 'function'
            ? global.matchMedia('(prefers-color-scheme: dark)')
            : null;

        const readStoredTheme = () => {
            try {
                return global.localStorage ? global.localStorage.getItem(THEME_STORAGE_KEY) : null;
            } catch (error) {
                return null;
            }
        };

        const writeStoredTheme = (value) => {
            try {
                if (!global.localStorage) {
                    return;
                }
                if (!value) {
                    global.localStorage.removeItem(THEME_STORAGE_KEY);
                    return;
                }
                global.localStorage.setItem(THEME_STORAGE_KEY, value);
            } catch (error) {
                // Silently ignore storage errors (quota, private mode, etc.).
            }
        };

        const normalizeThemePreference = (value) => {
            if (typeof value !== 'string') {
                return 'system';
            }

            const trimmed = value.trim().toLowerCase();
            return THEME_OPTIONS.includes(trimmed) ? trimmed : 'system';
        };

        let currentThemePreference = normalizeThemePreference(readStoredTheme());

        const resolveAppliedTheme = (preference) => {
            if (preference === 'dark') {
                return 'dark';
            }
            if (preference === 'light') {
                return 'light';
            }

            const prefersDark = systemThemeQuery && typeof systemThemeQuery.matches === 'boolean'
                ? systemThemeQuery.matches
                : false;

            return prefersDark ? 'dark' : 'light';
        };

        const applyThemePreference = (preference, options = {}) => {
            if (!adminRoot) {
                return;
            }

            const normalizedPreference = normalizeThemePreference(preference);
            const resolvedTheme = resolveAppliedTheme(normalizedPreference);

            adminRoot.setAttribute('data-mga-theme-preference', normalizedPreference);
            adminRoot.setAttribute('data-mga-theme', resolvedTheme);
            adminRoot.classList.toggle('is-theme-dark', resolvedTheme === 'dark');
            adminRoot.classList.toggle('is-theme-light', resolvedTheme !== 'dark');

            if (themeSelect && themeSelect.value !== normalizedPreference) {
                themeSelect.value = normalizedPreference;
            }

            if (!options.skipStorage) {
                writeStoredTheme(normalizedPreference === 'system' ? '' : normalizedPreference);
            }

            currentThemePreference = normalizedPreference;
        };

        if (adminRoot) {
            applyThemePreference(currentThemePreference, { skipStorage: true });
        }

        if (themeSelect) {
            themeSelect.value = currentThemePreference;
            themeSelect.addEventListener('change', (event) => {
                const nextPreference = normalizeThemePreference(event.target ? event.target.value : null);
                applyThemePreference(nextPreference);
            });
        }

        const handleSystemThemeChange = () => {
            if (currentThemePreference === 'system') {
                applyThemePreference('system', { skipStorage: true });
            }
        };

        if (systemThemeQuery) {
            if (typeof systemThemeQuery.addEventListener === 'function') {
                systemThemeQuery.addEventListener('change', handleSystemThemeChange);
            } else if (typeof systemThemeQuery.addListener === 'function') {
                systemThemeQuery.addListener(handleSystemThemeChange);
            }
        }

        const initializeWizard = (targetForm) => {
            const wizard = doc.querySelector('[data-mga-wizard]');

            if (!wizard) {
                return null;
            }

            const stepPanels = Array.from(wizard.querySelectorAll('[data-mga-step-panel]'));
            const indicators = Array.from(wizard.querySelectorAll('[data-mga-step-indicator]'));
            const prevButton = wizard.querySelector('[data-mga-step-prev]');
            const nextButton = wizard.querySelector('[data-mga-step-next]');
            const submitButton = wizard.querySelector('[data-mga-step-submit]');
            const statusElement = wizard.querySelector('[data-mga-save-status]');
            const summaryIndex = stepPanels.length - 1;
            let currentIndex = stepPanels.findIndex((panel) => panel.classList.contains('is-active'));

            if (currentIndex < 0) {
                currentIndex = 0;
            }

            const getMessages = () => (global.mgaAdminConfig && global.mgaAdminConfig.messages) || {};

            const setStatusMessage = (state, message) => {
                if (!statusElement) {
                    return;
                }

                const statusMessage = message || getMessages()[state] || '';

                statusElement.textContent = statusMessage;
                statusElement.setAttribute('data-mga-status-state', state);
            };

            const updateControls = () => {
                if (prevButton) {
                    prevButton.disabled = currentIndex === 0;
                }

                if (nextButton) {
                    nextButton.hidden = currentIndex >= summaryIndex;
                }

                if (submitButton) {
                    submitButton.hidden = currentIndex < summaryIndex;
                }
            };

            const focusPanel = (panel) => {
                if (!panel) {
                    return;
                }

                const focusTarget = panel.querySelector('[data-mga-step-title]') || panel;
                const focusOptions = detectFocusOptionsSupport() ? { preventScroll: true } : undefined;

                global.requestAnimationFrame(() => {
                    safeFocus(focusTarget, focusOptions);
                });
            };

            const deactivatePanel = (panel) => {
                panel.classList.remove('is-active');
                panel.setAttribute('hidden', 'hidden');
                panel.setAttribute('aria-hidden', 'true');
            };

            const activatePanel = (panel) => {
                panel.classList.add('is-active');
                panel.removeAttribute('hidden');
                panel.setAttribute('aria-hidden', 'false');
            };

            const updateIndicators = () => {
                indicators.forEach((indicator, index) => {
                    indicator.classList.toggle('is-active', index === currentIndex);
                    indicator.classList.toggle('is-completed', index < currentIndex);
                    indicator.setAttribute('aria-current', index === currentIndex ? 'step' : 'false');
                });
            };

            const updateSummaryContainers = (() => {
                let timeoutId = null;

                const presetTarget = wizard.querySelector('[data-mga-summary-preset]');
                const timingTarget = wizard.querySelector('[data-mga-summary-timing]');
                const toolbarTarget = wizard.querySelector('[data-mga-summary-toolbar]');
                const shareTarget = wizard.querySelector('[data-mga-summary-share]');

                const renderToolbarSummary = () => {
                    if (!toolbarTarget) {
                        return;
                    }

                    const toolbarToggles = [
                        { id: 'mga_show_zoom', label: mgaAdmin__('Zoom', 'lightbox-jlg') },
                        { id: 'mga_show_download', label: mgaAdmin__('Téléchargement', 'lightbox-jlg') },
                        { id: 'mga_show_share', label: mgaAdmin__('Partage', 'lightbox-jlg') },
                        { id: 'mga_show_cta', label: mgaAdmin__('Appel à l’action', 'lightbox-jlg') },
                        { id: 'mga_show_fullscreen', label: mgaAdmin__('Plein écran', 'lightbox-jlg') },
                    ];

                    const active = toolbarToggles.filter((toggle) => {
                        const input = doc.getElementById(toggle.id);
                        return input ? input.checked : false;
                    });

                    toolbarTarget.textContent = active.length > 0
                        ? active.map((toggle) => toggle.label).join(', ')
                        : mgaAdmin__('Aucun bouton affiché', 'lightbox-jlg');
                };

                const renderPresetSummary = () => {
                    if (!presetTarget) {
                        return;
                    }

                    const presetSelect = doc.getElementById('mga_style_preset');
                    const value = presetSelect ? presetSelect.value : '';

                    if (!presetSelect) {
                        presetTarget.textContent = mgaAdmin__('Réglages personnalisés', 'lightbox-jlg');
                        return;
                    }

                    const fallback = Array.from(presetSelect.options).find((option) => option.value === value);
                    let label = fallback ? fallback.textContent : mgaAdmin__('Réglages personnalisés', 'lightbox-jlg');

                    if (global.mgaStylePresets && global.mgaStylePresets.presets) {
                        const preset = global.mgaStylePresets.presets[value];

                        if (preset && preset.label) {
                            label = preset.label;
                        }
                    }

                    if (!value) {
                        label = global.mgaStylePresets && global.mgaStylePresets.customDescription
                            ? global.mgaStylePresets.customDescription
                            : label;
                    }

                    presetTarget.textContent = label;
                };

                const renderTimingSummary = () => {
                    if (!timingTarget) {
                        return;
                    }

                    const delayInput = doc.getElementById('mga_delay');
                    const effectSelect = doc.getElementById('mga_effect');
                    const delayValue = delayInput && delayInput.value ? delayInput.value : '—';
                    let effectLabel = mgaAdmin__('Transition personnalisée', 'lightbox-jlg');

                    if (effectSelect) {
                        const selectedOption = Array.from(effectSelect.options).find((option) => option.selected);
                        effectLabel = selectedOption ? selectedOption.textContent : effectLabel;
                    }

                    timingTarget.textContent = mgaAdminSprintf(
                        mgaAdmin__('Diaporama : %1$s s · Effet : %2$s', 'lightbox-jlg'),
                        delayValue,
                        effectLabel
                    );
                };

                const renderShareSummary = () => {
                    if (!shareTarget) {
                        return;
                    }

                    const items = Array.from(doc.querySelectorAll('[data-share-repeater-item]'));
                    const activeLabels = items
                        .filter((item) => {
                            const enabledField = item.querySelector('[data-share-field="enabled"]');
                            return enabledField ? enabledField.checked : false;
                        })
                        .map((item) => {
                            const labelField = item.querySelector('[data-share-field="label"]');
                            const keyField = item.querySelector('[data-share-field="key"]');
                            const labelValue = labelField && labelField.value ? labelField.value.trim() : '';
                            const keyValue = keyField && keyField.value ? keyField.value.trim() : '';

                            return labelValue || (keyValue ? keyValue.toUpperCase() : mgaAdmin__('Canal sans titre', 'lightbox-jlg'));
                        });

                    if (activeLabels.length > 0) {
                        shareTarget.textContent = mgaAdminSprintf(
                            mgaAdmin__('%1$d canaux actifs : %2$s', 'lightbox-jlg'),
                            activeLabels.length,
                            activeLabels.join(', ')
                        );
                    } else {
                        shareTarget.textContent = mgaAdmin__('Aucun canal actif', 'lightbox-jlg');
                    }
                };

                const update = () => {
                    renderPresetSummary();
                    renderTimingSummary();
                    renderToolbarSummary();
                    renderShareSummary();
                };

                return () => {
                    if (timeoutId) {
                        global.clearTimeout(timeoutId);
                    }

                    timeoutId = global.setTimeout(() => {
                        timeoutId = null;
                        update();
                    }, 120);
                };
            })();

            const goToStep = (targetIndex) => {
                const normalizedIndex = Math.max(0, Math.min(stepPanels.length - 1, targetIndex));

                if (normalizedIndex === currentIndex) {
                    return;
                }

                const currentPanel = stepPanels[currentIndex];
                const nextPanel = stepPanels[normalizedIndex];

                if (currentPanel) {
                    deactivatePanel(currentPanel);
                }

                if (nextPanel) {
                    activatePanel(nextPanel);
                    focusPanel(nextPanel);
                }

                currentIndex = normalizedIndex;
                updateIndicators();
                updateControls();

                if (currentIndex === summaryIndex) {
                    updateSummaryContainers();
                }
            };

            const handleNext = () => {
                if (targetForm && typeof targetForm.reportValidity === 'function' && !targetForm.reportValidity()) {
                    return;
                }

                goToStep(currentIndex + 1);
            };

            const handlePrev = () => {
                goToStep(currentIndex - 1);
            };

            const attachIndicatorNavigation = () => {
                indicators.forEach((indicator, index) => {
                    indicator.addEventListener('click', (event) => {
                        event.preventDefault();

                        if (index < currentIndex && index >= 0) {
                            goToStep(index);
                        } else if (index > currentIndex && index <= summaryIndex) {
                            if (targetForm && typeof targetForm.reportValidity === 'function' && !targetForm.reportValidity()) {
                                return;
                            }

                            goToStep(index);
                        }
                    });
                });
            };

            if (prevButton) {
                prevButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    handlePrev();
                });
            }

            if (nextButton) {
                nextButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    handleNext();
                });
            }

            attachIndicatorNavigation();
            updateIndicators();
            updateControls();

            if (currentIndex === summaryIndex) {
                updateSummaryContainers();
            }

            const handleFormInput = () => {
                updateSummaryContainers();
            };

            if (targetForm) {
                targetForm.addEventListener('change', handleFormInput);
                targetForm.addEventListener('input', handleFormInput);
            }

            return {
                scheduleSummaryUpdate: updateSummaryContainers,
                setStatusMessage,
                goToSummary: () => goToStep(summaryIndex),
            };
        };

        const wizardApi = initializeWizard(form);

        if (wizardApi && typeof wizardApi.scheduleSummaryUpdate === 'function') {
            scheduleSummaryRefresh = wizardApi.scheduleSummaryUpdate;
        }

        const initializeAsyncSave = (targetForm, wizard) => {
            if (!targetForm) {
                return;
            }

            const config = global.mgaAdminConfig || {};
            const ajaxUrl = typeof config.ajaxUrl === 'string' && config.ajaxUrl ? config.ajaxUrl : global.ajaxurl;
            const nonce = typeof config.nonce === 'string' ? config.nonce : '';
            const submitButton = targetForm.querySelector('[data-mga-step-submit]');

            if (!ajaxUrl || !nonce) {
                return;
            }

            const setStatus = (state, explicitMessage) => {
                if (wizard && typeof wizard.setStatusMessage === 'function') {
                    wizard.setStatusMessage(state, explicitMessage);
                }
            };

            const setSavingState = (isSaving) => {
                if (submitButton) {
                    submitButton.disabled = isSaving;
                    submitButton.setAttribute('aria-busy', isSaving ? 'true' : 'false');
                }

                if (isSaving) {
                    setStatus('saving');
                }
            };

            targetForm.addEventListener('submit', (event) => {
                event.preventDefault();

                if (typeof targetForm.reportValidity === 'function' && !targetForm.reportValidity()) {
                    return;
                }

                const formData = new FormData(targetForm);
                formData.append('action', 'mga_save_settings');
                formData.append('_ajax_nonce', nonce);

                setSavingState(true);

                fetch(ajaxUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData,
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(response.statusText || 'HTTP error');
                        }

                        return response.json();
                    })
                    .then((payload) => {
                        if (!payload || payload.success !== true) {
                            const message = payload && payload.data && payload.data.message
                                ? payload.data.message
                                : null;

                            throw new Error(message || (config.messages && config.messages.error) || mgaAdmin__('Impossible d’enregistrer les réglages.', 'lightbox-jlg'));
                        }

                        const successMessage = payload.data && payload.data.message
                            ? payload.data.message
                            : (config.messages && config.messages.success) || mgaAdmin__('Réglages enregistrés.', 'lightbox-jlg');

                        setStatus('success', successMessage);
                        scheduleSummaryRefresh();
                    })
                    .catch((error) => {
                        const fallbackMessage = (config.messages && config.messages.error)
                            ? config.messages.error
                            : mgaAdmin__('Impossible d’enregistrer les réglages.', 'lightbox-jlg');

                        setStatus('error', error && error.message ? error.message : fallbackMessage);
                    })
                    .finally(() => {
                        setSavingState(false);
                    });
            });
        };

        initializeAsyncSave(form, wizardApi);

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

                scheduleSummaryRefresh();
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

                scheduleSummaryRefresh();
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
                    scheduleSummaryRefresh();

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
                        scheduleSummaryRefresh();
                    }

                    return;
                }

                if (action === 'move-down') {
                    const next = item.nextElementSibling;

                    if (next) {
                        list.insertBefore(next, item);
                        updateItemNames();
                        focusItemField(item);
                        scheduleSummaryRefresh();
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
                    scheduleSummaryRefresh();
                });
            }

            updateItemNames();
            scheduleSummaryRefresh();
        }
    });
})(typeof window !== 'undefined' ? window : globalThis);
