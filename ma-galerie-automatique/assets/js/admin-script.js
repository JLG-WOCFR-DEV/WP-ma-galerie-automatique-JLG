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
    if(thumbSizeSlider) thumbSizeSlider.addEventListener('input', () => thumbSizeValue.textContent = thumbSizeSlider.value + 'px');

    const opacitySlider = document.getElementById('mga_bg_opacity');
    const opacityValue = document.getElementById('mga_bg_opacity_value');
    if(opacitySlider) opacitySlider.addEventListener('input', () => opacityValue.textContent = opacitySlider.value);
});