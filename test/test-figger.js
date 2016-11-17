const expect = require("expect.js");
const mockfs = require("mock-fs");
const figger = require("..");
const token = figger.token;
const readable = figger.stream.readable;
const transform = figger.stream.transform;
const buffered = figger.buffered;

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

    describe("comments", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([
                "#a",
                token("quote", '"'), "#a", token("quote", '"'),
                objval
            ]);
            T = figger.stage.comments();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process 'comment' tokens", () => {
            expect(results[0].type).to.be(token.comment);
            expect(results[0].value).to.be("#a");
        });

        it("should not process comments inside quotes", () => {
            expect(results[2]).to.be("#a");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("refs", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([
                " ${a} ",
                token("quote", '"'), "${a}", token("quote", '"'),
                "${-._:$!a}",
                "${-}",
                objval
            ]);
            T = figger.stage.refs();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process 'ref' tokens outside quote", () => {
            expect(results[0]).to.be(" ");
            expect(results[1].type).to.be(token.ref);
            expect(results[1].value).to.be("${a}");
            expect(results[2]).to.be(" ");
        });

        it("should process 'ref' tokens inside quote", () => {
            expect(results[4].type).to.be(token.ref);
            expect(results[4].value).to.be("${a}");
        });

        it("should recognize secondary chars with primary", () => {
            expect(results[6].type).to.be(token.ref);
            expect(results[6].value).to.be("${-._:$!a}");
        });

        it("should not recognize isolated secondary chars", () => {
            expect(results[7]).to.be("${-}");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("rawvals", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable([
                token("assign", "="), "foo", token("eol", "\n"),
                "foo",
                objval
            ]);
            T = figger.stage.rawvals();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should process remaining 'rawval' tokens in assigns", () => {
            expect(results[1].type).to.be(token.rawval);
            expect(results[1].value).to.be("foo");
        });

        it("should not process 'rawval' tokens outside assigns", () => {
            expect(results[3]).to.be("foo");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });

    describe("errors", () => {
        var results, input, T, output,
            objval = {};

        before(done => {
            results = [];
            input = readable(["foo", objval]);
            T = figger.stage.errors();
            output = input.pipe(T);

            output.on("data", data => results.push(data));
            output.on("error", done);
            output.on("end", done);
        });

        it("should classify remaining strings as errors", () => {
            expect(results[0].type).to.be(token.error);
            expect(results[0].value).to.be("foo");
        });

        it("should pass through other values", () => {
            var objs = results.filter(v => v === objval);
            expect(objs.length).to.be(1);
        });
    });
});

describe("figger.buffered()", () => {
    it("should buffer input stream by 'eol' tokens", () => {
        var input, T, output,
            errored = false,
            results = [];

        input = readable(["a", "b", token("eol", "\n"), "c", "d"]);
        T = buffered();
        output = input.pipe(T);

        output.on("data", data => results.push(data));
        output.on("error", err => errored = err);
        output.on("end", () => {
            expect(errored).to.be(false);
            expect(results.length).to.be(2);
            expect(results[0]).to.be.an("array");
            expect(results[1]).to.be.an("array");
            expect(results[0][0]).to.be("a");
            expect(results[0][1]).to.be("b");
            expect(results[0][2].type).to.be(token.eol);
            expect(results[0][2].value).to.be("\n");
            expect(results[1][0]).to.be("c");
            expect(results[1][1]).to.be("d");
            expect(results[1][2].type).to.be(token.eol);
            expect(results[1][2].value).to.be("");
        });
    });
});

describe("figger.read(string)", () => {
    var results;

    before((done) => {
        mockfs({
            "primary.conf": [
                "primary=value",
                ". *.inc"
            ].join("\n"),
            "first.inc": "first=value",
            "second.inc": "second=value"
        });

        results = [];
        figger.read("primary.conf")
            .on("data", datum => results.push(datum))
            .on("error", done)
            .on("end", done);
    });

    after(() => {
        mockfs.restore();
    });

    it("should handle includes and produce a single stream", () => {
        var idents = results.filter(v => v.type === token.ident),
            names = idents.map(t => t.value);

        expect(names).to.contain("primary");
        expect(names).to.contain("first");
        expect(names).to.contain("second");
        expect(names.length).to.be(3);
    });
});

