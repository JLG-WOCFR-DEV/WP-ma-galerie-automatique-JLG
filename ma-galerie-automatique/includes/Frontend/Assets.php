<?php

namespace MaGalerieAutomatique\Frontend;

use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Content\Detection;
use MaGalerieAutomatique\Plugin;
use WP_Post;
use function __;

class Assets {
    private Plugin $plugin;

    private Settings $settings;

    private Detection $detection;

    public function __construct( Plugin $plugin, Settings $settings, Detection $detection ) {
        $this->plugin    = $plugin;
        $this->settings  = $settings;
        $this->detection = $detection;
    }

    public function enqueue_assets(): void {
        $post = get_post();

        if ( ! $this->detection->should_enqueue_assets( $post ) ) {
            return;
        }

        $settings        = $this->settings->get_sanitized_settings();
        $defaults        = $this->settings->get_default_settings();
        $languages_path  = $this->plugin->get_languages_path();
        $has_languages   = $this->plugin->languages_directory_exists();
        $swiper_version  = '11.1.4';
        $local_css_url   = $this->plugin->get_plugin_dir_url() . 'assets/vendor/swiper/swiper-bundle.min.css';
        $local_js_url    = $this->plugin->get_plugin_dir_url() . 'assets/vendor/swiper/swiper-bundle.min.js';
        $local_css_path  = $this->plugin->get_plugin_dir_path() . 'assets/vendor/swiper/swiper-bundle.min.css';
        $local_js_path   = $this->plugin->get_plugin_dir_path() . 'assets/vendor/swiper/swiper-bundle.min.js';
        $cdn_swiper_css  = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.css';
        $cdn_swiper_js   = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.js';
        $asset_sources   = $this->get_swiper_asset_sources();
        $should_refresh_sources = false;

        if ( 'local' === $asset_sources['css'] && ! file_exists( $local_css_path ) ) {
            $asset_sources['css'] = 'cdn';
            $should_refresh_sources = true;
        }

        if ( 'local' === $asset_sources['js'] && ! file_exists( $local_js_path ) ) {
            $asset_sources['js'] = 'cdn';
            $should_refresh_sources = true;
        }

        if ( $should_refresh_sources ) {
            $asset_sources = $this->refresh_swiper_asset_sources( 'missing_local_assets' );
        }

        $swiper_css = 'local' === $asset_sources['css'] ? $local_css_url : $cdn_swiper_css;
        $swiper_css = apply_filters( 'mga_swiper_css', $swiper_css, $swiper_version );

        $swiper_js = 'local' === $asset_sources['js'] ? $local_js_url : $cdn_swiper_js;
        $swiper_js = apply_filters( 'mga_swiper_js', $swiper_js, $swiper_version );

        wp_enqueue_style( 'mga-swiper-css', $swiper_css, [], $swiper_version );

        $css_sri_attributes = [];

        if ( 'cdn' === $asset_sources['css'] && $swiper_css === $cdn_swiper_css ) {
            $css_sri_attributes = [
                'integrity'  => MGA_SWIPER_CSS_SRI_HASH,
                'crossorigin' => 'anonymous',
            ];
        }

        $css_sri_attributes = apply_filters( 'mga_swiper_css_sri_attributes', $css_sri_attributes, $swiper_css, $asset_sources );

        foreach ( $css_sri_attributes as $attribute => $value ) {
            if ( '' === $attribute || null === $attribute ) {
                continue;
            }

            if ( null === $value || '' === $value ) {
                continue;
            }

            wp_style_add_data( 'mga-swiper-css', $attribute, $value );
        }

        wp_enqueue_script( 'mga-swiper-js', $swiper_js, [], $swiper_version, true );

        $js_sri_attributes = [];

        if ( 'cdn' === $asset_sources['js'] && $swiper_js === $cdn_swiper_js ) {
            $js_sri_attributes = [
                'integrity'  => MGA_SWIPER_JS_SRI_HASH,
                'crossorigin' => 'anonymous',
            ];
        }

        $js_sri_attributes = apply_filters( 'mga_swiper_js_sri_attributes', $js_sri_attributes, $swiper_js, $asset_sources );

        foreach ( $js_sri_attributes as $attribute => $value ) {
            if ( '' === $attribute || null === $attribute ) {
                continue;
            }

            if ( null === $value || '' === $value ) {
                continue;
            }

            wp_script_add_data( 'mga-swiper-js', $attribute, $value );
        }

        $loader_attempts = [
            [
                'key'    => 'cdn',
                'label'  => __( 'CDN jsDelivr', 'lightbox-jlg' ),
                'inject' => 'local' === $asset_sources['js'],
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
        ];

        $loader_config = [
            'version'  => $swiper_version,
            'attempts' => $loader_attempts,
        ];

        $loader_config_json = wp_json_encode( $loader_config );

        if ( false !== $loader_config_json ) {
            $loader_inline = 'window.mgaSwiperMetrics = window.mgaSwiperMetrics || { events: [] };';
            $loader_inline .= 'window.mgaSwiperLoaderConfig = ' . $loader_config_json . ';';
            wp_add_inline_script( 'mga-swiper-js', $loader_inline, 'before' );
        }

        wp_enqueue_style( 'mga-gallery-style', $this->plugin->get_plugin_dir_url() . 'assets/css/gallery-slideshow.css', [], MGA_VERSION );

        $script_dependencies = [ 'mga-swiper-js', 'wp-i18n' ];

        if ( ! empty( $settings['debug_mode'] ) ) {
            $can_view_debug = apply_filters( 'mga_user_can_view_debug', is_user_logged_in() && current_user_can( 'manage_options' ) );

            if ( $can_view_debug ) {
                wp_register_script(
                    'mga-debug-script',
                    $this->plugin->get_plugin_dir_url() . 'assets/js/dist/debug.js',
                    [ 'wp-i18n' ],
                    MGA_VERSION,
                    true
                );
                wp_enqueue_script( 'mga-debug-script' );

                if ( $has_languages ) {
                    wp_set_script_translations( 'mga-debug-script', 'lightbox-jlg', $languages_path );
                }

                $script_dependencies[] = 'mga-debug-script';
            }
        }

        wp_enqueue_script(
            'mga-gallery-script',
            $this->plugin->get_plugin_dir_url() . 'assets/js/dist/gallery-slideshow.js',
            $script_dependencies,
            MGA_VERSION,
            true
        );

        if ( $has_languages ) {
            wp_set_script_translations( 'mga-gallery-script', 'lightbox-jlg', $languages_path );
        }

        $settings_json = wp_json_encode( $settings );

        if ( false !== $settings_json ) {
            wp_add_inline_script(
                'mga-gallery-script',
                'window.mga_settings = ' . $settings_json . ";\nwindow.mgaSettings = window.mga_settings;",
                'before'
            );
        }

        $style_rules = $this->build_dynamic_style_rules( $settings, $defaults );

        /**
         * Filters the dynamic CSS rules injected for the public gallery stylesheet.
         *
         * The filter expects an associative array where each key is a selector and each
         * value is an associative array of property/value pairs. For example:
         *
         * ```php
         * return [
         *     ':root' => [
         *         '--mga-thumb-size-desktop' => '96px',
         *     ],
         * ];
         * ```
         *
         * @since 1.8.1 Allows third-parties to adjust the injected CSS variables.
         *
         * @param array $style_rules Prepared CSS rules keyed by selector.
         * @param array $settings    Sanitized plugin settings.
         * @param array $defaults    Default plugin settings.
         */
        $style_rules = apply_filters( 'mga_dynamic_style_rules', $style_rules, $settings, $defaults );

        $css_chunks = [];

        foreach ( $style_rules as $selector => $declarations ) {
            if ( ! is_string( $selector ) ) {
                continue;
            }

            $selector = trim( $selector );

            if ( '' === $selector || ! is_array( $declarations ) || empty( $declarations ) ) {
                continue;
            }

            $sanitized_declarations = [];

            foreach ( $declarations as $property => $value ) {
                if ( ! is_string( $property ) ) {
                    continue;
                }

                $property = strtolower( trim( $property ) );

                if ( '' === $property ) {
                    continue;
                }

                $property = preg_replace( '/[^a-z0-9\-_]/i', '', $property );

                if ( ! $property ) {
                    continue;
                }

                if ( is_bool( $value ) || null === $value ) {
                    continue;
                }

                if ( is_numeric( $value ) ) {
                    $value = (string) $value;
                } elseif ( is_string( $value ) ) {
                    $value = trim( $value );
                } else {
                    continue;
                }

                if ( '' === $value ) {
                    continue;
                }

                $sanitized_declarations[] = sprintf( '%s:%s', $property, wp_strip_all_tags( $value ) );
            }

            if ( empty( $sanitized_declarations ) ) {
                continue;
            }

            $css_chunks[] = sprintf( '%s{%s}', $selector, implode( ';', $sanitized_declarations ) );
        }

        if ( ! empty( $css_chunks ) ) {
            wp_add_inline_style( 'mga-gallery-style', implode( '', $css_chunks ) );
        }
    }

    private function build_dynamic_style_rules( array $settings, array $defaults ): array {
        $thumb_size_desktop = isset( $settings['thumb_size'] ) ? absint( $settings['thumb_size'] ) : 0;
        $thumb_size_mobile  = isset( $settings['thumb_size_mobile'] ) ? absint( $settings['thumb_size_mobile'] ) : 0;
        $z_index            = isset( $settings['z_index'] ) ? intval( $settings['z_index'] ) : null;

        if ( $thumb_size_desktop <= 0 && isset( $defaults['thumb_size'] ) ) {
            $thumb_size_desktop = absint( $defaults['thumb_size'] );
        }

        if ( $thumb_size_mobile <= 0 && isset( $defaults['thumb_size_mobile'] ) ) {
            $thumb_size_mobile = absint( $defaults['thumb_size_mobile'] );
        }

        if ( null === $z_index && isset( $defaults['z_index'] ) ) {
            $z_index = intval( $defaults['z_index'] );
        }

        if ( null === $z_index ) {
            $z_index = 99999;
        }

        $accent_color = isset( $settings['accent_color'] ) ? sanitize_hex_color( $settings['accent_color'] ) : null;

        if ( ! $accent_color ) {
            $accent_color = isset( $defaults['accent_color'] ) ? sanitize_hex_color( $defaults['accent_color'] ) : null;
        }

        if ( ! $accent_color ) {
            $accent_color = '#ffffff';
        }

        $bg_opacity = isset( $settings['bg_opacity'] ) ? floatval( $settings['bg_opacity'] ) : null;

        if ( null === $bg_opacity && isset( $defaults['bg_opacity'] ) ) {
            $bg_opacity = floatval( $defaults['bg_opacity'] );
        }

        if ( null === $bg_opacity ) {
            $bg_opacity = 0.95;
        }

        $bg_opacity = max( 0, min( 1, $bg_opacity ) );

        return [
            ':root' => [
                '--mga-thumb-size-desktop' => $thumb_size_desktop . 'px',
                '--mga-thumb-size-mobile'  => $thumb_size_mobile . 'px',
                '--mga-accent-color'       => $accent_color,
                '--mga-bg-opacity'         => rtrim( rtrim( sprintf( '%.4F', $bg_opacity ), '0' ), '.' ),
                '--mga-z-index'            => (string) $z_index,
            ],
        ];
    }

    public function enqueue_block_editor_assets(): void {
        $style_handle  = 'mga-block-editor-preview';
        $script_handle = 'mga-block-editor-preview';

        wp_enqueue_style(
            $style_handle,
            $this->plugin->get_plugin_dir_url() . 'assets/css/block-editor-preview.css',
            [],
            MGA_VERSION
        );

        $settings = $this->settings->get_sanitized_settings();
        $defaults = $this->settings->get_default_settings();

        $accent_color = isset( $settings['accent_color'] ) ? sanitize_hex_color( $settings['accent_color'] ) : '';

        if ( ! $accent_color && isset( $defaults['accent_color'] ) ) {
            $accent_color = sanitize_hex_color( $defaults['accent_color'] );
        }

        if ( ! $accent_color ) {
            $accent_color = '#c9356b';
        }

        $bg_opacity = isset( $settings['bg_opacity'] ) ? floatval( $settings['bg_opacity'] ) : ( $defaults['bg_opacity'] ?? 0.95 );
        $bg_opacity = max( 0, min( 1, (float) $bg_opacity ) );

        $inline_styles = sprintf(
            ':root{--mga-accent-color:%1$s;--mga-bg-opacity:%2$s;--mga-editor-note-bg:rgba(10,10,10,%2$s);}',
            esc_html( $accent_color ),
            esc_html( (string) $bg_opacity )
        );

        wp_add_inline_style( $style_handle, $inline_styles );

        $default_block_names = [ 'core/gallery', 'core/image', 'core/media-text', 'core/cover' ];
        $linked_block_names  = apply_filters( 'mga_linked_image_blocks', $default_block_names );

        if ( ! is_array( $linked_block_names ) ) {
            $linked_block_names = $default_block_names;
        }

        $linked_block_names = array_values( array_unique( array_filter( array_map( 'strval', $linked_block_names ) ) ) );

        $allowed_block_names = apply_filters( 'mga_allowed_media_blocks', $linked_block_names, null );

        if ( ! is_array( $allowed_block_names ) || empty( $allowed_block_names ) ) {
            $allowed_block_names = $linked_block_names;
        }

        $allowed_block_names = array_values( array_unique( array_filter( array_map( 'strval', $allowed_block_names ) ) ) );

        wp_register_script(
            $script_handle,
            $this->plugin->get_plugin_dir_url() . 'assets/js/block-editor-preview.js',
            [ 'wp-element', 'wp-data', 'wp-i18n', 'wp-hooks', 'wp-compose', 'wp-block-editor' ],
            MGA_VERSION,
            true
        );

        $merged_settings = wp_parse_args( $settings, $defaults );
        $block_settings  = $this->plugin->prepare_block_settings( $merged_settings );

        $block_settings_json = wp_json_encode( $block_settings );

        if ( false !== $block_settings_json ) {
            $inline_settings = sprintf(
                '( function() {' .
                ' var defaults = ( window.mgaBlockDefaults && typeof window.mgaBlockDefaults === "object" ) ? window.mgaBlockDefaults : {};' .
                ' var overrides = %1$s;' .
                ' var merged = {};' .
                ' var key;' .
                ' for ( key in defaults ) { if ( Object.prototype.hasOwnProperty.call( defaults, key ) ) { merged[ key ] = defaults[ key ]; } }' .
                ' for ( key in overrides ) { if ( Object.prototype.hasOwnProperty.call( overrides, key ) ) { merged[ key ] = overrides[ key ]; } }' .
                ' window.mgaBlockSettings = merged;' .
                '} )();',
                $block_settings_json
            );

            wp_add_inline_script( 'mga-lightbox-editor-block', $inline_settings, 'before' );
        }

        $localization = [
            'noteText'        => \__( 'Lightbox active', 'lightbox-jlg' ),
            'supportedBlocks' => $allowed_block_names,
            'previewBlockName' => 'ma-galerie-automatique/lightbox-preview',
        ];

        wp_localize_script( $script_handle, 'mgaBlockEditorPreview', $localization );

        if ( $this->plugin->languages_directory_exists() ) {
            wp_set_script_translations( $script_handle, 'lightbox-jlg', $this->plugin->get_languages_path() );
        }

        wp_enqueue_script( $script_handle );
    }

    public function refresh_swiper_asset_sources( string $context = 'manual' ): array {
        $local_swiper_css_path = $this->plugin->get_plugin_dir_path() . 'assets/vendor/swiper/swiper-bundle.min.css';
        $local_swiper_js_path  = $this->plugin->get_plugin_dir_path() . 'assets/vendor/swiper/swiper-bundle.min.js';

        $sources = [
            'css'        => file_exists( $local_swiper_css_path ) ? 'local' : 'cdn',
            'js'         => file_exists( $local_swiper_js_path ) ? 'local' : 'cdn',
            'checked_at' => time(),
        ];

        $existing_sources = get_option( 'mga_swiper_asset_sources', false );

        if ( false === $existing_sources ) {
            add_option( 'mga_swiper_asset_sources', $sources, '', 'no' );
        } else {
            update_option( 'mga_swiper_asset_sources', $sources );
        }

        do_action(
            'mga_swiper_asset_sources_refreshed',
            $sources,
            $context,
            is_array( $existing_sources ) ? $existing_sources : []
        );

        return $sources;
    }

    public function get_swiper_asset_sources(): array {
        $sources = get_option( 'mga_swiper_asset_sources' );

        if ( ! defined( 'MGA_SWIPER_SOURCES_TTL' ) ) {
            define( 'MGA_SWIPER_SOURCES_TTL', HOUR_IN_SECONDS * 12 );
        }

        $ttl = apply_filters( 'mga_swiper_sources_ttl', MGA_SWIPER_SOURCES_TTL, $sources );

        $needs_refresh = true;

        if ( is_array( $sources ) && isset( $sources['css'], $sources['js'] ) ) {
            $checked_at = isset( $sources['checked_at'] ) ? absint( $sources['checked_at'] ) : 0;
            $is_fresh   = $checked_at && ( time() - $checked_at ) < absint( $ttl );

            if ( $is_fresh ) {
                $needs_refresh = false;
            }
        }

        if ( $needs_refresh ) {
            $sources = $this->refresh_swiper_asset_sources( 'stale_cache' );
        }

        return $sources;
    }

    public function maybe_refresh_swiper_asset_sources( $upgrader, $options ): void {
        if ( empty( $options['type'] ) || 'plugin' !== $options['type'] ) {
            return;
        }

        if ( empty( $options['plugins'] ) || ! is_array( $options['plugins'] ) ) {
            return;
        }

        $plugin_basename = plugin_basename( $this->plugin->get_plugin_file() );

        if ( in_array( $plugin_basename, $options['plugins'], true ) ) {
            $this->refresh_swiper_asset_sources( 'plugin_upgrade' );
        }
    }
}
