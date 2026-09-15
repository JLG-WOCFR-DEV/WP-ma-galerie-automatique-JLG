<?php
/**
 * Regression: Google SDK admin notice is limited to Lightbox settings screens.
 * Runs without wordpress-tests-lib.
 */

$root       = dirname( __DIR__ );
$plugin_dir = $root . '/ma-galerie-automatique';
$failures   = 0;

function mga_sdk_notice_check( bool $condition, string $message ): void {
    global $failures;

    if ( $condition ) {
        echo "OK  {$message}\n";
        return;
    }

    $failures++;
    fwrite( STDERR, "FAIL {$message}\n" );
}

$plugin_src   = file_get_contents( $plugin_dir . '/includes/Plugin.php' );
$settings_src = file_get_contents( $plugin_dir . '/includes/Admin/Settings.php' );
$css          = file_get_contents( $plugin_dir . '/assets/css/admin-style.css' );
$bootstrap    = file_get_contents( $plugin_dir . '/ma-galerie-automatique.php' );

mga_sdk_notice_check( is_string( $settings_src ) && false !== strpos( $settings_src, "SETTINGS_PAGE_HOOK = 'settings_page_ma-galerie-automatique'" ), 'Settings hook constant is settings_page_ma-galerie-automatique' );
mga_sdk_notice_check( is_string( $plugin_src ) && false !== strpos( $plugin_src, "add_action( 'load-' . Settings::SETTINGS_PAGE_HOOK, [ \$this, 'register_missing_google_sdk_notice' ] )" ), 'Notice registration is gated by load-settings_page_ma-galerie-automatique' );
mga_sdk_notice_check( is_string( $plugin_src ) && false === strpos( $plugin_src, 'network_admin_notices' ), 'network_admin_notices is not used' );
mga_sdk_notice_check( is_string( $plugin_src ) && false !== strpos( $plugin_src, "class=\"notice notice-error\"" ), 'Notice markup uses native notice notice-error' );
mga_sdk_notice_check( is_string( $plugin_src ) && false === strpos( $plugin_src, 'mga-notice' ), 'Notice markup does not use a custom mga-notice class' );
mga_sdk_notice_check( is_string( $css ) && false === strpos( $css, '.notice' ), 'Admin CSS does not restyle core .notice' );
mga_sdk_notice_check( is_string( $bootstrap ) && (bool) preg_match( '/Version:\s*1\.8\.3/', $bootstrap ), 'Plugin header version 1.8.3' );

$submenu_hits = [];
$php_iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator( $plugin_dir, FilesystemIterator::SKIP_DOTS )
);

foreach ( $php_iterator as $file ) {
    if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
        continue;
    }

    $pathname = $file->getPathname();

    if ( false !== strpos( $pathname, '/vendor/' ) ) {
        continue;
    }

    $contents = file_get_contents( $pathname );

    if ( is_string( $contents ) && false !== strpos( $contents, 'remove_submenu_page' ) ) {
        $submenu_hits[] = str_replace( $plugin_dir . '/', '', $pathname );
    }
}

mga_sdk_notice_check( [] === $submenu_hits, 'No remove_submenu_page in plugin PHP (' . implode( ', ', $submenu_hits ) . ')' );

$GLOBALS['mga_test_actions'] = [];
$GLOBALS['mga_test_filters'] = [];
$GLOBALS['mga_test_is_admin'] = true;
$GLOBALS['mga_test_can']      = [ 'activate_plugins' => true ];
$GLOBALS['mga_test_screen']   = null;

if ( ! function_exists( 'add_action' ) ) {
    function add_action( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
        unset( $priority, $accepted_args );
        $GLOBALS['mga_test_actions'][ $hook ][] = $callback;
    }
}

if ( ! function_exists( 'is_admin' ) ) {
    function is_admin() {
        return ! empty( $GLOBALS['mga_test_is_admin'] );
    }
}

if ( ! function_exists( 'current_user_can' ) ) {
    function current_user_can( $capability ) {
        return ! empty( $GLOBALS['mga_test_can'][ $capability ] );
    }
}

if ( ! function_exists( 'apply_filters' ) ) {
    function apply_filters( $hook_name, $value, ...$args ) {
        if ( empty( $GLOBALS['mga_test_filters'][ $hook_name ] ) ) {
            return $value;
        }

        foreach ( $GLOBALS['mga_test_filters'][ $hook_name ] as $callback ) {
            $value = $callback( $value, ...$args );
        }

        return $value;
    }
}

if ( ! function_exists( 'get_current_screen' ) ) {
    function get_current_screen() {
        return $GLOBALS['mga_test_screen'] ?? null;
    }
}

if ( ! function_exists( 'wp_kses_post' ) ) {
    function wp_kses_post( $text ) {
        return $text;
    }
}

if ( ! function_exists( '__' ) ) {
    function __( $text, $domain = null ) {
        unset( $domain );

        return $text;
    }
}

if ( ! function_exists( 'wp_unslash' ) ) {
    function wp_unslash( $value ) {
        return is_string( $value ) ? stripslashes( $value ) : $value;
    }
}

if ( ! function_exists( 'sanitize_key' ) ) {
    function sanitize_key( $key ) {
        $key = strtolower( (string) $key );

        return preg_replace( '/[^a-z0-9_\-]/', '', $key );
    }
}

require_once $plugin_dir . '/includes/autoload.php';

$plugin = new MaGalerieAutomatique\Plugin( $plugin_dir . '/ma-galerie-automatique.php' );
$plugin->register_hooks();

$load_hook = 'load-' . MaGalerieAutomatique\Admin\Settings::SETTINGS_PAGE_HOOK;

