import { fetchAPI } from "./utils";

const mockResponse = (
  status,
  statusText,
  response,
  headers = { "Content-Type": "application/json" }
) => {
  const h = Object.keys(headers).reduce((n, h) => {
    n.append(h, headers[h]);
    return n;
  }, new Headers());
  return new window.Response(response, {
    status: status,
    statusText: statusText,
    headers: h
  });
};

describe("fetchAPI", () => {
  it("should handle no method", async () => {
    window.fetch = jest.fn().mockImplementation((route, p) => {
      expect(route).toEqual("http://localhost:8000/route/cached");
      return Promise.resolve(mockResponse(200, null, '{"key": true}'));
    });
    let response = await fetchAPI("/route/cached", { cache: 2500 });
    expect(response).toEqual({ key: true });
    response = await fetchAPI("/route/cached", { cache: 2500 });
    expect(response).toEqual({ key: true });
  });

  it("should handle plain text body", async () => {
    window.fetch = jest.fn().mockImplementation((route, p) => {
      expect(route).toEqual("http://localhost:8000/route");
      return Promise.resolve(
        mockResponse(200, null, "fish", { "Content-Type": "text/plain" })
      );
    });
    const response = await fetchAPI("/route", { body: { test: true } });
    expect(response).toEqual("fish");
  });

  it("should handle failure", () => {
    window.fetch = jest.fn().mockImplementation((route, p) => {
      expect(route).toEqual("http://localhost:8000/route");
      return Promise.resolve(
        mockResponse(404, "not found", "fish", { "Content-Type": "text/plain" })
      );
    });
    const response = fetchAPI("/route", { body: { test: true } });
    expect(response).rejects.toMatchSnapshot();
    expect(response).rejects.toEqual({ message: "not found", status: 404 });
  });
});
