# Lightbox - JLG

Lightbox - JLG est un plugin WordPress qui transforme automatiquement les galeries d'images en visionneuse immersive et pleine page.

## Informations
- **Nom** : Lightbox - JLG
- **Rôle** : Créer une visionneuse plein écran pour les images reliées à leur média.
- **Auteur** : Jérôme Le Gousse
- **Version** : 1.8.1

## Installation et activation
1. Téléchargez ou clonez ce dépôt dans `wp-content/plugins/`.
2. Depuis le dossier `wp-content/plugins/ma-galerie-automatique/`, exécutez `composer install --no-dev` afin de récupérer le SDK Google et les dépendances PHP du plugin.
3. Dans l'administration WordPress, rendez-vous dans **Extensions → Ajouter** puis activez **Lightbox - JLG**.
4. Accédez aux paramètres via **Réglages → Ma Galerie Automatique**.

Le dossier `vendor/` généré par Composer est ignoré dans Git : pensez à lancer `composer install --no-dev` avant de créer une archive ZIP ou de déployer l'extension pour inclure le SDK Google.

En cas de notice « Le SDK Google est indisponible » dans l'administration, vérifiez que `composer install --no-dev` a bien été exécuté et que WordPress dispose des droits d'écriture nécessaires dans le dossier `vendor/` du plugin.

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
- **Zoom progressif** : basculez le zoom Swiper pour inspecter une image dans ses moindres détails.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L482-L520】
- **Téléchargement rapide** : déclenchez le téléchargement du visuel en haute résolution via un simple bouton.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L496-L514】
- **Plein écran natif** : activez le mode plein écran des navigateurs et offrez une expérience cinématographique.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L520-L558】
- **Affichage sélectif** : chaque bouton (zoom, téléchargement, partage, plein écran, miniatures mobiles) peut être activé ou masqué depuis l’interface d’administration.【F:ma-galerie-automatique/includes/Admin/Settings.php†L282-L288】【F:ma-galerie-automatique/includes/admin-page-template.php†L297-L333】

### Partage avancé
- **Bouton de partage contextuel** : la barre d’outils ajoute automatiquement un bouton si au moins une action est disponible (canal social, copie, téléchargement rapide ou partage natif).【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L400-L520】
- **Modale de partage accessible** : la fenêtre dédiée gère le focus clavier, fournit des retours visuels et propose les options actives pour l’image en cours.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L780-L900】
- **Canaux entièrement configurables** : l’interface d’administration permet d’ajouter, réordonner, activer/désactiver et personnaliser icône, libellé ou modèle d’URL de chaque canal.【F:ma-galerie-automatique/includes/admin-page-template.php†L330-L520】【F:ma-galerie-automatique/assets/js/src/admin.js†L1368-L1416】
- **Copie, téléchargement et partage natif** : au-delà des réseaux sociaux, les actions de copie dans le presse-papiers, de téléchargement et d’appel à `navigator.share` peuvent être activées individuellement.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L400-L520】【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L780-L900】

