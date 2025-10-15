<?php

use MaGalerieAutomatique\Admin\Settings;
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
        $this->assertTrue( $result['showThumbsMobile'], 'Mobile thumbnails should honour their default visibility.' );
        $this->assertTrue( $result['showZoom'], 'Zoom control should be enabled by default.' );
        $this->assertTrue( $result['showDownload'], 'Download control should be enabled by default.' );
        $this->assertTrue( $result['showShare'], 'Share control should be enabled by default.' );
        $this->assertTrue( $result['showCta'], 'CTA control should be enabled by default.' );
        $this->assertTrue( $result['showFullscreen'], 'Fullscreen control should be enabled by default.' );
    }

    public function test_prepare_block_settings_casts_and_sanitizes_custom_values(): void {
        $plugin = $this->plugin();

        $input = [
            'accent_color'           => '#ff00ff',
            'background_style'       => 'texture',
            'autoplay_start'         => 1,
            'start_on_clicked_image' => '1',
            'loop'                   => 0,
            'delay'                  => '7',
            'speed'                  => '1500',
            'effect'                 => 'FADE',
            'easing'                 => 'EASE-IN-OUT',
            'bg_opacity'             => '0.6',
            'thumbs_layout'          => 'LEFT',
            'show_thumbs_mobile'     => '',
            'show_zoom'              => '0',
            'show_download'          => true,
            'show_share'             => '1',
            'show_cta'               => 'false',
            'show_fullscreen'        => '0',
        ];

        $result = $plugin->prepare_block_settings( $input );

        $this->assertSame( '#ff00ff', $result['accentColor'], 'Valid hex colours should be preserved.' );
        $this->assertSame( 'texture', $result['backgroundStyle'], 'Background style should propagate as a string.' );
        $this->assertTrue( $result['autoplay'], 'Autoplay should turn truthy values into booleans.' );
        $this->assertTrue( $result['startOnClickedImage'], 'Start-on-clicked-image should reflect truthy values.' );
        $this->assertFalse( $result['loop'], 'Loop should be cast to boolean false for falsy payloads.' );
        $this->assertSame( 7, $result['delay'], 'Delay should be cast to integer.' );
        $this->assertSame( 1500, $result['speed'], 'Speed should be cast to integer.' );
        $this->assertSame( 'fade', $result['effect'], 'Effect should propagate after case-normalisation.' );
        $this->assertSame( 'ease-in-out', $result['easing'], 'Easing should propagate after case-normalisation.' );
        $this->assertSame( 0.6, $result['bgOpacity'], 'Opacity should be cast to float.' );
        $this->assertSame( 'left', $result['thumbsLayout'], 'Thumbnail layout should be normalised and preserved.' );
        $this->assertFalse( $result['showThumbsMobile'], 'Empty values should disable mobile thumbnails.' );
        $this->assertFalse( $result['showZoom'], 'String zero should disable the zoom control.' );
        $this->assertTrue( $result['showDownload'], 'Boolean true should keep the download control enabled.' );
        $this->assertTrue( $result['showShare'], 'String truthy values should enable the share control.' );
        $this->assertFalse( $result['showCta'], 'Falsey string values should disable the CTA control.' );
        $this->assertFalse( $result['showFullscreen'], 'String zero should disable fullscreen support.' );
    }

    public function test_prepare_block_settings_clamps_out_of_range_values(): void {
        $plugin = $this->plugin();

        $below_min = $plugin->prepare_block_settings(
            [
                'delay'                 => 0,
                'speed'                 => 50,
                'bg_opacity'            => '-2',
                'background_style'      => 'sparkle',
                'thumbs_layout'         => 'diagonal',
                'effect'                => 'warp',
                'easing'                => 'bouncy',
                'loop'                  => 'maybe',
                'show_download'         => 'perhaps',
                'show_thumbs_mobile'    => 'nope',
                'show_zoom'             => 'no',
                'show_share'            => 'false',
                'show_cta'              => '',
                'show_fullscreen'       => 'nah',
            ]
        );

        $this->assertSame( 1, $below_min['delay'], 'Delay should clamp to the minimum supported interval.' );
        $this->assertSame( 100, $below_min['speed'], 'Speed should clamp to the minimum supported value.' );
        $this->assertSame( Settings::MIN_OVERLAY_OPACITY, $below_min['bgOpacity'], 'Opacity should not drop below the minimum accessible threshold.' );
        $this->assertSame( 'echo', $below_min['backgroundStyle'], 'Unsupported background styles should fallback to the default.' );
        $this->assertSame( 'bottom', $below_min['thumbsLayout'], 'Unsupported thumbnail layouts should fallback to the default.' );
        $this->assertSame( 'slide', $below_min['effect'], 'Unsupported effects should fallback to the default transition.' );
        $this->assertSame( 'ease-out', $below_min['easing'], 'Unsupported easings should fallback to the default curve.' );
        $this->assertTrue( $below_min['loop'], 'Invalid loop values should fallback to the default.' );
        $this->assertTrue( $below_min['showDownload'], 'Invalid download toggle values should fallback to the default.' );
        $this->assertTrue( $below_min['showThumbsMobile'], 'Invalid thumb toggle values should fallback to the default.' );
        $this->assertFalse( $below_min['showZoom'], 'Explicit negative zoom values should disable the control.' );
        $this->assertFalse( $below_min['showShare'], 'Explicit negative share values should disable the control.' );
        $this->assertFalse( $below_min['showCta'], 'Empty CTA values should disable the control.' );
        $this->assertTrue( $below_min['showFullscreen'], 'Invalid fullscreen values should fallback to the default.' );

        $above_max = $plugin->prepare_block_settings(
            [
                'delay'      => 99,
                'speed'      => 9000,
                'bg_opacity' => '2.5',
            ]
        );

        $this->assertSame( 30, $above_max['delay'], 'Delay should clamp to the maximum supported interval.' );
        $this->assertSame( 5000, $above_max['speed'], 'Speed should clamp to the maximum supported value.' );
        $this->assertSame( 1.0, $above_max['bgOpacity'], 'Opacity should not exceed full opacity.' );
    }

    public function test_prepare_block_settings_recovers_from_invalid_accent_colour(): void {
        $plugin = $this->plugin();

        $result = $plugin->prepare_block_settings( [ 'accent_color' => 'magenta' ] );

        $this->assertSame( '#ffffff', $result['accentColor'], 'Invalid accent colours should degrade gracefully to the default.' );
    }
}
