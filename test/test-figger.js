const expect = require("expect.js");
const figger = require("..");
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

