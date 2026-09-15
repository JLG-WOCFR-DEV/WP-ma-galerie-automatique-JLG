<?php

use MaGalerieAutomatique\Admin\Settings;

/**
 * @group settings
 */
class WizardOnceTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        delete_option( Settings::WIZARD_OPTION );
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
        set_current_screen( 'settings_page_ma-galerie-automatique' );
    }

    public function tearDown(): void {
        delete_option( Settings::WIZARD_OPTION );
        wp_set_current_user( 0 );

        if ( isset( $GLOBALS['current_screen'] ) ) {
            unset( $GLOBALS['current_screen'] );
        }

        $_GET  = [];
        $_POST = [];

        parent::tearDown();
    }

    public function test_wizard_is_incomplete_by_default(): void {
        $this->assertFalse( $this->settings()->is_wizard_completed() );
    }

    public function test_complete_and_restart_wizard_toggle_option(): void {
        $this->settings()->complete_wizard();
        $this->assertTrue( $this->settings()->is_wizard_completed() );

        $this->settings()->restart_wizard();
        $this->assertFalse( $this->settings()->is_wizard_completed() );
    }

    public function test_options_page_renders_wizard_chrome_until_completed(): void {
        ob_start();
        $this->settings()->render_options_page();
        $html = ob_get_clean();

        $this->assertStringContainsString( 'data-mga-wizard', $html );
        $this->assertStringContainsString( 'mga-wizard__progress', $html );
        $this->assertStringContainsString( 'mga-wizard__panel', $html );
        $this->assertStringContainsString( 'mga_wizard_action=skip', $html );
        $this->assertStringNotContainsString( 'mga_wizard_action=restart', $html );
        $this->assertStringNotContainsString( 'mga-settings-form', $html );
    }

    public function test_options_page_renders_normal_settings_form_when_completed(): void {
        $this->settings()->complete_wizard();

        ob_start();
        $this->settings()->render_options_page();
        $html = ob_get_clean();

        $this->assertDoesNotMatchRegularExpression(
            '/class="[^"]*mga-wizard/',
            $html,
            'Completed settings must not keep wizard chrome classes.'
        );
        $this->assertStringNotContainsString( 'data-mga-wizard', $html );
        $this->assertStringNotContainsString( 'mga-wizard__progress', $html );
        $this->assertStringNotContainsString( 'mga-wizard__panel', $html );
        $this->assertStringNotContainsString( 'mga-wizard__actions', $html );
        $this->assertStringContainsString( 'mga-settings-form', $html );
        $this->assertStringContainsString( 'mga-settings-panel', $html );
        $this->assertStringContainsString( 'class="wrap mga-admin-wrap"', $html );
        $this->assertStringContainsString( 'form-table', $html );
        $this->assertStringContainsString( 'class="submit"', $html );
        $this->assertStringContainsString( 'mga_wizard_action=restart', $html );
        $this->assertStringNotContainsString( 'mga_wizard_action=skip', $html );
        $this->assertSame(
            3,
            substr_count( $html, 'mga-settings-panel' ),
            'All settings panels should be visible after the wizard is dismissed.'
        );
    }

    public function test_settings_form_post_completes_wizard(): void {
        $_POST['option_page'] = 'mga_settings_group';
        $_POST['_wpnonce']    = wp_create_nonce( 'mga_settings_group-options' );

        $this->settings()->maybe_complete_wizard_from_settings_form();

        $this->assertTrue( $this->settings()->is_wizard_completed() );
    }

    public function test_invalid_settings_form_post_does_not_complete_wizard(): void {
        $_POST['option_page'] = 'mga_settings_group';
        $_POST['_wpnonce']    = 'not-a-valid-nonce';

        $this->settings()->maybe_complete_wizard_from_settings_form();

        $this->assertFalse( $this->settings()->is_wizard_completed() );
    }

    private function settings(): Settings {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        return $plugin->settings();
    }
}
