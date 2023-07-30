export const findDuplicateCoordinateIndex = (
  coordinates: Array<{ x: number; y: number }>
): number | null => {
  const coordinateMap: Map<string, number> = new Map();

  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const coordinateKey = `${coordinate.x},${coordinate.y}`;

    if (coordinateMap.has(coordinateKey)) {
      return coordinateMap.get(coordinateKey)!;
    }

    coordinateMap.set(coordinateKey, i);
  }

  return null;
};

export const calculateNegativeAverage = (arr: number[]) => {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < 0) {
      sum += arr[i];
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  const average = sum / count;
  return average;
};
