<?php
/**
 * @group settings
 */
class DetectionSettingsPurgeTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        update_option( 'mga_settings', [] );
    }

    public function test_detection_setting_change_purges_cache() {
        $post_id = self::factory()->post->create();
        update_post_meta( $post_id, '_mga_has_linked_images', '1' );

        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'Plugin instance should be available.' );

        $old_settings = [
            'tracked_post_types' => [ 'post', 'page' ],
            'contentSelectors'   => [ '.entry-content' ],
            'allowBodyFallback'  => false,
            'groupAttribute'     => 'data-mga-gallery',
        ];

        $new_settings = [
            'tracked_post_types' => [ 'page' ],
            'contentSelectors'   => [ '.entry-content' ],
            'allowBodyFallback'  => false,
            'groupAttribute'     => 'data-mga-gallery',
        ];

        $plugin->maybe_purge_detection_cache( $old_settings, $new_settings, 'mga_settings' );

        $this->assertSame(
            '',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Detection cache should be purged when tracked post types change.'
        );
    }

    public function test_unrelated_setting_change_preserves_cache() {
        $post_id = self::factory()->post->create();
        update_post_meta( $post_id, '_mga_has_linked_images', '0' );

        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'Plugin instance should be available.' );

        $baseline = [
            'tracked_post_types' => [ 'post', 'page' ],
            'contentSelectors'   => [ '.entry-content' ],
            'allowBodyFallback'  => false,
            'groupAttribute'     => 'data-mga-gallery',
        ];

        $old_settings = $baseline;
        $new_settings = $baseline;
        $new_settings['debug_mode'] = true; // Not a detection setting.

        $plugin->maybe_purge_detection_cache( $old_settings, $new_settings, 'mga_settings' );

        $this->assertSame(
            '0',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Cache should survive when detection settings remain unchanged.'
        );
    }

    public function test_normalized_selector_equivalence_does_not_trigger_purge() {
        $post_id = self::factory()->post->create();
        update_post_meta( $post_id, '_mga_has_linked_images', '1' );

        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'Plugin instance should be available.' );

        $old_settings = [
            'tracked_post_types' => [ 'post', 'page' ],
            'contentSelectors'   => [ '.entry-content' ],
            'allowBodyFallback'  => false,
            'groupAttribute'     => 'data-mga-gallery',
        ];

        $new_settings = [
            'tracked_post_types' => [ 'page', 'post' ],
            'contentSelectors'   => [ "\n  .entry-content  ", '.entry-content' ],
            'allowBodyFallback'  => false,
            'groupAttribute'     => 'DATA-MGA-GALLERY',
        ];

        $plugin->maybe_purge_detection_cache( $old_settings, $new_settings, 'mga_settings' );

        $this->assertSame(
            '1',
            get_post_meta( $post_id, '_mga_has_linked_images', true ),
            'Cache should persist when detection settings normalize to the same snapshot.'
        );
    }
}
