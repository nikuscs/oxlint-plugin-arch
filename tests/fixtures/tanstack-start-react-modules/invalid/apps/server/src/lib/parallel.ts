export async function parallel(values: number[]) {
  let total = 0;

  await Promise.all(values.map(async (value) => {
    total += value;
  }));

  return total;
}
