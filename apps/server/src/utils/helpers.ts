function arrayElement<T>(val: ReadonlyArray<T>): T | undefined {
  if (val.length === 0) return;

  return val[Math.floor(Math.random() * val.length)];
}

export { arrayElement };
