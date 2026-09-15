<?php

/**
 * @group enqueue
 */
class EditorCanvasAssetsTest extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();

        wp_dequeue_style( 'mga-block-editor-preview' );
        wp_dequeue_script( 'mga-block-editor-preview' );
        wp_deregister_style( 'mga-block-editor-preview' );
    }

    public function tearDown(): void {
        wp_dequeue_style( 'mga-block-editor-preview' );
        wp_dequeue_script( 'mga-block-editor-preview' );

        if ( isset( $GLOBALS['current_screen'] ) ) {
            unset( $GLOBALS['current_screen'] );
        }

        parent::tearDown();
    }

    public function test_canvas_preview_css_enqueues_in_admin_via_block_assets(): void {
        set_current_screen( 'post' );

        $this->assertTrue( is_admin(), 'The post editor screen is an admin context.' );

        $this->assets()->enqueue_block_editor_canvas_assets();

        $this->assertTrue(
            wp_style_is( 'mga-block-editor-preview', 'enqueued' ),
            'Lightbox preview CSS must load on enqueue_block_assets so WP 7.1 copies it into the editor iframe.'
        );

        $inline = wp_styles()->get_data( 'mga-block-editor-preview', 'after' );
        $this->assertIsArray( $inline );
        $this->assertNotEmpty( $inline, 'Canvas CSS should include inline accent variables.' );
        $this->assertStringContainsString( '--mga-accent-color', implode( '', $inline ) );
    }

    public function test_canvas_preview_css_is_not_enqueued_on_frontend(): void {
        $this->assertFalse( is_admin() );

        $this->assets()->enqueue_block_editor_canvas_assets();

        $this->assertFalse(
            wp_style_is( 'mga-block-editor-preview', 'enqueued' ),
            'Preview CSS is editor-only and must not load on the frontend via enqueue_block_assets.'
        );
    }

    public function test_editor_assets_enqueue_script_but_not_canvas_css(): void {
        $this->assets()->enqueue_block_editor_assets();

        $this->assertTrue(
            wp_script_is( 'mga-block-editor-preview', 'enqueued' ),
            'Preview JS still belongs on enqueue_block_editor_assets (parent editor).'
        );
        $this->assertFalse(
            wp_style_is( 'mga-block-editor-preview', 'enqueued' ),
            'Canvas CSS must not be printed from enqueue_block_editor_assets (outside the iframe).'
        );
    }

    public function test_plugin_registers_block_asset_hooks(): void {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        $this->assertSame(
            10,
            has_action( 'enqueue_block_assets', [ $plugin->frontend_assets(), 'enqueue_block_editor_canvas_assets' ] )
        );
        $this->assertSame(
            10,
            has_action( 'enqueue_block_editor_assets', [ $plugin->frontend_assets(), 'enqueue_block_editor_assets' ] )
        );
    }

    private function assets(): \MaGalerieAutomatique\Frontend\Assets {
        $plugin = mga_plugin();
        $this->assertInstanceOf( \MaGalerieAutomatique\Plugin::class, $plugin );

        return $plugin->frontend_assets();
    }
}
