<?php

/**
 * @group plugin
 */
class PluginHeadersTest extends WP_UnitTestCase {
    public function test_plugin_file_declares_wordpress_and_php_headers(): void {
        $contents = file_get_contents(
            dirname( __DIR__, 2 ) . '/ma-galerie-automatique/ma-galerie-automatique.php'
        );

        $this->assertIsString( $contents );
        $this->assertMatchesRegularExpression( '/Requires at least:\s*6\.0/', $contents );
        $this->assertMatchesRegularExpression( '/Requires PHP:\s*7\.4/', $contents );
        $this->assertMatchesRegularExpression( '/Tested up to:\s*7\.1/', $contents );
    }
}
