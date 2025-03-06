/**
 * Creates and triggers a download of an image file from a data URL.
 */
export function triggerDownload(filename, filetype, dataUrl) {
  const anchor = document.createElement('a'); 
  anchor.setAttribute('download', `${filename}.${filetype}`); 
  anchor.setAttribute('href', dataUrl);
  anchor.click(); 
}

/**
 * Updates the current URL hash to navigate within the single-page application.
 * @param {string} hash - The hash to navigate to (e.g., '#home', '#project').
 */
export function handleNavLinkClick(hash) {
  window.location.hash = hash; // Update the hash part of the URL
}

/**
 * Navigates to the project page with the specified state.
 * @param {function} navigate - The navigation function from React Router.
 * @param {object} state - The state to pass to the project page.
 */
export function handleProjectLink(navigate, state) {
  navigate("/project", { state: state });
}
