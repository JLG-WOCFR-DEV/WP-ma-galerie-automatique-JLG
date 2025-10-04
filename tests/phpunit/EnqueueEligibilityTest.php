<?php
/**
 * @group enqueue
 */
class EnqueueEligibilityTest extends WP_UnitTestCase {
    /**
     * Tracks custom post types registered during a test run so they can be unregistered in tearDown().
     *
     * @var string[]
     */
    protected $registered_post_types = [];

    public function setUp(): void {
        parent::setUp();
        update_option( 'mga_settings', [] );
    }

    public function tearDown(): void {
        foreach ( $this->registered_post_types as $post_type ) {
            unregister_post_type( $post_type );
        }

        $this->registered_post_types = [];

        parent::tearDown();
    }

    /**
     * Ensures tracked post types trigger the enqueue logic while untracked types are ignored.
     */
    public function test_tracked_post_types_are_respected() {
        $this->register_test_post_type( 'book' );
        $this->register_test_post_type( 'note' );

        update_option(
            'mga_settings',
            [
                'tracked_post_types' => [ 'post', 'book' ],
            ]
        );

        $linked_image_markup = '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>';

        $post_id       = self::factory()->post->create(
            [
                'post_content' => $linked_image_markup,
            ]
        );
        $tracked_id    = self::factory()->post->create(
            [
                'post_type'    => 'book',
                'post_content' => $linked_image_markup,
            ]
        );
        $untracked_id  = self::factory()->post->create(
            [
                'post_type'    => 'note',
                'post_content' => $linked_image_markup,
            ]
        );

        $this->go_to( get_permalink( $post_id ) );
        $this->assertTrue( $this->detection()->should_enqueue_assets( $post_id ), 'Default posts should be tracked when configured.' );

        $this->go_to( get_permalink( $tracked_id ) );
        $this->assertTrue( $this->detection()->should_enqueue_assets( $tracked_id ), 'Custom post types explicitly tracked should be enqueued.' );

        $this->go_to( get_permalink( $untracked_id ) );
        $this->assertFalse( $this->detection()->should_enqueue_assets( $untracked_id ), 'Custom post types omitted from the tracked list should not enqueue assets.' );
    }

    /**
     * Cached `_mga_has_linked_images` meta entries should bypass the expensive detection logic.
     */
    public function test_cached_meta_short_circuits_detection() {
        $detection_runs = 0;
        $marker_filter  = function( $block_names ) use ( &$detection_runs ) {
            $detection_runs++;

            return $block_names;
        };

        add_filter( 'mga_linked_image_blocks', $marker_filter );

        $linked_image_markup = '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>';

        // Baseline with no cache ensures the detection path runs.
        $uncached_id = self::factory()->post->create(
            [
                'post_content' => $linked_image_markup,
            ]
        );
        $this->go_to( get_permalink( $uncached_id ) );
        $detection_runs = 0;
        $this->assertTrue( $this->detection()->should_enqueue_assets( $uncached_id ) );
        $this->assertSame( 1, $detection_runs, 'Detection should run when the cache is empty.' );

        // Cached true values should short-circuit detection but still enqueue assets.
        $cached_true_id = self::factory()->post->create(
            [
                'post_content' => $linked_image_markup,
            ]
        );
        update_post_meta( $cached_true_id, '_mga_has_linked_images', 1 );
        $this->go_to( get_permalink( $cached_true_id ) );
        $detection_runs = 0;
        $this->assertTrue( $this->detection()->should_enqueue_assets( $cached_true_id ) );
        $this->assertSame( 0, $detection_runs, 'Detection should not run when cached meta indicates linked images.' );

        // Cached false values should also skip detection, even when reusable blocks are involved.
        $reusable_block_id = self::factory()->post->create(
            [
                'post_type'    => 'wp_block',
                'post_content' => '<!-- wp:image {"linkDestination":"media"} --><figure class="wp-block-image"><img src="https://example.com/reusable.jpg" /></figure><!-- /wp:image -->',
            ]
        );
        $reusable_wrapper_id = self::factory()->post->create(
            [
                'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_block_id ),
            ]
        );

        // Without cache the reusable block should trigger detection.
        $this->go_to( get_permalink( $reusable_wrapper_id ) );
        $detection_runs = 0;
        delete_post_meta( $reusable_wrapper_id, '_mga_has_linked_images' );
        $this->assertTrue( $this->detection()->should_enqueue_assets( $reusable_wrapper_id ) );
        $this->assertSame( 1, $detection_runs, 'Reusable blocks should be inspected when the cache is empty.' );

        // Cached false values take precedence and should skip detection work.
        $this->go_to( get_permalink( $reusable_wrapper_id ) );
        update_post_meta( $reusable_wrapper_id, '_mga_has_linked_images', 0 );
        $detection_runs = 0;
        $this->assertFalse( $this->detection()->should_enqueue_assets( $reusable_wrapper_id ) );
        $this->assertSame( 0, $detection_runs, 'Reusable block detection should be skipped when the cache forbids it.' );

        remove_filter( 'mga_linked_image_blocks', $marker_filter );
    }

