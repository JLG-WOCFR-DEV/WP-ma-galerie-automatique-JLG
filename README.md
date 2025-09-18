# Lightbox - JLG

Lightbox - JLG est un plugin WordPress qui transforme les galeries d'images en diaporama plein écran.

## Informations
- **Nom** : Lightbox - JLG
- **Rôle** : Crée une visionneuse plein écran pour les galeries d'images WordPress.
- **Auteur** : Jérôme Le Gousse
- **Version** : 1.8

## Installation et activation
1. Téléchargez ou clonez ce dépôt dans `wp-content/plugins/`.
2. Depuis l'administration WordPress, rendez-vous dans **Extensions → Ajouter** puis activez **Lightbox - JLG**.
3. Les paramètres de la galerie sont accessibles sous **Réglages → Ma Galerie Automatique**.

## Principales options de configuration
- **Délai du diaporama** : temps entre deux images (par défaut 4 s).
- **Taille des vignettes** : hauteur des vignettes sur ordinateur (90 px) et sur mobile (70 px).
- **Couleur d’accent** : couleur des boutons, flèches et bordure de la vignette active.
- **Opacité de l’arrière-plan** : transparence du fond de la visionneuse (0.5–1).
- **Effets d’arrière-plan** : flou d’écho, texture ou flou en temps réel.
- **Lecture en boucle** et **lancement automatique** du diaporama.
- **Z‑index** de la galerie et **mode débogage**.

## Fonctionnalités
La visionneuse plein écran pilotée par `assets/js/gallery-slideshow.js` et mise en forme par `assets/css/gallery-slideshow.css` offre les contrôles suivants :
- **Compteur et légendes dynamiques** : chaque image affiche automatiquement sa légende ou, à défaut, son texte alternatif, accompagné du compteur « image actuelle / total ».
- **Lecture/Pause avec minuterie circulaire** : le bouton principal fusionne icônes lecture/pause et minuterie SVG pour visualiser en temps réel le délai avant la prochaine diapositive.
- **Zoom réactif** : le bouton loupe active le zoom Swiper pour inspecter les détails, tout en autorisant le glisser tactile pour se déplacer dans l’image.
- **Affichage plein écran** : un bouton dédié bascule le navigateur en mode plein écran et l’icône « Fermer » ou la touche Échap permet de revenir à la page.
- **Navigation clavier et commandes rapides** : les flèches du clavier, les boutons latéraux et les interactions tactiles permettent d’avancer ou de reculer, même en mode boucle.
- **Miniatures synchronisées** : un carrousel de vignettes met en évidence la diapositive active et permet de changer d’image d’un clic ou d’un tap.
- **Arrière-plan immersif et préchargement** : un effet d’écho flouté anime le fond tandis que les visuels suivants sont préchargés pour fluidifier la lecture.

### Mode débogage
- **Activation** : cochez **Activer le mode débogage** dans les réglages du plugin (onglet **Réglages → Ma Galerie Automatique**), case ajoutée par `includes/admin-page-template.php`.
- **Panneau d’analyse** : `assets/js/debug.js` affiche un panneau flottant regroupant un chronomètre temps réel, le timer d’autoplay synchronisé au cercle de progression et un journal d’événements détaillé.
- **Bouton de test** : le bouton **Forcer l’ouverture (Test)** insère instantanément une galerie de démonstration pour vérifier les comportements sans modifier vos contenus.

## Exemples d’utilisation
Après l’activation :
1. Éditez une page ou un article.
2. Insérez des images et liez chacune d’elles à son fichier média.
3. En visite, cliquer sur une image ouvre automatiquement le diaporama.

```html
<a href="image-large.jpg"><img src="image-large.jpg" alt="Exemple" /></a>
```

## Développement
Le modèle de la page d'administration se trouve dans `includes/admin-page-template.php`. Il est automatiquement chargé lors de l'affichage des réglages du plugin.

## Hooks et personnalisation

Ces filtres permettent d'adapter le comportement du plugin selon vos besoins.

> 💡 Par défaut, le plugin charge les fichiers `swiper-bundle.min.css` et `swiper-bundle.min.js` présents dans `assets/vendor/swiper/`.
> Si vous préférez déléguer le chargement à un CDN, vous pouvez utiliser les filtres ci-dessous.

### `mga_swiper_css`
- **Rôle** : modifier l'URL de la feuille de style utilisée par Swiper.
- **Moment** : filtré dans `mga_enqueue_assets()` au moment où les assets publics sont enfilés via `wp_enqueue_scripts`.
- **Exemple** : remplacer le fichier local par une version CDN.
  ```php
  add_filter( 'mga_swiper_css', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.css' );
  ```

### `mga_swiper_js`
- **Rôle** : remplacer le script JavaScript de Swiper avant son enfilement.
- **Moment** : appelé dans `mga_enqueue_assets()` juste avant l'enfilement du script Swiper côté visiteur.
- **Exemple** : pointer vers un script hébergé sur un CDN.
  ```php
  add_filter( 'mga_swiper_js', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.js' );
  ```

### `mga_user_can_view_debug`
- **Rôle** : contrôler quels utilisateurs peuvent voir les outils de débogage.
- **Moment** : évalué dans `mga_enqueue_assets()` lorsque l'option de débogage est active, juste avant l'ajout du script `debug.js`.
- **Exemple** : autoriser aussi les éditeurs à accéder aux informations de diagnostic.
  ```php
  add_filter( 'mga_user_can_view_debug', function ( $can_view ) {
      return $can_view || current_user_can( 'edit_others_posts' );
  } );
  ```

### `mga_force_enqueue`
- **Rôle** : forcer le chargement des assets même si aucune image éligible n'est détectée.
- **Moment** : appelé tout au début de `mga_should_enqueue_assets()` avant les vérifications de contexte.
- **Exemple** : activer systématiquement la lightbox sur un type de contenu personnalisé.
  ```php
  add_filter( 'mga_force_enqueue', function ( $force, $post ) {
      return $post && 'portfolio' === $post->post_type ? true : $force;
  }, 10, 2 );
  ```

### `mga_linked_image_blocks`
- **Rôle** : définir la liste des blocs Gutenberg inspectés pour trouver des images liées.
- **Moment** : utilisé dans `mga_should_enqueue_assets()` pendant l'analyse des blocs du contenu.
- **Exemple** : restreindre la détection aux galeries natives.
  ```php
  add_filter( 'mga_linked_image_blocks', fn() => [ 'core/gallery' ] );
  ```

### `mga_post_has_linked_images`
- **Rôle** : ajuster le résultat final de la détection d'images utilisables.
- **Moment** : appliqué dans `mga_should_enqueue_assets()` juste avant de retourner la décision de chargement des assets.
- **Exemple** : exclure les pièces jointes ou d'autres contenus spécifiques.
  ```php
  add_filter( 'mga_post_has_linked_images', function ( $has_images, $post ) {
      if ( $post && 'attachment' === $post->post_type ) {
          return false;
      }

      return $has_images;
  }, 10, 2 );
  ```

## Licence et support
Distribué sous licence [GPL 2.0 ou ultérieure](https://www.gnu.org/licenses/gpl-2.0.html).
Pour toute question ou suggestion, ouvrez une issue sur ce dépôt ou contactez l’auteur.

## Notes
Merci de mettre à jour régulièrement ce fichier README à chaque ajout de fonctionnalité ou modification majeure du plugin.

