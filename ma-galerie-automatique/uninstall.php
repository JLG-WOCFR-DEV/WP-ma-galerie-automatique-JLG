<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

if ( ! function_exists( 'mga_get_translation_cache_directory' ) ) {
    function mga_get_translation_cache_directory(): string {
        $uploads = wp_upload_dir( null, false );

        if ( empty( $uploads['basedir'] ) ) {
            return '';
        }

        return trailingslashit( $uploads['basedir'] ) . 'mga-translations';
    }
}

if ( ! function_exists( 'mga_delete_translation_cache_directory' ) ) {
    function mga_delete_translation_cache_directory(): void {
        $directory = mga_get_translation_cache_directory();

        if ( '' === $directory || ! is_dir( $directory ) ) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator( $directory, \FilesystemIterator::SKIP_DOTS ),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ( $iterator as $file_info ) {
            if ( $file_info->isDir() ) {
                @rmdir( $file_info->getPathname() );
                continue;
            }

            $extension = strtolower( $file_info->getExtension() );

            if ( in_array( $extension, [ 'mo', 'hash' ], true ) ) {
                @unlink( $file_info->getPathname() );
            }
        }

        if ( mga_is_directory_empty( $directory ) ) {
            @rmdir( $directory );
        }
    }
}

if ( ! function_exists( 'mga_is_directory_empty' ) ) {
    function mga_is_directory_empty( string $directory ): bool {
        $handle = opendir( $directory );

        if ( false === $handle ) {
            return false;
        }

        try {
            while ( false !== ( $entry = readdir( $handle ) ) ) {
                if ( '.' === $entry || '..' === $entry ) {
                    continue;
                }

                return false;
            }
        } finally {
            closedir( $handle );
        }

        return true;
    }
}

if ( is_multisite() ) {
    $site_ids = get_sites(
        [
            'fields' => 'ids',
            'number' => 0,
        ]
    );

    foreach ( $site_ids as $site_id ) {
        switch_to_blog( $site_id );
        delete_option( 'mga_settings' );
        delete_option( 'mga_swiper_asset_sources' );
        delete_option( 'mga_detection_cache_version' );
        delete_post_meta_by_key( '_mga_has_linked_images' );
        mga_delete_translation_cache_directory();
        restore_current_blog();
    }

    return;
}

delete_option( 'mga_settings' );
delete_option( 'mga_swiper_asset_sources' );
delete_option( 'mga_detection_cache_version' );
delete_post_meta_by_key( '_mga_has_linked_images' );
mga_delete_translation_cache_directory();
