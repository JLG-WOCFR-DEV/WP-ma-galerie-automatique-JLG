# Audit comparatif Lightbox – JLG vs extensions professionnelles

Ce rapport synthétise les forces actuelles du plugin et les écarts les plus
courants face aux offres premium (Envira Gallery, FooGallery Pro, Modula Pro,
etc.). Les recommandations sont classées par thématique demandée.

## 1. Options et pilotage produit

### Tableau comparatif rapide

| Parcours produit | Lightbox – JLG | Envira Gallery (Pro) | FooGallery (Pro) | Modula (Pro) | Opportunités d'amélioration |
| --- | --- | --- | --- | --- | --- |
| Profils d'affichage | Réglages 100 % globaux | Templates par galerie + add-ons | Presets par galerie + rôles utilisateur | Recettes + rôles d'édition | Introduire des presets stockés en base avec ciblage par type de contenu/bloc. |
| Détection de médias | Regex sur liens image | Analyse DOM + métadonnées EXIF | Analyse DOM + filtres contenu dynamique | Analyse DOM + import Lightroom | Passer à un parseur DOM et gérer les médias enrichis (vidéo/audio/HTML). |
| Bundles front | Chargement unique Swiper + visionneuse | Modules par fonctionnalité | Bundles différenciés (Core/Zoom/Video) | Bundles différenciés (Core/Effets) | Découper les scripts en modules optionnels + compatibilité `wp_register_*`. |
| Analytics intégrées | Aucune | Add-on statistiques (vues, ventes) | Rapports clics + intégration GA | Statistiques basiques + webhooks | Proposer un module de suivi (opt-in) avec export CSV/webhook. |

### Organisation Simple vs Expert

| Critère | Lightbox – JLG | Envira/FooGallery/Modula | Axes d'amélioration |
| --- | --- | --- | --- |
| Découverte des réglages | Toggle « Vue simplifiée / Vue complète » sans onboarding spécifique.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L112】 | Parcours guidés + checklists (« Getting started », popovers d’aide). | Ajouter une check-list progressive et des bulles contextuelles par étape pour clarifier ce qui est couvert par le mode simple. |
| Contenu du mode simple | Sections limitées mais champs identiques (libellés parfois techniques).【F:ma-galerie-automatique/includes/admin-page-template.php†L83-L112】 | Champs reformulés (langage métier) + presets verrouillés. | Simplifier la terminologie et proposer des profils préremplis liés au mode « Essentiel » afin de réduire le besoin d’interprétation. |
| Passage au mode expert | Sélecteur instantané sans prévisualisation des nouveaux champs.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L112】 | Aperçu des fonctionnalités supplémentaires + sauvegarde distincte des profils. | Afficher un panneau de comparaison (nouveaux réglages, impacts attendus) et permettre d’enregistrer des brouillons de configuration avant activation globale. |
| Assistance | Recherche instantanée + aperçu statique.【F:ma-galerie-automatique/includes/admin-page-template.php†L53-L124】 | Docs in-app, liens tutoriels vidéo, support chat. | Intégrer une base de connaissances contextuelle (tooltips + liens vers docs/vidéo) et un bouton de contact rapide pour se rapprocher du support premium. |

