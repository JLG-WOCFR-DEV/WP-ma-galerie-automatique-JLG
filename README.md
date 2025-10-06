# Lightbox - JLG

Lightbox - JLG est un plugin WordPress qui transforme automatiquement les galeries d'images en visionneuse immersive et pleine page.

## Informations
- **Nom** : Lightbox - JLG
- **Rôle** : Créer une visionneuse plein écran pour les images reliées à leur média.
- **Auteur** : Jérôme Le Gousse
- **Version** : 1.8

## Installation et activation
1. Téléchargez ou clonez ce dépôt dans `wp-content/plugins/`.
2. Dans l'administration WordPress, rendez-vous dans **Extensions → Ajouter** puis activez **Lightbox - JLG**.
3. Accédez aux paramètres via **Réglages → Ma Galerie Automatique**.

## Fonctionnalités détaillées

### Visionneuse immersive
- **Compteur, titre et légende dynamiques** : la barre de titre affiche le numéro de la diapositive courante, la légende ou, à défaut, l’attribut alt du média.
- **Lecture/Pause chronométrée** : le bouton principal combine lecture/pause et minuterie circulaire pour visualiser la prochaine transition.
- **Miniatures synchronisées** : un carrousel de vignettes met en avant la diapositive active et accepte clics comme gestes tactiles.
- **Fond immersif** : le style d’arrière-plan (`echo`, `blur` ou `texture`) et le préchargement des visuels améliorent la perception de profondeur.
- **Fermeture facilitée** : un clic sur l’arrière-plan ou la touche Échap referme la visionneuse.

### Contrôles de lecture et d’animation
- **Vitesse et délai personnalisables** : définissez l’intervalle entre deux images et la vitesse de transition.
- **Effets Swiper** : choisissez entre `slide`, `fade`, `cube`, `coverflow` ou `flip`, puis ajustez l’easing et la durée pour coller au ton du site.【F:ma-galerie-automatique/includes/Admin/Settings.php†L265-L290】【F:ma-galerie-automatique/includes/Admin/Settings.php†L400-L459】
- **Lecture en boucle et démarrage automatique** : activez la boucle infinie ou l’autoplay dès l’ouverture.
- **Démarrage sur l’image cliquée** : lancez le diaporama directement sur la miniature sélectionnée pour respecter le contexte de lecture.【F:ma-galerie-automatique/includes/admin-page-template.php†L250-L256】

### Barre d’outils et actions utilisateur
- **Zoom progressif** : basculez le zoom Swiper pour inspecter une image dans ses moindres détails.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L458-L603】
- **Téléchargement rapide** : déclenchez le téléchargement du visuel en haute résolution via un simple bouton.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L605-L780】
- **Plein écran natif** : activez le mode plein écran des navigateurs et offrez une expérience cinématographique.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L629-L667】
- **Affichage sélectif** : chaque bouton (zoom, téléchargement, partage, plein écran, miniatures mobiles) peut être activé ou masqué depuis l’interface d’administration.【F:ma-galerie-automatique/includes/Admin/Settings.php†L282-L288】【F:ma-galerie-automatique/includes/admin-page-template.php†L297-L333】

### Partage avancé
- **Bouton de partage contextuel** : la barre d’outils ajoute automatiquement un bouton si au moins une action est disponible (canal social, copie, téléchargement rapide ou partage natif).【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L458-L528】
- **Modale de partage accessible** : la fenêtre dédiée gère le focus clavier, fournit des retours visuels et propose les options actives pour l’image en cours.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L827-L1070】
- **Canaux entièrement configurables** : l’interface d’administration permet d’ajouter, réordonner, activer/désactiver et personnaliser icône, libellé ou modèle d’URL de chaque canal.【F:ma-galerie-automatique/includes/admin-page-template.php†L336-L520】
- **Copie, téléchargement et partage natif** : au-delà des réseaux sociaux, les actions de copie dans le presse-papiers, de téléchargement et d’appel à `navigator.share` peuvent être activées individuellement.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L469-L528】

