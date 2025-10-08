<?php

namespace MaGalerieAutomatique;

use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Content\Detection;
use MaGalerieAutomatique\Frontend\Assets;
use MaGalerieAutomatique\Translation\Manager as TranslationManager;
use const FILTER_NULL_ON_FAILURE;
use const FILTER_VALIDATE_BOOLEAN;

class Plugin {
    private const DETECTION_SETTING_KEYS = [
        'tracked_post_types',
        'contentSelectors',
        'allowBodyFallback',
        'groupAttribute',
    ];
    private string $plugin_file;

    private Settings $settings;

    private Detection $detection;

    private Assets $frontend_assets;

    private ?bool $languages_directory_exists = null;

    private TranslationManager $translation_manager;

    public function __construct( string $plugin_file ) {
        $this->plugin_file = $plugin_file;
        $this->settings    = new Settings( $this );
        $this->detection   = new Detection( $this, $this->settings );
        $this->frontend_assets = new Assets( $this, $this->settings, $this->detection );
        $this->translation_manager = new TranslationManager( $this );
    }

    public function register_hooks(): void {
        add_action( 'plugins_loaded', [ $this, 'load_textdomain' ] );
        add_action( 'wp_enqueue_scripts', [ $this->frontend_assets, 'enqueue_assets' ] );
        add_action( 'enqueue_block_editor_assets', [ $this->frontend_assets, 'enqueue_block_editor_assets' ] );
        add_action( 'upgrader_process_complete', [ $this->frontend_assets, 'maybe_refresh_swiper_asset_sources' ], 10, 2 );
        add_action( 'save_post', [ $this->detection, 'refresh_post_linked_images_cache_on_save' ], 10, 2 );
        add_action( 'admin_menu', [ $this->settings, 'add_admin_menu' ] );
        add_action( 'admin_init', [ $this->settings, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ $this->settings, 'enqueue_assets' ] );
        add_action( 'init', [ $this, 'register_block' ] );
        add_action( 'update_option_mga_settings', [ $this, 'maybe_purge_detection_cache' ], 10, 3 );
        add_action( 'switch_blog', [ $this, 'handle_switch_blog' ], 10, 2 );
    }

    public function activate(): void {
        $this->frontend_assets->refresh_swiper_asset_sources( 'activation' );

        $defaults          = $this->settings->get_default_settings();
        $existing_settings = get_option( 'mga_settings', false );

        if ( false === $existing_settings ) {
            add_option( 'mga_settings', $defaults );
            return;
        }

        if ( is_array( $existing_settings ) ) {
            $merged_settings = wp_parse_args( $existing_settings, $defaults );
            update_option( 'mga_settings', $this->settings->sanitize_settings( $merged_settings, $existing_settings ) );
            return;
        }

        update_option( 'mga_settings', $defaults );
    }

    public function load_textdomain(): void {
        $this->translation_manager->load_textdomain();
    }

    public function get_plugin_file(): string {
        return $this->plugin_file;
    }

    public function get_plugin_dir_path(): string {
        return plugin_dir_path( $this->plugin_file );
    }

    public function get_plugin_dir_url(): string {
        return plugin_dir_url( $this->plugin_file );
    }

    public function get_languages_path(): string {
        return $this->get_plugin_dir_path() . 'languages';
    }

    public function languages_directory_exists(): bool {
        if ( null === $this->languages_directory_exists ) {
            $this->languages_directory_exists = is_dir( $this->get_languages_path() );
        }

        return $this->languages_directory_exists;
    }

    public function handle_switch_blog( $new_blog_id, $old_blog_id ): void {
        unset( $new_blog_id, $old_blog_id );

        $this->languages_directory_exists = null;

        if ( isset( $this->translation_manager ) ) {
            $this->translation_manager->handle_switch_blog();
        }
    }

    public function settings(): Settings {
        return $this->settings;
    }

    public function detection(): Detection {
        return $this->detection;
    }

    public function frontend_assets(): Assets {
        return $this->frontend_assets;
    }

    public function translation_manager(): TranslationManager {
        return $this->translation_manager;
    }

