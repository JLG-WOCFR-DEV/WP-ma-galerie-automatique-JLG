<?php

namespace MaGalerieAutomatique\Content;

use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Plugin;
use WP_Post;

class Detection {
    private Plugin $plugin;

    private Settings $settings;

    private array $request_detection_cache = [];

    public function __construct( Plugin $plugin, Settings $settings ) {
        $this->plugin  = $plugin;
        $this->settings = $settings;
    }

    public function should_enqueue_assets( $post ): bool {
        $post = get_post( $post );

        $force_enqueue = apply_filters( 'mga_force_enqueue', false, $post );

        if ( ! $post instanceof WP_Post ) {
            return (bool) $force_enqueue;
        }

        if ( post_password_required( $post ) ) {
            return false;
        }

        $settings          = $this->settings->get_sanitized_settings();
        $tracked_post_types = [];

        if ( isset( $settings['tracked_post_types'] ) && is_array( $settings['tracked_post_types'] ) ) {
            $tracked_post_types = array_map( 'sanitize_key', $settings['tracked_post_types'] );
        }

        if ( empty( $tracked_post_types ) ) {
            $tracked_post_types = (array) $this->settings->get_default_settings()['tracked_post_types'];
        }

        $all_registered_post_types = get_post_types( [], 'names' );
        $tracked_post_types        = array_values( array_intersect( $tracked_post_types, $all_registered_post_types ) );

        $tracked_post_types = apply_filters( 'mga_tracked_post_types', $tracked_post_types, $post );
        $tracked_post_types = array_values( array_filter( (array) $tracked_post_types ) );

        $load_on_archives = ! empty( $settings['load_on_archives'] );

        if ( ! is_singular() && ! $force_enqueue && ! $load_on_archives ) {
            return false;
        }

        if ( $force_enqueue ) {
            return true;
        }

        if ( ! empty( $tracked_post_types ) && ! in_array( $post->post_type, $tracked_post_types, true ) ) {
            return false;
        }

        $content = (string) $post->post_content;

        if ( '' === trim( $content ) ) {
            return false;
        }

        if ( isset( $this->request_detection_cache[ $post->ID ] ) ) {
            return $this->request_detection_cache[ $post->ID ];
        }

        $has_linked_images = $this->get_cached_post_linked_images( $post );

        if ( null === $has_linked_images ) {
            $has_linked_images = $this->detect_post_linked_images( $post );
            $this->update_post_linked_images_cache( $post->ID, $has_linked_images );
        }

        $has_linked_images = apply_filters( 'mga_post_has_linked_images', $has_linked_images, $post );
        $has_linked_images = (bool) $has_linked_images;

        $this->request_detection_cache[ $post->ID ] = $has_linked_images;

        return $has_linked_images;
    }

    public function get_cached_post_linked_images( WP_Post $post ): ?bool {
        $cached_value = get_post_meta( $post->ID, '_mga_has_linked_images', true );

        if ( '' === $cached_value ) {
            return null;
        }

        return in_array( $cached_value, [ 1, '1' ], true );
    }

    public function update_post_linked_images_cache( int $post_id, bool $has_linked_images ): void {
        $post = get_post( $post_id );

        if ( ! $post instanceof WP_Post ) {
            return;
        }

        if ( $this->post_contains_reusable_block( $post ) ) {
            delete_post_meta( $post_id, '_mga_has_linked_images' );
            return;
        }

        update_post_meta( $post_id, '_mga_has_linked_images', $has_linked_images ? 1 : 0 );
    }

    public function parse_blocks_from_content( string $content ): array {
        if ( function_exists( 'parse_blocks' ) ) {
            return parse_blocks( $content );
        }

        if ( class_exists( '\WP_Block_Parser' ) ) {
            $parser = new \WP_Block_Parser();
            return $parser->parse( $content );
        }

        return [];
    }

    public function post_contains_reusable_block( WP_Post $post ): bool {
        if ( ! function_exists( 'has_block' ) ) {
            return false;
        }

        return has_block( 'core/block', $post );
    }

