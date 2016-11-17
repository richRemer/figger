const assign = Symbol("assignment op");
const comment = Symbol("comment");
const dot = Symbol("include op");
const eol = Symbol("end of line");
const error = Symbol("error");
const esc = Symbol("escape sequence");
const glob = Symbol("glob pattern");
const ident = Symbol("identifier");
const quote = Symbol("quote");
const rawval = Symbol("rawval");
const ref = Symbol("reference");
const ws = Symbol("whitespace");

const types = Object.freeze([
        assign, comment, dot, eol, error, esc, glob, ident, quote, rawval, ref,
        ws
    ]);

/**
 * Terminal parse token.
 * @constructor
 * @param {Symbol} type
 * @param {string} value
 */
function Token(type, value) {
    if (!~types.indexOf(type)) {
        throw new TypeError("type must be token type");
    } else if (typeof value !== "string") {
        throw new TypeError("value must be string");
    }

    this.type = type;
    this.value = value;

    Object.freeze(this);
}

/**
 * Token type.
 * @readonly
 */
Token.prototype.type = undefined;

/**
 * Token value.
 * @readonly
 */
Token.prototype.value = "";

/**
 * Return token string.
 * @returns {string}
 */
Token.prototype.toString = function() {
    return this.value;
};

/**
 * Create a token.
 * @param {Symbol|string} type
 * @param {string} value
 * @returns {Token}
 */
function token(type, value) {
    if (typeof type === "string" && typeof token[type] === "symbol") {
        type = token[type];
    }

    return new Token(type, value);
}

module.exports = token;
module.exports.assign = assign;
module.exports.comment = comment;
module.exports.dot = dot;
module.exports.eol = eol;
module.exports.error = error;
module.exports.esc = esc;
module.exports.glob = glob;
module.exports.ident = ident;
module.exports.quote = quote;
module.exports.rawval = rawval;
module.exports.ref = ref;
module.exports.ws = ws;
