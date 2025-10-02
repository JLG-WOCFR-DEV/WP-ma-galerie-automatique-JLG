<?php
/**
 * Simple PSR-4 autoloader for the MaGalerieAutomatique plugin.
 */
spl_autoload_register(
    static function ( $class ) {
        if ( 0 !== strpos( $class, 'MaGalerieAutomatique\\' ) ) {
            return;
        }

        $relative = substr( $class, strlen( 'MaGalerieAutomatique\\' ) );
        $relative_path = str_replace( '\\', '/', $relative );
        $file = __DIR__ . '/' . $relative_path . '.php';

        if ( is_readable( $file ) ) {
            require $file;
        }
    }
);
