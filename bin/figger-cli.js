#!/usr/bin/env node

var figger = require(".."),
    args = process.argv.slice(2),
    envify;

envify = Boolean(~args.indexOf("--envify"));
args = args.filter(arg => arg !== "--envify");

if (args.length !== 1) {
    console.error("Usage: figger [--envify] <file>");
    process.exit(1);
}

figger(envify ? figger.envify : figger.dump, args[0])
    .on("data", data => console.log(data))
    .on("error", err => {
        console.error(process.env.debug ? err.stack : err.message);
    });

