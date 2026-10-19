/** A shuffled copy of `items` (Fisher–Yates), so minigames can take a seeded `random` in tests. */
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));

    [copy[index], copy[other]] = [copy[other], copy[index]];
  }

  return copy;
}
