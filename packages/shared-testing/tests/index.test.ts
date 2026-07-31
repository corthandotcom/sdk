import { getMockFixture } from "../src/index";

describe("shared-testing mock fixtures", () => {
  it("should return a mocked fixture status", () => {
    const fixture = getMockFixture("session");
    expect(fixture).toEqual({
      resource: "session",
      status: "mocked",
    });
  });
});
