const combine = require("stream-combiner");
const buffered = require("./buffered");
const normalize = require("./normalize");
const transform = require("../stream/transform");
const token = require("../parse/token");
const instruction = require("../parse/instruction");

/**
 * Return transform stream to turn 'dot', 'glob', and 'error' tokens and 'bof'
 * and 'eof' instructions into corresponding 'comment' tokens.
 */
function clean() {
    return combine([normalize(), buffered(), transform(function(chunk, done) {
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

module.exports = clean;