- **Architecture UX globale** : distinguer visuellement les deux modes via des onglets fixes (Simple, Expert) combinés à un bandeau d’explication synthétique. Chaque onglet affiche un indicateur de complétude (progress bar) et rappelle la finalité du mode pour calquer l’approche d’Envira et de Modula.
- **Mode simple scénarisé** : afficher une timeline « Configurer → Prévisualiser → Publier » avec textes pédagogiques, inspirée des checklists Envira. Sur mobile, proposer un résumé compact des options actives pour rester lisible.
- **Mode simple guidé** : réduire le nombre de champs visibles à trois groupes (« Apparence », « Navigation », « Partage »), chaque carte contenant un bouton « Détails » qui renvoie vers l’onglet expert. Ajouter un aperçu visuel miniature alimenté par les presets (voir ci-dessous) pour rassurer les utilisateurs peu techniques.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L214】
- **Mode expert documenté** : associer chaque section avancée à un encart « Quand l’utiliser ? » avec exemples d’usage (sites multilingues, CDN, debug). Rendre ces encarts repliables pour éviter la surcharge visuelle.
- **Cartes expert structurées** : regrouper les options techniques dans des « cards » à onglets secondaires (Performances, Accessibilité, Diagnostics) avec badges d’avertissement lorsque des réglages sensibles sont activés, à l’instar des modes avancés de FooGallery Pro.【F:ma-galerie-automatique/includes/admin-page-template.php†L119-L520】
- **Bascules sans frictions** : mémoriser l’onglet, la recherche et l’état de dépliement lors du passage simple ↔ expert pour éviter de perdre le contexte utilisateur, comme le font les panneaux React de FooGallery.
- **Export/import ciblé** : permettre d’exporter uniquement les réglages du mode expert ou simple (JSON) pour favoriser le partage entre sites, à l’image des « Config packs » de Modula.
- **Accessibilité cohérente** : prévoir des points d’entrée identiques (ordre des tabulations, raccourcis clavier, intitulés ARIA) dans les deux modes, avec un rappel explicite des impacts sur les animations (`prefers-reduced-motion`) pour se conformer aux standards pro.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L214】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3034-L3074】
- **Suivi d’activités** : consigner la dernière modification par mode (timestamp, auteur) et l’afficher en pied de page avec un bouton « Journal complet », pour se rapprocher des historiques détaillés d’Envira/FooGallery.

##### Parcours d’onboarding recommandé
1. **Modalité découverte** : à la première activation, déclencher une modale pleine largeur qui présente les deux modes, leurs avantages et un bouton « Choisir automatiquement » basé sur un questionnaire rapide (nombre de galeries, niveau technique). La modale doit respecter le focus trap et offrir un résumé textuel court pour les lecteurs d’écran.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2834-L2892】
2. **Checklist progressive** : proposer un bandeau fixe en haut du mode simple listant 4 étapes (ajouter des médias, choisir un preset, vérifier l’accessibilité, publier). Chaque étape renvoie vers la section correspondante et affiche une coche à validation, comme les workflows d’Envira.
3. **Raccourcis pro** : dans le mode expert, afficher une barre latérale sticky contenant des ancres rapides (Performances, Accessibilité, Fiabilité) et un bouton « Tester la galerie » qui ouvre la visionneuse de démonstration avec les options courantes pour aligner l’expérience sur les outils premium.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2509-L2832】
4. **Assistance continue** : intégrer une zone « Tutoriels recommandés » alimentée par des articles/vidéos, filtrés selon le mode actif. Les liens doivent s’ouvrir dans un nouvel onglet avec un indicateur visuel et un `aria-describedby` pour signaler l’ouverture externe.

### Points solides
- Les réglages globaux couvrent les paramètres essentiels d’un diaporama
  (vitesse, effets, couleur d’accent, arrière-plan, options de partage) et sont
  correctement typés/sanitisés côté PHP.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L405】
- L’interface d’administration permet déjà de gérer une liste ordonnée de
  canaux de partage, chacun avec libellé, icône, modèle d’URL et activation
  individuelle, ce qui rivalise avec les solutions avancées.【F:ma-galerie-automatique/includes/admin-page-template.php†L412-L520】
- Un nouveau lot de commandes WP-CLI (`wp mga cache status|purge`) facilite les purges et audits de cache sans passer par l’interface graphique, ce qui s’aligne sur les attentes des équipes ops des extensions pro.【F:ma-galerie-automatique/includes/Cli/CacheCommand.php†L18-L205】

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

### Améliorations prioritaires (roadmap suggérée)

1. **Presets et ciblage contextuel** (impact UX/UI + différenciation marketing).
2. **Pilotage des assets** (impact performance + compatibilité thèmes/page builders).
3. **Détection DOM enrichie** (impact couverture fonctionnelle + support contenus mixtes).
4. **Statistiques & reporting** (impact agences + upsell éventuel vers une version premium).
5. **Générateur de thèmes** (impact image de marque + concurrence directe).

