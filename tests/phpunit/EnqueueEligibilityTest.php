<?php
/**
 * Tests for mga_should_enqueue_assets().
 */

class EnqueueEligibilityTest extends WP_UnitTestCase {
    protected function setUp(): void {
        parent::setUp();

        delete_option( 'mga_settings' );
    }

    protected function tearDown(): void {
        remove_all_filters( 'mga_force_enqueue' );
        remove_all_filters( 'mga_linked_image_blocks' );
        remove_all_filters( 'mga_post_has_linked_images' );

        parent::tearDown();
    }

    public function test_enqueue_only_for_tracked_post_types(): void {
        register_post_type(
            'mga_tracked',
            [
                'public' => true,
                'label'  => 'Tracked',
            ]
        );

        register_post_type(
            'mga_untracked',
            [
                'public' => true,
                'label'  => 'Untracked',
            ]
        );

        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'mga_tracked' ],
            ]
        );

        $tracked_post_id = self::factory()->post->create(
            [
                'post_type'    => 'mga_tracked',
                'post_content' => '<a href="https://example.com/full.jpg"><img src="https://example.com/thumb.jpg" /></a>',
            ]
        );

        $untracked_post_id = self::factory()->post->create(
            [
                'post_type'    => 'mga_untracked',
                'post_content' => '<a href="https://example.com/full.jpg"><img src="https://example.com/thumb.jpg" /></a>',
            ]
        );

        $this->go_to( get_permalink( $tracked_post_id ) );
        $this->assertTrue( mga_should_enqueue_assets( $tracked_post_id ), 'Tracked post type should enqueue assets.' );

        $this->go_to( get_permalink( $untracked_post_id ) );
        $this->assertFalse( mga_should_enqueue_assets( $untracked_post_id ), 'Untracked post type should not enqueue assets.' );

        unregister_post_type( 'mga_tracked' );
        unregister_post_type( 'mga_untracked' );
    }

    public function test_cached_meta_short_circuits_detection(): void {
        $first_post_id = self::factory()->post->create(
            [
                'post_content' => '<p>Placeholder without images.</p>',
            ]
        );

        $second_post_id = self::factory()->post->create(
            [
                'post_content' => '<p>Another placeholder without images.</p>',
            ]
        );

        update_post_meta( $first_post_id, '_mga_has_linked_images', '1' );
        update_post_meta( $second_post_id, '_mga_has_linked_images', '0' );

        $block_filter_calls = 0;
        add_filter(
            'mga_linked_image_blocks',
            function ( $blocks ) use ( &$block_filter_calls ) {
                $block_filter_calls++;

                return $blocks;
            }
        );

        $this->go_to( get_permalink( $first_post_id ) );
        $this->assertTrue( mga_should_enqueue_assets( $first_post_id ) );

        $this->go_to( get_permalink( $second_post_id ) );
        $this->assertFalse( mga_should_enqueue_assets( $second_post_id ) );

        $this->assertSame( 0, $block_filter_calls, 'Cached values should prevent block inspection.' );
    }

    public function test_reusable_block_bypasses_false_cache(): void {
        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_title'   => 'Linked images block',
                'post_content' => '<a href="https://example.com/full.jpg"><img src="https://example.com/thumb.jpg" /></a>',
            ]
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_block_id ),
            ]
        );

        mga_update_post_linked_images_cache( $post_id, false );

        $this->assertSame( '', get_post_meta( $post_id, '_mga_has_linked_images', true ), 'Reusable block posts should not keep a false cache.' );

        $block_filter_calls = 0;
        add_filter(
            'mga_linked_image_blocks',
            function ( $blocks ) use ( &$block_filter_calls ) {
                $block_filter_calls++;

                return $blocks;
            }
        );

        add_filter(
            'mga_post_has_linked_images',
            static function () {
                return true;
            }
        );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertTrue( mga_should_enqueue_assets( $post_id ) );
        $this->assertGreaterThan( 0, $block_filter_calls, 'Detection should run when the cache is cleared for reusable blocks.' );
    }

    public function test_force_enqueue_filter_and_empty_content_behavior(): void {
        $empty_post_id = self::factory()->post->create(
            [
                'post_content' => '   ',
            ]
        );

        $this->go_to( get_permalink( $empty_post_id ) );
        $this->assertFalse( mga_should_enqueue_assets( $empty_post_id ) );

        $non_singular_post_id = self::factory()->post->create(
            [
                'post_content' => '',
            ]
        );

        $this->go_to( home_url( '/' ) );

        add_filter(
            'mga_force_enqueue',
            static function () {
                return true;
            }
        );

        $this->assertTrue( mga_should_enqueue_assets( $non_singular_post_id ) );
    }
}
