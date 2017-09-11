export const createActionTypes = (prefix, actionList) => {
  return actionList.reduce((actions, action) => {
    actions[action] = `${prefix}/${action}`;
    return actions;
  }, {});
};

export function generateUUID(a, b) {
  for (
    b = a = "";
    a++ < 36;
    b +=
      (a * 51) & 52
        ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16)
        : "-"
  );
  return b;
}

export function join(/* path segments */) {
  // Split the inputs into a list of path commands.
  var parts = [];
  for (var i = 0, l = arguments.length; i < l; i++) {
    parts = parts.concat(arguments[i].toString().split("/"));
  }
  // Interpret the path commands to get the new resolved path.
  var newParts = [];
  for (i = 0, l = parts.length; i < l; i++) {
    var part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === ".") continue;
    // Interpret ".." to pop the last segment
    if (part === "..") newParts.pop();
    else
      // Push new path segments.
      newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === "") newParts.unshift("");
  // Turn back into a single string path.
  return newParts.join("/") || (newParts.length ? "/" : ".");
}

export const getInWithPath = (state, first, ...rest) => {
  if (!state) {
    return undefined;
  }
  const next = state[first];
  return rest.length ? getInWithPath(next, ...rest) : next;
};

export const getIn = (state, field) =>
  Array.isArray(field)
    ? getInWithPath(state, ...field)
    : getInWithPath(state, field);

// Adapted from https://github.com/erikras/redux-form/blob/v6/src/structure/plain/setIn.js
const setInWithPath = (state, value, first, ...rest) => {
  if (first === undefined) {
    return value;
  }
  const next = setInWithPath(state && state[first], value, ...rest);
  if (!state) {
    const initialized = isNaN(first) ? {} : [];
    initialized[first] = next;
    return initialized;
  }
  if (Array.isArray(state)) {
    const copy = [...state];
    copy[first] = next;
    return copy;
  }
  return {
    ...state,
    [first]: next
  };
};

export const setIn = (state, field, value) =>
  Array.isArray(field)
    ? setInWithPath(state, value, ...field)
    : setInWithPath(state, value, [field]);
