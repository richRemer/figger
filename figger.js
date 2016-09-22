const setline = /^\s*([-@a-z0-9._]+)\s*=\s*(("?)(.*?)\3)(\s+#.*)?\s*$/i;
const dotinc = /^\s*\.\s+(.*)\s*$/;
const reference = /\${([a-z0-9._-]+)}/ig;

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

function dump() {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var value = escape(chunk.value);
        this.push(`${chunk.name}=${value}\n`);
        done();
    };

    return transform;
}

function envify() {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        var value = env(chunk.interpolated);
        this.push(`${chunk.name}=${value}\n`);
        done();
    };

    return transform;
}

function evaluate(values) {
    var transform = new Transform({objectMode: true});

    transform._transform = function(chunk, enc, done) {
        chunk.value = chunk.value.replace(reference, (m, name) => {
            return name in values ? values[name] : m;
        });

        chunk.interpolated = chunk.raw.replace(reference, (m, name) => {
            return name in values ? values[name] : m;
        });

        values[chunk.name] = chunk.value;
        this.push(chunk);
        done();
    };

    return transform;
}

function tokenize() {
    var transform = new Transform({objectMode: true}),
        line = 0;

    transform._transform = function(chunk, enc, done) {
        var match = setline.exec(chunk);

        if (match) this.push({
            line: ++line,
            text: chunk,
            name: match[1],
            value: value(match[2]),
            raw: match[2]
        });

        done();
        return;
    };

    return transform;
}

/**
 * Load configuration file.
 * @param {Symbol} [output=figger.resolve]
 * @param {string} path
 * @param {object} [values]
 * @returns {Promise|Readable}
 */
function figger(output, path, values) {
    var tokens, evaluated;

    if (typeof output !== "symbol") {
        values = path;
        path = output;
        output = figger.resolve;
    }

    tokens = read(path).pipe(tokenize());
    if (output === figger.tokenize) return tokens;

    values = values || {};
    evaluated = tokens.pipe(evaluate(values));
    if (output === figger.evaluate) return evaluated;

    if (output === figger.dump) return evaluated.pipe(dump());
    if (output === figger.envify) return evaluated.pipe(envify());

    return new Promise((resolve, reject) => {
        evaluated
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

module.exports.tokenize = Symbol("tokenize");
module.exports.evaluate = Symbol("evaluate");
module.exports.dump = Symbol("dump");
module.exports.envify = Symbol("envify");
module.exports.resolve = Symbol("resolve");

