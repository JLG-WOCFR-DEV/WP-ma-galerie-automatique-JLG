# Audit comparatif Lightbox – JLG vs extensions professionnelles

Ce rapport synthétise les forces actuelles du plugin et les écarts les plus
courants face aux offres premium (Envira Gallery, FooGallery Pro, Modula Pro,
etc.). Les recommandations sont classées par thématique demandée.

## 1. Options et pilotage produit

### Points solides
- Les réglages globaux couvrent les paramètres essentiels d’un diaporama
  (vitesse, effets, couleur d’accent, arrière-plan, options de partage) et sont
  correctement typés/sanitisés côté PHP.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L405】
- L’interface d’administration permet déjà de gérer une liste ordonnée de
  canaux de partage, chacun avec libellé, icône, modèle d’URL et activation
  individuelle, ce qui rivalise avec les solutions avancées.【F:ma-galerie-automatique/includes/admin-page-template.php†L412-L520】

### Options manquantes / recommandations
- **Presets et ciblage contextuel** : aujourd’hui toutes les options sont
  globales. Ajoutez des profils (p. ex. « portfolio », « blog », « mobile
  minimal ») stockés en base, applicables par post type ou par bloc, pour
  permettre une personnalisation fine sans dupliquer les réglages.
- **Générateur de thèmes** : les styles frontend ne réagissent qu’à la couleur
  d’accent et au style de fond via deux variables CSS.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L11-L105】【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L321-L368】 Proposez des préréglages complets (typo, boutons
  carrés/arrondis, modes clair/sombre) avec prévisualisation dans le back-office.
- **Gestion des contenus riches** : la détection ne cible que des liens d’image
  statiques via une expression régulière limitée aux formats JPG/PNG/GIF/WebP/AVIF/SVG.【F:ma-galerie-automatique/includes/Content/Detection.php†L200-L224】 Intégrez une
  couche de détection DOM (iframe, vidéo, audio) et des paramètres associés
  (lecture vidéo inline, carrousel mixte).
- **Pilotage des assets** : les scripts Swiper et la visionneuse sont toujours
  chargés ensemble dès que la détection est positive, sans découpage par
  fonctionnalité.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L159】 Introduisez des modules optionnels (ex. zoom, partage, debug)
  afin de réduire le poids initial ou d’autoriser des remplacements par le
  thème.
- **Statistiques et télémétrie** : ajoutez un module facultatif comptant les
  ouvertures, clics sur partage/téléchargement et durée moyenne, avec export CSV
  ou webhook, attendu par les agences.

## 2. UX/UI de la visionneuse

### Points solides
- La visionneuse est construite comme un vrai « dialog » avec focus trap,
  compteur dynamique et minuterie circulaire, offrant une ergonomie soignée.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L1917-L2051】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2802-L2858】
- Les boutons optionnels (zoom, téléchargement, partage, plein écran) peuvent
  être masqués individuellement selon les réglages enregistrés.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2012-L2051】【F:ma-galerie-automatique/includes/Admin/Settings.php†L288-L295】

### Améliorations recommandées
- **Deep linking & navigation historique** : implémentez des ancres ou
  `pushState` pour permettre le partage d’une diapositive précise, fonctionnalité
  standard des galeries pro. (Le code actuel ne manipule ni `history` ni
  `location`.)
- **Annotations et métadonnées** : offrez une barre latérale optionnelle affichant
  EXIF, auteur ou boutons « acheter/imprimer », très demandés par les
  photographes.
- **Personnalisation des contrôles** : proposez un sélecteur de formes/icônes
  directement dans le back-office afin de s’aligner sur l’identité visuelle,
  au-delà de la simple couleur.
- **Transitions hybrides** : élargissez les effets aux animations composées
  (Ken Burns, parallaxe) avec un aperçu en direct et gestion automatique du
  fallback lorsque `prefers-reduced-motion` est actif.

## 3. Navigation mobile

