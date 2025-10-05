<?php
/**
 * @group cache
 */
class PostCacheMaintenanceTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        $this->reset_plugin_state();
    }

    public function tearDown(): void {
        $this->reset_plugin_state();

        parent::tearDown();
    }

    /**
     * Tracked post types should store a "1" meta flag when linked media is detected.
     */
    public function test_tracked_post_type_records_linked_image_meta() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Tracked posts should store a positive cache flag when linked media is detected.'
        );
    }

    /**
     * Tracked post types without linked media should store a "0" meta flag.
     */
    public function test_tracked_post_type_without_linked_media_records_zero() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => '<p>No linked media here.</p>',
            ]
        );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        $this->assertSame(
            '0',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Tracked posts without linked media should store a zero cache flag.'
        );
    }

    /**
     * Post types that are not tracked should leave the cache meta untouched.
     */
    public function test_untracked_post_type_leaves_cache_untouched() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $page_id = self::factory()->post->create(
            [
                'post_type'    => 'page',
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        update_post_meta( $page_id, '_mga_has_linked_images', 'original' );

        $this->detection()->refresh_post_linked_images_cache_on_save( $page_id, get_post( $page_id ) );

        $this->assertSame(
            'original',
            get_post_meta( $page_id, '_mga_has_linked_images', true ),
            'Untracked post types should not modify the cache meta value.'
        );
    }

    /**
     * Posts that only contain reusable blocks without linked media should clear any cached flag.
     */
    public function test_reusable_block_without_linked_media_clears_cache() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_content' => '<!-- wp:paragraph --><p>Reusable content</p><!-- /wp:paragraph -->',
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_block_id ),
            ]
        );

        update_post_meta( $post_id, '_mga_has_linked_images', '1' );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        $this->assertSame(
            '',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Reusable blocks without linked media should clear the cached flag.'
        );
    }

    /**
     * Posts that embed reusable blocks with linked media should update the cache to "1".
     */
    public function test_reusable_block_with_linked_media_sets_cache() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_content' => '<!-- wp:image {"id":123,"linkDestination":"media","url":"https://example.com/image.jpg"} -->'
                    . '<figure class="wp-block-image"><a href="https://example.com/image.jpg">'
                    . '<img src="https://example.com/image.jpg" class="wp-image-123" /></a></figure><!-- /wp:image -->',
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_block_id ),
            ]
        );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Reusable blocks containing linked media should update the cache flag to one.'
        );
    }

    public function test_default_tracked_post_types_are_shared_between_cache_and_enqueue() {
        delete_option( 'mga_settings' );

        $post_id = self::factory()->post->create(
            [
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $post = get_post( $post_id );
        $this->assertInstanceOf( WP_Post::class, $post );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, $post );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'The cache refresh should track default post types when settings are missing.'
        );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertTrue(
            $this->detection()->should_enqueue_assets( $post_id ),
            'The enqueue logic should use the same default tracked post types as the cache refresh.'
        );
    }

    public function test_filtered_tracked_post_types_are_shared_between_cache_and_enqueue() {
        register_post_type(
            'mga_book',
            [
                'public' => true,
                'label'  => 'Book',
            ]
        );

        $filter = static function ( $post_types, $post ) {
            $post_types[] = 'mga_book';

            return $post_types;
        };

        add_filter( 'mga_tracked_post_types', $filter, 10, 2 );

        try {
            update_option(
                'mga_settings',
                [
                    'tracked_post_types' => [ 'post' ],
                ]
            );

            $book_id = self::factory()->post->create(
                [
                    'post_type'    => 'mga_book',
                    'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
                ]
            );

            $book_post = get_post( $book_id );
            $this->assertInstanceOf( WP_Post::class, $book_post );

            $this->detection()->refresh_post_linked_images_cache_on_save( $book_id, $book_post );

            $this->assertSame(
                '1',
                get_post_meta( $book_id, '_mga_has_linked_images', true ),
                'Filtered tracked post types should trigger cache refreshes for custom post types.'
            );

            $this->go_to( get_permalink( $book_id ) );

            $this->assertTrue(
                $this->detection()->should_enqueue_assets( $book_id ),
                'The enqueue logic should respect the same filtered tracked post types as the cache refresh.'
            );
        } finally {
            remove_filter( 'mga_tracked_post_types', $filter, 10 );
            unregister_post_type( 'mga_book' );
        }
    }

    /**
     * Invalid settings should fall back to defaults without emitting warnings.
     */
    public function test_invalid_settings_option_falls_back_to_defaults_without_warnings() {
        update_option( 'mga_settings', 'invalid' );

        $post_id = self::factory()->post->create(
            [
                'post_content' => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
            ]
        );

        $warnings = [];

        set_error_handler(
            static function ( $errno, $errstr ) use ( &$warnings ) {
                if ( E_WARNING === $errno ) {
                    $warnings[] = $errstr;

                    return true;
                }

                return false;
            }
        );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        restore_error_handler();

        $this->assertSame(
            [],
            $warnings,
            'Invalid settings should not trigger PHP warnings.'
        );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Invalid settings should fall back to defaults and detect linked images on tracked post types.'
        );
    }

    /**
     * Posts that depend on reusable blocks should clear cached detections so block edits take effect immediately.
     */
    public function test_reusable_block_cache_is_purged_when_block_is_updated() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_content' => '<!-- wp:image {"linkDestination":"media"} -->'
                    . '<figure class="wp-block-image"><a href="https://example.com/image.jpg">'
                    . '<img src="https://example.com/image.jpg" /></a></figure><!-- /wp:image -->',
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_block_id ),
            ]
        );

        $post = get_post( $post_id );
        $this->assertInstanceOf( WP_Post::class, $post );
        $this->assertTrue(
            $this->detection()->detect_post_linked_images( $post ),
            'The initial reusable block should expose linked media to the detector.'
        );

        $this->detection()->refresh_post_linked_images_cache_on_save( $post_id, $post );

        $this->assertSame(
            '',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Posts referencing reusable blocks should not persist cached flags after detection.'
        );

        wp_update_post(
            [
                'ID'           => $reusable_block_id,
                'post_content' => '<!-- wp:paragraph --><p>Reusable content without links.</p><!-- /wp:paragraph -->',
            ]
        );
        clean_post_cache( $reusable_block_id );

        $detection_runs = 0;
        $marker_filter  = static function ( $block_names ) use ( &$detection_runs ) {
            $detection_runs++;

            return $block_names;
        };

        add_filter( 'mga_linked_image_blocks', $marker_filter );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertFalse(
            $this->detection()->should_enqueue_assets( $post_id ),
            'Removing linked media from the reusable block should disable the enqueue logic.'
        );

        $this->assertSame(
            1,
            $detection_runs,
            'Detection should re-run for posts containing reusable blocks on each request.'
        );

        remove_filter( 'mga_linked_image_blocks', $marker_filter );

        $this->assertSame(
            '',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Posts referencing reusable blocks should continue to avoid caching after block updates.'
        );
    }

    public function test_detection_setting_update_purges_cached_meta() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $post_id = self::factory()->post->create();

        update_post_meta( $post_id, '_mga_has_linked_images', '1' );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Sanity check: the cached meta flag should exist before updating the settings.'
        );

        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'page' ],
            ]
        );

        $this->assertSame(
            '',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Updating detection-related settings should clear cached detection results.'
        );
    }

    public function test_unrelated_setting_update_preserves_cached_meta() {
        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
            ]
        );

        $post_id = self::factory()->post->create();

        update_post_meta( $post_id, '_mga_has_linked_images', '1' );

        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post' ],
                'delay'              => 8,
            ]
        );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Updating unrelated settings should keep the cached detection results intact.'
        );
    }

    private function detection(): \MaGalerieAutomatique\Content\Detection {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->detection();
    }

    private function reset_plugin_state() {
        delete_option( 'mga_settings' );

        global $wpdb;
        $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => '_mga_has_linked_images' ] );
    }
}
