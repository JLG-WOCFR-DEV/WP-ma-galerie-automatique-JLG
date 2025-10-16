const DOMAIN = 'lightbox-jlg';

const defaultTranslate = (text) => text;
const defaultSprintf = (pattern, ...values) => {
    let result = pattern;
    values.forEach((value) => {
        result = result.replace(/%s/, String(value));
    });
    return result;
};

const getAutoplayActionLabel = (translate, isRunning) => {
    const t = typeof translate === 'function' ? translate : defaultTranslate;
    return isRunning
        ? t('Mettre le diaporama en pause', DOMAIN)
        : t('Lancer le diaporama', DOMAIN);
};

const createThumbAriaLabel = (translate, sprintf, image, position) => {
    const t = typeof translate === 'function' ? translate : defaultTranslate;
    const format = typeof sprintf === 'function' ? sprintf : defaultSprintf;
    const safePosition = String(position);
    const caption = image && typeof image.caption === 'string' && image.caption ? image.caption : '';

    if (caption) {
        return format(t('Afficher la diapositive %s : %s', DOMAIN), safePosition, caption);
    }

    return format(t('Afficher la diapositive %s', DOMAIN), safePosition);
};

export {
    getAutoplayActionLabel,
    createThumbAriaLabel,
};
