<?php
/**
 * Plugin Name:       Lightbox - JLG
 * Description:       Transforme les galeries d'images en un slideshow plein écran avec de nombreuses options de personnalisation.
 * Version:           1.8
 * Author:            Jérôme Le Gousse
 * Text Domain:       lightbox-jlg
 * Domain Path:       /languages
 */

// Sécurité
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Retourne le chemin absolu du dossier de traduction.
 *
 * @return string
 */
function mga_get_languages_path() {
    return plugin_dir_path( __FILE__ ) . 'languages';
}

/**
 * Indique si le dossier de traduction existe réellement.
 *
 * @return bool
 */
function mga_languages_directory_exists() {
    static $languages_exists = null;

    if ( null === $languages_exists ) {
        $languages_exists = is_dir( mga_get_languages_path() );
    }

    return $languages_exists;
}

if ( ! defined( 'MGA_VERSION' ) ) {
    define( 'MGA_VERSION', '1.8' );
}

if ( ! defined( 'MGA_ADMIN_TEMPLATE_PATH' ) ) {
    define( 'MGA_ADMIN_TEMPLATE_PATH', plugin_dir_path( __FILE__ ) . 'includes/admin-page-template.php' );
}

/**
 * Initialise la traduction du plugin.
 */
function mga_load_textdomain() {
    if ( ! mga_languages_directory_exists() ) {
        return;
    }

    load_plugin_textdomain( 'lightbox-jlg', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}

add_action( 'plugins_loaded', 'mga_load_textdomain' );

/**
 * Initialise les réglages lors de l'activation du plugin.
 */
function mga_activate() {
    mga_refresh_swiper_asset_sources();

    $defaults = mga_get_default_settings();
    $existing_settings = get_option( 'mga_settings', false );

    if ( false === $existing_settings ) {
        add_option( 'mga_settings', $defaults );
        return;
    }

    if ( is_array( $existing_settings ) ) {
        $merged_settings = wp_parse_args( $existing_settings, $defaults );
        update_option( 'mga_settings', mga_sanitize_settings( $merged_settings, $existing_settings ) );
        return;
    }

    update_option( 'mga_settings', $defaults );
}

register_activation_hook( __FILE__, 'mga_activate' );

/**
 * Détecte la disponibilité des assets Swiper locaux et mémorise le résultat.
 *
 * @return array{css:string,js:string}
 */
function mga_refresh_swiper_asset_sources() {
    $local_swiper_css_path = plugin_dir_path( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.css';
    $local_swiper_js_path  = plugin_dir_path( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.js';

    $sources = [
        'css' => file_exists( $local_swiper_css_path ) ? 'local' : 'cdn',
        'js'  => file_exists( $local_swiper_js_path ) ? 'local' : 'cdn',
    ];

    update_option( 'mga_swiper_asset_sources', $sources );

    return $sources;
}

/**
 * Retourne la source mémorisée des assets Swiper.
 *
 * @return array{css:string,js:string}
 */
function mga_get_swiper_asset_sources() {
    $sources = get_option( 'mga_swiper_asset_sources' );

    if ( ! is_array( $sources ) || ! isset( $sources['css'], $sources['js'] ) ) {
        $sources = mga_refresh_swiper_asset_sources();
    }

    return $sources;
}

/**
 * Réévalue la présence des assets locaux après une mise à jour du plugin.
 */
function mga_maybe_refresh_swiper_asset_sources( $upgrader, $options ) {
    if ( empty( $options['type'] ) || 'plugin' !== $options['type'] ) {
        return;
    }

    if ( empty( $options['plugins'] ) || ! is_array( $options['plugins'] ) ) {
        return;
    }

    $plugin_basename = plugin_basename( __FILE__ );

    if ( in_array( $plugin_basename, $options['plugins'], true ) ) {
        mga_refresh_swiper_asset_sources();
    }
}

add_action( 'upgrader_process_complete', 'mga_maybe_refresh_swiper_asset_sources', 10, 2 );

// ===== FRONT-END =====

/**
 * Charge les scripts et styles sur le site public.
 */
function mga_enqueue_assets() {
    $post = get_post();

    if ( ! mga_should_enqueue_assets( $post ) ) {
        return;
    }

    // Récupérer les réglages sauvegardés
    $defaults = mga_get_default_settings();
    $saved_settings = get_option( 'mga_settings', [] );
    // On s'assure que toutes les clés existent pour éviter les erreurs PHP
    $settings = wp_parse_args( (array) $saved_settings, $defaults );
    $settings = mga_sanitize_settings( $settings, $saved_settings );
    $settings['contentSelectors'] = apply_filters(
        'mga_frontend_content_selectors',
        (array) $settings['contentSelectors'],
        $post
    );
    $settings['allowBodyFallback'] = apply_filters(
        'mga_frontend_allow_body_fallback',
        (bool) $settings['allowBodyFallback'],
        $post
    );

    // Librairies (Mise à jour vers Swiper v11)
    $swiper_version = '11.1.4';
    $local_swiper_css_url = plugin_dir_url( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.css';
    $local_swiper_css_path = plugin_dir_path( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.css';
    $local_swiper_js_url  = plugin_dir_url( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.js';
    $local_swiper_js_path = plugin_dir_path( __FILE__ ) . 'assets/vendor/swiper/swiper-bundle.min.js';

    $cdn_swiper_css = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.css';
    $cdn_swiper_js  = 'https://cdn.jsdelivr.net/npm/swiper@' . $swiper_version . '/swiper-bundle.min.js';

    $asset_sources = mga_get_swiper_asset_sources();

    if (
        ( 'local' === $asset_sources['css'] && ! file_exists( $local_swiper_css_path ) ) ||
        ( 'local' === $asset_sources['js'] && ! file_exists( $local_swiper_js_path ) )
    ) {
        $asset_sources = mga_refresh_swiper_asset_sources();
    }

    $swiper_css = 'local' === $asset_sources['css'] ? $local_swiper_css_url : $cdn_swiper_css;
    $swiper_css = apply_filters( 'mga_swiper_css', $swiper_css, $swiper_version );

    $swiper_js = 'local' === $asset_sources['js'] ? $local_swiper_js_url : $cdn_swiper_js;
    $swiper_js = apply_filters( 'mga_swiper_js', $swiper_js, $swiper_version );

    wp_enqueue_style( 'mga-swiper-css', $swiper_css, [], $swiper_version );
    wp_enqueue_script( 'mga-swiper-js', $swiper_js, [], $swiper_version, true );

    // Fichiers du plugin
    wp_enqueue_style('mga-gallery-style', plugin_dir_url( __FILE__ ) . 'assets/css/gallery-slideshow.css', [], MGA_VERSION);
    $script_dependencies = [ 'mga-swiper-js', 'wp-i18n' ];
    $languages_path = mga_get_languages_path();
    $has_languages = mga_languages_directory_exists();
    if ( ! empty( $settings['debug_mode'] ) ) {
        $can_view_debug = apply_filters(
            'mga_user_can_view_debug',
            is_user_logged_in() && current_user_can( 'manage_options' )
        );

        if ( $can_view_debug ) {
            wp_register_script(
                'mga-debug-script',
                plugin_dir_url( __FILE__ ) . 'assets/js/debug.js',
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
    wp_enqueue_script('mga-gallery-script', plugin_dir_url( __FILE__ ) . 'assets/js/gallery-slideshow.js', $script_dependencies, MGA_VERSION, true);
    if ( $has_languages ) {
        wp_set_script_translations( 'mga-gallery-script', 'lightbox-jlg', $languages_path );
    }

    // Passer les réglages au JavaScript
    wp_localize_script('mga-gallery-script', 'mga_settings', $settings);

    // Générer les styles dynamiques
    $accent_color = sanitize_hex_color($settings['accent_color']);
    if ( ! $accent_color ) {
        $accent_color = $defaults['accent_color'];
    }

    $dynamic_styles = "
        :root {
            --mga-thumb-size-desktop: " . intval($settings['thumb_size']) . "px;
            --mga-thumb-size-mobile: " . intval($settings['thumb_size_mobile']) . "px;
            --mga-accent-color: " . $accent_color . ";
            --mga-bg-opacity: " . floatval($settings['bg_opacity']) . ";
            --mga-z-index: " . intval($settings['z_index']) . ";
        }
    ";
    wp_add_inline_style('mga-gallery-style', $dynamic_styles);
}

add_action( 'wp_enqueue_scripts', 'mga_enqueue_assets' );

/**
 * Détermine si les assets front doivent être chargés pour un contenu.
 *
 * La détection se fait par étapes : la fonction vérifie d'abord si un forçage
 * est demandé via le filtre `mga_force_enqueue` et si le contexte est bien une
 * vue singulière. Elle inspecte ensuite la présence de blocs supportant des
 * images (galerie, image, etc.), recherche des liens vers des médias au moyen
 * d'une expression régulière qui accepte les balises <picture>, puis s'appuie
 * sur `mga_post_has_eligible_images()` comme dernier filet. Le résultat final
 * peut être filtré par `mga_post_has_linked_images`.
 *
 * @param WP_Post|int|null $post Objet post, identifiant ou null pour le post courant.
 *
 * @return bool
 */
function mga_should_enqueue_assets( $post ) {
    $post = get_post( $post );
    $force_enqueue = apply_filters( 'mga_force_enqueue', false, $post );

    if ( ! is_singular() && ! $force_enqueue ) {
        return false;
    }

    if ( $force_enqueue ) {
        return true;
    }

    if ( ! $post instanceof WP_Post ) {
        return false;
    }

    $content = (string) $post->post_content;

    if ( '' === trim( $content ) ) {
        return false;
    }

    $has_linked_images = false;

    $block_names = apply_filters(
        'mga_linked_image_blocks',
        [ 'core/gallery', 'core/image' ]
    );

    $block_names = array_filter( (array) $block_names );
    $candidate_block_names = [];

    if ( ! empty( $block_names ) ) {
        if ( function_exists( 'has_block' ) ) {
            foreach ( $block_names as $block_name ) {
                if ( is_string( $block_name ) && has_block( $block_name, $post ) ) {
                    $candidate_block_names[] = $block_name;
                }
            }
        } else {
            $candidate_block_names = $block_names;
        }
    }

    if ( ! empty( $candidate_block_names ) ) {
        $parsed_blocks = [];

        if ( function_exists( 'parse_blocks' ) ) {
            $parsed_blocks = parse_blocks( $content );
        } elseif ( class_exists( 'WP_Block_Parser' ) ) {
            $parser = new WP_Block_Parser();
            $parsed_blocks = $parser->parse( $content );
        }

        if ( ! empty( $parsed_blocks ) ) {
            $has_linked_images = mga_blocks_contain_linked_media( $parsed_blocks, $candidate_block_names );
        } elseif ( ! function_exists( 'has_block' ) ) {
            $has_linked_images = true;
        }
    }

    if ( ! $has_linked_images ) {
        $linked_image_pattern = '#<a\\b[^>]*href=["\']([^"\']+\.(?:jpe?g|png|gif|bmp|webp|avif|svg))(?:\?[^"\']*)?["\'][^>]*>\\s*(?:<picture\\b[^>]*>.*?<img\\b[^>]*>|<img\\b[^>]*>)#is';

        $has_anchor = false !== stripos( $content, '<a' );
        $has_media_tag = false !== stripos( $content, '<img' ) || false !== stripos( $content, '<picture' );

        if ( $has_anchor && $has_media_tag && preg_match( $linked_image_pattern, $content ) ) {
            $has_linked_images = true;
        }
    }

    if ( ! $has_linked_images && mga_post_has_eligible_images( $post ) ) {
        $has_linked_images = true;
    }

    $has_linked_images = apply_filters( 'mga_post_has_linked_images', $has_linked_images, $post );

    return (bool) $has_linked_images;
}

/**
 * Parcourt les blocs parsés pour trouver une image liée à un média.
 *
 * @param array $blocks              Liste de blocs issus de parse_blocks().
 * @param array $allowed_block_names Noms de blocs à inspecter.
 *
 * @return bool
 */
function mga_blocks_contain_linked_media( array $blocks, array $allowed_block_names, &$visited_block_ids = null ) {
    if ( ! is_array( $visited_block_ids ) ) {
        $visited_block_ids = [];
    }

    static $reusable_block_cache = [];

    foreach ( $blocks as $block ) {
        if ( ! is_array( $block ) ) {
            continue;
        }

        $block_name = isset( $block['blockName'] ) ? $block['blockName'] : null;

        if ( 'core/block' === $block_name ) {
            $attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : [];
            $ref   = isset( $attrs['ref'] ) ? absint( $attrs['ref'] ) : 0;

            if ( $ref && ! in_array( $ref, $visited_block_ids, true ) ) {
                $visited_block_ids[] = $ref;

                if ( array_key_exists( $ref, $reusable_block_cache ) ) {
                    $parsed_reusable_blocks = $reusable_block_cache[ $ref ];
                } else {
                    $reusable_block_cache[ $ref ] = [];
                    $reusable_block = get_post( $ref );

                    if (
                        $reusable_block instanceof WP_Post
                        && 'wp_block' === $reusable_block->post_type
                        && ! empty( $reusable_block->post_content )
                    ) {
                        if ( function_exists( 'parse_blocks' ) ) {
                            $reusable_block_cache[ $ref ] = parse_blocks( $reusable_block->post_content );
                        } elseif ( class_exists( 'WP_Block_Parser' ) ) {
                            $parser = new WP_Block_Parser();
                            $reusable_block_cache[ $ref ] = $parser->parse( $reusable_block->post_content );
                        }
                    }

                    $parsed_reusable_blocks = $reusable_block_cache[ $ref ];
                }

                if (
                    ! empty( $parsed_reusable_blocks )
                    && mga_blocks_contain_linked_media( $parsed_reusable_blocks, $allowed_block_names, $visited_block_ids )
                ) {
                    return true;
                }
            }

            continue;
        }

        if ( $block_name && in_array( $block_name, $allowed_block_names, true ) ) {
            $attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : [];

            if ( mga_block_attributes_link_to_media( $attrs ) ) {
                return true;
            }
        }

        if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
            if ( mga_blocks_contain_linked_media( $block['innerBlocks'], $allowed_block_names, $visited_block_ids ) ) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Vérifie si les attributs d'un bloc contiennent un lien vers un média.
 *
 * @param array $attrs Attributs du bloc.
 *
 * @return bool
 */
function mga_block_attributes_link_to_media( array $attrs ) {
    $media_destination_keys = [ 'linkDestination', 'linkTo' ];
    $link_url_keys          = [ 'href', 'linkUrl', 'linkHref', 'imageLink', 'link' ];

    foreach ( $media_destination_keys as $destination_key ) {
        if ( isset( $attrs[ $destination_key ] ) && is_string( $attrs[ $destination_key ] ) ) {
            if ( 'media' === $attrs[ $destination_key ] ) {
                return true;
            }
        }
    }

    foreach ( $link_url_keys as $link_key ) {
        if ( ! isset( $attrs[ $link_key ] ) ) {
            continue;
        }

        $link_value = $attrs[ $link_key ];

        if ( is_string( $link_value ) && mga_is_image_url( $link_value ) ) {
            return true;
        }

        if ( is_array( $link_value ) ) {
            if ( isset( $link_value['url'] ) && is_string( $link_value['url'] ) && mga_is_image_url( $link_value['url'] ) ) {
                return true;
            }

            if ( mga_block_attributes_link_to_media( $link_value ) ) {
                return true;
            }
        }
    }

    foreach ( $attrs as $value ) {
        if ( is_array( $value ) && mga_block_attributes_link_to_media( $value ) ) {
            return true;
        }
    }

    return false;
}

/**
 * Détermine si une URL pointe vers une image en se basant sur son extension.
 *
 * @param string $url URL à vérifier.
 *
 * @return bool
 */
function mga_is_image_url( $url ) {
    if ( ! is_string( $url ) || '' === $url ) {
        return false;
    }

    $parsed_url = wp_parse_url( $url );

    if ( empty( $parsed_url['path'] ) ) {
        return false;
    }

    $extension = strtolower( pathinfo( $parsed_url['path'], PATHINFO_EXTENSION ) );

    if ( '' === $extension ) {
        return false;
    }

    $allowed_extensions = [ 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'avif', 'svg' ];

    return in_array( $extension, $allowed_extensions, true );
}

/**
 * Détermine si le contenu du post courant contient des images utilisables.
 *
 * @param WP_Post|int|null $post Objet post, identifiant, ou null pour utiliser le post courant.
 *
 * @return bool
 */
function mga_post_has_eligible_images( $post = null ) {
    $post = get_post( $post );

    if ( ! $post instanceof WP_Post ) {
        return false;
    }

    if ( function_exists( 'get_post_galleries_images' ) ) {
        $galleries = get_post_galleries_images( $post );

        if ( ! empty( $galleries ) ) {
            foreach ( $galleries as $images ) {
                if ( ! empty( $images ) ) {
                    return true;
                }
            }
        }
    }

    $content = $post->post_content;

    if ( empty( $content ) ) {
        return false;
    }

    $pattern = '#<a\\b[^>]*href=["\']([^"\']+\.(?:jpe?g|png|gif|bmp|webp|avif|svg))(?:\?[^"\']*)?["\'][^>]*>\\s*(?:<picture\\b[^>]*>.*?<img\\b[^>]*>|<img\\b[^>]*>)#is';

    if ( preg_match( $pattern, $content ) ) {
        return true;
    }

    return false;
}


// ===== ADMIN =====

/**
 * Ajoute la page de réglages au menu principal de l'administration.
 */
function mga_add_admin_menu() {
    add_menu_page(
        __( 'Lightbox - JLG', 'lightbox-jlg' ),
        __( 'Lightbox - JLG', 'lightbox-jlg' ),
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
        'contentSelectors' => [],
        'allowBodyFallback' => false,
    ];
}

/**
 * Nettoie les données envoyées.
 */
function mga_sanitize_settings( $input, $existing_settings = null ) {
    if ( ! is_array( $input ) ) {
        $input = [];
    }

    $defaults = mga_get_default_settings();
    $output = [];
    if ( null === $existing_settings ) {
        $existing_settings = get_option( 'mga_settings', [] );
    }

    if ( ! is_array( $existing_settings ) ) {
        $existing_settings = [];
    }

    if ( isset( $input['delay'] ) ) {
        $delay = intval( $input['delay'] );
        $bounded_delay = max( 1, min( 30, $delay ) );
        $output['delay'] = $bounded_delay;
    } else {
        $output['delay'] = $defaults['delay'];
    }

    if ( isset( $input['thumb_size'] ) ) {
        $thumb_size = intval( $input['thumb_size'] );
        $bounded_thumb_size = max( 50, min( 150, $thumb_size ) );
        $output['thumb_size'] = $bounded_thumb_size;
    } else {
        $output['thumb_size'] = $defaults['thumb_size'];
    }

    if ( isset( $input['thumb_size_mobile'] ) ) {
        $thumb_size_mobile = intval( $input['thumb_size_mobile'] );
        $bounded_thumb_mobile = max( 40, min( 100, $thumb_size_mobile ) );
        $output['thumb_size_mobile'] = $bounded_thumb_mobile;
    } else {
        $output['thumb_size_mobile'] = $defaults['thumb_size_mobile'];
    }
    if ( isset( $input['accent_color'] ) ) {
        $sanitized_accent = sanitize_hex_color( $input['accent_color'] );
        $output['accent_color'] = $sanitized_accent ? $sanitized_accent : $defaults['accent_color'];
    } else {
        $output['accent_color'] = $defaults['accent_color'];
    }
    $output['bg_opacity'] = isset($input['bg_opacity']) ? max(min(floatval($input['bg_opacity']), 1), 0) : $defaults['bg_opacity'];
    $output['loop'] = ! empty( $input['loop'] );
    $output['autoplay_start'] = ! empty( $input['autoplay_start'] );
    
    $allowed_bg_styles = ['echo', 'blur', 'texture'];
    $output['background_style'] = isset($input['background_style']) && in_array($input['background_style'], $allowed_bg_styles, true) ? $input['background_style'] : $defaults['background_style'];
    
    if ( isset( $input['z_index'] ) ) {
        $raw_z_index = intval( $input['z_index'] );
        $sanitized_z_index = max( 0, $raw_z_index );
        $output['z_index'] = $sanitized_z_index;
    } else {
        $output['z_index'] = $defaults['z_index'];
    }
    $output['debug_mode'] = ! empty( $input['debug_mode'] );

    $sanitize_selectors = static function ( $selectors ) {
        $sanitized = [];

        foreach ( (array) $selectors as $selector ) {
            $sanitized_selector = trim( sanitize_text_field( (string) $selector ) );

            if ( '' !== $sanitized_selector ) {
                $sanitized[] = $sanitized_selector;
            }
        }

        return $sanitized;
    };

    $existing_selectors = $sanitize_selectors( $defaults['contentSelectors'] );

    if ( isset( $existing_settings['contentSelectors'] ) && is_array( $existing_settings['contentSelectors'] ) ) {
        $existing_selectors = $sanitize_selectors( $existing_settings['contentSelectors'] );
    }

    if ( array_key_exists( 'contentSelectors', $input ) ) {
        if ( is_array( $input['contentSelectors'] ) ) {
            $output['contentSelectors'] = $sanitize_selectors( $input['contentSelectors'] );
        } else {
            $output['contentSelectors'] = $existing_selectors;
        }
    } else {
        $output['contentSelectors'] = $existing_selectors;
    }
    $output['allowBodyFallback'] = isset( $input['allowBodyFallback'] )
        ? (bool) $input['allowBodyFallback']
        : (bool) $defaults['allowBodyFallback'];

    return $output;
}

/**
 * Charge les fichiers pour la page d'admin.
 */
function mga_admin_enqueue_assets($hook) {
    if ( ! current_user_can( 'manage_options' ) ) return;
    if ($hook !== 'toplevel_page_ma-galerie-automatique') return;
    wp_enqueue_style('mga-admin-style', plugin_dir_url(__FILE__) . 'assets/css/admin-style.css', [], MGA_VERSION);
    wp_enqueue_script('mga-admin-script', plugin_dir_url(__FILE__) . 'assets/js/admin-script.js', [ 'wp-i18n' ], MGA_VERSION, true);
    if ( mga_languages_directory_exists() ) {
        wp_set_script_translations( 'mga-admin-script', 'lightbox-jlg', mga_get_languages_path() );
    }
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
