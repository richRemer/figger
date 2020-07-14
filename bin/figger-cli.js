#!/usr/bin/env node

const figger = require("..");
const token = figger.token;

var args = process.argv.slice(2),
    envify = Boolean(~args.indexOf("--envify")),
    bashify = Boolean(~args.indexOf("--bashify")),
    esc = () => envify ? escape("env") : bashify ? escape("bash") : str(),

args = args.filter(arg => !["--envify", "--bashify"].includes(arg));

if (args.length !== 1) usage();
if (envify && bashify) usage();

figger.read(args[0])
    .pipe(figger.evaluate()).on("error", error)
    .pipe(figger.clean()).on("error", error)
    .pipe(esc()).on("error", error)
    .pipe(process.stdout).on("error", error);

function error(err) {
    console.error(process.env.debug ? err.stack : err.message);
    process.exit(1);
}

function str() {
    return figger.stream.transform(function(chunk, done) {
        if (chunk.type) this.push(String(chunk));
        done();
    });
}

function needquote(str) {
    return ~str.indexOf('"') || ~str.indexOf(" ");
}

function escape(style) {
    if (!["env", "bash"].includes(style)) {
        throw new Error(`invalid escape style: ${style}`);
    }

    let prev;
    let inquote = false;

    return figger.stream.transform(function(chunk, done) {
        switch (chunk.op || chunk.type) {
            case token.ws:
            case token.error:
                // throw these out
                break;
            case token.comment:
                // include leading whitespace with comment
                if (prev && prev.type === token.ws) console.log(String(prev));
                this.push(String(chunk));
                break;
            case token.quote:
                this.push(style === "bash" ? "'" : '"');
                inquote = !inquote;
                break;
            case token.rawval:
                if (style === "env") {
                    if (needquote(chunk.value) && !inquote) this.push('"');
                    this.push(chunk.value.replace(/"/g, '\\"'));
                    if (needquote(chunk.value) && !inquote) this.push('"');
                } else if (style === "bash") {
                    if (!inquote) this.push("'");
                    this.push(chunk.value.replace(/'/g, "'\"'\"'"));
                    if (!inquote) this.push("'");
                }
                break;
            case token.eol:
                this.push(String(chunk));
                inquote = false;
                break;
            default:
                if (chunk.type) this.push(String(chunk));
                break;
        }

        prev = chunk;
        done();
    });
}

function usage() {
    console.error("Usage: figger [--envify|--bashify] <file>");
    process.exit(1);
}
