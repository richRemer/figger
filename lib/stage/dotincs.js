const transform = require("../stream/transform");
const token = require("../parse/token");

const dotinc_pattern = /^\.(\s+)(\S.*)$/;

/**
 * Return transform to generate 'dot' and 'glob' tokens from appropriate input
 * string data.
 * @returns {Transform}
 */
function dotincs() {
    return transform(function(chunk, done) {
        var match;

        if (typeof chunk === "string") {
            match = dotinc_pattern.exec(chunk);
            if (match) {
                this.push(token("dot", "."));
                this.push(token("ws", match[1]));
                this.push(token("glob", match[2]));
            } else {
                this.push(chunk);
            }
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = dotincs;
