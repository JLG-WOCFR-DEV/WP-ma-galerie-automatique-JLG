<?php

namespace MaGalerieAutomatique\Admin;

use MaGalerieAutomatique\Plugin;

class Settings {
    private Plugin $plugin;

    public function __construct( Plugin $plugin ) {
        $this->plugin = $plugin;
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
        register_setting( 'mga_settings_group', 'mga_settings', [ $this, 'sanitize_settings' ] );
    }

    public function enqueue_assets( string $hook ): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        if ( 'toplevel_page_ma-galerie-automatique' !== $hook ) {
            return;
        }

        wp_enqueue_style(
            'mga-admin-style',
            $this->plugin->get_plugin_dir_url() . 'assets/css/admin-style.css',
            [],
            MGA_VERSION
        );

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
            [ 'wp-i18n', 'mga-focus-utils' ],
            MGA_VERSION,
            true
        );

        wp_enqueue_script( 'mga-focus-utils' );
        wp_enqueue_script( 'mga-admin-script' );

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
            'thumb_size'         => 90,
            'thumb_size_mobile'  => 70,
            'accent_color'       => '#ffffff',
            'bg_opacity'         => 0.95,
            'loop'               => true,
            'autoplay_start'     => false,
            'background_style'   => 'echo',
            'z_index'            => 99999,
            'debug_mode'         => false,
            'show_zoom'          => true,
            'show_download'      => true,
            'show_share'         => true,
            'show_fullscreen'    => true,
            'groupAttribute'     => 'data-mga-gallery',
            'contentSelectors'   => [],
            'allowBodyFallback'  => false,
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

        $normalize_boolean_flag = static function ( $value, bool $default ): bool {
            if ( is_bool( $value ) ) {
                return $value;
            }

            if ( null === $value ) {
                return $default;
            }

            if ( is_scalar( $value ) ) {
                $filtered = filter_var( $value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );

                if ( null !== $filtered ) {
                    return $filtered;
                }
            }

            return (bool) $value;
        };

        if ( null === $existing_settings ) {
            $existing_settings = get_option( 'mga_settings', [] );
        }

        if ( ! is_array( $existing_settings ) ) {
            $existing_settings = [];
        }

        if ( isset( $input['delay'] ) ) {
            $delay           = (int) $input['delay'];
            $bounded_delay   = max( 1, min( 30, $delay ) );
            $output['delay'] = $bounded_delay;
        } else {
            $output['delay'] = $defaults['delay'];
        }

        if ( isset( $input['thumb_size'] ) ) {
            $thumb_size             = (int) $input['thumb_size'];
            $bounded_thumb_size     = max( 50, min( 150, $thumb_size ) );
            $output['thumb_size']   = $bounded_thumb_size;
        } else {
            $output['thumb_size'] = $defaults['thumb_size'];
        }

        if ( isset( $input['thumb_size_mobile'] ) ) {
            $thumb_size_mobile           = (int) $input['thumb_size_mobile'];
            $bounded_thumb_size_mobile   = max( 40, min( 100, $thumb_size_mobile ) );
            $output['thumb_size_mobile'] = $bounded_thumb_size_mobile;
        } else {
            $output['thumb_size_mobile'] = $defaults['thumb_size_mobile'];
        }

        if ( isset( $input['accent_color'] ) ) {
            $sanitized_accent          = sanitize_hex_color( $input['accent_color'] );
            $output['accent_color']    = $sanitized_accent ? $sanitized_accent : $defaults['accent_color'];
        } else {
            $output['accent_color'] = $defaults['accent_color'];
        }

        $output['bg_opacity'] = isset( $input['bg_opacity'] )
            ? max( min( (float) $input['bg_opacity'], 1 ), 0 )
            : $defaults['bg_opacity'];

        if ( array_key_exists( 'loop', $input ) ) {
            $output['loop'] = $normalize_boolean_flag( $input['loop'], (bool) $defaults['loop'] );
        } elseif ( array_key_exists( 'loop', $existing_settings ) ) {
            $output['loop'] = $normalize_boolean_flag( $existing_settings['loop'], (bool) $defaults['loop'] );
        } else {
            $output['loop'] = (bool) $defaults['loop'];
        }

        if ( array_key_exists( 'autoplay_start', $input ) ) {
            $output['autoplay_start'] = $normalize_boolean_flag( $input['autoplay_start'], (bool) $defaults['autoplay_start'] );
        } elseif ( array_key_exists( 'autoplay_start', $existing_settings ) ) {
            $output['autoplay_start'] = $normalize_boolean_flag( $existing_settings['autoplay_start'], (bool) $defaults['autoplay_start'] );
        } else {
            $output['autoplay_start'] = (bool) $defaults['autoplay_start'];
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

        $allowed_bg_styles            = [ 'echo', 'blur', 'texture' ];
        $output['background_style']   = isset( $input['background_style'] ) && in_array( $input['background_style'], $allowed_bg_styles, true )
            ? $input['background_style']
            : $defaults['background_style'];

        if ( isset( $input['z_index'] ) ) {
            $raw_z_index        = (int) $input['z_index'];
            $output['z_index']  = max( 0, $raw_z_index );
        } else {
            $output['z_index'] = $defaults['z_index'];
        }

        $sanitize_selectors = static function ( $selectors ) {
            $sanitized = [];

            foreach ( (array) $selectors as $selector ) {
                $clean_selector = (string) $selector;
                $clean_selector = wp_strip_all_tags( $clean_selector );
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
                $raw_selectors = preg_split( '/\r\n|\r|\n/', $raw_selectors );
            }

            if ( is_array( $raw_selectors ) ) {
                $output['contentSelectors'] = $sanitize_selectors( $raw_selectors );
            } else {
                $output['contentSelectors'] = $existing_selectors;
            }
        } else {
            $output['contentSelectors'] = $existing_selectors;
        }

        if ( array_key_exists( 'allowBodyFallback', $input ) ) {
            $output['allowBodyFallback'] = $normalize_boolean_flag( $input['allowBodyFallback'], (bool) $defaults['allowBodyFallback'] );
        } elseif ( array_key_exists( 'allowBodyFallback', $existing_settings ) ) {
            $output['allowBodyFallback'] = $normalize_boolean_flag( $existing_settings['allowBodyFallback'], (bool) $defaults['allowBodyFallback'] );
        } else {
            $output['allowBodyFallback'] = (bool) $defaults['allowBodyFallback'];
        }

        if ( array_key_exists( 'debug_mode', $input ) ) {
            $output['debug_mode'] = $normalize_boolean_flag( $input['debug_mode'], (bool) $defaults['debug_mode'] );
        } elseif ( array_key_exists( 'debug_mode', $existing_settings ) ) {
            $output['debug_mode'] = $normalize_boolean_flag( $existing_settings['debug_mode'], (bool) $defaults['debug_mode'] );
        } else {
            $output['debug_mode'] = (bool) $defaults['debug_mode'];
        }

        $resolve_toolbar_toggle = static function ( string $key ) use ( $input, $existing_settings, $defaults, $normalize_boolean_flag ) {
            if ( is_array( $input ) && array_key_exists( $key, $input ) ) {
                return $normalize_boolean_flag( $input[ $key ], (bool) $defaults[ $key ] );
            }

            if ( is_array( $existing_settings ) && array_key_exists( $key, $existing_settings ) ) {
                return $normalize_boolean_flag( $existing_settings[ $key ], (bool) $defaults[ $key ] );
            }

            return (bool) $defaults[ $key ];
        };

        foreach ( [ 'show_zoom', 'show_download', 'show_share', 'show_fullscreen' ] as $toolbar_toggle ) {
            $output[ $toolbar_toggle ] = $resolve_toolbar_toggle( $toolbar_toggle );
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
        $saved_settings = get_option( 'mga_settings', [] );

        return $this->sanitize_settings( $saved_settings, $saved_settings );
    }
}
