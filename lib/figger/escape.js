const esc_pattern = /\\[\\n]/g;

const escapes = Object.freeze({"\n": "\\n", "\\\\": "\\"});
const sequences = Object.freeze({"\\n": "\n", "\\": "\\\\"});

/**
 * Escape newlines and backslashes in a value.
 * @param {string} raw
 * @returns {string}
 */
function escape(raw) {
    return raw.replace(/(\n|\\)/, esc => escapes[esc] || "");
}

/**
 * Evaluate escape sequences in a value.
 * @param {string} escaped
 * @returns {string}
 */
function eval(escaped) {
    return escaped.replace(/\\[n\\]/, seq => sequences[seq] || "");
}

/**
 * Split string value on escape sequences.
 * @param {string} value
 * @returns {array}
 */
function split(value) {
    var offset = 0, result = [],
        match;

    while (match = esc_pattern.exec(value)) {
        if (match.index > offset) result.push(value.slice(offset, match.index));
        result.push(match[0]);
        offset = match.index + match[0].length;
    }

    if (value.length > offset) result.push(value.substr(offset));

    return result;
}

module.exports = escape;
module.exports.eval = eval;
module.exports.split = split;
