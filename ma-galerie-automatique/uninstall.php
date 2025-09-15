<?php
/**
 * Désinstalle le plugin.
 *
 * Supprime les options enregistrées.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

delete_option( 'mga_settings' );

