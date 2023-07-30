import cv, { MatVector, imshow } from '@techstark/opencv-js';
import { Polygon } from './Interfaces';

interface Hierarchy {
  contourId: number;
  next: number;
  prev: number;
  firstChild: number;
  parent: number;
}

export const findPolygons = (
  onnxMask: any,
  width: any,
  height: any,
): Polygon[] => {
  const mask = onnxToImage(onnxMask, width, height);
  const contours: MatVector = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(
    mask,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_NONE
  );

  const polygons = [];
  const epsilon = 1.5;
  //@ts-ignore
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);

    const approxCurve = new cv.Mat();
    cv.approxPolyDP(contour, approxCurve, epsilon, true);

    const polygon: Polygon = {
      coordinates: [],
      label: null,
    };

    for (let j = 0; j < approxCurve.data32S.length; j += 2) {
      const x = approxCurve.data32S[j];
      const y = approxCurve.data32S[j + 1];

      polygon.coordinates.push({ x, y });
    }

    const isFrameContour = [
      { x: 0, y: 0 },
      { x: 0, y: 1023 },
      { x: 1023, y: 0 },
      { x: 1023, y: 1023 },
    ].every((coordinates) => {
      return polygon.coordinates.some(
        ({ x, y }) => x === coordinates.x && y === coordinates.y
      );
    });
    if (!isFrameContour) polygons.push(polygon);
  }

  return polygons as Polygon[];
};

export const drawPolygonAsContours = (
  polygon: Polygon,
  canvas: HTMLCanvasElement
) => {
  const contoursTransformed = polygonsToContours([polygon]);

  const maskSize = new cv.Size(canvas.height, canvas.width);
  const img = new cv.Mat(maskSize, cv.CV_8UC3);
  img.setTo(new cv.Scalar(0));
  const color = new cv.Scalar(255, 255, 255, 255);
  cv.drawContours(img, contoursTransformed, 0, color, cv.FILLED, cv.LINE_8);
  imshow(canvas, img);
};

export const generatePolygonsMat = (
  polygons: Polygon[],
  width: number,
  height: number
) => {
  const image = new cv.Mat(height, width, cv.CV_8UC1, [0, 0, 0]);

  polygons.forEach((polygon) => {
    const points = polygon.coordinates.map(({ x, y }) => new cv.Point2f(x, y));
    const contours = new cv.Mat(points.length, 1);

    cv.drawContours(image, contours, -1, [255, 255, 255], cv.LINE_8);
  });
};

export const printHierarchy = (
  contours: cv.MatVector,
  hierarchy: cv.Mat,
  headerMsg: string
) => {
  //@ts-ignore
  for (let i = 0; i < contours.size(); i++) {

    // Access hierarchy elements for the current contour
    const hierarchyPtr = hierarchy.intPtr(0, i);
    const next = hierarchyPtr[0];
    const previous = hierarchyPtr[1];
    const firstChild = hierarchyPtr[2];
    const parent = hierarchyPtr[3];

    // Use the hierarchy information as needed
    console.log(headerMsg);
    console.log(
      `Contour ${i}: Next: ${next}, Previous: ${previous}, First Child: ${firstChild}, Parent: ${parent}`
    );
  }
};

export const getHierarchyArray = (
  contours: cv.MatVector,
  hierarchy: cv.Mat
): Hierarchy[] => {
  const hierarchyArray: Hierarchy[] = [];

  //@ts-ignore
  for (let i = 0; i < contours.size(); i++) {
    const hierarchyPtr = hierarchy.intPtr(0, i);
    hierarchyArray.push({
      contourId: i,
      next: hierarchyPtr[0],
      prev: hierarchyPtr[1],
      firstChild: hierarchyPtr[2],
      parent: hierarchyPtr[3],
    });
  }

  return hierarchyArray;
};

export const polygonsToContours = (polygons: Polygon[]) => {
  const contours = new cv.MatVector();
  for (let j = 0; j < polygons.length; j++) {
    const polygon = polygons[j];
    const contourSize = new cv.Size(1, polygon.coordinates.length - 1);
    const contour = new cv.Mat(contourSize, cv.CV_32SC2);
    for (let i = 0; i < polygon.coordinates.length - 1; i++) {
      contour.data32S[i * 2] = polygon.coordinates[i].x;
      contour.data32S[i * 2 + 1] = polygon.coordinates[i].y;
    }
    contours.push_back(contour);
  }
  return contours;
};

export const polygonsToOnnxMask = (
  polygons: Polygon[],
  width: number,
  height: number
) => {
  const contoursTransformed = polygonsToContours(polygons);

  const maskSize = new cv.Size(height, width);
  const img = new cv.Mat(maskSize, cv.CV_8UC1);
  img.setTo(new cv.Scalar(-15));
  const color = new cv.Scalar(1);
  cv.drawContours(img, contoursTransformed, 0, color, cv.FILLED, cv.LINE_8);

  const unscaledImage = img;
  const scaledImage = new cv.Mat();

  cv.resize(
    unscaledImage,
    scaledImage,
    new cv.Size(256, 256),
    0,
    0,
    cv.INTER_LINEAR
  );

  const grayscaleImageMat = new cv.Mat();
  const binaryImageMat = new cv.Mat();

  cv.cvtColor(scaledImage, grayscaleImageMat, cv.COLOR_GRAY2BGR);
  cv.threshold(grayscaleImageMat, binaryImageMat, 127, 255, cv.THRESH_BINARY);

  const uint8 = scaledImage.data;
  const float32 = new Float32Array(
    uint8.map((val: any) => {
      return val;
    })
  );

  return float32;
};

export const onnxToImage = (onnxMask: any, width: number, height: number) => {
  const maskSize = new cv.Size(width, height);
  const mask = new cv.Mat(maskSize, cv.CV_8UC1);
  mask.setTo(new cv.Scalar(0));
  for (let i = 0; i < onnxMask.length; i++) {
    if (onnxMask[i] > 0.0) {
      mask.data[i] = 1;
    }
  }

  return mask;
};
