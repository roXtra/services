"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const main_1 = require("./main");
describe("services", () => {
    describe("bundle test", () => {
        it("should check for bundled methods", () => {
            (0, chai_1.expect)(typeof main_1.setsupervisor, "setsupervisor").to.equal("function");
            (0, chai_1.expect)(typeof main_1.setsupervisorConfig, "setsupervisorConfig").to.equal("function");
        });
    });
});
//# sourceMappingURL=setsupervisor-test.roxtest.js.map