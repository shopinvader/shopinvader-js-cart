/* function to compare deeply two values and return true if they are equal */

export const isEqual = (objA: any, objB: any) => {
  const keysA = typeof objA === 'object' ? Object.keys(objA || {}) : [];
  const keysB = typeof objB === 'object' ? Object.keys(objB || {}) : [];

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (typeof objA[key] === 'object' && typeof objB[key] === 'object') {
      if (!isEqual(objA[key], objB[key])) {
        return false;
      }
    }
    if (objA[key] !== objB[key]) {
      return false;
    }
  }
  return true;
};
