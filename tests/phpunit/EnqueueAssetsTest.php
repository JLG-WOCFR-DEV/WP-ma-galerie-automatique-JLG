<?php
/**
 * @group enqueue
 */
class EnqueueAssetsTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        update_option( 'mga_settings', [] );

        $plugin = mga_plugin();

        if ( $plugin instanceof \MaGalerieAutomatique\Plugin ) {
            $plugin->settings()->invalidate_settings_cache();
        }

        // Prime the dependency containers so get_data() calls operate on known instances.
        wp_styles();
        wp_scripts();
    }

    public function tearDown(): void {
        wp_styles()->reset();
        wp_scripts()->reset();

        parent::tearDown();
    }

    /**
     * Ensures Swiper assets loaded from the CDN receive SRI and crossorigin metadata.
     */
    public function test_enqueue_sets_integrity_attributes_for_cdn_swiper_assets() {
        $post_id = self::factory()->post->create(
            [
                'post_content' => '<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->',
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        update_option(
            'mga_swiper_asset_sources',
            [
                'css'        => 'cdn',
                'js'         => 'cdn',
                'checked_at' => time(),
            ]
        );

        $this->assets()->enqueue_assets();

        $this->assertSame(
            MGA_SWIPER_CSS_SRI_HASH,
            wp_styles()->get_data( 'mga-swiper-css', 'integrity' ),
            'The Swiper CSS handle should declare the expected SRI hash when loading from the CDN.'
        );
        $this->assertSame(
            'anonymous',
            wp_styles()->get_data( 'mga-swiper-css', 'crossorigin' ),
            'The Swiper CSS handle should set crossorigin metadata when loading from the CDN.'
        );
        $this->assertSame(
            MGA_SWIPER_JS_SRI_HASH,
            wp_scripts()->get_data( 'mga-swiper-js', 'integrity' ),
            'The Swiper JS handle should declare the expected SRI hash when loading from the CDN.'
        );
        $this->assertSame(
            'anonymous',
            wp_scripts()->get_data( 'mga-swiper-js', 'crossorigin' ),
            'The Swiper JS handle should set crossorigin metadata when loading from the CDN.'
        );
    }

    /**
     * Ensures SRI metadata is omitted when a custom URL is injected via filters.
     */
    public function test_custom_swiper_urls_skip_integrity_metadata() {
        $post_id = self::factory()->post->create(
            [
                'post_content' => '<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->',
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        update_option(
            'mga_swiper_asset_sources',
            [
                'css'        => 'cdn',
                'js'         => 'cdn',
                'checked_at' => time(),
            ]
        );

        $css_callback = static fn() => 'https://cdn.example.com/swiper/swiper-bundle.min.css';
        $js_callback  = static fn() => 'https://cdn.example.com/swiper/swiper-bundle.min.js';

        add_filter( 'mga_swiper_css', $css_callback );
        add_filter( 'mga_swiper_js', $js_callback );

        try {
            $this->assets()->enqueue_assets();
        } finally {
            remove_filter( 'mga_swiper_css', $css_callback );
            remove_filter( 'mga_swiper_js', $js_callback );
        }

        $this->assertFalse(
            wp_styles()->get_data( 'mga-swiper-css', 'integrity' ),
            'The Swiper CSS handle should not declare an SRI hash when a custom URL is injected.'
        );
        $this->assertFalse(
            wp_styles()->get_data( 'mga-swiper-css', 'crossorigin' ),
            'The Swiper CSS handle should not declare crossorigin metadata when a custom URL is injected.'
        );
        $this->assertFalse(
            wp_scripts()->get_data( 'mga-swiper-js', 'integrity' ),
            'The Swiper JS handle should not declare an SRI hash when a custom URL is injected.'
        );
        $this->assertFalse(
            wp_scripts()->get_data( 'mga-swiper-js', 'crossorigin' ),
            'The Swiper JS handle should not declare crossorigin metadata when a custom URL is injected.'
        );
    }

    /**
     * Ensures inline assets consume the sanitized settings to guard regressions in the enqueue pipeline.
     */
    public function test_enqueue_clamps_and_reflects_settings() {
        $post_id = self::factory()->post->create(
            [
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        update_option(
            'mga_settings',
            [
                'thumb_size'         => 999,
                'thumb_size_mobile'  => 2,
                'delay'              => 0,
                'accent_color'       => 'not-a-color',
                'bg_opacity'         => -0.5,
                'z_index'            => -42,
                'background_style'   => 'invalid',
                'loop'               => '',
                'autoplay_start'     => '',
                'allowBodyFallback'  => '',
                'include_svg'        => '0',
                'contentSelectors'   => [ ' .entry-content ', "\n", '.entry-content' ],
                'debug_mode'         => true,
            ]
        );

        $this->assets()->enqueue_assets();

        $dynamic_styles = wp_styles()->get_data( 'mga-gallery-style', 'after' );
        $this->assertIsArray( $dynamic_styles, 'Inline style data should be stored under the "after" key.' );
        $this->assertNotEmpty( $dynamic_styles, 'The enqueue pipeline should generate a dynamic style block.' );

        $styles_blob = implode( '\n', $dynamic_styles );
        $this->assertStringContainsString( '--mga-thumb-size-desktop:150px', $styles_blob, 'Desktop thumb size should clamp to 150px.' );
        $this->assertStringContainsString( '--mga-thumb-size-mobile:40px', $styles_blob, 'Mobile thumb size should clamp to 40px.' );
        $this->assertStringContainsString( '--mga-accent-color:#ffffff', $styles_blob, 'Invalid accent colors should fall back to the default.' );
        $this->assertStringContainsString( '--mga-bg-opacity:0', $styles_blob, 'Opacity values should be clamped to zero when negative.' );
        $this->assertStringContainsString( '--mga-z-index:0', $styles_blob, 'Negative z-index values should be coerced to zero.' );

        $script_data = wp_scripts()->get_data( 'mga-gallery-script', 'before' );
        $this->assertIsArray( $script_data, 'Inline script data should be stored under the "before" key.' );
        $this->assertNotEmpty( $script_data, 'The enqueue pipeline should inject a settings payload before the script handle.' );

        $settings = $this->extract_settings_from_inline_script( $script_data );
        $this->assertSame( 150, $settings['thumb_size'], 'Desktop thumb size should be clamped to 150 in the script payload.' );
        $this->assertSame( 40, $settings['thumb_size_mobile'], 'Mobile thumb size should clamp to 40 in the script payload.' );
        $this->assertSame( '#ffffff', $settings['accent_color'], 'Accent color should fall back to the default hex value.' );
        $this->assertSame( 0.0, $settings['bg_opacity'], 'Negative opacity values should clamp to zero in the script payload.' );
        $this->assertSame( 0, $settings['z_index'], 'Negative z-index values should be coerced to zero in the script payload.' );
        $this->assertArrayHasKey( 'include_svg', $settings, 'The include_svg flag should be present in the script payload.' );
        $this->assertFalse( $settings['include_svg'], 'The include_svg flag should cast to false when disabled.' );
    }

    /**
     * Ensures the allowBodyFallback flag remains a boolean even when filters return truthy non-boolean values.
     *
     * @dataProvider allow_body_fallback_truthy_filter_values
     *
     * @param mixed $filter_value The value returned by the mga_frontend_allow_body_fallback filter.
     */
    public function test_enqueue_casts_allow_body_fallback_filter_to_boolean( $filter_value ) {
        $post_id = self::factory()->post->create(
            [
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        update_option(
            'mga_settings',
            [
                'allowBodyFallback' => true,
            ]
        );

        $filter = static function () use ( $filter_value ) {
            return $filter_value;
        };

        add_filter( 'mga_frontend_allow_body_fallback', $filter, 10, 2 );

        try {
            $this->assets()->enqueue_assets();
        } finally {
            remove_filter( 'mga_frontend_allow_body_fallback', $filter, 10 );
        }

        $script_data = wp_scripts()->get_data( 'mga-gallery-script', 'before' );
        $this->assertIsArray( $script_data, 'Inline script data should be stored under the "before" key.' );

        $settings = $this->extract_settings_from_inline_script( $script_data );

        $this->assertTrue(
            $settings['allowBodyFallback'],
            'The allowBodyFallback setting should be JSON-encoded as a boolean true value.'
        );
    }

    public function test_contextual_presets_override_settings_per_context(): void {
        $page_id = self::factory()->post->create(
            [
                'post_type'    => 'page',
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_type'    => 'post',
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        update_option(
            'mga_settings',
            [
                'show_share'         => true,
                'contextual_presets' => [
                    [
                        'key'       => 'page-focus',
                        'label'     => 'Page focus',
                        'enabled'   => true,
                        'priority'  => 1,
                        'contexts'  => [
                            'post_types'  => [ 'page' ],
                            'is_singular' => true,
                        ],
                        'settings'  => [
                            'delay'          => 9,
                            'autoplay_start' => 'enable',
                            'show_share'     => 'disable',
                        ],
                    ],
                ],
            ]
        );

        $this->go_to( get_permalink( $page_id ) );
        $this->assets()->enqueue_assets();

        $page_settings = $this->extract_settings_from_inline_script( (array) wp_scripts()->get_data( 'mga-gallery-script', 'before' ) );

        $this->assertSame( 9, $page_settings['delay'], 'Contextual preset should override the autoplay delay on matching pages.' );
        $this->assertTrue( $page_settings['autoplay_start'], 'Contextual preset should force autoplay when requested.' );
        $this->assertFalse( $page_settings['show_share'], 'Contextual preset should disable share controls for matching pages.' );
        $this->assertSame( 'page-focus', $page_settings['active_contextual_preset'], 'The active preset key should be exposed for diagnostics.' );

        wp_styles()->reset();
        wp_scripts()->reset();
        wp_styles();
        wp_scripts();

        $this->go_to( get_permalink( $post_id ) );
        $this->assets()->enqueue_assets();

        $post_settings = $this->extract_settings_from_inline_script( (array) wp_scripts()->get_data( 'mga-gallery-script', 'before' ) );

        $this->assertSame( 4, $post_settings['delay'], 'Non matching contexts should fallback to the global delay.' );
        $this->assertTrue( $post_settings['show_share'], 'Non matching contexts should keep global share controls.' );
        $this->assertArrayHasKey( 'active_contextual_preset', $post_settings, 'The payload should expose the active contextual preset flag.' );
        $this->assertNull( $post_settings['active_contextual_preset'], 'No preset should be reported for non matching content.' );
    }

    /**
     * Provides truthy filter return values that should still produce a boolean true in the JSON payload.
     *
     * @return array<string, array{0:mixed}>
     */
    public function allow_body_fallback_truthy_filter_values() {
        return [
            'integer_one' => [ 1 ],
            'string_yes'  => [ 'yes' ],
        ];
    }

    /**
     * Extracts and decodes the JSON payload from the inline script registered for mga-gallery-script.
     *
     * The assertion chain enforces that inline data remains JSON encoded (rather than arbitrary JS),
     * which helps detect unexpected changes in how settings are handed off to the frontend.
     *
     * @param string[] $script_data Inline script snippets registered for mga-gallery-script.
     *
     * @return array<string, mixed>
     */
    private function extract_settings_from_inline_script( array $script_data ) {
        $inline_blob = implode( '\n', $script_data );

        $this->assertMatchesRegularExpression(
            '/window\\.mga_settings = (?P<json>\{.*?\});/s',
            $inline_blob,
            'Inline script should assign a JSON payload to window.mga_settings.'
        );

        preg_match( '/window\\.mga_settings = (?P<json>\{.*?\});/s', $inline_blob, $matches );
        $this->assertArrayHasKey( 'json', $matches, 'The inline script should contain a JSON object assignment.' );

        $decoded = json_decode( $matches['json'], true );
        $this->assertIsArray( $decoded, 'The JSON payload assigned to window.mga_settings should decode to an array.' );

        return $decoded;
    }

    private function assets(): \MaGalerieAutomatique\Frontend\Assets {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->frontend_assets();
    }
}
