const transform = require("../stream/transform");
const token = require("../parse/token");

const assign_pattern = /^([-._:$!]*[@a-z0-9][-._@a-z0-9:$!]*)(\s*)=(\s*)/i;

/**
 * Return transform to generate 'ident' and 'assign' tokens from incoming string
 * data.
 * @returns {Transform}
 */
function assignments() {
    return transform(function(chunk, done) {
        var match, len;

        if (typeof chunk === "string") {
            match = assign_pattern.exec(chunk);
            if (match) {
                len = match[0].length;
                this.push(token("ident", match[1]));
                if (match[2]) this.push(token("ws", match[2]));
                this.push(token("assign", "="));
                if (match[3]) this.push(token("ws", match[3]));
                if (len < chunk.length) this.push(chunk.substr(len));
            } else {
                this.push(chunk);
            }
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = assignments;