## 2. UX/UI de la visionneuse

### Benchmark ergonomique

- **Envira Gallery** : propose `deep linking`, formulaires de contact dans la
  lightbox et intégration WooCommerce. L'URL reflète la diapositive, utile pour
  le SEO et le support.
- **FooGallery** : offre des palettes de contrôles configurables (formes,
  icônes SVG, positions). Les presets sont visibles en prévisualisation directe
  dans l'admin.
- **Modula** : mise en avant de transitions avancées (Ken Burns, tilt, zoom) et
  d'une barre latérale pour les métadonnées (EXIF, call-to-action).

### Points solides
- La visionneuse est construite comme un vrai « dialog » avec focus trap,
  compteur dynamique et minuterie circulaire, offrant une ergonomie soignée.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L1917-L2051】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2802-L2858】
- Les boutons optionnels (zoom, téléchargement, partage, plein écran) peuvent
  être masqués individuellement selon les réglages enregistrés.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2012-L2051】【F:ma-galerie-automatique/includes/Admin/Settings.php†L288-L295】
- Un gestionnaire d’historique encode l’ID de la galerie et l’index courant dans
  l’URL via `pushState`, ce qui permet déjà un deep linking comparable aux offres
  premium et restaure l’état à la fermeture.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L2703-L2790】

### Améliorations recommandées
- **Optimiser le deep linking existant** : exposez des réglages pour choisir le
  format du paramètre `mga`, synchroniser la légende dans la balise `<title>` et
  fournir une API JS permettant d’ouvrir une diapositive précise depuis un autre
  composant (menu, timeline) afin d’égaler les parcours des suites pro.
- **Annotations et métadonnées** : offrez une barre latérale optionnelle affichant
  EXIF, auteur ou boutons « acheter/imprimer », très demandés par les
  photographes.
- **Personnalisation des contrôles** : proposez un sélecteur de formes/icônes
  directement dans le back-office afin de s’aligner sur l’identité visuelle,
  au-delà de la simple couleur.
- **Transitions hybrides** : élargissez les effets aux animations composées
  (Ken Burns, parallaxe) avec un aperçu en direct et gestion automatique du
  fallback lorsque `prefers-reduced-motion` est actif.

#### Design system & identité visuelle
- **Palettes et styles prêts à l’emploi** : la visionneuse repose sur un unique
  dégradé sombre et une teinte d’accent globale, sans variation typographique ni
  densité différente entre headers, légendes et actions.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L43-L114】
  Inspirez-vous des thèmes « Modern », « Metro » ou « Darkroom » fournis par Envira
  et FooGallery pour proposer des presets complets (clairs/sombres, minimalistes,
  bordures carrées vs. pill, typo display) sélectionnables depuis l’admin.
- **Pack d’icônes et tailles configurables** : les boutons utilisent un seul SVG
  monochrome et un cercle de 44 px défini en dur.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L90-L151】
  Ajoutez des jeux d’icônes (outline, filled, duotone) et des options de taille
  pour se rapprocher des galeries pro qui offrent des contrôles adaptés au ton du
  site.
- **Cohérence admin/front** : côté réglages, seules la couleur d’accent, l’opacité
  du fond et le style d’arrière-plan sont personnalisables, sans aperçu temps
  réel ni sélection de famille de polices ou de coins arrondis.【F:ma-galerie-automatique/includes/admin-page-template.php†L119-L214】
  Un configurateur visuel (preview live + synchronisation avec le bloc) aiderait
  les utilisateurs non designers à composer un thème professionnel.
- **Effets de profondeur maîtrisés** : les options actuelles se limitent à trois
  arrières-plans (écho flouté, texture, blur temps réel).【F:ma-galerie-automatique/includes/admin-page-template.php†L200-L214】
  Proposez des variantes premium (verre dépoli coloré, panneaux translucides,
  overlays photo) avec réglages granulaires (grain, vignette, gradient multi-stop)
  pour rivaliser avec les skins « Pro » des concurrents.

