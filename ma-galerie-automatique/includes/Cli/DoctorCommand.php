<?php

namespace MaGalerieAutomatique\Cli;

use WP_CLI;
use WP_CLI_Command;

class DoctorCommand extends WP_CLI_Command {
    public static function register(): void {
        WP_CLI::add_command( 'mga doctor', static::class );
    }

    /**
     * Checks if the Google SDK classes are available.
     *
     * ## EXAMPLES
     *
     *     wp mga doctor google-sdk
     */
    public function google_sdk(): void {
        if ( class_exists( '\\Google\\Client' ) ) {
            WP_CLI::success( 'Le SDK Google est disponible.' );

            return;
        }

        WP_CLI::error( 'Le SDK Google est introuvable. Exécutez "composer install --no-dev" dans le dossier du plugin.' );
    }
}
