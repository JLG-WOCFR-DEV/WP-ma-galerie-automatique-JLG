# Audit ergonomie & UX — Ma Galerie Automatique

## Aperçu général
La page d’administration se distingue positivement par une organisation en panneaux avec recherche, bascule de vue et aperçu en direct. Toutefois, certaines pratiques restent éloignées des standards d’applications professionnelles en matière d’UX, de performance, d’accessibilité et de fiabilité.

## Mises à jour réalisées
- ✅ **Mutualisation des utilitaires JS** : les fallbacks `sprintf`, la librairie d’icônes et les helpers de focus sont désormais regroupés dans des modules ES et compilés via esbuild avec minification automatique, réduisant la duplication côté admin/front.【F:scripts/build-js.mjs†L1-L24】【F:ma-galerie-automatique/assets/js/src/shared/index.js†L1-L4】【F:ma-galerie-automatique/assets/js/src/shared/icons.js†L1-L158】【F:ma-galerie-automatique/assets/js/src/shared/sprintf.js†L1-L48】
- ✅ **Assistant de configuration multi-étapes** : la page d’options embarque un wizard avec progression, résumé dynamique et enregistrement asynchrone (AJAX + messages d’état), rapprochant l’expérience des onboarding professionnels.【F:ma-galerie-automatique/includes/admin-page-template.php†L19-L166】【F:ma-galerie-automatique/assets/js/src/admin.js†L80-L459】【F:ma-galerie-automatique/includes/Admin/Settings.php†L444-L466】【F:ma-galerie-automatique/includes/Admin/Settings.php†L867-L898】

## Ergonomie & présentation des options
- ✅ **Points forts** :
  - Les étapes « Préparer », « Partager » et « Récapitulatif » s’appuient sur des rôles ARIA, un focus management robuste et des indicateurs de progression identiques aux assistants SaaS modernes.【F:ma-galerie-automatique/includes/admin-page-template.php†L22-L166】【F:ma-galerie-automatique/assets/js/src/admin.js†L80-L360】
  - La sidebar intègre une recherche instantanée, une bascule « Vue simplifiée / Vue complète » et un état vide, ce qui aide à filtrer des formulaires longs.【F:ma-galerie-automatique/includes/admin-page-template.php†L50-L120】【F:ma-galerie-automatique/assets/js/src/admin.js†L520-L690】
- ⚠️ **Axes d’amélioration** :
  - Les sections restent longues et empilées ; il manque un sommaire flottant ou un découpage en sous-écrans avec validation incrémentale, plus proche d’un « setup wizard » moderne.
  - Les descriptions sont riches mais homogènes visuellement (texte gris), ce qui fatigue la lecture. L’usage de badges, d’icônes ou de micro-illustrations pourrait hiérarchiser l’information comme le font des SaaS matures.
  - La prévisualisation n’est qu’un mock statique ; intégrer une vraie galerie contrôlée par les réglages rendrait le feedback plus crédible.

## UX / UI
- Les presets listent un bouton d’application mais aucun indicateur des champs affectés ; un diff visuel ou un badge « modifié » éviterait les surprises après application.
- Les sélecteurs complexes (par ex. liste des effets) gagneraient à afficher des exemples animés ou gifs courts, à l’instar d’outils comme Framer.
- Prévoir une sauvegarde asynchrone avec indicateurs d’état éviterait le rechargement complet de la page après `options.php`.

## Performance
- La mutualisation des icônes de partage, du fallback `sprintf` et des helpers d’accessibilité via le bundler réduit désormais la surface JavaScript côté admin/front, tout en produisant des bundles minifiés.【F:scripts/build-js.mjs†L8-L24】【F:ma-galerie-automatique/assets/js/src/shared/index.js†L1-L4】【F:ma-galerie-automatique/assets/js/src/shared/icons.js†L1-L158】【F:ma-galerie-automatique/assets/js/src/shared/sprintf.js†L1-L48】
- La galerie charge systématiquement Swiper (CSS + JS) depuis le CDN en cas d’échec local mais ne prévoit pas de stratégie de repli si le CDN est bloqué (mode hors-ligne, CSP strict).【F:ma-galerie-automatique/includes/Frontend/Assets.php†L21-L119】 Offrir un lazy-loading conditionnel, ou un packaging local signé, alignerait le comportement sur les solutions premium.
- `window.mga_settings` expose l’ensemble des réglages en clair. Une sérialisation ciblée ou une API REST réduirait la quantité de données injectées et éviterait les collisions globales.

## Accessibilité
- Les formulaires utilisent principalement `<div>` ; transformer chaque groupe en `<fieldset>` avec `<legend>` (comme déjà amorcé pour certaines sections) améliorerait la navigation par lecteurs d’écran et s’aligne sur les design systems publics.【F:ma-galerie-automatique/includes/admin-page-template.php†L244-L260】
- L’aperçu live est purement décoratif avec `aria-hidden="true"`, ce qui est correct, mais le plugin n’expose pas d’explications audio ou textuelles alternatives sur les changements d’état. Un `aria-live` dans la zone d’aperçu pourrait décrire les effets appliqués.
- Vérifier le contraste réel des couleurs définies dans `gallery-slideshow.css` (non contrôlé dynamiquement) et appliquer un validateur (WCAG AA) avant d’autoriser la sauvegarde de la couleur d’accent.

## Fiabilité
- Le cache de sources Swiper se base sur un TTL de 12 h mais n’enregistre pas d’échec réseau pour rebasculer automatiquement sur la copie locale la prochaine fois ; mémoriser l’erreur et prévoir un backoff améliorerait la robustesse.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L421-L448】
- Les paramètres de partage sont injectés côté client sans validation supplémentaire : si une intégration tierce ajoute un canal invalide via les filtres, la duplication du rendu (admin + front) peut casser les deux interfaces. Centraliser la définition (PHP -> JSON partagé) et tester côté JS éviterait ces divergences.

## Recommandations prioritaires
1. Extraire les bibliothèques partagées (`sprintf`, icônes) dans un module unique compilé avec un bundler et activer la minification.
2. Transformer la page de réglages en expérience multi-étapes avec récapitulatif et sauvegarde asynchrone.
3. Implémenter un composant d’aperçu réellement connecté aux réglages (par exemple une instance Swiper isolée) et fournir des retours accessibles (`aria-live`).
4. Renforcer la stratégie de chargement de Swiper (priorité local, CDN en secours, gestion d’échecs) et enregistrer des métriques pour diagnostiquer les erreurs.
5. Ajouter des contrôles de contraste et des validations UX (badges « modifié », diff de preset) avant publication.

Ces actions rapprocheront l’expérience globale des standards observés dans les applications professionnelles de gestion de médias.