    /**
     * The mga_force_enqueue filter overrides default guards and empty content is ignored otherwise.
     */
    public function test_force_enqueue_and_empty_content_behavior() {
        $post_id = self::factory()->post->create(
            [
                'post_content' => '   ',
            ]
        );

        // Singular context with empty content should not enqueue assets.
        $this->go_to( get_permalink( $post_id ) );
        $this->assertFalse( $this->detection()->should_enqueue_assets( $post_id ), 'Empty content should never enqueue assets by default.' );

        // Non-singular requests should bail out unless forced.
        $this->go_to( home_url( '/' ) );
        $this->assertFalse( $this->detection()->should_enqueue_assets( $post_id ), 'Non-singular requests should bail out.' );

        add_filter( 'mga_force_enqueue', '__return_true' );
        $this->assertTrue( $this->detection()->should_enqueue_assets( $post_id ), 'The force enqueue filter should override context and content checks.' );
        remove_filter( 'mga_force_enqueue', '__return_true' );
    }

    /**
     * Galleries that disable linking should not trigger the enqueue logic via the shortcode fallback.
     */
    public function test_gallery_without_links_is_ignored_by_shortcode_fallback() {
        $gallery_markup = <<<'HTML'
<!-- wp:gallery {"linkDestination":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped">
    <figure class="wp-block-image size-large"><img src="https://example.com/gallery-one.jpg" alt="" /></figure>
</figure>
<!-- /wp:gallery -->
HTML;

        $post_id = self::factory()->post->create(
            [
                'post_content' => $gallery_markup,
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertFalse(
            $this->detection()->should_enqueue_assets( $post_id ),
            'Galleries that do not link to files should be ignored by the fallback detection.'
        );
    }

    /**
     * Galleries linking to media files should continue to enqueue assets after the fallback adjustments.
     */
    public function test_gallery_linked_to_media_triggers_enqueue() {
        $gallery_markup = <<<'HTML'
<!-- wp:gallery {"linkDestination":"media"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped">
    <figure class="wp-block-image size-large"><a href="https://example.com/gallery-two.jpg"><img src="https://example.com/gallery-two.jpg" alt="" /></a></figure>
</figure>
<!-- /wp:gallery -->
HTML;

        $post_id = self::factory()->post->create(
            [
                'post_content' => $gallery_markup,
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertTrue(
            $this->detection()->should_enqueue_assets( $post_id ),
            'Galleries linking to media files should still enqueue assets.'
        );
    }

    /**
     * Image blocks linking to attachment pages should enqueue assets to enable the lightbox.
     */
    public function test_core_image_linking_to_attachment_triggers_enqueue() {
        $attachment_id = self::factory()->attachment->create_upload_object(
            DIR_TESTDATA . '/images/canola.jpg'
        );

        $this->assertNotWPError( $attachment_id, 'Attachment creation should succeed.' );
        $this->assertNotEmpty( $attachment_id, 'An attachment ID should be returned.' );

        $image_src  = wp_get_attachment_image_url( $attachment_id, 'full' );
        $image_link = get_attachment_link( $attachment_id );

        $this->assertNotFalse( $image_src, 'The attachment should provide a source URL.' );
        $this->assertNotFalse( $image_link, 'The attachment should expose a permalink.' );
        $block_markup = sprintf(
            '<!-- wp:image {"id":%1$d,"linkDestination":"attachment"} -->'
            . '<figure class="wp-block-image"><a href="%2$s"><img src="%3$s" class="wp-image-%1$d" /></a></figure>'
            . '<!-- /wp:image -->',
            $attachment_id,
            $image_link,
            $image_src
        );

        $post_id = self::factory()->post->create(
            [
                'post_content' => $block_markup,
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        $this->assertTrue(
            $this->detection()->should_enqueue_assets( $post_id ),
            'Image blocks linked to attachments should enqueue assets.'
        );
    }

    /**
     * Forcing an enqueue on non singular views without a global WP_Post should not trigger notices.
     */
    public function test_force_enqueue_without_global_post_object() {
        $this->go_to( home_url( '/' ) );

        $previous_global_post = $GLOBALS['post'] ?? null;
        $GLOBALS['post']      = null;

        add_filter( 'mga_force_enqueue', '__return_true' );

        try {
            $this->assertTrue( $this->detection()->should_enqueue_assets( null ), 'Forced enqueues should succeed even when no global post is available.' );
        } finally {
            remove_filter( 'mga_force_enqueue', '__return_true' );
            $GLOBALS['post'] = $previous_global_post;
        }
    }

    /**
     * Password protected posts should not enqueue assets until unlocked by the visitor.
     */
    public function test_password_protected_posts_require_unlocked_access() {
        $post_id = self::factory()->post->create(
            [
                'post_content'  => '<a href="https://example.com/image.jpg"><img src="https://example.com/image.jpg" /></a>',
                'post_password' => 'secret',
            ]
        );

        $this->go_to( get_permalink( $post_id ) );

        $cookie_key = 'wp-postpass_' . COOKIEHASH;
        unset( $_COOKIE[ $cookie_key ] );

        $this->assertTrue( post_password_required( $post_id ), 'Visiting a protected post without the access cookie should still require the password.' );
        $this->assertFalse( $this->detection()->should_enqueue_assets( $post_id ), 'Assets should not enqueue for locked password protected posts.' );
    }

    private function detection(): \MaGalerieAutomatique\Content\Detection {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->detection();
    }

    /**
     * Registers a public post type for test scenarios and tracks it for tearDown cleanup.
     *
     * @param string $post_type Custom post type slug.
     */
    protected function register_test_post_type( $post_type ) {
        register_post_type(
            $post_type,
            [
                'label'  => $post_type,
                'public' => true,
            ]
        );

        $this->registered_post_types[] = $post_type;
    }
}
