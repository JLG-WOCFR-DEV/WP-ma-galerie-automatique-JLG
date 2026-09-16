=== Lightbox - JLG ===
Contributors: jlg
Tags: lightbox, gallery, slideshow, images, gutenberg
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.8.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Transforme les images d’une page en visionneuse plein écran, avec diaporama, zoom et légendes.

== Description ==

Lightbox - JLG récupère par défaut toutes les images de la page et les ouvre dans une visionneuse immersive :

* Navigation gauche / droite, clavier, souris et tactile
* Diaporama avec minuterie
* Zoom et plein écran
* Légendes dans le chrome haut, miniatures en bas

Les réglages se trouvent sous **Réglages → Lightbox - JLG**. Un assistant s’affiche une seule fois, puis le formulaire WordPress habituel.

== Installation ==

1. Copier le dossier `ma-galerie-automatique` dans `wp-content/plugins`.
2. Depuis ce dossier, exécuter `composer install --no-dev`.
3. Activer **Lightbox - JLG**.
4. Configurer l’extension via **Réglages → Lightbox - JLG**.

== Changelog ==

= 1.8.4 =
* Thème sombre limité à l’aperçu de la visionneuse (plus de fuite sur le `.wrap` wp-admin).
* Plus de restyle des classes natives `.button-link` / `.nav-tab`.
* Plus de chrome wizard JS (`is-complete`) une fois `mga_wizard_completed` persisté.

= 1.8.3 =
* La notice « SDK Google indisponible » n’apparaît plus que sur Réglages → Lightbox - JLG (plus de fuite sur les autres écrans wp-admin).

= 1.8.2 =
* Assistant affiché une seule fois (dismiss persisté), puis formulaire de réglages wp-admin sans chrome wizard.
* Plus de restyle des boutons natifs `.button` / `.button-primary`.
* Headers : Requires at least 6.0, Requires PHP 7.4, Tested up to 7.1.

= 1.8.1 =
* Hook d’enqueue admin, CSS de preview dans l’iframe éditeur WP 7.1, clavier / légendes lightbox.
