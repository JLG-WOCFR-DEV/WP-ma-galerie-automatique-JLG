<?php

use MaGalerieAutomatique\Plugin;

/**
 * @group blocks
 */
class PluginBlockSettingsTest extends WP_UnitTestCase {
    private function plugin(): Plugin {
        $plugin = mga_plugin();
        $this->assertInstanceOf( Plugin::class, $plugin, 'Plugin instance should be available.' );

        return $plugin;
    }

    public function test_prepare_block_settings_uses_defaults_for_missing_values(): void {
        $plugin = $this->plugin();

        $result = $plugin->prepare_block_settings( [] );

        $this->assertArrayHasKey( 'noteText', $result );
        $this->assertSame( __( 'Lightbox active', 'lightbox-jlg' ), $result['noteText'], 'The note text should use the translated default.' );
        $this->assertSame( '#ffffff', $result['accentColor'], 'Default accent colour should fall back to white when absent.' );
        $this->assertSame( 'echo', $result['backgroundStyle'], 'Background style should fall back to the expected default.' );
        $this->assertFalse( $result['autoplay'], 'Autoplay should be disabled by default.' );
        $this->assertFalse( $result['startOnClickedImage'], 'Viewer should not start on the clicked image by default.' );
        $this->assertTrue( $result['loop'], 'Looping should default to true for accessibility parity with the UI.' );
        $this->assertSame( 4, $result['delay'], 'Default delay should match the settings baseline.' );
        $this->assertSame( 600, $result['speed'], 'Default speed should match the settings baseline.' );
        $this->assertSame( 'slide', $result['effect'], 'Transition effect should revert to the safe default.' );
        $this->assertSame( 'ease-out', $result['easing'], 'Easing should match the default easing curve.' );
        $this->assertSame( 0.95, $result['bgOpacity'], 'Background opacity should fall back to the default opacity.' );
        $this->assertSame( 'bottom', $result['thumbsLayout'], 'Thumbnail layout should fall back to the default layout.' );
        $expected_disabled_toggles = [
            'showThumbsMobile',
            'showZoom',
            'showDownload',
            'showShare',
            'showCta',
            'showFullscreen',
        ];

        foreach ( $expected_disabled_toggles as $toggle_key ) {
            $this->assertArrayHasKey( $toggle_key, $result, sprintf( 'The %s toggle should be part of the defaults payload.', $toggle_key ) );
            $this->assertFalse( $result[ $toggle_key ], sprintf( 'The %s toggle should default to false until explicitly enabled.', $toggle_key ) );
        }
    }

    public function test_prepare_block_settings_casts_and_sanitizes_custom_values(): void {
        $plugin = $this->plugin();

        $input = [
            'accent_color'          => '#ff00ff',
            'background_style'      => 'texture',
            'autoplay_start'        => 1,
            'start_on_clicked_image'=> '1',
            'loop'                  => 0,
            'delay'                 => '7',
            'speed'                 => '1500',
            'effect'                => 'fade',
            'easing'                => 'ease-in-out',
            'bg_opacity'            => '0.6',
            'thumbs_layout'         => 'left',
            'show_thumbs_mobile'    => '',
            'show_zoom'             => '0',
            'show_download'         => true,
            'show_share'            => '1',
            'show_cta'              => 0,
            'show_fullscreen'       => '0',
        ];

        $result = $plugin->prepare_block_settings( $input );

        $this->assertSame( '#ff00ff', $result['accentColor'], 'Valid hex colours should be preserved.' );
        $this->assertSame( 'texture', $result['backgroundStyle'], 'Background style should propagate as a string.' );
        $this->assertTrue( $result['autoplay'], 'Autoplay should turn truthy values into booleans.' );
        $this->assertTrue( $result['startOnClickedImage'], 'Start-on-clicked-image should reflect truthy values.' );
        $this->assertFalse( $result['loop'], 'Loop should be cast to boolean false for falsy payloads.' );
        $this->assertSame( 7, $result['delay'], 'Delay should be cast to integer.' );
        $this->assertSame( 1500, $result['speed'], 'Speed should be cast to integer.' );
        $this->assertSame( 'fade', $result['effect'], 'Effect should propagate as a string.' );
        $this->assertSame( 'ease-in-out', $result['easing'], 'Easing should propagate as a string.' );
        $this->assertSame( 0.6, $result['bgOpacity'], 'Opacity should be cast to float.' );
        $this->assertSame( 'left', $result['thumbsLayout'], 'Thumbnail layout should propagate as provided.' );
        $this->assertFalse( $result['showThumbsMobile'], 'Empty values should disable mobile thumbnails.' );
        $this->assertFalse( $result['showZoom'], 'String zero should disable the zoom control.' );
        $this->assertTrue( $result['showDownload'], 'Boolean true should keep the download control enabled.' );
        $this->assertTrue( $result['showShare'], 'String truthy values should enable the share control.' );
        $this->assertFalse( $result['showCta'], 'Zero should disable the CTA control.' );
        $this->assertFalse( $result['showFullscreen'], 'String zero should disable fullscreen support.' );
    }

    public function test_prepare_block_settings_recovers_from_invalid_accent_colour(): void {
        $plugin = $this->plugin();

        $result = $plugin->prepare_block_settings( [ 'accent_color' => 'magenta' ] );

        $this->assertSame( '#ffffff', $result['accentColor'], 'Invalid accent colours should degrade gracefully to the default.' );
    }
}
