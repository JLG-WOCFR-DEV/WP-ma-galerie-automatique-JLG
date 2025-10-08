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