### Détection et compatibilité
- **Analyse Gutenberg et HTML brut** : le moteur détecte les images liées au média à partir des blocs WordPress (galerie, image, cover, requête, etc.) ou via une expression régulière sur le contenu filtré.【F:ma-galerie-automatique/includes/Content/Detection.php†L142-L200】
- **Sélecteurs personnalisés** : complétez la liste de conteneurs à scanner pour couvrir des structures de thème spécifiques, ou activez un repli sur `<body>` en cas d’architecture atypique.【F:ma-galerie-automatique/includes/Admin/Settings.php†L291-L295】【F:ma-galerie-automatique/includes/admin-page-template.php†L259-L295】
- **Archives et types de contenu ciblés** : choisissez les post types surveillés et, si nécessaire, scannez également les pages d’archives pour charger la visionneuse sur les listes d’articles.【F:ma-galerie-automatique/includes/Admin/Settings.php†L294-L295】【F:ma-galerie-automatique/includes/admin-page-template.php†L266-L279】【F:ma-galerie-automatique/includes/Content/Detection.php†L212-L262】
- **Bloc réutilisable et cache** : la détection suit les références de blocs réutilisables tout en mémorisant les IDs déjà visités pour limiter les boucles infinies.【F:ma-galerie-automatique/includes/Content/Detection.php†L265-L323】

### Intégration dans l’éditeur de blocs
- **Bloc « Lightbox – Aperçu »** : Gutenberg dispose d’un bloc de prévisualisation qui reproduit les styles frontaux et expose les réglages synchronisés avec l’interface publique.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Paramètres injectés** : les valeurs par défaut et celles enregistrées sont sérialisées en JavaScript pour offrir une prévisualisation fidèle côté éditeur.【F:ma-galerie-automatique/includes/Plugin.php†L180-L205】

### Mode débogage embarqué
- **Panneau d’analyse** : un panneau flottant liste le temps écoulé, l’état de l’autoplay et les événements récents pour aider au diagnostic.【F:ma-galerie-automatique/assets/js/debug.js†L200-L259】
- **Forçage de galerie test** : un bouton ajoute une galerie de démonstration instantanée pour reproduire les scénarios en un clic.【F:ma-galerie-automatique/assets/js/debug.js†L295-L323】
- **Journal de partage** : chaque action de partage déclenche une entrée dédiée, utile pour vérifier l’assemblage des URLs et des métadonnées.【F:ma-galerie-automatique/assets/js/debug.js†L262-L283】

### Internationalisation et assets
- **Traductions** : le chargement du domaine de traduction tente d’abord la méthode WordPress standard, puis retombe sur un fichier `.mo` encodé en base64 lorsque le dossier `languages` est indisponible.【F:ma-galerie-automatique/includes/Plugin.php†L66-L119】
- **Gestion des dépendances** : Swiper (CSS/JS) est servi en local ou via CDN selon disponibilité, avec gestion conditionnelle des attributs SRI et d’un rafraîchissement automatique après mise à jour du plugin.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L177】
- **Variables dynamiques** : la taille des miniatures, la couleur d’accent et l’opacité du fond sont injectées via CSS personnalisé pour s’aligner sur les réglages actifs.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L161-L177】

## Exemples d’utilisation
1. Éditez une page ou un article.
2. Insérez une galerie et liez chaque image à son fichier média.
3. Visitez la page et cliquez sur une image : la visionneuse pleine page s’ouvre automatiquement.

```html
<a href="image-large.jpg"><img src="image-large.jpg" alt="Exemple" /></a>
```

## Comparaison avec les solutions professionnelles

### Forces actuelles
- **Expérience utilisateur riche** : le module de partage entièrement configurable, la gestion du zoom, du téléchargement et du plein écran couvrent la plupart des usages rencontrés dans les extensions haut de gamme (par ex. Envira Gallery, Modula Pro).【F:ma-galerie-automatique/includes/admin-page-template.php†L297-L520】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L458-L1070】
- **Intégration Gutenberg poussée** : la synchronisation des réglages entre le front et le bloc d’aperçu limite les surprises visuelles et accélère les phases de maquettage.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Outils de diagnostic** : le mode débogage embarqué fournit des métriques et des journaux que l’on retrouve rarement en standard dans les plugins de lightbox commerciaux.【F:ma-galerie-automatique/assets/js/debug.js†L200-L323】
- **Respect de l’accessibilité** : le panneau de partage gère la navigation clavier et le focus de manière explicite, un point que seuls les éditeurs premium comme FooGallery ou NextGEN soignent systématiquement.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L827-L1070】

