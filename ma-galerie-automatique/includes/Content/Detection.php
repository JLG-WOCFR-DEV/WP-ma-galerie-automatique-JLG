<?php

namespace MaGalerieAutomatique\Content;

use DOMDocument;
use DOMElement;
use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Plugin;
use WP_Post;

class Detection {
    private Plugin $plugin;

    private Settings $settings;

    private array $request_detection_cache = [];

    /**
     * Cache the result of archive-wide detection for the current main query.
     *
     * @var array{query_id:int,result:bool}|null
     */
    private ?array $archive_detection_cache = null;

    /**
     * Stores the last detection snapshot so we can reuse the computed signature
     * when persisting the cache.
     *
     * @var array<string,mixed>|null
     */
    private ?array $latest_detection_snapshot = null;

    /**
     * Runtime cache of reusable block signatures keyed by block ID.
     *
     * @var array<int,string|null>
     */
    private array $reusable_block_signature_cache = [];

    public function __construct( Plugin $plugin, Settings $settings ) {
        $this->plugin  = $plugin;
        $this->settings = $settings;
    }

    public function should_enqueue_assets( $post ): bool {
        $post = get_post( $post );

        $force_enqueue = apply_filters( 'mga_force_enqueue', false, $post );

        if ( $this->is_excluded_request_context() && ! $force_enqueue ) {
            return false;
        }

        $settings           = $this->settings->get_sanitized_settings();
        $load_on_archives = ! empty( $settings['load_on_archives'] );

        if ( ! is_singular() ) {
            if ( $force_enqueue ) {
                return true;
            }

            if ( ! $load_on_archives ) {
                return false;
            }

            return $this->archive_requires_assets( $settings );
        }

        if ( $force_enqueue ) {
            return true;
        }

        if ( ! $post instanceof WP_Post ) {
            return false;
        }

        return $this->evaluate_post_for_assets( $post, $settings );
    }

    private function evaluate_post_for_assets( WP_Post $post, array $settings ): bool {
        if ( post_password_required( $post ) ) {
            $this->request_detection_cache[ $post->ID ] = false;
            return false;
        }

        $tracked_post_types = $this->resolve_tracked_post_types( $post, $settings );

        if ( ! empty( $tracked_post_types ) && ! in_array( $post->post_type, $tracked_post_types, true ) ) {
            $this->request_detection_cache[ $post->ID ] = false;
            return false;
        }

        $content = (string) $post->post_content;

        if ( '' === trim( $content ) ) {
            $this->request_detection_cache[ $post->ID ] = false;
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

    private function archive_requires_assets( array $settings ): bool {
        global $wp_query;

        if ( ! isset( $wp_query ) || ! $wp_query instanceof \WP_Query ) {
            return false;
        }

        $query_id = function_exists( 'spl_object_id' ) ? spl_object_id( $wp_query ) : null;

        if ( is_array( $this->archive_detection_cache ) && $this->archive_detection_cache['query_id'] === $query_id ) {
            return (bool) $this->archive_detection_cache['result'];
        }

        $posts = is_array( $wp_query->posts ) ? $wp_query->posts : [];
        $result = false;

        foreach ( $posts as $post ) {
            if ( ! $post instanceof WP_Post ) {
                continue;
            }

            if ( $this->evaluate_post_for_assets( $post, $settings ) ) {
                $result = true;
                break;
            }
        }

        $this->archive_detection_cache = [
            'query_id' => (int) $query_id,
            'result'   => $result,
        ];

        return $result;
    }

    private function is_excluded_request_context(): bool {
        if ( function_exists( 'wp_is_serving_rest_request' ) && wp_is_serving_rest_request() ) {
            return true;
        }

        if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
            return true;
        }

        if ( function_exists( 'is_feed' ) && is_feed() ) {
            return true;
        }

        if ( function_exists( 'is_embed' ) && is_embed() ) {
            return true;
        }

        return false;
    }

    public function get_cached_post_linked_images( WP_Post $post ): ?bool {
        $cached_value = get_post_meta( $post->ID, '_mga_has_linked_images', true );

        if ( '' === $cached_value ) {
            return null;
        }

        if ( is_array( $cached_value ) ) {
            $normalized = $this->normalize_cached_detection_value( $cached_value, $post );

            if ( null === $normalized ) {
                return null;
            }

            $this->latest_detection_snapshot = $normalized;

            return (bool) $normalized['has_linked_images'];
        }

        if ( in_array( $cached_value, [ 1, '1' ], true ) ) {
            return true;
        }

        if ( in_array( $cached_value, [ 0, '0' ], true ) ) {
            return false;
        }

        return null;
    }

    public function update_post_linked_images_cache( int $post_id, bool $has_linked_images ): void {
        $post = get_post( $post_id );

        if ( ! $post instanceof WP_Post ) {
            return;
        }

        $snapshot = $this->latest_detection_snapshot;

        if ( ! is_array( $snapshot ) || empty( $snapshot['signature'] ) ) {
            $snapshot = $this->build_detection_snapshot( $post, $has_linked_images );
        }

        $payload = [
            'has_linked_images' => (bool) $has_linked_images,
            'signature'         => $snapshot['signature'],
            'content_hash'      => $snapshot['content_hash'],
            'reusable'          => $snapshot['reusable'],
            'generated_at'      => isset( $snapshot['generated_at'] ) ? absint( $snapshot['generated_at'] ) : time(),
        ];

        update_post_meta( $post_id, '_mga_has_linked_images', $payload );
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
        $this->latest_detection_snapshot = null;

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
            'core/post-content',
            'core/template-part',
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

        $has_linked_images = false;

        if ( ! empty( $parsed_blocks ) ) {
            if ( $this->blocks_contain_linked_media( $parsed_blocks, $allowed_block_names ) ) {
                $has_linked_images = true;
            }
        }

        if ( ! $has_linked_images && $this->post_has_eligible_images( $post ) ) {
            $has_linked_images = true;
        }

        if ( ! $has_linked_images ) {
            $content = $post->post_content;

            if ( ! empty( $content ) ) {
                $has_linked_images = $this->html_contains_linked_media( $content );
            }
        }

        $this->latest_detection_snapshot = $this->build_detection_snapshot( $post, $has_linked_images );

        return $has_linked_images;
    }

    public function refresh_post_linked_images_cache_on_save( $post_id, $post ): void {
        if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
            return;
        }

        if ( ! $post instanceof WP_Post ) {
            return;
        }

        $settings           = $this->settings->get_sanitized_settings();
        $tracked_post_types = $this->resolve_tracked_post_types( $post, $settings );

        if ( ! empty( $tracked_post_types ) && ! in_array( $post->post_type, $tracked_post_types, true ) ) {
            return;
        }

        $has_linked_images = $this->detect_post_linked_images( $post );
        $this->update_post_linked_images_cache( $post_id, $has_linked_images );
    }

