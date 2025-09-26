<?php
/**
 * Tests for mga_refresh_swiper_asset_sources().
 */

if ( ! function_exists( 'mga_refresh_swiper_asset_sources' ) ) {
    require_once dirname( __DIR__ ) . '/../ma-galerie-automatique/ma-galerie-automatique.php';
}

class MGA_Swiper_Asset_Sources_Test extends WP_UnitTestCase {
    public function test_autoload_value_remains_no_after_refresh() {

        global $wpdb;

        delete_option( 'mga_swiper_asset_sources' );
        add_option( 'mga_swiper_asset_sources', [
            'css' => 'cdn',
            'js'  => 'cdn',
        ], '', 'no' );

        mga_refresh_swiper_asset_sources();

        $autoload = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT autoload FROM {$wpdb->options} WHERE option_name = %s",
                'mga_swiper_asset_sources'
            )
        );

        $this->assertSame( 'no', $autoload );
    }
}
