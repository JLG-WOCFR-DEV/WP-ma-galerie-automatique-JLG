<?php

namespace MaGalerieAutomatique;

use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Content\Detection;
use MaGalerieAutomatique\Frontend\Assets;

class Plugin {
    private string $plugin_file;

    private Settings $settings;

    private Detection $detection;

    private Assets $frontend_assets;

    private ?bool $languages_directory_exists = null;

    public function __construct( string $plugin_file ) {
        $this->plugin_file = $plugin_file;
        $this->settings    = new Settings( $this );
        $this->detection   = new Detection( $this, $this->settings );
        $this->frontend_assets = new Assets( $this, $this->settings, $this->detection );
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
    }

    public function activate(): void {
        $this->frontend_assets->refresh_swiper_asset_sources();

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
        $domain        = 'lightbox-jlg';
        $relative_path = $this->languages_directory_exists()
            ? dirname( plugin_basename( $this->plugin_file ) ) . '/languages'
            : false;

        if ( load_plugin_textdomain( $domain, false, $relative_path ) ) {
            return;
        }

        $base64_path = trailingslashit( $this->get_languages_path() ) . 'lightbox-jlg-fr_FR.mo.b64';

        if ( ! file_exists( $base64_path ) ) {
            return;
        }

        $encoded_contents = file_get_contents( $base64_path );

        if ( false === $encoded_contents ) {
            return;
        }

        $decoded_contents = base64_decode( $encoded_contents, true );

        if ( false === $decoded_contents ) {
            return;
        }

        if ( ! function_exists( 'wp_tempnam' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $temp_mofile = wp_tempnam( 'lightbox-jlg-fr_FR.mo' );

        if ( ! $temp_mofile ) {
            return;
        }

        $bytes_written = file_put_contents( $temp_mofile, $decoded_contents );

        if ( false === $bytes_written ) {
            if ( file_exists( $temp_mofile ) ) {
                unlink( $temp_mofile );
            }

            return;
        }

        load_textdomain( $domain, $temp_mofile );

        if ( file_exists( $temp_mofile ) ) {
            unlink( $temp_mofile );
        }
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

    public function settings(): Settings {
        return $this->settings;
    }

    public function detection(): Detection {
        return $this->detection;
    }

    public function frontend_assets(): Assets {
        return $this->frontend_assets;
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

        $defaults = $this->settings->get_default_settings();

        $localization = [
            'accentColor'      => $defaults['accent_color'] ?? '#ffffff',
            'backgroundStyle'  => $defaults['background_style'] ?? 'echo',
            'autoplay'         => (bool) ( $defaults['autoplay_start'] ?? false ),
            'loop'             => (bool) ( $defaults['loop'] ?? true ),
            'delay'            => (int) ( $defaults['delay'] ?? 4 ),
            'speed'            => (int) ( $defaults['speed'] ?? 600 ),
            'effect'           => $defaults['effect'] ?? 'slide',
            'easing'           => $defaults['easing'] ?? 'ease-out',
            'bgOpacity'        => isset( $defaults['bg_opacity'] ) ? (float) $defaults['bg_opacity'] : 0.95,
            'showThumbsMobile' => (bool) ( $defaults['show_thumbs_mobile'] ?? true ),
            'showZoom'         => (bool) ( $defaults['show_zoom'] ?? true ),
            'showDownload'     => (bool) ( $defaults['show_download'] ?? true ),
            'showShare'        => (bool) ( $defaults['show_share'] ?? true ),
            'showFullscreen'   => (bool) ( $defaults['show_fullscreen'] ?? true ),
            'noteText'         => \__( 'Lightbox active', 'lightbox-jlg' ),
        ];

        wp_localize_script( $script_handle, 'mgaBlockDefaults', $localization );

        if ( $this->languages_directory_exists() ) {
            wp_set_script_translations( $script_handle, 'lightbox-jlg', $this->get_languages_path() );
        }

        $block_attributes = [
            'autoplay'       => [ 'type' => 'boolean', 'default' => $localization['autoplay'] ?? false ],
            'loop'           => [ 'type' => 'boolean', 'default' => $localization['loop'] ?? true ],
            'delay'          => [ 'type' => 'number', 'default' => $localization['delay'] ?? 4 ],
            'speed'          => [ 'type' => 'number', 'default' => $localization['speed'] ?? 600 ],
            'effect'         => [ 'type' => 'string', 'default' => $localization['effect'] ?? 'slide' ],
            'easing'         => [ 'type' => 'string', 'default' => $localization['easing'] ?? 'ease-out' ],
            'backgroundStyle'=> [ 'type' => 'string', 'default' => $localization['backgroundStyle'] ?? 'echo' ],
            'accentColor'    => [ 'type' => 'string', 'default' => $localization['accentColor'] ?? '#ffffff' ],
            'bgOpacity'      => [ 'type' => 'number', 'default' => $localization['bgOpacity'] ?? 0.95 ],
            'showThumbsMobile' => [ 'type' => 'boolean', 'default' => $localization['showThumbsMobile'] ?? true ],
            'showZoom'       => [ 'type' => 'boolean', 'default' => $localization['showZoom'] ?? true ],
            'showDownload'   => [ 'type' => 'boolean', 'default' => $localization['showDownload'] ?? true ],
            'showShare'      => [ 'type' => 'boolean', 'default' => $localization['showShare'] ?? true ],
            'showFullscreen' => [ 'type' => 'boolean', 'default' => $localization['showFullscreen'] ?? true ],
        ];

        register_block_type(
            'ma-galerie-automatique/lightbox-preview',
            [
                'editor_script'   => $script_handle,
                'editor_style'    => $style_handle,
                'attributes'      => $block_attributes,
                'render_callback' => [ $this, 'render_lightbox_preview_block' ],
            ]
        );
    }

    private function normalize_block_boolean( $value, bool $fallback ): bool {
        if ( is_bool( $value ) ) {
            return $value;
        }

        if ( is_numeric( $value ) ) {
            return (bool) $value;
        }

        if ( is_string( $value ) ) {
            $normalized = strtolower( trim( $value ) );

            if ( in_array( $normalized, [ 'true', '1', 'yes', 'on' ], true ) ) {
                return true;
            }

            if ( in_array( $normalized, [ 'false', '0', 'no', 'off' ], true ) ) {
                return false;
            }
        }

        return $fallback;
    }

    private function normalize_block_int( $value, int $fallback, int $min, int $max ): int {
        if ( is_numeric( $value ) ) {
            $value = (int) $value;
        } else {
            $value = $fallback;
        }

        if ( $value < $min ) {
            return $min;
        }

        if ( $value > $max ) {
            return $max;
        }

        return $value;
    }

    private function normalize_block_float( $value, float $fallback, float $min, float $max ): float {
        if ( is_numeric( $value ) ) {
            $value = (float) $value;
        } else {
            $value = $fallback;
        }

        if ( $value < $min ) {
            return $min;
        }

        if ( $value > $max ) {
            return $max;
        }

        return $value;
    }

    private function normalize_block_choice( $value, array $allowed, string $fallback ): string {
        if ( is_string( $value ) ) {
            $normalized = strtolower( trim( $value ) );
            if ( in_array( $normalized, $allowed, true ) ) {
                return $normalized;
            }
        }

        return $fallback;
    }

    private function normalize_block_color( ?string $value, string $fallback ): string {
        $color = sanitize_hex_color( $value );

        if ( ! $color ) {
            $color = sanitize_hex_color( $fallback ) ?: '#ffffff';
        }

        return $color ?: '#ffffff';
    }

    private function build_preview_block_options( array $attributes ): array {
        $defaults = $this->settings->get_default_settings();

        $delay_default = isset( $defaults['delay'] ) ? (int) $defaults['delay'] : 4;
        $speed_default = isset( $defaults['speed'] ) ? (int) $defaults['speed'] : 600;
        $bg_default    = isset( $defaults['bg_opacity'] ) ? (float) $defaults['bg_opacity'] : 0.95;
        $effect_default = isset( $defaults['effect'] ) ? strtolower( (string) $defaults['effect'] ) : 'slide';
        $easing_default = isset( $defaults['easing'] ) ? strtolower( (string) $defaults['easing'] ) : 'ease-out';
        $background_default = isset( $defaults['background_style'] ) ? strtolower( (string) $defaults['background_style'] ) : 'echo';
        $accent_default = isset( $defaults['accent_color'] ) ? (string) $defaults['accent_color'] : '#ffffff';

        $allowed_effects = [ 'slide', 'fade', 'cube', 'coverflow', 'flip' ];
        $allowed_easings = [ 'ease-out', 'ease-in-out', 'ease-in', 'ease', 'linear' ];
        $allowed_backgrounds = [ 'echo', 'texture', 'blur' ];

        $options = [
            'autoplay_start'   => $this->normalize_block_boolean( $attributes['autoplay'] ?? null, ! empty( $defaults['autoplay_start'] ) ),
            'loop'             => $this->normalize_block_boolean( $attributes['loop'] ?? null, ! empty( $defaults['loop'] ) ),
            'delay'            => $this->normalize_block_int( $attributes['delay'] ?? null, $delay_default, 1, 30 ),
            'speed'            => $this->normalize_block_int( $attributes['speed'] ?? null, $speed_default, 100, 5000 ),
            'effect'           => $this->normalize_block_choice( $attributes['effect'] ?? null, $allowed_effects, $effect_default ),
            'easing'           => $this->normalize_block_choice( $attributes['easing'] ?? null, $allowed_easings, $easing_default ),
            'background_style' => $this->normalize_block_choice( $attributes['backgroundStyle'] ?? null, $allowed_backgrounds, $background_default ),
            'accent_color'     => $this->normalize_block_color( $attributes['accentColor'] ?? null, $accent_default ),
            'bg_opacity'       => $this->normalize_block_float( $attributes['bgOpacity'] ?? null, $bg_default, 0.5, 1 ),
            'show_thumbs_mobile' => $this->normalize_block_boolean( $attributes['showThumbsMobile'] ?? null, ! empty( $defaults['show_thumbs_mobile'] ) ),
            'show_zoom'        => $this->normalize_block_boolean( $attributes['showZoom'] ?? null, ! empty( $defaults['show_zoom'] ) ),
            'show_download'    => $this->normalize_block_boolean( $attributes['showDownload'] ?? null, ! empty( $defaults['show_download'] ) ),
            'show_share'       => $this->normalize_block_boolean( $attributes['showShare'] ?? null, ! empty( $defaults['show_share'] ) ),
            'show_fullscreen'  => $this->normalize_block_boolean( $attributes['showFullscreen'] ?? null, ! empty( $defaults['show_fullscreen'] ) ),
        ];

        return $options;
    }

    public function render_lightbox_preview_block( array $attributes, string $content, $block = null ): string {
        $options = $this->build_preview_block_options( $attributes );
        $json    = wp_json_encode( $options );

        if ( false === $json ) {
            return '';
        }

        $wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
            ? get_block_wrapper_attributes(
                [
                    'class'            => 'mga-lightbox-config',
                    'data-mga-options' => $json,
                    'aria-hidden'      => 'true',
                    'style'            => 'display:none',
                ]
            )
            : sprintf(
                'class="mga-lightbox-config" data-mga-options="%s" aria-hidden="true" style="display:none"',
                esc_attr( $json )
            );

        return sprintf( '<div %s></div>', $wrapper_attributes );
    }
}
