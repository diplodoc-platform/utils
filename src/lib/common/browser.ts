/**
 * Checks if the current environment is a browser.
 *
 * This function verifies whether the code is being executed in a browser environment.
 * It checks for the presence of the `window` object, which is unique to browsers.
 *
 * @returns {boolean} - Returns `true` if the current environment is a browser, otherwise `false`.
 */
export const isBrowser = () => {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};
