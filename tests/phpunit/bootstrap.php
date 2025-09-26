<?php
/**
 * PHPUnit bootstrap file for Ma Galerie Automatique.
 */

$_tests_dir = getenv( 'WP_PHPUNIT__DIR' );

if ( ! $_tests_dir ) {
    $_tests_dir = getenv( 'WP_TESTS_DIR' );
}

if ( ! $_tests_dir ) {
    fwrite( STDERR, "Could not find the WordPress test suite.\n" );
    exit( 1 );
}

require_once $_tests_dir . '/includes/functions.php';

tests_add_filter(
    'muplugins_loaded',
    function () {
        require dirname( __DIR__, 2 ) . '/ma-galerie-automatique/ma-galerie-automatique.php';
    }
);

require $_tests_dir . '/includes/bootstrap.php';
