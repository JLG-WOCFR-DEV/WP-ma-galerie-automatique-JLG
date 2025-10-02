<?php
/**
 * Tests for Frontend\Assets::refresh_swiper_asset_sources().
 */

if ( ! function_exists( 'mga_refresh_swiper_asset_sources' ) ) {
    require_once dirname( __DIR__ ) . '/../ma-galerie-automatique/ma-galerie-automatique.php';
}

if ( ! function_exists( 'plugin_basename' ) ) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

class MGA_Swiper_Asset_Sources_Test extends WP_UnitTestCase {

    protected function tearDown(): void {
        delete_option( 'mga_swiper_asset_sources' );

        parent::tearDown();
    }

    public function test_autoload_value_remains_no_after_refresh() {

        global $wpdb;

        delete_option( 'mga_swiper_asset_sources' );
        add_option( 'mga_swiper_asset_sources', [
            'css' => 'cdn',
            'js'  => 'cdn',
        ], '', 'no' );

        $this->assets()->refresh_swiper_asset_sources();

        $autoload = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT autoload FROM {$wpdb->options} WHERE option_name = %s",
                'mga_swiper_asset_sources'
            )
        );

        $this->assertSame( 'no', $autoload );
    }

    public function test_swiper_sources_refreshed_when_plugin_in_upgrade_batch() {
        global $wpdb;

        $plugin_basename = plugin_basename( dirname( __DIR__ ) . '/ma-galerie-automatique/ma-galerie-automatique.php' );
        $sentinel = [
            'css'        => 'cdn',
            'js'         => 'cdn',
            'checked_at' => 1,
        ];

        delete_option( 'mga_swiper_asset_sources' );
        add_option( 'mga_swiper_asset_sources', $sentinel, '', 'no' );

        do_action(
            'upgrader_process_complete',
            new stdClass(),
            [
                'type'    => 'plugin',
                'plugins' => [ $plugin_basename ],
            ]
        );

        $sources = get_option( 'mga_swiper_asset_sources' );

        $this->assertIsArray( $sources );
        $this->assertArrayHasKey( 'checked_at', $sources );
        $this->assertGreaterThan( $sentinel['checked_at'], $sources['checked_at'] );

        $autoload = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT autoload FROM {$wpdb->options} WHERE option_name = %s",
                'mga_swiper_asset_sources'
            )
        );

        $this->assertSame( 'no', $autoload );
    }

    public function test_swiper_sources_not_refreshed_when_plugin_not_in_upgrade_batch() {
        $sentinel = [
            'css'        => 'cdn',
            'js'         => 'cdn',
            'checked_at' => 1,
        ];

        delete_option( 'mga_swiper_asset_sources' );
        add_option( 'mga_swiper_asset_sources', $sentinel, '', 'no' );

        do_action(
            'upgrader_process_complete',
            new stdClass(),
            [
                'type'    => 'plugin',
                'plugins' => [ 'another-plugin/another-plugin.php' ],
            ]
        );

        $sources = get_option( 'mga_swiper_asset_sources' );

        $this->assertSame( $sentinel, $sources );
    }

    public function test_swiper_sources_refreshed_when_cache_is_stale() {
        $stale_timestamp = time() - DAY_IN_SECONDS;

        $sentinel = [
            'css'        => 'cdn',
            'js'         => 'cdn',
            'checked_at' => $stale_timestamp,
        ];

        delete_option( 'mga_swiper_asset_sources' );
        add_option( 'mga_swiper_asset_sources', $sentinel, '', 'no' );

        $sources = $this->assets()->get_swiper_asset_sources();

        $this->assertIsArray( $sources );
        $this->assertArrayHasKey( 'checked_at', $sources );
        $this->assertGreaterThan( $sentinel['checked_at'], $sources['checked_at'], 'Expected stale sources to be refreshed.' );

        $persisted_sources = get_option( 'mga_swiper_asset_sources' );

        $this->assertSame( $sources, $persisted_sources, 'Refreshed sources should be persisted in the option.' );
    }

    private function assets(): \MaGalerieAutomatique\Frontend\Assets {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin, 'The plugin instance should be available.' );

        return $plugin->frontend_assets();
    }
}
