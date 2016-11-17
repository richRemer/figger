const read = require("./figger/read");
const evaluate = require("./figger/evaluate");

/**
 * Read configuration file.
 * @param {string} file
 * @param {object} [conf]
 */
function figger(file, conf) {
    conf = conf || {};

    return new Promise((resolve, reject) => {
        read(file).pipe(evaluate(conf))
            .on("end", () => resolve(conf))
            .on("error", reject)
            .resume();
    });
}

module.exports = figger;
