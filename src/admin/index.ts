import focusUtils from '../utils/focus';
import { createI18nHelpers } from '../common/i18n';

type Formatter = ( value: string ) => string;

type GlobalWindow = typeof window & {
    mgaAdminInit?: () => void;
};

const globalObject: GlobalWindow | undefined = typeof window !== 'undefined' ? window : undefined;
const { __: translate, sprintf } = createI18nHelpers( globalObject );

function activateTab( tab: HTMLAnchorElement, navTabs: HTMLAnchorElement[], tabContents: HTMLElement[], focusTab = true ): void {
    navTabs.forEach( ( item ) => {
        item.classList.remove( 'nav-tab-active' );
        item.setAttribute( 'aria-selected', 'false' );
        item.setAttribute( 'tabindex', '-1' );
    } );

    tabContents.forEach( ( panel ) => {
        panel.classList.remove( 'active' );
        panel.setAttribute( 'aria-hidden', 'true' );
        panel.setAttribute( 'hidden', 'hidden' );
    } );

    tab.classList.add( 'nav-tab-active' );
    tab.setAttribute( 'aria-selected', 'true' );
    tab.setAttribute( 'tabindex', '0' );

    const targetSelector = tab.getAttribute( 'href' );
    if ( targetSelector ) {
        const targetPanel = document.querySelector<HTMLElement>( targetSelector );

        if ( targetPanel ) {
            targetPanel.classList.add( 'active' );
            targetPanel.setAttribute( 'aria-hidden', 'false' );
            targetPanel.removeAttribute( 'hidden' );
        }
    }

    if ( focusTab ) {
        focusUtils.safeFocus( tab );
    }
}

function focusAdjacentTab( currentTab: HTMLAnchorElement, direction: number, navTabs: HTMLAnchorElement[], tabContents: HTMLElement[] ): void {
    const currentIndex = navTabs.indexOf( currentTab );

    if ( currentIndex === -1 ) {
        return;
    }

    const targetIndex = ( currentIndex + direction + navTabs.length ) % navTabs.length;
    activateTab( navTabs[ targetIndex ], navTabs, tabContents );
}

function bindRangeToOutput( sliderId: string, outputId: string, displayFormatter?: Formatter, ariaFormatter?: Formatter ): void {
    const slider = document.getElementById( sliderId ) as HTMLInputElement | null;
    const output = document.getElementById( outputId ) as HTMLInputElement | HTMLElement | null;

    if ( ! slider || ! output ) {
        return;
    }

    const updateOutput = () => {
        const value = slider.value;
        const displayValue = displayFormatter ? displayFormatter( value ) : value;
        const ariaValue = ariaFormatter ? ariaFormatter( value ) : displayValue;

        if ( 'value' in output ) {
            ( output as HTMLInputElement ).value = displayValue;
        }

        output.textContent = displayValue;
        slider.setAttribute( 'aria-valuenow', value );
        slider.setAttribute( 'aria-valuetext', ariaValue );
    };

    slider.addEventListener( 'input', updateOutput );
    updateOutput();
}

function initAdminInterface(): void {
    const navTabs = Array.from( document.querySelectorAll<HTMLAnchorElement>( '.mga-admin-wrap .nav-tab' ) );
    const tabContents = Array.from( document.querySelectorAll<HTMLElement>( '.mga-admin-wrap .tab-content' ) );

    navTabs.forEach( ( tab ) => {
        tab.addEventListener( 'click', ( event ) => {
            event.preventDefault();
            activateTab( tab, navTabs, tabContents, false );
        } );

        tab.addEventListener( 'keydown', ( event ) => {
            switch ( event.key ) {
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    focusAdjacentTab( tab, 1, navTabs, tabContents );
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    focusAdjacentTab( tab, -1, navTabs, tabContents );
                    break;
                case 'Home':
                    event.preventDefault();
                    activateTab( navTabs[ 0 ], navTabs, tabContents );
                    break;
                case 'End':
                    event.preventDefault();
                    activateTab( navTabs[ navTabs.length - 1 ], navTabs, tabContents );
                    break;
                case ' ':
                case 'Enter':
                    event.preventDefault();
                    activateTab( tab, navTabs, tabContents );
                    break;
                default:
                    break;
            }
        } );
    } );

    bindRangeToOutput(
        'mga_thumb_size',
        'mga_thumb_size_value',
        ( value ) => sprintf( translate( '%spx', 'lightbox-jlg' ), value ),
        ( value ) => sprintf( translate( '%s pixels', 'lightbox-jlg' ), value )
    );

    bindRangeToOutput(
        'mga_thumb_size_mobile',
        'mga_thumb_size_mobile_value',
        ( value ) => sprintf( translate( '%spx', 'lightbox-jlg' ), value ),
        ( value ) => sprintf( translate( '%s pixels', 'lightbox-jlg' ), value )
    );

    bindRangeToOutput(
        'mga_bg_opacity',
        'mga_bg_opacity_value',
        ( value ) => value,
        ( value ) => sprintf( translate( '%s opacity', 'lightbox-jlg' ), value )
    );
}

export const mgaAdmin = {
    init: initAdminInterface,
};

if ( globalObject && globalObject.document ) {
    const bootstrap = () => initAdminInterface();

    if ( globalObject.document.readyState === 'loading' ) {
        globalObject.document.addEventListener( 'DOMContentLoaded', bootstrap );
    } else {
        bootstrap();
    }

    globalObject.mgaAdminInit = bootstrap;
}

export default mgaAdmin;
