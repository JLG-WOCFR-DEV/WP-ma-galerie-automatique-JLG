<?php
/**
 * Plugin Name:       Lightbox - JLG
 * Description:       Transforme les galeries d'images en un slideshow plein écran avec de nombreuses options de personnalisation.
 * Version:           1.8
 * Author:            Jérôme Le Gousse
 */

// Sécurité
if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! defined( 'MGA_ADMIN_TEMPLATE_PATH' ) ) {
    define( 'MGA_ADMIN_TEMPLATE_PATH', plugin_dir_path( __FILE__ ) . 'includes/admin-page-template.php' );
}

// ===== FRONT-END =====

/**
 * Charge les scripts et styles sur le site public.
 */
function mga_enqueue_assets() {
    if ( is_singular() ) {
        // Librairies (Mise à jour vers Swiper v11)
        $swiper_css = apply_filters( 'mga_swiper_css', plugin_dir_url( __FILE__ ) . 'assets/css/swiper-bundle.min.css' );
        $swiper_js  = apply_filters( 'mga_swiper_js', plugin_dir_url( __FILE__ ) . 'assets/js/swiper-bundle.min.js' );
        wp_enqueue_style( 'swiper-css', $swiper_css, [], '11.1.4' );
        wp_enqueue_script( 'swiper-js', $swiper_js, [], '11.1.4', true );

        // Fichiers du plugin
        wp_enqueue_style('mga-gallery-style', plugin_dir_url( __FILE__ ) . 'assets/css/gallery-slideshow.css', [], '1.8');
        wp_enqueue_script('mga-gallery-script', plugin_dir_url( __FILE__ ) . 'assets/js/gallery-slideshow.js', ['swiper-js'], '1.8', true);

        // Récupérer les réglages sauvegardés
        $defaults = mga_get_default_settings();
        $saved_settings = get_option('mga_settings', $defaults);
        // On s'assure que toutes les clés existent pour éviter les erreurs PHP
        $settings = wp_parse_args($saved_settings, $defaults);

        // Passer les réglages au JavaScript
        wp_localize_script('mga-gallery-script', 'mga_settings', $settings);
        
        // Générer les styles dynamiques
        $dynamic_styles = "
            :root {
                --mga-thumb-size-desktop: " . intval($settings['thumb_size']) . "px;
                --mga-thumb-size-mobile: " . intval($settings['thumb_size_mobile']) . "px;
                --mga-accent-color: " . sanitize_hex_color($settings['accent_color']) . ";
                --mga-bg-opacity: " . floatval($settings['bg_opacity']) . ";
                --mga-z-index: " . intval($settings['z_index']) . ";
            }
        ";
        wp_add_inline_style('mga-gallery-style', $dynamic_styles);
    }
}
add_action( 'wp_enqueue_scripts', 'mga_enqueue_assets' );

// ===== ADMIN =====

/**
 * Ajoute la page de réglages au menu principal de l'administration.
 */
function mga_add_admin_menu() {
    add_menu_page(
        'Lightbox - JLG',
        'Lightbox - JLG',
        'manage_options',
        'ma-galerie-automatique',
        'mga_options_page_html',
        'dashicons-format-gallery',
        26
    );
}
add_action( 'admin_menu', 'mga_add_admin_menu' );

/**
 * Enregistre les réglages.
 */
function mga_settings_init() {
    register_setting( 'mga_settings_group', 'mga_settings', 'mga_sanitize_settings' );
}
add_action( 'admin_init', 'mga_settings_init' );

/**
 * Retourne les réglages par défaut.
 */
function mga_get_default_settings() {
    return [
        'delay' => 4,
        'thumb_size' => 90,
        'thumb_size_mobile' => 70,
        'accent_color' => '#ffffff',
        'bg_opacity' => 0.95,
        'loop' => true,
        'autoplay_start' => false,
        'background_style' => 'echo',
        'z_index' => 99999,
        'debug_mode' => false,
    ];
}

/**
 * Nettoie les données envoyées.
 */
function mga_sanitize_settings( $input ) {
    $defaults = mga_get_default_settings();
    $output = [];

    $output['delay'] = isset($input['delay']) ? intval($input['delay']) : $defaults['delay'];
    $output['thumb_size'] = isset($input['thumb_size']) ? intval($input['thumb_size']) : $defaults['thumb_size'];
    $output['thumb_size_mobile'] = isset($input['thumb_size_mobile']) ? intval($input['thumb_size_mobile']) : $defaults['thumb_size_mobile'];
    $output['accent_color'] = isset($input['accent_color']) ? sanitize_hex_color($input['accent_color']) : $defaults['accent_color'];
    $output['bg_opacity'] = isset($input['bg_opacity']) ? max(min(floatval($input['bg_opacity']), 1), 0.5) : $defaults['bg_opacity'];
    $output['loop'] = isset($input['loop']);
    $output['autoplay_start'] = isset($input['autoplay_start']);
    
    $allowed_bg_styles = ['echo', 'blur', 'texture'];
    $output['background_style'] = isset($input['background_style']) && in_array($input['background_style'], $allowed_bg_styles, true) ? $input['background_style'] : $defaults['background_style'];
    
    $output['z_index'] = isset($input['z_index']) ? intval($input['z_index']) : $defaults['z_index'];
    $output['debug_mode'] = isset($input['debug_mode']);

    return $output;
}

/**
 * Charge les fichiers pour la page d'admin.
 */
function mga_admin_enqueue_assets($hook) {
    if ($hook != 'toplevel_page_ma-galerie-automatique') return;
    wp_enqueue_style('mga-admin-style', plugin_dir_url(__FILE__) . 'assets/css/admin-style.css', [], '1.4');
    wp_enqueue_script('mga-admin-script', plugin_dir_url(__FILE__) . 'assets/js/admin-script.js', [], '1.4', true);
}
add_action('admin_enqueue_scripts', 'mga_admin_enqueue_assets');


/**
 * Affiche le HTML de la page de réglages.
 */
function mga_options_page_html() {
    if ( ! current_user_can( 'manage_options' ) ) return;
    
    $settings = get_option( 'mga_settings', mga_get_default_settings() );
    
    if ( is_readable( MGA_ADMIN_TEMPLATE_PATH ) ) {
        include MGA_ADMIN_TEMPLATE_PATH;
    }
}
