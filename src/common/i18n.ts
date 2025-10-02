export type TranslationFunction = ( text: string, domain?: string ) => string;
export type FormatFunction = ( format: string, ...args: unknown[] ) => string;

export interface I18nHelpers {
    __: TranslationFunction;
    sprintf: FormatFunction;
}

const noopTranslate: TranslationFunction = ( text ) => text;
const noopFormat: FormatFunction = ( format, ...args ) => {
    let index = 0;
    return format.replace(/%s/g, () => {
        const replacement = typeof args[index] !== 'undefined' ? String( args[index] ) : '';
        index += 1;
        return replacement;
    });
};

export function createI18nHelpers( globalObject: typeof window | typeof globalThis | undefined ): I18nHelpers {
    if ( ! globalObject || ! globalObject.wp || ! globalObject.wp.i18n ) {
        return {
            __: noopTranslate,
            sprintf: noopFormat,
        };
    }

    const { __: translate, sprintf } = globalObject.wp.i18n;

    return {
        __: typeof translate === 'function' ? translate : noopTranslate,
        sprintf: typeof sprintf === 'function' ? sprintf : noopFormat,
    };
}
