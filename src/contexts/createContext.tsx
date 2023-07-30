import { createContext } from 'react';
import {
  BoundingBox,
  Coordinate,
  Polygon,
  modelInputProps,
} from '../helpers/Interfaces';
import { Label, Mask } from './context';
import { Action, SamImage } from '../components/ControlPanel/ControlPanel';
import { Tensor } from 'onnxruntime-web';

export type MaskAdditionType = 'point' | 'bbox' | 'none';

interface contextProps {
  clicks: {
    clicks: modelInputProps[];
    setClicks: (clicks: modelInputProps[]) => void;
    addClick: (click: modelInputProps) => void;
  };
  previewClicks: {
    previewClicks: modelInputProps[];
    setPreviewClicks: (clicks: modelInputProps[]) => void;
  };
  image: {
    image: HTMLImageElement | null;
    setImage: (e: HTMLImageElement | null) => void;
  };
  maskImg: {
    maskImg: HTMLImageElement | null;
    setMaskImg: (e: HTMLImageElement | null) => void;
  };
  previewMaskImg: {
    previewMaskImg: HTMLImageElement | null;
    setPreviewMaskImg: (e: HTMLImageElement | null) => void;
  };
  pressedKeys: {
    isCtrlKeyPressed: boolean;
  };
  masks: {
    masks: Mask[];
    setMasks: (masks: Mask[]) => void;
    addMask: (mask: Mask) => void;
    replaceMask: (index: number, newMask: Mask) => void;
  };
  action: {
    action: Action;
    setAction: (action: Action) => void;
  };
  polygons: {
    polygons: Polygon[];
    setPolygons: (polygons: Polygon[]) => void;
    removePolygonNodes: (indexes: number[]) => void;
    addNodeAfterSpecificNode: (
      node: Coordinate,
      afterNodeIndex: number,
      maskIndex: number,
      polygonIndex: number
    ) => void;
    replacePolygon: (
      imageIndex: number,
      maskIndex: number,
      polygonIndex: number,
      polygon: Polygon
    ) => void;
  };
  selectedPolygonIndex: {
    selectedPolygonIndex: number;
    setSelectedPolygonIndex: (selectedPolygonIndex: number) => void;
  };
  selectedMaskIndex: {
    selectedMaskIndex: number;
    setSelectedMaskIndex: (selectedMaskIndex: number) => void;
  };
  tensorAfterManualEditions: {
    tensorAfterManualEditions: Tensor | null;
    setTensorAfterManualEditions: (tensor: Tensor) => void;
  };
  boundingBox: {
    boundingBox: BoundingBox | null;
    setBoundingBox: (boundingBox: BoundingBox | null) => void;
  };
  maskAdditionType: {
    maskAdditionType: MaskAdditionType;
    setMaskAdditionType: (MaskAdditionType: MaskAdditionType) => void;
  };
  images: {
    images: SamImage[];
    addImages: (newImages: SamImage[]) => void;
    removeImages: (indexes: number[]) => void;
    replaceImage: (image: SamImage, index: number) => void;
    setImages: React.Dispatch<React.SetStateAction<SamImage[]>>;
    currentImageIndex: number | null;
    setCurrentImageIndex: (index: number | null) => void;
  };
  allowedPolygonActions: {
    isNodeSelectionAllowed: boolean;
    setIsNodeSelectionAllowed: React.Dispatch<React.SetStateAction<boolean>>;
    isNodeMovementAllowed: boolean;
    setIsNodeMovementAllowed: React.Dispatch<React.SetStateAction<boolean>>;
    isNodeCreationAllowed: boolean;
    setIsNodeCreationAllowed: React.Dispatch<React.SetStateAction<boolean>>;
    isPolygonCreationAllowed: boolean;
    setIsPolygonCreationAllowed: React.Dispatch<React.SetStateAction<boolean>>;
  };
  selectedNodesIndexes: {
    selectedNodesIndexes: number[];
    setSelectedNodesIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    addNewNodeToSelection: (index: number) => void;
  };
  labels: {
    labels: Label[];
    setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
    addLabel: (label: Label) => void;
    removeLabel: (index: number) => void;
    replaceLabel: (index: number, newLabel: Label) => void;
    currentLabel: string;
    setCurrentLabel: React.Dispatch<React.SetStateAction<string>>;
  };
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const AppContext = createContext<contextProps | null>(null);

export default AppContext;
