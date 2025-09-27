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

        mga_refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

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

        mga_refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

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

        mga_refresh_post_linked_images_cache_on_save( $page_id, get_post( $page_id ) );

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

        mga_refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

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

        mga_refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Reusable blocks containing linked media should update the cache flag to one.'
        );
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

        mga_refresh_post_linked_images_cache_on_save( $post_id, get_post( $post_id ) );

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

    private function reset_plugin_state() {
        delete_option( 'mga_settings' );

        global $wpdb;
        $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => '_mga_has_linked_images' ] );
    }
}
