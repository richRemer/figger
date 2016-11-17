module.exports.read = require("./lib/figger/read");
module.exports.clean = require("./lib/figger/clean");
module.exports.evaluate = require("./lib/figger/evaluate");
module.exports.tokenize = require("./lib/figger/tokenize");
module.exports.escape = require("./lib/figger/escape");
module.exports.buffered = require("./lib/figger/buffered");
module.exports.token = require("./lib/parse/token");
module.exports.instruction = require("./lib/parse/instruction");

module.exports.stage = {
    assignments: require("./lib/stage/assignments"),
    comments: require("./lib/stage/comments"),
    dotincs: require("./lib/stage/dotincs"),
    eols: require("./lib/stage/eols"),
    errors: require("./lib/stage/errors"),
    quotvals: require("./lib/stage/quotvals"),
    rawvals: require("./lib/stage/rawvals"),
    refs: require("./lib/stage/refs"),
    trim: require("./lib/stage/trim"),
}

module.exports.stream = {
    transform: require("./lib/stream/transform"),
    readable: require("./lib/stream/readable")
};
