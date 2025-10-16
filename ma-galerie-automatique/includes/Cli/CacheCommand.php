<?php

namespace MaGalerieAutomatique\Cli;

use MaGalerieAutomatique\Content\Detection;
use MaGalerieAutomatique\Plugin;
use WP_CLI;
use WP_CLI_Command;

class CacheCommand extends WP_CLI_Command {
    private static ?Plugin $plugin = null;

    public static function register( Plugin $plugin ): void {
        self::$plugin = $plugin;

        WP_CLI::add_command( 'mga cache', static::class );
    }

    /**
     * Displays the status of the plugin caches.
     *
     * ## OPTIONS
     *
     * [--network]
     * : Run the command on every site of the current network.
     *
     * ## EXAMPLES
     *
     *     wp mga cache status
     *     wp mga cache status --network
     */
    public function status( $args, $assoc_args ): void {
        $network = isset( $assoc_args['network'] );

        if ( $network ) {
            $this->assert_multisite();
            $site_ids = $this->get_network_site_ids();

            foreach ( $site_ids as $site_id ) {
                switch_to_blog( $site_id );
                WP_CLI::log( sprintf( 'Site #%d (%s):', $site_id, home_url() ) );
                $this->render_status_table( $this->collect_site_status() );
                restore_current_blog();
            }

            return;
        }

        $this->render_status_table( $this->collect_site_status() );
    }

    /**
     * Purges the caches maintained by the plugin.
     *
     * ## OPTIONS
     *
     * [--scope=<scope>]
     * : Limit the purge to a specific cache scope.
     * ---
     * default: all
     * options:
     *   - all
     *   - detection
     *   - swiper
     * ---
     *
     * [--batch-size=<number>]
     * : Size of each deletion batch when purging detection caches. Defaults to 500.
     *
     * [--network]
     * : Run the command on every site of the current network.
     *
     * ## EXAMPLES
     *
     *     wp mga cache purge
     *     wp mga cache purge --scope=detection
     *     wp mga cache purge --network
     */
    public function purge( $args, $assoc_args ): void {
        $scope      = isset( $assoc_args['scope'] ) ? strtolower( (string) $assoc_args['scope'] ) : 'all';
        $network    = isset( $assoc_args['network'] );
        $batch_size = isset( $assoc_args['batch-size'] ) ? absint( $assoc_args['batch-size'] ) : 500;

        if ( ! in_array( $scope, [ 'all', 'detection', 'swiper' ], true ) ) {
            WP_CLI::error( sprintf( 'Unknown scope "%s". Use "all", "detection" or "swiper".', $scope ) );
        }

        if ( $batch_size < 1 ) {
            WP_CLI::error( '--batch-size must be a positive integer.' );
        }

        if ( $network ) {
            $this->assert_multisite();
            $site_ids = $this->get_network_site_ids();

            foreach ( $site_ids as $site_id ) {
                switch_to_blog( $site_id );
                WP_CLI::log( sprintf( 'Purging caches on site #%d (%s)...', $site_id, home_url() ) );
                $result = $this->purge_site_caches( $scope, $batch_size );
                $this->render_purge_summary( $result );
                restore_current_blog();
            }

            WP_CLI::success( 'Finished purging caches on the entire network.' );

            return;
        }

        $result = $this->purge_site_caches( $scope, $batch_size );
        $this->render_purge_summary( $result );
        WP_CLI::success( 'Cache purge completed.' );
    }

