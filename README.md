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

## Exemples d’utilisation
Après l’activation :
1. Éditez une page ou un article.
2. Insérez des images et liez chacune d’elles à son fichier média.
3. En visite, cliquer sur une image ouvre automatiquement le diaporama.

```html
<a href="image-large.jpg"><img src="image-large.jpg" alt="Exemple" /></a>
```

## Licence et support
Distribué sous licence [GPL 2.0 ou ultérieure](https://www.gnu.org/licenses/gpl-2.0.html).  
Pour toute question ou suggestion, ouvrez une issue sur ce dépôt ou contactez l’auteur.

## Notes
Merci de mettre à jour régulièrement ce fichier README à chaque ajout de fonctionnalité ou modification majeure du plugin.
