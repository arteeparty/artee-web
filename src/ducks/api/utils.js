import cache from "memory-cache";

const API_BASE = process.env.REACT_APP_API_BASE || "https://api.artee.party";

export function resolveURL(path, scheme = "http") {
  if (scheme !== "http") {
    return API_BASE.replace("http", scheme === "wss" ? "ws" : scheme) + path;
  }
  return API_BASE + path;
}

const handleResponse = async (url, response, time = 0, method = "GET") => {
  let output;
  if (
    response.headers.get("Content-Type") === "application/json; charset=utf-8"
  ) {
    output = await response.json();
  } else {
    output = await response.text();
  }
  if (!response.ok) {
    const error = {
      status: response.status,
      message: output.message || response.statusText
    };
    throw error;
  }
  if (time !== 0) {
    cache.put(`${method} | ${url}`, output, time);
  }
  return output;
};

export const fetchAPI = async (route, config) => {
  const url = resolveURL(route);

  let cachedResponse = cache.get(`${config.method || "GET"} | ${url}`);
  if (cachedResponse) {
    return cachedResponse;
  }
  const options = {
    ...config,
    headers: {
      ...config.headers
    }
  };
  if (options.body) {
    options.body = JSON.stringify(options.body);
    options.headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, options);
  return handleResponse(url, response, config.cache || 0, config.method);
};
