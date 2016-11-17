const transform = require("../stream/transform");
const token = require("../parse/token");

const comment_pattern = /^(.*?)(^|\s+)(#.*)$/;

/**
 * Return transform to generate 'comment' tokens from input string data.
 * @returns {Transform}
 */
function comments() {
    var inquote = false;

    return transform(function(chunk, done) {
        var match;

        if (chunk.type === token.quote) {
            inquote = !inquote;
            this.push(chunk);
        } else if (typeof chunk === "string" && !inquote) {
            if (match = comment_pattern.exec(chunk)) {
                if (match[1]) this.push(match[1]);
                if (match[2]) this.push(token("ws", match[2]));
                this.push(token("comment", match[3]));
            } else {
                this.push(chunk);
            }
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = comments; 
