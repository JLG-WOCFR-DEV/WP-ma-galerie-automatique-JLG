<?php
/**
 * Remaining wp-admin chrome leftovers after #364 / #366 / #367.
 * Runs without wordpress-tests-lib.
 */

$root       = dirname( __DIR__ );
$plugin_dir = $root . '/ma-galerie-automatique';
$failures   = 0;

function mga_leftover_check( bool $condition, string $message ): void {
    global $failures;

    if ( $condition ) {
        echo "OK  {$message}\n";
        return;
    }

    $failures++;
    fwrite( STDERR, "FAIL {$message}\n" );
}

$css      = file_get_contents( $plugin_dir . '/assets/css/admin-style.css' );
$template = file_get_contents( $plugin_dir . '/includes/admin-page-template.php' );
$admin_js = file_get_contents( $plugin_dir . '/assets/js/src/admin.js' );

mga_leftover_check( is_string( $css ), 'admin-style.css is readable' );
mga_leftover_check( is_string( $template ), 'admin-page-template.php is readable' );
mga_leftover_check( is_string( $admin_js ), 'admin.js is readable' );

mga_leftover_check( is_string( $css ) && ! preg_match( '/\.button-primary/', $css ), 'CSS does not target .button-primary' );
mga_leftover_check( is_string( $css ) && ! preg_match( '/\.button(?:-secondary)?(?:\s|:|,|\{)/', $css ), 'CSS does not restyle .button / .button-secondary' );
mga_leftover_check( is_string( $css ) && ! preg_match( '/\.button-link/', $css ), 'CSS does not restyle .button-link / .button-link-delete' );
mga_leftover_check( is_string( $css ) && false === strpos( $css, '.notice' ), 'CSS does not restyle core .notice' );
mga_leftover_check(
    is_string( $css ) && ! preg_match( '/(?<![a-zA-Z0-9_-])\.wrap(?:\s|:|,|\{)/', $css ),
    'CSS does not restyle core .wrap'
);
mga_leftover_check( is_string( $css ) && ! preg_match( '/\.nav-tab(?:-wrapper)?(?:\s|:|,|\{)/', $css ), 'CSS does not restyle .nav-tab' );

mga_leftover_check(
    is_string( $css ) && ! preg_match( '/\.mga-admin-wrap\[data-mga-theme=[\'"]dark[\'"]\]/', $css ),
    'Dark theme is not attached to .mga-admin-wrap'
);
mga_leftover_check(
    is_string( $css ) && (bool) preg_match( '/\.mga-live-preview\[data-mga-theme=[\'"]dark[\'"]\]/', $css ),
    'Dark theme is scoped to .mga-live-preview'
);
mga_leftover_check(
    is_string( $css ) && false === strpos( $css, '.is-dark-theme .mga-admin-wrap' ),
    'CSS does not fight body.is-dark-theme on the wrap'
);

mga_leftover_check(
    is_string( $admin_js ) && false === strpos( $admin_js, "adminRoot.setAttribute('data-mga-theme'" ),
    'Admin JS does not set data-mga-theme on the wrap'
);
mga_leftover_check(
    is_string( $admin_js )
        && false !== strpos( $admin_js, "querySelector('[data-mga-live-preview]')" )
        && false !== strpos( $admin_js, "previewRoot.setAttribute('data-mga-theme'" ),
    'Admin JS sets data-mga-theme on the live preview'
);

mga_leftover_check(
    is_string( $admin_js ) && false === strpos( $admin_js, 'data-mga-wizard-complete' ),
    'No leftover data-mga-wizard-complete in admin JS'
);
mga_leftover_check(
    is_string( $admin_js ) && ! preg_match( '/classList\.contains\(\s*[\'"]is-complete[\'"]\s*\)/', $admin_js ),
    'No leftover wizard is-complete chrome in admin JS'
);

mga_leftover_check(
    is_string( $template ) && false === strpos( $template, 'Thème de l’interface' ),
    'Theme picker is no longer labeled as interface theme'
);
mga_leftover_check(
    is_string( $template ) && false !== strpos( $template, 'Thème de l’aperçu' ),
    'Theme picker is labeled as preview theme'
);
mga_leftover_check(
    is_string( $template ) && false === strpos( $template, 'data-mga-theme=' ),
    'PHP markup does not stamp data-mga-theme on the wrap'
);

if ( $failures > 0 ) {
    fwrite( STDERR, "\n{$failures} leftover check(s) failed.\n" );
    exit( 1 );
}

echo "\nAll admin chrome leftover checks passed.\n";
exit( 0 );
