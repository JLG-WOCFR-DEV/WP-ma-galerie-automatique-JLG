<?php
/**
 * Template pour la page de réglages de la galerie automatique.
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Sécurité

// On prépare les valeurs de manière sécurisée pour éviter les erreurs
$defaults          = mga_get_default_settings();
$sanitized_settings = mga_sanitize_settings( $settings, $settings );
$settings          = wp_parse_args( $sanitized_settings, $defaults );
$style_presets     = mga_get_style_presets();

?>
<div class="wrap mga-admin-wrap">
    <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
    <?php settings_errors( 'mga_settings_group' ); ?>

    <form action="options.php" method="post" data-mga-settings-form>
        <?php settings_fields( 'mga_settings_group' ); ?>

        <div class="mga-wizard" data-mga-wizard>
            <ol class="mga-wizard__progress" data-mga-stepper aria-label="<?php echo esc_attr__( 'Étapes de configuration', 'lightbox-jlg' ); ?>">
                <li class="mga-wizard__progress-item is-active" data-mga-step-indicator data-step-index="0">
                    <span class="mga-wizard__progress-number">1</span>
                    <span class="mga-wizard__progress-label"><?php echo esc_html__( 'Préparer', 'lightbox-jlg' ); ?></span>
                </li>
                <li class="mga-wizard__progress-item" data-mga-step-indicator data-step-index="1">
                    <span class="mga-wizard__progress-number">2</span>
                    <span class="mga-wizard__progress-label"><?php echo esc_html__( 'Partager', 'lightbox-jlg' ); ?></span>
                </li>
                <li class="mga-wizard__progress-item" data-mga-step-indicator data-step-index="2">
                    <span class="mga-wizard__progress-number">3</span>
                    <span class="mga-wizard__progress-label"><?php echo esc_html__( 'Récapitulatif', 'lightbox-jlg' ); ?></span>
                </li>
            </ol>

            <div class="mga-wizard__panels">
                <section
                    class="mga-wizard__panel is-active"
                    data-mga-step-panel
                    data-step-index="0"
                    aria-hidden="false"
                >
                    <header class="mga-step__header">
                        <h2 class="mga-step__title" data-mga-step-title><?php echo esc_html__( 'Réglages essentiels de la visionneuse', 'lightbox-jlg' ); ?></h2>
                        <p class="mga-step__intro"><?php echo esc_html__( 'Définissez les fondations : rythme du diaporama, navigation et apparence globale avant d’affiner le reste.', 'lightbox-jlg' ); ?></p>
                    </header>
                    <div class="mga-step__body">
                        <div class="mga-settings-layout" data-mga-settings-layout>
                <aside class="mga-settings-layout__sidebar">
                    <div class="mga-settings-toolbar">
                        <label class="screen-reader-text" for="mga-settings-search"><?php echo esc_html__( 'Rechercher un réglage', 'lightbox-jlg' ); ?></label>
                        <input
                            type="search"
                            id="mga-settings-search"
                            class="mga-settings-toolbar__search"
                            placeholder="<?php echo esc_attr__( 'Rechercher un réglage…', 'lightbox-jlg' ); ?>"
                            autocomplete="off"
                            data-mga-settings-search
                        />
                        <p class="description mga-settings-toolbar__hint"><?php echo esc_html__( 'Filtrez les sections ou cliquez sur un titre pour y accéder rapidement.', 'lightbox-jlg' ); ?></p>
                        <div class="mga-settings-toolbar__view" data-mga-view-toggle>
                            <label for="mga-settings-view-mode"><?php echo esc_html__( 'Mode d’affichage', 'lightbox-jlg' ); ?></label>
                            <select id="mga-settings-view-mode" data-mga-view-select>
                                <option value="essential"><?php echo esc_html__( 'Vue simplifiée', 'lightbox-jlg' ); ?></option>
                                <option value="advanced"><?php echo esc_html__( 'Vue complète', 'lightbox-jlg' ); ?></option>
                            </select>
                            <p class="description"><?php echo esc_html__( 'Masquez les réglages techniques tant que vous configurez l’essentiel.', 'lightbox-jlg' ); ?></p>
                        </div>
                    </div>

                    <ul class="mga-settings-layout__nav" data-mga-settings-nav>
                        <li data-mga-visibility="essential"><a href="#mga-section-style" data-mga-section-link><?php echo esc_html__( 'Presets & raccourcis', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="essential"><a href="#mga-section-playback" data-mga-section-link><?php echo esc_html__( 'Lecture & transitions', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="essential"><a href="#mga-section-thumbnails" data-mga-section-link><?php echo esc_html__( 'Miniatures & navigation', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="essential"><a href="#mga-section-appearance" data-mga-section-link><?php echo esc_html__( 'Apparence de la visionneuse', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="essential"><a href="#mga-section-toolbar" data-mga-section-link><?php echo esc_html__( 'Barre d’outils & actions', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="advanced"><a href="#mga-section-detection" data-mga-section-link><?php echo esc_html__( 'Détection & intégration', 'lightbox-jlg' ); ?></a></li>
                        <li data-mga-visibility="advanced"><a href="#mga-section-maintenance" data-mga-section-link><?php echo esc_html__( 'Maintenance & support', 'lightbox-jlg' ); ?></a></li>
                    </ul>

                    <p class="mga-settings-layout__empty" data-mga-search-empty hidden><?php echo esc_html__( 'Aucun réglage ne correspond à votre recherche.', 'lightbox-jlg' ); ?></p>
                </aside>

                <div class="mga-settings-layout__content">
                    <div class="mga-live-preview" data-mga-live-preview>
                        <div class="mga-live-preview__header">
                            <h2><?php echo esc_html__( 'Prévisualisation en direct', 'lightbox-jlg' ); ?></h2>
                            <p class="description"><?php echo esc_html__( 'Les ajustements majeurs (presets, animations, couleurs) s’illustrent immédiatement dans cette vignette.', 'lightbox-jlg' ); ?></p>
                        </div>
                        <div class="mga-live-preview__stage" data-mga-live-preview-stage>
                            <div class="mga-live-preview__mock" data-mga-live-preview-mock data-preview-style="echo">
                                <div class="mga-live-preview__frame" role="group" aria-label="<?php echo esc_attr__( 'Aperçu simplifié de la visionneuse', 'lightbox-jlg' ); ?>">
                                    <div class="mga-live-preview__image" aria-hidden="true"></div>
                                    <div class="mga-live-preview__toolbar" data-mga-preview-toolbar>
                                        <span class="mga-live-preview__action" data-preview-action="zoom" aria-hidden="true">&#128269;</span>
                                        <span class="mga-live-preview__action" data-preview-action="download" aria-hidden="true">&#8681;</span>
                                        <span class="mga-live-preview__action" data-preview-action="share" aria-hidden="true">&#128257;</span>
                                        <span class="mga-live-preview__action" data-preview-action="cta" aria-hidden="true">&#9733;</span>
                                        <span class="mga-live-preview__action" data-preview-action="fullscreen" aria-hidden="true">&#9974;</span>
                                    </div>
                                    <div class="mga-live-preview__caption">
                                        <span class="mga-live-preview__effect" data-mga-preview-effect><?php echo esc_html__( 'Transition : glissement', 'lightbox-jlg' ); ?></span>
                                        <h3 class="mga-live-preview__title"><?php echo esc_html__( 'Tirage photographique mis en avant', 'lightbox-jlg' ); ?></h3>
                                        <p class="mga-live-preview__text"><?php echo esc_html__( 'Une lumière douce et des détails précis pour valoriser vos images.', 'lightbox-jlg' ); ?></p>
                                    </div>
                                </div>
                                <div class="mga-live-preview__thumbs" data-mga-preview-thumbs>
                                    <span aria-hidden="true"></span>
                                    <span aria-hidden="true"></span>
                                    <span aria-hidden="true"></span>
                                    <span aria-hidden="true"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <section
                        id="mga-section-style"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="essential"
                        aria-labelledby="mga-section-style-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-style-title" data-mga-section-title><?php echo esc_html__( 'Presets & raccourcis', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Appliquez une base visuelle prête à l’emploi, puis ajustez uniquement les détails nécessaires.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_style_preset"><?php echo esc_html__( 'Preset graphique', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <select
                                        name="mga_settings[style_preset]"
                                        id="mga_style_preset"
                                        aria-describedby="mga_style_preset_help mga_style_preset_description"
                                    >
                                        <option value="" <?php selected( $settings['style_preset'], '' ); ?>><?php echo esc_html__( 'Aucun (personnalisé)', 'lightbox-jlg' ); ?></option>
                                        <?php foreach ( $style_presets as $preset_key => $preset_definition ) :
                                            $sanitized_key = sanitize_key( (string) $preset_key );

                                            if ( '' === $sanitized_key ) {
                                                continue;
                                            }

                                            $label = isset( $preset_definition['label'] ) && '' !== trim( (string) $preset_definition['label'] )
                                                ? $preset_definition['label']
                                                : ucwords( str_replace( '-', ' ', $sanitized_key ) );
                                            ?>
                                            <option value="<?php echo esc_attr( $sanitized_key ); ?>" <?php selected( $settings['style_preset'], $sanitized_key ); ?>>
                                                <?php echo esc_html( $label ); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <p class="description" id="mga_style_preset_help"><?php echo esc_html__( 'Appliquez un ensemble de réglages inspiré de bibliothèques UI populaires. Vous pouvez ensuite ajuster chaque option librement.', 'lightbox-jlg' ); ?></p>
                                    <div class="mga-style-preset-actions">
                                        <button type="button" class="button button-secondary" data-mga-apply-style-preset><?php echo esc_html__( 'Appliquer ce preset', 'lightbox-jlg' ); ?></button>
                                        <button type="button" class="button-link" data-mga-reset-style-preset><?php echo esc_html__( 'Revenir aux valeurs par défaut', 'lightbox-jlg' ); ?></button>
                                    </div>
                                    <p class="description mga-style-preset-description" id="mga_style_preset_description" data-mga-style-preset-description></p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="mga-section-playback"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="essential"
                        aria-labelledby="mga-section-playback-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-playback-title" data-mga-section-title><?php echo esc_html__( 'Lecture & transitions', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Contrôlez la cadence du diaporama et la sensation des animations pour s’adapter à votre public.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_delay"><?php echo esc_html__( 'Vitesse du diaporama', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input name="mga_settings[delay]" type="number" id="mga_delay" value="<?php echo esc_attr( $settings['delay'] ); ?>" min="1" max="30" class="small-text" /> <?php echo esc_html__( 'secondes', 'lightbox-jlg' ); ?>
                                    <p class="description"><?php echo esc_html__( "Durée d'affichage de chaque image en mode lecture automatique.", 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_effect"><?php echo esc_html__( 'Effet de transition', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <select name="mga_settings[effect]" id="mga_effect">
                                        <option value="slide" <?php selected( $settings['effect'], 'slide' ); ?>><?php echo esc_html__( 'Glissement (recommandé)', 'lightbox-jlg' ); ?></option>
                                        <option value="fade" <?php selected( $settings['effect'], 'fade' ); ?>><?php echo esc_html__( 'Fondu', 'lightbox-jlg' ); ?></option>
                                        <option value="cube" <?php selected( $settings['effect'], 'cube' ); ?>><?php echo esc_html__( 'Cube 3D', 'lightbox-jlg' ); ?></option>
                                        <option value="coverflow" <?php selected( $settings['effect'], 'coverflow' ); ?>><?php echo esc_html__( 'Coverflow 3D', 'lightbox-jlg' ); ?></option>
                                        <option value="flip" <?php selected( $settings['effect'], 'flip' ); ?>><?php echo esc_html__( 'Flip 3D', 'lightbox-jlg' ); ?></option>
                                    </select>
                                    <p class="description"><?php echo esc_html__( "Choisissez le style d'animation utilisé lors du changement d'image.", 'lightbox-jlg' ); ?></p>
                                    <p class="description"><?php echo esc_html__( 'Les effets 3D sont automatiquement simplifiés si le système demande une réduction des animations.', 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_speed"><?php echo esc_html__( 'Vitesse de transition', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input name="mga_settings[speed]" type="number" id="mga_speed" value="<?php echo esc_attr( $settings['speed'] ); ?>" min="100" max="5000" step="50" class="small-text" /> <?php echo esc_html__( 'millisecondes', 'lightbox-jlg' ); ?>
                                    <p class="description"><?php echo esc_html__( 'Durée de l’animation entre deux images (100 ms = très rapide, 5000 ms = très lent).', 'lightbox-jlg' ); ?></p>
                                    <label for="mga_easing" class="screen-reader-text"><?php echo esc_html__( 'Courbe d’animation', 'lightbox-jlg' ); ?></label>
                                    <select name="mga_settings[easing]" id="mga_easing">
                                        <option value="ease-out" <?php selected( $settings['easing'], 'ease-out' ); ?>><?php echo esc_html__( 'Décélération (par défaut)', 'lightbox-jlg' ); ?></option>
                                        <option value="ease-in-out" <?php selected( $settings['easing'], 'ease-in-out' ); ?>><?php echo esc_html__( 'Douce (aller-retour)', 'lightbox-jlg' ); ?></option>
                                        <option value="ease-in" <?php selected( $settings['easing'], 'ease-in' ); ?>><?php echo esc_html__( 'Accélération progressive', 'lightbox-jlg' ); ?></option>
                                        <option value="ease" <?php selected( $settings['easing'], 'ease' ); ?>><?php echo esc_html__( 'Standard CSS', 'lightbox-jlg' ); ?></option>
                                        <option value="linear" <?php selected( $settings['easing'], 'linear' ); ?>><?php echo esc_html__( 'Linéaire', 'lightbox-jlg' ); ?></option>
                                    </select>
                                    <p class="description"><?php echo esc_html__( 'Ajustez la fluidité de l’animation. Cette valeur est harmonisée avec vos préférences de mouvement.', 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <fieldset class="mga-setting-row mga-setting-row--fieldset">
                                <legend><?php echo esc_html__( 'Lecture automatique', 'lightbox-jlg' ); ?></legend>
                                <div class="mga-setting-row__fieldset">
                                    <div class="mga-toggle-list__item">
                                        <label for="mga_loop">
                                            <input name="mga_settings[loop]" type="checkbox" id="mga_loop" value="1" <?php checked( ! empty( $settings['loop'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Lecture en boucle', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( 'Permet au diaporama de recommencer au début après la dernière image.', 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <label for="mga_autoplay_start">
                                            <input name="mga_settings[autoplay_start]" type="checkbox" id="mga_autoplay_start" value="1" <?php checked( ! empty( $settings['autoplay_start'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Lancement auto. du diaporama', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Si coché, le diaporama démarre automatiquement à l'ouverture de la galerie.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <label for="mga_start_on_clicked_image">
                                            <input name="mga_settings[start_on_clicked_image]" type="checkbox" id="mga_start_on_clicked_image" value="1" <?php checked( ! empty( $settings['start_on_clicked_image'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Démarrer sur l’image cliquée', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( 'Affiche directement la photo sélectionnée au lieu de revenir au début de l’article.', 'lightbox-jlg' ); ?></p>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </section>

                    <section
                        id="mga-section-thumbnails"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="essential"
                        aria-labelledby="mga-section-thumbnails-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-thumbnails-title" data-mga-section-title><?php echo esc_html__( 'Miniatures & navigation', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Adaptez la barre de miniatures à la densité de vos photos et à l’espace disponible.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <span class="mga-setting-row__label-text"><?php echo esc_html__( 'Taille des miniatures', 'lightbox-jlg' ); ?></span>
                                </div>
                                <div class="mga-setting-row__control">
                                    <label for="mga_thumb_size"><?php echo esc_html__( 'PC', 'lightbox-jlg' ); ?></label><br>
                                    <input
                                        name="mga_settings[thumb_size]"
                                        type="range"
                                        id="mga_thumb_size"
                                        value="<?php echo esc_attr( $settings['thumb_size'] ); ?>"
                                        min="50"
                                        max="150"
                                        step="5"
                                        aria-valuemin="50"
                                        aria-valuemax="150"
                                        aria-valuenow="<?php echo esc_attr( $settings['thumb_size'] ); ?>"
                                        aria-valuetext="<?php echo esc_attr( sprintf( __( '%s pixels', 'lightbox-jlg' ), intval( $settings['thumb_size'] ) ) ); ?>"
                                        aria-describedby="mga_thumb_size_value"
                                    />
                                    <output id="mga_thumb_size_value" for="mga_thumb_size" class="mga-range-output" aria-live="polite">
                                        <?php printf( esc_html__( '%dpx', 'lightbox-jlg' ), intval( $settings['thumb_size'] ) ); ?>
                                    </output>
                                    <br><br>
                                    <label for="mga_thumb_size_mobile"><?php echo esc_html__( 'Mobile', 'lightbox-jlg' ); ?></label><br>
                                    <input
                                        name="mga_settings[thumb_size_mobile]"
                                        type="range"
                                        id="mga_thumb_size_mobile"
                                        value="<?php echo esc_attr( $settings['thumb_size_mobile'] ); ?>"
                                        min="40"
                                        max="100"
                                        step="5"
                                        aria-valuemin="40"
                                        aria-valuemax="100"
                                        aria-valuenow="<?php echo esc_attr( $settings['thumb_size_mobile'] ); ?>"
                                        aria-valuetext="<?php echo esc_attr( sprintf( __( '%s pixels', 'lightbox-jlg' ), intval( $settings['thumb_size_mobile'] ) ) ); ?>"
                                        aria-describedby="mga_thumb_size_mobile_value"
                                    />
                                    <output id="mga_thumb_size_mobile_value" for="mga_thumb_size_mobile" class="mga-range-output" aria-live="polite">
                                        <?php printf( esc_html__( '%dpx', 'lightbox-jlg' ), intval( $settings['thumb_size_mobile'] ) ); ?>
                                    </output>
                                    <p class="description"><?php echo esc_html__( "Ajustez la hauteur des miniatures en bas de la galerie pour chaque type d'appareil.", 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_show_thumbs_mobile"><?php echo esc_html__( 'Miniatures sur mobile', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input type="hidden" name="mga_settings[show_thumbs_mobile]" value="0" />
                                    <label for="mga_show_thumbs_mobile" class="mga-inline-toggle">
                                        <input
                                            name="mga_settings[show_thumbs_mobile]"
                                            type="checkbox"
                                            id="mga_show_thumbs_mobile"
                                            value="1"
                                            <?php checked( ! empty( $settings['show_thumbs_mobile'] ), 1 ); ?>
                                        />
                                        <span><?php echo esc_html__( 'Afficher les miniatures sur mobile', 'lightbox-jlg' ); ?></span>
                                    </label>
                                    <p class="description"><?php echo esc_html__( 'Décochez pour masquer les miniatures sous 768px. Les flèches de navigation resteront visibles afin de permettre le changement d’image.', 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_thumbs_layout"><?php echo esc_html__( 'Disposition des miniatures', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <select name="mga_settings[thumbs_layout]" id="mga_thumbs_layout">
                                        <option value="bottom" <?php selected( $settings['thumbs_layout'], 'bottom' ); ?>><?php echo esc_html__( 'Barre inférieure (par défaut)', 'lightbox-jlg' ); ?></option>
                                        <option value="left" <?php selected( $settings['thumbs_layout'], 'left' ); ?>><?php echo esc_html__( 'Colonne latérale', 'lightbox-jlg' ); ?></option>
                                        <option value="hidden" <?php selected( $settings['thumbs_layout'], 'hidden' ); ?>><?php echo esc_html__( 'Masquées', 'lightbox-jlg' ); ?></option>
                                    </select>
                                    <p class="description"><?php echo esc_html__( 'Choisissez où afficher les miniatures dans la visionneuse. La disposition latérale passe en bas sur mobile pour préserver l’espace.', 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="mga-section-appearance"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="essential"
                        aria-labelledby="mga-section-appearance-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-appearance-title" data-mga-section-title><?php echo esc_html__( 'Apparence de la visionneuse', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Ajustez les couleurs et la profondeur visuelle pour respecter votre charte graphique.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_accent_color"><?php echo esc_html__( "Couleur d'accentuation", 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input
                                        name="mga_settings[accent_color]"
                                        type="text"
                                        id="mga_accent_color"
                                        value="<?php echo esc_attr( $settings['accent_color'] ); ?>"
                                        class="regular-text wp-color-picker"
                                        data-default-color="<?php echo esc_attr( $defaults['accent_color'] ); ?>"
                                    />
                                    <span id="mga_accent_color_preview" class="mga-color-preview" aria-hidden="true"></span>
                                    <p class="description"><?php echo esc_html__( 'Couleur des boutons, flèches et de la bordure de la miniature active.', 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_bg_opacity"><?php echo esc_html__( "Opacité de l'arrière-plan", 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input
                                        name="mga_settings[bg_opacity]"
                                        type="range"
                                        id="mga_bg_opacity"
                                        value="<?php echo esc_attr( $settings['bg_opacity'] ); ?>"
                                        min="0.5"
                                        max="1"
                                        step="0.05"
                                        aria-valuemin="0.5"
                                        aria-valuemax="1"
                                        aria-valuenow="<?php echo esc_attr( $settings['bg_opacity'] ); ?>"
                                        aria-valuetext="<?php echo esc_attr( sprintf( __( '%s opacity', 'lightbox-jlg' ), $settings['bg_opacity'] ) ); ?>"
                                        aria-describedby="mga_bg_opacity_value"
                                    />
                                    <output id="mga_bg_opacity_value" for="mga_bg_opacity" class="mga-range-output" aria-live="polite">
                                        <?php echo esc_html( $settings['bg_opacity'] ); ?>
                                    </output>
                                    <p class="description"><?php echo esc_html__( "Réglez la transparence du fond de la galerie (0.5 = transparent, 1 = opaque).", 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_background_style"><?php echo esc_html__( "Effet d'arrière-plan", 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <select name="mga_settings[background_style]" id="mga_background_style">
                                        <option value="echo" <?php selected( $settings['background_style'], 'echo' ); ?>><?php echo esc_html__( "Flou d'écho d'image (Recommandé)", 'lightbox-jlg' ); ?></option>
                                        <option value="texture" <?php selected( $settings['background_style'], 'texture' ); ?>><?php echo esc_html__( 'Texture verre dépoli (Performance max)', 'lightbox-jlg' ); ?></option>
                                        <option value="blur" <?php selected( $settings['background_style'], 'blur' ); ?>><?php echo esc_html__( 'Flou en temps réel (Gourmand)', 'lightbox-jlg' ); ?></option>
                                    </select>
                                    <p class="description"><?php echo esc_html__( "Choisissez le style de l'arrière-plan pour un compromis entre design et performance.", 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="mga-section-toolbar"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="essential"
                        aria-labelledby="mga-section-toolbar-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-toolbar-title" data-mga-section-title><?php echo esc_html__( 'Barre d’outils & actions', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Activez les contrôles utiles à vos visiteurs tout en conservant une interface épurée.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <fieldset class="mga-setting-row mga-setting-row--fieldset">
                                <legend><?php echo esc_html__( 'Contrôles disponibles', 'lightbox-jlg' ); ?></legend>
                                <div class="mga-setting-row__fieldset">
                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[close_on_backdrop]" value="0" />
                                        <label for="mga_close_on_backdrop">
                                            <input
                                                name="mga_settings[close_on_backdrop]"
                                                type="checkbox"
                                                id="mga_close_on_backdrop"
                                                value="1"
                                                aria-describedby="mga_close_on_backdrop_help"
                                                <?php checked( ! empty( $settings['close_on_backdrop'] ), 1 ); ?>
                                            />
                                            <span><?php echo esc_html__( 'Fermer sur clic arrière-plan', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description" id="mga_close_on_backdrop_help"><?php echo esc_html__( "Décochez pour empêcher la fermeture de la visionneuse lorsque l'arrière-plan est cliqué.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[show_zoom]" value="0" />
                                        <label for="mga_show_zoom">
                                            <input name="mga_settings[show_zoom]" type="checkbox" id="mga_show_zoom" value="1" <?php checked( ! empty( $settings['show_zoom'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Afficher le bouton de zoom', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Permet aux visiteurs de zoomer sur l'image affichée.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[show_download]" value="0" />
                                        <label for="mga_show_download">
                                            <input name="mga_settings[show_download]" type="checkbox" id="mga_show_download" value="1" <?php checked( ! empty( $settings['show_download'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Afficher le bouton de téléchargement', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Autorise le téléchargement direct de l'image en cours.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[show_share]" value="0" />
                                        <label for="mga_show_share">
                                            <input name="mga_settings[show_share]" type="checkbox" id="mga_show_share" value="1" <?php checked( ! empty( $settings['show_share'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Afficher le bouton de partage', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Affiche le bouton de partage via le navigateur ou un nouvel onglet.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[show_cta]" value="0" />
                                        <label for="mga_show_cta">
                                            <input name="mga_settings[show_cta]" type="checkbox" id="mga_show_cta" value="1" <?php checked( ! empty( $settings['show_cta'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Afficher le bouton « S’abonner »', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( 'Masquez complètement le bouton d’abonnement si vous ne souhaitez pas le proposer.', 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[show_fullscreen]" value="0" />
                                        <label for="mga_show_fullscreen">
                                            <input name="mga_settings[show_fullscreen]" type="checkbox" id="mga_show_fullscreen" value="1" <?php checked( ! empty( $settings['show_fullscreen'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Afficher le bouton plein écran', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Permet d'activer le mode plein écran depuis la barre d'outils.", 'lightbox-jlg' ); ?></p>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </section>

                    <section
                        id="mga-section-detection"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="advanced"
                        aria-labelledby="mga-section-detection-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-detection-title" data-mga-section-title><?php echo esc_html__( 'Détection & intégration', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Ciblez précisément les contenus pris en charge et ajustez les comportements d’intégration.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_group_attribute"><?php echo esc_html__( 'Attribut de regroupement', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input
                                        name="mga_settings[groupAttribute]"
                                        type="text"
                                        id="mga_group_attribute"
                                        value="<?php echo esc_attr( $settings['groupAttribute'] ); ?>"
                                        class="regular-text"
                                    />
                                    <p class="description">
                                        <?php echo esc_html__( 'Indiquez l’attribut HTML qui identifie les groupes (ex. data-mga-gallery, rel, href). Laissez vide pour conserver un groupe unique comme dans les versions précédentes.', 'lightbox-jlg' ); ?>
                                    </p>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga_z_index"><?php echo esc_html__( 'Z-index de la galerie', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <input name="mga_settings[z_index]" type="number" id="mga_z_index" value="<?php echo esc_attr( $settings['z_index'] ); ?>" min="1" class="small-text" />
                                    <p class="description"><?php echo esc_html__( "Augmentez cette valeur si la galerie apparaît sous un autre élément (ex: menu du site).", 'lightbox-jlg' ); ?></p>
                                </div>
                            </div>

                            <fieldset class="mga-setting-row mga-setting-row--fieldset">
                                <legend><?php echo esc_html__( 'Compatibilité', 'lightbox-jlg' ); ?></legend>
                                <div class="mga-setting-row__fieldset">
                                    <div class="mga-toggle-list__item">
                                        <label for="mga_allow_body_fallback">
                                            <input name="mga_settings[allowBodyFallback]" type="checkbox" id="mga_allow_body_fallback" value="1" <?php checked( ! empty( $settings['allowBodyFallback'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Autoriser le repli sur &lt;body&gt;', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Active un repli sur l'élément &lt;body&gt; si le thème ne propose pas de zone de contenu compatible.", 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[include_svg]" value="0" />
                                        <label for="mga_include_svg">
                                            <input
                                                name="mga_settings[include_svg]"
                                                type="checkbox"
                                                id="mga_include_svg"
                                                value="1"
                                                <?php checked( ! empty( $settings['include_svg'] ), 1 ); ?>
                                            />
                                            <span><?php echo esc_html__( 'Inclure les fichiers SVG', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( 'Décochez si votre site bloque le rendu des SVG ou si vous préférez les exclure du diaporama.', 'lightbox-jlg' ); ?></p>
                                    </div>

                                    <div class="mga-toggle-list__item">
                                        <input type="hidden" name="mga_settings[load_on_archives]" value="0" />
                                        <label for="mga_load_on_archives">
                                            <input
                                                name="mga_settings[load_on_archives]"
                                                type="checkbox"
                                                id="mga_load_on_archives"
                                                value="1"
                                                <?php checked( ! empty( $settings['load_on_archives'] ), 1 ); ?>
                                            />
                                            <span><?php echo esc_html__( 'Analyser les archives', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( 'Autorise la détection des images liées dans les listes d’articles (page de blog, catégories, étiquettes, etc.).', 'lightbox-jlg' ); ?></p>
                                    </div>
                                </div>
                            </fieldset>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <label for="mga-content-selectors-textarea"><?php echo esc_html__( 'Sélecteurs CSS personnalisés', 'lightbox-jlg' ); ?></label>
                                </div>
                                <div class="mga-setting-row__control">
                                    <?php
                                    $configured_selectors = array_filter(
                                        array_map(
                                            static function ( $selector ) {
                                                return trim( (string) $selector );
                                            },
                                            (array) $settings['contentSelectors']
                                        ),
                                        static function ( $selector ) {
                                            return '' !== $selector;
                                        }
                                    );
                                    $selectors_placeholder = esc_attr__( '.entry-content a[href$=".jpg"]', 'lightbox-jlg' );
                                    ?>
                                    <div
                                        class="mga-content-selectors"
                                        data-mga-content-selectors
                                        data-mga-selector-placeholder="<?php echo esc_attr( $selectors_placeholder ); ?>"
                                    >
                                        <textarea
                                            id="mga-content-selectors-textarea"
                                            name="mga_settings[contentSelectors]"
                                            rows="4"
                                            class="large-text code"
                                            data-mga-content-selectors-textarea
                                            placeholder="<?php echo esc_attr__( "Un sélecteur CSS par ligne\n.exemple article a[href$=\".jpg\"]", 'lightbox-jlg' ); ?>"
                                            aria-describedby="mga-content-selectors-help"
                                        ><?php echo esc_textarea( implode( "\n", $configured_selectors ) ); ?></textarea>
                                        <div class="mga-content-selectors__list" data-mga-content-selectors-list>
                                            <?php foreach ( $configured_selectors as $index => $selector ) : ?>
                                                <?php $input_id = sprintf( 'mga-content-selector-%d', (int) $index ); ?>
                                                <div class="mga-content-selectors__row" data-mga-content-selector-row>
                                                    <input
                                                        type="text"
                                                        id="<?php echo esc_attr( $input_id ); ?>"
                                                        class="regular-text"
                                                        value="<?php echo esc_attr( $selector ); ?>"
                                                        data-mga-content-selector-input
                                                        placeholder="<?php echo esc_attr( $selectors_placeholder ); ?>"
                                                    />
                                                    <button
                                                        type="button"
                                                        class="button-link mga-content-selectors__remove"
                                                        data-mga-remove-selector
                                                        aria-label="<?php echo esc_attr__( 'Supprimer ce sélecteur CSS', 'lightbox-jlg' ); ?>"
                                                    >
                                                        <?php echo esc_html__( 'Retirer', 'lightbox-jlg' ); ?>
                                                    </button>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                        <p>
                                            <button
                                                type="button"
                                                class="button button-secondary"
                                                data-mga-add-selector
                                            >
                                                <?php echo esc_html__( 'Ajouter un sélecteur', 'lightbox-jlg' ); ?>
                                            </button>
                                        </p>
                                        <p class="description" id="mga-content-selectors-help">
                                            <?php
                                            echo wp_kses_post(
                                                __( 'Ajoutez ici vos propres sélecteurs lorsque le contenu principal de votre thème n’utilise pas les classes par défaut (par exemple <code>.entry-content</code>). Chaque ligne correspond à un sélecteur complet, combiné aux valeurs natives du plugin. Utilisez le bouton <strong>Ajouter un sélecteur</strong> ou appuyez sur la touche <kbd>Entrée</kbd> dans un champ pour créer rapidement une nouvelle ligne.', 'lightbox-jlg' )
                                            );
                                            ?>
                                        </p>
                                        <div class="mga-content-selectors__details">
                                            <p><strong><?php echo esc_html__( 'Quand personnaliser ces sélecteurs ?', 'lightbox-jlg' ); ?></strong></p>
                                            <p>
                                                <?php
                                                echo wp_kses_post(
                                                    __( 'Utilisez cette liste si votre thème encapsule les images dans des conteneurs spécifiques (ex. <code>.site-main .article-body</code>) ou si vous avez besoin d’inclure des blocs personnalisés. En cas de doute, inspectez votre page avec les outils du navigateur pour identifier la classe englobante, puis ajoutez-la ici afin que le plugin repère les liens vers les fichiers médias.', 'lightbox-jlg' )
                                                );
                                                ?>
                                            </p>
                                        </div>
                                    </div>
                                    <template id="mga-content-selector-template">
                                        <div class="mga-content-selectors__row" data-mga-content-selector-row>
                                            <input
                                                type="text"
                                                class="regular-text"
                                                data-mga-content-selector-input
                                                placeholder="<?php echo esc_attr( $selectors_placeholder ); ?>"
                                            />
                                            <button
                                                type="button"
                                                class="button-link mga-content-selectors__remove"
                                                data-mga-remove-selector
                                                aria-label="<?php echo esc_attr__( 'Supprimer ce sélecteur CSS', 'lightbox-jlg' ); ?>"
                                            >
                                                <?php echo esc_html__( 'Retirer', 'lightbox-jlg' ); ?>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <span class="mga-setting-row__label-text"><?php echo esc_html__( 'Types de contenu suivis', 'lightbox-jlg' ); ?></span>
                                </div>
                                <div class="mga-setting-row__control">
                                    <fieldset class="mga-post-type-list">
                                        <legend class="screen-reader-text">
                                            <span><?php echo esc_html__( 'Sélectionnez les types de contenu à analyser', 'lightbox-jlg' ); ?></span>
                                        </legend>
                                        <?php
                                        $post_types = get_post_types( [ 'public' => true ], 'objects' );

                                        if ( empty( $post_types ) ) :
                                            ?>
                                            <p class="description"><?php echo esc_html__( 'Aucun type de contenu public n’a été détecté.', 'lightbox-jlg' ); ?></p>
                                            <?php
                                        else :
                                            foreach ( $post_types as $post_type ) :
                                                if ( 'attachment' === $post_type->name ) {
                                                    continue;
                                                }

                                                $is_checked = in_array( $post_type->name, (array) $settings['tracked_post_types'], true );
                                                ?>
                                                <label for="mga-tracked-post-type-<?php echo esc_attr( $post_type->name ); ?>" class="mga-tracked-post-type">
                                                    <input
                                                        type="checkbox"
                                                        id="mga-tracked-post-type-<?php echo esc_attr( $post_type->name ); ?>"
                                                        name="mga_settings[tracked_post_types][]"
                                                        value="<?php echo esc_attr( $post_type->name ); ?>"
                                                        <?php checked( $is_checked ); ?>
                                                    />
                                                    <span><?php echo esc_html( $post_type->labels->singular_name ); ?></span>
                                                </label>
                                            <?php
                                            endforeach;

                                            ?>
                                            <p class="description">
                                                <?php echo esc_html__( 'Limitez l’analyse aux contenus réellement utilisés pour vos galeries. Par défaut, seuls les articles et les pages sont inspectés.', 'lightbox-jlg' ); ?>
                                            </p>
                                            <?php
                                        endif;
                                        ?>
                                    </fieldset>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="mga-section-maintenance"
                        class="mga-settings-section"
                        data-mga-settings-section
                        data-mga-visibility="advanced"
                        aria-labelledby="mga-section-maintenance-title"
                        tabindex="-1"
                    >
                        <header class="mga-settings-section__header">
                            <h2 id="mga-section-maintenance-title" data-mga-section-title><?php echo esc_html__( 'Maintenance & support', 'lightbox-jlg' ); ?></h2>
                            <p class="mga-settings-section__description"><?php echo esc_html__( 'Activez les outils de diagnostic lorsque vous devez investiguer un comportement inattendu.', 'lightbox-jlg' ); ?></p>
                        </header>
                        <div class="mga-settings-section__body">
                            <div class="mga-setting-row">
                                <div class="mga-setting-row__label">
                                    <span class="mga-setting-row__label-text"><?php echo esc_html__( 'Mode de débogage', 'lightbox-jlg' ); ?></span>
                                </div>
                                <div class="mga-setting-row__control">
                                    <fieldset>
                                        <label for="mga_debug_mode">
                                            <input name="mga_settings[debug_mode]" type="checkbox" id="mga_debug_mode" value="1" <?php checked( ! empty( $settings['debug_mode'] ), 1 ); ?> />
                                            <span><?php echo esc_html__( 'Activer le mode débogage', 'lightbox-jlg' ); ?></span>
                                        </label>
                                        <p class="description"><?php echo esc_html__( "Affiche un panneau d'informations techniques sur le site pour aider à résoudre les problèmes.", 'lightbox-jlg' ); ?></p>
                                    </fieldset>
                                </div>
                            </div>
                        </div>
                    </section>
                        </div>
                    </div>
                </section>

                <section
                    class="mga-wizard__panel"
                    data-mga-step-panel
                    data-step-index="1"
                    aria-hidden="true"
                    hidden
                >
                    <header class="mga-step__header">
                        <h2 class="mga-step__title" data-mga-step-title><?php echo esc_html__( 'Canaux de partage et options sociales', 'lightbox-jlg' ); ?></h2>
                        <p class="mga-step__intro"><?php echo esc_html__( 'Sélectionnez les réseaux, icônes et actions complémentaires proposés dans la modale de partage.', 'lightbox-jlg' ); ?></p>
                    </header>
                    <div class="mga-step__body">
            <table class="form-table">
                <tr>
                    <th scope="row"><?php echo esc_html__( 'Canaux de partage', 'lightbox-jlg' ); ?></th>
                    <td>
                        <?php
                        $share_channels      = isset( $settings['share_channels'] ) && is_array( $settings['share_channels'] )
                            ? array_values( $settings['share_channels'] )
                            : [];
                        $share_icon_choices  = mga_get_share_icon_choices();
                        $render_icon_options = static function ( array $choices, string $selected ): string {
                            $options = '';

                            if ( '' !== $selected && ! array_key_exists( $selected, $choices ) ) {
                                $choices = [
                                    $selected => ucwords( str_replace( [ '-', '_' ], ' ', $selected ) ),
                                ] + $choices;
                            }

                            foreach ( $choices as $value => $label ) {
                                $options .= sprintf(
                                    '<option value="%1$s" %2$s>%3$s</option>',
                                    esc_attr( $value ),
                                    selected( $selected, $value, false ),
                                    esc_html( $label )
                                );
                            }

                            return $options;
                        };
                        ?>
                        <p class="description"><?php echo esc_html__( 'Activez les réseaux à proposer dans la modale de partage et ajustez leurs URL gabarits. Utilisez %url% pour l’URL finale, %text% pour la légende et %title% pour le titre du document. Les schémas d’URL doivent commencer par http, https, mailto, sms… ; les valeurs interdites sont ignorées.', 'lightbox-jlg' ); ?></p>
                        <div class="mga-share-repeater" data-share-repeater>
                            <div class="mga-share-repeater__list" data-share-repeater-list>
                                <?php foreach ( $share_channels as $index => $channel ) :
                                    $channel_key      = isset( $channel['key'] ) ? sanitize_key( (string) $channel['key'] ) : '';
                                    $channel_label    = isset( $channel['label'] ) ? (string) $channel['label'] : '';
                                    $channel_template = isset( $channel['template'] ) ? (string) $channel['template'] : '';
                                    $channel_icon     = isset( $channel['icon'] ) ? (string) $channel['icon'] : '';
                                    $channel_enabled  = ! empty( $channel['enabled'] );
                                    $base_name        = sprintf( 'mga_settings[share_channels][%d]', $index );
                                    $item_uid         = sprintf( 'mga-share-channel-%d', $index + 1 );
                                    $channel_title    = $channel_label;

                                    if ( '' === $channel_title ) {
                                        $channel_title = $channel_key ? strtoupper( $channel_key ) : __( 'Nouveau canal', 'lightbox-jlg' );
                                    }
                                    ?>
                                    <div class="mga-share-repeater__item" data-share-repeater-item data-share-uid="<?php echo esc_attr( $item_uid ); ?>">
                                        <div class="mga-share-repeater__header">
                                            <span class="mga-share-repeater__title" data-share-repeater-title><?php echo esc_html( $channel_title ); ?></span>
                                            <div class="mga-share-repeater__controls">
                                                <button type="button" class="button button-secondary" data-share-action="move-up">
                                                    <span aria-hidden="true">▲</span>
                                                    <span class="screen-reader-text"><?php echo esc_html__( 'Monter', 'lightbox-jlg' ); ?></span>
                                                </button>
                                                <button type="button" class="button button-secondary" data-share-action="move-down">
                                                    <span aria-hidden="true">▼</span>
                                                    <span class="screen-reader-text"><?php echo esc_html__( 'Descendre', 'lightbox-jlg' ); ?></span>
                                                </button>
                                                <button type="button" class="button button-link-delete" data-share-action="remove">
                                                    <?php echo esc_html__( 'Supprimer', 'lightbox-jlg' ); ?>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="mga-share-repeater__preview" data-share-preview>
                                            <span class="mga-share-repeater__preview-icon" data-share-preview-icon aria-hidden="true"></span>
                                            <div class="mga-share-repeater__preview-text">
                                                <span class="mga-share-repeater__preview-label" data-share-preview-label><?php echo esc_html( $channel_title ); ?></span>
                                                <code class="mga-share-repeater__preview-url" data-share-preview-url aria-live="polite"></code>
                                            </div>
                                        </div>
                                        <div class="mga-share-repeater__fields">
                                            <div class="mga-share-repeater__field">
                                                <label data-share-id-suffix="label"><?php echo esc_html__( 'Libellé affiché', 'lightbox-jlg' ); ?></label>
                                                <input
                                                    type="text"
                                                    class="regular-text"
                                                    name="<?php echo esc_attr( $base_name . '[label]' ); ?>"
                                                    value="<?php echo esc_attr( $channel_label ); ?>"
                                                    data-share-field="label"
                                                    data-share-id-suffix="label"
                                                />
                                            </div>
                                            <div class="mga-share-repeater__field">
                                                <label data-share-id-suffix="key"><?php echo esc_html__( 'Clé technique', 'lightbox-jlg' ); ?></label>
                                                <input
                                                    type="text"
                                                    class="regular-text"
                                                    name="<?php echo esc_attr( $base_name . '[key]' ); ?>"
                                                    value="<?php echo esc_attr( $channel_key ); ?>"
                                                    data-share-field="key"
                                                    data-share-id-suffix="key"
                                                />
                                                <p class="description"><?php echo esc_html__( 'Utilisé pour identifier le canal. Lettres, chiffres et tirets uniquement.', 'lightbox-jlg' ); ?></p>
                                                <p class="mga-share-repeater__error" data-share-error="key" aria-live="polite" hidden></p>
                                            </div>
                                            <div class="mga-share-repeater__field mga-share-repeater__field--full">
                                                <label data-share-id-suffix="template"><?php echo esc_html__( 'Modèle d’URL', 'lightbox-jlg' ); ?></label>
                                                <input
                                                    type="text"
                                                    class="regular-text"
                                                    name="<?php echo esc_attr( $base_name . '[template]' ); ?>"
                                                    value="<?php echo esc_attr( $channel_template ); ?>"
                                                    data-share-field="template"
                                                    data-share-id-suffix="template"
                                                    placeholder="<?php echo esc_attr__( 'https://exemple.com/?u=%url%', 'lightbox-jlg' ); ?>"
                                                />
                                                <p class="description"><?php echo esc_html__( 'Placez %url%, %text% ou %title% pour injecter les informations de l’image.', 'lightbox-jlg' ); ?></p>
                                                <p class="description"><?php echo esc_html__( 'Seules les URL débutant par http, https, mailto, tel ou sms seront conservées ; les autres schémas sont ignorés.', 'lightbox-jlg' ); ?></p>
                                                <p class="mga-share-repeater__error" data-share-error="template" aria-live="polite" hidden></p>
                                            </div>
                                            <div class="mga-share-repeater__field">
                                                <label data-share-id-suffix="icon"><?php echo esc_html__( 'Icône', 'lightbox-jlg' ); ?></label>
                                                <div class="mga-share-repeater__icon-picker">
                                                    <select
                                                        name="<?php echo esc_attr( $base_name . '[icon]' ); ?>"
                                                        data-share-field="icon"
                                                        data-share-id-suffix="icon"
                                                    >
                                                        <?php echo $render_icon_options( $share_icon_choices, $channel_icon ); ?>
                                                    </select>
                                                    <span class="mga-share-repeater__icon-preview" data-share-icon-preview aria-hidden="true"></span>
                                                </div>
                                            </div>
                                            <div class="mga-share-repeater__field mga-share-repeater__field--checkbox">
                                                <input type="hidden" value="0" name="<?php echo esc_attr( $base_name . '[enabled]' ); ?>" data-share-field="enabled-hidden" />
                                                <label class="mga-share-repeater__checkbox">
                                                    <input
                                                        type="checkbox"
                                                        value="1"
                                                        <?php checked( $channel_enabled, true ); ?>
                                                        name="<?php echo esc_attr( $base_name . '[enabled]' ); ?>"
                                                        data-share-field="enabled"
                                                    />
                                                    <span><?php echo esc_html__( 'Canal actif', 'lightbox-jlg' ); ?></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <button type="button" class="button button-secondary mga-share-repeater__add" data-share-repeater-add>
                                <?php echo esc_html__( 'Ajouter un canal', 'lightbox-jlg' ); ?>
                            </button>
                            <template id="mga-share-channel-template">
                                <div class="mga-share-repeater__item" data-share-repeater-item>
                                    <div class="mga-share-repeater__header">
                                        <span class="mga-share-repeater__title" data-share-repeater-title><?php echo esc_html__( 'Nouveau canal', 'lightbox-jlg' ); ?></span>
                                        <div class="mga-share-repeater__controls">
                                            <button type="button" class="button button-secondary" data-share-action="move-up">
                                                <span aria-hidden="true">▲</span>
                                                <span class="screen-reader-text"><?php echo esc_html__( 'Monter', 'lightbox-jlg' ); ?></span>
                                            </button>
                                            <button type="button" class="button button-secondary" data-share-action="move-down">
                                                <span aria-hidden="true">▼</span>
                                                <span class="screen-reader-text"><?php echo esc_html__( 'Descendre', 'lightbox-jlg' ); ?></span>
                                            </button>
                                            <button type="button" class="button button-link-delete" data-share-action="remove">
                                                <?php echo esc_html__( 'Supprimer', 'lightbox-jlg' ); ?>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="mga-share-repeater__preview" data-share-preview>
                                        <span class="mga-share-repeater__preview-icon" data-share-preview-icon aria-hidden="true"></span>
                                        <div class="mga-share-repeater__preview-text">
                                            <span class="mga-share-repeater__preview-label" data-share-preview-label><?php echo esc_html__( 'Nouveau canal', 'lightbox-jlg' ); ?></span>
                                            <code class="mga-share-repeater__preview-url" data-share-preview-url aria-live="polite"></code>
                                        </div>
                                    </div>
                                    <div class="mga-share-repeater__fields">
                                        <div class="mga-share-repeater__field">
                                            <label data-share-id-suffix="label"><?php echo esc_html__( 'Libellé affiché', 'lightbox-jlg' ); ?></label>
                                            <input type="text" class="regular-text" value="" data-share-field="label" data-share-id-suffix="label" />
                                        </div>
                                        <div class="mga-share-repeater__field">
                                            <label data-share-id-suffix="key"><?php echo esc_html__( 'Clé technique', 'lightbox-jlg' ); ?></label>
                                            <input type="text" class="regular-text" value="" data-share-field="key" data-share-id-suffix="key" />
                                            <p class="description"><?php echo esc_html__( 'Utilisé pour identifier le canal. Lettres, chiffres et tirets uniquement.', 'lightbox-jlg' ); ?></p>
                                            <p class="mga-share-repeater__error" data-share-error="key" aria-live="polite" hidden></p>
                                        </div>
                                        <div class="mga-share-repeater__field mga-share-repeater__field--full">
                                            <label data-share-id-suffix="template"><?php echo esc_html__( 'Modèle d’URL', 'lightbox-jlg' ); ?></label>
                                            <input type="text" class="regular-text" value="" data-share-field="template" data-share-id-suffix="template" placeholder="<?php echo esc_attr__( 'https://exemple.com/?u=%url%', 'lightbox-jlg' ); ?>" />
                                            <p class="description"><?php echo esc_html__( 'Placez %url%, %text% ou %title% pour injecter les informations de l’image.', 'lightbox-jlg' ); ?></p>
                                            <p class="description"><?php echo esc_html__( 'Seules les URL débutant par http, https, mailto, tel ou sms seront conservées ; les autres schémas sont ignorés.', 'lightbox-jlg' ); ?></p>
                                            <p class="mga-share-repeater__error" data-share-error="template" aria-live="polite" hidden></p>
                                        </div>
                                        <div class="mga-share-repeater__field">
                                            <label data-share-id-suffix="icon"><?php echo esc_html__( 'Icône', 'lightbox-jlg' ); ?></label>
                                            <div class="mga-share-repeater__icon-picker">
                                                <select data-share-field="icon" data-share-id-suffix="icon">
                                                    <?php echo $render_icon_options( $share_icon_choices, 'link' ); ?>
                                                </select>
                                                <span class="mga-share-repeater__icon-preview" data-share-icon-preview aria-hidden="true"></span>
                                            </div>
                                        </div>
                                        <div class="mga-share-repeater__field mga-share-repeater__field--checkbox">
                                            <input type="hidden" value="0" data-share-field="enabled-hidden" />
                                            <label class="mga-share-repeater__checkbox">
                                                <input type="checkbox" value="1" data-share-field="enabled" />
                                                <span><?php echo esc_html__( 'Canal actif', 'lightbox-jlg' ); ?></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                        <div class="mga-share-actions">
                            <div class="mga-share-actions__item">
                                <input type="hidden" name="mga_settings[share_copy]" value="0" />
                                <label for="mga_share_copy">
                                    <input type="checkbox" id="mga_share_copy" name="mga_settings[share_copy]" value="1" <?php checked( ! empty( $settings['share_copy'] ), 1 ); ?> />
                                    <span><?php echo esc_html__( 'Afficher l’option « Copier le lien »', 'lightbox-jlg' ); ?></span>
                                </label>
                            </div>
                            <div class="mga-share-actions__item">
                                <input type="hidden" name="mga_settings[share_download]" value="0" />
                                <label for="mga_share_download">
                                    <input type="checkbox" id="mga_share_download" name="mga_settings[share_download]" value="1" <?php checked( ! empty( $settings['share_download'] ), 1 ); ?> />
                                    <span><?php echo esc_html__( 'Afficher l’option « Téléchargement rapide »', 'lightbox-jlg' ); ?></span>
                                </label>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
                    </div>
                </section>

                <section
                    class="mga-wizard__panel"
                    data-mga-step-panel
                    data-step-index="2"
                    aria-hidden="true"
                    hidden
                >
                    <header class="mga-step__header">
                        <h2 class="mga-step__title" data-mga-step-title><?php echo esc_html__( 'Récapitulatif & mise en ligne', 'lightbox-jlg' ); ?></h2>
                        <p class="mga-step__intro"><?php echo esc_html__( 'Vérifiez les points clés avant d’enregistrer les réglages et de publier votre galerie.', 'lightbox-jlg' ); ?></p>
                    </header>
                    <div class="mga-step__body mga-step__body--summary">
                        <div class="mga-summary" data-mga-summary-panel>
                            <dl class="mga-summary__list">
                                <div class="mga-summary__item">
                                    <dt><?php echo esc_html__( 'Preset sélectionné', 'lightbox-jlg' ); ?></dt>
                                    <dd data-mga-summary-preset>—</dd>
                                </div>
                                <div class="mga-summary__item">
                                    <dt><?php echo esc_html__( 'Lecture & transitions', 'lightbox-jlg' ); ?></dt>
                                    <dd data-mga-summary-timing>—</dd>
                                </div>
                                <div class="mga-summary__item">
                                    <dt><?php echo esc_html__( 'Boutons de la barre d’outils', 'lightbox-jlg' ); ?></dt>
                                    <dd data-mga-summary-toolbar>—</dd>
                                </div>
                                <div class="mga-summary__item">
                                    <dt><?php echo esc_html__( 'Partage et actions', 'lightbox-jlg' ); ?></dt>
                                    <dd data-mga-summary-share>—</dd>
                                </div>
                            </dl>
                        </div>
                        <div class="mga-summary__tutorial">
                            <h3 class="mga-summary__heading"><?php echo esc_html__( 'Tutoriel express', 'lightbox-jlg' ); ?></h3>
                            <p><?php echo esc_html__( "Cette extension est conçue pour s'intégrer naturellement à WordPress. Le principe est simple : seules les images que vous décidez de lier deviendront des déclencheurs pour la galerie.", 'lightbox-jlg' ); ?></p>
                            <ol class="mga-summary__steps">
                                <li><?php echo wp_kses_post( __( "<strong>Éditez un article ou une page :</strong> Allez dans l'éditeur de blocs de WordPress.", 'lightbox-jlg' ) ); ?></li>
                                <li><?php echo wp_kses_post( __( '<strong>Sélectionnez une image :</strong> Cliquez sur un bloc image que vous souhaitez inclure dans la galerie.', 'lightbox-jlg' ) ); ?></li>
                                <li><?php echo wp_kses_post( __( "<strong>Activez le lien :</strong> Dans la barre d'outils du bloc image, cliquez sur l'icône de lien (ressemble à un maillon de chaîne).", 'lightbox-jlg' ) ); ?></li>
                                <li><?php echo wp_kses_post( __( '<strong>Choisissez la bonne destination :</strong> Dans la fenêtre, sélectionnez <strong>&quot;Fichier média&quot;</strong> pour ouvrir l’image originale.', 'lightbox-jlg' ) ); ?></li>
                                <li><?php echo wp_kses_post( __( "<strong>Répétez pour d'autres images :</strong> Faites de même pour toutes les images que vous voulez afficher dans la même galerie.", 'lightbox-jlg' ) ); ?></li>
                            </ol>
                            <p><?php echo esc_html__( "C'est tout ! Vos visiteurs peuvent maintenant parcourir la galerie directement depuis les images liées au fichier média.", 'lightbox-jlg' ); ?></p>
                            <h4 class="mga-summary__heading"><?php echo esc_html__( 'Bloc de prévisualisation Gutenberg', 'lightbox-jlg' ); ?></h4>
                            <p><?php echo wp_kses_post( __( 'Besoin de vérifier vos réglages sans quitter l’éditeur&nbsp;? Ajoutez le bloc <strong>«&nbsp;Lightbox – Aperçu&nbsp;»</strong> pour simuler la visionneuse et partager facilement vos choix avec vos clients.', 'lightbox-jlg' ) ); ?></p>
                            <h4 class="mga-summary__heading"><?php echo esc_html__( 'Compatibilité et légendes', 'lightbox-jlg' ); ?></h4>
                            <p><?php echo wp_kses_post( __( 'La détection automatique couvre les blocs médias natifs et affiche une pastille «&nbsp;Lightbox active&nbsp;». Les légendes de la galerie reprennent le champ <strong>« Légende »</strong> de la médiathèque ou, à défaut, le <strong>texte alternatif</strong>.', 'lightbox-jlg' ) ); ?></p>
                        </div>
                    </div>
                </section>
            </div>

            <div class="mga-wizard__actions">
                <button type="button" class="button button-secondary mga-wizard__button" data-mga-step-prev><?php echo esc_html__( 'Étape précédente', 'lightbox-jlg' ); ?></button>
                <button type="button" class="button button-primary mga-wizard__button" data-mga-step-next><?php echo esc_html__( 'Étape suivante', 'lightbox-jlg' ); ?></button>
                <?php
                submit_button(
                    __( 'Enregistrer les réglages', 'lightbox-jlg' ),
                    'primary mga-wizard__button',
                    'submit',
                    false,
                    [
                        'data-mga-step-submit' => 'true',
                    ]
                );
                ?>
                <span class="mga-wizard__status" data-mga-save-status aria-live="polite"></span>
            </div>
        </div>
    </form>
</div>
