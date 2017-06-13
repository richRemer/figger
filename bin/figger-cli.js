#!/usr/bin/env node

const figger = require("..");
const token = figger.token;

var args = process.argv.slice(2),
    envify = Boolean(~args.indexOf("--envify"));

args = args.filter(arg => arg !== "--envify");

if (args.length !== 1) {
    console.error("Usage: figger [--envify] <file>");
    process.exit(1);
}

figger.read(args[0])
    .pipe(figger.evaluate()).on("error", error)
    .pipe(figger.clean()).on("error", error)
    .pipe(envify ? env() : str()).on("error", error)
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

function env() {
    var prev,
        inquote = false;

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
                this.push(String(chunk));
                inquote = !inquote;
                break;
            case token.rawval:
                if (needquote(chunk.value) && !inquote) this.push('"');
                this.push(chunk.value.replace(/"/g, '\\"'));
                if (needquote(chunk.value) && !inquote) this.push('"');
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
