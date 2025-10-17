<?php

namespace MaGalerieAutomatique\Translation;

use MaGalerieAutomatique\Plugin;

class Manager {
    private Plugin $plugin;

    private ?string $loaded_locale = null;

    public function __construct( Plugin $plugin ) {
        $this->plugin = $plugin;
    }

    public function load_textdomain( bool $force_fallback = false ): bool {
        $domain = 'lightbox-jlg';
        $locale = $this->get_locale();

        if (
            ! $force_fallback
            && $this->loaded_locale === $locale
            && function_exists( 'is_textdomain_loaded' )
            && \is_textdomain_loaded( $domain )
        ) {
            return true;
        }

        if ( ! $force_fallback && $this->plugin->languages_directory_exists() ) {
            $relative_path = \dirname( \plugin_basename( $this->plugin->get_plugin_file() ) ) . '/languages';

            if ( \load_plugin_textdomain( $domain, false, $relative_path ) ) {
                $this->loaded_locale = $locale;

                return true;
            }
        }

        $loaded = $this->load_from_base64_fallback( $domain, $locale );

        if ( $loaded ) {
            $this->loaded_locale = $locale;
        }

        return $loaded;
    }

    public function handle_switch_blog(): void {
        $this->loaded_locale = null;

        if ( function_exists( 'unload_textdomain' ) ) {
            \unload_textdomain( 'lightbox-jlg' );
        }

        $this->load_textdomain();
    }

    public function handle_switch_locale( string $new_locale, string $old_locale ): void {
        unset( $old_locale );

        if ( function_exists( 'unload_textdomain' ) ) {
            \unload_textdomain( 'lightbox-jlg' );
        }

        $this->loaded_locale = null;

        if ( '' !== $new_locale ) {
            $this->load_textdomain();
        }
    }

    private function load_from_base64_fallback( string $domain, string $locale ): bool {
        if ( function_exists( '\\sanitize_text_field' ) ) {
            $locale = \sanitize_text_field( $locale );
        }

        $safe_locale = (string) preg_replace( '/[^A-Za-z0-9_\\-]/', '', $locale );

        if ( '' === $safe_locale ) {
            /**
             * Fires when a locale string is rejected before loading translation files.
             *
             * @param string $locale The rejected locale string.
             */
            \do_action( 'mga_translation_invalid_locale', $locale );

            return false;
        }

        $base64_path = \trailingslashit( $this->plugin->get_languages_path() ) . $domain . '-' . $safe_locale . '.mo.b64';

        if ( ! file_exists( $base64_path ) ) {
            return false;
        }

        $hash = \hash_file( 'sha256', $base64_path );

        if ( ! $hash ) {
            return false;
        }

        $cache_path      = $this->get_cache_directory();
        $mo_filename     = $domain . '-' . $safe_locale . '.mo';
        $cached_hash     = null;
        $using_temp_file = false;

        if ( $cache_path ) {
            $cached_mo = \trailingslashit( $cache_path ) . $mo_filename;
            $cached_hash = $cached_mo . '.hash';
            $needs_refresh = true;

            if ( file_exists( $cached_mo ) && file_exists( $cached_hash ) ) {
                $stored_hash = trim( (string) file_get_contents( $cached_hash ) );

                if ( $stored_hash && hash_equals( $hash, $stored_hash ) ) {
                    $needs_refresh = false;
                }
            }
        } else {
            $cached_mo = $this->create_temp_mo_path( $mo_filename );

            if ( ! $cached_mo ) {
                return false;
            }

            $needs_refresh    = true;
            $using_temp_file  = true;
        }

        if ( $needs_refresh && ! $this->rebuild_cached_mo_file( $base64_path, $cached_mo, $cached_hash, $hash ) ) {
            if ( $using_temp_file && file_exists( $cached_mo ) ) {
                \unlink( $cached_mo );
            }

            return false;
        }

        $loaded = \load_textdomain( $domain, $cached_mo );

        if ( $using_temp_file && file_exists( $cached_mo ) ) {
            \unlink( $cached_mo );
        }

        return $loaded;
    }

    private function rebuild_cached_mo_file( string $base64_path, string $cached_mo, ?string $cached_hash, string $hash ): bool {
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

        if ( $cached_hash ) {
            file_put_contents( $cached_hash, $hash, LOCK_EX );
        }

        return true;
    }

    private function create_temp_mo_path( string $mo_filename ): string {
        if ( function_exists( '\\wp_tempnam' ) ) {
            $temporary = \wp_tempnam( $mo_filename );

            if ( $temporary ) {
                return $temporary;
            }
        }

        $temp_dir = function_exists( '\\get_temp_dir' ) ? \get_temp_dir() : \sys_get_temp_dir();

        if ( ! $temp_dir ) {
            return '';
        }

        $temporary = \tempnam( $temp_dir, 'mga-' );

        if ( false === $temporary ) {
            return '';
        }

        return $temporary;
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