### Détection et compatibilité
- **Analyse Gutenberg et HTML brut** : le moteur détecte les images liées au média à partir des blocs WordPress (galerie, image, cover, requête, etc.) ou via une expression régulière sur le contenu filtré.【F:ma-galerie-automatique/includes/Content/Detection.php†L142-L200】
- **Sources `<picture>` intelligentes** : les balises `<source>` sont évaluées comme les `<img>` afin d’ignorer les placeholders vides tout en détectant les attributs `srcset` ou personnalisés via le filtre `mga_picture_source_attributes`.【F:ma-galerie-automatique/includes/Content/Detection.php†L1484-L1625】【F:tests/phpunit/DetectionHtmlParsingTest.php†L115-L166】
- **Sélecteurs personnalisés** : complétez la liste de conteneurs à scanner pour couvrir des structures de thème spécifiques, ou activez un repli sur `<body>` en cas d’architecture atypique.【F:ma-galerie-automatique/includes/Admin/Settings.php†L291-L295】【F:ma-galerie-automatique/includes/admin-page-template.php†L259-L295】
- **Archives et types de contenu ciblés** : choisissez les post types surveillés et, si nécessaire, scannez également les pages d’archives pour charger la visionneuse sur les listes d’articles.【F:ma-galerie-automatique/includes/Admin/Settings.php†L294-L295】【F:ma-galerie-automatique/includes/admin-page-template.php†L266-L279】【F:ma-galerie-automatique/includes/Content/Detection.php†L212-L262】
- **CDN intelligents** : les URLs générées par des proxys ou services d’optimisation d’image (Next.js `_next/image`, Imgix, etc.) sont reconnues même sans extension de fichier grâce à l’analyse des paramètres de requête.【F:ma-galerie-automatique/includes/Content/Detection.php†L1072-L1180】
- **Bloc réutilisable et cache** : la détection suit les références de blocs réutilisables tout en mémorisant les IDs déjà visités pour limiter les boucles infinies.【F:ma-galerie-automatique/includes/Content/Detection.php†L265-L323】

### Intégration dans l’éditeur de blocs
- **Bloc « Lightbox – Aperçu »** : Gutenberg dispose d’un bloc de prévisualisation qui reproduit les styles frontaux et expose les réglages synchronisés avec l’interface publique.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Paramètres injectés** : les valeurs par défaut et celles enregistrées sont sérialisées en JavaScript pour offrir une prévisualisation fidèle côté éditeur.【F:ma-galerie-automatique/includes/Plugin.php†L180-L205】

### Mode débogage embarqué
- **Panneau d’analyse** : un panneau flottant liste le temps écoulé, l’état de l’autoplay et les événements récents pour aider au diagnostic.【F:ma-galerie-automatique/assets/js/debug.js†L200-L259】
- **Forçage de galerie test** : un bouton ajoute une galerie de démonstration instantanée pour reproduire les scénarios en un clic.【F:ma-galerie-automatique/assets/js/debug.js†L295-L323】
- **Journal de partage** : chaque action de partage déclenche une entrée dédiée, utile pour vérifier l’assemblage des URLs et des métadonnées.【F:ma-galerie-automatique/assets/js/debug.js†L262-L283】

### Internationalisation et assets
- **Traductions** : le chargement du domaine de traduction tente d’abord la méthode WordPress standard, puis retombe sur un fichier `.mo` encodé en base64 lorsque le dossier `languages` est indisponible.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L76】
- **Gestion des dépendances** : Swiper (CSS/JS) est servi en local ou via CDN selon disponibilité, avec gestion conditionnelle des attributs SRI et d’un rafraîchissement automatique après mise à jour du plugin.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L26-L205】
- **Chargement modulaire des assets** : la visionneuse enregistre désormais chaque module (coeur, partage, debug) via `wp_register_*`, ajoute automatiquement des `preconnect`/`dns-prefetch` vers le CDN Swiper et n’enfile la feuille `gallery-share.css` que lorsque le partage est actif. Le filtre `mga_frontend_asset_modules` permet d’ajuster les bundles chargés selon le contexte ou un thème enfant.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L35-L433】【F:ma-galerie-automatique/assets/css/gallery-share.css†L1-L98】
- **Variables dynamiques** : la taille des miniatures, la couleur d’accent et l’opacité du fond sont injectées via CSS personnalisé pour s’aligner sur les réglages actifs.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L220-L304】

### Internationalisation renforcée et instrumentation des assets
- **Cache persistant des traductions** : un gestionnaire dédié décode les `.mo` encodés en base64 dans un cache uploads (`wp-content/uploads/mga-translations/`) et réutilise les fichiers tant que le hash source reste identique, ce qui limite les lectures disque à chaque requête.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】
- **Notifications de rafraîchissement Swiper** : l’action `mga_swiper_asset_sources_refreshed` expose désormais le contexte (activation, mise à jour, assets manquants, rafraîchissement planifié) et la valeur précédente pour simplifier l’observabilité en production.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L395-L418】

