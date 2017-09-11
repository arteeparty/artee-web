const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8001";

export function resolveURL(path, scheme = "http") {
  if (scheme !== "http") {
    return API_BASE.replace("http", scheme) + path;
  }
  return API_BASE + path;
}

const handleResponse = async (url, response, method = "GET") => {
  let output;
  if (response.headers.get("Content-Type") === "application/json") {
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
  return output;
};

export const fetchAPI = async (route, config) => {
  const url = resolveURL(route);

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
  return handleResponse(url, response, config.method);
};