    public function blocks_include_reusable_block( array $blocks ): bool {
        foreach ( $blocks as $block ) {
            if ( ! is_array( $block ) ) {
                continue;
            }

            if ( isset( $block['blockName'] ) && 'core/block' === $block['blockName'] ) {
                return true;
            }

            if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
                if ( $this->blocks_include_reusable_block( $block['innerBlocks'] ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    public function detect_post_linked_images( WP_Post $post ): bool {
        $parsed_blocks = [];

        if ( has_blocks( $post ) ) {
            $parsed_blocks = $this->parse_blocks_from_content( $post->post_content );
        }

        $default_block_names = [
            'core/gallery',
            'core/image',
            'core/media-text',
            'core/cover',
            'core/group',
            'core/columns',
            'core/column',
            'core/query',
            'core/post-template',
            'core/post-featured-image',
        ];

        $linked_block_names = apply_filters( 'mga_linked_image_blocks', $default_block_names );

        $allowed_block_names = apply_filters(
            'mga_allowed_media_blocks',
            (array) $linked_block_names,
            $post
        );

        if ( ! is_array( $allowed_block_names ) ) {
            $allowed_block_names = [];
        }

        $allowed_block_names = array_values( array_filter( $allowed_block_names ) );

        if ( ! empty( $parsed_blocks ) ) {
            if ( $this->blocks_include_reusable_block( $parsed_blocks ) ) {
                delete_post_meta( $post->ID, '_mga_has_linked_images' );
            }

            if ( $this->blocks_contain_linked_media( $parsed_blocks, $allowed_block_names ) ) {
                return true;
            }
        }

        if ( $this->post_has_eligible_images( $post ) ) {
            return true;
        }

        $content = $post->post_content;

        if ( empty( $content ) ) {
            return false;
        }

        $pattern = '#<a\\b[^>]*href=["\']([^"\']+\.(?:jpe?g|png|gif|bmp|webp|avif|svg))(?:\?[^"\']*)?(?:\\#[^"\']*)?["\'][^>]*>\\s*(?:<picture\\b[^>]*>.*?<img\\b[^>]*>|<img\\b[^>]*>)#is';

        return (bool) preg_match( $pattern, $content );
    }

    public function refresh_post_linked_images_cache_on_save( $post_id, $post ): void {
        if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
            return;
        }

        if ( ! $post instanceof WP_Post ) {
            return;
        }

        $settings = $this->settings->get_sanitized_settings();
        $tracked_post_types = [];

        if ( isset( $settings['tracked_post_types'] ) && is_array( $settings['tracked_post_types'] ) ) {
            $tracked_post_types = array_map( 'sanitize_key', $settings['tracked_post_types'] );
        }

        if ( empty( $tracked_post_types ) ) {
            $tracked_post_types = (array) $this->settings->get_default_settings()['tracked_post_types'];
        }

        $all_registered_post_types = get_post_types( [], 'names' );
        $tracked_post_types        = array_values( array_intersect( $tracked_post_types, $all_registered_post_types ) );

        $tracked_post_types = apply_filters( 'mga_tracked_post_types', $tracked_post_types, $post );
        $tracked_post_types = array_values( array_filter( (array) $tracked_post_types ) );

        if ( ! empty( $tracked_post_types ) && ! in_array( $post->post_type, $tracked_post_types, true ) ) {
            return;
        }

        $has_linked_images = $this->detect_post_linked_images( $post );
        $this->update_post_linked_images_cache( $post_id, $has_linked_images );
    }

    public function blocks_contain_linked_media( array $blocks, array $allowed_block_names, ?array &$visited_block_ids = null ): bool {
        if ( ! is_array( $visited_block_ids ) ) {
            $visited_block_ids = [];
        }

        static $reusable_block_cache = [];

        foreach ( $blocks as $block ) {
            if ( ! is_array( $block ) ) {
                continue;
            }

            $block_name = $block['blockName'] ?? null;

            if ( 'core/block' === $block_name ) {
                $attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : [];
                $ref   = isset( $attrs['ref'] ) ? absint( $attrs['ref'] ) : 0;

                if ( $ref && ! in_array( $ref, $visited_block_ids, true ) ) {
                    $visited_block_ids[] = $ref;

                    if ( array_key_exists( $ref, $reusable_block_cache ) ) {
                        $parsed_reusable_blocks = $reusable_block_cache[ $ref ];
                    } else {
                        $reusable_block_cache[ $ref ] = [];
                        $reusable_block              = get_post( $ref );

                        if ( $reusable_block instanceof WP_Post && 'wp_block' === $reusable_block->post_type && ! empty( $reusable_block->post_content ) ) {
                            $reusable_block_cache[ $ref ] = $this->parse_blocks_from_content( $reusable_block->post_content );
                        }

                        $parsed_reusable_blocks = $reusable_block_cache[ $ref ];
                    }

                    if ( ! empty( $parsed_reusable_blocks ) && $this->blocks_contain_linked_media( $parsed_reusable_blocks, $allowed_block_names, $visited_block_ids ) ) {
                        return true;
                    }
                }

                continue;
            }

            if ( $block_name && in_array( $block_name, $allowed_block_names, true ) ) {
                $attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : [];

                if ( $this->block_attributes_link_to_media( $attrs ) ) {
                    return true;
                }
            }

            if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
                if ( $this->blocks_contain_linked_media( $block['innerBlocks'], $allowed_block_names, $visited_block_ids ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    public function block_attributes_link_to_media( array $attrs ): bool {
        if ( empty( $attrs ) ) {
            return false;
        }

        $normalized_attrs = [];

        foreach ( $attrs as $key => $value ) {
            if ( is_string( $key ) ) {
                $normalized_attrs[ strtolower( $key ) ] = $value;
            }
        }

        $is_link = $this->normalize_to_bool( $normalized_attrs['islink'] ?? null );

        if ( null === $is_link && isset( $normalized_attrs['linktarget'] ) ) {
            $is_link = true;
        }

        if ( null === $is_link ) {
            $bound_is_link = $this->get_bound_attribute_value( $attrs, 'isLink' );

            if ( null !== $bound_is_link ) {
                $is_link = $this->normalize_to_bool( $bound_is_link );
            }
        }

        $allowed_destination_values = [ 'media', 'attachment', 'attachment-page', 'file' ];
        $destination_keys           = [ 'linkdestination', 'linkto' ];
        $destination_values         = [];

        foreach ( $destination_keys as $destination_key ) {
            if ( isset( $normalized_attrs[ $destination_key ] ) && is_string( $normalized_attrs[ $destination_key ] ) ) {
                $destination_values[] = strtolower( $normalized_attrs[ $destination_key ] );
            }
        }

        foreach ( [ 'linkDestination', 'linkTo' ] as $binding_key ) {
            $bound_value = $this->get_bound_attribute_value( $attrs, $binding_key );

            if ( is_string( $bound_value ) ) {
                $destination_values[] = strtolower( $bound_value );
            }
        }

        $destination_values = array_values( array_unique( $destination_values ) );

        foreach ( $destination_values as $destination_value ) {
            if ( in_array( $destination_value, $allowed_destination_values, true ) ) {
                if ( null === $is_link || true === $is_link ) {
                    return true;
                }
            }
        }

        $link_url_keys = [ 'href', 'linkurl', 'linkhref', 'imagelink', 'link' ];

        foreach ( $link_url_keys as $link_key ) {
            if ( ! array_key_exists( $link_key, $normalized_attrs ) ) {
                continue;
            }

            $link_value = $normalized_attrs[ $link_key ];

            if ( is_string( $link_value ) ) {
                if ( $this->is_image_url( $link_value ) || $this->is_attachment_permalink( $link_value ) ) {
                    return true;
                }
            }

            if ( is_array( $link_value ) ) {
                foreach ( [ 'url', 'href' ] as $url_key ) {
                    if ( isset( $link_value[ $url_key ] ) && is_string( $link_value[ $url_key ] ) ) {
                        if ( $this->is_image_url( $link_value[ $url_key ] ) || $this->is_attachment_permalink( $link_value[ $url_key ] ) ) {
                            return true;
                        }
                    }
                }

                if ( $this->block_attributes_link_to_media( $link_value ) ) {
                    return true;
                }
            }
        }

        foreach ( [ 'href', 'url', 'linkurl', 'linkhref', 'imagelink', 'link' ] as $binding_key ) {
            $bound_link_value = $this->get_bound_attribute_value( $attrs, $binding_key );

            if ( is_string( $bound_link_value ) ) {
                if ( $this->is_image_url( $bound_link_value ) || $this->is_attachment_permalink( $bound_link_value ) ) {
                    return true;
                }
            }
        }

        foreach ( $attrs as $value ) {
            if ( is_array( $value ) && $this->block_attributes_link_to_media( $value ) ) {
                return true;
            }
        }

        return false;
    }

    private function normalize_to_bool( $value ): ?bool {
        if ( is_bool( $value ) ) {
            return $value;
        }

        if ( is_string( $value ) ) {
            $value = strtolower( trim( $value ) );

            if ( '' === $value ) {
                return null;
            }

            if ( in_array( $value, [ '1', 'true', 'yes', 'on' ], true ) ) {
                return true;
            }

            if ( in_array( $value, [ '0', 'false', 'no', 'off' ], true ) ) {
                return false;
            }
        }

        if ( is_numeric( $value ) ) {
            return (float) $value > 0;
        }

        return null;
    }

    private function get_bound_attribute_value( array $attrs, string $attribute ): ?string {
        if ( empty( $attrs['metadata'] ) || ! is_array( $attrs['metadata'] ) ) {
            return null;
        }

        $metadata = array_change_key_case( $attrs['metadata'], CASE_LOWER );

        if ( empty( $metadata['bindings'] ) || ! is_array( $metadata['bindings'] ) ) {
            return null;
        }

        $target_key = strtolower( $attribute );

        foreach ( $metadata['bindings'] as $binding_key => $binding_value ) {
            if ( strtolower( $binding_key ) !== $target_key ) {
                continue;
            }

            if ( is_string( $binding_value ) ) {
                return $binding_value;
            }

            if ( ! is_array( $binding_value ) ) {
                continue;
            }

            $binding_value_lower = array_change_key_case( $binding_value, CASE_LOWER );

            foreach ( [ 'value', 'default' ] as $value_key ) {
                if ( isset( $binding_value_lower[ $value_key ] ) && is_string( $binding_value_lower[ $value_key ] ) ) {
                    return $binding_value_lower[ $value_key ];
                }
            }

            if ( isset( $binding_value_lower['args'] ) && is_array( $binding_value_lower['args'] ) ) {
                $args = array_change_key_case( $binding_value_lower['args'], CASE_LOWER );

                foreach ( [ 'value', 'linkdestination', 'destination', 'href', 'url' ] as $arg_key ) {
                    if ( isset( $args[ $arg_key ] ) && is_string( $args[ $arg_key ] ) ) {
                        return $args[ $arg_key ];
                    }
                }
            }
        }

        return null;
    }

    public function is_image_url( $url ): bool {
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

    public function is_attachment_permalink( $url ): bool {
        if ( ! is_string( $url ) || '' === $url ) {
            return false;
        }

        $hash_position = strpos( $url, '#' );

        if ( false !== $hash_position ) {
            $url = substr( $url, 0, $hash_position );
        }

        $attachment_id = url_to_postid( $url );

        if ( ! $attachment_id ) {
            return false;
        }

        $attachment = get_post( $attachment_id );

        if ( ! $attachment instanceof WP_Post || 'attachment' !== $attachment->post_type ) {
            return false;
        }

        return wp_attachment_is_image( $attachment_id );
    }

    public function gallery_attributes_link_to_media( array $attributes ): bool {
        if ( empty( $attributes ) ) {
            return false;
        }

        $attributes = array_change_key_case( $attributes, CASE_LOWER );

        if ( isset( $attributes['link'] ) && is_string( $attributes['link'] ) ) {
            if ( in_array( $attributes['link'], [ 'file', 'attachment', 'media' ], true ) ) {
                return true;
            }
        }

        if ( isset( $attributes['linkdestination'] ) && is_string( $attributes['linkdestination'] ) ) {
            if ( in_array( $attributes['linkdestination'], [ 'media', 'attachment' ], true ) ) {
                return true;
            }
        }

        if ( isset( $attributes['linkto'] ) && is_string( $attributes['linkto'] ) ) {
            if ( in_array( $attributes['linkto'], [ 'file', 'attachment', 'media' ], true ) ) {
                return true;
            }
        }

        return false;
    }

    public function gallery_html_has_linked_media( $html ): bool {
        if ( ! is_string( $html ) || '' === trim( $html ) ) {
            return false;
        }

        $pattern = '#<a\\b[^>]*href=["\']([^"\']+)["\'][^>]*>\\s*(?:<picture\\b[^>]*>.*?<img\\b[^>]*>|<img\\b[^>]*>)#is';

        if ( preg_match_all( $pattern, $html, $matches ) ) {
            foreach ( $matches[1] as $href ) {
                if ( $this->is_image_url( $href ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    public function post_has_eligible_images( $post = null ): bool {
        $post = get_post( $post );

        if ( ! $post instanceof WP_Post ) {
            return false;
        }

        if ( function_exists( 'get_post_galleries_images' ) ) {
            $galleries = get_post_galleries_images( $post );

            if ( ! empty( $galleries ) ) {
                $gallery_attributes = [];
                $gallery_html       = [];

                if ( function_exists( 'get_post_galleries' ) ) {
                    $gallery_attributes = get_post_galleries( $post, false );
                    $gallery_html       = get_post_galleries( $post, true );
                }

                foreach ( $galleries as $index => $images ) {
                    if ( empty( $images ) ) {
                        continue;
                    }

                    $has_linked_media = false;

                    if ( isset( $gallery_attributes[ $index ] ) && is_array( $gallery_attributes[ $index ] ) ) {
                        $has_linked_media = $this->gallery_attributes_link_to_media( $gallery_attributes[ $index ] );
                    }

                    if ( ! $has_linked_media && isset( $gallery_html[ $index ] ) ) {
                        $has_linked_media = $this->gallery_html_has_linked_media( $gallery_html[ $index ] );
                    }

                    if ( $has_linked_media ) {
                        return true;
                    }
                }
            }
        }

        $content = $post->post_content;

        if ( empty( $content ) ) {
            return false;
        }

        $pattern = '#<a\\b[^>]*href=["\']([^"\']+\.(?:jpe?g|png|gif|bmp|webp|avif|svg))(?:\?[^"\']*)?(?:\\#[^"\']*)?["\'][^>]*>\\s*(?:<picture\\b[^>]*>.*?<img\\b[^>]*>|<img\\b[^>]*>)#is';

        return (bool) preg_match( $pattern, $content );
    }
}
