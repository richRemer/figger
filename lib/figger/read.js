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
    var result, contents,
        bof = instruction("bof", resolve(process.cwd(), file)),
        eof = instruction("eof", resolve(process.cwd(), file));

    function error(err) {result.emit("error", err);}

    contents = fs.createReadStream(file, {encoding: "utf8"}).on("error", error)
        .pipe(tokenize()).on("error", error);

    result = readable([]).on("error", error)
        .pipe(append(readable([bof]))).on("error", error)
        .pipe(append(contents)).on("error", error)
        .pipe(append(readable([eof]))).on("error", error)
        .pipe(includes());

    return result;
}

module.exports = read;
