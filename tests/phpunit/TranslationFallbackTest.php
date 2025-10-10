<?php
/**
 * @group i18n
 */
class TranslationFallbackTest extends WP_UnitTestCase {
    private string $cache_dir = '';

    public function setUp(): void {
        parent::setUp();

        $this->cache_dir = $this->get_cache_directory();
        $this->purge_cache_directory();
    }

    public function tearDown(): void {
        $this->purge_cache_directory();

        parent::tearDown();
    }

    public function test_base64_fallback_generates_and_reuses_cached_file() {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        $manager = $plugin->translation_manager();
        $this->assertInstanceOf( \MaGalerieAutomatique\Translation\Manager::class, $manager );

        $locale_switched = false;

        if ( function_exists( 'switch_to_locale' ) ) {
            $locale_switched = switch_to_locale( 'fr_FR' );
        }

        $loaded = $manager->load_textdomain( true );

        if ( $locale_switched && function_exists( 'restore_previous_locale' ) ) {
            restore_previous_locale();
        }

        $this->assertTrue( $loaded, 'The fallback loader should successfully load the Base64 encoded translation file.' );

        $cached_file = trailingslashit( $this->cache_dir ) . 'lightbox-jlg-fr_FR.mo';
        $this->assertFileExists( $cached_file, 'The decoded `.mo` file should be cached in the uploads directory.' );

        $initial_mtime = filemtime( $cached_file );
        $this->assertIsInt( $initial_mtime, 'The cached file should expose a modification time.' );

        sleep( 1 );

        $manager->load_textdomain( true );

        $second_mtime = filemtime( $cached_file );
        $this->assertSame( $initial_mtime, $second_mtime, 'A matching hash should avoid regenerating the cached file.' );
    }

    public function test_switch_locale_triggers_fallback_reload(): void {
        if ( ! function_exists( 'switch_to_locale' ) || ! function_exists( 'restore_previous_locale' ) ) {
            $this->markTestSkipped( 'Locale switching is not available in this WordPress version.' );
        }

        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        $cached_file = trailingslashit( $this->cache_dir ) . 'lightbox-jlg-fr_FR.mo';
        $this->assertFileDoesNotExist( $cached_file, 'The fallback cache should be empty before switching locale.' );

        $switched = switch_to_locale( 'fr_FR' );
        $this->assertTrue( $switched, 'The locale switch helper should succeed when French is available.' );

        try {
            $this->assertFileExists(
                $cached_file,
                'Switching locale should trigger the Base64 fallback and generate the cached translation file.'
            );
        } finally {
            restore_previous_locale();
        }
    }

    private function purge_cache_directory(): void {
        if ( ! $this->cache_dir || ! is_dir( $this->cache_dir ) ) {
            return;
        }

        $files = glob( trailingslashit( $this->cache_dir ) . 'lightbox-jlg-*' );

        if ( ! is_array( $files ) ) {
            return;
        }

        foreach ( $files as $file ) {
            if ( is_file( $file ) ) {
                unlink( $file );
            }
        }
    }

    private function get_cache_directory(): string {
        $uploads = wp_upload_dir( null, false );

        if ( empty( $uploads['basedir'] ) ) {
            return '';
        }

        $directory = trailingslashit( $uploads['basedir'] ) . 'mga-translations';

        if ( ! is_dir( $directory ) ) {
            wp_mkdir_p( $directory );
        }

        return $directory;
    }
}
