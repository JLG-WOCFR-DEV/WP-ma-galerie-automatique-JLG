<?php
/**
 * @group detection
 */
class DetectionHtmlParsingTest extends WP_UnitTestCase {
    private array $attachments = [];

    public function setUp(): void {
        parent::setUp();

        $this->reset_plugin_state();
    }

    public function tearDown(): void {
        foreach ( $this->attachments as $attachment_id ) {
            wp_delete_attachment( $attachment_id, true );
        }

        $this->attachments = [];

        $this->reset_plugin_state();

        parent::tearDown();
    }

    public function test_detects_attachment_permalink_wrapped_in_anchor(): void {
        $attachment_id = $this->create_test_attachment();

        $attachment_link = get_attachment_link( $attachment_id );
        $this->assertNotEmpty( $attachment_link, 'Attachment links should be generated for uploaded media.' );

        $thumbnail_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
        $this->assertNotEmpty( $thumbnail_url, 'Uploaded attachments should expose a thumbnail URL.' );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf(
                    '<figure class="wp-block-image"><a href="%s"><img src="%s" alt="Preview" /></a></figure>',
                    $attachment_link,
                    $thumbnail_url
                ),
            ]
        );

        $post = get_post( $post_id );
        $this->assertInstanceOf( WP_Post::class, $post, 'A valid post should be created for the detection test.' );

        $this->assertTrue(
            $this->detection()->detect_post_linked_images( $post ),
            'Attachment permalinks wrapping an image should trigger positive detection results.'
        );

        $this->assertTrue(
            $this->detection()->post_has_eligible_images( $post ),
            'Attachment permalinks should also be recognised by the legacy gallery detection helper.'
        );
    }

    public function test_gallery_html_detection_handles_lazy_loaded_images(): void {
        $html = '<div class="wp-block-gallery"><a href="https://example.com/full.jpg"><img data-src="https://example.com/lazy.jpg" alt="Lazy" /></a></div>';

        $this->assertTrue(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Lazy loaded images that only expose data attributes should be detected as linked media.'
        );
    }

    public function test_gallery_html_detection_supports_custom_source_attribute_filter(): void {
        $html = '<div class="wp-block-gallery"><a href="https://example.com/full.jpg"><img data-custom-src="https://example.com/lazy.jpg" alt="Custom" /></a></div>';

        $this->assertFalse(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Custom attributes should be ignored by default to avoid false positives.'
        );

        $filter = static function ( array $attributes, \DOMElement $image ): array {
            $attributes[] = 'data-custom-src';

            return $attributes;
        };

        add_filter( 'mga_image_source_attributes', $filter, 10, 2 );

        try {
            $this->assertTrue(
                $this->detection()->gallery_html_has_linked_media( $html ),
                'Attributes injected via the filter should be taken into account when evaluating image nodes.'
            );
        } finally {
            remove_filter( 'mga_image_source_attributes', $filter, 10 );
        }
    }

    public function test_gallery_html_detection_allows_meaningful_override_filter(): void {
        $html = '<div class="wp-block-gallery"><a href="https://example.com/full.jpg"><img alt="Override" /></a></div>';

        $this->assertFalse(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Images without any usable source attribute should be ignored to avoid false positives.'
        );

        $filter = static function ( bool $is_meaningful, \DOMElement $image, array $attributes ): bool {
            return true;
        };

        add_filter( 'mga_is_image_node_meaningful', $filter, 10, 3 );

        try {
            $this->assertTrue(
                $this->detection()->gallery_html_has_linked_media( $html ),
                'The override filter should allow integrations to mark custom <img> nodes as meaningful.'
            );
        } finally {
            remove_filter( 'mga_is_image_node_meaningful', $filter, 10 );
        }
    }

    public function test_gallery_html_ignores_images_without_sources(): void {
        $html = '<div class="wp-block-gallery"><a href="https://example.com/full.jpg"><img alt="Empty" /></a></div>';

        $this->assertFalse(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Images without any usable source attribute should be ignored to avoid false positives.'
        );
    }

    public function test_ignores_links_without_embedded_media(): void {
        $html = '<p><a href="https://example.com/full.jpg">View image</a></p>';

        $this->assertFalse(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Anchors without embedded media elements should be ignored even if the URL targets an image file.'
        );
    }

    public function test_is_image_url_supports_modern_formats(): void {
        $detection = $this->detection();

        $this->assertTrue( $detection->is_image_url( 'https://example.com/photo.heic' ), 'HEIC images should be recognised as valid media.' );
        $this->assertTrue( $detection->is_image_url( 'https://example.com/photo.heif' ), 'HEIF images should be recognised as valid media.' );
        $this->assertTrue( $detection->is_image_url( 'https://example.com/photo.jxl' ), 'JPEG XL images should be recognised as valid media.' );
    }

    public function test_is_image_url_respects_allowed_extensions_filter(): void {
        $callback = static function ( array $extensions ): array {
            return array_diff( $extensions, [ 'gif' ] );
        };

        add_filter( 'mga_allowed_image_extensions', $callback, 10, 1 );

        try {
            $this->assertFalse(
                $this->detection()->is_image_url( 'https://example.com/image.gif' ),
                'Filtered extensions should no longer be considered valid image URLs.'
            );
        } finally {
            remove_filter( 'mga_allowed_image_extensions', $callback, 10 );
        }
    }

    public function test_is_image_url_detects_extension_from_query_parameters(): void {
        $detection = $this->detection();

        $this->assertTrue(
            $detection->is_image_url( 'https://images.example.com/render?format=webp&quality=80' ),
            'Image services exposing the format via query parameters should be recognised.'
        );

        $this->assertTrue(
            $detection->is_image_url( 'https://cdn.example.com/asset?fm=avif&w=1600' ),
            'Alternative parameter names (fm) should also be detected.'
        );

        $this->assertFalse(
            $detection->is_image_url( 'https://images.example.com/render?format=pdf' ),
            'Unsupported format hints must not be treated as valid images.'
        );
    }

    public function test_is_image_url_detects_nested_query_urls(): void {
        $detection = $this->detection();

        $proxied_url = 'https://cdn.example.com/_next/image?url=' . rawurlencode( 'https://example.com/photo.heic' ) . '&w=1920&q=75';

        $this->assertTrue(
            $detection->is_image_url( $proxied_url ),
            'Proxy URLs that reference an image through a nested parameter should be accepted.'
        );
    }

    public function test_gallery_html_detection_handles_proxied_images(): void {
        $original = 'https://example.com/uploads/photo.jpeg';
        $proxy    = 'https://cdn.example.com/_next/image?url=' . rawurlencode( $original ) . '&w=1600&q=80';

        $html = sprintf(
            '<div class="wp-block-gallery"><a href="%1$s"><img src="%2$s" alt="Proxy" /></a></div>',
            esc_url( $original ),
            esc_url( $proxy )
        );

        $this->assertTrue(
            $this->detection()->gallery_html_has_linked_media( $html ),
            'Gallery detection should treat proxied image URLs as meaningful sources.'
        );
    }

    private function create_test_attachment(): int {
        $image_data = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAE/wH+ozH4QwAAAABJRU5ErkJggg==' );
        $this->assertNotFalse( $image_data, 'The fixture image should decode correctly.' );

        $upload = wp_upload_bits( 'detection-fixture.png', null, $image_data );
        $this->assertIsArray( $upload, 'Uploading the fixture image should return a structured response.' );
        $this->assertArrayHasKey( 'file', $upload, 'Uploads should include the absolute file path.' );
        $this->assertArrayHasKey( 'error', $upload, 'Uploads should include an error key.' );
        $this->assertEmpty( $upload['error'], 'The fixture upload should not report any error.' );

        $attachment_id = self::factory()->attachment->create_upload_object( $upload['file'] );
        $this->attachments[] = $attachment_id;

        return $attachment_id;
    }

    private function detection(): \MaGalerieAutomatique\Content\Detection {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->detection();
    }

    private function reset_plugin_state(): void {
        delete_option( 'mga_settings' );

        global $wpdb;
        $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => '_mga_has_linked_images' ] );

        $plugin = mga_plugin();

        if ( $plugin instanceof \MaGalerieAutomatique\Plugin ) {
            $plugin->settings()->invalidate_settings_cache();
        }
    }
}
