<?php

namespace MaGalerieAutomatique\Admin;

use MaGalerieAutomatique\Plugin;
use WP_Post;

class Settings {

    private Plugin $plugin;

    private array $sanitized_settings_cache = [];

    public function __construct( Plugin $plugin ) {
        $this->plugin = $plugin;

        if ( function_exists( 'add_action' ) ) {
            add_action( 'switch_blog', [ $this, 'handle_switch_blog' ], 10, 2 );
            add_action( 'wp_ajax_mga_save_settings', [ $this, 'handle_ajax_save_settings' ] );
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
            'include_svg'        => 'bool',
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
            'mga-admin-script',
            $this->plugin->get_plugin_dir_url() . 'assets/js/dist/admin.js',
            [ 'wp-i18n', 'wp-color-picker' ],
            MGA_VERSION,
            true
        );

        wp_enqueue_script( 'mga-admin-script' );

        $swiper_version  = '11.1.4';
        $local_swiper_js = $this->plugin->get_plugin_dir_url() . 'assets/vendor/swiper/swiper-bundle.min.js';
        $local_swiper_css = $this->plugin->get_plugin_dir_url() . 'assets/vendor/swiper/swiper-bundle.min.css';
        $cdn_swiper_js   = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.js';
        $cdn_swiper_css  = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.css';

        $admin_swiper_loader = [
            'version'  => $swiper_version,
            'attempts' => [
                [
                    'key'    => 'local',
                    'label'  => __( 'Bibliothèque locale', 'lightbox-jlg' ),
                    'inject' => true,
                    'js'     => [
                        'src' => $local_swiper_js,
                    ],
                    'css'    => [
                        'href' => $local_swiper_css,
                    ],
                ],
                [
                    'key'    => 'cdn',
                    'label'  => __( 'CDN jsDelivr', 'lightbox-jlg' ),
                    'inject' => true,
                    'js'     => [
                        'src'        => $cdn_swiper_js,
                        'integrity'  => MGA_SWIPER_JS_SRI_HASH,
                        'crossOrigin' => 'anonymous',
                    ],
                    'css'    => [
                        'href'        => $cdn_swiper_css,
                        'integrity'   => MGA_SWIPER_CSS_SRI_HASH,
                        'crossOrigin' => 'anonymous',
                    ],
                ],
            ],
        ];

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

        wp_localize_script(
            'mga-admin-script',
            'mgaAdminConfig',
            [
                'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'mga_save_settings' ),
                'messages' => [
                    'saving'  => __( 'Enregistrement en cours…', 'lightbox-jlg' ),
                    'success' => __( 'Réglages enregistrés.', 'lightbox-jlg' ),
                    'error'   => __( 'Impossible d’enregistrer les réglages.', 'lightbox-jlg' ),
                ],
                'swiper'   => $admin_swiper_loader,
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

    public function get_trigger_scenarios(): array {
        $default_label = __( 'Images liées ou pièces jointes', 'lightbox-jlg' );

        return apply_filters(
            'mga_trigger_scenarios',
            [
                'linked-media'      => [
                    'label'       => $default_label,
                    'description' => __( 'Déclenche la visionneuse dès qu’une image renvoie vers un média existant (fichier ou page de pièce jointe).', 'lightbox-jlg' ),
                ],
                'self-linked-media' => [
                    'label'       => __( 'Images liées à leur fichier média', 'lightbox-jlg' ),
                    'description' => __( 'N’intègre que les images dont le lien pointe directement vers leur propre fichier (option « Lien vers le fichier média »).', 'lightbox-jlg' ),
                ],
            ]
        );
    }

    private function get_settings_baseline(): array {
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
            'include_svg'        => true,
            'tracked_post_types' => [ 'post', 'page' ],
            'trigger_scenario'   => 'linked-media',
        ];
    }

    public function get_default_settings(): array {
        $defaults = $this->get_settings_baseline();

        $defaults['contextual_presets'] = $this->get_default_contextual_presets( $defaults );

        return $defaults;
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
            'include_svg',
        ];

        foreach ( $general_toggle_keys as $checkbox_key ) {
            $output[ $checkbox_key ] = $resolve_checkbox_value( $checkbox_key );
        }

        $trigger_scenarios       = array_keys( $this->get_trigger_scenarios() );
        $default_trigger_scenario = $defaults['trigger_scenario'] ?? 'linked-media';

        $resolve_trigger_scenario = static function ( $value ) use ( $trigger_scenarios, $default_trigger_scenario ) {
            if ( ! is_string( $value ) ) {
                return $default_trigger_scenario;
            }

            $candidate = strtolower( trim( $value ) );

            return in_array( $candidate, $trigger_scenarios, true )
                ? $candidate
                : $default_trigger_scenario;
        };

        if ( array_key_exists( 'trigger_scenario', $input ) ) {
            $output['trigger_scenario'] = $resolve_trigger_scenario( $input['trigger_scenario'] );
        } elseif ( isset( $existing_settings['trigger_scenario'] ) ) {
            $output['trigger_scenario'] = $resolve_trigger_scenario( $existing_settings['trigger_scenario'] );
        } else {
            $output['trigger_scenario'] = $default_trigger_scenario;
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

        $default_contextual_presets  = isset( $defaults['contextual_presets'] ) && is_array( $defaults['contextual_presets'] )
            ? $defaults['contextual_presets']
            : [];
        $existing_contextual_presets = isset( $existing_settings['contextual_presets'] ) && is_array( $existing_settings['contextual_presets'] )
            ? $existing_settings['contextual_presets']
            : $default_contextual_presets;

        if ( array_key_exists( 'contextual_presets', $input ) ) {
            $output['contextual_presets'] = $this->sanitize_contextual_presets(
                $input['contextual_presets'],
                $existing_contextual_presets,
                $default_contextual_presets,
                false
            );
        } else {
            $output['contextual_presets'] = $this->sanitize_contextual_presets(
                $existing_contextual_presets,
                $existing_contextual_presets,
                $default_contextual_presets,
                true
            );
        }

        return $output;
    }

    public function handle_ajax_save_settings(): void {
        if ( ! check_ajax_referer( 'mga_save_settings', '_ajax_nonce', false ) ) {
            wp_send_json_error(
                [ 'message' => __( 'Jeton de sécurité invalide.', 'lightbox-jlg' ) ],
                400
            );
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error(
                [ 'message' => __( 'Vous n’avez pas les permissions nécessaires pour modifier ces réglages.', 'lightbox-jlg' ) ],
                403
            );
        }

        $raw_settings = [];

        if ( isset( $_POST['mga_settings'] ) && is_array( $_POST['mga_settings'] ) ) {
            $raw_settings = wp_unslash( $_POST['mga_settings'] );
        }

        $existing_settings  = get_option( 'mga_settings', $this->get_default_settings() );
        $sanitized_settings = $this->sanitize_settings( $raw_settings, $existing_settings );

        update_option( 'mga_settings', $sanitized_settings );

        wp_send_json_success(
            [
                'message'  => __( 'Réglages enregistrés.', 'lightbox-jlg' ),
                'settings' => $sanitized_settings,
            ]
        );
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

        $label    = $this->resolve_share_channel_label( $channel_candidate, $existing_for_key, $defaults_for_key, $sanitized_key );
        $template = $this->resolve_share_channel_template( $channel_candidate, $existing_for_key, $defaults_for_key );
        $icon     = $this->resolve_share_channel_icon( $channel_candidate, $existing_for_key, $defaults_for_key, $sanitized_key );
        $enabled  = $this->resolve_share_channel_enabled( $channel_candidate, $existing_for_key, $defaults_for_key );

        if ( '' === $template ) {
            $enabled = false;
        }

        return [
            'key'      => $sanitized_key,
            'label'    => $label,
            'template' => $template,
            'icon'     => $icon,
            'enabled'  => $enabled,
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

    public function get_default_contextual_presets( array $settings_defaults = [] ): array {
        if ( empty( $settings_defaults ) ) {
            $settings_defaults = $this->get_settings_baseline();
        }

        return [
            [
                'key'         => 'portfolio-focus',
                'label'       => __( 'Portfolio immersif', 'lightbox-jlg' ),
                'description' => __( 'Réduit l’interface pour valoriser une sélection courte d’images (pages portfolio, études de cas).', 'lightbox-jlg' ),
                'enabled'     => false,
                'priority'    => 5,
                'contexts'    => [
                    'post_types'   => [ 'page' ],
                    'is_singular'  => true,
                ],
                'settings'    => [
                    'thumbs_layout'      => 'hidden',
                    'show_cta'           => false,
                    'show_share'         => false,
                    'show_download'      => true,
                    'background_style'   => 'blur',
                    'style_preset'       => '',
                    'delay'              => $settings_defaults['delay'] ?? 4,
                    'autoplay_start'     => false,
                ],
            ],
            [
                'key'         => 'blog-reportage',
                'label'       => __( 'Reportage éditorial', 'lightbox-jlg' ),
                'description' => __( 'Optimise le partage et la navigation pour les articles de blog ou reportages photo.', 'lightbox-jlg' ),
                'enabled'     => false,
                'priority'    => 10,
                'contexts'    => [
                    'post_types'  => [ 'post' ],
                    'is_singular' => true,
                ],
                'settings'    => [
                    'thumbs_layout'      => 'bottom',
                    'show_share'         => true,
                    'show_download'      => false,
                    'show_cta'           => false,
                    'autoplay_start'     => false,
                    'delay'              => max( 3, (int) ( $settings_defaults['delay'] ?? 4 ) ),
                    'style_preset'       => 'shadcn-ui',
                ],
            ],
            [
                'key'         => 'homepage-teaser',
                'label'       => __( 'Accueil mobile épuré', 'lightbox-jlg' ),
                'description' => __( 'Allège les contrôles sur la page d’accueil ou les pages d’atterrissage pour rester discret.', 'lightbox-jlg' ),
                'enabled'     => false,
                'priority'    => 15,
                'contexts'    => [
                    'is_front_page' => true,
                ],
                'settings'    => [
                    'thumbs_layout'      => 'hidden',
                    'show_cta'           => false,
                    'show_share'         => false,
                    'show_download'      => false,
                    'autoplay_start'     => true,
                    'delay'              => min( 6, max( 2, (int) ( $settings_defaults['delay'] ?? 4 ) ) ),
                    'style_preset'       => 'headless-ui',
                ],
            ],
        ];
    }

    public function get_contextual_preset_catalog(): array {
        $defaults = $this->get_default_contextual_presets();
        $catalog  = \apply_filters( 'mga_contextual_preset_catalog', $defaults );

        if ( ! is_array( $catalog ) ) {
            return $defaults;
        }

        return $this->sanitize_contextual_presets( $catalog, [], $defaults, true );
    }

    public function resolve_settings_for_context( ?WP_Post $post = null, array $context = [] ): array {
        $sanitized = $this->get_sanitized_settings();
        $defaults  = $this->get_default_settings();

        $merged_settings = wp_parse_args( $sanitized, $defaults );

        $contextual_presets = [];

        if ( isset( $sanitized['contextual_presets'] ) && is_array( $sanitized['contextual_presets'] ) ) {
            $contextual_presets = $sanitized['contextual_presets'];
        }

        $context_flags = $this->resolve_runtime_context_flags( $post, $context );
        $matched       = $this->select_contextual_preset_for_context( $contextual_presets, $context_flags );

        $active_key = null;

        if ( null !== $matched ) {
            if ( isset( $matched['settings'] ) && is_array( $matched['settings'] ) ) {
                $merged_settings = array_merge( $merged_settings, $matched['settings'] );
            }

            if ( isset( $matched['key'] ) && '' !== $matched['key'] ) {
                $active_key = $matched['key'];
            }
        }

        $merged_settings['active_contextual_preset'] = $active_key;

        /**
         * Filters the resolved settings array after contextual presets have been applied.
         *
         * @param array $merged_settings   The resolved settings for the current context.
         * @param array $context_flags     Normalised runtime context flags.
         * @param array|null $matched      The matched contextual preset definition, if any.
         */
        return \apply_filters( 'mga_resolved_settings_for_context', $merged_settings, $context_flags, $matched );
    }

    private function resolve_runtime_context_flags( ?WP_Post $post, array $context = [] ): array {
        $post_type = null;

        if ( $post instanceof WP_Post ) {
            $post_type = get_post_type( $post );
        }

        if ( null === $post_type && isset( $context['post_type'] ) ) {
            $post_type = $context['post_type'];
        }

        if ( null === $post_type && function_exists( 'get_post_type' ) ) {
            $post_type_candidate = get_post_type();

            if ( $post_type_candidate ) {
                $post_type = $post_type_candidate;
            }
        }

        if ( null === $post_type && function_exists( 'get_queried_object' ) ) {
            $queried = get_queried_object();

            if ( $queried instanceof WP_Post ) {
                $post_type = get_post_type( $queried );
            } elseif ( isset( $queried->post_type ) ) {
                $post_type = $queried->post_type;
            }
        }

        $normalized_post_type = '';

        if ( is_string( $post_type ) && '' !== $post_type ) {
            $normalized_post_type = sanitize_key( $post_type );
        }

        $is_front_page = $context['is_front_page'] ?? ( function_exists( 'is_front_page' ) ? is_front_page() : false );
        $is_singular   = $context['is_singular'] ?? ( function_exists( 'is_singular' ) ? is_singular() : false );
        $is_archive    = $context['is_archive'] ?? ( function_exists( 'is_archive' ) ? is_archive() : false );

        return [
            'post_type'     => $normalized_post_type,
            'is_front_page' => (bool) $is_front_page,
            'is_singular'   => (bool) $is_singular,
            'is_archive'    => (bool) $is_archive,
        ];
    }

    private function select_contextual_preset_for_context( array $presets, array $context_flags ): ?array {
        if ( empty( $presets ) ) {
            return null;
        }

        usort(
            $presets,
            static function ( $a, $b ) {
                $priority_a = isset( $a['priority'] ) ? (int) $a['priority'] : 10;
                $priority_b = isset( $b['priority'] ) ? (int) $b['priority'] : 10;

                if ( $priority_a === $priority_b ) {
                    return 0;
                }

                return $priority_a <=> $priority_b;
            }
        );

        foreach ( $presets as $preset ) {
            if ( ! is_array( $preset ) || empty( $preset['enabled'] ) ) {
                continue;
            }

            if ( $this->contextual_preset_matches_context( $preset, $context_flags ) ) {
                return $preset;
            }
        }

        return null;
    }

    private function contextual_preset_matches_context( array $preset, array $context_flags ): bool {
        $contexts = isset( $preset['contexts'] ) && is_array( $preset['contexts'] ) ? $preset['contexts'] : [];

        if ( isset( $contexts['post_types'] ) && is_array( $contexts['post_types'] ) && ! empty( $contexts['post_types'] ) ) {
            if ( '' === $context_flags['post_type'] ) {
                return false;
            }

            if ( ! in_array( $context_flags['post_type'], $contexts['post_types'], true ) ) {
                return false;
            }
        }

        foreach ( [ 'is_front_page', 'is_singular', 'is_archive' ] as $flag ) {
            if ( array_key_exists( $flag, $contexts ) ) {
                $expected = (bool) $contexts[ $flag ];

                if ( $expected !== (bool) $context_flags[ $flag ] ) {
                    return false;
                }
            }
        }

        return true;
    }

    private function sanitize_contextual_presets( $raw_presets, array $existing_presets, array $default_presets, bool $use_defaults_as_fallback = true ): array {
        $presets_list = [];

        if ( is_array( $raw_presets ) ) {
            if ( $this->is_list( $raw_presets ) ) {
                $presets_list = $raw_presets;
            } else {
                foreach ( $raw_presets as $key => $candidate ) {
                    if ( ! is_array( $candidate ) ) {
                        continue;
                    }

                    if ( ! isset( $candidate['key'] ) && is_string( $key ) ) {
                        $candidate['key'] = $key;
                    }

                    $presets_list[] = $candidate;
                }
            }
        }

        if ( $use_defaults_as_fallback && empty( $presets_list ) ) {
            $presets_list = $default_presets;
        }

        $defaults_by_key = $this->index_contextual_presets_by_key( $default_presets );
        $existing_by_key = $this->index_contextual_presets_by_key( $existing_presets );

        $sanitized   = [];
        $registered  = [];

        foreach ( $presets_list as $candidate ) {
            $sanitized_preset = $this->sanitize_single_contextual_preset(
                $candidate,
                $defaults_by_key,
                $existing_by_key,
                $registered
            );

            if ( null !== $sanitized_preset ) {
                $sanitized[] = $sanitized_preset;
            }
        }

        usort(
            $sanitized,
            static function ( $a, $b ) {
                $priority_a = isset( $a['priority'] ) ? (int) $a['priority'] : 10;
                $priority_b = isset( $b['priority'] ) ? (int) $b['priority'] : 10;

                if ( $priority_a === $priority_b ) {
                    return 0;
                }

                return $priority_a <=> $priority_b;
            }
        );

        return array_values( $sanitized );
    }

    private function sanitize_single_contextual_preset( $candidate, array $defaults_by_key, array $existing_by_key, array &$registered_keys ): ?array {
        if ( ! is_array( $candidate ) ) {
            return null;
        }

        $raw_key = '';

        if ( isset( $candidate['key'] ) ) {
            $raw_key = (string) $candidate['key'];
        }

        $sanitized_key = sanitize_key( $raw_key );

        if ( '' === $sanitized_key && isset( $candidate['label'] ) ) {
            $sanitized_key = sanitize_key( sanitize_title( (string) $candidate['label'] ) );
        }

        if ( '' === $sanitized_key ) {
            return null;
        }

        if ( isset( $registered_keys[ $sanitized_key ] ) ) {
            return null;
        }

        $registered_keys[ $sanitized_key ] = true;

        $defaults_for_key = $defaults_by_key[ $sanitized_key ] ?? [];
        $existing_for_key = $existing_by_key[ $sanitized_key ] ?? [];

        $label = isset( $candidate['label'] )
            ? sanitize_text_field( $candidate['label'] )
            : ( isset( $existing_for_key['label'] ) ? sanitize_text_field( $existing_for_key['label'] ) : ( $defaults_for_key['label'] ?? '' ) );

        $description = isset( $candidate['description'] )
            ? sanitize_textarea_field( $candidate['description'] )
            : ( isset( $existing_for_key['description'] ) ? sanitize_textarea_field( $existing_for_key['description'] ) : ( $defaults_for_key['description'] ?? '' ) );

        $enabled = isset( $candidate['enabled'] )
            ? $this->normalize_checkbox_value( $candidate['enabled'], $defaults_for_key['enabled'] ?? false )
            : ( isset( $existing_for_key['enabled'] )
                ? $this->normalize_checkbox_value( $existing_for_key['enabled'], $defaults_for_key['enabled'] ?? false )
                : (bool) ( $defaults_for_key['enabled'] ?? false ) );

        $priority = 10;

        if ( isset( $candidate['priority'] ) ) {
            $priority = (int) $candidate['priority'];
        } elseif ( isset( $existing_for_key['priority'] ) ) {
            $priority = (int) $existing_for_key['priority'];
        } elseif ( isset( $defaults_for_key['priority'] ) ) {
            $priority = (int) $defaults_for_key['priority'];
        }

        $contexts = $this->sanitize_contextual_preset_contexts(
            $candidate['contexts'] ?? null,
            $existing_for_key['contexts'] ?? [],
            $defaults_for_key['contexts'] ?? []
        );

        $settings = $this->sanitize_contextual_preset_settings(
            $candidate['settings'] ?? [],
            $existing_for_key['settings'] ?? [],
            $defaults_for_key['settings'] ?? []
        );

        return [
            'key'         => $sanitized_key,
            'label'       => $label,
            'description' => $description,
            'enabled'     => $enabled,
            'priority'    => $priority,
            'contexts'    => $contexts,
            'settings'    => $settings,
        ];
    }

    private function sanitize_contextual_preset_contexts( $raw_contexts, array $existing_contexts, array $default_contexts ): array {
        $contexts = [];

        $all_post_types = get_post_types( [], 'names' );

        $post_types_source = null;

        if ( is_array( $raw_contexts ) && array_key_exists( 'post_types', $raw_contexts ) ) {
            $post_types_source = $raw_contexts['post_types'];
        } elseif ( isset( $existing_contexts['post_types'] ) ) {
            $post_types_source = $existing_contexts['post_types'];
        } elseif ( isset( $default_contexts['post_types'] ) ) {
            $post_types_source = $default_contexts['post_types'];
        }

        if ( null !== $post_types_source ) {
            $sanitized_post_types = [];

            foreach ( (array) $post_types_source as $post_type ) {
                $post_type = sanitize_key( (string) $post_type );

                if ( in_array( $post_type, $all_post_types, true ) ) {
                    $sanitized_post_types[] = $post_type;
                }
            }

            $contexts['post_types'] = array_values( array_unique( $sanitized_post_types ) );
        }

        foreach ( [ 'is_front_page', 'is_singular', 'is_archive' ] as $flag ) {
            if ( is_array( $raw_contexts ) && array_key_exists( $flag, $raw_contexts ) ) {
                $contexts[ $flag ] = $this->normalize_checkbox_value( $raw_contexts[ $flag ], $default_contexts[ $flag ] ?? false );
                continue;
            }

            if ( array_key_exists( $flag, $existing_contexts ) ) {
                $contexts[ $flag ] = $this->normalize_checkbox_value( $existing_contexts[ $flag ], $default_contexts[ $flag ] ?? false );
                continue;
            }

            if ( array_key_exists( $flag, $default_contexts ) ) {
                $contexts[ $flag ] = $this->normalize_checkbox_value( $default_contexts[ $flag ], false );
            }
        }

        return $contexts;
    }

    private function sanitize_contextual_preset_settings( $raw_settings, array $existing_settings, array $default_settings ): array {
        $sanitized         = [];
        $raw_settings      = is_array( $raw_settings ) ? $raw_settings : [];
        $existing_settings = is_array( $existing_settings ) ? $existing_settings : [];
        $default_settings  = is_array( $default_settings ) ? $default_settings : [];

        $clamp_int = static function ( $value, int $min, int $max ): int {
            $value = (int) $value;

            if ( $value < $min ) {
                return $min;
            }

            if ( $value > $max ) {
                return $max;
            }

            return $value;
        };

        $clamp_float = static function ( $value, float $min, float $max ): float {
            $value = (float) $value;

            if ( $value < $min ) {
                return $min;
            }

            if ( $value > $max ) {
                return $max;
            }

            return $value;
        };

        foreach ( [ 'delay' => [ 1, 30 ], 'speed' => [ 100, 5000 ], 'thumb_size' => [ 50, 150 ], 'thumb_size_mobile' => [ 40, 100 ] ] as $key => $bounds ) {
            if ( array_key_exists( $key, $raw_settings ) ) {
                $raw_value = $raw_settings[ $key ];

                if ( '' === $raw_value || null === $raw_value ) {
                    continue;
                }

                $sanitized[ $key ] = $clamp_int( $raw_value, $bounds[0], $bounds[1] );
                continue;
            }

            if ( array_key_exists( $key, $existing_settings ) ) {
                $sanitized[ $key ] = $clamp_int( $existing_settings[ $key ], $bounds[0], $bounds[1] );
                continue;
            }

            if ( array_key_exists( $key, $default_settings ) ) {
                $sanitized[ $key ] = $clamp_int( $default_settings[ $key ], $bounds[0], $bounds[1] );
            }
        }

        if ( array_key_exists( 'bg_opacity', $raw_settings ) ) {
            $raw_value = $raw_settings['bg_opacity'];

            if ( '' !== $raw_value && null !== $raw_value ) {
                $sanitized['bg_opacity'] = $clamp_float( $raw_value, 0.0, 1.0 );
            }
        } elseif ( array_key_exists( 'bg_opacity', $existing_settings ) ) {
            $sanitized['bg_opacity'] = $clamp_float( $existing_settings['bg_opacity'], 0.0, 1.0 );
        } elseif ( array_key_exists( 'bg_opacity', $default_settings ) ) {
            $sanitized['bg_opacity'] = $clamp_float( $default_settings['bg_opacity'], 0.0, 1.0 );
        }

        if ( array_key_exists( 'accent_color', $raw_settings ) ) {
            $color = sanitize_hex_color( (string) $raw_settings['accent_color'] );

            if ( $color ) {
                $sanitized['accent_color'] = $color;
            }
        } elseif ( array_key_exists( 'accent_color', $existing_settings ) ) {
            $color = sanitize_hex_color( (string) $existing_settings['accent_color'] );

            if ( $color ) {
                $sanitized['accent_color'] = $color;
            }
        } elseif ( array_key_exists( 'accent_color', $default_settings ) ) {
            $color = sanitize_hex_color( (string) $default_settings['accent_color'] );

            if ( $color ) {
                $sanitized['accent_color'] = $color;
            }
        }

        foreach ( [
            'autoplay_start',
            'loop',
            'show_zoom',
            'show_download',
            'show_share',
            'show_cta',
            'show_fullscreen',
            'show_thumbs_mobile',
            'start_on_clicked_image',
        ] as $flag_key ) {
            if ( array_key_exists( $flag_key, $raw_settings ) ) {
                $raw_value  = $raw_settings[ $flag_key ];
                $normalized = is_string( $raw_value ) ? strtolower( trim( $raw_value ) ) : $raw_value;

                if ( in_array( $normalized, [ '', 'inherit', '__inherit', null ], true ) ) {
                    continue;
                }

                if ( in_array( $normalized, [ 'enable', 'enabled', '1', 'true', 'on' ], true ) ) {
                    $sanitized[ $flag_key ] = true;
                    continue;
                }

                if ( in_array( $normalized, [ 'disable', 'disabled', '0', 'false', 'off' ], true ) ) {
                    $sanitized[ $flag_key ] = false;
                    continue;
                }

                $sanitized[ $flag_key ] = $this->normalize_checkbox_value( $raw_value, $default_settings[ $flag_key ] ?? false );
                continue;
            }

            if ( array_key_exists( $flag_key, $existing_settings ) ) {
                $sanitized[ $flag_key ] = $this->normalize_checkbox_value( $existing_settings[ $flag_key ], $default_settings[ $flag_key ] ?? false );
                continue;
            }

            if ( array_key_exists( $flag_key, $default_settings ) ) {
                $sanitized[ $flag_key ] = $this->normalize_checkbox_value( $default_settings[ $flag_key ], $default_settings[ $flag_key ] ?? false );
            }
        }

        $allowed_layouts = [ 'bottom', 'left', 'hidden' ];

        if ( array_key_exists( 'thumbs_layout', $raw_settings ) ) {
            $layout = is_string( $raw_settings['thumbs_layout'] ) ? strtolower( $raw_settings['thumbs_layout'] ) : '';

            if ( '' !== $layout && in_array( $layout, $allowed_layouts, true ) ) {
                $sanitized['thumbs_layout'] = $layout;
            }
        } elseif ( array_key_exists( 'thumbs_layout', $existing_settings ) ) {
            $layout = is_string( $existing_settings['thumbs_layout'] ) ? strtolower( $existing_settings['thumbs_layout'] ) : '';

            if ( in_array( $layout, $allowed_layouts, true ) ) {
                $sanitized['thumbs_layout'] = $layout;
            }
        } elseif ( array_key_exists( 'thumbs_layout', $default_settings ) ) {
            $layout = is_string( $default_settings['thumbs_layout'] ) ? strtolower( $default_settings['thumbs_layout'] ) : '';

            if ( in_array( $layout, $allowed_layouts, true ) ) {
                $sanitized['thumbs_layout'] = $layout;
            }
        }

        $allowed_effects = [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ];

        if ( array_key_exists( 'effect', $raw_settings ) ) {
            $effect = is_string( $raw_settings['effect'] ) ? strtolower( $raw_settings['effect'] ) : '';

            if ( '' !== $effect && in_array( $effect, $allowed_effects, true ) ) {
                $sanitized['effect'] = $effect;
            }
        } elseif ( array_key_exists( 'effect', $existing_settings ) ) {
            $effect = is_string( $existing_settings['effect'] ) ? strtolower( $existing_settings['effect'] ) : '';

            if ( in_array( $effect, $allowed_effects, true ) ) {
                $sanitized['effect'] = $effect;
            }
        } elseif ( array_key_exists( 'effect', $default_settings ) ) {
            $effect = is_string( $default_settings['effect'] ) ? strtolower( $default_settings['effect'] ) : '';

            if ( in_array( $effect, $allowed_effects, true ) ) {
                $sanitized['effect'] = $effect;
            }
        }

        $allowed_easing = [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ];

        if ( array_key_exists( 'easing', $raw_settings ) ) {
            $easing = is_string( $raw_settings['easing'] ) ? strtolower( $raw_settings['easing'] ) : '';

            if ( '' !== $easing && in_array( $easing, $allowed_easing, true ) ) {
                $sanitized['easing'] = $easing;
            }
        } elseif ( array_key_exists( 'easing', $existing_settings ) ) {
            $easing = is_string( $existing_settings['easing'] ) ? strtolower( $existing_settings['easing'] ) : '';

            if ( in_array( $easing, $allowed_easing, true ) ) {
                $sanitized['easing'] = $easing;
            }
        } elseif ( array_key_exists( 'easing', $default_settings ) ) {
            $easing = is_string( $default_settings['easing'] ) ? strtolower( $default_settings['easing'] ) : '';

            if ( in_array( $easing, $allowed_easing, true ) ) {
                $sanitized['easing'] = $easing;
            }
        }

        $allowed_background_styles = [ 'echo', 'blur', 'texture' ];

        if ( array_key_exists( 'background_style', $raw_settings ) ) {
            $background = is_string( $raw_settings['background_style'] ) ? strtolower( $raw_settings['background_style'] ) : '';

            if ( '' !== $background && in_array( $background, $allowed_background_styles, true ) ) {
                $sanitized['background_style'] = $background;
            }
        } elseif ( array_key_exists( 'background_style', $existing_settings ) ) {
            $background = is_string( $existing_settings['background_style'] ) ? strtolower( $existing_settings['background_style'] ) : '';

            if ( in_array( $background, $allowed_background_styles, true ) ) {
                $sanitized['background_style'] = $background;
            }
        } elseif ( array_key_exists( 'background_style', $default_settings ) ) {
            $background = is_string( $default_settings['background_style'] ) ? strtolower( $default_settings['background_style'] ) : '';

            if ( in_array( $background, $allowed_background_styles, true ) ) {
                $sanitized['background_style'] = $background;
            }
        }

        if ( array_key_exists( 'style_preset', $raw_settings ) ) {
            $raw_value = $raw_settings['style_preset'];

            if ( is_string( $raw_value ) ) {
                $normalized_value = strtolower( trim( $raw_value ) );

                if ( 'inherit' === $normalized_value ) {
                    // Explicit request to fall back to the global preset.
                } else {
                    $candidate = sanitize_key( $raw_value );

                    if ( '' === $candidate ) {
                        $sanitized['style_preset'] = '';
                    } else {
                        $style_presets = array_keys( $this->get_style_presets() );

                        if ( in_array( $candidate, $style_presets, true ) ) {
                            $sanitized['style_preset'] = $candidate;
                        }
                    }
                }
            }
        } elseif ( array_key_exists( 'style_preset', $existing_settings ) ) {
            $candidate = is_string( $existing_settings['style_preset'] ) ? sanitize_key( $existing_settings['style_preset'] ) : '';

            if ( '' !== $candidate ) {
                $sanitized['style_preset'] = $candidate;
            }
        } elseif ( array_key_exists( 'style_preset', $default_settings ) ) {
            $candidate = is_string( $default_settings['style_preset'] ) ? sanitize_key( $default_settings['style_preset'] ) : '';

            if ( '' !== $candidate ) {
                $sanitized['style_preset'] = $candidate;
            }
        }

        if ( array_key_exists( 'z_index', $raw_settings ) ) {
            $raw_value = $raw_settings['z_index'];

            if ( '' !== $raw_value && null !== $raw_value ) {
                $sanitized['z_index'] = max( 0, (int) $raw_value );
            }
        } elseif ( array_key_exists( 'z_index', $existing_settings ) ) {
            $sanitized['z_index'] = max( 0, (int) $existing_settings['z_index'] );
        } elseif ( array_key_exists( 'z_index', $default_settings ) ) {
            $sanitized['z_index'] = max( 0, (int) $default_settings['z_index'] );
        }

        return $sanitized;
    }

    private function index_contextual_presets_by_key( array $presets ): array {
        $indexed = [];

        foreach ( $presets as $preset ) {
            if ( ! is_array( $preset ) || ! isset( $preset['key'] ) ) {
                continue;
            }

            $key = sanitize_key( (string) $preset['key'] );

            if ( '' === $key ) {
                continue;
            }

            $indexed[ $key ] = $preset;
        }

        return $indexed;
    }
}