### Axes d’amélioration inspirés des offres pro
- **Analyse de contenu plus robuste** : la détection repose sur une expression régulière générique et des parcours bloc par bloc ; l’adoption d’un parseur DOM tolérant (comme le font Envira ou NextGEN), d’heuristiques par bloc et d’un cache différencié réduirait les faux positifs tout en améliorant les performances sur les gros sites.【F:ma-galerie-automatique/includes/Content/Detection.php†L142-L200】【F:ma-galerie-automatique/includes/Content/Detection.php†L265-L323】
- **Chargement conditionnel des assets** : Swiper, les styles et le script principal sont toujours enfilés lorsque la détection passe, sans différenciation par fonctionnalité. Un découpage modulaire (miniatures, partage, debug) et l’utilisation de `wp_register_*`, comme le proposent FooGallery ou Modula via leurs add-ons, faciliteraient les surcharges par les thèmes et réduiraient la dette de performance.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L177】
- **Bloc éditeur plus complet** : le bloc `lightbox-preview` ne définit ni script de vue ni rendu dynamique ; synchroniser les réglages via l’API REST et proposer une prévisualisation frontale alignée sur l’affichage public éviterait les divergences constatées dans certains thèmes premium, à l’image des blocs personnalisés fournis par Envira Gallery ou Kadence Blocks.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Purge de cache ciblée** : un simple `delete_post_meta_by_key` invalide tous les caches d’images liées à la moindre variation de réglage. Segmenter par type de contenu ou par langue, voire déclencher une purge différée comme le font les suites pro multi-sites, réduirait les recalculs massifs observés en production.【F:ma-galerie-automatique/includes/Plugin.php†L247-L266】
- **Gestion des traductions optimisée** : le fallback `.mo` encodé en base64 déclenche des lectures/écritures disque à chaque chargement et n’intègre pas les hooks `switch_locale`. Un service d’internationalisation dédié, couplé à l’API `WP_Filesystem`, alignerait le fonctionnement sur les pratiques des solutions professionnelles (WPML, Polylang).【F:ma-galerie-automatique/includes/Plugin.php†L66-L119】
- **Monétisation et différenciation** : proposer une feuille de route Freemium (packs de modèles de lightbox, intégrations WooCommerce ou Elementor) clarifierait le positionnement face aux références commerciales et offrirait un cadre d’évolution durable.

### Améliorations complémentaires proposées
- **Images responsives optimisées** : exploiter `srcset`/`sizes` pour choisir automatiquement la bonne résolution dans la lightbox et en arrière-plan limiterait la consommation de bande passante sur mobile tout en préservant la netteté sur les écrans haute densité.
- **Statistiques d’usage intégrées** : exposer des hooks et un tableau de bord basique (clics, partages, lecture automatique) aiderait les administrateurs à identifier les contenus qui performent et à ajuster leurs réglages de diffusion.
- **Mode accessibilité renforcé** : proposer un preset de réglages « haute accessibilité » (contrastes élevés, animations réduites, focus visuels persistants) faciliterait la mise en conformité immédiate pour les sites soumis au RGAA/WCAG.

### Feuille de route suggérée
1. **Phase performance** : implémenter le chargement conditionnel des assets et un cache de détection basé sur les IDs de blocs pour se rapprocher des temps de réponse des suites pro.
2. **Phase expérience éditeur** : enrichir le bloc Gutenberg avec prévisualisation temps réel, contrôles de colonnes et presets partage/toolbar directement importables.
3. **Phase intégrations avancées** : ouvrir des hooks dédiés pour WooCommerce, ACF et les constructeurs de pages afin de rivaliser avec les intégrations profondes proposées par Modula ou NextGEN.
4. **Phase offre commerciale** : décliner des bundles de thèmes/skins, documenter les APIs et préparer des plans de support (SLA, base de connaissances) alignés avec les attentes des clients professionnels.

## Développement
Le modèle de la page d’administration se trouve dans `includes/admin-page-template.php` et est chargé automatiquement lors de l’affichage des réglages.

### Tests E2E
Les scénarios Playwright (par exemple `tests/e2e/gallery-viewer.spec.ts`) génèrent leurs propres images de test afin d’éviter de versionner des médias binaires. Pour vérifier la lightbox avec vos visuels, déposez simplement les fichiers dans `tests/e2e/assets/` (non suivi par Git). Les formats `png`, `jpg`, `jpeg`, `gif`, `webp` ou `avif` sont pris en charge ; prévoyez au minimum deux images.

## Hooks et personnalisation

Ces filtres permettent d’adapter le comportement du plugin selon vos besoins.

### Quand ajuster les sélecteurs CSS ?

Si votre thème n’utilise pas les classes habituelles comme `.entry-content`, `.page-content` ou `.post-content`, la détection automatique peut ignorer certaines images liées. Dans ce cas, ouvrez **Réglages → Ma Galerie Automatique** puis ajoutez vos propres sélecteurs CSS dans le champ **Sélecteurs CSS personnalisés**. Vous pouvez coller plusieurs sélecteurs séparés par des retours à la ligne, cliquer sur **Ajouter un sélecteur** ou utiliser la touche **Entrée** pour générer une nouvelle rangée à la volée. Inspectez votre page avec les outils de développement du navigateur afin d’identifier la classe englobante : le plugin combinera vos sélecteurs avec ceux fournis par défaut pour localiser les images prêtes à ouvrir la lightbox.

