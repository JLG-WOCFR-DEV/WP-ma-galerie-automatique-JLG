<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
    define( 'HOUR_IN_SECONDS', 3600 );
}

if ( ! class_exists( 'WP_Post' ) ) {
    class WP_Post {
        public $ID;
        public $post_type = 'post';
        public $post_content = '';

        public function __construct( array $data = [] ) {
            foreach ( $data as $key => $value ) {
                $this->$key = $value;
            }
        }
    }
}

$GLOBALS['mock_wp'] = [
    'filters' => [],
    'options' => [],
    'posts' => [],
    'meta' => [],
];

function add_filter( $tag, $function_to_add, $priority = 10, $accepted_args = 1 ) {
    if ( ! isset( $GLOBALS['mock_wp']['filters'][ $tag ] ) ) {
        $GLOBALS['mock_wp']['filters'][ $tag ] = [];
    }

    if ( ! isset( $GLOBALS['mock_wp']['filters'][ $tag ][ $priority ] ) ) {
        $GLOBALS['mock_wp']['filters'][ $tag ][ $priority ] = [];
    }

    $GLOBALS['mock_wp']['filters'][ $tag ][ $priority ][] = [
        'function' => $function_to_add,
        'accepted_args' => (int) $accepted_args,
    ];

    return true;
}

function add_action( $tag, $function_to_add, $priority = 10, $accepted_args = 1 ) {
    return add_filter( $tag, $function_to_add, $priority, $accepted_args );
}

function remove_all_filters( $tag, $priority = false ) {
    if ( false === $priority ) {
        unset( $GLOBALS['mock_wp']['filters'][ $tag ] );

        return;
    }

    unset( $GLOBALS['mock_wp']['filters'][ $tag ][ $priority ] );

    if ( empty( $GLOBALS['mock_wp']['filters'][ $tag ] ) ) {
        unset( $GLOBALS['mock_wp']['filters'][ $tag ] );
    }
}

function apply_filters( $tag, $value, ...$args ) {
    if ( empty( $GLOBALS['mock_wp']['filters'][ $tag ] ) ) {
        return $value;
    }

    ksort( $GLOBALS['mock_wp']['filters'][ $tag ] );

    foreach ( $GLOBALS['mock_wp']['filters'][ $tag ] as $priority => $callbacks ) {
        foreach ( $callbacks as $callback ) {
            $accepted_args = max( 1, (int) $callback['accepted_args'] );
            $parameters    = array_merge( [ $value ], array_slice( $args, 0, $accepted_args - 1 ) );
            $value         = $callback['function']( ...$parameters );
        }
    }

    return $value;
}

function do_action( $tag, ...$args ) {
    apply_filters( $tag, null, ...$args );
}

function plugin_dir_path( $file ) {
    return dirname( $file ) . '/';
}

function plugin_basename( $file ) {
    return basename( $file );
}

function load_plugin_textdomain( ...$args ) {
    return true;
}

function register_activation_hook( $file, $callback ) {
    return true;
}

function wp_parse_args( $args, $defaults = [] ) {
    if ( is_object( $args ) ) {
        $args = get_object_vars( $args );
    }

    if ( ! is_array( $args ) ) {
        if ( is_string( $args ) ) {
            parse_str( $args, $args );
        } else {
            $args = [];
        }
    }

    return array_merge( $defaults, $args );
}

function sanitize_hex_color( $color ) {
    return is_string( $color ) ? $color : '';
}

function absint( $maybeint ) {
    return abs( intval( $maybeint ) );
}

function sanitize_key( $key ) {
    $key = strtolower( (string) $key );

    return preg_replace( '/[^a-z0-9_\-]/', '', $key );
}

function get_post_types( $args = [], $output = 'names' ) {
    return [ 'post', 'page' ];
}

function wp_is_post_autosave( $post_id ) {
    return false;
}

function wp_is_post_revision( $post_id ) {
    return false;
}

function get_post( $post_id ) {
    return $GLOBALS['mock_wp']['posts'][ $post_id ] ?? null;
}

function delete_post_meta( $post_id, $meta_key ) {
    unset( $GLOBALS['mock_wp']['meta'][ $post_id ][ $meta_key ] );

    return true;
}

function update_post_meta( $post_id, $meta_key, $value ) {
    if ( ! isset( $GLOBALS['mock_wp']['meta'][ $post_id ] ) ) {
        $GLOBALS['mock_wp']['meta'][ $post_id ] = [];
    }

    $GLOBALS['mock_wp']['meta'][ $post_id ][ $meta_key ] = $value;

    return true;
}

function get_post_meta( $post_id, $meta_key, $single = false ) {
    return $GLOBALS['mock_wp']['meta'][ $post_id ][ $meta_key ] ?? '';
}

function has_block( $block_name, $post = null ) {
    return false;
}

function parse_blocks( $content ) {
    return [];
}

function add_option( $option, $value, $deprecated = '', $autoload = 'yes' ) {
    $GLOBALS['mock_wp']['options'][ $option ] = $value;

    return true;
}

function update_option( $option, $value, $autoload = null ) {
    $GLOBALS['mock_wp']['options'][ $option ] = $value;

    return true;
}

function get_option( $option, $default = false ) {
    $value = array_key_exists( $option, $GLOBALS['mock_wp']['options'] )
        ? $GLOBALS['mock_wp']['options'][ $option ]
        : $default;

    return apply_filters( 'option_' . $option, $value );
}

function __( $text, $domain = null ) {
    return $text;
}

function add_menu_page( ...$args ) {
    return true;
}

function register_setting( ...$args ) {
    return true;
}

function wp_enqueue_style( ...$args ) {
    return true;
}

function wp_enqueue_script( ...$args ) {
    return true;
}

function wp_localize_script( ...$args ) {
    return true;
}

function wp_register_script( ...$args ) {
    return true;
}

function wp_register_style( ...$args ) {
    return true;
}

function wp_get_current_user() {
    return (object) [];
}

function current_user_can( ...$args ) {
    return false;
}

function wp_json_encode( $data ) {
    return json_encode( $data );
}

function wp_get_post_terms( ...$args ) {
    return [];
}

function wp_get_attachment_image_src( ...$args ) {
    return false;
}

function wp_attachment_is_image( ...$args ) {
    return false;
}

function get_post_thumbnail_id( ...$args ) {
    return 0;
}

function wp_get_attachment_url( ...$args ) {
    return '';
}

function get_posts( ...$args ) {
    return [];
}

function get_post_field( ...$args ) {
    return '';
}

function wp_strip_all_tags( $string ) {
    return strip_tags( (string) $string );
}

function wp_unslash( $value ) {
    return $value;
}

function esc_html__( $text, $domain = null ) {
    return $text;
}

function esc_attr( $text ) {
    return (string) $text;
}

function wp_create_nonce( $action = -1 ) {
    return 'nonce';
}

function wp_nonce_field( ...$args ) {
    return '';
}

function submit_button( ...$args ) {
    return '';
}

function wp_add_inline_script( ...$args ) {
    return true;
}

function wp_add_inline_style( ...$args ) {
    return true;
}

function wp_style_is( ...$args ) {
    return false;
}

function wp_script_is( ...$args ) {
    return false;
}

function wp_get_environment_type() {
    return 'production';
}

function wp_remote_get( ...$args ) {
    return [ 'body' => '' ];
}

function is_wp_error( $thing ) {
    return false;
}

function wp_remote_retrieve_body( $response ) {
    return is_array( $response ) && isset( $response['body'] ) ? $response['body'] : '';
}

