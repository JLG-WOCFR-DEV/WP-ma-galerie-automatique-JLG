<?php
/**
 * @group settings
 */
class SettingsSanitizeTest extends WP_UnitTestCase {
    /**
     * @dataProvider sanitize_settings_provider
     *
     * @param array $input
     * @param array $existing
     * @param array $expected_subset
     */
    public function test_sanitize_settings( $input, $existing, $expected_subset ) {
        $result = mga_sanitize_settings( $input, $existing );

        foreach ( $expected_subset as $key => $expected_value ) {
            $this->assertArrayHasKey( $key, $result, sprintf( 'The %s key should exist in the sanitized settings.', $key ) );
            $this->assertSame( $expected_value, $result[ $key ], sprintf( 'The %s key did not match the expected sanitized value.', $key ) );
        }
    }

    /**
     * Provides scenarios that exercise the mga_sanitize_settings() bounds and merge logic.
     *
     * @return array[]
     */
    public function sanitize_settings_provider() {
        $defaults          = mga_get_default_settings();
        $all_post_types    = get_post_types( [], 'names' );
        $default_tracked   = array_values( array_intersect( (array) $defaults['tracked_post_types'], $all_post_types ) );

        return [
            'numeric_bounds' => [
                [
                    'delay'             => 0,
                    'thumb_size'        => 200,
                    'thumb_size_mobile' => 5,
                    'bg_opacity'        => 1.5,
                    'z_index'           => -10,
                    'loop'              => '',
                    'autoplay_start'    => 1,
                    'debug_mode'        => '1',
                ],
                [],
                [
                    'delay'          => 1,
                    'thumb_size'     => 50,
                    'thumb_size_mobile' => 40,
                    'bg_opacity'     => 1.0,
                    'z_index'        => 0,
                    'loop'           => false,
                    'autoplay_start' => true,
                    'debug_mode'     => true,
                ],
            ],
            'bg_opacity_lower_bound' => [
                [
                    'bg_opacity' => -2,
                ],
                [],
                [
                    'bg_opacity' => 0.0,
                ],
            ],
            'invalid_color_and_selectors' => [
                [
                    'accent_color'      => 'not-a-color',
                    'contentSelectors'  => [
                        ' <div>.gallery</div> ',
                        "	",
                        '.gallery',
                        '.gallery ',
                    ],
                    'tracked_post_types' => [ 'invalid', 'page', 'nonexistent' ],
                    'allowBodyFallback'  => '1',
                    'background_style'   => 'invalid',
                ],
                [],
                [
                    'accent_color'     => $defaults['accent_color'],
                    'contentSelectors' => [ '.gallery' ],
                    'tracked_post_types'=> [ 'page' ],
                    'allowBodyFallback' => true,
                    'background_style'  => $defaults['background_style'],
                ],
            ],
            'bogus_post_types_fall_back_to_defaults' => [
                [
                    'tracked_post_types' => [ 'not-real', 'also_bad' ],
                ],
                [],
                [
                    'tracked_post_types' => $default_tracked,
                ],
            ],
            'existing_settings_merge_logic' => [
                [
                    'contentSelectors' => 'body',
                ],
                [
                    'contentSelectors'   => [ ' .existing ', '<span>#persisted</span>', '' ],
                    'tracked_post_types' => [ 'page', 'invalid', 'post' ],
                ],
                [
                    'contentSelectors'   => [ '.existing', '#persisted' ],
                    'tracked_post_types' => [ 'page', 'post' ],
                ],
            ],
        ];
    }
}

