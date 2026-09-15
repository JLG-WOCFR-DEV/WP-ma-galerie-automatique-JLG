<?php
/**
 * Static checks for wizard-once + wp-admin charter (no WordPress bootstrap).
 */

$root = dirname( __DIR__ );
$plugin_dir = $root . '/ma-galerie-automatique';
$failures = 0;

function mga_phase2_check( bool $condition, string $message ): void {
    global $failures;

    if ( $condition ) {
        echo "OK  {$message}\n";
        return;
    }

    $failures++;
    fwrite( STDERR, "FAIL {$message}\n" );
}

$plugin = file_get_contents( $plugin_dir . '/ma-galerie-automatique.php' );
$readme = file_get_contents( $plugin_dir . '/readme.txt' );
$css    = file_get_contents( $plugin_dir . '/assets/css/admin-style.css' );
$template = file_get_contents( $plugin_dir . '/includes/admin-page-template.php' );
$admin_js = file_get_contents( $plugin_dir . '/assets/js/src/admin.js' );

mga_phase2_check( is_string( $plugin ) && (bool) preg_match( '/Requires at least:\s*6\.0/', $plugin ), 'Plugin header Requires at least 6.0' );
mga_phase2_check( is_string( $plugin ) && (bool) preg_match( '/Requires PHP:\s*7\.4/', $plugin ), 'Plugin header Requires PHP 7.4' );
mga_phase2_check( is_string( $plugin ) && (bool) preg_match( '/Tested up to:\s*7\.1/', $plugin ), 'Plugin header Tested up to 7.1' );

mga_phase2_check( is_string( $readme ) && (bool) preg_match( '/Requires at least:\s*6\.0/', $readme ), 'readme.txt Requires at least 6.0' );
mga_phase2_check( is_string( $readme ) && (bool) preg_match( '/Requires PHP:\s*7\.4/', $readme ), 'readme.txt Requires PHP 7.4' );
mga_phase2_check( is_string( $readme ) && (bool) preg_match( '/Tested up to:\s*7\.1/', $readme ), 'readme.txt Tested up to 7.1' );

mga_phase2_check( is_string( $css ) && ! preg_match( '/\.button-primary/', $css ), 'CSS does not target .button-primary' );
mga_phase2_check( is_string( $css ) && ! preg_match( '/\.button(?:-secondary)?(?:\s|:|,|\{)/', $css ), 'CSS does not restyle .button / .button-secondary' );

mga_phase2_check( is_string( $template ) && (bool) preg_match( '/if\s*\(\s*\$mga_show_wizard\s*\)\s*:[\s\S]{0,500}class="mga-wizard"/', $template ), 'Wizard chrome is gated by $mga_show_wizard' );
mga_phase2_check( is_string( $template ) && false !== strpos( $template, 'mga-settings-form' ), 'Completed state uses mga-settings-form' );
mga_phase2_check( is_string( $template ) && false !== strpos( $template, 'mga-settings-panel' ), 'Completed state uses mga-settings-panel' );
mga_phase2_check( is_string( $template ) && false === strpos( $template, 'mga-wizard is-complete' ), 'No permanent mga-wizard is-complete chrome' );
mga_phase2_check( is_string( $template ) && false === strpos( $template, 'data-mga-wizard-complete' ), 'No data-mga-wizard-complete leftover' );

mga_phase2_check( is_string( $admin_js ) && false !== strpos( $admin_js, 'const root = wizard || targetForm' ), 'Admin JS keeps summary/save without wizard root' );

$php_iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator( $plugin_dir, FilesystemIterator::SKIP_DOTS )
);

$submenu_hits = [];

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

mga_phase2_check( [] === $submenu_hits, 'No remove_submenu_page in plugin PHP (' . implode( ', ', $submenu_hits ) . ')' );

if ( $failures > 0 ) {
    fwrite( STDERR, "\n{$failures} check(s) failed.\n" );
    exit( 1 );
}

echo "\nAll phase 2 charter checks passed.\n";
exit( 0 );