    /**
     * Resolve the list of tracked post types for the provided post.
     *
     * @return string[]
     */
    private function resolve_tracked_post_types( WP_Post $post, ?array $settings = null ): array {
        if ( ! is_array( $settings ) ) {
            $settings = $this->settings->get_sanitized_settings();
        }

        $tracked_post_types = [];

        if ( ! empty( $settings['tracked_post_types'] ) && is_array( $settings['tracked_post_types'] ) ) {
            $tracked_post_types = array_map( 'sanitize_key', $settings['tracked_post_types'] );
        }

        if ( empty( $tracked_post_types ) ) {
            $defaults = $this->settings->get_default_settings();
            $tracked_post_types = isset( $defaults['tracked_post_types'] ) ? (array) $defaults['tracked_post_types'] : [];
        }

        $tracked_post_types = array_values( array_unique( $tracked_post_types ) );

        $all_registered_post_types = get_post_types( [], 'names' );
        $tracked_post_types        = array_values( array_intersect( $tracked_post_types, $all_registered_post_types ) );

        $tracked_post_types = apply_filters( 'mga_tracked_post_types', $tracked_post_types, $post );

        $tracked_post_types = array_values(
            array_filter(
                array_map(
                    static function ( $post_type ) {
                        return is_string( $post_type ) ? sanitize_key( $post_type ) : '';
                    },
                    (array) $tracked_post_types
                )
            )
        );

        return $tracked_post_types;
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

        if ( null === $is_link ) {
            $bound_is_link = $this->get_bound_attribute_value( $attrs, 'isLink' );

            if ( null !== $bound_is_link ) {
                $is_link = $this->normalize_to_bool( $bound_is_link );
            }
        }

        if ( null === $is_link && isset( $normalized_attrs['linktarget'] ) ) {
            $is_link = true;
        }

        if ( null === $is_link ) {
            $bound_link_target = $this->get_bound_attribute_value( $attrs, 'linkTarget' );

            if ( null !== $bound_link_target ) {
                $is_link = true;
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

        if ( $this->metadata_bindings_link_to_media( $attrs, $allowed_destination_values, $is_link ) ) {
            return true;
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

    private function metadata_bindings_link_to_media( array $attrs, array $allowed_destination_values, ?bool $is_link ): bool {
        if ( empty( $attrs['metadata'] ) || ! is_array( $attrs['metadata'] ) ) {
            return false;
        }

        $metadata = array_change_key_case( $attrs['metadata'], CASE_LOWER );

        if ( empty( $metadata['bindings'] ) || ! is_array( $metadata['bindings'] ) ) {
            return false;
        }

        foreach ( $metadata['bindings'] as $binding_value ) {
            $scalar_value = $this->extract_scalar_from_binding_value( $binding_value );

            if ( is_bool( $scalar_value ) ) {
                continue;
            }

            if ( is_string( $scalar_value ) ) {
                $normalized_value = strtolower( $scalar_value );

                if ( in_array( $normalized_value, $allowed_destination_values, true ) ) {
                    if ( null === $is_link || true === $is_link ) {
                        return true;
                    }

                    continue;
                }

                if ( $this->is_image_url( $scalar_value ) || $this->is_attachment_permalink( $scalar_value ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    private function extract_scalar_from_binding_value( $value ) {
        if ( is_bool( $value ) || is_string( $value ) || is_int( $value ) || is_float( $value ) ) {
            return $value;
        }

        if ( ! is_array( $value ) ) {
            return null;
        }

        $value_lower = array_change_key_case( $value, CASE_LOWER );
        $priority_keys = [ 'value', 'default', 'args', 'linkdestination', 'destination', 'href', 'url', 'type' ];

        foreach ( $priority_keys as $priority_key ) {
            if ( array_key_exists( $priority_key, $value_lower ) ) {
                $extracted = $this->extract_scalar_from_binding_value( $value_lower[ $priority_key ] );

                if ( null !== $extracted ) {
                    return $extracted;
                }
            }
        }

        foreach ( $value_lower as $sub_value ) {
            $extracted = $this->extract_scalar_from_binding_value( $sub_value );

            if ( null !== $extracted ) {
                return $extracted;
            }
        }

        return null;
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

    private function get_bound_attribute_value( array $attrs, string $attribute ): string|bool|null {
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

            $extracted_value = $this->extract_scalar_from_binding_value( $binding_value );

            if ( is_bool( $extracted_value ) ) {
                return $extracted_value;
            }

            if ( is_string( $extracted_value ) ) {
                return $extracted_value;
            }

            if ( is_int( $extracted_value ) || is_float( $extracted_value ) ) {
                return (string) $extracted_value;
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

        return $this->html_contains_linked_media( $content );
    }

    private function html_contains_linked_media( string $html ): bool {
        if ( '' === trim( $html ) ) {
            return false;
        }

        if ( ! class_exists( 'DOMDocument', false ) ) {
            return $this->fallback_regex_detects_linked_media( $html );
        }

        $document = new DOMDocument();
        $previous_error_state = libxml_use_internal_errors( true );

            $options = 0;

            if ( defined( 'LIBXML_HTML_NOIMPLIED' ) ) {
                $options |= LIBXML_HTML_NOIMPLIED;
            }

            if ( defined( 'LIBXML_HTML_NODEFDTD' ) ) {
                $options |= LIBXML_HTML_NODEFDTD;
            }

            $loaded = $document->loadHTML( '<!DOCTYPE html><html><body>' . $html . '</body></html>', $options );

            libxml_clear_errors();
            libxml_use_internal_errors( $previous_error_state );

            if ( $loaded ) {
                foreach ( $document->getElementsByTagName( 'a' ) as $anchor ) {
                    if ( ! $anchor instanceof DOMElement ) {
                        continue;
                    }

                    $href = trim( (string) $anchor->getAttribute( 'href' ) );

                    if ( '' === $href ) {
                        continue;
                    }

                    if ( ! $this->is_image_candidate_href( $href ) ) {
                        continue;
                    }

                    if ( $this->dom_element_contains_media( $anchor ) ) {
                        return true;
                    }
                }
            }
        }

        return $this->fallback_regex_detects_linked_media( $html );
    }

    private function dom_element_contains_media( DOMElement $element ): bool {
        foreach ( $element->getElementsByTagName( 'img' ) as $image ) {
            if ( $image instanceof DOMElement && $this->dom_image_node_is_meaningful( $image ) ) {
                return true;
            }
        }

        foreach ( $element->getElementsByTagName( 'picture' ) as $picture ) {
            if ( ! $picture instanceof DOMElement ) {
                continue;
            }

            if ( $picture->getElementsByTagName( 'img' )->length > 0 ) {
                return true;
            }

            if ( $picture->getElementsByTagName( 'source' )->length > 0 ) {
                return true;
            }
        }

        return false;
    }

    private function dom_image_node_is_meaningful( DOMElement $image ): bool {
        $attributes_to_check = [ 'src', 'data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'srcset' ];

        foreach ( $attributes_to_check as $attribute ) {
            $value = trim( (string) $image->getAttribute( $attribute ) );

            if ( '' !== $value ) {
                return true;
            }
        }

        return true;
    }

    private function fallback_regex_detects_linked_media( string $html ): bool {
        if ( '' === trim( $html ) ) {
            return false;
        }

        $pattern = '#<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>#is';

        if ( ! preg_match_all( $pattern, $html, $matches, PREG_SET_ORDER ) ) {
            return false;
        }

        foreach ( $matches as $match ) {
            if ( count( $match ) < 3 ) {
                continue;
            }

            $href       = trim( (string) $match[1] );
            $inner_html = $match[2];

            if ( '' === $href ) {
                continue;
            }

            if ( ! $this->is_image_candidate_href( $href ) ) {
                continue;
            }

            if ( false !== stripos( $inner_html, '<img' ) || false !== stripos( $inner_html, '<picture' ) ) {
                return true;
            }
        }

        return false;
    }

    private function is_image_candidate_href( string $href ): bool {
        if ( $this->is_image_url( $href ) ) {
            return true;
        }

        return $this->is_attachment_permalink( $href );
    }

    private function normalize_cached_detection_value( array $cached_value, WP_Post $post ): ?array {
        if ( ! array_key_exists( 'has_linked_images', $cached_value ) ) {
            return null;
        }

        $has_linked_images = (bool) $cached_value['has_linked_images'];
        $cached_signature   = isset( $cached_value['signature'] ) ? (string) $cached_value['signature'] : '';

        if ( '' === $cached_signature ) {
            return null;
        }

        $snapshot = $this->build_detection_snapshot( $post, $has_linked_images );

        if ( $cached_signature !== $snapshot['signature'] ) {
            return null;
        }

        $snapshot['generated_at'] = isset( $cached_value['generated_at'] ) ? absint( $cached_value['generated_at'] ) : time();

        return $snapshot;
    }

    private function build_detection_snapshot( WP_Post $post, bool $has_linked_images ): array {
        $content_hash = sha1( (string) $post->post_content );
        $reusable     = $this->collect_reusable_block_references_from_content( $post );

        if ( ! empty( $reusable ) ) {
            ksort( $reusable );
        }

        $signature_parts = [ $content_hash ];

        foreach ( $reusable as $ref => $value ) {
            $signature_parts[] = $ref . ':' . $value;
        }

        $signature = sha1( implode( '|', $signature_parts ) );

        return [
            'has_linked_images' => $has_linked_images,
            'signature'         => $signature,
            'content_hash'      => $content_hash,
            'reusable'          => $reusable,
        ];
    }

    private function collect_reusable_block_references_from_content( WP_Post $post ): array {
        $content = (string) $post->post_content;

        if ( '' === $content ) {
            return [];
        }

        $pattern = '/"ref"\s*:\s*(\d+)/';
        preg_match_all( $pattern, $content, $matches );

        if ( empty( $matches[1] ) ) {
            return [];
        }

        $ids        = array_unique( array_map( 'absint', (array) $matches[1] ) );
        $signatures = [];

        foreach ( $ids as $ref_id ) {
            if ( ! $ref_id ) {
                continue;
            }

            $signature = $this->resolve_reusable_block_signature( $ref_id );

            if ( null !== $signature ) {
                $signatures[ $ref_id ] = $signature;
            }
        }

        return $signatures;
    }

    private function resolve_reusable_block_signature( int $ref_id ): ?string {
        if ( array_key_exists( $ref_id, $this->reusable_block_signature_cache ) ) {
            return $this->reusable_block_signature_cache[ $ref_id ];
        }

        $reusable = get_post( $ref_id );

        if ( ! ( $reusable instanceof WP_Post ) || 'wp_block' !== $reusable->post_type ) {
            $this->reusable_block_signature_cache[ $ref_id ] = null;

            return null;
        }

        $modified_gmt = $reusable->post_modified_gmt ?: $reusable->post_modified;
        $signature    = sha1( (string) $reusable->post_content );

        $timestamp = '';

        if ( $modified_gmt ) {
            $timestamp = (string) strtotime( $modified_gmt );
        }

        $payload = $timestamp . '|' . $signature;

        $this->reusable_block_signature_cache[ $ref_id ] = $payload;

        return $payload;
    }
}
