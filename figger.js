const pattern = /^\s*([a-z0-9._-]+)\s*=\s*("?)(.*?)\2(\s+#.*)?\s*$/;

var fs = require("fs"),
    split = require("split"),
    dirname = require("path").dirname,
    Transform = require("stream").Transform;

function read(path) {
    return fs.createReadStream(path)
        .pipe(split())
        .pipe(include());
}

function include() {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        this.push(chunk);
        done();
    };

    return transform;
}

function interpolate(values) {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var parts = chunk.split("="),
            name = parts.shift(),
            value = parts.join("=");

        value = value
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

        values[name] = value;
        this.push(chunk);
        done();
    };

    return transform;
}

function parse() {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var match = pattern.exec(chunk),
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
        value = value
            .replace("\\", "\\\\")
            .replace("\n", "\\n")
            .replace("\"", "\\\"");

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

module.exports = figger
