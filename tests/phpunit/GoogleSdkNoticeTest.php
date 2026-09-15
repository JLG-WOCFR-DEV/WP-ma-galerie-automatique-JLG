<?php

use MaGalerieAutomatique\Admin\Settings;
use MaGalerieAutomatique\Plugin;

/**
 * @group admin
 */
class GoogleSdkNoticeTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        $plugin = mga_plugin();

        if ( $plugin instanceof Plugin ) {
            remove_action( 'admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] );
            remove_action( 'network_admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] );
        }

        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

        unset( $GLOBALS['hook_suffix'], $GLOBALS['plugin_page'] );
        $_GET = [];
    }

    public function tearDown(): void {
        $plugin = mga_plugin();

        if ( $plugin instanceof Plugin ) {
            remove_action( 'admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] );
            remove_action( 'network_admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] );
        }

        wp_set_current_user( 0 );

        if ( isset( $GLOBALS['current_screen'] ) ) {
            unset( $GLOBALS['current_screen'] );
        }

        unset( $GLOBALS['hook_suffix'], $GLOBALS['plugin_page'] );
        $_GET = [];

        parent::tearDown();
    }

    public function test_notice_callback_is_registered_on_settings_load_hook_only(): void {
        $plugin = $this->plugin();

        $this->assertNotFalse(
            has_action(
                'load-' . Settings::SETTINGS_PAGE_HOOK,
                [ $plugin, 'register_missing_google_sdk_notice' ]
            ),
            'The SDK notice must be attached to load-settings_page_ma-galerie-automatique.'
        );
        $this->assertFalse(
            (bool) has_action( 'admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] ),
            'admin_notices must not be registered on every wp-admin screen.'
        );
        $this->assertFalse(
            (bool) has_action( 'network_admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] ),
            'network_admin_notices must not display the SDK notice globally.'
        );

        $plugin->register_missing_google_sdk_notice();

        $this->assertNotFalse(
            has_action( 'admin_notices', [ $plugin, 'maybe_show_missing_google_sdk_notice' ] ),
            'admin_notices is registered only after the plugin settings page loads.'
        );
    }

    public function test_screen_matcher_accepts_settings_hook_and_slug(): void {
        $settings_screen = (object) [ 'id' => Settings::SETTINGS_PAGE_HOOK ];

        $this->assertTrue( Plugin::screen_is_plugin_settings( $settings_screen ) );
        $this->assertTrue( Plugin::screen_is_plugin_settings( null, Settings::SETTINGS_PAGE_HOOK ) );
        $this->assertTrue( Plugin::screen_is_plugin_settings( null, '', Settings::SETTINGS_PAGE_SLUG ) );
    }

    /**
     * @dataProvider foreign_admin_screens
     */
    public function test_screen_matcher_rejects_foreign_admin_screens( string $screen_id ): void {
        $this->assertFalse(
            Plugin::screen_is_plugin_settings( (object) [ 'id' => $screen_id ] ),
            $screen_id . ' must not be treated as a Lightbox settings screen.'
        );
    }

    public function test_screen_id_wins_over_matching_slug(): void {
        $this->assertFalse(
            Plugin::screen_is_plugin_settings(
                (object) [ 'id' => 'settings_page_wp-motion' ],
                Settings::SETTINGS_PAGE_HOOK,
                Settings::SETTINGS_PAGE_SLUG
            )
        );
    }

    public function test_notice_renders_native_error_on_plugin_settings_screen(): void {
        $this->skip_if_google_client_available();

        set_current_screen( Settings::SETTINGS_PAGE_HOOK );

        $html = $this->capture_notice();

        $this->assertStringContainsString( 'notice notice-error', $html );
        $this->assertStringContainsString( 'Le SDK Google est indisponible', $html );
        $this->assertStringContainsString( 'composer install --no-dev', $html );
        $this->assertStringNotContainsString( 'mga-notice', $html );
        $this->assertDoesNotMatchRegularExpression( '/class="[^"]*notice-(?:info|success|warning)/', $html );
    }

    /**
     * @dataProvider foreign_admin_screens
     */
    public function test_notice_is_silent_on_foreign_admin_screens( string $screen_id ): void {
        set_current_screen( $screen_id );

        $this->assertSame( '', $this->capture_notice(), 'Notice leaked on ' . $screen_id );
    }

    public function test_notice_respects_requires_google_sdk_filter(): void {
        set_current_screen( Settings::SETTINGS_PAGE_HOOK );
        add_filter( 'mga_requires_google_sdk', '__return_false' );

        try {
            $this->assertSame( '', $this->capture_notice() );
        } finally {
            remove_filter( 'mga_requires_google_sdk', '__return_false' );
        }
    }

    public function test_notice_requires_activate_plugins_capability(): void {
        $this->skip_if_google_client_available();

        wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );
        set_current_screen( Settings::SETTINGS_PAGE_HOOK );

        $this->assertSame( '', $this->capture_notice() );
    }

    public function test_plugin_php_does_not_remove_submenu_pages(): void {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(
                dirname( __DIR__, 2 ) . '/ma-galerie-automatique',
                FilesystemIterator::SKIP_DOTS
            )
        );

        foreach ( $iterator as $file ) {
            if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
                continue;
            }

            $pathname = $file->getPathname();

            if ( false !== strpos( $pathname, '/vendor/' ) || false !== strpos( $pathname, '/node_modules/' ) ) {
                continue;
            }

            $contents = file_get_contents( $pathname );
            $this->assertIsString( $contents );
            $this->assertStringNotContainsString( 'remove_submenu_page', $contents, $pathname );
        }
    }

    public function foreign_admin_screens(): array {
        return [
            'dashboard'              => [ 'dashboard' ],
            'plugins'                => [ 'plugins' ],
            'motion'                 => [ 'settings_page_wp-motion' ],
            'ajax-search'            => [ 'settings_page_mon-ajax-search' ],
            'liens-morts'            => [ 'settings_page_liens-morts-detector' ],
            'backup'                 => [ 'toplevel_page_backup-jlg' ],
            'youtube'                => [ 'settings_page_my-youtube' ],
            'galerie-toplevel-alias' => [ 'toplevel_page_ma-galerie-automatique' ],
        ];
    }

    private function capture_notice(): string {
        ob_start();
        $this->plugin()->maybe_show_missing_google_sdk_notice();

        return (string) ob_get_clean();
    }

    private function skip_if_google_client_available(): void {
        if ( class_exists( '\\Google\\Client' ) ) {
            $this->markTestSkipped( 'Google SDK is installed in this environment.' );
        }
    }

    private function plugin(): Plugin {
        $plugin = mga_plugin();
        $this->assertInstanceOf( Plugin::class, $plugin );

        return $plugin;
    }
}
