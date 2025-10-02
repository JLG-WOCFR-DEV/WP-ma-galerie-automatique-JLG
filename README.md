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
- **Sélecteurs CSS personnalisés** : complétez la liste par défaut lorsque votre thème encapsule le contenu dans des conteneurs non standards (ex. `.site-main > .article-body`). Collez-les dans le champ multi-lignes (un sélecteur par ligne), cliquez sur **Ajouter un sélecteur** ou appuyez sur la touche **Entrée** depuis un champ pour alimenter la liste dynamique.

## Fonctionnalités
La visionneuse plein écran pilotée par `assets/js/gallery-slideshow.js` et mise en forme par `assets/css/gallery-slideshow.css` offre les contrôles suivants :
- **Compteur et légendes dynamiques** : chaque image affiche automatiquement sa légende ou, à défaut, son texte alternatif, accompagné du compteur « image actuelle / total ».
- **Lecture/Pause avec minuterie circulaire** : le bouton principal fusionne icônes lecture/pause et minuterie SVG pour visualiser en temps réel le délai avant la prochaine diapositive.
- **Zoom réactif** : le bouton loupe active le zoom Swiper pour inspecter les détails, tout en autorisant le glisser tactile pour se déplacer dans l’image.
- **Affichage plein écran** : un bouton dédié bascule le navigateur en mode plein écran et l’icône « Fermer » ou la touche Échap permet de revenir à la page.
- **Navigation clavier et commandes rapides** : les flèches du clavier, les boutons latéraux et les interactions tactiles permettent d’avancer ou de reculer, même en mode boucle.
- **Fermeture par clic hors image** : un clic sur l’arrière-plan de la visionneuse (en dehors du carrousel principal) ferme immédiatement le diaporama.
- **Miniatures synchronisées** : un carrousel de vignettes met en évidence la diapositive active et permet de changer d’image d’un clic ou d’un tap.
- **Arrière-plan immersif et préchargement** : un effet d’écho flouté anime le fond tandis que les visuels suivants sont préchargés pour fluidifier la lecture.
- **Compatibilité avec les pièces jointes WordPress** : les galeries configurées avec `linkDestination: "attachment"` ouvrent la visionneuse sur le média original en s’appuyant sur les attributs `data-full-url` / `data-orig-file` des images.

### Prévisualisation dans l’éditeur de blocs
- **Bloc « Lightbox – Aperçu »** : un bloc dédié (`assets/js/block/index.js`) simule la visionneuse dans Gutenberg. L’inspector expose les options clés (lecture auto, contrôles, styles) et l’aperçu réduit réutilise les classes CSS de la lightbox pour refléter fidèlement le rendu.
- **Chargement ciblé** : le hook `enqueue_block_editor_assets` enfile désormais `assets/js/block-editor-preview.js`, `assets/css/block-editor-preview.css` et la feuille `assets/css/block/editor.css` uniquement côté éditeur.
- **Décorations natives** : le script `block-editor-preview.js` s’appuie sur l’API `editor.BlockListBlock` pour ajouter la pastille « Lightbox active » aux blocs `core/gallery`, `core/image`, `core/media-text` et `core/cover` lorsqu’une image est liée à son fichier média. Plus besoin de MutationObserver ni de modifications directes du DOM.
- **Compatibilité réutilisable** : les blocs réutilisables héritent automatiquement du marquage grâce à l’analyse des attributs Gutenberg, garantissant une indication cohérente quel que soit le contexte d’utilisation.

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

### Tests E2E
Les scénarios Playwright du dépôt (par exemple `tests/e2e/gallery-viewer.spec.ts`) génèrent désormais leurs propres images PNG de test afin d'éviter de versionner des médias binaires. Si vous souhaitez vérifier visuellement la lightbox avec des visuels plus représentatifs, déposez simplement vos fichiers dans `tests/e2e/assets/` (non suivi par Git). Les fichiers `png`, `jpg`, `jpeg`, `gif`, `webp` ou `avif` y sont automatiquement détectés — conservez au moins deux images pour couvrir la galerie complète.

## Hooks et personnalisation

Ces filtres permettent d'adapter le comportement du plugin selon vos besoins.

### Quand ajuster les sélecteurs CSS ?

Si votre thème n’utilise pas les classes habituelles comme `.entry-content`, `.page-content` ou `.post-content`, la détection automatique peut ignorer certaines images liées. Dans ce cas, ouvrez **Réglages → Ma Galerie Automatique** puis ajoutez vos propres sélecteurs CSS dans le champ **Sélecteurs CSS personnalisés**. Vous pouvez coller plusieurs sélecteurs en les séparant par des retours à la ligne, cliquer sur **Ajouter un sélecteur** ou utiliser la touche **Entrée** pour générer une nouvelle rangée à la volée. Pensez à inspecter votre page avec les outils de développement du navigateur afin d’identifier la classe englobante : le plugin combinera vos sélecteurs avec ceux fournis par défaut pour localiser les images prêtes à ouvrir la lightbox.

### `mga_swiper_css`
- **Rôle** : modifier l'URL de la feuille de style utilisée par Swiper (locale par défaut).
- **Ressource locale** : le plugin embarque la version minifiée officielle (`ma-galerie-automatique/assets/vendor/swiper/swiper-bundle.min.css`).
- **Moment** : filtré dans `mga_enqueue_assets()` au moment où les assets publics sont enfilés via `wp_enqueue_scripts`.
- **Astuce** : pointez vers un CDN si vous souhaitez déléguer le chargement à un fournisseur externe.
  ```php
  add_filter( 'mga_swiper_css', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.css' );
  ```
- **Note** : lorsque l'URL finale ne correspond plus à celle fournie par défaut, les attributs SRI sont retirés automatiquement pour éviter les erreurs de validation.

### `mga_swiper_js`
- **Rôle** : remplacer le script JavaScript de Swiper avant son enfilement (la version locale est chargée par défaut).
- **Ressource locale** : la bibliothèque fournie est `ma-galerie-automatique/assets/vendor/swiper/swiper-bundle.min.js`.
- **Moment** : appelé dans `mga_enqueue_assets()` juste avant l'enfilement du script Swiper côté visiteur.
- **Astuce** : utilisez un CDN si vous préférez mutualiser la bibliothèque.
  ```php
  add_filter( 'mga_swiper_js', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.js' );
  ```
- **Note** : de la même manière, un script Swiper personnalisé n'embarque plus les attributs SRI par défaut.

### `mga_swiper_css_sri_attributes`
- **Rôle** : ajuster ou supprimer les attributs ajoutés à la balise `<link>` du Swiper CDN (intégrité, `crossorigin`, etc.).
- **Moment** : appliqué dans `mga_enqueue_assets()` après la résolution de l'URL finale.
- **Exemple** : définir un nouvel hash SRI pour un CDN personnalisé.
  ```php
  add_filter( 'mga_swiper_css_sri_attributes', function ( array $attributes ) {
      return [
          'integrity'  => 'sha384-...votre hash...',
          'crossorigin' => 'anonymous',
      ];
  } );
  ```

### `mga_swiper_js_sri_attributes`
- **Rôle** : adapter les attributs ajoutés au `<script>` de Swiper.
- **Moment** : appelé lors de l'enfilement des scripts publics.
- **Exemple** : désactiver complètement la vérification SRI.
  ```php
  add_filter( 'mga_swiper_js_sri_attributes', '__return_empty_array' );
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

