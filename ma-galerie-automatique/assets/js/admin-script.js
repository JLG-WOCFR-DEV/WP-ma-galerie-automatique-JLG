const mgaAdminI18n = window.wp && window.wp.i18n ? window.wp.i18n : null;
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

document.addEventListener('DOMContentLoaded', function() {
    const navTabs = Array.from(document.querySelectorAll('.mga-admin-wrap .nav-tab'));
    const tabContents = Array.from(document.querySelectorAll('.mga-admin-wrap .tab-content'));

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
        const targetPanel = targetSelector ? document.querySelector(targetSelector) : null;

        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.setAttribute('aria-hidden', 'false');
            targetPanel.removeAttribute('hidden');
        }

        if (focusTab) {
            tab.focus({ preventScroll: true });
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
        const slider = document.getElementById(sliderId);
        const output = document.getElementById(outputId);

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
});
