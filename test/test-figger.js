const expect = require("expect.js");
const figger = require("..");
const token = figger.token;
const readable = figger.stream.readable;
const transform = figger.stream.transform;

describe("streams", () => {
    describe("readable", () => {
        it("should make Readable stream out of values", done => {
            var obj = {},
                input = readable([23, "foo", false, obj]),
                errored = false,
                results = [];

            input.on("data", data => results.push(data));
            input.on("error", err => errored = err);
            input.on("end", () => {
                expect(errored).to.be(false);
                expect(results.length).to.be(4);
                expect(results[0]).to.be(23);
                expect(results[1]).to.be("foo");
                expect(results[2]).to.be(false);
                expect(results[3]).to.be(obj);
                done();
            });
        });
    });

    describe("transform", () => {
        it("should make Transform stream using function", done => {
            var input, T, output,
                errored = false,
                results = [];

            input = readable(["Input", "Data"]);
            T = transform(function(v, done) {
                this.push(v.toLowerCase());
                done();
            });
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", err => errored = err);
            output.on("end", () => {
                expect(errored).to.be(false);
                expect(results.length).to.be(2);
                expect(results[0]).to.be("input");
                expect(results[1]).to.be("data");
                done();
            });
        });
    });
});

describe("stages", () => {
    describe("eols", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable(["a line\na line\na", " line", objval]);
            T = figger.stage.eols();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should turn newlines into 'eol' tokens", () => {
            var eols = results.filter(v => v.type === token.eol);
            expect(eols.length).to.be(2);
        });

        it("should merge remaining string data", () => {
            var strings = results.filter(v => typeof v === "string");
            expect(strings.length).to.be(3);
            expect(strings.every(s => s === "a line")).to.be(true);
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("trim", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([" input data ", "adjacent ", " spaces", objval]);
            T = figger.stage.trim();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should turn outside space into 'ws' tokens", () => {
            var ws = results.filter(v => v.type === token.ws);
            expect(ws.length).to.be(4);
            expect(ws.every(t => t.value === " ")).to.be(true);
        });

        it("should pass through remaining string data", () => {
            var strings = results.filter(v => typeof v === "string");
            expect(strings.length).to.be(3);
            expect(strings[0]).to.be("input data");
            expect(strings[1]).to.be("adjacent");
            expect(strings[2]).to.be("spaces");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("dotincs", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([". foo", ".foo", ".", "string", objval]);
            T = figger.stage.dotincs();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process 'dot ws glob' token sequences", () => {
            expect(results[0].type).to.be(token.dot);
            expect(results[1].type).to.be(token.ws);
            expect(results[2].type).to.be(token.glob);
            expect(results[2].value).to.be("foo");
        });

        it("should pass through invalid dots and other string data", () => {
            var strings = results.filter(v => typeof v === "string");
            expect(strings.length).to.be(3);
            expect(strings[0]).to.be(".foo");
            expect(strings[1]).to.be(".");
            expect(strings[2]).to.be("string");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("assignments", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable(["a=1","b = 2", "c=", "-._:$!@ =", ")=", objval]);
            T = figger.stage.assignments();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process 'ident ws? assign ws?' sequences", () => {
            var idents = results.filter(v => v.type === token.ident),
                assigns = results.filter(v => v.type === token.assign);

            expect(assigns.length).to.be(4);
            expect(idents.length).to.be(4);
            expect(idents[0].value).to.be("a");
            expect(idents[1].value).to.be("b");
            expect(idents[2].value).to.be("c");
            expect(idents[3].value).to.be("-._:$!@");
        });

        it("should pass through invalid assigns and other string data", () => {
            var strings = results.filter(v => typeof v === "string");
            expect(strings.length).to.be(3);
            expect(strings[0]).to.be("1");
            expect(strings[1]).to.be("2");
            expect(strings[2]).to.be(")=");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("quotvals", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([
                token("assign", "="), '"a"', token("eol", "\n"),
                                      '"a"', token("eol", "\n"),
                token("assign", "="), '""', token("eol", "\n"),
                token("assign", "="), '"""', token("eol", "\n"),
                token("assign", "="), '"a # f"', token("eol", "\n"),
                token("assign", "="), '"a" # f', token("eol", "\n"),
                token("assign", "="), '"a"# f', objval
            ]);
            T = figger.stage.quotvals();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process 'quote ... quote' sequences after 'assign'", () => {
            expect(results[0].type).to.be(token.assign);
            expect(results[1].type).to.be(token.quote);
            expect(results[2]).to.be("a");
            expect(results[3].type).to.be(token.quote);
        });

        it("should ignore quotes without 'assign'", () => {
            expect(results[5]).to.be('"a"');
        });

        it("should recognize empty string", () => {
            expect(results[8].type).to.be(token.quote);
            expect(results[9].type).to.be(token.quote);
        });

        it("should allow internal quotes", () => {
            expect(results[12].type).to.be(token.quote);
            expect(results[13]).to.be('"');
            expect(results[14].type).to.be(token.quote);
        });

        it("should prefer full-line string to comments", () => {
            expect(results[17].type).to.be(token.quote);
            expect(results[18]).to.be("a # f");
            expect(results[19].type).to.be(token.quote);
        });

        it("should recognize string before comment", () => {
            expect(results[22].type).to.be(token.quote);
            expect(results[23]).to.be("a");
            expect(results[24].type).to.be(token.quote);
            expect(results[25].type).to.be(token.ws);
            expect(results[26]).to.be("# f");
        });

        it("should not recognize string abutted to comment", () => {
            expect(results[29]).to.be('"a"# f');
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });
});
