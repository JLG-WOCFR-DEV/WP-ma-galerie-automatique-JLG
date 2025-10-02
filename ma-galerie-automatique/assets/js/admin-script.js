/* eslint-disable no-underscore-dangle */
(function(global) {
    const mgaAdminI18n = global.wp && global.wp.i18n ? global.wp.i18n : null;
    const mgaAdmin__ = mgaAdminI18n && typeof mgaAdminI18n.__ === 'function' ? mgaAdminI18n.__ : ( text ) => text;
    const mgaAdminSprintf = mgaAdminI18n && typeof mgaAdminI18n.sprintf === 'function'
        ? mgaAdminI18n.sprintf
        : ( format, ...args ) => {
            let index = 0;
            return format.replace(/%s/g, () => {
                const replacement = typeof args[index] !== 'undefined' ? args[index] : '';
                index += 1;
                return replacement;
            });
        };

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

        const selectorsWrapper = doc.querySelector('[data-mga-content-selectors]');

        if (selectorsWrapper) {
            const selectorsList = selectorsWrapper.querySelector('[data-mga-content-selectors-list]');
            const template = doc.getElementById('mga-content-selector-template');

            if (selectorsList) {
                const updateRemoveState = () => {
                    const rows = selectorsList.querySelectorAll('[data-mga-content-selector-row]');
                    const disable = rows.length <= 1;

                    rows.forEach((row) => {
                        const removeButton = row.querySelector('[data-mga-remove-selector]');

                        if (removeButton) {
                            removeButton.disabled = disable;
                            removeButton.setAttribute('aria-disabled', disable ? 'true' : 'false');
                        }
                    });
                };

                const refreshRowIds = () => {
                    const rows = selectorsList.querySelectorAll('[data-mga-content-selector-row]');

                    rows.forEach((row, index) => {
                        const input = row.querySelector('input[name="mga_settings[contentSelectors][]"]');

                        if (input) {
                            input.id = `mga-content-selector-${index}`;
                        }
                    });
                };

                const syncRowsState = () => {
                    refreshRowIds();
                    updateRemoveState();
                };

                const removeRow = (row) => {
                    if (!row) {
                        return;
                    }

                    const rows = selectorsList.querySelectorAll('[data-mga-content-selector-row]');

                    if (rows.length <= 1) {
                        const input = row.querySelector('input[name="mga_settings[contentSelectors][]"]');

                        if (input) {
                            input.value = '';
                        }

                        return;
                    }

                    row.remove();
                    syncRowsState();
                };

                const bindRow = (row) => {
                    if (!row || row.getAttribute('data-mga-selector-bound') === 'true') {
                        return;
                    }

                    const removeButton = row.querySelector('[data-mga-remove-selector]');

                    if (removeButton) {
                        removeButton.addEventListener('click', (event) => {
                            event.preventDefault();
                            removeRow(row);
                        });
                    }

                    row.setAttribute('data-mga-selector-bound', 'true');
                };

                const createRow = (value = '') => {
                    let row = null;

                    if (template && template.content) {
                        const fragment = doc.importNode(template.content, true);

                        row = fragment.firstElementChild;
                        if (row) {
                            bindRow(row);
                            const input = row.querySelector('input[name="mga_settings[contentSelectors][]"]');

                            if (input) {
                                input.value = value;
                            }

                            return row;
                        }
                    }

                    row = doc.createElement('div');
                    row.className = 'mga-content-selectors__row';
                    row.setAttribute('data-mga-content-selector-row', '');

                    const input = doc.createElement('input');
                    input.type = 'text';
                    input.className = 'regular-text';
                    input.name = 'mga_settings[contentSelectors][]';
                    input.value = value;
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

                const addRow = (value = '') => {
                    const row = createRow(value);

                    if (row) {
                        selectorsList.appendChild(row);

                        const input = row.querySelector('input[name="mga_settings[contentSelectors][]"]');

                        if (input) {
                            safeFocus(input);
                        }
                    }

                    syncRowsState();
                };

                Array.from(selectorsList.querySelectorAll('[data-mga-content-selector-row]')).forEach((row) => {
                    bindRow(row);
                });

                if (!selectorsList.querySelector('[data-mga-content-selector-row]')) {
                    addRow();
                } else {
                    syncRowsState();
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
    });
})(typeof window !== 'undefined' ? window : globalThis);
