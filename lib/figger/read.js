const fs = require("fs");
const resolve = require("path").resolve;
const append = require("add-stream").obj;
const includes = require("./includes");
const tokenize = require("./tokenize");
const instruction = require("../parse/instruction");
const readable = require("../stream/readable");

/**
 * Read file, process includes, and return a single stream of tokens.
 * @param {string} file
 * @returns {Readable}
 */
function read(file) {
    var bof = instruction("bof", resolve(process.cwd(), file)),
        eof = instruction("eof", resolve(process.cwd(), file)),
        contents = fs.createReadStream(file, {encoding: "utf8"})
            .pipe(tokenize());

    return readable([])
        .pipe(append(readable([bof])))
        .pipe(append(contents))
        .pipe(append(readable([eof])))
        .pipe(includes());
}

module.exports = read;
