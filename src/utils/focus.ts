let focusSupportsOptionsCache: boolean | null = null;

declare global {
    interface Window {
        mgaFocusUtils?: {
            detectFocusOptionsSupport?: () => boolean;
            safeFocus?: ( element: HTMLElement, options?: FocusOptions ) => void;
        };
    }
}

export function detectFocusOptionsSupport(): boolean {
    if ( focusSupportsOptionsCache !== null ) {
        return focusSupportsOptionsCache;
    }

    focusSupportsOptionsCache = false;

    const globalObject: typeof window | typeof globalThis | undefined = typeof window !== 'undefined' ? window : undefined;
    const doc = globalObject?.document;

    if ( ! doc || typeof doc.createElement !== 'function' || typeof globalObject?.HTMLElement === 'undefined' ) {
        return focusSupportsOptionsCache;
    }

    const prototypeFocus = globalObject.HTMLElement.prototype?.focus;

    if ( typeof prototypeFocus !== 'function' ) {
        return focusSupportsOptionsCache;
    }

    const testElement = doc.createElement( 'button' );
    const root = doc.body || doc.documentElement;

    try {
        testElement.type = 'button';
        root?.appendChild?.( testElement );

        prototypeFocus.call( testElement, {
            get preventScroll() {
                focusSupportsOptionsCache = true;
                return true;
            },
        } as FocusOptions );
    } catch ( error ) {
        focusSupportsOptionsCache = false;
    } finally {
        if ( testElement.parentNode && 'removeChild' in testElement.parentNode ) {
            ( testElement.parentNode as HTMLElement ).removeChild( testElement );
        }
    }

    return focusSupportsOptionsCache;
}

export function safeFocus( element: HTMLElement | null | undefined, options: FocusOptions = { preventScroll: true } ): void {
    if ( ! element || typeof element.focus !== 'function' ) {
        return;
    }

    const canUseOptions = options && detectFocusOptionsSupport();

    if ( canUseOptions ) {
        try {
            element.focus( options );
            return;
        } catch ( error ) {
            // Ignore and fall back to focusing without options.
        }
    }

    element.focus();
}

export const focusUtils = {
    detectFocusOptionsSupport,
    safeFocus,
};

const globalObject: typeof window | typeof globalThis | undefined = typeof window !== 'undefined' ? window : undefined;

if ( globalObject ) {
    if ( ! globalObject.mgaFocusUtils || typeof globalObject.mgaFocusUtils !== 'object' ) {
        globalObject.mgaFocusUtils = {};
    }

    globalObject.mgaFocusUtils.detectFocusOptionsSupport = detectFocusOptionsSupport;
    globalObject.mgaFocusUtils.safeFocus = ( element: HTMLElement, options?: FocusOptions ) => safeFocus( element, options ?? { preventScroll: true } );
}

export default focusUtils;
