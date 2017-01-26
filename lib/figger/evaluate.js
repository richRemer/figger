const combine = require("stream-combiner");
const escape = require("./escape");
const buffered = require("./buffered");
const transform = require("../stream/transform");
const token = require("../parse/token");

/**
 * Return a transform to evaluate token stream and write configuration to an
 * object.
 * @param {object} config
 * @returns {Transform}
 */
function evaluate(config) {
    config = config || {};

    var ident = "", i;

    return combine([buffered(), transform(function(chunk, done) {
        var unassigned = false;

        if (chunk instanceof Array) {
            chunk = chunk.map(tok => evaluateRef(config, tok)).map(evaluateEsc);
            chunk = merged(chunk);

            for (i = 0; i < chunk.length; i++) {
                // TODO: harden this against abnormal input
                switch (chunk[i].type) {
                    case token.ident:
                        ident = String(chunk[i]);
                        break;
                    case token.assign:
                        unassigned = true;
                        break;
                    case token.rawval:
                        if (unassigned) {
                            config[ident] = String(chunk[i]);
                            unassigned = false;
                        }
                        break;
                }
            }

            if (unassigned) config[ident] = "";

            chunk = escapes(chunk);
            chunk.forEach(tok => this.push(tok));
        } else {
            this.push(chunk);
        }

        done();
    })]);
}

/**
 * Merge 'rawval' tokens.
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
function merged(tokens) {
    return tokens.reduce((toks, tok) => {
        var merged;

        if (toks.length
            && toks[toks.length-1].type === token.rawval
            && tok.type === token.rawval) {

            merged = String(toks[toks.length-1]);
            merged += String(tok);
            return toks.slice(0,-1).concat(token("rawval", merged));
        } else {
            return toks.concat(tok);
        }
    }, []);
}

/**
 * Escape newlines and backslashes in 'rawval' tokens and add 'quote' tokens if
 * needed.
 * @param {Token[]} line
 * @returns {Token[]}
 */
function escapes(line) {
    var prev, curr, tokens,
        results = [];

    function isquoted() {
        return Boolean(prev && prev.type === token.quote);
    }

    for (var i = 0; i < line.length; i++) {
        curr = line[i];

        if (curr.type === token.rawval) {
            tokens = escape.split(String(curr))
                // re-tokenize as 'esc' and 'rawval' tokens
                .map(val => ~["\\n", "\\\\"].indexOf(val)
                    ? token("esc", val)
                    : token("rawval", val));

            if (tokens.some(t => t.type === token.esc) && !isquoted()) {
                results.push(token("quote", '"'));
            }

            results = results.concat(tokens);

            if (tokens.some(t => t.type === token.esc) && !isquoted()) {
                results.push(token("quote", '"'));
            }
        } else {
            results.push(curr);
        }

        prev = curr;
    }

    return results;
}

/**
 * Map 'ref' tokens to corresponding 'rawval' tokens.
 * @param {object} config
 * @param {Token} tok
 * @returns {Token}
 */
function evaluateRef(config, tok) {
    config = config || {};

    var ident;

    if (tok.type === token.ref) {
        ident = String(tok).slice(2,-1);
        return token("rawval", ident in config ? config[ident] : "");
    } else {
        return tok;
    }
}

/**
 * Map 'esc' tokens to corresponding 'rawval' tokens.
 * @param {Token} tok
 * @returns {Token}
 */
function evaluateEsc(tok) {
    var type = tok.type,
        value = String(tok);

    if (type === token.esc && value === "\\n") return token("rawval", "\n");
    else if (type === token.esc && value === "\\\\") return token("rawval", "\\");
    else if (type === token.esc) return token("rawval", "");
    else return tok;
}

module.exports = evaluate;
