const assignment = /^\s*([-@a-z0-9._]+)\s*=\s*("?)(.*?)\2(\s+#.*)?\s*$/i;
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
    escape = require("./lib/escape");

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
                files.map(read).reduce((p, c) => p.pipe(append(c)))
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
        var parts = chunk.split("="),
            name = parts.shift(),
            value = parts.join("=");

        values[name] = value
            // strip quotes
            .replace(/^"(.*)"$/, "$1")

            // unescape
            .replace(/\\(.)/g, (seq, char) => {
                switch (char) {
                    case "\\": return "\\";
                    case "n": return "\n";
                    default: return char;
                }
            })

            // interpolate
            .replace(/\${([a-z0-9._-]+)}/g, (m, name) => {
                return name in values ? values[name] : m;
            });

        this.push(chunk);
        done();
    };

    return transform;
}

function parse() {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var match = assignment.exec(chunk),
            name, value, quoted;

        if (!match) return done();

        name = match[1];
        quoted = match[2];
        value = match[3];

        // if quoted, process \\ and \n escapes
        if (quoted) {
            value = value.replace(/\\(.)/g, (seq, char) => {
                switch (char) {
                    case "\\": return "\\";
                    case "n": return "\n";
                    default: return char;
                }
            });
        }

        // process escapes for <newline> \ "
        value = value       // split then join to replace all
            .split("\\").join("\\\\")
            .split("\n").join("\\n")
            .split("\"").join("\\\"");

        // generate dotenv normalized value
        this.push(`${name}="${value}"`);
        done();
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
