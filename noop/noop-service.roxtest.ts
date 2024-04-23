// We need to reference the types here explicitly as otherwise, compilation errors for missing module declarations for "modeler/bpmn/bpmn" and "bpmn-moddle/lib/simple" occur
/* eslint-disable-next-line spaced-comment */
/// <reference path="node_modules/processhub-sdk/src/process/types/index.d.ts" />
import { noop, noopConfig } from "./main.js";
import { expect } from "chai";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs";

describe("services", () => {
  describe("noop", () => {
    it("execute service", async () => {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/noop-test.bpmn", "utf-8"));
      const result = await noop(env);
      expect(result).to.equal(true);
    });

    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof noop).to.equal("function");
        expect(typeof noopConfig).to.equal("function");
      });
    });
  });
});
