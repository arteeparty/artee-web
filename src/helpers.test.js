import { getInWithPath, join, generateUUID, setIn, getIn } from "./helpers";

it("join", () => {
  expect(join(123, "test")).toBe("123/test");
  expect(join(123, "../test")).toBe("test");
  expect(join()).toBe(".");
  expect(join("/")).toBe("/");
});

it("generateUUID", () => {
  expect(generateUUID()).not.toBe(null);
});

describe("setIn", () => {
  it("should handle first level changes", () => {
    const state = {
      test: "x"
    };
    const newState = setIn(state, "test", "y");

    expect(newState.test).toEqual("y");
  });

  it("should handle first level changes", () => {
    const state = {
      test: "x"
    };
    const newState = setIn(state, ["test"], "y");

    expect(newState.test).toEqual("y");
  });

  it("should handle deep changes", () => {
    const state = {
      test: {
        deep: "x"
      }
    };
    const newState = setIn(state, ["test", "deep"], "y");

    expect(newState.test.deep).toEqual("y");
  });

  it("should handle deep changes of type", () => {
    const state = {
      test: {
        deep: "x"
      }
    };
    const newState = setIn(state, ["test", "deep"], ["x", "y"]);
    expect(newState.test.deep).toEqual(["x", "y"]);
  });

  it("should handle arrays", () => {
    const state = {
      test: ["x", "y", "z"]
    };
    const newState = setIn(state, ["test", 0], "y");

    expect(newState.test).toEqual(["y", "y", "z"]);
  });
});

describe("getIn", () => {
  it("should handle single level objects", () => {
    const state = {
      test: "x"
    };
    expect(getIn(state, "test")).toEqual("x");
  });

  it("should handle null states", () => {
    const state = null;
    expect(getIn(state, "test")).toEqual(undefined);
  });

  it("should handle undefined values", () => {
    const state = {
      test: "x"
    };
    expect(getIn(state, "not_in_state")).toEqual(undefined);
  });

  it("should handle arrays", () => {
    const state = {
      test: ["x", "y"]
    };
    expect(getIn(state, ["test", 1])).toEqual("y");
  });

  it("should handle deep level objects", () => {
    const state = {
      test: {
        deep: "value"
      }
    };
    expect(getIn(state, ["test", "deep"])).toEqual("value");
  });
});
