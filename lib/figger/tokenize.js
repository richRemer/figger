const combine = require("stream-combiner");
const assignments = require("../stage/assignments");
const comments = require("../stage/comments");
const dotincs = require("../stage/dotincs");
const eols = require("../stage/eols");
const errors = require("../stage/errors");
const quotvals = require("../stage/quotvals");
const rawvals = require("../stage/rawvals");
const refs = require("../stage/refs");
const trim = require("../stage/trim");

/**
 * Return transform to tokenize incoming string data.
 * @returns {Transform}
 */
function tokenize() {
    return combine([
        eols(),
        trim(),
        dotincs(),
        assignments(),
        quotvals(),
        comments(),
        refs(),
        rawvals(),
        errors()
    ]);
}

module.exports = tokenize;
