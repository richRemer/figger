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
        read(file).on("error", reject)
            .pipe(evaluate(conf)).on("error", reject)
            .on("end", () => resolve(conf))
            .resume();
    });
}

module.exports = figger;
