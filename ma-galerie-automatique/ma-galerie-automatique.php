<?php
/**
 * Plugin Name:       Lightbox - JLG
 * Description:       Transforme les galeries d'images en un slideshow plein écran avec de nombreuses options de personnalisation.
 * Version:           1.8.1
 * Author:            Jérôme Le Gousse
 * Text Domain:       lightbox-jlg
 * Domain Path:       /languages
 */

use MaGalerieAutomatique\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'MGA_VERSION' ) ) {
    define( 'MGA_VERSION', '1.8.1' );
}

if ( ! defined( 'MGA_ADMIN_TEMPLATE_PATH' ) ) {
    define( 'MGA_ADMIN_TEMPLATE_PATH', plugin_dir_path( __FILE__ ) . 'includes/admin-page-template.php' );
}

if ( ! defined( 'MGA_SWIPER_CSS_SRI_HASH' ) ) {
    define( 'MGA_SWIPER_CSS_SRI_HASH', 'sha384-PVSiG5fugGA8MJ63B59UwXZo2CdlhrZb9vyPsW2ewxr0s5WHXWgEnS+8vtFkDr7O' );
}

if ( ! defined( 'MGA_SWIPER_JS_SRI_HASH' ) ) {
    define( 'MGA_SWIPER_JS_SRI_HASH', 'sha384-ChaDfAcubhQlVCLEzy7y8vgjNLbZ4RlIjH2jjcUXjYpn0MwZieWBjpXFMjMx8Dax' );
}

require_once __DIR__ . '/includes/autoload.php';

global $ma_galerie_automatique_plugin;

$ma_galerie_automatique_plugin = new Plugin( __FILE__ );
$ma_galerie_automatique_plugin->register_hooks();

register_activation_hook( __FILE__, [ $ma_galerie_automatique_plugin, 'activate' ] );

function mga_plugin(): ?Plugin {
    global $ma_galerie_automatique_plugin;

    return $ma_galerie_automatique_plugin instanceof Plugin ? $ma_galerie_automatique_plugin : null;
}

function mga_get_languages_path(): string {
    $plugin = mga_plugin();

    return $plugin ? $plugin->get_languages_path() : plugin_dir_path( __FILE__ ) . 'languages';
}

function mga_languages_directory_exists(): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->languages_directory_exists() : is_dir( mga_get_languages_path() );
}

function mga_load_textdomain(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->load_textdomain();
    }
}

function mga_activate(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->activate();
    }
}

function mga_refresh_swiper_asset_sources(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->frontend_assets()->refresh_swiper_asset_sources() : [];
}

function mga_get_swiper_asset_sources(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->frontend_assets()->get_swiper_asset_sources() : [];
}

function mga_maybe_refresh_swiper_asset_sources( $upgrader, $options ): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->frontend_assets()->maybe_refresh_swiper_asset_sources( $upgrader, $options );
    }
}

function mga_enqueue_assets(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->frontend_assets()->enqueue_assets();
    }
}

function mga_should_enqueue_assets( $post ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->should_enqueue_assets( $post ) : false;
}

function mga_get_cached_post_linked_images( \WP_Post $post ): ?bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->get_cached_post_linked_images( $post ) : null;
}

function mga_update_post_linked_images_cache( $post_id, $has_linked_images ): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->detection()->update_post_linked_images_cache( (int) $post_id, (bool) $has_linked_images );
    }
}

function mga_parse_blocks_from_content( $content ): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->parse_blocks_from_content( (string) $content ) : [];
}

function mga_post_contains_reusable_block( \WP_Post $post ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->post_contains_reusable_block( $post ) : false;
}

function mga_blocks_include_reusable_block( array $blocks ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->blocks_include_reusable_block( $blocks ) : false;
}

function mga_detect_post_linked_images( \WP_Post $post ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->detect_post_linked_images( $post ) : false;
}

function mga_refresh_post_linked_images_cache_on_save( $post_id, $post ): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->detection()->refresh_post_linked_images_cache_on_save( $post_id, $post );
    }
}

function mga_blocks_contain_linked_media( array $blocks, array $allowed_block_names, &$visited_block_ids = null ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->blocks_contain_linked_media( $blocks, $allowed_block_names, $visited_block_ids ) : false;
}

function mga_block_attributes_link_to_media( array $attrs ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->block_attributes_link_to_media( $attrs ) : false;
}

function mga_is_image_url( $url ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->is_image_url( $url ) : false;
}

function mga_gallery_attributes_link_to_media( array $attributes ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->gallery_attributes_link_to_media( $attributes ) : false;
}

function mga_gallery_html_has_linked_media( $html ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->gallery_html_has_linked_media( $html ) : false;
}

function mga_post_has_eligible_images( $post = null ): bool {
    $plugin = mga_plugin();

    return $plugin ? $plugin->detection()->post_has_eligible_images( $post ) : false;
}

function mga_add_admin_menu(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->settings()->add_admin_menu();
    }
}

function mga_settings_init(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->settings()->register_settings();
    }
}

function mga_get_default_settings(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->settings()->get_default_settings() : [];
}

function mga_get_share_channel_catalog(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->settings()->get_share_channel_catalog() : [];
}

function mga_get_share_icon_choices(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->settings()->get_share_icon_choices() : [];
}

function mga_get_style_presets(): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->settings()->get_style_presets() : [];
}

function mga_sanitize_settings( $input, $existing_settings = null ): array {
    $plugin = mga_plugin();

    return $plugin ? $plugin->settings()->sanitize_settings( $input, $existing_settings ) : [];
}

function mga_admin_enqueue_assets( $hook ): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->settings()->enqueue_assets( $hook );
    }
}

function mga_options_page_html(): void {
    $plugin = mga_plugin();

    if ( $plugin ) {
        $plugin->settings()->render_options_page();
    }
}
