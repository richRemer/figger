/**
 * Format arbitrary value for writing configuration.
 * @param {string} value
 * @returns {string}
 */
function escape(value) {
    if (/(^\s|\s$|[\n])/.test(value) || /^".*"$/.test(value)) {
        value = value.split("\\").join("\\\\").replace("\n", "\\n");
        value = `"${value}"`;
    }

    return value;
}

module.exports = escape;
