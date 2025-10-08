<?php

namespace MaGalerieAutomatique\Admin;

use MaGalerieAutomatique\Plugin;

class Settings {
    private Plugin $plugin;

    private array $sanitized_settings_cache = [];

    public function __construct( Plugin $plugin ) {
        $this->plugin = $plugin;

        if ( function_exists( 'add_action' ) ) {
            add_action( 'switch_blog', [ $this, 'handle_switch_blog' ], 10, 2 );
        }
    }

    private function normalize_checkbox_value( $value, $default = false ): bool {
        if ( null === $value ) {
            return (bool) $default;
        }

        if ( is_bool( $value ) ) {
            return $value;
        }

        if ( is_string( $value ) ) {
            $normalized = strtolower( trim( $value ) );

            if ( '' === $normalized ) {
                return false;
            }

            if ( in_array( $normalized, [ '1', 'true', 'yes', 'on' ], true ) ) {
                return true;
            }

            if ( in_array( $normalized, [ '0', 'false', 'no', 'off' ], true ) ) {
                return false;
            }
        }

        if ( is_numeric( $value ) ) {
            return (int) $value !== 0;
        }

        return (bool) $value;
    }

    private function get_builtin_share_channel_catalog(): array {
        return [
            [
                'key'      => 'facebook',
                'label'    => __( 'Facebook', 'lightbox-jlg' ),
                'template' => 'https://www.facebook.com/sharer/sharer.php?u=%url%',
                'icon'     => 'facebook',
                'enabled'  => true,
            ],
            [
                'key'      => 'twitter',
                'label'    => __( 'Twitter', 'lightbox-jlg' ),
                'template' => 'https://twitter.com/intent/tweet?url=%url%&text=%text%',
                'icon'     => 'twitter',
                'enabled'  => true,
            ],
            [
                'key'      => 'linkedin',
                'label'    => __( 'LinkedIn', 'lightbox-jlg' ),
                'template' => 'https://www.linkedin.com/sharing/share-offsite/?url=%url%',
                'icon'     => 'linkedin',
                'enabled'  => false,
            ],
            [
                'key'      => 'pinterest',
                'label'    => __( 'Pinterest', 'lightbox-jlg' ),
                'template' => 'https://pinterest.com/pin/create/button/?url=%url%&description=%text%',
                'icon'     => 'pinterest',
                'enabled'  => false,
            ],
            [
                'key'      => 'whatsapp',
                'label'    => __( 'WhatsApp', 'lightbox-jlg' ),
                'template' => 'https://api.whatsapp.com/send?text=%text%20%url%',
                'icon'     => 'whatsapp',
                'enabled'  => false,
            ],
            [
                'key'      => 'telegram',
                'label'    => __( 'Telegram', 'lightbox-jlg' ),
                'template' => 'https://t.me/share/url?url=%url%&text=%text%',
                'icon'     => 'telegram',
                'enabled'  => false,
            ],
            [
                'key'      => 'email',
                'label'    => __( 'E-mail', 'lightbox-jlg' ),
                'template' => 'mailto:?subject=%title%&body=%text%20%url%',
                'icon'     => 'email',
                'enabled'  => false,
            ],
        ];
    }

    public function get_share_channel_catalog(): array {
        $default_catalog = $this->get_builtin_share_channel_catalog();
        $catalog         = \apply_filters( 'mga_share_channel_catalog', $default_catalog );

        if ( ! is_array( $catalog ) ) {
            $catalog = $default_catalog;
        }

        return $this->sanitize_share_channels_array(
            $catalog,
            [],
            $default_catalog,
            true
        );
    }

    public function get_share_icon_choices(): array {
        $base_choices = [
            'facebook'  => __( 'Facebook', 'lightbox-jlg' ),
            'twitter'   => __( 'Twitter', 'lightbox-jlg' ),
            'linkedin'  => __( 'LinkedIn', 'lightbox-jlg' ),
            'pinterest' => __( 'Pinterest', 'lightbox-jlg' ),
            'whatsapp'  => __( 'WhatsApp', 'lightbox-jlg' ),
            'telegram'  => __( 'Telegram', 'lightbox-jlg' ),
            'email'     => __( 'E-mail', 'lightbox-jlg' ),
            'link'      => __( 'Lien', 'lightbox-jlg' ),
            'generic'   => __( 'Icône générique', 'lightbox-jlg' ),
        ];

        foreach ( $this->get_share_channel_catalog() as $channel ) {
            if ( ! is_array( $channel ) ) {
                continue;
            }

            if ( empty( $channel['icon'] ) || isset( $base_choices[ $channel['icon'] ] ) ) {
                continue;
            }

            $base_choices[ $channel['icon'] ] = isset( $channel['label'] ) && '' !== trim( (string) $channel['label'] )
                ? sanitize_text_field( (string) $channel['label'] )
                : ucwords( str_replace( [ '-', '_' ], ' ', sanitize_key( (string) $channel['icon'] ) ) );
        }

        $choices = \apply_filters( 'mga_share_icon_choices', $base_choices );

        if ( ! is_array( $choices ) ) {
            $choices = $base_choices;
        }

        return $choices;
    }

