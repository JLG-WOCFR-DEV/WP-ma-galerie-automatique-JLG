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
            if ( 'share_channels' === $key ) {
                $actual_channels = $this->map_share_channels_by_key( $result[ $key ] );

                foreach ( $expected_value as $channel_key => $channel_expectations ) {
                    $this->assertArrayHasKey(
                        $channel_key,
                        $actual_channels,
                        sprintf( 'The %s share channel should be present after sanitization.', $channel_key )
                    );

                    foreach ( $channel_expectations as $field_key => $field_value ) {
                        $this->assertArrayHasKey(
                            $field_key,
                            $actual_channels[ $channel_key ],
                            sprintf( 'The %s field should exist for the %s share channel.', $field_key, $channel_key )
                        );
                        $this->assertSame(
                            $field_value,
                            $actual_channels[ $channel_key ][ $field_key ],
                            sprintf(
                                'The %s field for the %s share channel did not match the expected value.',
                                $field_key,
                                $channel_key
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