## Exemples d’utilisation
1. Éditez une page ou un article.
2. Insérez une galerie et liez chaque image à son fichier média.
3. Visitez la page et cliquez sur une image : la visionneuse pleine page s’ouvre automatiquement.

```html
<a href="image-large.jpg"><img src="image-large.jpg" alt="Exemple" /></a>
```

## Comparaison avec les solutions professionnelles

### Forces actuelles
- **Expérience utilisateur riche** : le module de partage entièrement configurable, la gestion du zoom, du téléchargement et du plein écran couvrent la plupart des usages rencontrés dans les extensions haut de gamme (par ex. Envira Gallery, Modula Pro).【F:ma-galerie-automatique/includes/admin-page-template.php†L297-L520】【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L400-L900】
- **Intégration Gutenberg poussée** : la synchronisation des réglages entre le front et le bloc d’aperçu limite les surprises visuelles et accélère les phases de maquettage.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Outils de diagnostic** : le mode débogage embarqué fournit des métriques et des journaux que l’on retrouve rarement en standard dans les plugins de lightbox commerciaux.【F:ma-galerie-automatique/assets/js/debug.js†L200-L323】
- **Respect de l’accessibilité** : le panneau de partage gère la navigation clavier et le focus de manière explicite, un point que seuls les éditeurs premium comme FooGallery ou NextGEN soignent systématiquement.【F:ma-galerie-automatique/assets/js/src/gallery-slideshow.js†L780-L900】

### Axes d’amélioration inspirés des offres pro
- **Analyse de contenu plus robuste** : la détection repose sur une expression régulière générique et des parcours bloc par bloc ; l’adoption d’un parseur DOM tolérant (comme le font Envira ou NextGEN), d’heuristiques par bloc et d’un cache différencié réduirait les faux positifs tout en améliorant les performances sur les gros sites.【F:ma-galerie-automatique/includes/Content/Detection.php†L142-L200】【F:ma-galerie-automatique/includes/Content/Detection.php†L265-L323】
- **Chargement conditionnel des assets** : Swiper, les styles et le script principal sont toujours enfilés lorsque la détection passe, sans différenciation par fonctionnalité. Un découpage modulaire (miniatures, partage, debug) et l’utilisation de `wp_register_*`, comme le proposent FooGallery ou Modula via leurs add-ons, faciliteraient les surcharges par les thèmes et réduiraient la dette de performance.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L177】
- **Bloc éditeur plus complet** : le bloc `lightbox-preview` ne définit ni script de vue ni rendu dynamique ; synchroniser les réglages via l’API REST et proposer une prévisualisation frontale alignée sur l’affichage public éviterait les divergences constatées dans certains thèmes premium, à l’image des blocs personnalisés fournis par Envira Gallery ou Kadence Blocks.【F:ma-galerie-automatique/includes/Plugin.php†L157-L245】
- **Purge de cache ciblée** : un simple `delete_post_meta_by_key` invalide tous les caches d’images liées à la moindre variation de réglage. Segmenter par type de contenu ou par langue, voire déclencher une purge différée comme le font les suites pro multi-sites, réduirait les recalculs massifs observés en production.【F:ma-galerie-automatique/includes/Plugin.php†L247-L266】
- **Gestion des traductions optimisée** : le fallback `.mo` encodé en base64 déclenche des lectures/écritures disque à chaque chargement et n’intègre pas les hooks `switch_locale`. Un service d’internationalisation dédié, couplé à l’API `WP_Filesystem`, alignerait le fonctionnement sur les pratiques des solutions professionnelles (WPML, Polylang).【F:ma-galerie-automatique/includes/Plugin.php†L66-L119】
- **Monétisation et différenciation** : proposer une feuille de route Freemium (packs de modèles de lightbox, intégrations WooCommerce ou Elementor) clarifierait le positionnement face aux références commerciales et offrirait un cadre d’évolution durable.

