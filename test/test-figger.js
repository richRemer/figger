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
});