    public function register_block(): void {
        if ( ! function_exists( 'register_block_type' ) ) {
            return;
        }

        $script_handle = 'mga-lightbox-editor-block';
        $style_handle  = 'mga-lightbox-editor-block';

        wp_register_script(
            $script_handle,
            $this->get_plugin_dir_url() . 'assets/js/block/index.js',
            [ 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-components', 'wp-block-editor', 'wp-compose', 'wp-data' ],
            MGA_VERSION,
            true
        );

        wp_register_style(
            $style_handle,
            $this->get_plugin_dir_url() . 'assets/css/block/editor.css',
            [ 'wp-edit-blocks' ],
            MGA_VERSION
        );

        $defaults          = $this->settings->get_default_settings();
        $sanitized_settings = $this->settings->get_sanitized_settings();
        $merged_settings    = wp_parse_args( $sanitized_settings, $defaults );

        $block_defaults = $this->prepare_block_settings( $defaults );
        $block_settings = $this->prepare_block_settings( $merged_settings );

        $inline_chunks = [];

        $block_defaults_json = wp_json_encode( $block_defaults );

        if ( false !== $block_defaults_json ) {
            $inline_chunks[] = 'window.mgaBlockDefaults = window.mgaBlockDefaults || ' . $block_defaults_json . ';';
        }

        $block_settings_json = wp_json_encode( $block_settings );

        if ( false !== $block_settings_json ) {
            $inline_chunks[] = 'window.mgaBlockSettings = window.mgaBlockSettings || ' . $block_settings_json . ';';
        }

        if ( ! empty( $inline_chunks ) ) {
            wp_add_inline_script( $script_handle, implode( '', $inline_chunks ), 'before' );
        }

        if ( $this->languages_directory_exists() ) {
            wp_set_script_translations( $script_handle, 'lightbox-jlg', $this->get_languages_path() );
        }

        register_block_type(
            'ma-galerie-automatique/lightbox-preview',
            [
                'editor_script'   => $script_handle,
                'editor_style'    => $style_handle,
                'render_callback' => '__return_empty_string',
            ]
        );
    }

    public function prepare_block_settings( array $settings ): array {
        $defaults = $this->settings->get_default_settings();

        $normalize_boolean = static function ( array $source, string $key, bool $default ): bool {
            if ( array_key_exists( $key, $source ) ) {
                $filtered = filter_var( $source[ $key ], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );

                if ( null !== $filtered ) {
                    return $filtered;
                }

                return $default;
            }

            return $default;
        };

        $accent_color = null;

        if ( array_key_exists( 'accent_color', $settings ) ) {
            $accent_color = sanitize_hex_color( $settings['accent_color'] );
        }

        if ( ! $accent_color && isset( $defaults['accent_color'] ) ) {
            $accent_color = sanitize_hex_color( $defaults['accent_color'] );
        }

        if ( ! $accent_color ) {
            $accent_color = '#ffffff';
        }

        $allowed_background_styles = [ 'echo', 'blur', 'texture' ];
        $background_style          = isset( $defaults['background_style'] ) ? (string) $defaults['background_style'] : 'echo';

        if ( isset( $settings['background_style'] ) ) {
            $candidate = is_string( $settings['background_style'] ) ? strtolower( $settings['background_style'] ) : '';

            if ( in_array( $candidate, $allowed_background_styles, true ) ) {
                $background_style = $candidate;
            }
        }

        $delay = isset( $settings['delay'] ) ? (int) $settings['delay'] : (int) ( $defaults['delay'] ?? 4 );
        $delay = max( 1, min( 30, $delay ) );

        $speed = isset( $settings['speed'] ) ? (int) $settings['speed'] : (int) ( $defaults['speed'] ?? 600 );
        $speed = max( 100, min( 5000, $speed ) );

        $allowed_effects = [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ];
        $effect          = isset( $defaults['effect'] ) ? (string) $defaults['effect'] : 'slide';

        if ( isset( $settings['effect'] ) ) {
            $candidate = is_string( $settings['effect'] ) ? strtolower( $settings['effect'] ) : '';

            if ( in_array( $candidate, $allowed_effects, true ) ) {
                $effect = $candidate;
            }
        }

        $allowed_easings = [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ];
        $easing          = isset( $defaults['easing'] ) ? (string) $defaults['easing'] : 'ease-out';

        if ( isset( $settings['easing'] ) ) {
            $candidate = is_string( $settings['easing'] ) ? strtolower( $settings['easing'] ) : '';

            if ( in_array( $candidate, $allowed_easings, true ) ) {
                $easing = $candidate;
            }
        }

        $bg_opacity = isset( $settings['bg_opacity'] ) ? (float) $settings['bg_opacity'] : (float) ( $defaults['bg_opacity'] ?? 0.95 );
        $bg_opacity = max( 0, min( 1, $bg_opacity ) );

        $allowed_thumb_layouts = [ 'bottom', 'left', 'hidden' ];
        $thumbs_layout         = isset( $defaults['thumbs_layout'] ) ? (string) $defaults['thumbs_layout'] : 'bottom';

        if ( isset( $settings['thumbs_layout'] ) ) {
            $candidate = is_string( $settings['thumbs_layout'] ) ? strtolower( $settings['thumbs_layout'] ) : '';

            if ( in_array( $candidate, $allowed_thumb_layouts, true ) ) {
                $thumbs_layout = $candidate;
            }
        }

        $autoplay = $normalize_boolean( $settings, 'autoplay_start', (bool) ( $defaults['autoplay_start'] ?? false ) );
        $start_on_clicked_image = $normalize_boolean( $settings, 'start_on_clicked_image', (bool) ( $defaults['start_on_clicked_image'] ?? false ) );
        $loop = $normalize_boolean( $settings, 'loop', (bool) ( $defaults['loop'] ?? true ) );
        $show_thumbs_mobile = $normalize_boolean( $settings, 'show_thumbs_mobile', (bool) ( $defaults['show_thumbs_mobile'] ?? true ) );
        $show_zoom          = $normalize_boolean( $settings, 'show_zoom', (bool) ( $defaults['show_zoom'] ?? true ) );
        $show_download      = $normalize_boolean( $settings, 'show_download', (bool) ( $defaults['show_download'] ?? true ) );
        $show_share         = $normalize_boolean( $settings, 'show_share', (bool) ( $defaults['show_share'] ?? true ) );
        $show_cta           = $normalize_boolean( $settings, 'show_cta', (bool) ( $defaults['show_cta'] ?? true ) );
        $show_fullscreen    = $normalize_boolean( $settings, 'show_fullscreen', (bool) ( $defaults['show_fullscreen'] ?? true ) );

        return [
            'accentColor'        => $accent_color,
            'backgroundStyle'    => $background_style,
            'autoplay'           => $autoplay,
            'startOnClickedImage' => $start_on_clicked_image,
            'loop'               => $loop,
            'delay'              => $delay,
            'speed'              => $speed,
            'effect'             => $effect,
            'easing'             => $easing,
            'bgOpacity'          => $bg_opacity,
            'thumbsLayout'       => $thumbs_layout,
            'showThumbsMobile'   => $show_thumbs_mobile,
            'showZoom'           => $show_zoom,
            'showDownload'       => $show_download,
            'showShare'          => $show_share,
            'showCta'            => $show_cta,
            'showFullscreen'     => $show_fullscreen,
            'noteText'           => __( 'Lightbox active', 'lightbox-jlg' ),
        ];
    }

    public function maybe_purge_detection_cache( $old_value, $value, string $option ): void {
        unset( $option );

        $this->settings->invalidate_settings_cache();

        if ( ! is_array( $old_value ) ) {
            $old_value = [];
        }

        if ( ! is_array( $value ) ) {
            $value = [];
        }

        $old_snapshot = $this->normalize_detection_settings( $old_value );
        $new_snapshot = $this->normalize_detection_settings( $value );

        if ( $old_snapshot === $new_snapshot ) {
            return;
        }

        delete_post_meta_by_key( '_mga_has_linked_images' );
        Detection::bump_global_cache_version();
    }

    private function normalize_detection_settings( array $settings ): array {
        $normalized = [];

        foreach ( self::DETECTION_SETTING_KEYS as $key ) {
            $normalized[ $key ] = $this->normalize_detection_setting_value( $key, $settings[ $key ] ?? null );
        }

        return $normalized;
    }

    private function normalize_detection_setting_value( string $key, $value ) {
        switch ( $key ) {
            case 'tracked_post_types':
                if ( ! is_array( $value ) ) {
                    return [];
                }

                $normalized = array_map( 'sanitize_key', $value );
                $normalized = array_values( array_filter( array_unique( $normalized ) ) );
                sort( $normalized );

                return $normalized;
            case 'contentSelectors':
                if ( ! is_array( $value ) ) {
                    return [];
                }

                $normalized = array_map(
                    static function ( $selector ) {
                        if ( ! is_string( $selector ) ) {
                            return '';
                        }

                        $trimmed = trim( $selector );

                        if ( '' === $trimmed ) {
                            return '';
                        }

                        $condensed = preg_replace( '/\s+/u', ' ', $trimmed );

                        return is_string( $condensed ) ? $condensed : $trimmed;
                    },
                    $value
                );

                $normalized = array_values(
                    array_filter(
                        array_unique( $normalized ),
                        static function ( $selector ) {
                            return '' !== $selector;
                        }
                    )
                );
                sort( $normalized );

                return $normalized;
            case 'allowBodyFallback':
                return (bool) $value;
            case 'groupAttribute':
                if ( ! is_string( $value ) ) {
                    return '';
                }

                return strtolower( trim( $value ) );
            default:
                return $value;
        }
    }
}