### Plan d’action par axe prioritaire
| Axe | Objectifs mesurables | Actions clés | Indicateurs de succès | Équipe / dépendances |
| --- | --- | --- | --- | --- |
| Analyse de contenu | • Diminuer de 50 % les faux positifs signalés en support<br>• Réduire le temps moyen de détection d’une page de 30 % | 1. Intégrer un parseur HTML5 tolérant (ex. `masterminds/html5`).<br>2. Cartographier les blocs (`core/gallery`, `core/image`, etc.) et définir une heuristique dédiée par type.<br>3. Mettre en cache les résultats par post ID + langue via transients ou objet-cache.<br>4. Couvrir les nouveaux parcours via tests E2E Playwright et tests unitaires PHP. | • Taux d’erreur des tickets support<br>• Temps de génération moyen des galeries dans Query Monitor | Core PHP + QA (tests E2E) |
| Assets conditionnels | • Baisser de 40 % le poids initial CSS/JS sur une page simple<br>• Offrir un hook de substitution par module | 1. Refactoriser `enqueue_assets` pour utiliser `wp_register_script/style` par fonctionnalité (cœur, miniatures, partage, debug).<br>2. Ajouter une option d’admin pour activer/désactiver chaque module et refléter l’état côté front.<br>3. Implémenter une logique de lazy-loading (`IntersectionObserver`) pour les miniatures optionnelles.<br>4. Documenter les nouveaux hooks dans la section « Hooks et personnalisation ». | • Poids total des assets mesuré via WebPageTest<br>• Utilisation des hooks de substitution dans les thèmes partenaires | Frontend + Perf |
| Bloc éditeur | • Obtenir une prévisualisation 1:1 vs. front sur 3 thèmes de référence<br>• Couvrir 100 % des réglages critiques dans le bloc | 1. Extraire un store REST dédié (`/mga/v1/settings`) pour synchroniser les réglages.<br>2. Ajouter un `viewScript` et un `render_callback` afin d’aligner la sortie du bloc sur la visionneuse publique.<br>3. Définir des contrôles React (presets, effets, couleurs) avec aperçu instantané.<br>4. Créer des tests Jest + Playwright pour valider les scénarios Gutenberg. | • Résultats des tests UI<br>• Retours bêta testeurs éditeurs | JS/Gutenberg + QA |
| Purge de cache | • Ramener le temps de purge complet < 2 s sur un site 1 000 posts<br>• Éviter 90 % des purges inutiles | 1. Segmenter les metas de cache par post type/langue.<br>2. Implémenter une file différée (WP-Cron) pour les purges massives.<br>3. Ajouter des logs (action scheduler ou CPT) pour tracer les invalidations.<br>4. Étendre les tests PHPUnit existants pour couvrir les nouveaux scénarios. | • Temps de purge mesuré en staging<br>• Nombre de purges différées vs. immédiates | Core PHP + Ops |
| Internationalisation | • Supporter `switch_locale` et les multisites sans perte de traduction<br>• Réduire les E/S disque de 80 % | 1. Isoler la logique dans un service `TranslationManager` injectable.<br>2. Migrer le fallback base64 vers des fichiers temporaires gérés via `WP_Filesystem`.<br>3. Introduire un cache mémoire (objet-cache) par combinaison texte/langue.<br>4. Documenter les hooks pour permettre aux agences de fournir leurs propres packs linguistiques. | • Logs I/O serveur<br>• Tests automatisés `switch_to_locale` | Core PHP |
| Monétisation | • Formaliser une offre Freemium en 2 trimestres<br>• Obtenir 3 partenariats intégrateurs pilotes | 1. Définir des bundles de fonctionnalités (gratuit vs. premium) et préparer le licensing.<br>2. Prioriser les intégrations WooCommerce/Elementor en s’appuyant sur le refactor des assets.<br>3. Concevoir des templates premium (thèmes lightbox) et un pipeline de livraison (ZIP auto).<br>4. Préparer la documentation marketing (FAQ, fiches comparatives). | • Conversion Freemium<br>• Nombre de partenaires pilotes | Produit + Marketing |

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