### Points solides
- Le CSS adapte la disposition des miniatures, redimensionne les flèches et
  gère les zones sécurisées (safe-area) pour les appareils mobiles en portrait
  et paysage.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L213-L407】
- Les interactions clavier/souris sont centralisées (fermeture via clic fond,
  touches fléchées, Échap), garantissant un comportement cohérent sur desktop.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3321-L3365】

### Améliorations recommandées
- **Gestes natifs** : ajoutez un geste « glisser vers le bas » pour fermer, un
  double-tap pour zoomer/dézoomer et des feedbacks haptiques optionnels. Aujourd’hui
  les événements tactiles ne servent qu’au logging debug.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3040-L3040】
- **Barre d’actions condensée** : proposez un mode « bubble » (bouton flottant
  regroupant zoom/partage) pour les écrans étroits où la barre actuelle prend
  beaucoup de place.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L297-L368】
- **Préchargement adaptatif** : couplez le préchargement aux conditions réseau
  (`navigator.connection`) pour éviter les téléchargements lourds sur mobile.

## 4. Accessibilité

### Points solides
- Le conteneur principal et la modale de partage exposent `role="dialog"`,
  `aria-modal` et un texte caché, avec mise à jour de la légende via une région
  vivante.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L1917-L1964】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L827-L894】
- Un piège à focus et des raccourcis clavier (Échap, flèches, Tab) garantissent
  une navigation clavier complète.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2802-L2853】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3321-L3365】

### Améliorations recommandées
- **Annonce des états de chargement** : le spinner visuel n’est pas relié à une
  région `aria-live`; ajoutez un message vocalisé (« Chargement de l’image… ») et
  exposez l’avancement du préchargement.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L106-L139】
- **Contrastes vérifiés** : fournissez un validateur automatique avertissant
  lorsque la couleur d’accent choisie tombe sous les ratios WCAG selon le style
  d’arrière-plan.【F:ma-galerie-automatique/includes/Admin/Settings.php†L279-L288】【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L70-L105】
- **Focus persistant sur miniatures** : après navigation clavier, renvoyez le
  focus sur la vignette active pour éviter la perte de contexte dans les longues
  galeries.

## 5. Apparence dans WordPress (éditeur inclus)

### Points solides
- Le bloc Gutenberg sérialise les réglages globaux pour proposer une prévisualisation
  stylisée cohérente avec le frontal.【F:ma-galerie-automatique/includes/Plugin.php†L180-L205】【F:ma-galerie-automatique/assets/js/block/index.js†L249-L360】
- L’éditeur affiche un aperçu statique agréable (cartes, chips de métadonnées,
  placeholders colorés) qui contextualise les options sans nécessiter le front.【F:ma-galerie-automatique/assets/css/block/editor.css†L1-L84】【F:ma-galerie-automatique/assets/js/block/index.js†L292-L355】

### Améliorations recommandées
- **Prévisualisation interactive** : le bloc ne rend rien côté serveur (`render_callback`
  renvoie une chaîne vide) et ne déclenche pas la vraie lightbox dans l’éditeur.【F:ma-galerie-automatique/includes/Plugin.php†L209-L215】 Intégrez un script d’aperçu qui réutilise `gallery-slideshow.js` en mode sandbox
  pour tester les interactions sans quitter Gutenberg.
- **Contrôles contextuels par bloc** : exposez les options clés directement dans
  l’inspecteur (vitesse locale, thème local, désactivation de boutons) au lieu de
  dépendre uniquement des réglages globaux, afin d’approcher les workflows des
  constructeurs visuels.
- **Mode éditeur visuel** : synchronisez l’état des miniatures et de la barre
  d’outils avec les médias sélectionnés dans le bloc Galerie natif pour éviter la
  dissonance entre éditeur et frontend.

---
Ces évolutions rapprocheraient Lightbox – JLG des standards premium tout en
préservant ses points forts actuels (partage modulaire, outillage debug,
intégration Gutenberg).
