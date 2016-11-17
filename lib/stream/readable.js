const Readable = require("stream").Readable;

/**
 * Return readable stream containing provided values.
 * @param {array} vals
 */
function readable(vals) {
    var stream = new Readable({objectMode: true}),
        values = vals.slice();

    stream._read = function() {
        while (values.length > 0) this.push(values.shift());
        this.push(null);
    };

    return stream;
}

module.exports = readable;
