<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
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
        delete_post_meta_by_key( '_mga_has_linked_images' );
        restore_current_blog();
    }

    return;
}

delete_option( 'mga_settings' );
delete_option( 'mga_swiper_asset_sources' );
delete_post_meta_by_key( '_mga_has_linked_images' );
