// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from 'onnxruntime-web';
import { Label } from '../contexts/context';

export interface modelScaleProps {
  samScale: number;
  height: number;
  width: number;
}

export interface modelInputProps {
  scaledX: number;
  scaledY: number;
  unscaledX: number;
  unscaledY: number;
  clickType: number;
}

export interface modeDataProps {
  clicks?: Array<modelInputProps>;
  baseTensor: Tensor;
  tensorAfterManualEditions?: Tensor;
  boundingBox?: BoundingBox;
  modelScale: modelScaleProps;
}

export interface ToolProps {
  handleMouseMove: (e: any) => void;
  handleMouseClick: (e: any) => void;
  handleMouseOut: (e: any) => void;
  handleMouseDown: (e: any) => void;
  handleMouseUp: (e: any) => void;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface BoundingBox {
  topLeftCorner: Coordinate;
  bottomRightCorner: Coordinate;
}

export interface Polygon {
  coordinates: Coordinate[];
  label: Label | null;
}
