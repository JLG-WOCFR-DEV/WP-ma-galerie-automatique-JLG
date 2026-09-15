<?php

use MaGalerieAutomatique\Admin\Settings;

/**
 * @group enqueue
 */
class AdminSettingsPageAssetsTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        wp_dequeue_style( 'mga-admin-style' );
        wp_dequeue_script( 'mga-admin-script' );
        wp_deregister_style( 'mga-admin-style' );
        wp_deregister_script( 'mga-admin-script' );
    }

    public function tearDown(): void {
        wp_dequeue_style( 'mga-admin-style' );
        wp_dequeue_script( 'mga-admin-script' );
        wp_set_current_user( 0 );

        parent::tearDown();
    }

    public function test_admin_assets_enqueue_on_settings_page_hook(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

        $this->settings()->enqueue_assets( Settings::SETTINGS_PAGE_HOOK );

        $this->assertTrue(
            wp_style_is( 'mga-admin-style', 'enqueued' ),
            'Admin CSS must load on the Settings submenu hook.'
        );
        $this->assertTrue(
            wp_script_is( 'mga-admin-script', 'enqueued' ),
            'Admin JS must load on the Settings submenu hook.'
        );
    }

    public function test_admin_assets_skip_toplevel_page_hook(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

        $this->settings()->enqueue_assets( 'toplevel_page_ma-galerie-automatique' );

        $this->assertFalse(
            wp_style_is( 'mga-admin-style', 'enqueued' ),
            'The plugin lives under Settings, so the toplevel hook must not enqueue assets.'
        );
        $this->assertFalse(
            wp_script_is( 'mga-admin-script', 'enqueued' ),
            'The plugin lives under Settings, so the toplevel hook must not enqueue scripts.'
        );
    }

    public function test_settings_page_hook_constant_matches_add_options_page(): void {
        $this->assertSame(
            'settings_page_ma-galerie-automatique',
            Settings::get_settings_page_hook()
        );
    }

    public function test_admin_stylesheet_does_not_restyle_button_primary(): void {
        $css = file_get_contents(
            dirname( __DIR__, 2 ) . '/ma-galerie-automatique/assets/css/admin-style.css'
        );

        $this->assertIsString( $css );
        $this->assertDoesNotMatchRegularExpression(
            '/\.button-primary\s*\{/',
            $css,
            'Native wp-admin primary buttons must keep core styles.'
        );
        $this->assertStringContainsString(
            '.button:not(.button-primary)',
            $css,
            'Generic .button rules must exclude .button-primary.'
        );
    }

    private function settings(): Settings {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        return $plugin->settings();
    }
}