mga_sdk_notice_check(
    ! empty( $GLOBALS['mga_test_actions'][ $load_hook ] ),
    'register_hooks attaches load-settings_page_ma-galerie-automatique'
);
mga_sdk_notice_check(
    empty( $GLOBALS['mga_test_actions']['admin_notices'] ),
    'admin_notices is not registered before the settings page loads'
);
mga_sdk_notice_check(
    empty( $GLOBALS['mga_test_actions']['network_admin_notices'] ),
    'network_admin_notices is not registered'
);

foreach ( $GLOBALS['mga_test_actions'][ $load_hook ] as $callback ) {
    call_user_func( $callback );
}

mga_sdk_notice_check(
    ! empty( $GLOBALS['mga_test_actions']['admin_notices'] ),
    'admin_notices is registered after the settings page load hook'
);

mga_sdk_notice_check(
    MaGalerieAutomatique\Plugin::screen_is_plugin_settings(
        (object) [ 'id' => 'settings_page_ma-galerie-automatique' ]
    ),
    'screen_is_plugin_settings accepts the settings hook'
);
mga_sdk_notice_check(
    MaGalerieAutomatique\Plugin::screen_is_plugin_settings( null, 'settings_page_ma-galerie-automatique' ),
    'screen_is_plugin_settings accepts hook_suffix fallback'
);
mga_sdk_notice_check(
    MaGalerieAutomatique\Plugin::screen_is_plugin_settings( null, '', 'ma-galerie-automatique' ),
    'screen_is_plugin_settings accepts page slug fallback'
);
mga_sdk_notice_check(
    ! MaGalerieAutomatique\Plugin::screen_is_plugin_settings(
        (object) [ 'id' => 'settings_page_wp-motion' ],
        'settings_page_ma-galerie-automatique',
        'ma-galerie-automatique'
    ),
    'Known screen id wins over slug/hook fallbacks'
);

$foreign_screens = [
    'dashboard',
    'plugins',
    'settings_page_wp-motion',
    'settings_page_mon-ajax-search',
    'settings_page_liens-morts-detector',
    'toplevel_page_backup-jlg',
    'settings_page_my-youtube',
    'toplevel_page_ma-galerie-automatique',
];

foreach ( $foreign_screens as $screen_id ) {
    mga_sdk_notice_check(
        ! MaGalerieAutomatique\Plugin::screen_is_plugin_settings( (object) [ 'id' => $screen_id ] ),
        "screen_is_plugin_settings rejects {$screen_id}"
    );
}

function mga_capture_sdk_notice( MaGalerieAutomatique\Plugin $plugin ): string {
    ob_start();
    $plugin->maybe_show_missing_google_sdk_notice();

    return (string) ob_get_clean();
}

$google_client_available = class_exists( '\\Google\\Client' );

foreach ( $foreign_screens as $screen_id ) {
    $GLOBALS['mga_test_screen'] = (object) [ 'id' => $screen_id ];
    mga_sdk_notice_check(
        '' === mga_capture_sdk_notice( $plugin ),
        "Notice silent on {$screen_id}"
    );
}

$GLOBALS['mga_test_screen'] = (object) [ 'id' => 'settings_page_ma-galerie-automatique' ];
$html                     = mga_capture_sdk_notice( $plugin );

if ( $google_client_available ) {
    mga_sdk_notice_check( '' === $html, 'Notice hidden when Google\\Client is available' );
} else {
    mga_sdk_notice_check( false !== strpos( $html, 'notice notice-error' ), 'Native notice-error on plugin settings screen' );
    mga_sdk_notice_check( false !== strpos( $html, 'Le SDK Google est indisponible' ), 'SDK message on plugin settings screen' );
    mga_sdk_notice_check( false === strpos( $html, 'mga-notice' ), 'Rendered notice has no custom mga-notice class' );
}

$GLOBALS['mga_test_filters']['mga_requires_google_sdk'] = [
    static function () {
        return false;
    },
];
mga_sdk_notice_check( '' === mga_capture_sdk_notice( $plugin ), 'mga_requires_google_sdk can hide the notice' );
unset( $GLOBALS['mga_test_filters']['mga_requires_google_sdk'] );

$GLOBALS['mga_test_can'] = [ 'activate_plugins' => false ];
mga_sdk_notice_check( '' === mga_capture_sdk_notice( $plugin ), 'Notice hidden without activate_plugins' );
$GLOBALS['mga_test_can'] = [ 'activate_plugins' => true ];

$GLOBALS['mga_test_screen'] = (object) [ 'id' => 'settings_page_wp-motion' ];
$_GET['page']               = 'ma-galerie-automatique';
mga_sdk_notice_check( '' === mga_capture_sdk_notice( $plugin ), 'Foreign screen id wins over GET page' );
unset( $_GET['page'] );

$GLOBALS['mga_test_screen'] = null;
$GLOBALS['hook_suffix']     = 'settings_page_ma-galerie-automatique';

if ( $google_client_available ) {
    mga_sdk_notice_check( '' === mga_capture_sdk_notice( $plugin ), 'hook_suffix fallback stays silent when SDK is present' );
} else {
    mga_sdk_notice_check( false !== strpos( mga_capture_sdk_notice( $plugin ), 'notice notice-error' ), 'hook_suffix fallback shows native notice' );
}

$GLOBALS['hook_suffix'] = 'settings_page_wp-motion';
mga_sdk_notice_check( '' === mga_capture_sdk_notice( $plugin ), 'Wrong hook_suffix stays silent' );
unset( $GLOBALS['hook_suffix'] );

if ( $failures > 0 ) {
    fwrite( STDERR, "\n{$failures} check(s) failed.\n" );
    exit( 1 );
}

echo "\nAll Google SDK notice scope checks passed.\n";
exit( 0 );
