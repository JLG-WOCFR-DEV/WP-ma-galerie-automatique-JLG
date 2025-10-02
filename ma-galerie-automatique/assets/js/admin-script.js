/* eslint-disable no-underscore-dangle */
(function(global) {
    const mgaAdminI18n = global.wp && global.wp.i18n ? global.wp.i18n : null;
    const mgaAdmin__ = mgaAdminI18n && typeof mgaAdminI18n.__ === 'function' ? mgaAdminI18n.__ : ( text ) => text;
    const TOKEN_REGEX = /%(\d+\$)?([sd])/g;
    const fallbackSprintf = ( format, ...args ) => {
        let autoIndex = 0;

        return String(format).replace(TOKEN_REGEX, (match, position, type) => {
            let argIndex;

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

            if (argIndex < 0 || argIndex >= args.length) {
                return '';
            }

            const value = args[argIndex];

            if (typeof value === 'undefined') {
                return '';
            }

            if (type === 'd') {
                const coerced = parseInt(value, 10);
                return Number.isNaN(coerced) ? '' : String(coerced);
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
    });
})(typeof window !== 'undefined' ? window : globalThis);
