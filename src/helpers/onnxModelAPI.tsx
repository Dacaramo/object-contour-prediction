// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from 'onnxruntime-web';
import { modeDataProps } from './Interfaces';
import { modelScaleProps } from './Interfaces';

const modelData = ({
  clicks,
  baseTensor,
  tensorAfterManualEditions,
  boundingBox,
  modelScale,
}: modeDataProps) => {
  const imageEmbedding = baseTensor;
  const maskInput =
    tensorAfterManualEditions ??
    new Tensor('float32', new Float32Array(256 * 256), [1, 1, 256, 256]);
  let pointCoords;
  let pointLabels;
  let pointCoordsTensor;
  let pointLabelsTensor;

  // Check there are input click prompts
  if (clicks) {
    const n = clicks.length;

    // If there is no box input, a single padding point with
    // label -1 and coordinates (0.0, 0.0) should be concatenated
    // so initialize the array to support (n + 1) points.
    pointCoords = boundingBox
      ? new Float32Array(2 * (n + 2))
      : new Float32Array(2 * (n + 1));
    pointLabels = boundingBox
      ? new Float32Array(n + 2)
      : new Float32Array(n + 1);

    // Add clicks and scale to what SAM expects
    for (let i = 0; i < n; i++) {
      pointCoords[2 * i] = clicks[i].scaledX * modelScale.samScale;
      pointCoords[2 * i + 1] = clicks[i].scaledY * modelScale.samScale;
      pointLabels[i] = clicks[i].clickType;
    }

    if (!boundingBox) {
      // Add in the extra point/label when only clicks and no box
      // The extra point is at (0, 0) with label -1
      pointCoords[2 * n] = 0.0;
      pointCoords[2 * n + 1] = 0.0;

      pointLabels[n] = -1.0;
    } else {
      pointCoords[2 * n] = boundingBox.topLeftCorner.x;
      pointCoords[2 * n + 1] = boundingBox.topLeftCorner.y;
      pointCoords[2 * n + 2] = boundingBox.bottomRightCorner.x;
      pointCoords[2 * n + 3] = boundingBox.bottomRightCorner.y;

      pointLabels[n] = 2;
      pointLabels[n + 1] = 3;
    }

    // Create the tensor
    pointCoordsTensor = new Tensor('float32', pointCoords, [
      1,
      boundingBox ? n + 2 : n + 1,
      2,
    ]);
    pointLabelsTensor = new Tensor('float32', pointLabels, [
      1,
      boundingBox ? n + 2 : n + 1,
    ]);
  }
  const imageSizeTensor = new Tensor('float32', [
    modelScale.height,
    modelScale.width,
  ]);

  if (pointCoordsTensor === undefined || pointLabelsTensor === undefined)
    return;

  // There is no previous mask, so default to 0
  const hasMaskInput = maskInput
    ? new Tensor('float32', [1])
    : new Tensor('float32', [0]);

  return {
    image_embeddings: imageEmbedding,
    point_coords: pointCoordsTensor,
    point_labels: pointLabelsTensor,
    orig_im_size: imageSizeTensor,
    mask_input: maskInput,
    has_mask_input: hasMaskInput,
  };
};

// Tried with the first agave from top down of the image in the middle row of agaves
// Coordinates of top left corner of the bounding box {x: 0; y: 0}
// Coordinates of bottom right corner of the bounding box {x: 0; y: 0}

export const modelDataWithJustCoordinates = (
  tensor: Tensor,
  modelScale: modelScaleProps
) => {
  const imageEmbedding = tensor;
  // pointCoordinates = new Float32Array([487, 420]);
  // pointCoordinatesTensor = new Tensor('float32', pointCoordinates, [1, 2]);

  const pointLabels = new Float32Array([1, 0, 2, 3]);
  const pointLabelsTensor = new Tensor('float32', pointLabels, [1, 4]);

  // 1 -> 489, 418 (increment)
  // 0 -> 484, 356 (decrement)
  // [top-left-x, top-left-y, bottom-right-x, bottom-right-x]
  const box = new Float32Array([489, 418, 484, 356, 409, 342, 558, 483]);
  const boxTensor = new Tensor('float32', box, [1, 4, 2]);

  const imageSizeTensor = new Tensor('float32', [
    modelScale.height,
    modelScale.width,
  ]);

  // There is no previous mask, so default to an empty tensor
  const maskInput = new Tensor(
    'float32',
    new Float32Array(256 * 256),
    [1, 1, 256, 256]
  );
  // There is no previous mask, so default to 0
  const hasMaskInput = new Tensor('float32', [0]);

  return {
    image_embeddings: imageEmbedding,
    point_coords: boxTensor,
    point_labels: pointLabelsTensor,
    orig_im_size: imageSizeTensor,
    mask_input: maskInput,
    has_mask_input: hasMaskInput,
  };
};

export { modelData };
