const bof = Symbol("<bof>");
const eof = Symbol("<eof>");

/**
 * In-stream parse instruction.
 * @param {Symbol} op
 * @param {string} data
 */
function Instruction(op, data) {
    if (!~[bof, eof].indexOf(op)) {
        throw new TypeError("op must be valid instruction");
    } else if (typeof data !== "string") {
        throw new TypeError("data must be string");
    }

    this.op = op;
    this.data = data;

    Object.freeze(this);
}

/**
 * Instruction op.
 * @readonly
 */
Instruction.prototype.op = undefined;

/**
 * Instruction op data.
 * @readonly
 */
Instruction.prototype.data = "";

/**
 * Create an instruction.
 * @param {Symbol|string} op
 * @param {string} data
 */
function instruction(op, data) {
    if (typeof op === "string" && typeof instruction[op] === "symbol") {
        op = instruction[op];
    }

    return new Instruction(op, data);
}

module.exports = instruction;
module.exports.bof = bof;
module.exports.eof = eof;
