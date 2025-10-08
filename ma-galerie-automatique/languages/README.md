# Traductions du plugin

Déposez ici les fichiers de traduction (`.po`, `.mo`, `.json`) générés pour le domaine `lightbox-jlg`.

## Mettre à jour le catalogue compilé

1. Mettez à jour ou créez `lightbox-jlg-fr_FR.po` avec vos traductions.
2. Compilez le fichier binaire :
   ```bash
   msgfmt lightbox-jlg-fr_FR.po -o lightbox-jlg-fr_FR.mo
   ```
3. Encodez-le en Base64 afin de pouvoir le versionner en texte dans Git :
   ```bash
   base64 lightbox-jlg-fr_FR.mo > lightbox-jlg-fr_FR.mo.b64
   ```
4. Supprimez le fichier `.mo` compilé (non versionné) et validez le nouveau fichier `.b64`.

## Fallback Base64 utilisé par le plugin

- `Translation\Manager::load_textdomain()` tente d’abord de charger les traductions depuis le dossier `languages/`. S’il est absent, le service décode `lightbox-jlg-fr_FR.mo.b64`, met en cache le `.mo` dans `wp-content/uploads/mga-translations/` puis l’injecte dans WordPress pour maintenir la localisation minimale.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】
- Le fichier encodé doit donc rester synchronisé avec le catalogue `.po` ; tout oubli entraînera un texte obsolète dans ce fallback.

### Contrôle qualité recommandé

1. Après compilation, exécutez `msgattrib --no-obsolete lightbox-jlg-fr_FR.po` pour supprimer les entrées obsolètes avant l’encodage.
2. Vérifiez que le fichier `.b64` est chargé en staging en renommant temporairement le dossier `languages/` : WordPress doit toujours afficher la traduction française grâce au cache `wp-content/uploads/mga-translations/`.【F:ma-galerie-automatique/includes/Translation/Manager.php†L9-L108】
3. Ajoutez la génération du fichier `.b64` à votre pipeline CI/CD afin d’éviter les écarts entre les traductions et le code livré.
