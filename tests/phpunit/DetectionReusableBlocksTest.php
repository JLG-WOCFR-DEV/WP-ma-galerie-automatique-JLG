<?php
/**
 * @group detection
 */
class DetectionReusableBlocksTest extends WP_UnitTestCase {
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

    public function test_reusable_block_prefetch_hooks_are_triggered(): void {
        $attachment_id = $this->create_test_attachment();
        $attachment_link = get_attachment_link( $attachment_id );
        $thumbnail_url   = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );

        $this->assertNotEmpty( $attachment_link, 'Attachments should expose a permalink suitable for detection.' );
        $this->assertNotEmpty( $thumbnail_url, 'Attachments should expose a thumbnail URL suitable for detection.' );

        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_content' => sprintf(
                    '<!-- wp:image {"isLink":true,"href":"%1$s"} --><figure class="wp-block-image"><a href="%1$s"><img src="%2$s" alt="Reusable" /></a></figure><!-- /wp:image -->',
                    esc_url( $attachment_link ),
                    esc_url( $thumbnail_url )
                ),
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf(
                    '<!-- wp:block {"ref":%d} /-->',
                    $reusable_block_id
                ),
            ]
        );

        $post = get_post( $post_id );
        $this->assertInstanceOf( WP_Post::class, $post, 'The test post should exist.' );

        $prefetch_filter_invocations = 0;
        $prefetch_action_payload     = [];

        $filter = function ( array $args, array $refs ) use ( $reusable_block_id, &$prefetch_filter_invocations ): array {
            $prefetch_filter_invocations++;

            $this->assertContains( $reusable_block_id, $refs, 'The reusable block ID should be part of the prefetch references.' );

            return $args;
        };

        $action = function ( array $refs, array $parsed_blocks ) use ( $reusable_block_id, &$prefetch_action_payload ): void {
            $prefetch_action_payload = [ $refs, $parsed_blocks ];

            $this->assertArrayHasKey( $reusable_block_id, $parsed_blocks, 'The parsed block map should include the reusable block ID.' );
        };

        add_filter( 'mga_prepare_reusable_block_prefetch_args', $filter, 10, 2 );
        add_action( 'mga_reusable_block_prefetched', $action, 10, 2 );

        try {
            $this->assertTrue(
                $this->detection()->detect_post_linked_images( $post ),
                'The reusable block should trigger linked media detection once prefetched.'
            );
        } finally {
            remove_filter( 'mga_prepare_reusable_block_prefetch_args', $filter, 10 );
            remove_action( 'mga_reusable_block_prefetched', $action, 10 );
        }

        $this->assertSame( 1, $prefetch_filter_invocations, 'The prefetch filter should run exactly once.' );
        $this->assertNotEmpty( $prefetch_action_payload, 'The prefetch action should receive a payload.' );
    }

    public function test_block_contains_linked_media_filter_short_circuits_detection(): void {
        $blocks = [
            [
                'blockName'   => 'core/paragraph',
                'innerBlocks' => [],
                'attrs'       => [],
            ],
        ];

        $allowed_blocks = [];

        $this->assertFalse(
            $this->detection()->blocks_contain_linked_media( $blocks, $allowed_blocks ),
            'Without any filter, the paragraph block should not be considered linked media.'
        );

        $filter = static function ( $value, array $block ) {
            if ( isset( $block['blockName'] ) && 'core/paragraph' === $block['blockName'] ) {
                return true;
            }

            return $value;
        };

        add_filter( 'mga_block_contains_linked_media', $filter, 10, 2 );

        try {
            $this->assertTrue(
                $this->detection()->blocks_contain_linked_media( $blocks, $allowed_blocks ),
                'The filter should allow short-circuiting detection for custom strategies.'
            );
        } finally {
            remove_filter( 'mga_block_contains_linked_media', $filter, 10 );
        }
    }

    private function create_test_attachment(): int {
        $image_data = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAE/wH+ozH4QwAAAABJRU5ErkJggg==' );
        $this->assertNotFalse( $image_data, 'The fixture image should decode correctly.' );

        $upload = wp_upload_bits( 'detection-reusable.png', null, $image_data );
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
