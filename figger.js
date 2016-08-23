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
        this.push(chunk);
        done();
    };

    return transform;
}

function figger(path, values) {
    return new Promise((resolve, reject) => {
        values = values || {};

        read(path)
            .pipe(interpolate(values))
            .on("end", () => {
                resolve(values);
            })
            .on("error", reject)
            .resume();
    });
}

module.exports = figger
