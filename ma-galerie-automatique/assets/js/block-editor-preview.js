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