### `mga_swiper_css`
- **Rôle** : modifier l’URL de la feuille de style utilisée par Swiper (locale par défaut).
- **Ressource locale** : la version minifiée officielle est incluse (`ma-galerie-automatique/assets/vendor/swiper/swiper-bundle.min.css`).
- **Moment** : filtré dans `mga_enqueue_assets()` au moment où les assets publics sont enfilés via `wp_enqueue_scripts`.
- **Astuce** : pointez vers un CDN pour déléguer le chargement à un fournisseur externe.
  ```php
  add_filter( 'mga_swiper_css', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.css' );
  ```
- **Note** : lorsque l’URL finale ne correspond plus à celle fournie par défaut, les attributs SRI sont retirés automatiquement pour éviter les erreurs de validation.

### `mga_swiper_js`
- **Rôle** : remplacer le script JavaScript de Swiper avant son enfilement (la version locale est chargée par défaut).
- **Ressource locale** : la bibliothèque fournie est `ma-galerie-automatique/assets/vendor/swiper/swiper-bundle.min.js`.
- **Moment** : appelé dans `mga_enqueue_assets()` juste avant l’enfilement du script Swiper côté visiteur.
- **Astuce** : utilisez un CDN si vous préférez mutualiser la bibliothèque.
  ```php
  add_filter( 'mga_swiper_js', fn() => 'https://cdn.example.com/swiper@11/swiper-bundle.min.js' );
  ```
- **Note** : de la même manière, un script Swiper personnalisé n’embarque plus les attributs SRI par défaut.

### `mga_swiper_css_sri_attributes`
- **Rôle** : ajuster ou supprimer les attributs ajoutés à la balise `<link>` du Swiper CDN (intégrité, `crossorigin`, etc.).
- **Moment** : appliqué dans `mga_enqueue_assets()` après la résolution de l’URL finale.
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
- **Moment** : appelé lors de l’enfilement des scripts publics.
- **Exemple** : désactiver complètement la vérification SRI.
  ```php
  add_filter( 'mga_swiper_js_sri_attributes', '__return_empty_array' );
  ```

### `mga_user_can_view_debug`
- **Rôle** : contrôler quels utilisateurs peuvent voir les outils de débogage.
- **Moment** : évalué dans `mga_enqueue_assets()` lorsque l’option de débogage est active, juste avant l’ajout du script `debug.js`.
- **Exemple** : autoriser aussi les éditeurs à accéder aux informations de diagnostic.
  ```php
  add_filter( 'mga_user_can_view_debug', function ( $can_view ) {
      return $can_view || current_user_can( 'edit_others_posts' );
  } );
  ```

### `mga_force_enqueue`
- **Rôle** : forcer le chargement des assets même si aucune image éligible n’est détectée.
- **Moment** : appelé tout au début de `mga_should_enqueue_assets()` avant les vérifications de contexte.
- **Compatibilité archives** : lorsque l’option **Analyser les archives** est activée, la détection s’exécute également sur les pages de liste. Ce filtre reste prioritaire et peut toujours forcer (ou empêcher) l’enfilement selon vos besoins.
- **Exemple** : activer systématiquement la lightbox sur un type de contenu personnalisé.
  ```php
  add_filter( 'mga_force_enqueue', function ( $force, $post ) {
      return $post && 'portfolio' === $post->post_type ? true : $force;
  }, 10, 2 );
  ```

### `mga_linked_image_blocks`
- **Rôle** : définir la liste des blocs Gutenberg inspectés pour trouver des images liées.
- **Moment** : utilisé dans `mga_should_enqueue_assets()` pendant l’analyse des blocs du contenu.
- **Exemple** : restreindre la détection aux galeries natives.
  ```php
  add_filter( 'mga_linked_image_blocks', fn() => [ 'core/gallery' ] );
  ```

### `mga_post_has_linked_images`
- **Rôle** : ajuster le résultat final de la détection d’images utilisables.
- **Moment** : appliqué dans `mga_should_enqueue_assets()` juste avant de retourner la décision de chargement des assets.
- **Exemple** : exclure les pièces jointes ou d’autres contenus spécifiques.
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
Merci de mettre à jour ce fichier README à chaque ajout de fonctionnalité ou modification majeure du plugin.
