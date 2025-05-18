// Utility functions can be added here if needed
// For example, more robust URL validation, file handling, etc.

/**
 * Validates if a string is a proper URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL, false otherwise
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Validates if a file is an MP3
 * @param {File} file - The file to validate
 * @returns {boolean} - True if MP3, false otherwise
 */
function isMp3File(file) {
    return file.type === 'audio/mp3' || file.name.endsWith('.mp3');
}
