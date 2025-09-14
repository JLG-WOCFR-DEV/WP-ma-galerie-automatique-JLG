<?php
/**
 * Template pour la page de réglages de la galerie automatique.
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Sécurité

// On prépare les valeurs de manière sécurisée pour éviter les erreurs
$defaults = mga_get_default_settings();
$settings = wp_parse_args( $settings, $defaults );

?>
<div class="wrap mga-admin-wrap">
    <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
    
    <div class="nav-tab-wrapper">
        <a href="#settings" class="nav-tab nav-tab-active">Réglages</a>
        <a href="#tutorial" class="nav-tab">Tutoriel</a>
    </div>

    <form action="options.php" method="post">
        <?php settings_fields( 'mga_settings_group' ); ?>
        
        <div id="settings" class="tab-content active">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="mga_delay">Vitesse du diaporama</label></th>
                    <td>
                        <input name="mga_settings[delay]" type="number" id="mga_delay" value="<?php echo esc_attr($settings['delay']); ?>" min="1" max="30" class="small-text" /> secondes
                        <p class="description">Durée d'affichage de chaque image en mode lecture automatique.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Taille des miniatures</th>
                    <td>
                        <label for="mga_thumb_size">PC</label><br>
                        <input name="mga_settings[thumb_size]" type="range" id="mga_thumb_size" value="<?php echo esc_attr($settings['thumb_size']); ?>" min="50" max="150" step="5" />
                        <span id="mga_thumb_size_value"><?php echo esc_attr($settings['thumb_size']); ?>px</span>
                        <br><br>
                        <label for="mga_thumb_size_mobile">Mobile</label><br>
                        <input name="mga_settings[thumb_size_mobile]" type="range" id="mga_thumb_size_mobile" value="<?php echo esc_attr($settings['thumb_size_mobile']); ?>" min="40" max="100" step="5" />
                        <span id="mga_thumb_size_mobile_value"><?php echo esc_attr($settings['thumb_size_mobile']); ?>px</span>
                        <p class="description">Ajustez la hauteur des miniatures en bas de la galerie pour chaque type d'appareil.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="mga_accent_color">Couleur d'accentuation</label></th>
                    <td>
                        <input name="mga_settings[accent_color]" type="color" id="mga_accent_color" value="<?php echo esc_attr($settings['accent_color']); ?>" />
                        <p class="description">Couleur des boutons, flèches et de la bordure de la miniature active.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="mga_bg_opacity">Opacité de l'arrière-plan</label></th>
                    <td>
                         <input name="mga_settings[bg_opacity]" type="range" id="mga_bg_opacity" value="<?php echo esc_attr($settings['bg_opacity']); ?>" min="0.5" max="1" step="0.05" />
                         <span id="mga_bg_opacity_value"><?php echo esc_attr($settings['bg_opacity']); ?></span>
                        <p class="description">Réglez la transparence du fond de la galerie (0.5 = transparent, 1 = opaque).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="mga_background_style">Effet d'arrière-plan</label></th>
                    <td>
                        <select name="mga_settings[background_style]" id="mga_background_style">
                            <option value="echo" <?php selected($settings['background_style'], 'echo'); ?>>Flou d'écho d'image (Recommandé)</option>
                            <option value="texture" <?php selected($settings['background_style'], 'texture'); ?>>Texture verre dépoli (Performance max)</option>
                            <option value="blur" <?php selected($settings['background_style'], 'blur'); ?>>Flou en temps réel (Gourmand)</option>
                        </select>
                        <p class="description">Choisissez le style de l'arrière-plan pour un compromis entre design et performance.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="mga_z_index">Z-index de la galerie</label></th>
                    <td>
                        <input name="mga_settings[z_index]" type="number" id="mga_z_index" value="<?php echo esc_attr($settings['z_index']); ?>" min="1" class="small-text" />
                        <p class="description">Augmentez cette valeur si la galerie apparaît sous un autre élément (ex: menu du site).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Options diverses</th>
                    <td>
                        <fieldset>
                            <label for="mga_loop">
                                <input name="mga_settings[loop]" type="checkbox" id="mga_loop" value="1" <?php checked( !empty($settings['loop']), 1 ); ?> />
                                <span>Lecture en boucle</span>
                            </label>
                            <p class="description">Permet au diaporama de recommencer au début après la dernière image.</p>
                            <br>
                            <label for="mga_autoplay_start">
                                <input name="mga_settings[autoplay_start]" type="checkbox" id="mga_autoplay_start" value="1" <?php checked( !empty($settings['autoplay_start']), 1 ); ?> />
                                <span>Lancement auto. du diaporama</span>
                            </label>
                            <p class="description">Si coché, le diaporama démarre automatiquement à l'ouverture de la galerie.</p>
                        </fieldset>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Mode de débogage</th>
                    <td>
                        <fieldset>
                            <label for="mga_debug_mode">
                                <input name="mga_settings[debug_mode]" type="checkbox" id="mga_debug_mode" value="1" <?php checked( !empty($settings['debug_mode']), 1 ); ?> />
                                <span>Activer le mode débogage</span>
                            </label>
                            <p class="description">Affiche un panneau d'informations techniques sur le site pour aider à résoudre les problèmes.</p>
                        </fieldset>
                    </td>
                </tr>
            </table>
        </div>

        <div id="tutorial" class="tab-content">
            <h2><span class="dashicons dashicons-editor-help"></span> Comment faire fonctionner la galerie ?</h2>
            <p>Cette extension est conçue pour s'intégrer naturellement à WordPress. Le principe est simple : seules les images que vous décidez de lier deviendront des déclencheurs pour la galerie.</p>
            <ol style="list-style-type: decimal; margin-left: 20px;">
                <li><strong>Éditez un article ou une page :</strong> Allez dans l'éditeur de blocs de WordPress.</li>
                <li><strong>Sélectionnez une image :</strong> Cliquez sur un bloc image que vous souhaitez inclure dans la galerie.</li>
                <li><strong>Activez le lien :</strong> Dans la barre d'outils du bloc image, cliquez sur l'icône de lien (ressemble à un maillon de chaîne).</li>
                <li style="margin-top: 10px;"><strong>Choisissez la bonne destination :</strong> Une petite fenêtre apparaît. Cliquez sur l'option <strong>"Fichier média"</strong>. C'est l'étape la plus importante ! Elle indique que le clic sur l'image doit ouvrir le fichier image original.</li>
                <li style="margin-top: 10px;"><strong>Répétez pour d'autres images :</strong> Faites de même pour toutes les images de l'article que vous voulez voir apparaître dans la même galerie.</li>
            </ol>
            <h3>C'est tout !</h3>
            <p>Désormais, sur votre site, lorsque qu'un visiteur cliquera sur l'une de ces images, la visionneuse (lightbox) s'ouvrira et affichera toutes les autres images de l'article qui ont également été liées à leur "Fichier média".</p>
            
            <h4>Astuce pour les légendes</h4>
            <p>La légende affichée dans la galerie est récupérée automatiquement depuis le champ <strong>"Légende"</strong> de votre image dans l'éditeur, ou, si celui-ci est vide, depuis le champ <strong>"Texte alternatif"</strong>. Pensez à les remplir !</p>
        </div>

        <?php submit_button( 'Enregistrer les modifications' ); ?>
    </form>
</div>