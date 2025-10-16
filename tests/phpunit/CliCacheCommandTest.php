<?php

use MaGalerieAutomatique\Cli\CacheCommand;

if ( ! defined( 'WP_CLI' ) ) {
    define( 'WP_CLI', true );
}

if ( ! class_exists( 'WP_CLI_Command' ) ) {
    class WP_CLI_Command {}
}

if ( ! class_exists( 'WP_CLI' ) ) {
    class WP_CLI {
        public static array $messages = [];

        public static function add_command( $name, $callable ): void {
            unset( $name, $callable );
        }

        public static function log( $message ): void {
            self::$messages[] = (string) $message;
        }

        public static function success( $message ): void {
            self::$messages[] = (string) $message;
        }

        public static function error( $message ): void {
            throw new RuntimeException( (string) $message );
        }

        public static function reset_messages(): void {
            self::$messages = [];
        }
    }
}

final class CliCacheCommandTest extends WP_UnitTestCase {
    protected function setUp(): void {
        parent::setUp();

        if ( class_exists( 'WP_CLI' ) ) {
            WP_CLI::reset_messages();
        }

        CacheCommand::register( ma_galerie_automatique() );
    }

    public function test_detection_purge_runs_in_batches(): void {
        global $wpdb;

        $post_ids = self::factory()->post->create_many( 3 );

        foreach ( $post_ids as $post_id ) {
            add_post_meta( $post_id, '_mga_has_linked_images', 'first' );
            add_post_meta( $post_id, '_mga_has_linked_images', 'second' );
        }

        for ( $i = 0; $i < 5; $i++ ) {
            set_transient( 'mga_det_' . $i, 'value-' . $i, 60 );
        }

        $command   = new CacheCommand();
        $method    = new ReflectionMethod( CacheCommand::class, 'purge_detection_cache' );
        $method->setAccessible( true );
        $result = $method->invoke( $command, 2 );

        $this->assertSame( 6, $result['meta_deleted'] );
        $this->assertSame( 10, $result['transients_deleted'] );

        $meta_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = %s",
                '_mga_has_linked_images'
            )
        );

        $this->assertSame( 0, $meta_count );

        $options_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like( '_transient_mga_det_' ) . '%'
            )
        );

        $timeouts_count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
                $wpdb->esc_like( '_transient_timeout_mga_det_' ) . '%'
            )
        );

        $this->assertSame( 0, $options_count );
        $this->assertSame( 0, $timeouts_count );

        $this->assertNotEmpty( WP_CLI::$messages );
        $this->assertStringContainsString( 'batch', implode( ' ', WP_CLI::$messages ) );
    }
}
