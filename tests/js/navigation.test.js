describe('navigation helpers', () => {
    let helpers;

    beforeEach(() => {
        jest.resetModules();
        helpers = require('../../ma-galerie-automatique/assets/js/src/navigation.js');
    });

    it('sanitizes effect names', () => {
        expect(helpers.sanitizeEffect('Fade')).toBe('fade');
        expect(helpers.sanitizeEffect('unknown')).toBe(helpers.DEFAULT_EFFECT);
    });

    it('sanitizes transition speeds', () => {
        expect(helpers.sanitizeSpeed('200')).toBe(200);
        expect(helpers.sanitizeSpeed('fast')).toBe(helpers.DEFAULT_SPEED);
        expect(helpers.sanitizeSpeed('50')).toBe(100);
        expect(helpers.sanitizeSpeed('9000')).toBe(5000);
    });

    it('sanitizes easing functions', () => {
        expect(helpers.sanitizeEasing(' ease-in-out ')).toBe('ease-in-out');
        expect(helpers.sanitizeEasing(null)).toBe(helpers.DEFAULT_EASING);
    });

    it('sanitizes thumbs layout values', () => {
        expect(helpers.sanitizeThumbsLayout('LEFT')).toBe('left');
        expect(helpers.sanitizeThumbsLayout('unknown')).toBe(helpers.DEFAULT_THUMBS_LAYOUT);
    });

    it('detects heavy effects', () => {
        expect(helpers.isHeavyEffect('cube')).toBe(true);
        expect(helpers.isHeavyEffect('slide')).toBe(false);
    });

    describe('resolveTriggerLinkFromEventTarget', () => {
        it('returns the image link when clicking the photo', () => {
            document.body.innerHTML = `
                <figure class="wp-block-image">
                    <a href="https://example.com/full.jpg" id="photo-link">
                        <img src="https://example.com/thumb.jpg" alt="Forêt" />
                    </a>
                    <figcaption>Sentier forestier</figcaption>
                </figure>
            `;

            const img = document.querySelector('img');
            expect(helpers.resolveTriggerLinkFromEventTarget(img)).toBe(document.getElementById('photo-link'));
        });

        it('returns the image link when clicking the figcaption or the figure', () => {
            document.body.innerHTML = `
                <figure class="wp-block-image" id="figure">
                    <a href="https://example.com/full.jpg" id="photo-link">
                        <img src="https://example.com/thumb.jpg" alt="Forêt" />
                    </a>
                    <figcaption id="caption">Sentier forestier</figcaption>
                </figure>
            `;

            const caption = document.getElementById('caption');
            const figure = document.getElementById('figure');
            const photoLink = document.getElementById('photo-link');

            expect(helpers.resolveTriggerLinkFromEventTarget(caption)).toBe(photoLink);
            expect(helpers.resolveTriggerLinkFromEventTarget(figure)).toBe(photoLink);
        });

        it('does not hijack a credit link inside the caption', () => {
            document.body.innerHTML = `
                <figure class="wp-block-image">
                    <a href="https://example.com/full.jpg" id="photo-link">
                        <img src="https://example.com/thumb.jpg" alt="Forêt" />
                    </a>
                    <figcaption>Crédit <a href="https://commons.wikimedia.org/" id="credit-link">Wikimedia</a></figcaption>
                </figure>
            `;

            expect(helpers.resolveTriggerLinkFromEventTarget(document.getElementById('credit-link'))).toBeNull();
        });
    });

    describe('navigateSwiperSlide', () => {
        const createSwiper = ({ loop = true, running = true, realIndex = 1, slidesCount = 8 } = {}) => {
            const callOrder = [];
            const autoplay = {
                running,
                stop: jest.fn(() => {
                    callOrder.push('stop');
                    autoplay.running = false;
                }),
                start: jest.fn(() => {
                    callOrder.push('start');
                    autoplay.running = true;
                }),
            };

            const swiper = {
                destroyed: false,
                realIndex,
                activeIndex: realIndex,
                slides: Array.from({ length: slidesCount }),
                params: { loop },
                autoplay,
                slideToLoop: jest.fn(() => {
                    callOrder.push('slide');
                }),
                slideTo: jest.fn(() => {
                    callOrder.push('slide');
                }),
                slidePrev: jest.fn(() => {
                    callOrder.push('prev');
                }),
                slideNext: jest.fn(() => {
                    callOrder.push('next');
                }),
            };

            return { swiper, callOrder };
        };

        it('stops autoplay before going previous then restarts it', () => {
            const { swiper, callOrder } = createSwiper({ realIndex: 1 });

            expect(helpers.navigateSwiperSlide(swiper, 'prev', { slidesCount: 8 })).toBe(true);
            expect(swiper.slideToLoop).toHaveBeenCalledWith(0);
            expect(swiper.slidePrev).not.toHaveBeenCalled();
            expect(callOrder).toEqual(['stop', 'slide', 'start']);
        });

        it('stops autoplay before going next then restarts it', () => {
            const { swiper, callOrder } = createSwiper({ realIndex: 0 });

            expect(helpers.navigateSwiperSlide(swiper, 'next', { slidesCount: 8 })).toBe(true);
            expect(swiper.slideToLoop).toHaveBeenCalledWith(1);
            expect(swiper.slideNext).not.toHaveBeenCalled();
            expect(callOrder).toEqual(['stop', 'slide', 'start']);
        });

        it('wraps to the last slide with loop on ArrowLeft from the first slide', () => {
            const { swiper } = createSwiper({ realIndex: 0, slidesCount: 8 });

            helpers.navigateSwiperSlide(swiper, 'prev', { slidesCount: 8 });
            expect(swiper.slideToLoop).toHaveBeenCalledWith(7);
        });

        it('does not call slidePrev while autoplay is running', () => {
            const { swiper } = createSwiper({ running: true, realIndex: 2 });

            helpers.navigateSwiperSlide(swiper, 'prev', { slidesCount: 8 });
            expect(swiper.slidePrev).not.toHaveBeenCalled();
            expect(swiper.slideNext).not.toHaveBeenCalled();
        });
    });
});
