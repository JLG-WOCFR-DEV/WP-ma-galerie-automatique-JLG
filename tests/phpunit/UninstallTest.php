<?php
class UninstallTest extends WP_UnitTestCase {
    public function test_uninstall_removes_translation_cache_directory(): void {
        $uploads = wp_upload_dir( null, false );

        $this->assertNotEmpty(
            $uploads['basedir'],
            'The uploads base directory should be available for uninstall cleanup.'
        );

        $cache_dir = trailingslashit( $uploads['basedir'] ) . 'mga-translations';
        $mo_file   = trailingslashit( $cache_dir ) . 'lightbox-jlg-fr_FR.mo';
        $hash_file = $mo_file . '.hash';

        wp_mkdir_p( $cache_dir );
        file_put_contents( $mo_file, 'fake-mo' );
        file_put_contents( $hash_file, 'fake-hash' );

        $this->assertDirectoryExists( $cache_dir, 'The cache directory should be created for the test fixture.' );
        $this->assertFileExists( $mo_file, 'A cached translation file should exist before uninstall.' );
        $this->assertFileExists( $hash_file, 'A cached hash file should exist before uninstall.' );

        if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
            define( 'WP_UNINSTALL_PLUGIN', true );
        }

        require dirname( __DIR__, 2 ) . '/ma-galerie-automatique/uninstall.php';

        $this->assertFalse(
            is_dir( $cache_dir ),
            'Uninstalling the plugin should remove the cached translations directory.'
        );
        $this->assertFileDoesNotExist( $mo_file, 'The cached translation file should be removed during uninstall.' );
        $this->assertFileDoesNotExist( $hash_file, 'The cached hash file should be removed during uninstall.' );
    }
}
