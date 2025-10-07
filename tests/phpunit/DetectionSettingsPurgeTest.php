<?php

use MaGalerieAutomatique\Content\Detection;
/**
 * @group settings
 */
class DetectionSettingsPurgeTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        update_option( 'mga_settings', [] );

        $plugin = mga_plugin();

        if ( $plugin instanceof \MaGalerieAutomatique\Plugin ) {
            $plugin->settings()->invalidate_settings_cache();
        }

        Detection::bump_global_cache_version();
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

        $this->assertCacheSnapshot( $post_id, false, 'Cache should survive when detection settings remain unchanged.' );
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

        $this->assertCacheSnapshot( $post_id, true, 'Cache should persist when detection settings normalize to the same snapshot.' );
    }

    private function assertCacheSnapshot( int $post_id, bool $expected, string $message ): void {
        $meta = get_post_meta( $post_id, '_mga_has_linked_images', true );

        $this->assertIsArray( $meta, 'Cache entries should be structured arrays after normalization.' );
        $this->assertArrayHasKey( 'has_linked_images', $meta );
        $this->assertSame( $expected, (bool) $meta['has_linked_images'], $message );
        $this->assertArrayHasKey( 'signature', $meta );
        $this->assertNotEmpty( $meta['signature'], 'Cache entries must include a non-empty signature.' );
        $this->assertArrayHasKey( 'settings_signature', $meta );
        $this->assertNotEmpty( $meta['settings_signature'], 'Cache entries must store a settings signature.' );
    }
}
