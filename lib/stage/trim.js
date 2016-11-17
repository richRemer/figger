const transform = require("../stream/transform");
const token = require("../parse/token");

const trim_pattern = /^(\s*)(.*?)(\s*)$/;

/**
 * Return transform to generate leading and trailing 'ws' tokens at beginning
 * and ending of incoming string data.
 * @returns {Transform}
 */
function trim() {
    return transform(function(chunk, done) {
        var parts;

        if (typeof chunk === "string") {
            parts = trim_pattern.exec(chunk).slice(1);
            if (parts[0]) this.push(token("ws", parts[0]));
            if (parts[1]) this.push(parts[1]);
            if (parts[2]) this.push(token("ws", parts[2]));
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = trim;
