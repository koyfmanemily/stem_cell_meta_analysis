function hedgesG(meanT, sdT, nT, meanC, sdC, nC, direction) {
  const df = nT + nC - 2;

  if (nT < 2 || nC < 2 || sdT < 0 || sdC < 0) {
    throw new Error("Invalid study data");
  }

  const pooledSD = Math.sqrt(
    ((nT - 1) * sdT ** 2 + (nC - 1) * sdC ** 2) / df
  );

  if (pooledSD === 0) {
    throw new Error("Pooled SD cannot be zero");
  }

  const d = (meanT - meanC) / pooledSD;
  const J = 1 - 3 / (4 * df - 1);

  return d * J * (direction === "lower" ? -1 : 1);
}
