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
