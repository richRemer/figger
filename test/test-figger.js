var expect = require("expect.js"),
    mockfs = require("mock-fs"),
    concat = require("concat-stream"),
    figger = require("..");

describe("figger(string)", () => {
    var config;

    before(() => {
        mockfs({
            "primary.conf": [
                "simple=value",
                "spaced=value with spaces",
                "sloppy         =    surrounding spaces  ",
                "   indented    = indented",
                "CAPSok         = capitals allowed",
                "underscore_ok  = underscores allowed",
                "hyphen-ok      = hyphens allowed",
                "dot.ok         = dots allowed",
                "at@ok          = @'s allowed",
                "digit0ok       = digits allowed",
                "internal       = internal  spacing  preserved",
                "interpolated   = interpolated ${simple} ${simple}",
                "number         = 13",
                "initial        = ${number}",
                "number         = 42",
                "overwrite      = ${number}",
                "commented      = commented line    # with comment",
                "quoted         = \"quoted value\"",
                "single_quoted  = 'quoted value'",
                "left_quote     = \"left quote",
                "right_quote    = right quote\"",
                "quoted_escape  = \"escape \\\\ \\n in quotes\"",
                "no_escape      = no escape \\\\ \\n outside quotes",
                "quote_comment  = \"quoted value\"  # with comment",
                "spaced name    = ignored",
                "# comment line",
                "other ignored junk",
                ". *.inc"
            ].join("\n"),
            "first.inc": "first_include  = ${number}",
            "second.inc": "second_include = ${number}"
        });

        config = figger("primary.conf");
    });

    after(() => {
        mockfs.restore();
    });

    it("should return a Promise", () => {
        expect(config).to.be.a(Promise);
    });

    it("should resolve to object", (done) => {
        config.then((config) => {
            expect(config).to.be.an("object");
            done();
        }).catch(done);
    });

    describe("=> Promise : resolved object", () => {
        var values;

        before((done) => {
            config.then(config => {
                values = config;
                done();
            }).catch(done);
        });

        it("should handle simple values", () => {
            expect(values.simple).to.be("value");
        });

        it("should handle values with spaces", () => {
            expect(values.spaced).to.be("value with spaces");
        });

        it("should handle surrounding spaces", () => {
            expect(values.sloppy).to.be("surrounding spaces");
        });

        it("should handle indented lines", () => {
            expect(values.indented).to.be("indented");
        });

        it("should handle names with capitals", () => {
            expect(values.CAPSok).to.be("capitals allowed");
        });

        it("should handle names with underscores", () => {
            expect(values.underscore_ok).to.be("underscores allowed");
        });

        it("should handle names with hyphens", () => {
            expect(values["hyphen-ok"]).to.be("hyphens allowed");
        });

        it("should handle names with dots", () => {
            expect(values["dot.ok"]).to.be("dots allowed");
        });

        it("should handle names with ats", () => {
            expect(values["at@ok"]).to.be("@'s allowed");
        });

        it("should handle names with digits", () => {
            expect(values["digit0ok"]).to.be("digits allowed");
        });

        it("should preserve internal spacing", () => {
            expect(values.internal).to.be("internal  spacing  preserved");
        });

        it("should interpolate values", () => {
            expect(values.interpolated).to.be("interpolated value value");
        });

        it("should handle overwritten values in order of appearance", () => {
            expect(values.number).to.be("42");
            expect(values.initial).to.be("13");
            expect(values.overwrite).to.be("42");
        });

        it("should handle quoted values", () => {
            expect(values.quoted).to.be("quoted value");
            expect(values.single_quoted).to.be("'quoted value'");
            expect(values.left_quote).to.be("\"left quote");
            expect(values.right_quote).to.be("right quote\"");
        });

        it("should handle escapes within quotes", () => {
            expect(values.quoted_escape).to.be("escape \\ \n in quotes");
            expect(values.no_escape).to.be("no escape \\\\ \\n outside quotes");
        });

        it("should handle comments", () => {
            expect(values.commented).to.be("commented line");
            expect(values.quote_comment).to.be("quoted value");
        });

        it("should ignore invalid lines", () => {
            expect(values["spaced name"]).to.be(undefined);
            expect(values["other"]).to.be(undefined);
            expect(values["other ignored junk"]).to.be(undefined);
        });

        it("should process includes with imported values", () => {
            expect(values.first_include).to.be("42");
            expect(values.second_include).to.be("42");
        });
    });
});

describe("figger(figger.dump, string)", () => {
    var config;

    beforeEach(() => {
        mockfs({
            "my.conf": [
                "basic          = value",
                "spaced         = value with spaces",
                "numeric        = 13.3",
                "quoted         = \"quoted\"",
                "escaped        = \"\\n\"",
                "value          = 42",
                "reference      = ${value}",
                "nested         = foo${value}"
            ].join("\n")
        });

        config = figger(figger.dump, "my.conf");
    });

    afterEach(() => {
        mockfs.restore();
    });

    it("should return a stream", () => {
        expect(config).to.be.an("object");
        expect(config.on).to.be.a("function");
    });

    describe("=> Stream : concatenated data", () => {
        var data;

        beforeEach(done => {
            config.pipe(concat(result => {
                data = result;
                done();
            }));
        });

        it("should remove extraneous space", () => {
            expect(/^basic=value$/m.test(data)).to.be(true);
            expect(/^spaced=value with spaces$/m.test(data)).to.be(true);
            expect(/^numeric=13.3$/m.test(data)).to.be(true);
        });

        it("should strip unnecessary quotes", () => {
            expect(/^quoted=quoted$/m.test(data)).to.be(true);
        });

        it("should preserve necessary quotes", () => {
            expect(/^escaped="\\n"$/m.test(data)).to.be(true);
        });

        it("should evaluate references", () => {
            expect(/^reference=42$/m.test(data)).to.be(true);
            expect(/^nested=foo42$/m.test(data)).to.be(true);
        });
    });
});

