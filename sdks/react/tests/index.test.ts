import { useCorthanVersion } from "../src/index";

describe("React SDK baseline", () => {
  it("should return the correct React SDK version", () => {
    expect(useCorthanVersion()).toBe("1.0.0-react");
  });
});
