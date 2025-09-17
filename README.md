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

## Fonctionnalités
- **Compteur et légendes dynamiques** : chaque image affiche automatiquement sa légende ou, à défaut, son texte alternatif avec un compteur « image actuelle / total ».
- **Lecture/Pause avec minuterie circulaire** : le bouton principal combine icônes lecture/pause et un timer SVG indiquant en temps réel le temps restant avant la prochaine diapositive (`assets/js/gallery-slideshow.js`, `assets/css/gallery-slideshow.css`).
- **Zoom réactif** : le bouton loupe active le zoom Swiper pour inspecter les détails, avec prise en charge du glisser tactile pour se déplacer dans l’image.
- **Affichage plein écran** : un bouton dédié bascule le navigateur en mode plein écran et l’icône « Fermer » ou la touche Échap permet de revenir à la page.
- **Navigation clavier et commandes rapides** : les flèches du clavier, les boutons latéraux et les interactions tactiles permettent d’avancer ou de reculer, même en mode boucle.
- **Miniatures synchronisées** : un carrousel de vignettes met en évidence la diapositive active et permet de changer d’image d’un clic ou d’un tap.

### Mode débogage
- **Activation** : cochez **Activer le mode débogage** dans les réglages du plugin (onglet **Réglages → Ma Galerie Automatique**, case issue de `includes/admin-page-template.php`).
- **Panneau d’analyse** : `assets/js/debug.js` affiche un panneau flottant listant un chronomètre temps réel, le timer d’autoplay synchronisé au cercle de progression et un journal d’événements détaillé.
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

## Licence et support
Distribué sous licence [GPL 2.0 ou ultérieure](https://www.gnu.org/licenses/gpl-2.0.html).
Pour toute question ou suggestion, ouvrez une issue sur ce dépôt ou contactez l’auteur.

## Notes
Merci de mettre à jour régulièrement ce fichier README à chaque ajout de fonctionnalité ou modification majeure du plugin.
