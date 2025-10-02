( function() {
    'use strict';

    var root = window || {};
    var wp = root.wp || {};

    if ( ! wp.hooks || ! wp.compose || ! wp.element || ! wp.blockEditor ) {
        return;
    }

    var hooks = wp.hooks;
    var compose = wp.compose;
    var element = wp.element;
    var blockEditor = wp.blockEditor || wp.editor;
    var data = wp.data || {};
    var i18n = wp.i18n || {};
    var __ = typeof i18n.__ === 'function' ? i18n.__ : function( text ) { return text; };

    var BlockListBlock = blockEditor && blockEditor.BlockListBlock ? blockEditor.BlockListBlock : null;

    if ( ! BlockListBlock || typeof hooks.addFilter !== 'function' || typeof compose.createHigherOrderComponent !== 'function' ) {
        return;
    }

    var createElement = element.createElement;
    var Fragment = element.Fragment || function Fragment( props ) {
        return props.children || null;
    };

    var previewSettings = root.mgaBlockEditorPreview || {};
    var noteText = typeof previewSettings.noteText === 'string' && previewSettings.noteText.trim()
        ? previewSettings.noteText
        : __( 'Lightbox active', 'lightbox-jlg' );

    var supportedBlocks = Array.isArray( previewSettings.supportedBlocks ) ? previewSettings.supportedBlocks : [];
    var previewBlockName = typeof previewSettings.previewBlockName === 'string' && previewSettings.previewBlockName
        ? previewSettings.previewBlockName
        : 'ma-galerie-automatique/lightbox-preview';

    var supportSet = ( function() {
        var list = supportedBlocks.slice();
        if ( list.indexOf( previewBlockName ) === -1 ) {
            list.push( previewBlockName );
        }
        var unique = {};
        for ( var i = 0; i < list.length; i++ ) {
            var key = String( list[ i ] || '' );
            if ( key ) {
                unique[ key ] = true;
            }
        }
        return unique;
    } )();

    function classnames() {
        var buffer = [];
        for ( var i = 0; i < arguments.length; i++ ) {
            var value = arguments[ i ];
            if ( ! value ) {
                continue;
            }
            if ( typeof value === 'string' ) {
                buffer.push( value );
            } else if ( Array.isArray( value ) ) {
                buffer = buffer.concat( value );
            }
        }
        return buffer.join( ' ' ).trim();
    }

    var lightboxHelpers = root.mgaLightboxPreview || {};
    var LIGHTBOX_ATTRIBUTE_KEY = typeof lightboxHelpers.lightboxAttributeKey === 'string' && lightboxHelpers.lightboxAttributeKey
        ? lightboxHelpers.lightboxAttributeKey
        : 'mgaLightboxOptions';
    var EFFECT_WHITELIST = { slide: true, fade: true };
    var SPEED_WHITELIST = { slow: true, normal: true, fast: true };
    var SHARE_WHITELIST = { show: true, hide: true };

    function sanitizeToken( value ) {
        if ( typeof value === 'undefined' || null === value ) {
            return '';
        }

        return String( value ).trim().toLowerCase().replace( /[^a-z0-9_-]/g, '' );
    }

    function fallbackSanitizeLightboxOptions( raw ) {
        if ( ! raw || typeof raw !== 'object' ) {
            return null;
        }

        var sanitized = {};
        var hasValue = false;

        if ( Object.prototype.hasOwnProperty.call( raw, 'effect' ) ) {
            var effect = sanitizeToken( raw.effect );
            if ( EFFECT_WHITELIST[ effect ] ) {
                sanitized.effect = effect;
                hasValue = true;
            }
        }

        if ( Object.prototype.hasOwnProperty.call( raw, 'speed' ) ) {
            var rawSpeed = raw.speed;
            var speed = '';

            if ( typeof rawSpeed === 'number' && rawSpeed > 0 ) {
                speed = String( Math.round( rawSpeed ) );
            } else if ( typeof rawSpeed === 'string' ) {
                speed = sanitizeToken( rawSpeed );
            }

            if ( SPEED_WHITELIST[ speed ] ) {
                sanitized.speed = speed;
                hasValue = true;
            } else if ( speed && ! isNaN( parseInt( speed, 10 ) ) ) {
                sanitized.speed = String( parseInt( speed, 10 ) );
                hasValue = true;
            }
        }

        if ( Object.prototype.hasOwnProperty.call( raw, 'share' ) ) {
            var share = sanitizeToken( raw.share );
            if ( SHARE_WHITELIST[ share ] ) {
                sanitized.share = share;
                hasValue = true;
            }
        }

        return hasValue ? sanitized : null;
    }

    function fallbackGetLightboxClasses( options ) {
        if ( ! options ) {
            return [];
        }

        var classes = [ 'mga-has-lightbox-options' ];

        if ( options.effect ) {
            classes.push( 'mga-effect-' + sanitizeToken( options.effect ) );
        }

        if ( options.speed ) {
            classes.push( 'mga-speed-' + sanitizeToken( options.speed ) );
        }

        if ( options.share ) {
            if ( 'hide' === options.share ) {
                classes.push( 'mga-share-hidden' );
            } else if ( 'show' === options.share ) {
                classes.push( 'mga-share-visible' );
            }
        }

        return classes;
    }

    var sanitizeLightboxOptions = typeof lightboxHelpers.sanitizeLightboxOptions === 'function'
        ? lightboxHelpers.sanitizeLightboxOptions
        : fallbackSanitizeLightboxOptions;

    var deriveLightboxClasses = typeof lightboxHelpers.getLightboxOptionClasses === 'function'
        ? lightboxHelpers.getLightboxOptionClasses
        : fallbackGetLightboxClasses;

    function encodeLightboxOptions( options ) {
        if ( ! options ) {
            return '';
        }

        try {
            return JSON.stringify( options );
        } catch ( error ) {
            return '';
        }
    }

    function blockIsSupported( block ) {
        if ( ! block || ! block.name ) {
            return false;
        }

        return !! supportSet[ block.name ];
    }

    function galleryHasLinkedImages( block ) {
        var attributes = block.attributes || {};

        if ( 'core/gallery' === block.name ) {
            if ( attributes.linkTo && 'none' !== attributes.linkTo ) {
                return true;
            }

            if ( Array.isArray( attributes.images ) ) {
                for ( var i = 0; i < attributes.images.length; i++ ) {
                    var image = attributes.images[ i ];
                    if ( image && ( image.url || image.link ) ) {
                        return true;
                    }
                }
            }

            return false;
        }

        if ( 'core/image' === block.name ) {
            if ( attributes.href && attributes.href.length ) {
                return true;
            }

            if ( attributes.linkDestination && 'none' !== attributes.linkDestination ) {
                return true;
            }

            return false;
        }

        if ( 'core/media-text' === block.name ) {
            return !! ( attributes.mediaLink && attributes.mediaLink.length );
        }

        if ( 'core/cover' === block.name ) {
            return !! ( attributes.url || attributes.mediaId );
        }

        if ( 'ma-galerie-automatique/lightbox-preview' === block.name ) {
            return true;
        }

        return false;
    }

    function shouldDecorateBlock( block ) {
        if ( ! blockIsSupported( block ) ) {
            return false;
        }

        return galleryHasLinkedImages( block );
    }

    var withLightboxPreview = compose.createHigherOrderComponent( function( OriginalComponent ) {
        return function( props ) {
            if ( ! props || ! shouldDecorateBlock( props.block ) ) {
                return createElement( OriginalComponent, props );
            }

            var extraClass = 'mga-editor-preview--lightbox';
            var mergedClassName = classnames( props.className, extraClass );
            var wrapperProps = props.wrapperProps ? Object.assign( {}, props.wrapperProps ) : {};
            wrapperProps.className = classnames( wrapperProps.className, extraClass );
            wrapperProps[ 'data-mga-lightbox-note' ] = noteText;

            var lightboxOptions = null;

            if ( props.block && props.block.attributes ) {
                lightboxOptions = sanitizeLightboxOptions( props.block.attributes[ LIGHTBOX_ATTRIBUTE_KEY ] );
            }

            if ( lightboxOptions ) {
                var encodedOptions = encodeLightboxOptions( lightboxOptions );
                var optionClasses = deriveLightboxClasses( lightboxOptions );

                mergedClassName = classnames( mergedClassName, optionClasses );
                wrapperProps.className = classnames( wrapperProps.className, optionClasses );

                if ( encodedOptions ) {
                    wrapperProps[ 'data-mga-lightbox' ] = encodedOptions;
                }

                if ( lightboxOptions.effect ) {
                    wrapperProps[ 'data-mga-effect' ] = lightboxOptions.effect;
                }

                if ( lightboxOptions.speed ) {
                    wrapperProps[ 'data-mga-speed' ] = lightboxOptions.speed;
                }

                if ( Object.prototype.hasOwnProperty.call( lightboxOptions, 'share' ) ) {
                    if ( 'hide' === lightboxOptions.share ) {
                        wrapperProps[ 'data-mga-share' ] = 'hide';
                    } else if ( 'show' === lightboxOptions.share ) {
                        wrapperProps[ 'data-mga-share' ] = 'show';
                    }
                }
            }

            var enhancedProps = Object.assign( {}, props, {
                className: mergedClassName,
                wrapperProps: wrapperProps
            } );

            return createElement( Fragment, null, createElement( OriginalComponent, enhancedProps ) );
        };
    }, 'withMgaLightboxPreview' );

    hooks.addFilter( 'editor.BlockListBlock', 'ma-galerie-automatique/lightbox-preview', withLightboxPreview );

    if ( data && typeof data.dispatch === 'function' && previewBlockName ) {
        try {
            data.dispatch( 'core/block-editor' ).updateSettings( {
                __experimentalPreferredStyleVariations: data.select( 'core/block-editor' ).getSettings().__experimentalPreferredStyleVariations,
            } );
        } catch ( error ) {
            // Silencieux : certaines versions de WordPress n’exposent pas updateSettings.
        }
    }
} )();
