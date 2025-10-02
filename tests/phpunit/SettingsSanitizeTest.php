<?php
/**
 * @group settings
 */
class SettingsSanitizeTest extends WP_UnitTestCase {
    /**
     * @dataProvider sanitize_settings_provider
     *
     * @param array $input
     * @param array $existing
     * @param array $expected_subset
     */
    public function test_sanitize_settings( $input, $existing, $expected_subset ) {
        $result = $this->settings()->sanitize_settings( $input, $existing );

        foreach ( $expected_subset as $key => $expected_value ) {
            $this->assertArrayHasKey( $key, $result, sprintf( 'The %s key should exist in the sanitized settings.', $key ) );
            $this->assertSame( $expected_value, $result[ $key ], sprintf( 'The %s key did not match the expected sanitized value.', $key ) );
        }
    }

    /**
     * Provides scenarios that exercise the sanitize_settings() bounds and merge logic.
     *
     * @return array[]
     */
    public function sanitize_settings_provider() {
        $defaults          = $this->settings()->get_default_settings();
        $all_post_types    = get_post_types( [], 'names' );
        $default_tracked   = array_values( array_intersect( (array) $defaults['tracked_post_types'], $all_post_types ) );

        return [
            'numeric_bounds' => [
                [
                    'delay'             => 0,
                    'thumb_size'        => 200,
                    'thumb_size_mobile' => 5,
                    'bg_opacity'        => 1.5,
                    'z_index'           => -10,
                    'loop'              => '',
                    'autoplay_start'    => 1,
                    'debug_mode'        => '1',
                ],
                [],
                [
                    'delay'          => 1,
                    'thumb_size'     => 50,
                    'thumb_size_mobile' => 40,
                    'bg_opacity'     => 1.0,
                    'z_index'        => 0,
                    'loop'           => false,
                    'autoplay_start' => true,
                    'debug_mode'     => true,
                    'show_zoom'      => true,
                    'show_download'  => true,
                    'show_share'     => true,
                    'show_fullscreen'=> true,
                    'show_thumbs_mobile' => true,
                    'transition_effect' => $defaults['transition_effect'],
                    'transition_speed'  => $defaults['transition_speed'],
                    'toolbar_layout_desktop' => $defaults['toolbar_layout_desktop'],
                    'toolbar_layout_mobile'  => $defaults['toolbar_layout_mobile'],
                    'enable_fullwidth' => (bool) $defaults['enable_fullwidth'],
                ],
            ],
            'bg_opacity_lower_bound' => [
                [
                    'bg_opacity' => -2,
                ],
                [],
                [
                    'bg_opacity' => 0.0,
                ],
            ],
            'invalid_color_and_selectors' => [
                [
                    'accent_color'      => 'not-a-color',
                    'contentSelectors'  => [
                        ' <div>.gallery</div> ',
                        "	",
                        '.gallery',
                        '.gallery ',
                    ],
                    'tracked_post_types' => [ 'invalid', 'page', 'nonexistent' ],
                    'allowBodyFallback'  => '1',
                    'background_style'   => 'invalid',
                ],
                [],
                [
                    'accent_color'     => $defaults['accent_color'],
                    'contentSelectors' => [ '.gallery' ],
                    'tracked_post_types'=> [ 'page' ],
                    'allowBodyFallback' => true,
                    'background_style'  => $defaults['background_style'],
                ],
            ],
            'toolbar_toggles_casting_and_defaults' => [
                [
                    'show_zoom'       => '0',
                    'show_download'   => 0,
                    'show_share'      => '1',
                ],
                [],
                [
                    'show_zoom'       => false,
                    'show_download'   => false,
                    'show_share'      => true,
                    'show_fullscreen' => $defaults['show_fullscreen'],
                    'show_thumbs_mobile' => $defaults['show_thumbs_mobile'],
                ],
            ],
            'show_thumbs_mobile_toggle' => [
                [
                    'show_thumbs_mobile' => '0',
                ],
                [
                    'show_thumbs_mobile' => true,
                ],
                [
                    'show_thumbs_mobile' => false,
                ],
            ],
            'bogus_post_types_fall_back_to_defaults' => [
                [
                    'tracked_post_types' => [ 'not-real', 'also_bad' ],
                ],
                [],
                [
                    'tracked_post_types' => $default_tracked,
                ],
            ],
            'existing_settings_merge_logic' => [
                [
                    'contentSelectors' => 'body',
                ],
                [
                    'contentSelectors'   => [ ' .existing ', '<span>#persisted</span>', '' ],
                    'tracked_post_types' => [ 'page', 'invalid', 'post' ],
                ],
                [
                    'contentSelectors'   => [ 'body' ],
                    'tracked_post_types' => [ 'page', 'post' ],
                ],
            ],
            'newline_separated_selectors' => [
                [
                    'contentSelectors' => ".main\n.article-content\r\n\t\n .gallery img\n",
                ],
                [],
                [
                    'contentSelectors' => [ '.main', '.article-content', '.gallery img' ],
                ],
            ],
            'transition_bounds_and_layout' => [
                [
                    'transition_effect'      => 'cube',
                    'transition_speed'       => 50,
                    'toolbar_layout_desktop' => 'bottom',
                    'toolbar_layout_mobile'  => 'invalid',
                    'enable_fullwidth'       => '1',
                ],
                [],
                [
                    'transition_effect'      => 'cube',
                    'transition_speed'       => 100,
                    'toolbar_layout_desktop' => 'bottom',
                    'toolbar_layout_mobile'  => $defaults['toolbar_layout_mobile'],
                    'enable_fullwidth'       => true,
                ],
            ],
            'transition_existing_fallback' => [
                [
                    'transition_effect' => 'unknown',
                ],
                [
                    'transition_effect'      => 'fade',
                    'transition_speed'       => 1800,
                    'toolbar_layout_desktop' => 'bottom',
                    'toolbar_layout_mobile'  => 'bottom',
                    'enable_fullwidth'       => true,
                ],
                [
                    'transition_effect'      => 'fade',
                    'transition_speed'       => 1800,
                    'toolbar_layout_desktop' => 'bottom',
                    'toolbar_layout_mobile'  => 'bottom',
                    'enable_fullwidth'       => true,
                ],
            ],
        ];
    }

    private function settings(): \MaGalerieAutomatique\Admin\Settings {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->settings();
    }
}