    private function collect_site_status(): array {
        global $wpdb;

        $postmeta_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = %s",
                '_mga_has_linked_images'
            )
        );

        $transient_pattern = $wpdb->esc_like( '_transient_mga_det_' ) . '%';
        $timeout_pattern   = $wpdb->esc_like( '_transient_timeout_mga_det_' ) . '%';

        $transient_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
                $transient_pattern
            )
        );

        $timeout_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
                $timeout_pattern
            )
        );

        $sources = get_option( 'mga_swiper_asset_sources', [] );
        $last_checked = '';

        if ( is_array( $sources ) && ! empty( $sources['checked_at'] ) ) {
            $last_checked = date_i18n( 'Y-m-d H:i:s', absint( $sources['checked_at'] ) );
        }

        return [
            'postmeta_count'   => $postmeta_count,
            'transient_count'  => $transient_count,
            'timeout_count'    => $timeout_count,
            'swiper_has_cache' => is_array( $sources ) && ! empty( $sources ),
            'swiper_last_check' => $last_checked,
        ];
    }

    private function render_status_table( array $status ): void {
        $rows = [
            [
                'Cache' => 'Post meta',
                'Key'   => '_mga_has_linked_images',
                'Count' => $status['postmeta_count'],
                'Notes' => '',
            ],
            [
                'Cache' => 'Transients',
                'Key'   => 'mga_det_*',
                'Count' => $status['transient_count'],
                'Notes' => sprintf( '%d timeouts', $status['timeout_count'] ),
            ],
            [
                'Cache' => 'Swiper sources',
                'Key'   => 'mga_swiper_asset_sources',
                'Count' => $status['swiper_has_cache'] ? 1 : 0,
                'Notes' => $status['swiper_last_check'],
            ],
        ];

        \WP_CLI\Utils\format_items( 'table', $rows, [ 'Cache', 'Key', 'Count', 'Notes' ] );
    }

    private function purge_site_caches( string $scope, int $batch_size ): array {
        $result = [
            'meta_deleted'      => 0,
            'transients_deleted' => 0,
            'swiper_reset'      => false,
        ];

        if ( in_array( $scope, [ 'all', 'detection' ], true ) ) {
            $result = array_merge( $result, $this->purge_detection_cache( $batch_size ) );
        }

        if ( in_array( $scope, [ 'all', 'swiper' ], true ) ) {
            $result['swiper_reset'] = $this->purge_swiper_sources();
        }

        return $result;
    }

    private function purge_detection_cache( int $batch_size ): array {
        global $wpdb;

        $batch_size = max( 1, $batch_size );

        $this->log_cli_message( sprintf( 'Deleting cached post meta in batches of %d…', $batch_size ) );
        $meta_deleted = $this->delete_post_meta_in_batches( $batch_size );

        $transient_pattern = $wpdb->esc_like( '_transient_mga_det_' ) . '%';
        $timeout_pattern   = $wpdb->esc_like( '_transient_timeout_mga_det_' ) . '%';

        $this->log_cli_message( sprintf( 'Deleting detection transients in batches of %d…', $batch_size ) );
        $transients_deleted = $this->delete_transients_in_batches( [ $transient_pattern, $timeout_pattern ], $batch_size );

        Detection::bump_global_cache_version();

        wp_cache_flush();

        return [
            'meta_deleted'      => max( 0, $meta_deleted ),
            'transients_deleted' => max( 0, $transients_deleted ),
        ];
    }

    private function delete_post_meta_in_batches( int $batch_size ): int {
        global $wpdb;

        $total_deleted = 0;

        do {
            $meta_ids = $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT meta_id FROM {$wpdb->postmeta} WHERE meta_key = %s LIMIT %d",
                    '_mga_has_linked_images',
                    $batch_size
                )
            );

            $count = is_array( $meta_ids ) ? count( $meta_ids ) : 0;

            if ( $count > 0 ) {
                $placeholders = implode( ',', array_fill( 0, $count, '%d' ) );
                $deleted      = $wpdb->query(
                    $wpdb->prepare(
                        "DELETE FROM {$wpdb->postmeta} WHERE meta_id IN ({$placeholders})",
                        ...array_map( 'intval', $meta_ids )
                    )
                );

                if ( is_int( $deleted ) && $deleted > 0 ) {
                    $total_deleted += $deleted;
                    $this->log_cli_message(
                        sprintf(
                            'Deleted %1$d cached post meta rows this batch (%2$d total).',
                            $deleted,
                            $total_deleted
                        )
                    );
                }
            }
        } while ( $count === $batch_size );

        return $total_deleted;
    }

    private function delete_transients_in_batches( array $patterns, int $batch_size ): int {
        global $wpdb;

        $total_deleted = 0;

        foreach ( $patterns as $pattern ) {
            $last_option_id = 0;

            do {
                $rows = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT option_id, option_name FROM {$wpdb->options} WHERE option_name LIKE %s AND option_id > %d ORDER BY option_id ASC LIMIT %d",
                        $pattern,
                        $last_option_id,
                        $batch_size
                    ),
                    ARRAY_A
                );

                $count = is_array( $rows ) ? count( $rows ) : 0;

                if ( $count > 0 ) {
                    $last_option_id = (int) $rows[ $count - 1 ]['option_id'];
                    $option_names   = wp_list_pluck( $rows, 'option_name' );
                    $placeholders   = implode( ',', array_fill( 0, $count, '%s' ) );
                    $deleted        = $wpdb->query(
                        $wpdb->prepare(
                            "DELETE FROM {$wpdb->options} WHERE option_name IN ({$placeholders})",
                            ...$option_names
                        )
                    );

                    if ( is_int( $deleted ) && $deleted > 0 ) {
                        $total_deleted += $deleted;
                        $this->log_cli_message(
                            sprintf(
                                'Deleted %1$d detection transient rows this batch (%2$d total).',
                                $deleted,
                                $total_deleted
                            )
                        );
                    }
                }
            } while ( $count === $batch_size );
        }

        return $total_deleted;
    }

    private function log_cli_message( string $message ): void {
        if ( class_exists( '\\WP_CLI' ) ) {
            WP_CLI::log( $message );
        }
    }

    private function purge_swiper_sources(): bool {
        delete_option( 'mga_swiper_asset_sources' );

        $sources = $this->get_plugin()->frontend_assets()->refresh_swiper_asset_sources( 'cli_purge' );

        return ! empty( $sources );
    }

    private function render_purge_summary( array $result ): void {
        if ( array_key_exists( 'meta_deleted', $result ) ) {
            WP_CLI::log( sprintf( 'Deleted %d cached post meta rows.', (int) $result['meta_deleted'] ) );
        }

        if ( array_key_exists( 'transients_deleted', $result ) ) {
            WP_CLI::log( sprintf( 'Deleted %d detection transients (including timeouts).', (int) $result['transients_deleted'] ) );
        }

        if ( isset( $result['swiper_reset'] ) ) {
            WP_CLI::log( $result['swiper_reset'] ? 'Refreshed Swiper asset sources.' : 'No Swiper asset sources to refresh.' );
        }
    }

    private function assert_multisite(): void {
        if ( ! is_multisite() ) {
            WP_CLI::error( 'The --network flag can only be used in multisite environments.' );
        }
    }

    private function get_network_site_ids(): array {
        $site_ids = get_sites(
            [
                'fields' => 'ids',
                'number' => 0,
            ]
        );

        return array_map( 'absint', $site_ids );
    }

    private function get_plugin(): Plugin {
        if ( ! self::$plugin instanceof Plugin ) {
            WP_CLI::error( 'The Ma Galerie Automatique plugin instance is not available.' );
        }

        return self::$plugin;
    }
}
