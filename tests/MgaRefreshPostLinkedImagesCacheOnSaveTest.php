<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class MgaRefreshPostLinkedImagesCacheOnSaveTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $GLOBALS['mock_wp']['filters'] = [];
        $GLOBALS['mock_wp']['options'] = [];
        $GLOBALS['mock_wp']['posts']   = [];
        $GLOBALS['mock_wp']['meta']    = [];
    }

    public function test_string_option_value_does_not_trigger_warnings(): void
    {
        $post = new WP_Post([
            'ID' => 123,
            'post_type' => 'post',
            'post_content' => '',
        ]);

        $GLOBALS['mock_wp']['posts'][ $post->ID ] = $post;

        add_filter(
            'option_mga_settings',
            static function ( $value ) {
                return 'not-an-array';
            }
        );

        $warnings = [];
        set_error_handler(
            static function ( int $errno, string $errstr ) use ( &$warnings ): bool {
                if ( E_WARNING === $errno ) {
                    $warnings[] = $errstr;

                    return true;
                }

                return false;
            }
        );

        mga_refresh_post_linked_images_cache_on_save( $post->ID, $post );

        restore_error_handler();

        $this->assertSame([], $warnings, 'No PHP warnings should be emitted when option_mga_settings returns a string.');
    }
}
