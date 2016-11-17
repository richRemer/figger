const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Return transform to generate 'error' tokens from any string data.
 * @returns {Transform}
 */
function errors() {
    return transform(function(chunk, done) {
        if (typeof chunk === "string") {
            this.push(token("error", chunk));
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = errors; 
