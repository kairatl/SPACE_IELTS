/** Optional: blocks common Ctrl+key shortcuts (copy / view source / save) */
function initCopyProtection() {
    document.addEventListener('keydown', (e) => {
        if (
            e.ctrlKey &&
            (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 73)
        ) {
            e.preventDefault();
        }
    });
}
