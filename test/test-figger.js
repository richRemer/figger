const expect = require("expect.js");
const figger = require("..");
const readable = figger.stream.readable;

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
});

