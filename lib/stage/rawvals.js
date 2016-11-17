const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Return transform to generate 'rawval' tokens from input string data.
 * @returns {Transform}
 */
function rawvals() {
    var inassign = false;

    return transform(function(chunk, done) {
        if (typeof chunk === "string" && inassign) {
            this.push(token("rawval", chunk));
        } else {
            if (chunk.type === token.assign) inassign = true;
            if (chunk.type === token.eol) inassign = false;
            this.push(chunk);
        }

        done();
    });
}

module.exports = rawvals;
