const glob = require("glob");
const resolve = require("path").resolve;
const dirname = require("path").dirname;
const append = require("add-stream").obj;
const transform = require("../stream/transform");
const token = require("../parse/token");
const instruction = require("../parse/instruction");

/**
 * Return a transform to inject includes into a figger token stream.
 * @returns {Transform}
 */
function includes() {
    // this is here to avoid circular reference
    const read = require("./read");

    var globbing = false,
        path, paths = [];

    return transform(function(chunk, done) {
        this.push(chunk);

        if (chunk.op === instruction.bof) {
            paths.push(path);
            path = path ? resolve(path, chunk.data) : chunk.data;
            done();
        } else if (chunk.op === instruction.eof) {
            path = paths.pop();
            done();
        } else if (chunk.type === token.glob) {
            globbing = chunk.value;
            done();
        } else if (globbing && chunk.type === token.eol && path) {
            glob(resolve(dirname(path), globbing), (err, files) => {
                if (err) return done(err);
                if (!files.length) return done();
                files.map(read).reduce((a, b) => a.pipe(append(b)))
                    .on("data", data => this.push(data))
                    .on("end", done)
                    .on("error", done);
            });
        } else if (globbing && chunk.type === token.eol) {
            done(new Error("include has no context"));
        } else {
            done();
        }
    });
}

module.exports = includes;
