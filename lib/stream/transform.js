var Transform = require("stream").Transform;

/**
 * Create a transform stream.
 * @param {function} transform
 * @param {function} [flush]
 * @returns {Transform}
 */
function transform(transform, flush) {
    var stream = new Transform({objectMode: true});

    stream._transform = function(chunk, enc, done) {
        return transform.call(this, chunk, done);
    };

    if (flush) {
        stream._flush = flush;
    }

    return stream;
}

module.exports = transform;
