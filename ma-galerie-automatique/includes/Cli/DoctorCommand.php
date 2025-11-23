<?php

namespace MaGalerieAutomatique\Cli;

use MaGalerieAutomatique\Plugin;
use WP_CLI;
use WP_CLI_Command;

class DoctorCommand extends WP_CLI_Command {
    private static ?Plugin $plugin = null;

    public static function register( Plugin $plugin ): void {
        self::$plugin = $plugin;

        WP_CLI::add_command( 'mga doctor', static::class );
    }

    /**
     * Runs the available health checks and displays their status.
     *
     * ## EXAMPLES
     *
     *     wp mga doctor status
     */
    public function status( array $args, array $assoc_args ): void {
        unset( $args, $assoc_args );

        $checks = [
            $this->check_vendor_autoload(),
            $this->check_google_sdk(),
        ];

        $rows = array_map(
            static fn ( array $check ): array => [
                'Vérification' => $check['name'],
                'Statut'       => $check['success'] ? 'OK' : 'KO',
                'Détails'      => $check['details'],
            ],
            $checks
        );

        \WP_CLI\Utils\format_items( 'table', $rows, [ 'Vérification', 'Statut', 'Détails' ] );

        foreach ( $checks as $check ) {
            if ( $check['success'] ) {
                continue;
            }

            WP_CLI::error( $check['details'] );
        }

        WP_CLI::success( 'Tous les diagnostics sont au vert.' );
    }

    /**
     * Checks if the Google SDK classes are available.
     *
     * ## EXAMPLES
     *
     *     wp mga doctor google-sdk
     */
    public function google_sdk(): void {
        $check = $this->check_google_sdk();

        if ( $check['success'] ) {
            WP_CLI::success( $check['details'] );

            return;
        }

        WP_CLI::error( $check['details'] );
    }

    private function check_vendor_autoload(): array {
        $plugin = $this->require_plugin();
        $path   = $plugin->get_plugin_dir_path() . 'vendor/autoload.php';

        if ( file_exists( $path ) ) {
            return [
                'name'    => 'Fichier autoload',
                'success' => true,
                'details' => sprintf( 'Le fichier %s est présent.', $this->relative_path( $path ) ),
            ];
        }

        return [
            'name'    => 'Fichier autoload',
            'success' => false,
            'details' => sprintf( 'Le fichier %s est introuvable. Exécutez "composer install --no-dev".', $this->relative_path( $path ) ),
        ];
    }

    private function check_google_sdk(): array {
        $plugin = $this->require_plugin();

        if ( ! $plugin->requires_google_sdk() ) {
            return [
                'name'    => 'SDK Google',
                'success' => true,
                'details' => 'Le SDK Google est désactivé via le filtre "mga_requires_google_sdk".',
            ];
        }

        if ( class_exists( '\\Google\\Client' ) ) {
            return [
                'name'    => 'SDK Google',
                'success' => true,
                'details' => 'Le SDK Google est disponible.',
            ];
        }

        return [
            'name'    => 'SDK Google',
            'success' => false,
            'details' => 'Le SDK Google est introuvable. Exécutez "composer install --no-dev" dans le dossier du plugin.',
        ];
    }

    private function require_plugin(): Plugin {
        if ( null === self::$plugin ) {
            WP_CLI::error( 'Le plugin n\'est pas initialisé pour les diagnostics WP-CLI.' );
        }

        return self::$plugin;
    }

    private function relative_path( string $path ): string {
        $plugin = $this->require_plugin();
        $base   = rtrim( $plugin->get_plugin_dir_path(), DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR;

        if ( 0 === strpos( $path, $base ) ) {
            return substr( $path, strlen( $base ) );
        }

        return $path;
    }
}