describe("figger(figger.envify, string)", () => {
    var config;

    beforeEach(() => {
        mockfs({
            "my.conf": [
                "basic          = value",
                "spaced         = value with spaces",
                "numeric        = 13.3",
                "quoted         = \"quoted\"",
                "value          = 42",
                "reference      = ${value}",
                "nested         = foo${value}",
                "quoteval       = \"${value}\"",
            ].join("\n")
        });

        config = figger(figger.envify, "my.conf");
    });

    afterEach(() => {
        mockfs.restore();
    });

    it("should return a stream", () => {
        expect(config).to.be.an("object");
        expect(config.on).to.be.a("function");
    });

    describe("=> Stream : concatenated data", () => {
        var data;

        beforeEach(done => {
            config.pipe(concat(result => {
                data = result;
                done();
            }));
        });

        it("should remove extraneous space", () => {
            expect(/^basic=value$/m.test(data)).to.be(true);
            expect(/^numeric=13.3$/m.test(data)).to.be(true);
        });

        it("should preserve existing quotes", () => {
            expect(/^quoted="quoted"$/m.test(data)).to.be(true);
        });

        it("should add quotes as necessary", () => {
            expect(/^spaced="value with spaces"$/m.test(data)).to.be(true);
        });

        it("should evaluate references", () => {
            expect(/^reference=42$/m.test(data)).to.be(true);
            expect(/^nested=foo42$/m.test(data)).to.be(true);
            expect(/^quoteval="42"$/m.test(data)).to.be(true);
        });
    });
});

describe("figger.quoted(raw)", () => {
    it("should add surrounding quotes", () => {
        expect(figger.quoted("foo")).to.be("\"foo\"");
    });

    it("should escape backslashes", () => {
        expect(figger.quoted("before\\after")).to.be("\"before\\\\after\"");
    });

    it("should preserve quotes", () => {
        expect(figger.quoted("42\" long")).to.be("\"42\" long\"");
    });

    it("should preserve quoted value", () => {
        expect(figger.quoted("\"1\\n2\"")).to.be("\"1\\n2\"");
    });
});

describe("figger.value(val)", () => {
    it("should strip surrounding quotes from quoted values", () => {
        expect(figger.value("\"foo\"")).to.be("foo");
    });

    it("should preserve other quotes", () => {
        expect(figger.value("42\" long")).to.be("42\" long");
        expect(figger.value("\"42\" long\"")).to.be("42\" long");
    });

    it("should preserve backslashes in raw values", () => {
        expect(figger.value("before\\after")).to.be("before\\after");
        expect(figger.value("1\\n2")).to.be("1\\n2");
    });

    it("should evaluate escapes in quoted values", () => {
        expect(figger.value("\"before\\\\after\"")).to.be("before\\after");
        expect(figger.value("\"1\\n2\"")).to.be("1\n2");
    });
});

describe("figger.escape(val)", () => {
    it("should preserve simple value", () => {
        expect(figger.escape("foo")).to.be("foo");
    });

    it("should quote value with surrounding space", () => {
        expect(figger.escape(" foo")).to.be("\" foo\"");
        expect(figger.escape("foo ")).to.be("\"foo \"");
    });

    it("should preserve backslash in simple cases", () => {
        expect(figger.escape("before\\after")).to.be("before\\after");
    });

    it("should escape backslash if quoting value", () => {
        expect(figger.escape(" \\foo")).to.be("\" \\\\foo\"");
    });

    it("should preserve half-quoted value", () => {
        expect(figger.escape("42\"")).to.be("42\"");
    });

    it("should preserve spaced value", () => {
        expect(figger.escape("foo bar")).to.be("foo bar");
    });

    it("should double quote quoted value", () => {
        expect(figger.escape("\"foo\"")).to.be("\"\"foo\"\"");
    });

    it("should quote and escape value with newline", () => {
        expect(figger.escape("1\n2")).to.be("\"1\\n2\"");
    });
});

describe("figger.env(raw)", () => {
    it("should preserve simple value", () => {
        expect(figger.env("")).to.be("");
        expect(figger.env("foo")).to.be("foo");
    });

    it("should strip surrounding space", () => {
        expect(figger.env(" foo")).to.be("foo");
        expect(figger.env("foo ")).to.be("foo");
    });

    it("should preserve surrounding quotes", () => {
        expect(figger.env("\"foo\"")).to.be("\"foo\"");
    });

    it("should quote value with space or single quote", () => {
        expect(figger.env("foo bar")).to.be("\"foo bar\"");
        expect(figger.env("it's time")).to.be("\"it's time\"");
    });

    it("should quote and escape internal quote", () => {
        expect(figger.env("42\" long")).to.be("\"42\\\" long\"");
        expect(figger.env("\"42\" long\"")).to.be("\"42\\\" long\"");
    });

    it("should quote and escape backslash", () => {
        expect(figger.env("before\\after")).to.be("\"before\\\\after\"");
    });

    it("should treat newline as space", () => {
        expect(figger.env("1\n2")).to.be("\"1 2\"");
        expect(figger.env("\"1\n2\"")).to.be("\"1 2\"");
    });
});
