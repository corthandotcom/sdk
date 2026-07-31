import { getSDKName } from "../src/index";

describe("Node SDK baseline", () => {
  it("should return the correct SDK name", () => {
    expect(getSDKName()).toBe("corthan-node-sdk");
  });
});