describe("figger.evaluate(object)", () => {
    var config, tokens;

    before((done) => {
        mockfs({
            "primary.conf": [
                "primary=42",
                ". *.inc"
            ].join("\n"),
            "included.inc": "included=${primary}"
        });

        config = {};
        tokens = [];

        figger.read("primary.conf").pipe(figger.evaluate(config))
            .on("data", datum => tokens.push(datum))
            .on("error", done)
            .on("end", done)
            .resume();
    });

    after(() => {
        mockfs.restore();
    });

    it("should load evaluated values into object", () => {
        expect(config.primary).to.be("42");
    });

    it("should evaluate references", () => {
        expect(config.included).to.be("42");
    });
});

describe("figger(string)", () => {
    var result;

    before(() => {
        mockfs({
            "primary.conf": [
                "name           = value",
                "ref            = ${name}",
                "secondary_ref  = ${ref}",
                "multiple_refs  = ${name} ${name}",
                "number         = 42",
                "changed        = 1",
                "ordered        = ${changed}",
                "changed        = 2",
                "commented      = commented line    # with comment",
                "quoted         = \"quoted value\"",
                "single_quoted  = 'quoted value'",
                "left_quote     = \"left quote",
                "right_quote    = right quote\"",
                "quoted_escape  = \"escape \\\\ \\n in quotes\"",
                "no_escape      = no escape \\\\ \\n outside quotes",
                "quote_comment  = \"quoted value\"  # with comment",
                "spaced name    = ignored",
                "other ignored junk",
                ". *.inc"
            ].join("\n"),
            "first.inc": "first_include  = ${name}",
            "second.inc": "second_include = ${name}"
        });

        result = figger("primary.conf");
    });

    it("should return Promise", () => {
        expect(result).to.be.a(Promise);
    });

    describe("=> Promise", () => {
        it("should resolve to object", (done) => {
            result.then(config => {
                expect(config).to.be.an("object");
                done();
            }).catch(done);
        });

        describe("<object> evaluation", () => {
            var config;

            before((done) => {
                result.then(conf => {
                    config = conf;
                    done();
                }).catch(done);
            });

            it("should recognize simple values", () => {
                expect(config.name).to.be("value");
            });

            it("should recognize references", () => {
                expect(config.ref).to.be("value");
                expect(config.secondary_ref).to.be("value");
                expect(config.multiple_refs).to.be("value value");
            });

            it("should handle numeric values as strings", () => {
                expect(config.number).to.be("42");
            });

            it("should allow overriding values", () => {
                expect(config.changed).to.be("2");
            });

            it("should order assignments and refs", () => {
                expect(config.ordered).to.be("1");
            });

            it("should handle assignments with trailing comments", () => {
                expect(config.commented).to.be("commented line");
            });

            it("should handle double quotes", () => {
                expect(config.quoted).to.be("quoted value");
            });

            it("should not handle single quotes", () => {
                expect(config.single_quoted).to.be("'quoted value'");
            });

            it("should ignore lopsided quotes", () => {
                expect(config.left_quote).to.be("\"left quote");
                expect(config.right_quote).to.be("right quote\"");
            });

            it("should handle escapes inside quotes", () => {
                expect(config.quoted_escape).to.be("escape \\ \n in quotes");
            });

            it("should not handle escapes outside quotes", () => {
                expect(config.no_escape).to.be("no escape \\\\ \\n outside quotes");
            });

            it("should ignore identifier names with spaces", () => {
                expect(config["spaced name"]).to.be(undefined);
            });

            it("should handle references in includes", () => {
                expect(config.first_include).to.be("value");
                expect(config.second_include).to.be("value");
            });
        });
    });
});