### Commandes WP-CLI
- `wp mga cache status [--network]` affiche le nombre d’entrées de cache (`_mga_has_linked_images`, transients `mga_det_*`, sources Swiper) et leur dernière actualisation, site par site si l’option `--network` est fournie.【F:ma-galerie-automatique/includes/Cli/CacheCommand.php†L18-L88】
- `wp mga cache purge [--scope=all|detection|swiper] [--batch-size=<n>] [--network]` supprime les metas et transients de détection par lots, rafraîchit l’option Swiper et remonte un résumé détaillé, avec prise en charge multisite.【F:ma-galerie-automatique/includes/Cli/CacheCommand.php†L90-L276】

### Suivi technique courant
- **Cache multisite** : la couverture unitaire s’étend désormais au hook `switch_blog` pour garantir l’invalidation du cache mémoire lors d’un changement de site et prévenir les réglages incohérents sur les réseaux multisites.【F:tests/phpunit/SettingsCacheTest.php†L52-L91】
- **Sources Swiper** : le plugin mémorise l’origine des assets Swiper, force un rafraîchissement après mise à jour et expose un hook de notification documenté pour suivre les bascules CDN/local en production.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L395-L418】
- **Fallback de traduction** : `load_textdomain()` s’appuie sur un cache persistant des `.mo` encodés en Base64 ; une procédure de QA doit veiller à régénérer les fichiers encodés à chaque livraison et à vérifier les droits d’écriture sur `wp-content/uploads/mga-translations/`.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】

### Tests E2E
Les scénarios Playwright (par exemple `tests/e2e/gallery-viewer.spec.ts`) génèrent leurs propres images de test afin d’éviter de versionner des médias binaires. Pour vérifier la lightbox avec vos visuels, déposez simplement les fichiers dans `tests/e2e/assets/` (non suivi par Git). Les formats `png`, `jpg`, `jpeg`, `gif`, `webp` ou `avif` sont pris en charge ; prévoyez au minimum deux images.

- ✅ **Test vital : démarrage sur l’image cliquée** — Le scénario `starts the viewer at the clicked image` vérifie que la visionneuse s’ouvre directement sur la miniature sélectionnée au lieu de revenir au début de la galerie. Cette option est essentielle à l’expérience utilisateur et doit rester fonctionnelle à chaque mise à jour.

## Revue de code technique (avril 2024)

### Observations notables
- **Détection des balises `<img>` trop permissive** : la méthode `dom_image_node_is_meaningful()` renvoie `true` même si aucune source (`src`, `data-src`, `srcset`, etc.) n’est définie. Toute balise `<img>` vide est donc considérée comme valide, ce qui augmente les faux positifs côté détection et peut déclencher inutilement les assets.【F:ma-galerie-automatique/includes/Content/Detection.php†L992-L1004】 Il est recommandé de retourner `false` lorsque aucun attribut pertinent n’est renseigné.
- **Extensions d’image limitées** : `is_image_url()` n’accepte que sept formats (JPG, PNG, GIF, BMP, WebP, AVIF et SVG optionnel). Les formats récents tels que HEIC/HEIF ou JPEG XL sont ignorés alors que les concurrents premium commencent à les prendre en charge.【F:ma-galerie-automatique/includes/Content/Detection.php†L780-L807】 Étendez la liste ou exposez un filtre dédié.
- **Enfilement monolithique des scripts** : `enqueue_assets()` charge systématiquement la feuille de styles et le bundle JavaScript principaux sans possibilité native de segmentation (zoom, partage, miniatures). Cette approche complique les optimisations de performance par thème ou constructeur.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L20-L142】 Introduire des `wp_register_*` modulaires et des contrôles par fonctionnalité rapprocherait le plugin des offres pro.
- **Préchargement Swiper perfectible** : lorsque les fichiers locaux sont absents, le basculement vers le CDN est silencieux. Journaliser l’événement (ou exposer une notice admin) via l’action `mga_swiper_asset_sources_refreshed` faciliterait le diagnostic des installations qui oublient de publier les assets.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L35-L83】【F:ma-galerie-automatique/includes/Frontend/Assets.php†L395-L418】

