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
                "internal       = internal  spacing  preserved",
                "interpolated   = interpolated ${simple}",
                "number         = 13",
                "initial        = ${number}",
                "number         = 42",
                "overwrite      = ${number}",
                "commented      = commented line    # with comment",
                "quoted         = \"quoted value\"",
                "single_quoted  = 'quoted value'",
                "left_quote     = \"left quote",
                "right_quote    = right quote\"",
                "quoted_escape  = \"escape \\\\ \\n in quotes",
                "no_escape      = no escape \\\\ \\n outside of quotes",
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
            expect(config.simple).to.be("value");
        });

        it("should handle values with spaces", () => {
            expect(config.spaced).to.be("value with spaces");
        });

        it("should handle surrounding spaces", () => {
            expect(config.sloppy).to.be("surrounding spaces");
        });

        it("should handle indented lines", () => {
            expect(config.indented).to.be("indented");
        });

        it("should preserve internal spacing", () => {
            expect(config.internal).to.be("internal  spacing  preserved");
        });

        it("should interpolate values", () => {
            expect(config.interpolated).to.be("interpolated value");
        });

        it("should handle overwritten values in order of appearance", () => {
            expect(config.number).to.be("42");
            expect(config.initial).to.be("13");
            expect(config.overwrite).to.be("42");
        });

        it("should handle quoted values", () => {
            expect(config.quoted).to.be("quoted value");
            expect(config.single_quoted).to.be("'quoted value'");
            expect(config.left_quote).to.be("\"left quote");
            expect(config.right_quote).to.be("right quote\"");
        });

        it("should handle escapes within quotes", () => {
            expect(config.quoted_escape).to.be("escape \\ \n in quotes");
            expect(config.no_escape).to.be("no escape \\\\ \\n outside quotes");
        });

        it("should handle comments", () => {
            expect(config.commented).to.be("commented line");
            expect(config.quote_comment).to.be("quoted value");
        });

        it("should ignore invalid lines", () => {
            expect(config["spaced name"]).to.be(undefined);
            expect(config["other"]).to.be(undefined);
            expect(config["other ignored junk"]).to.be(undefined);
        });

        it("should process includes with imported values", () => {
            expect(config.first_include).to.be("42");
            expect(config.second_include).to.be("42");
        });
    });
});