#### Micro-interactions & feedback
- **Animations contextuelles** : l’interface n’exploite que quelques transitions
  génériques (fade/scale, hover) et un spinner circulaire uniforme.【F:ma-galerie-automatique/assets/css/gallery-slideshow.css†L90-L126】 Ajoutez des micro-interactions spécifiques (rebond léger sur changement
  d’image, highlight progressif des miniatures, animation d’apparition des
  légendes) inspirées des lightbox premium pour renforcer la sensation haut de
  gamme.
  - **Plan d’implémentation** : exploitez les hooks Swiper déjà en place (`slideChange`, `slideChangeTransitionStart/End`) pour ajouter des classes d’état (`is-entering`, `is-leaving`) et piloter des animations CSS fines, tout en respectant `prefers-reduced-motion` pour les utilisateurs sensibles.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3034-L3074】
  - **Personnalisation** : exposez un sélecteur de style d’animation (progressive, cinétique, minimaliste) avec prévisualisation live dans l’admin afin d’assurer la cohérence avec la charte graphique du site.【F:ma-galerie-automatique/includes/admin-page-template.php†L119-L214】
- **Feedback utilisateur enrichi** : combinez les transitions avec des sons
  discrets, vibrations (mobile) et indicateurs contextuels (pills « Copié » ou
  « Ajouté aux favoris ») pour aligner l’expérience sur les standards pro.
  - **Gestion des retours** : branchez les effets audio/haptiques sur les points d’entrée centralisés (`triggerImageDownload`, `shareAction`) pour couvrir téléchargements, partages natifs ou via la modale.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L730-L775】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L800-L1100】
  - **Feedback accessible** : réutilisez la zone `aria-live` de la légende pour afficher des confirmations textuelles temporaires (« Lien copié », « Favori ajouté »), assurant un retour vocalisé cohérent avec les lecteurs d’écran.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L1917-L2051】
- **Guidage onboarding** : au premier lancement, affichez des bulles d’aide
  superposées pour introduire les principaux contrôles (zoom, partage,
  téléchargement), comme le font Envira et Modula dans leurs démos. Rendez ce
  tutoriel re-jouable depuis la barre d’aide.
  - **Détection du premier usage** : initialisez la séquence dans `openViewer` si aucun flag `mga-onboarding-seen` n’est présent en `localStorage`, puis exposez une option admin pour forcer la réapparition du tutoriel.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2509-L2832】
  - **Patron de navigation** : réemployez le focus trap existant pour sécuriser les bulles d’aide et garantir un parcours clavier fluide, y compris sur fermeture/relecture du tutoriel.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2834-L2892】
- **Retour haptique et audio adaptatif** : exposez une section « Feedback
  sensoriel » dans l’admin pour activer vibrations, sons courts ou flash visuel
  lorsque l’utilisateur atteint la dernière image ou déclenche un partage,
  pratique pour les galeries événementielles.
  - **Scénarios conditionnels** : utilisez les événements Swiper pour détecter l’arrivée sur la dernière diapositive ou un changement de boucle, puis déclenchez des effets spécifiques tout en respectant `prefers-reduced-motion` et les préférences utilisateur.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3034-L3074】
  - **Contrôles d’admin** : ajoutez des toggles audio/haptique/visuel assortis d’un aperçu rapide dans les réglages, afin que l’utilisateur puisse tester l’intensité avant publication.【F:ma-galerie-automatique/includes/admin-page-template.php†L119-L214】
- **Timeline de progression** : ajoutez une barre ou un anneau de progression
  cumulant le temps passé et le nombre de vues, afin de matérialiser le rythme
  du diaporama comme dans les stories Instagram/Envira Slideshows.
  - **Réutilisation du timer** : étendez l’anneau SVG piloté par `autoplayTimeLeft` pour afficher le pourcentage de diapositives vues et le temps cumulé, avec variante horizontale sur mobile.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L1980-L2054】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3053-L3056】
  - **Analyse** : alimentez le futur module statistiques avec ces données pour produire un rapport « temps moyen par diapositive » (CSV/webhook) apprécié des agences.