### Suivi recommandé
- Créer un ticket pour renforcer `dom_image_node_is_meaningful()` (retour `false` si aucun attribut exploitable) et ajouter des tests unitaires couvrant des images sans `src`.
- Documenter/implémenter un filtre `mga_allowed_image_extensions` afin de supporter les formats émergents sans forker le cœur.
- Prototyper un découpage des bundles Swiper/visionneuse (scripts « core », « thumbs », « share », etc.) et mesurer l’impact via Lighthouse pour alimenter la roadmap performance.

## Hooks et personnalisation

### Presets graphiques inspirés de bibliothèques UI

Pour gagner du temps lors du maquettage, voici six presets de réglages qui s’inspirent de bibliothèques/UI kits populaires. Chacun s’appuie sur les options natives du plugin : effets, easing, dispositions des miniatures, couleurs d’accent et opacité de fond peuvent être ajustés depuis l’interface d’administration.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L422-L504】 Depuis **Réglages → Ma Galerie Automatique**, sélectionnez un preset dans le champ « Preset graphique », cliquez sur **Appliquer ce preset** puis affinez librement chaque option ou revenez aux valeurs par défaut en un clic.【F:ma-galerie-automatique/includes/admin-page-template.php†L20-L73】【F:ma-galerie-automatique/assets/js/src/admin.js†L1082-L1345】 Adaptez librement les valeurs proposées pour coller à votre direction artistique.

### Filtre `mga_dynamic_style_rules`

Le front injecte des variables CSS (`--mga-thumb-size-*`, `--mga-accent-color`, etc.) afin d’aligner l’interface avec les réglages actifs. Vous pouvez désormais compléter ou modifier ces règles en filtrant `mga_dynamic_style_rules`. Le callback reçoit les règles calculées par défaut, les réglages sauvegardés et leurs valeurs par défaut.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L150-L218】

```php
add_filter( 'mga_dynamic_style_rules', function ( array $rules ) {
    $rules[':root']['--mga-accent-color'] = '#ff00aa';
    $rules['body.lightbox-dark'] = [
        '--mga-bg-opacity' => '0.85',
    ];

    return $rules;
} );
```

Le plugin se charge ensuite de normaliser et d’échapper les propriétés avant d’injecter le CSS final, ce qui évite d’avoir à concaténer manuellement les chaînes de caractères.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L187-L218】

#### Preset « Headless UI » — minimalisme fonctionnel
- **Effet** : `fade` pour des transitions sobres.【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L493】
- **Easing** : `ease-in-out` afin de lisser l’entrée/sortie.【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Miniatures** : position `hidden` avec zoom activé pour laisser le focus sur l’image principale.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L295】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】
- **Arrière-plan** : style `echo` avec opacité 0,92 pour un fondu discret.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L461-L469】

#### Preset « Shadcn UI » — sobriété typographique
- **Effet** : `slide` pour accompagner une mise en page éditoriale.【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L493】
- **Easing** : `ease-out` pour un ressenti nerveux mais accessible.【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Miniatures** : alignées `left` avec taille desktop 88 px / mobile 64 px pour rappeler les barres latérales modulaires.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】
- **Couleur d’accent** : `#0f172a` (ardoise) et opacité 0,85 pour s’harmoniser avec des interfaces sombres.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】