    public function get_style_presets(): array {
        $defaults = $this->get_default_settings();

        return [
            'headless-ui' => [
                'label'       => __( 'Headless UI — minimalisme fonctionnel', 'lightbox-jlg' ),
                'description' => __( 'Transitions en fondu, interface épurée et accent discret pour mettre la photo au premier plan.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => 5,
                    'speed'              => 500,
                    'effect'             => 'fade',
                    'easing'             => 'ease-in-out',
                    'thumbs_layout'      => 'hidden',
                    'thumb_size'         => 90,
                    'thumb_size_mobile'  => 70,
                    'show_thumbs_mobile' => false,
                    'accent_color'       => '#111827',
                    'bg_opacity'         => 0.92,
                    'background_style'   => 'echo',
                ],
            ],
            'shadcn-ui'   => [
                'label'       => __( 'Shadcn UI — sobriété typographique', 'lightbox-jlg' ),
                'description' => __( 'Mise en page éditoriale avec miniatures latérales et contraste soutenu.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => $defaults['delay'],
                    'speed'              => 550,
                    'effect'             => 'slide',
                    'easing'             => 'ease-out',
                    'thumbs_layout'      => 'left',
                    'thumb_size'         => 88,
                    'thumb_size_mobile'  => 64,
                    'show_thumbs_mobile' => true,
                    'accent_color'       => '#0f172a',
                    'bg_opacity'         => 0.85,
                    'background_style'   => 'echo',
                ],
            ],
            'radix-ui'    => [
                'label'       => __( 'Radix UI — accessibilité stricte', 'lightbox-jlg' ),
                'description' => __( 'Animations prévisibles, contraste fort et navigation renforcée.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => 5,
                    'speed'              => 450,
                    'effect'             => 'slide',
                    'easing'             => 'linear',
                    'thumbs_layout'      => 'bottom',
                    'thumb_size'         => 96,
                    'thumb_size_mobile'  => 72,
                    'show_thumbs_mobile' => true,
                    'accent_color'       => '#2563eb',
                    'bg_opacity'         => 0.9,
                    'background_style'   => 'echo',
                ],
            ],
            'bootstrap'   => [
                'label'       => __( 'Bootstrap — esthétique corporate', 'lightbox-jlg' ),
                'description' => __( 'Rythme nerveux, CTA visible et couleur de marque inspirée de Bootstrap 5.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => $defaults['delay'],
                    'speed'              => 350,
                    'effect'             => 'slide',
                    'easing'             => 'ease',
                    'thumbs_layout'      => 'bottom',
                    'thumb_size'         => 90,
                    'thumb_size_mobile'  => 70,
                    'show_thumbs_mobile' => true,
                    'accent_color'       => '#0d6efd',
                    'bg_opacity'         => 0.9,
                    'background_style'   => 'texture',
                ],
            ],
            'semantic-ui' => [
                'label'       => __( 'Semantic UI — équilibre éditorial', 'lightbox-jlg' ),
                'description' => __( 'Perspective coverflow, palette violette et transitions plus espacées.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => 5,
                    'speed'              => 650,
                    'effect'             => 'coverflow',
                    'easing'             => 'ease-in-out',
                    'thumbs_layout'      => 'bottom',
                    'thumb_size'         => 80,
                    'thumb_size_mobile'  => 60,
                    'show_thumbs_mobile' => true,
                    'accent_color'       => '#6435c9',
                    'bg_opacity'         => 0.9,
                    'background_style'   => 'blur',
                ],
            ],
            'anime-js'    => [
                'label'       => __( 'Anime.js — motion design expressif', 'lightbox-jlg' ),
                'description' => __( 'Transitions cinétiques flip, autoplay activé et ambiance néon.', 'lightbox-jlg' ),
                'settings'    => [
                    'delay'              => $defaults['delay'],
                    'speed'              => 520,
                    'effect'             => 'flip',
                    'easing'             => 'ease-in-out',
                    'thumbs_layout'      => 'hidden',
                    'thumb_size'         => 90,
                    'thumb_size_mobile'  => 70,
                    'show_thumbs_mobile' => true,
                    'accent_color'       => '#f97316',
                    'bg_opacity'         => 0.75,
                    'background_style'   => 'texture',
                    'autoplay_start'     => true,
                ],
            ],
        ];
    }

