const combine = require("stream-combiner");
const buffered = require("./buffered");
const normalize = require("./normalize");
const transform = require("../stream/transform");
const token = require("../parse/token");
const instruction = require("../parse/instruction");
const keys = Object.keys;

/**
 * Return transform stream to turn 'dot', 'glob', and 'error' tokens and 'bof'
 * and 'eof' instructions into corresponding 'comment' tokens, and to also
 * replace overwritten assignments with 'comment' tokens.
 * @returns {Transform}
 */
function clean() {
    return combine([normalize(), buffered(), dedupe(), transform(function(chunk, done) {
        var text;

        if (chunk instanceof Array) {
            if (chunk.some(t => t.type === token.error)) {
                text = chunk.slice(0,-1).join("");
                this.push(token("comment", `# err: ${text}`));
                this.push(token("eol", "\n"));
            } else if (chunk.some(t => t.type === token.dot)) {
                text = String(chunk.filter(t => t.type === token.glob)[0]);
                this.push(token("comment", `# inc: ${text}`));
                this.push(token("eol", "\n"));
            } else {
                chunk.forEach(tok => this.push(tok));
            }
        } else if (chunk.op === instruction.bof) {
            this.push(token("comment", `# bof: ${chunk.data}`));
            this.push(token("eol", "\n"));
        } else if (chunk.op === instruction.eof) {
            this.push(token("comment", `# eof: ${chunk.data}`));
            this.push(token("eol", "\n"));
        }

        done();
    })]).on("error", err => {
        console.error(err.stack);
    });
}

/**
 * Return transform stream to replace overwitten assignments with coments.
 * @returns {Transform}
 */
function dedupe() {
    const idents = {};
    const buffer = [];

    return transform(function(chunk, done) {
        var ident;

        if (chunk instanceof Array) {
            ident = chunk.filter(t => t.type === token.ident)[0];
        }

        if (ident) {
            ident = String(ident);
            idents[ident] = idents[ident] || [];
            idents[ident].push(buffer.length);
        }

        buffer.push(chunk);
        done();
    }, function() {
        var comments;

        comments = keys(idents)
            .map(key => idents[key])
            .filter(ident => ident.length > 1)
            .map(ident => ident.slice(0,-1))
            .reduce((a,b) => a.concat(b), []);

        comments = new Set(comments);

        buffer.forEach((chunk, i) => {
            var text;

            if (comments.has(i)) {
                text = chunk.slice(0,-1).join("");
                chunk = [token("comment", `# dup: ${text}`), token("eol", "\n")];
                this.push(chunk);
            } else {
                this.push(chunk);
            }
        });
    });
}

module.exports = clean;