#### Preset « Radix UI » — accessibilité stricte
- **Effet** : `slide` avec vitesse 450 ms pour conserver la perception de mouvement tout en respectant les préférences réduites.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L504】
- **Easing** : `linear` afin d’offrir une animation prévisible.【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Miniatures** : `bottom`, 96 px desktop / 72 px mobile avec contraste renforcé (`accent_color` `#2563eb`).【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】
- **Barre d’actions** : conserver zoom, téléchargement et partage pour répondre aux cas d’usage avancés.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L296】

#### Preset « Bootstrap » — esthétique corporate
- **Effet** : `slide` rapide (350 ms) pour refléter la réactivité des composants Bootstrap.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L504】
- **Easing** : `ease` couplé à l’autoplay en pause par défaut (lecture manuelle).【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L435】【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Couleur d’accent** : `#0d6efd`, opacité de fond 0,9 et miniatures `bottom` pour rappeler la hiérarchie visuelle classique.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】
- **CTA** : garder le bouton d’appel à l’action visible afin d’encourager les interactions commerciales.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L296】

#### Preset « Semantic UI » — équilibre éditorial
- **Effet** : `coverflow` pour apporter une touche dynamique maîtrisée.【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L493】
- **Easing** : `ease-in-out` et délai 5 s pour laisser respirer les visuels.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Miniatures** : `bottom`, 80 px desktop, 60 px mobile, accent `#6435c9` (violet) pour rappeler la palette Semantic.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】
- **Fond** : style `blur` pour souligner les transitions tout en conservant la lisibilité des légendes.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L461-L469】

#### Preset « Anime.js » — motion design expressif
- **Effet** : `flip` avec vitesse 520 ms pour un rendu cinétique.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】【F:ma-galerie-automatique/includes/Admin/Settings.php†L484-L504】
- **Easing** : `ease-in-out` et autoplay activé pour lancer le storytelling visuel automatiquement.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L435】【F:ma-galerie-automatique/includes/Admin/Settings.php†L495-L504】
- **Couleur d’accent** : gradient néon (ex. `#f97316` en accent principal) et opacité 0,75 pour laisser transparaître les textures de fond.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L406】
- **Miniatures** : `hidden` sur desktop mais visibles sur mobile (`show_thumbs_mobile` vrai) pour maximiser l’espace scénique tout en conservant la navigation tactile.【F:ma-galerie-automatique/includes/Admin/Settings.php†L271-L296】【F:ma-galerie-automatique/includes/Admin/Settings.php†L471-L482】

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

## Tests automatisés

### Préparer l'environnement PHPUnit
1. Exécutez `scripts/install-wp-tests.sh` (optionnellement en passant `db-name`, `db-user`, `db-pass`, `db-host`, `wp-version`). Le script télécharge WordPress Core et la librairie de tests dans `.wordpress-tests/` puis crée `wp-tests-config.php` si nécessaire.
2. Vérifiez que la base de données indiquée est accessible. Si `mysql` n'est pas disponible sur votre machine, créez la base manuellement avant de relancer le script.
3. Exportez la variable d'environnement `WP_PHPUNIT__DIR` vers le dossier généré :
   ```bash
   export WP_PHPUNIT__DIR="$(pwd)/.wordpress-tests/wordpress-tests-lib"
   ```
4. Lancez la suite :
   ```bash
   phpunit -c phpunit.xml.dist
   ```

Vous pouvez ajouter des personnalisations locales sans les committer via `tests/phpunit/wp-tests-config-extra.php`, automatiquement inclus si présent.

## Licence et support
Distribué sous licence [GPL 2.0 ou ultérieure](https://www.gnu.org/licenses/gpl-2.0.html).
Pour toute question ou suggestion, ouvrez une issue sur ce dépôt ou contactez l’auteur.

## Notes
Merci de mettre à jour ce fichier README à chaque ajout de fonctionnalité ou modification majeure du plugin.
