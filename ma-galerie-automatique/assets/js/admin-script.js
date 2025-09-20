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
    const thumbSizeSlider = document.getElementById('mga_thumb_size');
    const thumbSizeValue = document.getElementById('mga_thumb_size_value');
    const thumbSizeMobileSlider = document.getElementById('mga_thumb_size_mobile');
    const thumbSizeMobileValue = document.getElementById('mga_thumb_size_mobile_value');
    if (thumbSizeSlider && thumbSizeValue) {
        thumbSizeSlider.addEventListener('input', () => {
            thumbSizeValue.textContent = mgaAdminSprintf(mgaAdmin__('%spx', 'lightbox-jlg'), thumbSizeSlider.value);
        });
    }
    if (thumbSizeMobileSlider && thumbSizeMobileValue) {
        thumbSizeMobileSlider.addEventListener('input', () => {
            thumbSizeMobileValue.textContent = mgaAdminSprintf(mgaAdmin__('%spx', 'lightbox-jlg'), thumbSizeMobileSlider.value);
        });
    }

    const opacitySlider = document.getElementById('mga_bg_opacity');
    const opacityValue = document.getElementById('mga_bg_opacity_value');
    if(opacitySlider) opacitySlider.addEventListener('input', () => opacityValue.textContent = opacitySlider.value);
});
