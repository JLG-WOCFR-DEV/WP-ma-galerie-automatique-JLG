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
    const navTabs = document.querySelectorAll('.mga-admin-wrap .nav-tab');
    const tabContents = document.querySelectorAll('.mga-admin-wrap .tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('nav-tab-active'));
            tabContents.forEach(c => c.classList.remove('active'));
            this.classList.add('nav-tab-active');
            document.querySelector(this.getAttribute('href')).classList.add('active');
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