    private function normalize_style_preset_settings_for_js( array $settings ): array {
        $map = [
            'delay'              => 'int',
            'speed'              => 'int',
            'thumb_size'         => 'int',
            'thumb_size_mobile'  => 'int',
            'bg_opacity'         => 'float',
            'accent_color'       => 'color',
            'thumbs_layout'      => [ 'bottom', 'left', 'hidden' ],
            'background_style'   => [ 'echo', 'texture', 'blur' ],
            'effect'             => [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ],
            'easing'             => [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ],
            'show_thumbs_mobile' => 'bool',
            'autoplay_start'     => 'bool',
            'loop'               => 'bool',
            'show_zoom'          => 'bool',
            'show_download'      => 'bool',
            'show_share'         => 'bool',
            'show_cta'           => 'bool',
            'show_fullscreen'    => 'bool',
        ];

        $normalized = [];

        foreach ( $map as $key => $type ) {
            if ( ! array_key_exists( $key, $settings ) ) {
                continue;
            }

            $value = $settings[ $key ];

            switch ( $type ) {
                case 'int':
                    $normalized[ $key ] = (int) $value;
                    break;
                case 'float':
                    $normalized[ $key ] = round( (float) $value, 2 );
                    break;
                case 'bool':
                    $normalized[ $key ] = (bool) $value;
                    break;
                case 'color':
                    $color = sanitize_hex_color( (string) $value );

                    if ( $color ) {
                        $normalized[ $key ] = $color;
                    }
                    break;
                default:
                    if ( is_array( $type ) ) {
                        $candidate = is_string( $value ) ? strtolower( $value ) : '';

                        if ( in_array( $candidate, $type, true ) ) {
                            $normalized[ $key ] = $candidate;
                        }
                    }
                    break;
            }
        }

        return $normalized;
    }

    private function get_default_share_channels(): array {
        $catalog = $this->get_share_channel_catalog();

        $normalized = array_map(
            static function ( $channel ) {
                if ( ! is_array( $channel ) ) {
                    return [];
                }

                $channel['enabled'] = isset( $channel['enabled'] )
                    ? (bool) $channel['enabled']
                    : false;

                return $channel;
            },
            $catalog
        );

        return array_values(
            array_filter(
                $normalized,
                static function ( $channel ) {
                    return is_array( $channel ) && isset( $channel['key'] ) && '' !== $channel['key'];
                }
            )
        );
    }

    public function add_admin_menu(): void {
        add_menu_page(
            __( 'Lightbox - JLG', 'lightbox-jlg' ),
            __( 'Lightbox - JLG', 'lightbox-jlg' ),
            'manage_options',
            'ma-galerie-automatique',
            [ $this, 'render_options_page' ],
            'dashicons-format-gallery',
            26
        );
    }

    public function register_settings(): void {
        register_setting(
            'mga_settings_group',
            'mga_settings',
            [
                'sanitize_callback' => [ $this, 'sanitize_settings' ],
                'default'           => $this->get_default_settings(),
                'show_in_rest'      => [
                    'schema' => [
                        'type'                 => 'object',
                        'additionalProperties' => true,
                    ],
                ],
            ]
        );
    }

    public function enqueue_assets( string $hook ): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        if ( 'toplevel_page_ma-galerie-automatique' !== $hook ) {
            return;
        }

        wp_enqueue_style( 'wp-color-picker' );

        wp_enqueue_style(
            'mga-admin-style',
            $this->plugin->get_plugin_dir_url() . 'assets/css/admin-style.css',
            [],
            MGA_VERSION
        );

        wp_enqueue_script( 'wp-color-picker' );

        wp_register_script(
            'mga-focus-utils',
            $this->plugin->get_plugin_dir_url() . 'assets/js/utils/focus-utils.js',
            [],
            MGA_VERSION,
            true
        );

        wp_register_script(
            'mga-admin-script',
            $this->plugin->get_plugin_dir_url() . 'assets/js/admin-script.js',
            [ 'wp-i18n', 'mga-focus-utils', 'wp-color-picker' ],
            MGA_VERSION,
            true
        );

        wp_enqueue_script( 'mga-focus-utils' );
        wp_enqueue_script( 'mga-admin-script' );

        $style_presets_for_js = [];

        foreach ( $this->get_style_presets() as $preset_key => $preset_definition ) {
            $sanitized_key = sanitize_key( (string) $preset_key );

            if ( '' === $sanitized_key ) {
                continue;
            }

            $style_presets_for_js[ $sanitized_key ] = [
                'label'       => isset( $preset_definition['label'] )
                    ? (string) $preset_definition['label']
                    : ucwords( str_replace( '-', ' ', $sanitized_key ) ),
                'description' => isset( $preset_definition['description'] )
                    ? (string) $preset_definition['description']
                    : '',
                'settings'    => $this->normalize_style_preset_settings_for_js(
                    isset( $preset_definition['settings'] ) && is_array( $preset_definition['settings'] )
                        ? $preset_definition['settings']
                        : []
                ),
            ];
        }

        wp_localize_script(
            'mga-admin-script',
            'mgaStylePresets',
            [
                'presets'           => $style_presets_for_js,
                'customDescription' => __( 'Réglages personnalisés actifs.', 'lightbox-jlg' ),
                'defaults'          => $this->normalize_style_preset_settings_for_js( $this->get_default_settings() ),
            ]
        );

