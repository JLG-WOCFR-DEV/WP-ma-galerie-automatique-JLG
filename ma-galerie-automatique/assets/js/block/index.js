/* global mgaBlockDefaults */
( function() {
    'use strict';

    var root = window || {};
    var wp = root.wp || {};

    if ( ! wp.blocks || ! wp.element || ! wp.components ) {
        return;
    }

    var registerBlockType = wp.blocks.registerBlockType;

    if ( ! registerBlockType ) {
        return;
    }

    var i18n = wp.i18n || {};
    var __ = typeof i18n.__ === 'function' ? i18n.__ : function( text ) {
        return text;
    };

    var element = wp.element;
    var el = element.createElement;
    var Fragment = element.Fragment || function Fragment( props ) {
        return props.children || null;
    };

    var blockEditor = wp.blockEditor || wp.editor || {};
    var InspectorControls = blockEditor.InspectorControls;
    var useBlockProps = typeof blockEditor.useBlockProps === 'function'
        ? blockEditor.useBlockProps
        : function( extraProps ) {
            return extraProps || {};
        };

    var components = wp.components || {};
    var PanelBody = components.PanelBody;
    var ToggleControl = components.ToggleControl;
    var SelectControl = components.SelectControl;
    var RangeControl = components.RangeControl;
    var ColorPalette = components.ColorPalette;
    var BaseControl = components.BaseControl;
    var Notice = components.Notice;

    var data = wp.data || {};
    var useSelect = typeof data.useSelect === 'function' ? data.useSelect : null;

    var defaults = root.mgaBlockDefaults || {};

    function getDefault( key, fallback ) {
        if ( Object.prototype.hasOwnProperty.call( defaults, key ) ) {
            return defaults[ key ];
        }

        return fallback;
    }

    var defaultAccent = getDefault( 'accentColor', '#ffffff' );
    var defaultBackgroundStyle = getDefault( 'backgroundStyle', 'echo' );
    var defaultAutoplay = !! getDefault( 'autoplay', false );
    var defaultLoop = !! getDefault( 'loop', true );
    var defaultDelay = parseInt( getDefault( 'delay', 4 ), 10 ) || 4;
    var defaultBgOpacity = parseFloat( getDefault( 'bgOpacity', 0.95 ) ) || 0.95;
    var defaultThumbsMobile = !! getDefault( 'showThumbsMobile', true );
    var defaultZoom = !! getDefault( 'showZoom', true );
    var defaultDownload = !! getDefault( 'showDownload', true );
    var defaultShare = !! getDefault( 'showShare', true );
    var defaultFullscreen = !! getDefault( 'showFullscreen', true );
    var noteText = getDefault( 'noteText', __( 'Lightbox active', 'lightbox-jlg' ) );

    var PLACEHOLDER_IMAGES = [
        { color: '#3148a5', label: __( 'Montagnes', 'lightbox-jlg' ) },
        { color: '#c9356b', label: __( 'Portrait', 'lightbox-jlg' ) },
        { color: '#f4a261', label: __( 'Architecture', 'lightbox-jlg' ) }
    ];

    function createPlaceholder( color, label ) {
        var safeColor = color || '#888888';
        var safeLabel = label || '';
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" role="img" aria-label="' + safeLabel.replace( /"/g, '&quot;' ) + '">' +
            '<defs>' +
                '<linearGradient id="grad" x1="0%" x2="100%" y1="0%" y2="100%">' +
                    '<stop offset="0%" stop-color="' + safeColor + '" stop-opacity="0.95" />' +
                    '<stop offset="100%" stop-color="#111" stop-opacity="0.85" />' +
                '</linearGradient>' +
            '</defs>' +
            '<rect width="600" height="400" fill="url(#grad)" />' +
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="#fff" font-family="sans-serif" opacity="0.9">' + safeLabel.replace( /</g, '&lt;' ) + '</text>' +
        '</svg>';

        return 'data:image/svg+xml;utf8,' + encodeURIComponent( svg );
    }

    function getPaletteColors() {
        if ( ! useSelect ) {
            return [];
        }

        return useSelect( function( select ) {
            var editorStore = select( 'core/block-editor' );

            if ( ! editorStore || typeof editorStore.getSettings !== 'function' ) {
                return [];
            }

            var settings = editorStore.getSettings();

            if ( settings && settings.colors ) {
                return settings.colors;
            }

            return [];
        }, [] ) || [];
    }

    function renderToolbarButton( icon, label ) {
        return el(
            'button',
            {
                type: 'button',
                className: 'mga-toolbar-button',
                disabled: true,
                'aria-disabled': 'true'
            },
            el( 'span', { className: 'mga-icon', 'aria-hidden': 'true' }, icon ),
            el( 'span', { className: 'mga-screen-reader-text' }, label )
        );
    }

    function Preview( props ) {
        var attributes = props.attributes || {};
        var accentColor = attributes.accentColor || defaultAccent;
        var backgroundStyle = attributes.backgroundStyle || defaultBackgroundStyle;
        var autoplay = typeof attributes.autoplay === 'boolean' ? attributes.autoplay : defaultAutoplay;
        var loop = typeof attributes.loop === 'boolean' ? attributes.loop : defaultLoop;
        var delay = attributes.delay || defaultDelay;
        var bgOpacity = attributes.bgOpacity || defaultBgOpacity;
        var showThumbsMobile = typeof attributes.showThumbsMobile === 'boolean' ? attributes.showThumbsMobile : defaultThumbsMobile;
        var showZoom = typeof attributes.showZoom === 'boolean' ? attributes.showZoom : defaultZoom;
        var showDownload = typeof attributes.showDownload === 'boolean' ? attributes.showDownload : defaultDownload;
        var showShare = typeof attributes.showShare === 'boolean' ? attributes.showShare : defaultShare;
        var showFullscreen = typeof attributes.showFullscreen === 'boolean' ? attributes.showFullscreen : defaultFullscreen;

        var viewerClasses = [ 'mga-viewer', 'mga-block-preview__viewer' ];

        if ( 'blur' === backgroundStyle ) {
            viewerClasses.push( 'mga-has-blur' );
        } else if ( 'texture' === backgroundStyle ) {
            viewerClasses.push( 'mga-has-texture' );
        }

        if ( ! showThumbsMobile ) {
            viewerClasses.push( 'mga-hide-thumbs-mobile' );
        }

        var viewerStyle = {
            '--mga-accent-color': accentColor,
            '--mga-bg-opacity': String( bgOpacity )
        };

        var slides = [];

        for ( var i = 0; i < PLACEHOLDER_IMAGES.length; i++ ) {
            var item = PLACEHOLDER_IMAGES[ i ];
            slides.push( el(
                'div',
                {
                    key: 'slide-' + i,
                    className: 'swiper-slide' + ( i === 0 ? ' swiper-slide-active' : '' )
                },
                el( 'img', {
                    src: createPlaceholder( item.color, item.label ),
                    alt: item.label,
                    loading: 'lazy'
                } )
            ) );
        }

        var thumbs = [];

        for ( var j = 0; j < PLACEHOLDER_IMAGES.length; j++ ) {
            var thumb = PLACEHOLDER_IMAGES[ j ];
            thumbs.push( el(
                'div',
                {
                    key: 'thumb-' + j,
                    className: 'swiper-slide' + ( j === 0 ? ' swiper-slide-thumb-active' : '' )
                },
                el( 'button', { type: 'button', className: 'mga-thumb-button', disabled: true },
                    el( 'img', {
                        src: createPlaceholder( thumb.color, thumb.label ),
                        alt: thumb.label,
                        loading: 'lazy'
                    } )
                )
            ) );
        }

        return el(
            'div',
            { className: 'mga-block-preview__container' },
            el(
                'div',
                { className: viewerClasses.join( ' ' ), style: viewerStyle, 'aria-hidden': 'true' },
                el(
                    'div',
                    { className: 'mga-header' },
                    el( 'span', { className: 'mga-counter' }, '1 / ' + PLACEHOLDER_IMAGES.length ),
                    el(
                        'div',
                        { className: 'mga-toolbar' },
                        autoplay ? renderToolbarButton( '⏸', __( 'Mettre en pause', 'lightbox-jlg' ) ) : renderToolbarButton( '▶', __( 'Lire', 'lightbox-jlg' ) ),
                        showZoom ? renderToolbarButton( '🔍', __( 'Zoomer', 'lightbox-jlg' ) ) : null,
                        showDownload ? renderToolbarButton( '⬇', __( 'Télécharger', 'lightbox-jlg' ) ) : null,
                        showShare ? renderToolbarButton( '⤴', __( 'Partager', 'lightbox-jlg' ) ) : null,
                        showFullscreen ? renderToolbarButton( '⤢', __( 'Plein écran', 'lightbox-jlg' ) ) : null
                    )
                ),
                el(
                    'div',
                    { className: 'mga-main-swiper' },
                    el( 'div', { className: 'swiper-wrapper' }, slides ),
                    el( 'div', { className: 'swiper-button-prev', 'aria-hidden': 'true' }, '‹' ),
                    el( 'div', { className: 'swiper-button-next', 'aria-hidden': 'true' }, '›' )
                ),
                el(
                    'div',
                    { className: 'mga-caption-container' },
                    el( 'p', { className: 'mga-caption' }, __( 'Aperçu de la visionneuse', 'lightbox-jlg' ) )
                ),
                el(
                    'div',
                    { className: 'mga-thumbs-swiper' },
                    el( 'div', { className: 'swiper-wrapper' }, thumbs )
                )
            ),
            el(
                'div',
                { className: 'mga-block-preview__meta' },
                el( 'span', { className: 'mga-block-preview__chip' }, autoplay ? __( 'Lecture auto activée', 'lightbox-jlg' ) : __( 'Lecture manuelle', 'lightbox-jlg' ) ),
                el( 'span', { className: 'mga-block-preview__chip' }, loop ? __( 'Boucle', 'lightbox-jlg' ) : __( 'Une seule lecture', 'lightbox-jlg' ) ),
                el( 'span', { className: 'mga-block-preview__chip' }, __( 'Délai : ', 'lightbox-jlg' ) + delay + 's' )
            )
        );
    }

    function Edit( props ) {
        var attributes = props.attributes || {};
        var setAttributes = props.setAttributes || function() {};
        var palette = getPaletteColors();

        var blockProps = useBlockProps( {
            className: 'mga-block-preview mga-editor-preview--lightbox'
        } );

        if ( blockProps.className ) {
            blockProps.className += ' mga-block-preview--block';
        } else {
            blockProps.className = 'mga-block-preview mga-editor-preview--lightbox mga-block-preview--block';
        }

        blockProps[ 'data-mga-lightbox-note' ] = noteText;

        function onToggle( key ) {
            return function( value ) {
                var newValue = typeof value === 'boolean' ? value : ! attributes[ key ];
                var update = {};
                update[ key ] = newValue;
                setAttributes( update );
            };
        }

        function onChangeAccent( color ) {
            setAttributes( { accentColor: color || defaultAccent } );
        }

        return el(
            Fragment,
            null,
            InspectorControls ? el(
                InspectorControls,
                null,
                el(
                    PanelBody,
                    { title: __( 'Lecture automatique', 'lightbox-jlg' ), initialOpen: true },
                    el( ToggleControl, {
                        label: __( 'Activer l’autoplay', 'lightbox-jlg' ),
                        checked: typeof attributes.autoplay === 'boolean' ? attributes.autoplay : defaultAutoplay,
                        onChange: onToggle( 'autoplay' )
                    } ),
                    el( RangeControl, {
                        label: __( 'Délai entre les images (secondes)', 'lightbox-jlg' ),
                        min: 1,
                        max: 30,
                        value: attributes.delay || defaultDelay,
                        onChange: function( value ) {
                            var parsed = parseInt( value, 10 );
                            if ( ! parsed || parsed < 1 ) {
                                parsed = 1;
                            }
                            if ( parsed > 30 ) {
                                parsed = 30;
                            }
                            setAttributes( { delay: parsed } );
                        }
                    } ),
                    el( ToggleControl, {
                        label: __( 'Lecture en boucle', 'lightbox-jlg' ),
                        checked: typeof attributes.loop === 'boolean' ? attributes.loop : defaultLoop,
                        onChange: onToggle( 'loop' )
                    } )
                ),
                el(
                    PanelBody,
                    { title: __( 'Contrôles affichés', 'lightbox-jlg' ), initialOpen: false },
                    el( ToggleControl, {
                        label: __( 'Zoom', 'lightbox-jlg' ),
                        checked: typeof attributes.showZoom === 'boolean' ? attributes.showZoom : defaultZoom,
                        onChange: onToggle( 'showZoom' )
                    } ),
                    el( ToggleControl, {
                        label: __( 'Téléchargement', 'lightbox-jlg' ),
                        checked: typeof attributes.showDownload === 'boolean' ? attributes.showDownload : defaultDownload,
                        onChange: onToggle( 'showDownload' )
                    } ),
                    el( ToggleControl, {
                        label: __( 'Partager', 'lightbox-jlg' ),
                        checked: typeof attributes.showShare === 'boolean' ? attributes.showShare : defaultShare,
                        onChange: onToggle( 'showShare' )
                    } ),
                    el( ToggleControl, {
                        label: __( 'Plein écran', 'lightbox-jlg' ),
                        checked: typeof attributes.showFullscreen === 'boolean' ? attributes.showFullscreen : defaultFullscreen,
                        onChange: onToggle( 'showFullscreen' )
                    } )
                ),
                el(
                    PanelBody,
                    { title: __( 'Style', 'lightbox-jlg' ), initialOpen: false },
                    el( SelectControl, {
                        label: __( 'Arrière-plan', 'lightbox-jlg' ),
                        value: attributes.backgroundStyle || defaultBackgroundStyle,
                        options: [
                            { label: __( 'Écho d’image', 'lightbox-jlg' ), value: 'echo' },
                            { label: __( 'Texture', 'lightbox-jlg' ), value: 'texture' },
                            { label: __( 'Flou direct', 'lightbox-jlg' ), value: 'blur' }
                        ],
                        onChange: function( value ) {
                            setAttributes( { backgroundStyle: value || defaultBackgroundStyle } );
                        }
                    } ),
                    el( ToggleControl, {
                        label: __( 'Miniatures sur mobile', 'lightbox-jlg' ),
                        checked: typeof attributes.showThumbsMobile === 'boolean' ? attributes.showThumbsMobile : defaultThumbsMobile,
                        onChange: onToggle( 'showThumbsMobile' )
                    } ),
                    el( RangeControl, {
                        label: __( 'Opacité du fond', 'lightbox-jlg' ),
                        min: 0.5,
                        max: 1,
                        step: 0.05,
                        value: attributes.bgOpacity || defaultBgOpacity,
                        onChange: function( value ) {
                            var parsed = parseFloat( value );
                            if ( isNaN( parsed ) ) {
                                parsed = defaultBgOpacity;
                            }
                            if ( parsed < 0.5 ) {
                                parsed = 0.5;
                            }
                            if ( parsed > 1 ) {
                                parsed = 1;
                            }
                            setAttributes( { bgOpacity: parsed } );
                        }
                    } ),
                    ColorPalette ? el(
                        BaseControl,
                        { label: __( 'Couleur d’accent', 'lightbox-jlg' ) },
                        el( ColorPalette, {
                            value: attributes.accentColor || defaultAccent,
                            colors: palette,
                            disableCustomColors: false,
                            onChange: onChangeAccent
                        } )
                    ) : null,
                    ( ! ColorPalette && Notice ) ? el( Notice, { status: 'warning', isDismissible: false }, __( 'Votre installation de WordPress ne propose pas de sélecteur de couleur compatible.', 'lightbox-jlg' ) ) : null
                )
            ) : null,
            el(
                'div',
                blockProps,
                el( Preview, { attributes: attributes } )
            )
        );
    }

    registerBlockType( 'ma-galerie-automatique/lightbox-preview', {
        title: __( 'Lightbox – Aperçu', 'lightbox-jlg' ),
        description: __( 'Simulez la visionneuse en direct dans l’éditeur pour vérifier vos réglages.', 'lightbox-jlg' ),
        icon: 'format-gallery',
        category: 'media',
        keywords: [ __( 'lightbox', 'lightbox-jlg' ), __( 'galerie', 'lightbox-jlg' ), __( 'aperçu', 'lightbox-jlg' ) ],
        supports: {
            align: [ 'wide', 'full' ],
            html: false
        },
        attributes: {
            autoplay: { type: 'boolean', default: defaultAutoplay },
            loop: { type: 'boolean', default: defaultLoop },
            delay: { type: 'number', default: defaultDelay },
            backgroundStyle: { type: 'string', default: defaultBackgroundStyle },
            accentColor: { type: 'string', default: defaultAccent },
            bgOpacity: { type: 'number', default: defaultBgOpacity },
            showThumbsMobile: { type: 'boolean', default: defaultThumbsMobile },
            showZoom: { type: 'boolean', default: defaultZoom },
            showDownload: { type: 'boolean', default: defaultDownload },
            showShare: { type: 'boolean', default: defaultShare },
            showFullscreen: { type: 'boolean', default: defaultFullscreen }
        },
        edit: Edit,
        save: function() {
            return null;
        }
    } );

    root.mgaLightboxPreview = {
        Preview: Preview,
        defaults: defaults
    };
} )();
