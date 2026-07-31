import { getReactNativeVersion } from "../src/index";

describe("React Native SDK baseline", () => {
  it("should return the correct version", () => {
    expect(getReactNativeVersion()).toBe("1.0.0-react-native");
  });
});
