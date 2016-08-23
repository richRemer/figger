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

    it("should resolve to configuration", (done) => {
        config.then((config) => {
            expect(config).to.be.an("object");
            expect(config.simple).to.be("value");
            expect(config.spaced).to.be("value with spaces");
            expect(config.sloppy).to.be("surrounding spaces");
            expect(config.indented).to.be("indented");
            expect(config.internal).to.be("internal  spacing  preserved");
            expect(config.interpolated).to.be("interpolated value");
            expect(config.number).to.be("42");
            expect(config.initial).to.be("13");
            expect(config.overwrite).to.be("42");
            expect(config.commented).to.be("commented line");
            expect(config.quoted).to.be("quoted value");
            expect(config.single_quoted).to.be("'quoted value'");
            expect(config.quoted_escape).to.be("escape \\ \n in quotes");
            expect(config.no_escape).to.be("no escape \\\\ \\n outside quotes");
            expect(config.quote_comment).to.be("quoted value");
            expect(config["spaced name"]).to.be(undefined);
            expect(config["other"]).to.be(undefined);
            expect(config["other ignored junk"]).to.be(undefined);
            expect(config.first_include).to.be("42");
            expect(config.second_include).to.be("42");
            done();
        }).catch(done);
    });
});


