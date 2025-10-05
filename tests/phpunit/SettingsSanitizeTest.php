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

        $default_share_channels = [];

        if ( isset( $defaults['share_channels'] ) && is_array( $defaults['share_channels'] ) ) {
            foreach ( $defaults['share_channels'] as $channel ) {
                if ( is_array( $channel ) && isset( $channel['key'] ) ) {
                    $default_share_channels[ $channel['key'] ] = $channel;
                }
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
                            'template' => $default_share_channels['twitter']['template'],
                        ],
                        'linkedin'  => [
                            'enabled'  => false,
                            'template' => 'https://linked.in/share?u=%url%',
                        ],
                        'pinterest' => [
                            'enabled'  => $default_share_channels['pinterest']['enabled'],
                            'template' => $default_share_channels['pinterest']['template'],
                        ],
                        'reseau_perso' => [
                            'enabled'  => true,
                            'template' => 'https://reseau.example/share?u=%url%',
                            'label'    => 'Réseau Perso',
                            'icon'     => 'link',
                        ],
                    ],
                    '__expected_doing_it_wrong' => 0,
                ],
            ],
            'share_channel_rejects_javascript_template' => [
                [
                    'share_channels' => [
                        'facebook' => [
                            'enabled'  => '1',
                            'template' => 'javascript:alert(1)',
                        ],
                    ],
                ],
                [],
                [
                    'share_channels' => [
                        'facebook' => [
                            'enabled'  => $default_share_channels['facebook']['enabled'],
                            'template' => $default_share_channels['facebook']['template'],
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
        ];
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

