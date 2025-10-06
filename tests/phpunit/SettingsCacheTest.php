<?php
/**
 * @group settings
 */
class SettingsCacheTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        update_option( 'mga_settings', [] );

        $plugin = mga_plugin();

        if ( $plugin instanceof \MaGalerieAutomatique\Plugin ) {
            $plugin->settings()->invalidate_settings_cache();
        }
    }

    public function tearDown(): void {
        remove_all_filters( 'pre_option_mga_settings' );

        parent::tearDown();
    }

    public function test_get_sanitized_settings_uses_cache_until_invalidated() {
        $plugin   = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        $settings = $plugin->settings();

        $calls         = 0;
        $valueProvider = [ 'delay' => 5 ];

        add_filter(
            'pre_option_mga_settings',
            function () use ( &$calls, &$valueProvider ) {
                $calls++;
                return $valueProvider;
            }
        );

        $first  = $settings->get_sanitized_settings();
        $second = $settings->get_sanitized_settings();

        $this->assertSame( 1, $calls, 'Subsequent calls should reuse the cached snapshot.' );
        $this->assertSame( $first, $second, 'Cached settings should be returned without recomputation.' );
        $this->assertSame( 5, $first['delay'], 'The sanitized value should match the provided option.' );

        $valueProvider = [ 'delay' => 9 ];
        $settings->invalidate_settings_cache();

        $third = $settings->get_sanitized_settings();

        $this->assertSame( 2, $calls, 'Cache invalidation should trigger a new option read.' );
        $this->assertSame( 9, $third['delay'], 'Invalidated caches should reflect the latest option snapshot.' );
    }

    public function test_option_updates_invalidate_cache_automatically() {
        $plugin   = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        $settings = $plugin->settings();

        update_option( 'mga_settings', [ 'delay' => 3 ] );
        $first = $settings->get_sanitized_settings();
        $this->assertSame( 3, $first['delay'], 'The cached snapshot should reflect the stored option value.' );

        update_option( 'mga_settings', [ 'delay' => 7 ] );
        $second = $settings->get_sanitized_settings();

        $this->assertSame( 7, $second['delay'], 'Updating the option should invalidate the cache automatically.' );
    }
}
