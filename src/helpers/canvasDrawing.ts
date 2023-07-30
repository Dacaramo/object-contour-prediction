import { Coordinate, BoundingBox } from './Interfaces';
import { Polygon } from './Interfaces';

export const drawPolygons = (
  canvas: HTMLCanvasElement,
  polygons: Polygon[],
  selectedPolygonIndex: number,
  selectedNodesIndexes: number[]
) => {
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  for (let i = 0; i < polygons.length; i++) {
    const red = '#FF0000';
    const yellow = '#FFFF00';
    const cyan = '#00FFFF';
    const transparent = 'rgba(0,0,0,0)';

    const points = polygons[i];

    // Drawing each edge of the polygon
    const edgeStrokeColor = red;
    const edgeFillColor = transparent;
    ctx.strokeStyle = edgeStrokeColor;
    ctx.fillStyle = edgeFillColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(points.coordinates[0].x, points.coordinates[0].y);
    for (let j = 0; j < points.coordinates.length; j++) {
      ctx.lineTo(points.coordinates[j].x, points.coordinates[j].y);
    }

    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Drawing each vertex of the polygon
    if (i === selectedPolygonIndex) {
      let vertexStrokeColor = yellow;
      let vertexFillColor = yellow;
      ctx.strokeStyle = vertexStrokeColor;
      ctx.fillStyle = vertexFillColor;

      for (let k = 0; k < points.coordinates.length; k++) {
        ctx.beginPath();
        ctx.arc(
          points.coordinates[k].x,
          points.coordinates[k].y,
          3,
          0,
          Math.PI * 2,
          true
        );
        ctx.closePath();
        ctx.fill();
      }

      // Drawing the selected nodes of the selected polygon in another color
      vertexStrokeColor = cyan;
      vertexFillColor = cyan;
      ctx.strokeStyle = vertexStrokeColor;
      ctx.fillStyle = vertexFillColor;

      for (let k = 0; k < points.coordinates.length; k++) {
        if (selectedNodesIndexes.includes(k)) {
          ctx.beginPath();
          ctx.arc(
            points.coordinates[k].x,
            points.coordinates[k].y,
            3,
            0,
            Math.PI * 2,
            true
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
};

export const drawRect = (canvas: HTMLCanvasElement, bbox: BoundingBox) => {
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  ctx.beginPath();
  ctx.strokeStyle = 'magenta';
  ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
  ctx.rect(
    bbox.topLeftCorner.x,
    bbox.topLeftCorner.y,
    Math.abs(bbox.bottomRightCorner.x - bbox.topLeftCorner.x),
    Math.abs(bbox.bottomRightCorner.y - bbox.topLeftCorner.y)
  );
  ctx.stroke();
  ctx.fill();
};

export const drawPreviewPoint = (
  canvas: HTMLCanvasElement,
  point: Coordinate
) => {
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  ctx.fillStyle = '#5DFC0A';
  ctx.beginPath();
  ctx.arc(point.x, point.y, 3, 0, Math.PI * 2, true);
  ctx.fill();
};
