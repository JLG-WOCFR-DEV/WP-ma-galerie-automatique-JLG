<?php

use MaGalerieAutomatique\Admin\Settings;
/**
 * @group settings
 */
class SettingsSanitizeTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        global $wp_settings_errors;

        $wp_settings_errors = [];

        update_option( 'mga_settings', [] );

        $plugin = mga_plugin();

        if ( $plugin instanceof \MaGalerieAutomatique\Plugin ) {
            $plugin->settings()->invalidate_settings_cache();
        }
    }

    /**
     * @dataProvider sanitize_settings_provider
     *
     * @param array $input
     * @param array $existing
     * @param array $expected_subset
     */
    public function test_sanitize_settings( $input, $existing, $expected_subset ) {
        $expected_doing_it_wrong = null;

        if ( array_key_exists( '__expected_doing_it_wrong', $expected_subset ) ) {
            $expected_doing_it_wrong = (int) $expected_subset['__expected_doing_it_wrong'];
            unset( $expected_subset['__expected_doing_it_wrong'] );
        }

        $doing_it_wrong_listener = null;
        $doing_it_wrong_count    = 0;

        if ( null !== $expected_doing_it_wrong ) {
            $doing_it_wrong_listener = static function () use ( &$doing_it_wrong_count ) {
                $doing_it_wrong_count++;
            };

            add_action( 'doing_it_wrong_run', $doing_it_wrong_listener );
        }

        $result = $this->settings()->sanitize_settings( $input, $existing );

        if ( null !== $doing_it_wrong_listener ) {
            remove_action( 'doing_it_wrong_run', $doing_it_wrong_listener );

            $this->assertSame(
                $expected_doing_it_wrong,
                $doing_it_wrong_count,
                'The number of doing_it_wrong notices did not match the expected count.'
            );
        }

        foreach ( $expected_subset as $key => $expected_value ) {
            $this->assertArrayHasKey( $key, $result, sprintf( 'The %s key should exist in the sanitized settings.', $key ) );

            if ( 'share_channels' === $key ) {
                $actual_channels = [];

                foreach ( (array) $result[ $key ] as $channel_key => $channel_settings ) {
                    if ( ! is_array( $channel_settings ) ) {
                        continue;
                    }

                    $normalized_key = '';

                    if ( isset( $channel_settings['key'] ) && '' !== $channel_settings['key'] ) {
                        $normalized_key = (string) $channel_settings['key'];
                    } elseif ( is_string( $channel_key ) && '' !== $channel_key ) {
                        $normalized_key = (string) $channel_key;
                    }

                    if ( '' === $normalized_key ) {
                        continue;
                    }

                    $actual_channels[ $normalized_key ] = $channel_settings;
                }

                foreach ( $expected_value as $channel_key => $expected_channel_settings ) {
                    $this->assertArrayHasKey(
                        $channel_key,
                        $actual_channels,
                        sprintf( 'The %s share channel should exist after sanitization.', $channel_key )
                    );

                    foreach ( $expected_channel_settings as $setting_key => $expected_setting_value ) {
                        $this->assertArrayHasKey(
                            $setting_key,
                            $actual_channels[ $channel_key ],
                            sprintf(
                                'The %s field should be present for the %s share channel after sanitization.',
                                $setting_key,
                                $channel_key
                            )
                        );

                        $this->assertSame(
                            $expected_setting_value,
                            $actual_channels[ $channel_key ][ $setting_key ],
                            sprintf(
                                'The %s share channel %s field should match the expected sanitized value.',
                                $channel_key,
                                $setting_key
                            )
                        );
                    }
                }

                continue;
            }

            $this->assertSame( $expected_value, $result[ $key ], sprintf( 'The %s key did not match the expected sanitized value.', $key ) );
        }
    }

    /**
     * Provides scenarios that exercise the sanitize_settings() bounds and merge logic.
     *
     * @return array[]
     */
    public function sanitize_settings_provider() {
        $defaults        = $this->settings()->get_default_settings();
        $all_post_types  = get_post_types( [], 'names' );
        $default_tracked = array_values( array_intersect( (array) $defaults['tracked_post_types'], $all_post_types ) );

        $default_share_channels_by_key = [];

        if ( isset( $defaults['share_channels'] ) && is_array( $defaults['share_channels'] ) ) {
            foreach ( $defaults['share_channels'] as $channel ) {
                if ( ! is_array( $channel ) || empty( $channel['key'] ) ) {
                    continue;
                }

                $default_share_channels_by_key[ $channel['key'] ] = $channel;
            }
        }

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
                    'start_on_clicked_image' => $defaults['start_on_clicked_image'],
                    'debug_mode'     => true,
                    'show_zoom'      => true,
                    'show_download'  => true,
                    'show_share'     => true,
                    'show_fullscreen'=> true,
                    'show_thumbs_mobile' => true,
                    'share_copy'     => $defaults['share_copy'],
                    'share_download' => $defaults['share_download'],
                ],
            ],
            'bg_opacity_lower_bound' => [
                [
                    'bg_opacity' => -2,
                ],
                [],
                [
                    'bg_opacity' => Settings::MIN_OVERLAY_OPACITY,
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
            'trigger_scenario_validation' => [
                [
                    'trigger_scenario' => 'self-linked-media',
                ],
                [],
                [
                    'trigger_scenario' => 'self-linked-media',
                ],
            ],
            'trigger_scenario_invalid_fallback' => [
                [
                    'trigger_scenario' => 'attachment-only',
                ],
                [],
                [
                    'trigger_scenario' => $defaults['trigger_scenario'],
                ],
            ],
            'toolbar_toggles_casting_and_defaults' => [
                [
                    'show_zoom'       => '0',
                    'show_download'   => 0,
                    'show_share'      => '1',
                    'share_copy'      => '0',
                    'share_download'  => '',
                    'thumbs_layout'   => 'left',
                ],
                [],
                [
                    'show_zoom'       => false,
                    'show_download'   => false,
                    'show_share'      => true,
                    'show_fullscreen' => $defaults['show_fullscreen'],
                    'show_thumbs_mobile' => $defaults['show_thumbs_mobile'],
                    'start_on_clicked_image' => $defaults['start_on_clicked_image'],
                    'share_copy'      => false,
                    'share_download'  => false,
                    'thumbs_layout'   => 'left',
                ],
            ],
            'include_svg_checkbox_cast' => [
                [
                    'include_svg' => 'off',
                ],
                [],
                [
                    'include_svg' => false,
                ],
            ],
            'thumbs_layout_existing_value_is_preserved' => [
                [],
                [
                    'thumbs_layout' => 'hidden',
                ],
                [
                    'thumbs_layout' => 'hidden',
                ],
            ],
            'thumbs_layout_invalid_values_fall_back_to_default' => [
                [
                    'thumbs_layout' => 'diagonal',
                ],
                [
                    'thumbs_layout' => 'left',
                ],
                [
                    'thumbs_layout' => $defaults['thumbs_layout'],
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
            'share_channel_customization' => [
                [
                    'share_channels' => [
                        'facebook' => [
                            'enabled'  => '0',
                            'template' => ' https://example.com/?u=%url% ',
                        ],
                        'twitter' => [
                            'enabled'  => 'yes',
                        ],
                        'reseau_perso' => [
                            'label'    => 'Réseau Perso',
                            'enabled'  => 'on',
                            'template' => ' https://reseau.example/share?u=%url% ',
                            'icon'     => 'Link ',
                        ],
                    ],
                ],
                [
                    'share_channels' => [
                        'facebook' => [
                            'enabled'  => true,
                            'template' => 'https://persisted.test/?u=%url%',
                        ],
                        'linkedin' => [
                            'enabled'  => false,
                            'template' => 'https://linked.in/share?u=%url%',
                        ],
                        'reseau_perso' => [
                            'enabled'  => true,
                            'template' => 'https://existing.example/share?u=%url%',
                            'label'    => 'Réseau existant',
                            'icon'     => 'custom',
                        ],
                    ],
                ],
                [
                    'share_channels' => [
                        'facebook'  => [
                            'enabled'  => false,
                            'template' => 'https://example.com/?u=%url%',
                        ],
                        'twitter'   => [
                            'enabled'  => true,
                            'template' => $default_share_channels_by_key['twitter']['template'],
                        ],
                        'linkedin'  => [
                            'enabled'  => false,
                            'template' => 'https://linked.in/share?u=%url%',
                        ],
                        'pinterest' => [
                            'enabled'  => $default_share_channels_by_key['pinterest']['enabled'],
                            'template' => $default_share_channels_by_key['pinterest']['template'],
                        ],
                    ],
                ],
            ],
            'share_channel_template_rejects_javascript_scheme' => [
                [
                    'share_channels' => [
                        'facebook' => [
                            'template' => 'javascript:alert(1)',
                        ],
                    ],
                ],
                [],
                [
                    'share_channels' => [
                        'facebook' => [
                            'template' => $default_share_channels_by_key['facebook']['template'],
                        ],
                    ],
                ],
            ],
            'share_channel_enabled_without_template_is_disabled' => [
                [
                    'share_channels' => [
                        [
                            'key'      => 'custom-network',
                            'label'    => 'Custom Network',
                            'enabled'  => true,
                            'template' => '   ',
                        ],
                    ],
                ],
                [],
                [
                    'share_channels' => [
                        'custom-network' => [
                            'enabled'  => false,
                            'template' => '',
                        ],
                    ],
                ],
            ],
            'partial_updates_preserve_existing_values' => [
                [
                    'thumb_size_mobile' => 60,
                ],
                [
                    'speed'             => 750,
                    'delay'             => 8,
                    'thumb_size'        => 120,
                    'thumb_size_mobile' => 55,
                    'accent_color'      => '#123456',
                    'bg_opacity'        => 0.65,
                    'z_index'           => 50,
                    'background_style'  => 'blur',
                ],
                [
                    'delay'            => 8,
                    'speed'            => 750,
                    'thumb_size'       => 120,
                    'thumb_size_mobile'=> 60,
                    'accent_color'     => '#123456',
                    'bg_opacity'       => 0.65,
                    'z_index'          => 50,
                    'background_style' => 'blur',
                ],
            ],
            'style_preset_known_value' => [
                [
                    'style_preset' => 'headless-ui',
                ],
                [],
                [
                    'style_preset' => 'headless-ui',
                ],
            ],
            'style_preset_unknown_value_resets_to_custom' => [
                [
                    'style_preset' => 'does-not-exist',
                ],
                [
                    'style_preset' => 'radix-ui',
                ],
                [
                    'style_preset' => '',
                ],
            ],
            'contextual_presets_sanitization' => [
                [
                    'contextual_presets' => [
                        [
                            'key'         => 'custom-case',
                            'label'       => '<strong>Custom</strong> ',
                            'description' => "Line one\n\nLine two",
                            'enabled'     => '1',
                            'priority'    => '2',
                            'contexts'    => [
                                'post_types'   => [ 'post', 'page', 'unknown' ],
                                'is_front_page' => '0',
                                'is_archive'    => '1',
                                'is_singular'   => 'inherit',
                            ],
                            'settings'    => [
                                'delay'          => '12',
                                'speed'          => '4000',
                                'thumb_size'     => '140',
                                'thumb_size_mobile' => '90',
                                'bg_opacity'     => '0.7',
                                'accent_color'   => '#ff00ff',
                                'autoplay_start' => 'enable',
                                'show_share'     => 'disable',
                                'show_download'  => 'inherit',
                                'thumbs_layout'  => 'LEFT',
                                'effect'         => 'FADE',
                                'easing'         => 'EASE',
                                'background_style' => 'BLUR',
                                'style_preset'   => 'radix-ui',
                            ],
                        ],
                        [
                            'label'    => 'Needs key',
                            'enabled'  => '',
                            'settings' => [
                                'autoplay_start' => 'inherit',
                                'show_share'     => '',
                                'thumbs_layout'  => 'diagonal',
                            ],
                        ],
                    ],
                ],
                [],
                [
                    'contextual_presets' => [
                        [
                            'key'         => 'custom-case',
                            'label'       => 'Custom',
                            'description' => "Line one\nLine two",
                            'enabled'     => true,
                            'priority'    => 2,
                            'contexts'    => [
                                'post_types'   => [ 'post', 'page' ],
                                'is_front_page' => false,
                                'is_archive'    => true,
                            ],
                            'settings'    => [
                                'delay'              => 12,
                                'speed'              => 4000,
                                'thumb_size'         => 140,
                                'thumb_size_mobile'  => 90,
                                'bg_opacity'         => 0.7,
                                'accent_color'       => '#ff00ff',
                                'autoplay_start'     => true,
                                'show_share'         => false,
                                'thumbs_layout'      => 'left',
                                'effect'             => 'fade',
                                'easing'             => 'ease',
                                'background_style'   => 'blur',
                                'style_preset'       => 'radix-ui',
                            ],
                        ],
                        [
                            'key'         => 'needs-key',
                            'label'       => 'Needs key',
                            'description' => '',
                            'enabled'     => false,
                            'priority'    => 10,
                            'contexts'    => [],
                            'settings'    => [],
                        ],
                    ],
                ],
            ],
        ];
    }

    public function test_sanitize_settings_rejects_low_contrast_accent_colour(): void {
        $result = $this->settings()->sanitize_settings(
            [
                'accent_color' => '#111111',
            ],
            []
        );

        $this->assertSame(
            '#ffffff',
            $result['accent_color'],
            'Low-contrast accent colours should fall back to the default value.'
        );

        $errors = get_settings_errors( 'mga_settings' );

        $this->assertNotEmpty(
            array_filter(
                $errors,
                static function ( $error ) {
                    return isset( $error['code'] ) && 'mga_settings_accent_color_contrast' === $error['code'];
                }
            ),
            'A settings error should be registered when the accent colour fails the contrast requirements.'
        );
    }

    public function test_sanitize_settings_enforces_minimum_background_opacity(): void {
        $result = $this->settings()->sanitize_settings(
            [
                'bg_opacity' => '0.2',
            ],
            []
        );

        $this->assertSame(
            Settings::MIN_OVERLAY_OPACITY,
            $result['bg_opacity'],
            'Background opacity should clamp to the minimum accessible threshold.'
        );

        $errors = get_settings_errors( 'mga_settings' );

        $this->assertNotEmpty(
            array_filter(
                $errors,
                static function ( $error ) {
                    return isset( $error['code'] ) && 'mga_settings_bg_opacity_min' === $error['code'];
                }
            ),
            'A settings error should be registered when the background opacity falls below the minimum threshold.'
        );
    }

    private function map_share_channels_by_key( array $channels ): array {
        $mapped = [];

        foreach ( $channels as $index => $channel ) {
            if ( ! is_array( $channel ) ) {
                continue;
            }

            $channel_key = '';

            if ( ! empty( $channel['key'] ) && is_scalar( $channel['key'] ) ) {
                $channel_key = (string) $channel['key'];
            } elseif ( is_string( $index ) && '' !== $index ) {
                $channel_key = $index;
            }

            if ( '' === $channel_key ) {
                continue;
            }

            $mapped[ $channel_key ] = $channel;
        }

        return $mapped;
    }

    private function settings(): \MaGalerieAutomatique\Admin\Settings {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->settings();
    }
}

