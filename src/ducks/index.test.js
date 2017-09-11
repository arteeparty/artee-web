import createStore from "./index";

describe("createStore", () => {
  it("should work", () => {
    const store = createStore();
  });

  it("should not add logger in production", () => {
    const _env = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const store = createStore();
    process.env.NODE_ENV = _env;
  });
});
