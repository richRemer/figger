const transform = require("../stream/transform");
const token = require("../parse/token");

const ref_pattern = /\${([-._:$!]*[@a-z0-9][-._@a-z0-9:$!]*)}/ig;

/**
 * Return transform to generate 'ref' tokens from quoted values in input stream.
 * @returns {Transform}
 */
function refs() {
    var match, index, offset;

    return transform(function(chunk, done) {
        if (typeof chunk === "string") {
            offset = 0;

            while (match = ref_pattern.exec(chunk)) {
                index = match.index;
                if (index > offset) this.push(chunk.slice(offset, index));
                this.push(token("ref", match[0]));
                offset = match.index + match[0].length;
            }

            if (chunk.length > offset) this.push(chunk.slice(offset));
        } else {
            this.push(chunk);
        }

        done();
    });
}

module.exports = refs;
