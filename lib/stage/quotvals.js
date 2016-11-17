const transform = require("../stream/transform");
const token = require("../parse/token");
const escape = require("../figger/escape");

const quotval_pattern = /^(".*")((\s+)(#|#.*[^"]))?$/;

/**
 * Return transform to generate 'quote' and 'esc' tokens from quoted
 * values in input stream.
 * @returns {Transform}
 */
function quotvals() {
    var match,
        quoted,
        inassign = false;

    return transform(function(chunk, done) {
        if (typeof chunk === "string" && inassign) {
            match = quotval_pattern.exec(chunk);
            if (match) {
                this.push(token("quote", '"'));

                if ((quoted = match[1].slice(1,-1))) {
                    escape.split(quoted)
                        // map escapes to 'esc' tokens
                        .map(val => ~["\\n", "\\\\"].indexOf(val)
                            ? token("esc", val)
                            : val)
                        .forEach(val => this.push(val));
                }

                this.push(token("quote", '"'));
                if (match[3]) this.push(token("ws", match[3]));
                if (match[4]) this.push(match[4]);
            } else {
                this.push(chunk);
            }
        } else {
            if (chunk.type === token.assign) inassign = true;
            if (chunk.type === token.eol) inassign = false;
            this.push(chunk);
        }

        done();
    });
}

module.exports = quotvals;
