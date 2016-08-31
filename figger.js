const setline = /^\s*([-@a-z0-9._]+)\s*=\s*(("?)(.*?)\3)(\s+#.*)?\s*$/i;
const dotinc = /^\s*\.\s+(.*)\s*$/;

var fs = require("fs"),
    glob = require("glob"),
    split = require("split"),
    append = require("add-stream"),
    dirname = require("path").dirname,
    resolve = require("path").resolve,
    Transform = require("stream").Transform,
    quoted = require("./lib/quoted"),
    value = require("./lib/value"),
    escape = require("./lib/escape"),
    env = require("./lib/env");

function read(path) {
    return fs.createReadStream(path)
        .pipe(split())
        .pipe(include(dirname(path)));
}

function include(path) {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var match = dotinc.exec(chunk);

        if (match) {
            glob(resolve(path, match[1]), (err, files) => {
                if (err) return done(err);
                if (files.length === 0) return done();
                files.map(read).reduce((a, b) => a.pipe(append(b)))
                    .on("data", data => this.push(data))
                    .on("end", done)
                    .on("error", done);
            });
        } else {
            this.push(chunk);
            done();
        }
    };

    return transform;
}

function interpolate(values) {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        chunk.value = chunk.value.replace(/\${([a-z0-9._-]+)}/ig, (m, name) => {
            return name in values ? values[name] : m;
        });

        values[chunk.name] = chunk.value;
        this.push(chunk);
        done();
    };

    return transform;
}

function parse() {
    var transform = new Transform({objectMode: true}),
        line = 0;

    transform._transform = function(chunk, enc, done) {
        var match = setline.exec(chunk);

        if (match) this.push({
            line: ++line,
            text: chunk,
            name: match[1],
            value: figger.value(match[2]),
            raw: match[2]
        });

        done();
        return;
    };

    return transform;
}

function figger(path, values) {
    return new Promise((resolve, reject) => {
        values = values || {};

        read(path)
            .pipe(parse())
            .pipe(interpolate(values))
            .on("end", () => resolve(values))
            .on("error", reject)
            .resume();
    });
}

module.exports = figger;
module.exports.quoted = quoted;
module.exports.value = value;
module.exports.escape = escape;
module.exports.env = env;
