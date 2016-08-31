/**
 * Format raw figger value for writing dotenv file.
 * @param {string} raw
 * @returns {string}
 */
function env(raw) {
    var value, m;

    value = raw
        .replace("\n", " ")
        .replace(/^\s+/, "")
        .replace(/\s+$/, "");

    if (m = /^"(.*)"$/.exec(value)) {
        value = "\"" + m[1].replace("\"", "\\\"") + "\"";
    } else if (/[\\ "]/.test(value)) {
        value = value
            .split("\\").join("\\\\")
            .split("\"").join("\\\"");
        value = `"${value}"`;
    }

    return value;
}

module.exports = env;
