<?php
$_tests_dir = getenv('WP_PHPUNIT__DIR');

if (! $_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

if (! file_exists($_tests_dir . '/includes/functions.php')) {
    fwrite(STDERR, "Could not find the WordPress tests library in ${_tests_dir}.\n");
    exit(1);
}

require_once $_tests_dir . '/includes/functions.php';

tests_add_filter(
    'muplugins_loaded',
    function () {
        $project_root = dirname(dirname(__DIR__));
        require_once $project_root . '/ma-galerie-automatique/ma-galerie-automatique.php';
    }
);

require $_tests_dir . '/includes/bootstrap.php';