        if ( $this->plugin->languages_directory_exists() ) {
            wp_set_script_translations( 'mga-admin-script', 'lightbox-jlg', $this->plugin->get_languages_path() );
        }
    }

    public function render_options_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $settings = get_option( 'mga_settings', $this->get_default_settings() );

        if ( defined( 'MGA_ADMIN_TEMPLATE_PATH' ) && is_readable( MGA_ADMIN_TEMPLATE_PATH ) ) {
            include MGA_ADMIN_TEMPLATE_PATH;
        }
    }

    public function get_default_settings(): array {
        return [
            'delay'              => 4,
            'speed'              => 600,
            'effect'             => 'slide',
            'easing'             => 'ease-out',
            'thumb_size'         => 90,
            'thumb_size_mobile'  => 70,
            'thumbs_layout'      => 'bottom',
            'accent_color'       => '#ffffff',
            'bg_opacity'         => 0.95,
            'loop'               => true,
            'autoplay_start'     => false,
            'start_on_clicked_image' => false,
            'background_style'   => 'echo',
            'z_index'            => 99999,
            'debug_mode'         => false,
            'show_zoom'          => true,
            'show_download'      => true,
            'show_share'         => true,
            'show_cta'           => true,
            'show_fullscreen'    => true,
            'close_on_backdrop'  => true,
            'show_thumbs_mobile' => true,
            'share_channels'     => $this->get_default_share_channels(),
            'share_copy'         => true,
            'share_download'     => true,
            'style_preset'       => '',
            'groupAttribute'     => 'data-mga-gallery',
            'contentSelectors'   => [],
            'allowBodyFallback'  => false,
            'load_on_archives'   => false,
            'tracked_post_types' => [ 'post', 'page' ],
        ];
    }

    /**
     * @param array|null $existing_settings
     */
    public function sanitize_settings( $input, $existing_settings = null ): array {
        if ( ! is_array( $input ) ) {
            $input = [];
        }

        $defaults = $this->get_default_settings();
        $output   = [];

        /*
         * Partial updates (e.g. when a settings form only submits a subset of fields)
         * must respect the previously saved values instead of reverting to defaults
         * for every missing key. We therefore keep a sanitized version of the
         * existing settings as a fallback before we reach for the defaults and
         * let the resolver closures reuse these stored values whenever the
         * incoming payload omits a field.
         */

        if ( null === $existing_settings ) {
            $existing_settings = get_option( 'mga_settings', [] );
        }

        if ( ! is_array( $existing_settings ) ) {
            $existing_settings = [];
        }

        $resolve_bounded_int = function ( string $key, int $min, int $max ) use ( $input, $existing_settings, $defaults ): int {
            $candidate = $defaults[ $key ] ?? $min;

            if ( isset( $input[ $key ] ) ) {
                $candidate = $input[ $key ];
            } elseif ( isset( $existing_settings[ $key ] ) ) {
                $candidate = $existing_settings[ $key ];
            }

            $candidate = (int) $candidate;

            return max( $min, min( $max, $candidate ) );
        };

        $resolve_min_int = function ( string $key, int $min ) use ( $input, $existing_settings, $defaults ): int {
            $candidate = $defaults[ $key ] ?? $min;

            if ( isset( $input[ $key ] ) ) {
                $candidate = $input[ $key ];
            } elseif ( isset( $existing_settings[ $key ] ) ) {
                $candidate = $existing_settings[ $key ];
            }

            return max( $min, (int) $candidate );
        };

        $resolve_bounded_float = function ( string $key, float $min, float $max ) use ( $input, $existing_settings, $defaults ): float {
            $candidate = $defaults[ $key ] ?? $min;

            if ( isset( $input[ $key ] ) ) {
                $candidate = $input[ $key ];
            } elseif ( isset( $existing_settings[ $key ] ) ) {
                $candidate = $existing_settings[ $key ];
            }

            $candidate = (float) $candidate;

            if ( $candidate < $min ) {
                return $min;
            }

            if ( $candidate > $max ) {
                return $max;
            }

            return $candidate;
        };

        $resolve_hex_color = function ( string $key ) use ( $input, $existing_settings, $defaults ): string {
            $candidate = null;

            if ( array_key_exists( $key, $input ) ) {
                $candidate = sanitize_hex_color( $input[ $key ] );
            } elseif ( isset( $existing_settings[ $key ] ) ) {
                $candidate = sanitize_hex_color( $existing_settings[ $key ] );
            }

            if ( $candidate ) {
                return $candidate;
            }

            $default_color = $defaults[ $key ] ?? '';
            $sanitized_default = $default_color ? sanitize_hex_color( $default_color ) : null;

            return $sanitized_default ? $sanitized_default : '#ffffff';
        };

        $output['delay']             = $resolve_bounded_int( 'delay', 1, 30 );
        $output['speed']             = $resolve_bounded_int( 'speed', 100, 5000 );
        $output['thumb_size']        = $resolve_bounded_int( 'thumb_size', 50, 150 );
        $output['thumb_size_mobile'] = $resolve_bounded_int( 'thumb_size_mobile', 40, 100 );
        $output['accent_color']      = $resolve_hex_color( 'accent_color' );
        $output['bg_opacity']        = $resolve_bounded_float( 'bg_opacity', 0, 1 );

        $resolve_checkbox_value = function ( string $key ) use ( $input, $existing_settings, $defaults ) {
            if ( is_array( $input ) && array_key_exists( $key, $input ) ) {
                return $this->normalize_checkbox_value( $input[ $key ], $defaults[ $key ] ?? false );
            }

            if ( is_array( $existing_settings ) && array_key_exists( $key, $existing_settings ) ) {
                return $this->normalize_checkbox_value( $existing_settings[ $key ], $defaults[ $key ] ?? false );
            }

            return array_key_exists( $key, $defaults )
                ? $this->normalize_checkbox_value( $defaults[ $key ], $defaults[ $key ] )
                : false;
        };

        $general_toggle_keys = [
            'loop',
            'autoplay_start',
            'start_on_clicked_image',
            'debug_mode',
            'allowBodyFallback',
            'load_on_archives',
            'close_on_backdrop',
            'show_cta',
        ];

        foreach ( $general_toggle_keys as $checkbox_key ) {
            $output[ $checkbox_key ] = $resolve_checkbox_value( $checkbox_key );
        }

        $sanitize_group_attribute = static function ( $value ) use ( $defaults ) {
            if ( ! is_string( $value ) ) {
                return $defaults['groupAttribute'];
            }

            $trimmed = trim( $value );

            if ( '' === $trimmed ) {
                return '';
            }

            $sanitized = strtolower( preg_replace( '/[^a-z0-9_:\\-]/i', '', $trimmed ) );

            return '' === $sanitized ? $defaults['groupAttribute'] : $sanitized;
        };

        if ( array_key_exists( 'groupAttribute', $input ) ) {
            $output['groupAttribute'] = $sanitize_group_attribute( $input['groupAttribute'] );
        } elseif ( isset( $existing_settings['groupAttribute'] ) ) {
            $output['groupAttribute'] = $sanitize_group_attribute( $existing_settings['groupAttribute'] );
        } else {
            $output['groupAttribute'] = $defaults['groupAttribute'];
        }

        $allowed_bg_styles          = [ 'echo', 'blur', 'texture' ];

        if ( isset( $input['background_style'] ) && in_array( $input['background_style'], $allowed_bg_styles, true ) ) {
            $output['background_style'] = $input['background_style'];
        } elseif ( isset( $existing_settings['background_style'] ) && in_array( $existing_settings['background_style'], $allowed_bg_styles, true ) ) {
            $output['background_style'] = $existing_settings['background_style'];
        } else {
            $output['background_style'] = $defaults['background_style'];
        }

        $style_presets          = $this->get_style_presets();
        $allowed_preset_keys    = array_keys( $style_presets );
        $resolve_style_preset   = static function ( $value ) use ( $allowed_preset_keys ) {
            $candidate = sanitize_key( (string) $value );

            if ( '' === $candidate ) {
                return '';
            }

            return in_array( $candidate, $allowed_preset_keys, true ) ? $candidate : '';
        };

        if ( array_key_exists( 'style_preset', $input ) ) {
            $output['style_preset'] = $resolve_style_preset( $input['style_preset'] );
        } elseif ( isset( $existing_settings['style_preset'] ) ) {
            $output['style_preset'] = $resolve_style_preset( $existing_settings['style_preset'] );
        } else {
            $output['style_preset'] = $resolve_style_preset( $defaults['style_preset'] ?? '' );
        }

        $allowed_thumb_layouts = [ 'bottom', 'left', 'hidden' ];

        if ( isset( $input['thumbs_layout'] ) ) {
            $raw_layout         = is_string( $input['thumbs_layout'] ) ? strtolower( $input['thumbs_layout'] ) : '';
            $output['thumbs_layout'] = in_array( $raw_layout, $allowed_thumb_layouts, true )
                ? $raw_layout
                : $defaults['thumbs_layout'];
        } elseif ( isset( $existing_settings['thumbs_layout'] ) && in_array( $existing_settings['thumbs_layout'], $allowed_thumb_layouts, true ) ) {
            $output['thumbs_layout'] = $existing_settings['thumbs_layout'];
        } else {
            $output['thumbs_layout'] = $defaults['thumbs_layout'];
        }

        $allowed_effects = [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ];

        if ( isset( $input['effect'] ) ) {
            $effect           = is_string( $input['effect'] ) ? strtolower( $input['effect'] ) : '';
            $output['effect'] = in_array( $effect, $allowed_effects, true ) ? $effect : $defaults['effect'];
        } elseif ( isset( $existing_settings['effect'] ) && in_array( $existing_settings['effect'], $allowed_effects, true ) ) {
            $output['effect'] = $existing_settings['effect'];
        } else {
            $output['effect'] = $defaults['effect'];
        }

        $allowed_easings = [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ];

        if ( isset( $input['easing'] ) ) {
            $easing           = is_string( $input['easing'] ) ? strtolower( $input['easing'] ) : '';
            $output['easing'] = in_array( $easing, $allowed_easings, true ) ? $easing : $defaults['easing'];
        } elseif ( isset( $existing_settings['easing'] ) && in_array( $existing_settings['easing'], $allowed_easings, true ) ) {
            $output['easing'] = $existing_settings['easing'];
        } else {
            $output['easing'] = $defaults['easing'];
        }

        $output['z_index'] = $resolve_min_int( 'z_index', 0 );

        $sanitize_selectors = static function ( $selectors ) {
            $sanitized = [];

            foreach ( (array) $selectors as $selector ) {
                $clean_selector = (string) $selector;
                $clean_selector = wp_strip_all_tags( $clean_selector );
                $clean_selector = str_replace( "\xC2\xA0", ' ', $clean_selector );
                $clean_selector = preg_replace( '/[\x00-\x1F\x7F]+/u', '', $clean_selector );
                $clean_selector = preg_replace( '/\s+/u', ' ', $clean_selector );
                $clean_selector = trim( $clean_selector );

                if ( '' !== $clean_selector ) {
                    $sanitized[] = $clean_selector;
                }
            }

            return array_values( array_unique( $sanitized ) );
        };

        $existing_selectors = $sanitize_selectors( $defaults['contentSelectors'] );

        if ( isset( $existing_settings['contentSelectors'] ) && is_array( $existing_settings['contentSelectors'] ) ) {
            $existing_selectors = $sanitize_selectors( $existing_settings['contentSelectors'] );
        }

        if ( array_key_exists( 'contentSelectors', $input ) ) {
            $raw_selectors = $input['contentSelectors'];

            if ( is_string( $raw_selectors ) ) {
                $raw_selectors = preg_split( '/\r\n|\r|\n/', $raw_selectors, -1, PREG_SPLIT_NO_EMPTY );
            } elseif ( null === $raw_selectors ) {
                $raw_selectors = [];
            }

            if ( ! is_array( $raw_selectors ) ) {
                $raw_selectors = [];
            }

            $output['contentSelectors'] = $sanitize_selectors( $raw_selectors );
        } else {
            $output['contentSelectors'] = $existing_selectors;
        }

        foreach ( [ 'show_zoom', 'show_download', 'show_share', 'show_fullscreen', 'show_thumbs_mobile' ] as $toolbar_toggle ) {
            $output[ $toolbar_toggle ] = $resolve_checkbox_value( $toolbar_toggle );
        }

        foreach ( [ 'share_copy', 'share_download' ] as $share_toggle ) {
            $output[ $share_toggle ] = $resolve_checkbox_value( $share_toggle );
        }

        $default_share_channels = [];

        if ( isset( $defaults['share_channels'] ) && is_array( $defaults['share_channels'] ) ) {
            $default_share_channels = $defaults['share_channels'];
        }

        $existing_share_channels = [];

        if ( isset( $existing_settings['share_channels'] ) && is_array( $existing_settings['share_channels'] ) ) {
            $existing_share_channels = $existing_settings['share_channels'];
        }

        if ( array_key_exists( 'share_channels', $input ) ) {
            $output['share_channels'] = $this->sanitize_share_channels_array(
                $input['share_channels'] ?? [],
                $existing_share_channels,
                $default_share_channels,
                false
            );
        } elseif ( ! empty( $existing_share_channels ) ) {
            $output['share_channels'] = $this->sanitize_share_channels_array(
                $existing_share_channels,
                [],
                $default_share_channels,
                false
            );
        } else {
            $output['share_channels'] = $this->sanitize_share_channels_array(
                $default_share_channels,
                [],
                $default_share_channels,
                true
            );
        }

        $all_post_types               = get_post_types( [], 'names' );
        $default_tracked_post_types   = array_values( array_intersect( (array) $defaults['tracked_post_types'], $all_post_types ) );
        $existing_tracked_post_types  = $default_tracked_post_types;

        if ( isset( $existing_settings['tracked_post_types'] ) && is_array( $existing_settings['tracked_post_types'] ) ) {
            $existing_tracked_post_types = array_values(
                array_intersect(
                    array_map( 'sanitize_key', $existing_settings['tracked_post_types'] ),
                    $all_post_types
                )
            );
        }

        if ( array_key_exists( 'tracked_post_types', $input ) ) {
            $sanitized_tracked_post_types = [];

            foreach ( (array) $input['tracked_post_types'] as $post_type ) {
                $post_type = sanitize_key( $post_type );

                if ( in_array( $post_type, $all_post_types, true ) ) {
                    $sanitized_tracked_post_types[] = $post_type;
                }
            }

            $output['tracked_post_types'] = array_values( array_unique( $sanitized_tracked_post_types ) );

            if ( empty( $output['tracked_post_types'] ) ) {
                $output['tracked_post_types'] = $default_tracked_post_types;
            }
        } else {
            $output['tracked_post_types'] = $existing_tracked_post_types;
        }

        return $output;
    }

    public function get_sanitized_settings(): array {
        $cache_key = $this->get_settings_cache_key();

        if ( array_key_exists( $cache_key, $this->sanitized_settings_cache ) ) {
            return $this->sanitized_settings_cache[ $cache_key ];
        }

        $saved_settings = get_option( 'mga_settings', [] );
        $sanitized      = $this->sanitize_settings( $saved_settings, $saved_settings );

        $this->sanitized_settings_cache[ $cache_key ] = $sanitized;

        return $sanitized;
    }

    public function invalidate_settings_cache( ?int $blog_id = null ): void {
        if ( null === $blog_id ) {
            $this->sanitized_settings_cache = [];
            return;
        }

        unset( $this->sanitized_settings_cache[ $blog_id ] );
    }

    public function handle_switch_blog( $new_blog_id, $old_blog_id ): void {
        unset( $new_blog_id, $old_blog_id );

        $this->invalidate_settings_cache();
    }

    private function get_settings_cache_key(): int {
        if ( function_exists( 'get_current_blog_id' ) ) {
            $blog_id = get_current_blog_id();

            if ( is_numeric( $blog_id ) ) {
                return (int) $blog_id;
            }
        }

        return 0;
    }

    private function sanitize_share_channels_array( $raw_channels, array $existing_channels, array $default_channels, bool $use_defaults_as_fallback = true ): array {
        $channels_list = [];

        if ( is_array( $raw_channels ) ) {
            $channels_list = $this->is_list( $raw_channels )
                ? $raw_channels
                : $this->normalize_legacy_share_channels( $raw_channels );
        }

        if ( $use_defaults_as_fallback && empty( $channels_list ) && $this->is_list( $default_channels ) ) {
            $channels_list = $default_channels;
        }

        $defaults_by_key  = $this->index_share_channels_by_key( $default_channels );
        $existing_by_key  = $this->index_share_channels_by_key( $existing_channels );
        $sanitized        = [];
        $registered_keys  = [];

        foreach ( $channels_list as $channel_candidate ) {
            $sanitized_channel = $this->sanitize_single_share_channel(
                $channel_candidate,
                $defaults_by_key,
                $existing_by_key,
                $registered_keys
            );

            if ( null !== $sanitized_channel ) {
                $sanitized[] = $sanitized_channel;
            }
        }

        return array_values( $sanitized );
    }

    private function sanitize_single_share_channel( $channel_candidate, array $defaults_by_key, array $existing_by_key, array &$registered_keys ): ?array {
        if ( ! is_array( $channel_candidate ) ) {
            return null;
        }

        $sanitized_key = $this->resolve_share_channel_key( $channel_candidate );

        if ( '' === $sanitized_key || isset( $registered_keys[ $sanitized_key ] ) ) {
            return null;
        }

        $registered_keys[ $sanitized_key ] = true;

        $defaults_for_key = $defaults_by_key[ $sanitized_key ] ?? [];
        $existing_for_key = $existing_by_key[ $sanitized_key ] ?? [];

        return [
            'key'      => $sanitized_key,
            'label'    => $this->resolve_share_channel_label( $channel_candidate, $existing_for_key, $defaults_for_key, $sanitized_key ),
            'template' => $this->resolve_share_channel_template( $channel_candidate, $existing_for_key, $defaults_for_key ),
            'icon'     => $this->resolve_share_channel_icon( $channel_candidate, $existing_for_key, $defaults_for_key, $sanitized_key ),
            'enabled'  => $this->resolve_share_channel_enabled( $channel_candidate, $existing_for_key, $defaults_for_key ),
        ];
    }

    private function resolve_share_channel_key( array $channel_candidate ): string {
        $candidate_key = '';

        if ( isset( $channel_candidate['key'] ) ) {
            $candidate_key = (string) $channel_candidate['key'];
        } elseif ( isset( $channel_candidate['slug'] ) ) {
            $candidate_key = (string) $channel_candidate['slug'];
        }

        $sanitized_key = sanitize_key( $candidate_key );

        if ( '' !== $sanitized_key ) {
            return $sanitized_key;
        }

        if ( isset( $channel_candidate['label'] ) ) {
            $label_key    = sanitize_title( (string) $channel_candidate['label'] );
            $sanitized_key = sanitize_key( $label_key );

            if ( '' !== $sanitized_key ) {
                return $sanitized_key;
            }
        }

        if ( isset( $channel_candidate['template'] ) ) {
            $hash          = md5( (string) $channel_candidate['template'] );
            $sanitized_key = sanitize_key( substr( $hash, 0, 12 ) );

            if ( '' !== $sanitized_key ) {
                return $sanitized_key;
            }
        }

        return '';
    }

    private function resolve_share_channel_label( array $candidate, array $existing_for_key, array $defaults_for_key, string $sanitized_key ): string {
        $label_candidates = [
            $candidate['label'] ?? null,
            $existing_for_key['label'] ?? null,
            $defaults_for_key['label'] ?? null,
        ];

        foreach ( $label_candidates as $label_candidate ) {
            if ( ! is_string( $label_candidate ) ) {
                continue;
            }

            $label = sanitize_text_field( $label_candidate );

            if ( '' !== $label ) {
                return $label;
            }
        }

        return ucwords( str_replace( [ '-', '_' ], ' ', $sanitized_key ) );
    }

    private function resolve_share_channel_template( array $candidate, array $existing_for_key, array $defaults_for_key ): string {
        $template_candidates = [
            $candidate['template'] ?? null,
            $existing_for_key['template'] ?? null,
            $defaults_for_key['template'] ?? null,
        ];

        foreach ( $template_candidates as $template_candidate ) {
            if ( null === $template_candidate ) {
                continue;
            }

            $template = $this->sanitize_share_channel_template( (string) $template_candidate );

            if ( '' !== $template ) {
                return $template;
            }
        }

        return '';
    }

    private function resolve_share_channel_icon( array $candidate, array $existing_for_key, array $defaults_for_key, string $sanitized_key ): string {
        $icon_candidates = [
            $candidate['icon'] ?? null,
            $existing_for_key['icon'] ?? null,
            $defaults_for_key['icon'] ?? null,
        ];

        foreach ( $icon_candidates as $icon_candidate ) {
            if ( null === $icon_candidate ) {
                continue;
            }

            $icon = $this->sanitize_share_channel_icon( (string) $icon_candidate );

            if ( '' !== $icon ) {
                return $icon;
            }
        }

        return $this->sanitize_share_channel_icon( $sanitized_key, 'generic' );
    }

    private function resolve_share_channel_enabled( array $candidate, array $existing_for_key, array $defaults_for_key ): bool {
        $enabled_default = $defaults_for_key['enabled'] ?? false;

        if ( array_key_exists( 'enabled', $candidate ) ) {
            return $this->normalize_checkbox_value( $candidate['enabled'], $enabled_default );
        }

        if ( array_key_exists( 'enabled', $existing_for_key ) ) {
            return $this->normalize_checkbox_value( $existing_for_key['enabled'], $enabled_default );
        }

        return (bool) $enabled_default;
    }

    private function sanitize_share_channel_template( string $template ): string {
        $normalized_template = sanitize_text_field( $template );
        $normalized_template = trim( $normalized_template );

        if ( '' === $normalized_template ) {
            return '';
        }

        $placeholders_stripped = preg_replace( '/%[^%]+%/', '', $normalized_template );

        if ( null === $placeholders_stripped ) {
            $placeholders_stripped = $normalized_template;
        }

        $placeholders_stripped = trim( $placeholders_stripped );

        if ( '' === $placeholders_stripped ) {
            return '';
        }

        $allowed_protocols       = \wp_allowed_protocols();
        $additional_protocols    = [ 'sms', 'whatsapp', 'tg', 'fb-messenger', 'viber', 'line' ];
        $allowed_protocols       = array_unique( array_merge( $allowed_protocols, $additional_protocols ) );
        $allowed_protocols       = \apply_filters( 'mga_allowed_share_template_protocols', $allowed_protocols );
        $allowed_protocols       = \apply_filters( 'mga_share_channel_allowed_schemes', $allowed_protocols );
        $allowed_protocols       = array_filter(
            array_map(
                static function ( $protocol ) {
                    if ( is_string( $protocol ) && '' !== $protocol ) {
                        return strtolower( $protocol );
                    }

                    return null;
                },
                (array) $allowed_protocols
            )
        );

        $scheme = strtolower( (string) \wp_parse_url( $placeholders_stripped, PHP_URL_SCHEME ) );

        if ( '' === $scheme || ! in_array( $scheme, $allowed_protocols, true ) ) {
            return '';
        }

        return $normalized_template;
    }

    private function index_share_channels_by_key( array $channels ): array {
        $indexed = [];

        foreach ( $channels as $key => $channel ) {
            if ( ! is_array( $channel ) ) {
                continue;
            }

            $channel_key = '';

            if ( isset( $channel['key'] ) ) {
                $channel_key = sanitize_key( (string) $channel['key'] );
            } elseif ( is_string( $key ) ) {
                $channel_key = sanitize_key( $key );
            }

            if ( '' === $channel_key ) {
                continue;
            }

            if ( ! isset( $channel['key'] ) ) {
                $channel['key'] = $channel_key;
            }

            $indexed[ $channel_key ] = $channel;
        }

        return $indexed;
    }

    private function normalize_legacy_share_channels( array $channels ): array {
        $normalized = [];

        foreach ( $channels as $key => $channel ) {
            if ( ! is_array( $channel ) ) {
                $legacy_entry = [
                    'key' => is_string( $key ) ? $key : '',
                ];

                if ( is_string( $channel ) ) {
                    $legacy_entry['template'] = $channel;
                }

                if ( is_scalar( $channel ) ) {
                    $legacy_entry['enabled'] = $this->normalize_checkbox_value( $channel, true );
                }

                $normalized[] = $legacy_entry;

                continue;
            }

            if ( ! isset( $channel['key'] ) ) {
                $channel['key'] = is_string( $key ) ? $key : '';
            }

            $normalized[] = $channel;
        }

        return $normalized;
    }

    private function is_list( array $array ): bool {
        return array_keys( $array ) === range( 0, count( $array ) - 1 );
    }

    /**
     * @param mixed $fallback Potential fallback icon key when the provided value sanitizes to an empty string.
     */
    private function sanitize_share_channel_icon( string $icon, $fallback = '' ): string {
        $normalized = strtolower( trim( $icon ) );
        $normalized = preg_replace( '/[^a-z0-9_-]/', '', $normalized );

        if ( is_string( $normalized ) && '' !== $normalized ) {
            return $normalized;
        }

        if ( is_string( $fallback ) && '' !== $fallback ) {
            $fallback_normalized = strtolower( trim( $fallback ) );
            $fallback_normalized = preg_replace( '/[^a-z0-9_-]/', '', $fallback_normalized );

            if ( is_string( $fallback_normalized ) && '' !== $fallback_normalized ) {
                return $fallback_normalized;
            }
        }

        return 'generic';
    }
}
