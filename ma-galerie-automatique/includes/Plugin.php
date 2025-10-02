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
            'bgOpacity'        => isset( $defaults['bg_opacity'] ) ? (float) $defaults['bg_opacity'] : 0.95,
            'showThumbsMobile' => (bool) ( $defaults['show_thumbs_mobile'] ?? true ),
            'showZoom'         => (bool) ( $defaults['show_zoom'] ?? true ),
            'showDownload'     => (bool) ( $defaults['show_download'] ?? true ),
            'showShare'        => (bool) ( $defaults['show_share'] ?? true ),
            'showFullscreen'   => (bool) ( $defaults['show_fullscreen'] ?? true ),
            'enableVerticalSwipeClose' => (bool) ( $defaults['enable_vertical_swipe_close'] ?? true ),
            'enableDoubleTapClose'     => (bool) ( $defaults['enable_double_tap_close'] ?? false ),
            'enablePinchClose'         => (bool) ( $defaults['enable_pinch_close'] ?? false ),
            'noteText'         => \__( 'Lightbox active', 'lightbox-jlg' ),
        ];

        wp_localize_script( $script_handle, 'mgaBlockDefaults', $localization );

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
}
