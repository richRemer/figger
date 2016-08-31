/**
 * Evaluate raw or quoted value and return logical value.
 * @param {string} value
 * @returns {string}
 */
function value(value) {
    var m;

    if (m = /^"(.*)"$/.exec(value)) {
        value = m[1].replace(/\\(.)/g, (_, ch) => ch === "n" ? "\n" : ch);
    }

    return value;
}

module.exports = value;
