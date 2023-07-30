import { Coordinate, BoundingBox } from './Interfaces';

export const pointToLineDistance = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0)
    // in case of 0 length line
    param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getBoundingBox = (polygon: Coordinate[]): BoundingBox | null => {
  if (polygon.length === 0) {
    return null;
  }

  let minX = polygon[0].x;
  let minY = polygon[0].y;
  let maxX = polygon[0].x;
  let maxY = polygon[0].y;

  for (let i = 1; i < polygon.length; i++) {
    const { x, y } = polygon[i];
    if (x < minX) {
      minX = x;
    } else if (x > maxX) {
      maxX = x;
    }

    if (y < minY) {
      minY = y;
    } else if (y > maxY) {
      maxY = y;
    }
  }

  return {
    topLeftCorner: {
      x: minX,
      y: minY,
    },
    bottomRightCorner: {
      x: maxX,
      y: maxY,
    },
  } as BoundingBox;
};

export const isCoordinateInsidePolygon = (
  coordinate: Coordinate,
  polygon: Coordinate[]
): boolean => {
  const { x, y } = coordinate;
  let isInside = false;

  // Iterate through each edge of the polygon
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];

    // Check if the coordinate is on the same side of the edge
    const intersectCondition =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersectCondition) {
      isInside = !isInside;
    }
  }

  return isInside;
};

export const isCoordinateInsideBbox = (
  coordinate: Coordinate,
  bbox: BoundingBox
) => {
  const bboxPolygon = [
    {
      x: bbox.topLeftCorner.x,
      y: bbox.topLeftCorner.y,
    },
    {
      x: bbox.bottomRightCorner.x,
      y: bbox.topLeftCorner.y,
    },
    {
      x: bbox.bottomRightCorner.x,
      y: bbox.bottomRightCorner.y,
    },
    {
      x: bbox.topLeftCorner.x,
      y: bbox.bottomRightCorner.y,
    },
  ];

  return isCoordinateInsidePolygon(coordinate, bboxPolygon);
};
