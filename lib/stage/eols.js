const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Return transform to generate 'eol' tokens from incoming string data.
 * @returns {Transform}
 */
function lines() {
    var buffer = "",
        lines;

    return transform(function(chunk, done) {
        if (typeof chunk === "string") {
            buffer += chunk;
            lines = buffer.split("\n");

            lines.slice(0,-1).map(line => {
                if (line) this.push(line);
                this.push(token("eol", "\n"));
            });

            buffer = lines[lines.length-1];
        } else {
            if (buffer) this.push(buffer);
            this.push(chunk);
            buffer = "";
        }

        done();
    }, function(done) {
        if (buffer) {
            this.push(buffer);
            this.push(token("eol", ""));
        }
        done();
    });
}

module.exports = lines;
