/**
 * Evaluate raw value and return quoted value.  If value is already quoted,
 * return it as is.
 * @param {string} raw
 * @returns {string}
 */
function quoted(raw) {
    return /^".*"$/.test(raw)
        ? raw
        : "\"" + raw.split("\\").join("\\\\") + "\"";
}

module.exports = quoted;
