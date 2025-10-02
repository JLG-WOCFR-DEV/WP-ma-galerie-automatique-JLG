import { TranslationFunction } from '../common/i18n';

export function updateAutoplayButtonState( viewer: HTMLElement | null, isRunning: boolean, translate: TranslationFunction ): void {
    if ( ! viewer ) {
        return;
    }

    const playPauseButton = viewer.querySelector<HTMLButtonElement>( '#mga-play-pause' );
    if ( ! playPauseButton ) {
        return;
    }

    playPauseButton.setAttribute( 'aria-pressed', isRunning ? 'true' : 'false' );
    playPauseButton.setAttribute(
        'aria-label',
        isRunning
            ? translate( 'Mettre le diaporama en pause', 'lightbox-jlg' )
            : translate( 'Lancer le diaporama', 'lightbox-jlg' )
    );
}

export default updateAutoplayButtonState;