#### Parcours pro et scénarios avancés
- **Mode « client proofing »** : ajoutez un panneau optionnel permettant de
  taguer des images (approuver/rejeter/commenter) et d’exporter ces sélections
  par email ou CSV. Les suites professionnelles le proposent pour les agences
  photo.
  - **Structure des données** : ajoutez un statut (`pending`, `approved`, `rejected`) et un commentaire aux objets `currentGalleryImages`, déjà centralisés lors de l’ouverture de la visionneuse, pour simplifier la persistance et l’export.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L548-L706】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2509-L2620】
  - **Flux opérateur** : fournissez un panneau latéral repliable avec raccourcis clavier (`A`/`R`), filtres de statut et export CSV depuis l’admin afin de fluidifier les sessions de sélection avec les clients.
- **Call-to-action configurables** : permettez d’ajouter des boutons personnalisés
  par diapositive (ex. « Acheter », « Demander un devis ») avec icône et URL,
  inspirés des workflows e-commerce de FooGallery Pro.
  - **Saisie des CTA** : autorisez la définition de CTA via des attributs `data-mga-cta-*` ou via le bloc Gutenberg, synchronisés avec les données d’image récupérées au parsing.
  - **Affichage et analytics** : réutilisez la logique de la modale de partage (construction dynamique, focus trap) pour afficher les CTA et remonter les clics dans le futur module d’analytics.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L800-L1100】
- **Mode diaporama automatisé événementiel** : offrez un thème « kiosque » avec
  lecture automatique, minuterie de session et verrouillage clavier (utile pour
  les salons). Intégrez un chronomètre visible et la reprise automatique après
  inactivité.
  - **Preset dédié** : combinez autoplay forcé, désactivation des boutons sensibles et retour automatique à la première diapositive en exploitant les événements Swiper (`autoplayStop`, `sliderMove`).【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3005-L3074】
  - **Sécurité de session** : empêchez la fermeture via Échap et réinitialisez le focus via la mécanique de `setupViewerFocusManagement` après X minutes d’inactivité pour un usage kiosque sans supervision.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L2834-L2892】
- **Intégration calendrier & rendez-vous** : pour les photographes ou agences,
  permettez d’ouvrir directement un widget Calendly/Acuity dans un panneau
  latéral, en reprenant les patterns multi-panneaux d’Envira.
  - **Chargement paresseux** : ajoutez un onglet de partage supplémentaire qui charge l’iframe de prise de rendez-vous uniquement sur action de l’utilisateur, afin de préserver le temps de chargement initial.【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L800-L1100】
  - **Suivi de conversion** : connectez ces interactions au futur module analytics (clics, formulaires envoyés) pour fournir des rapports exploitables aux photographes.

### Quick wins supplémentaires

- **Mode compact** : autoriser le masquage automatique de la barre d'outils au
  bout de quelques secondes (réaffichée au mouvement) pour maximiser l'espace
  visuel.
- **CTA personnalisables** : permettre l'ajout de boutons secondaires (« Réserver
  une séance », « Ajouter au panier ») connectés à des URLs configurables.

### Revue de code – synthèse rapide

- **Faux positifs DOM** : `dom_image_node_is_meaningful()` considère toute balise `<img>` comme valide même si aucun attribut de
  source n’est renseigné. La détection peut donc se déclencher sur des éléments décoratifs ou des placeholders vides.【F:ma-galerie-automatique/includes/Content/Detection.php†L992-L1004】 Corrigez la condition pour ne renvoyer `true` que lorsqu’un `src` ou équivalent est présent.
- **Formats médias restreints** : l’analyse `is_image_url()` ignore les formats HEIC/JPEG XL alors que les solutions pro supportent
  ces formats haut de gamme.【F:ma-galerie-automatique/includes/Content/Detection.php†L780-L807】 Ajoutez-les à la liste ou exposez un filtre pour que les intégrateurs puissent étendre la détection sans surcharger le cœur.
