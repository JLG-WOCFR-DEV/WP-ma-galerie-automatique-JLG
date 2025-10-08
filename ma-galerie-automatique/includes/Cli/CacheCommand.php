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
        $scope   = isset( $assoc_args['scope'] ) ? strtolower( (string) $assoc_args['scope'] ) : 'all';
        $network = isset( $assoc_args['network'] );

        if ( ! in_array( $scope, [ 'all', 'detection', 'swiper' ], true ) ) {
            WP_CLI::error( sprintf( 'Unknown scope "%s". Use "all", "detection" or "swiper".', $scope ) );
        }

        if ( $network ) {
            $this->assert_multisite();
            $site_ids = $this->get_network_site_ids();

            foreach ( $site_ids as $site_id ) {
                switch_to_blog( $site_id );
                WP_CLI::log( sprintf( 'Purging caches on site #%d (%s)...', $site_id, home_url() ) );
                $result = $this->purge_site_caches( $scope );
                $this->render_purge_summary( $result );
                restore_current_blog();
            }

            WP_CLI::success( 'Finished purging caches on the entire network.' );

            return;
        }

        $result = $this->purge_site_caches( $scope );
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

    private function purge_site_caches( string $scope ): array {
        $result = [
            'meta_deleted'      => 0,
            'transients_deleted' => 0,
            'swiper_reset'      => false,
        ];

        if ( in_array( $scope, [ 'all', 'detection' ], true ) ) {
            $result = array_merge( $result, $this->purge_detection_cache() );
        }

        if ( in_array( $scope, [ 'all', 'swiper' ], true ) ) {
            $result['swiper_reset'] = $this->purge_swiper_sources();
        }

        return $result;
    }

    private function purge_detection_cache(): array {
        global $wpdb;

        $meta_deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
                '_mga_has_linked_images'
            )
        );

        if ( ! is_int( $meta_deleted ) ) {
            $meta_deleted = 0;
        }

        $transient_pattern = $wpdb->esc_like( '_transient_mga_det_' ) . '%';
        $timeout_pattern   = $wpdb->esc_like( '_transient_timeout_mga_det_' ) . '%';

        $transients_deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                $transient_pattern,
                $timeout_pattern
            )
        );

        if ( ! is_int( $transients_deleted ) ) {
            $transients_deleted = 0;
        }

        Detection::bump_global_cache_version();

        wp_cache_flush();

        return [
            'meta_deleted'      => max( 0, $meta_deleted ),
            'transients_deleted' => max( 0, $transients_deleted ),
        ];
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
