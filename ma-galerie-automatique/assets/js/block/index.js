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
    var defaultSpeed = parseInt( getDefault( 'speed', 600 ), 10 ) || 600;
    var defaultEffect = getDefault( 'effect', 'slide' );
    var defaultEasing = getDefault( 'easing', 'ease-out' );
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

    var EFFECT_LABELS = {
        slide: __( 'Glissement', 'lightbox-jlg' ),
        fade: __( 'Fondu', 'lightbox-jlg' ),
        cube: __( 'Cube 3D', 'lightbox-jlg' ),
        coverflow: __( 'Coverflow 3D', 'lightbox-jlg' ),
        flip: __( 'Flip 3D', 'lightbox-jlg' )
    };

    var EASING_LABELS = {
        'ease-out': __( 'Décélération', 'lightbox-jlg' ),
        'ease-in-out': __( 'Douce', 'lightbox-jlg' ),
        'ease-in': __( 'Accélération progressive', 'lightbox-jlg' ),
        ease: __( 'Standard', 'lightbox-jlg' ),
        linear: __( 'Linéaire', 'lightbox-jlg' )
    };

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

    var ICON_DEFINITIONS = {
        play: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon mga-play-icon' },
            paths: [ { d: 'M8 5v14l11-7z' } ]
        },
        pause: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon mga-pause-icon' },
            paths: [ { d: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' } ]
        },
        zoom: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon' },
            paths: [
                { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
                { d: 'M10 9h-1v-1H8v1H7v1h1v1h1v-1h1V9z' }
            ]
        },
        download: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon mga-download-icon' },
            paths: [ { d: 'M5 20h14v-2H5v2zm7-16l-5 5h3v4h4v-4h3l-5-5z' } ]
        },
        share: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon mga-share-icon' },
            paths: [ { d: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11A2.99 2.99 0 0 0 18 7.91c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.03.47.09.7L8.07 9.7A2.99 2.99 0 0 0 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.03-.82l7.05 4.12c-.06.23-.08.46-.08.7 0 1.65 1.34 2.99 3 2.99s3-1.34 3-2.99-1.34-3-3-3z' } ]
        },
        fullscreen: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon' },
            paths: [ { d: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5V14h-2v3zM14 5v2h3v3h2V5h-5z' } ]
        },
        close: {
            viewBox: '0 0 24 24',
            svgProps: { className: 'mga-icon' },
            paths: [ { d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' } ]
        }
    };

    function renderToolbarButton( iconName, label ) {
        var iconDefinition = ICON_DEFINITIONS[ iconName ] || null;
        var svgChildren = [];

        if ( iconDefinition && iconDefinition.paths ) {
            for ( var i = 0; i < iconDefinition.paths.length; i++ ) {
                var pathDefinition = iconDefinition.paths[ i ];
                var pathProps = { d: pathDefinition.d };
                svgChildren.push( el( 'path', pathProps ) );
            }
        }

        var svgElement = iconDefinition
            ? ( function() {
                var svgProps = {
                    xmlns: 'http://www.w3.org/2000/svg',
                    viewBox: iconDefinition.viewBox,
                    fill: 'currentColor',
                    focusable: 'false'
                };

                if ( iconDefinition.svgProps ) {
                    for ( var prop in iconDefinition.svgProps ) {
                        if ( Object.prototype.hasOwnProperty.call( iconDefinition.svgProps, prop ) ) {
                            svgProps[ prop ] = iconDefinition.svgProps[ prop ];
                        }
                    }
                }

                return el.apply( null, [ 'svg', svgProps ].concat( svgChildren ) );
            } )()
            : iconName;

        return el(
            'button',
            {
                type: 'button',
                className: 'mga-toolbar-button',
                disabled: true,
                'aria-disabled': 'true'
            },
            el( 'span', { className: 'mga-icon', 'aria-hidden': 'true' }, svgElement ),
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
        var speed = attributes.speed || defaultSpeed;
        var effect = attributes.effect || defaultEffect;
        var easing = attributes.easing || defaultEasing;
        var bgOpacity = attributes.bgOpacity || defaultBgOpacity;
        var showThumbsMobile = typeof attributes.showThumbsMobile === 'boolean' ? attributes.showThumbsMobile : defaultThumbsMobile;
        var showZoom = typeof attributes.showZoom === 'boolean' ? attributes.showZoom : defaultZoom;
        var showDownload = typeof attributes.showDownload === 'boolean' ? attributes.showDownload : defaultDownload;
        var showShare = typeof attributes.showShare === 'boolean' ? attributes.showShare : defaultShare;
        var showFullscreen = typeof attributes.showFullscreen === 'boolean' ? attributes.showFullscreen : defaultFullscreen;

        var effectLabel = EFFECT_LABELS[ effect ] || effect;
        var easingLabel = EASING_LABELS[ easing ] || easing;
        var transitionDuration = parseInt( speed, 10 );
        if ( isNaN( transitionDuration ) ) {
            transitionDuration = defaultSpeed;
        }

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
                        autoplay ? renderToolbarButton( 'pause', __( 'Mettre en pause', 'lightbox-jlg' ) ) : renderToolbarButton( 'play', __( 'Lire', 'lightbox-jlg' ) ),
                        showZoom ? renderToolbarButton( 'zoom', __( 'Zoomer', 'lightbox-jlg' ) ) : null,
                        showDownload ? renderToolbarButton( 'download', __( 'Télécharger', 'lightbox-jlg' ) ) : null,
                        showShare ? renderToolbarButton( 'share', __( 'Partager', 'lightbox-jlg' ) ) : null,
                        showFullscreen ? renderToolbarButton( 'fullscreen', __( 'Plein écran', 'lightbox-jlg' ) ) : null,
                        renderToolbarButton( 'close', __( 'Fermer', 'lightbox-jlg' ) )
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
                el( 'span', { className: 'mga-block-preview__chip' }, __( 'Délai : ', 'lightbox-jlg' ) + delay + 's' ),
                el( 'span', { className: 'mga-block-preview__chip' }, __( 'Effet : ', 'lightbox-jlg' ) + effectLabel ),
                el( 'span', { className: 'mga-block-preview__chip' }, __( 'Transition : ', 'lightbox-jlg' ) + transitionDuration + 'ms' ),
                el( 'span', { className: 'mga-block-preview__chip' }, __( 'Courbe : ', 'lightbox-jlg' ) + easingLabel )
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
                    { title: __( 'Transitions', 'lightbox-jlg' ), initialOpen: false },
                    el( SelectControl, {
                        label: __( 'Effet Swiper', 'lightbox-jlg' ),
                        value: attributes.effect || defaultEffect,
                        options: [
                            { label: __( 'Glissement (recommandé)', 'lightbox-jlg' ), value: 'slide' },
                            { label: __( 'Fondu', 'lightbox-jlg' ), value: 'fade' },
                            { label: __( 'Cube 3D', 'lightbox-jlg' ), value: 'cube' },
                            { label: __( 'Coverflow 3D', 'lightbox-jlg' ), value: 'coverflow' },
                            { label: __( 'Flip 3D', 'lightbox-jlg' ), value: 'flip' }
                        ],
                        onChange: function( value ) {
                            setAttributes( { effect: value || defaultEffect } );
                        }
                    } ),
                    el( RangeControl, {
                        label: __( 'Vitesse de transition (ms)', 'lightbox-jlg' ),
                        min: 100,
                        max: 5000,
                        step: 50,
                        value: attributes.speed || defaultSpeed,
                        onChange: function( value ) {
                            var parsed = parseInt( value, 10 );
                            if ( isNaN( parsed ) ) {
                                parsed = defaultSpeed;
                            }
                            if ( parsed < 100 ) {
                                parsed = 100;
                            }
                            if ( parsed > 5000 ) {
                                parsed = 5000;
                            }
                            setAttributes( { speed: parsed } );
                        }
                    } ),
                    el( SelectControl, {
                        label: __( 'Courbe d’animation', 'lightbox-jlg' ),
                        value: attributes.easing || defaultEasing,
                        options: [
                            { label: __( 'Décélération (par défaut)', 'lightbox-jlg' ), value: 'ease-out' },
                            { label: __( 'Douce (aller-retour)', 'lightbox-jlg' ), value: 'ease-in-out' },
                            { label: __( 'Accélération progressive', 'lightbox-jlg' ), value: 'ease-in' },
                            { label: __( 'Standard CSS', 'lightbox-jlg' ), value: 'ease' },
                            { label: __( 'Linéaire', 'lightbox-jlg' ), value: 'linear' }
                        ],
                        onChange: function( value ) {
                            setAttributes( { easing: value || defaultEasing } );
                        }
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
            speed: { type: 'number', default: defaultSpeed },
            effect: { type: 'string', default: defaultEffect },
            easing: { type: 'string', default: defaultEasing },
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
