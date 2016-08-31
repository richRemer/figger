var expect = require("expect.js"),
    mockfs = require("mock-fs"),
    figger = require("..");

describe("figger(filename)", () => {
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

    describe("result", () => {
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

