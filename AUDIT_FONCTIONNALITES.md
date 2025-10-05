# Audit des fonctions et recommandations

## Fonctions prioritaires à améliorer

1. **`Detection::detect_post_linked_images`** – La détection repose sur une analyse récursive des blocs suivie d'une expression régulière générique sur le HTML brut. Cela reste fragile face aux attributs modernes (`data-src`, `loading="lazy"`, `<figure>` complexes) et ne tient pas compte des médias chargés dynamiquement. Les solutions professionnelles s'appuient sur des parseurs DOM tolérants, des heuristiques spécifiques par bloc et un cache différencié (par post type, par langue) pour réduire les faux positifs et accélérer les réponses.【F:ma-galerie-automatique/includes/Content/Detection.php†L142-L200】

2. **`Detection::blocks_contain_linked_media`** – L'algorithme suit les blocs réutilisables via un cache statique, mais il réalise des appels `get_post()` synchrones et ne différencie pas les blocs dynamiques (Query Loop, galeries distantes). Les produits « pro » préchargent les références via `rest_do_request`, mémorisent les IDs visités par requête et appliquent une stratégie de timeout ou de files d'attente pour éviter les cascades récursives coûteuses lorsque le contenu comporte de nombreuses références croisées.【F:ma-galerie-automatique/includes/Content/Detection.php†L247-L305】

3. **`Plugin::load_textdomain`** – Le fallback basé sur un fichier `.mo` encodé en base64 implique des lectures/écritures disque à chaque chargement et ne respecte pas les hooks `switch_locale`. Les alternatives professionnelles déplacent cette logique vers un service d’internationalisation dédié, exploitent `WP_Filesystem` pour la gestion des fichiers temporaires et mettent en cache le chargement par langue (transients ou objet-cache) pour supprimer les I/O redondants.【F:ma-galerie-automatique/includes/Plugin.php†L66-L119】

4. **`Frontend\Assets::enqueue_assets`** – Le chargement des assets injecte systématiquement Swiper et les styles associés, sans différencier les vues ni proposer de découpage conditionnel (par exemple désactiver les miniatures ou le module de partage). Les solutions pro découpent les bundles (ES modules, CSS critiques), ajoutent des préchargements (`wp_enqueue_scripts` + `wp_resource_hints`) et gèrent les dépendances via `wp_register_*` pour permettre aux thèmes de substituer facilement les ressources.【F:ma-galerie-automatique/includes/Frontend/Assets.php†L23-L177】

5. **`Plugin::register_block` / `prepare_block_settings`** – Le bloc éditeur expose uniquement un script d’aperçu mais aucun `view_script`, `render_callback` ou gestion dynamique des attributs. Les éditeurs avancés alignent les options du bloc sur les réglages front (synchronisation par REST, prévisualisation SSR) et valident les couleurs/typographies côté serveur afin d’éviter les divergences de rendu entre éditeur et front.【F:ma-galerie-automatique/includes/Plugin.php†L157-L244】

6. **`Plugin::maybe_purge_detection_cache`** – La purge invalide l’ensemble du cache dès qu’un paramètre de détection varie. Des solutions plus fines segmentent par type de contenu ou par site multilingue, et enregistrent des journaux d’invalidation pour aider au diagnostic lors d’un pic de recalcul.【F:ma-galerie-automatique/includes/Plugin.php†L246-L335】

## Tests de débogage recommandés

- **`DetectionSettingsPurgeTest::test_detection_setting_change_purges_cache`** : vérifie que la modification des types suivis supprime bien le meta `_mga_has_linked_images`. Permet de confirmer que les purges s’exécutent lors des changements critiques.【F:tests/phpunit/DetectionSettingsPurgeTest.php†L12-L40】
- **`DetectionSettingsPurgeTest::test_unrelated_setting_change_preserves_cache`** : garantit qu’un réglage hors périmètre (ex. `debug_mode`) ne vide pas inutilement le cache, ce qui aide à diagnostiquer les invalidations intempestives.【F:tests/phpunit/DetectionSettingsPurgeTest.php†L42-L67】
- **`DetectionSettingsPurgeTest::test_normalized_selector_equivalence_does_not_trigger_purge`** : assure que les variations de casse/espaces des sélecteurs ne provoquent pas de purge, utile pour isoler les divergences entre interface admin et base de données.【F:tests/phpunit/DetectionSettingsPurgeTest.php†L69-L97】

> 💡 Complétez ces tests PHP par une vérification E2E sur une page de démonstration (mode debug actif) afin de capturer les régressions de performance lors des purges massives.
