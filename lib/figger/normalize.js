const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Create transform to ensure all 'eol' tokens contain a newline.
 * @returns {Transform}
 */
function normalize() {
    return transform(function(chunk, done) {
        var tok;

        tok = chunk.type === token.eol && !chunk.value
            ? token("eol", "\n")
            : chunk;

        this.push(tok);
        done();
    });
}

module.exports = normalize;
