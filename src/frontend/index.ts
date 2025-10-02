import initGalleryViewer from './viewer';
export * from './viewer';

const globalObject: typeof window | undefined = typeof window !== 'undefined' ? window : undefined;

if ( globalObject && globalObject.document ) {
    const bootstrap = () => initGalleryViewer();

    if ( globalObject.document.readyState === 'loading' ) {
        globalObject.document.addEventListener( 'DOMContentLoaded', bootstrap );
    } else {
        bootstrap();
    }
}

export default initGalleryViewer;