- **Modules front indissociables** : `Frontend\Assets::enqueue_assets()` charge un bundle unique qui inclut Swiper et toutes les options.
  Un découpage par fonctionnalités (thumbnails, partage, debug) faciliterait les optimisations Core Web Vitals et alignerait l’architecture sur les offres premium.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L20-L142】

## 3. Navigation mobile

### Benchmark mobile

- **Envira Gallery** : gestures « swipe down to close » et zoom par pincement,
  combinés à une option de vibrations sur changement de diapositive.
- **FooGallery** : propose un mode plein écran automatique sur mobile et une
  barre flottante qui se replie en icône unique.
- **Modula** : inclut un préchargement adaptatif basé sur la bande passante
  détectée via `navigator.connection`.

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

### Compléments proposés

- **Préférences utilisateur** : stocker dans `localStorage` le dernier niveau de
  zoom ou le mode sombre/clair afin de respecter les préférences récurrentes.
- **Accessibilité gestuelle** : exposer les gestes principaux via `aria-label`
  et documentation dans la modale d'aide afin d'aligner l'expérience tactile et
  clavier.

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
- **Vue simplifiée inclusive** : enrichir le mode « Vue simplifiée » avec des aides audio/texte spécifiques aux lecteurs d’écran et une hiérarchisation automatique des sections prioritaires pour reproduire les parcours guidés des solutions premium.【F:ma-galerie-automatique/includes/admin-page-template.php†L53-L112】
- **Gestion explicite du `prefers-reduced-motion`** : rendre le paramètre visible dans la vue simplifiée et documenter dans la vue experte comment chaque effet réagit, afin d’aligner l’interface avec les politiques d’accessibilité des suites pro.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L112】【F:ma-galerie-automatique/assets/js/gallery-slideshow.js†L3034-L3074】

### Pistes additionnelles

- **Mode narration** : ajouter une option qui lit automatiquement les légendes à
  voix haute (Web Speech API lorsque disponible) pour se démarquer des
  concurrents.
- **Thèmes haute visibilité** : proposer un preset dédié forte luminosité
  (couleurs à contraste élevé + bordures épaisses) pour répondre aux demandes
  d'accessibilité renforcée des marchés publics.

## 5. Apparence dans WordPress (éditeur inclus)

### Comparaison éditeur

- **Envira Gallery** : prévisualisation interactive directe dans Gutenberg avec
  un bouton « Launch Lightbox ».
- **FooGallery** : panneau latéral riche (onglets Layout, Style, Effets) avec
  rendu dynamique via React.
- **Modula** : glisser-déposer des images dans l'aperçu, réglages contextuels et
  sauvegarde en direct.

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

### Roadmap éditeur suggérée

1. Prévisualisation interactive dans Gutenberg (mode sandbox).
2. Options locales par bloc avec schéma JSON pour validation.
3. Synchronisation bidirectionnelle avec les galeries WP natives (hooks sur
   `core/gallery`).

## 6. Compatibilité multisite & internationalisation

### Points solides
- Le cache des réglages est invalidé dès qu’un changement de site survient grâce au hook `switch_blog`, et la couverture unitaire prévient désormais les régressions de cache sur les réseaux multisites.【F:tests/phpunit/SettingsCacheTest.php†L52-L91】
- Le fallback de traduction en Base64 est désormais géré par un service dédié qui décode et met en cache les `.mo` dans `wp-content/uploads/mga-translations/`, limitant les I/O récurrentes en production.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】

### Améliorations recommandées
- **Tests multisites automatisés** : poursuivez l’effort en simulant des environnements avec objet-cache distribué pour compléter le test `SettingsCacheTest::test_handle_switch_blog_invalidates_cache_snapshot` et mesurer l’impact sur des réseaux volumineux.【F:tests/phpunit/SettingsCacheTest.php†L52-L91】
- **Gestion avancée des traductions** : factorisez le `TranslationManager` pour piloter plusieurs locales, intégrer `WP_Filesystem` et publier des métriques (hash, taille, erreurs) exploitables par les équipes d’intégration.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】

