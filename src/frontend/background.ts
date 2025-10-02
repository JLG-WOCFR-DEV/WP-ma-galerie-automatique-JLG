export function updateEchoBackground( viewer: HTMLElement | null, imageUrl: string | null | undefined ): void {
    if ( ! viewer || ! imageUrl ) {
        return;
    }

    const bgContainer = viewer.querySelector<HTMLElement>( '.mga-echo-bg' );

    if ( ! bgContainer ) {
        return;
    }

    const newImg = document.createElement( 'img' );
    newImg.className = 'mga-echo-bg__image';
    let hasLoaded = false;

    const handleLoad = () => {
        if ( hasLoaded ) {
            return;
        }
        hasLoaded = true;
        const oldImg = bgContainer.querySelector<HTMLElement>( '.mga-visible' );
        if ( oldImg ) {
            oldImg.classList.remove( 'mga-visible' );
            setTimeout( () => {
                if ( oldImg.parentElement ) {
                    oldImg.parentElement.removeChild( oldImg );
                }
            }, 400 );
        }
        bgContainer.appendChild( newImg );
        setTimeout( () => newImg.classList.add( 'mga-visible' ), 10 );
    };

    newImg.onload = handleLoad;
    newImg.src = imageUrl;

    if ( newImg.complete ) {
        setTimeout( () => handleLoad() );
    }
}

export default updateEchoBackground;
