const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Create transform to buffer input tokens by line.
 * @returns {Transform}
 */
function buffered() {
    var buffer = [];

    return transform(function(chunk, done) {
        if (chunk.op) {
            if (buffer.length) {
                this.push(buffer);
                buffer = [];
            }
            this.push(chunk);
        } else if (chunk.type === token.eol) {
            buffer.push(chunk);
            this.push(buffer);
            buffer = [];
        } else {
            buffer.push(chunk);
        }

        done();
    }, function(done) {
        if (buffer.length) {
            buffer.push(token("eol", ""));
            this.push(buffer);
        }

        done();
    });
}

module.exports = buffered;
