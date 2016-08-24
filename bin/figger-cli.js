var figger = require(".."),
    files = process.argv.slice(2),
    file,
    result;

if (!files.length) {
    console.error("Usage: figger <file> [<file> ...]");
    process.exit(1);
}

result = figger(files.shift());
files.forEach(file => {
    result = result.then(conf => figger(file, conf));
});

result.then(conf => {
    for (var k in conf) {
        console.log(envify(k, conf[k]));
    }
});

function envify(k, v) {
    v = v
        .split("\\").join("\\\\")
        .split("\n").join("\\n")
        .split("\"").join("\\\"");

    return `${k}="${v}"`;
}