### Opportunités court terme
- Capitalisez sur l’action `mga_swiper_asset_sources_refreshed` pour alimenter un log (WP-CLI ou Action Scheduler) retraçant les rafraîchissements et bascules CDN/local par site, afin de rassurer les intégrateurs sur la stabilité des déploiements.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L395-L418】
- Ajoutez une commande WP-CLI qui recompresse automatiquement les fichiers `.mo` en `.b64`, met à jour le hash attendu par le `TranslationManager` et valide l’écriture dans `wp-content/uploads/mga-translations/`.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】

## 7. Performance & SEO

### Points solides
- La détection mémorise les résultats dans des transients persistants basés sur
  l’empreinte du contenu et des réglages, ce qui évite les rescans inutiles sur
  les sites riches en médias.【F:ma-galerie-automatique/includes/Content/Detection.php†L1206-L1241】
- La collecte des sources haute définition lit `srcset`, `data-*` et URL des
  liens pour sélectionner la ressource la plus pertinente, limitant les erreurs
  404 et maximisant la netteté dans la visionneuse.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L1844-L1935】
- Les images injectées dans le diaporama et les miniatures utilisent `loading="lazy"`
  par défaut, ce qui réduit le coût initial du rendu sur mobile.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L3190-L3227】

### Améliorations recommandées
- **Générer des sources responsive côté visionneuse** : aujourd’hui `mainImg`
  n’injecte qu’un `src` haute résolution, ce qui impose la même ressource aux
  mobiles. Calculez et appliquez `srcset`/`sizes` en réutilisant l’analyse déjà
  effectuée par `parseSrcset()` pour réduire le poids chargé selon le viewport.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L1844-L1935】【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L3200-L3207】
- **Précharger intelligemment les assets** : `enqueue_assets()` se limite à
  enregistrer et charger Swiper + le bundle principal sans exposer de `rel="preload"`
  ni de `fetchpriority`. Ajoutez des hooks `wp_resource_hints`/`wp_preload_resources`
  et un réglage de priorité sur la première diapositive pour optimiser le Largest
  Contentful Paint, comme le proposent les suites pro orientées SEO.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L189】
- **Suivi du cache de détection** : la persistance via transients n’expose pas
  de métriques de hit/miss. Fournissez un panneau d’observation ou des hooks
  d’instrumentation (stats, alertes purge) pour sécuriser les déploiements sur
  des catalogues volumineux.【F:ma-galerie-automatique/includes/Content/Detection.php†L1206-L1241】

## 8. Fiabilité, observabilité et qualité de service

### Benchmark rapide

- **Envira / FooGallery** : dashboards d’état (uptime CDN d’assets, télémétrie de détection), alertes email en cas d’échec de chargement, intégration native avec des services de monitoring.
- **Lightbox – JLG** : logs WP-CLI et transients robustes, mais peu d’outils intégrés pour diagnostiquer les erreurs front/back au-delà des commandes existantes.【F:ma-galerie-automatique/includes/Cli/CacheCommand.php†L18-L205】【F:ma-galerie-automatique/includes/Content/Detection.php†L1206-L1241】

### Pistes d’amélioration

