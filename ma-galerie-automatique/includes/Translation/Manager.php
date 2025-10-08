<?php

namespace MaGalerieAutomatique\Translation;

use MaGalerieAutomatique\Plugin;

class Manager {
    private Plugin $plugin;

    public function __construct( Plugin $plugin ) {
        $this->plugin = $plugin;
    }

    public function load_textdomain( bool $force_fallback = false ): bool {
        $domain = 'lightbox-jlg';

        if ( ! $force_fallback && $this->plugin->languages_directory_exists() ) {
            $relative_path = \dirname( \plugin_basename( $this->plugin->get_plugin_file() ) ) . '/languages';

            if ( \load_plugin_textdomain( $domain, false, $relative_path ) ) {
                return true;
            }
        }

        return $this->load_from_base64_fallback( $domain );
    }

    public function handle_switch_blog(): void {
        // No persistent state kept between requests, but this hook allows future extensions
        // (like per-site caches) to clear themselves when the blog changes.
    }

    private function load_from_base64_fallback( string $domain ): bool {
        $locale      = $this->get_locale();
        $base64_path = \trailingslashit( $this->plugin->get_languages_path() ) . $domain . '-' . $locale . '.mo.b64';

        if ( ! file_exists( $base64_path ) ) {
            return false;
        }

        $hash = \hash_file( 'sha256', $base64_path );

        if ( ! $hash ) {
            return false;
        }

        $cache_path = $this->get_cache_directory();

        if ( ! $cache_path ) {
            return false;
        }

        $mo_filename   = $domain . '-' . $locale . '.mo';
        $cached_mo     = \trailingslashit( $cache_path ) . $mo_filename;
        $cached_hash   = $cached_mo . '.hash';
        $needs_refresh = true;

        if ( file_exists( $cached_mo ) && file_exists( $cached_hash ) ) {
            $stored_hash = trim( (string) file_get_contents( $cached_hash ) );

            if ( $stored_hash && hash_equals( $hash, $stored_hash ) ) {
                $needs_refresh = false;
            }
        }

        if ( $needs_refresh && ! $this->rebuild_cached_mo_file( $base64_path, $cached_mo, $cached_hash, $hash ) ) {
            return false;
        }

        return \load_textdomain( $domain, $cached_mo );
    }

    private function rebuild_cached_mo_file( string $base64_path, string $cached_mo, string $cached_hash, string $hash ): bool {
        $encoded = file_get_contents( $base64_path );

        if ( false === $encoded ) {
            return false;
        }

        $decoded = base64_decode( $encoded, true );

        if ( false === $decoded ) {
            return false;
        }

        $bytes_written = file_put_contents( $cached_mo, $decoded, LOCK_EX );

        if ( false === $bytes_written ) {
            return false;
        }

        file_put_contents( $cached_hash, $hash, LOCK_EX );

        return true;
    }

    private function get_cache_directory(): string {
        $uploads = \wp_upload_dir( null, false );

        if ( empty( $uploads['basedir'] ) ) {
            return '';
        }

        $directory = \trailingslashit( $uploads['basedir'] ) . 'mga-translations';

        if ( is_dir( $directory ) ) {
            return $directory;
        }

        if ( \wp_mkdir_p( $directory ) ) {
            return $directory;
        }

        return '';
    }

    private function get_locale(): string {
        if ( function_exists( '\\determine_locale' ) ) {
            $locale = \determine_locale();

            if ( $locale ) {
                return $locale;
            }
        }

        if ( function_exists( '\\get_locale' ) ) {
            $locale = \get_locale();

            if ( $locale ) {
                return $locale;
            }
        }

        return 'en_US';
    }
}