- **Centre de fiabilité** : ajouter un onglet « Fiabilité » dans le mode expert listant les derniers scans, leur durée, les caches utilisés, et un bouton de test instantané (similaire au « Health Checker » d’Envira). Ce panneau pourrait réutiliser les transients existants pour afficher le nombre de hits/miss du cache de détection.【F:ma-galerie-automatique/includes/Content/Detection.php†L1206-L1241】
- **Alertes proactives** : déclencher des notifications (email ou webhook) lorsqu’un scan échoue ou lorsqu’un asset tiers est indisponible, en s’appuyant sur `CacheCommand::log_error()` et l’action `mga_swiper_asset_sources_refreshed` pour enrichir les alertes.【F:ma-galerie-automatique/includes/Cli/CacheCommand.php†L18-L205】【F:ma-galerie-automatique/includes/Frontend/Assets.php†L395-L418】
- **Tests de régression guidés** : fournir une suite de scénarios « Fiabilité express » (bouton dans le mode expert) qui déclenche via WP-CLI ou Action Scheduler un parcours automatisé (détection, chargement front, purge). Les résultats pourraient être résumés dans l’interface, à la manière des checkers QA des plugins premium.
- **Journal d’incidents** : permettre d’ajouter des annotations (dates de purge, changements d’options) stockées dans un CPT ou dans les logs WP-CLI afin de suivre l’historique des interventions et favoriser la collaboration entre administrateurs.
- **Redondance des assets** : offrir une option pour définir une URL de secours pour Swiper / les icônes (CDN interne) et vérifier automatiquement leur disponibilité, ce que proposent les extensions pro orientées agences.
- **Benchmarks intégrés** : afficher dans l’onglet « Fiabilité » un comparatif synthétique des performances (temps moyen de scan, poids moyen des assets) face à des cibles internes (SLA) ou à des benchmarks d’Envira/FooGallery, afin de matérialiser les écarts et d’alimenter le discours commercial.
- **Cartographie des dépendances** : générer automatiquement un schéma des ressources chargées (CDN Swiper, fontes, scripts personnalisés) avec un statut « OK / Dégradé / Inaccessible ». Une mini-heatmap en mode simple (verts/jaunes/rouges) aide à repérer rapidement les problèmes, tandis que le mode expert affiche la pile détaillée (URL, latence, dernier check).
- **Export support prêt à l’emploi** : proposer un bouton « Partager un rapport support » qui compile les données de diagnostic (logs, status caches, versions d’extensions) dans un ZIP, en reprenant le format des « System Info » premium. Ajouter un sélecteur de confidentialité pour exclure certaines métadonnées avant export.
- **Alertes contextualisées** : dans le mode simple, afficher un encart résumé (icône + message) lorsque des anomalies critiques sont détectées (échec de CDN, cache saturé), avec un lien « Voir détails dans le mode expert ». L’encart respecte les ratios de contraste et expose un `role="alert"` pour vocaliser l’information.【F:ma-galerie-automatique/includes/admin-page-template.php†L63-L214】
- **Accessibilité des diagnostics** : prévoir des labels et descriptions pour chaque métrique (ex. « Temps moyen de scan – 320 ms ») et permettre la navigation clavier dans les tableaux de logs via `aria-sort`, pour égaler les dashboards pro.

### Lien avec l’organisation Simple/Expert

- Afficher une synthèse « Santé du système » dans le mode simple (état du cache, dernières erreurs, check vert/rouge) pour rassurer les utilisateurs non techniques, tandis que le mode expert expose la granularité détaillée (logs, tests, bascules de CDN).
- Proposer un bouton « Partager avec le support » qui exporte les diagnostics en JSON/ZIP, facilitant l’assistance et se rapprochant des standards de support premium.

---

## Synthèse des écarts et plan d'action

| Priorité | Axe | Livrable clé | Bénéfice principal |
| --- | --- | --- | --- |
| 🔥 | Expérience produit | Presets + ciblage contextuel | Parité avec Envira/FooGallery sur la personnalisation par page |
| 🔥 | Performance | Découpage des assets + lazy modules | Amélioration des scores Core Web Vitals et compatibilité thèmes |
| 🔥 | UX visionneuse | Deep linking + gestes mobiles | Attentes standard des utilisateurs pro et SEO social |
| ⚡ | Accessibilité | Annonces ARIA + thèmes haute visibilité | Conformité WCAG AA et marchés publics |
| ⚡ | Analytics | Module opt-in avec export | Arguments commerciaux pour agences/pros |
| ✅ | Gouvernance | Roadmap éditeur Gutenberg | Adoption facilitée par les créateurs de sites |

En mettant en œuvre ces évolutions progressives, Lightbox – JLG se rapprochera
des suites professionnelles tout en conservant sa légèreté et son approche
modulaire.
