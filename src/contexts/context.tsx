import React, { useState, useEffect, useRef } from 'react';
import {
  BoundingBox,
  Coordinate,
  Polygon,
  modelInputProps,
} from '../helpers/Interfaces';
import AppContext, { MaskAdditionType } from './createContext';
import { Action, SamImage } from '../components/ControlPanel/ControlPanel';
import { Tensor } from 'onnxruntime-web';

export interface Label {
  id: string;
  name: string;
}

export interface Mask {
  image: HTMLImageElement;
  polygons: Polygon[];
  clicks: modelInputProps[];
  bbox: BoundingBox | null;
  werePolygonsEditedManually: boolean;
}

export type PolygonAction = 'move-nodes' | 'select-nodes' | 'none';

const AppContextProvider = (props: {
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}) => {
  /**
   * The base image where the image segmentation is going to take place
   */
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  /**
   * Holds the necessary clicks to generate the image of the current mask
   * (maskImg).
   */
  const [clicks, setClicks] = useState<Array<modelInputProps>>([]);
  /**
   * This is the image corresponding to the current mask. This is the blue image
   * generated from the clicks array. This is going to change whenever the user
   * selects a new mask for edition or opts in for adding a new mask from
   * scratch. This is null when not editing or adding masks.
   */
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  /**
   * Holds the necessary clicks to generate the image of the current preview mask
   * (previewMaskImg). This is basically the clicks array plus an increment
   * click that has the coordinates of the current pointer position or decrement
   * click that has the coordinates of the current pointer position if the ctrl
   * key is being held.
   */
  const [previewClicks, setPreviewClicks] = useState<Array<modelInputProps>>(
    []
  );
  /**
   * This is the image corresponding to the current preview mask. This is the
   * green image generated from the previewClicks array. This is going to change
   * whenever the user selects a new mask for edition or opts in for adding a
   * new mask from scratch and moves the mouse over the canvas.
   * This is null when not editing or adding masks
   */
  const [previewMaskImg, setPreviewMaskImg] = useState<HTMLImageElement | null>(
    null
  );
  /**
   * An array holding in every position relevant data for displaying again the
   * image corresponding to every mask, the polygons with x and y coordinates
   * to draw the editable contour and the clicks that were made to each mask.
   * Every time you add a new mask, the data corresponding to the current mask
   * such as the clicks, the polygons and the image is all going to be added as a
   * new item in this array.
   */
  const [masks] = useState<Mask[]>([]);
  /**
   * Indicates the action being made by the user. Depending on the
   * action multiple things are going to change within the app.
   */
  const [action, setAction] = useState<Action>('none');
  /**
   * Holds the polygons corresponding to the current mask. Every mask has not
   * only one polygon, but multiple polygons
   */
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  /**
   * The index of the currently selected mask, this is useful when the user is
   * going to edit a mask to know which is the mask that is currently being
   * edited. Remember that the current mask is not stored anywhere, so this is
   * the way to look in the masks array and find the current mask.
   */
  const [selectedMaskIndex, setSelectedMaskIndex] = useState<number>(-1);
  /**
   * The index of the currently selected polygon inside the polygons
   * array of an specific mask inside the masks array. This has a similar
   * purpose as the selectedMaskIndex: knowing which polygon of the specific
   * mask is being edited. Remember that you can only edit one polygon at a time
   */
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number>(-1);

  // The variables below are experimental and may be removed soon

  /**
   * [This is a model param]
   * Will be assigned to the mask_input model parameter. This is a tensor of
   * dimensions [1, 1, 256, 256] representing a scaled version of the current mask
   * with all of the manual modifications made to the polygons inside an specific
   * mask.
   */
  const [tensorAfterManualEditions, setTensorAfterManualEditions] =
    useState<Tensor | null>(null);

  /**
   * [This is a model param]
   * Will be assigned at the end of the point_coords array model parameter. This
   * contains the bounding box of the recently modified polygon.
   */
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);

  // The variables above are experimental and may be removed soon

  /**
   * Indicates in a global manner if some of the keys below are being pressed.
   * The listener is setted below in this same file
   */
  const [isCtrlKeyPressed, setIsCtrlKeyPressed] = useState<boolean>(false);

  const [maskAdditionType, setMaskAdditionType] =
    useState<MaskAdditionType>('none');

  const [isNodeSelectionAllowed, setIsNodeSelectionAllowed] =
    useState<boolean>(false);
  const [isNodeMovementAllowed, setIsNodeMovementAllowed] =
    useState<boolean>(false);
  const [isNodeCreationAllowed, setIsNodeCreationAllowed] =
    useState<boolean>(false);
  const [isPolygonCreationAllowed, setIsPolygonCreationAllowed] =
    useState<boolean>(false);

  const [images, setImages] = useState<SamImage[]>([]);

  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null
  );

  const [selectedNodesIndexes, setSelectedNodesIndexes] = useState<number[]>(
    []
  );

  const [labels, setLabels] = useState<Label[]>([]);

  const [currentLabel, setCurrentLabel] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const addMask = (mask: Mask) => {
    if (currentImageIndex === null) return;

    // console.log('@@@@@currentImageIndex', currentImageIndex);

    const newImages = [...images];
    newImages[currentImageIndex].masks.push(mask);

    setImages(newImages);
  };

  const replaceMask = (index: number, newMask: Mask) => {
    if (currentImageIndex === null) return;

    const newImages = [...images];
    const newMasks = newImages[currentImageIndex].masks.map((mask, i) =>
      i === index ? newMask : mask
    );
    newImages[currentImageIndex].masks = newMasks;

    setImages(newImages);
  };

  const setMasksOfCurrentImage = (masks: Mask[]) => {
    if (currentImageIndex === null) return;

    const newImages = [...images];
    newImages[currentImageIndex].masks = masks;

    setImages(newImages);
  };

  const removePolygonNodes = (indexes: number[]) => {
    if (currentImageIndex === null) return;
    if (selectedMaskIndex === -1) return;
    if (selectedPolygonIndex === -1) return;

    const areAllNodesSelected = images[currentImageIndex].masks[
      selectedMaskIndex
    ].polygons[selectedPolygonIndex].coordinates.every((_: any, i: number) =>
      indexes.includes(i)
    );

    if (areAllNodesSelected) {
      const theresIsOnlyOnePolygonInMask =
        images[currentImageIndex].masks[selectedMaskIndex].polygons.length ===
        1;

      if (theresIsOnlyOnePolygonInMask) {
        setMasksOfCurrentImage(
          images[currentImageIndex].masks.filter(
            (_, i) => i !== selectedMaskIndex
          )
        );
        return;
      }

      const newPolygons = images[currentImageIndex].masks[
        selectedMaskIndex
      ].polygons.filter((_: any, i: number) => i !== selectedPolygonIndex);
      const newMasks = images[currentImageIndex].masks.map((mask, i) => {
        if (i !== selectedMaskIndex) return mask;
        else return { ...mask, polygons: newPolygons };
      });
      setMasksOfCurrentImage(newMasks);
      setSelectedMaskIndex(-1);
      setSelectedPolygonIndex(-1);

      return;
    }

    const newImages = [...images];
    const newPolygon = newImages[currentImageIndex].masks[
      selectedMaskIndex
    ].polygons[selectedPolygonIndex].coordinates.filter((_: any, i: number) => {
      return !indexes.includes(i);
    });
    newImages[currentImageIndex].masks[selectedMaskIndex].polygons[
      selectedPolygonIndex
    ].coordinates = newPolygon;

    setImages(newImages);
  };

  const addNodeAfterSpecificNode = (
    node: Coordinate,
    afterNodeIndex: number,
    maskIndex: number,
    polygonIndex: number
  ) => {
    if (currentImageIndex === null) return;

    const newImages = [...images];
    const triggeredPolygon = [
      ...newImages[currentImageIndex].masks[maskIndex].polygons[polygonIndex]
        .coordinates,
    ];

    if (afterNodeIndex === triggeredPolygon.length - 1) return;

    triggeredPolygon.splice(afterNodeIndex + 1, 0, node);

    newImages[currentImageIndex].masks[maskIndex].polygons[
      polygonIndex
    ].coordinates = triggeredPolygon;

    setImages(newImages);
  };

  const addClick = (click: modelInputProps) => {
    setClicks((prev) => [...prev, click]);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Control') {
      setIsCtrlKeyPressed(true);
    }
  };

  const handleKeyUp = (e: any) => {
    if (e.key === 'Control') {
      setIsCtrlKeyPressed(false);
    }
  };

  const addImages = (newImages: SamImage[]) => {
    setImages([...images, ...newImages]);
  };

  const removeImages = (indexes: number[]) => {
    setImages(images.filter((_, i) => !indexes.includes(i)));
  };

  const replaceImage = (image: SamImage, index: number) => {
    const newImages = [...images];
    newImages[index] = image;
    setImages(newImages);
  };

  const addNewNodeToSelection = (index: number) => {
    setSelectedNodesIndexes([...selectedNodesIndexes, index]);
  };

  const addLabel = (label: Label) => {
    setLabels((prev) => [...prev, label]);
  };

  const removeLabel = (index: number) => {
    setLabels((prev) => prev.filter((_, i) => i !== index));

    // Remove the label from all of the polygons
    setImages(
      images.map((img) => {
        return {
          ...img,
          masks: img.masks.map((mask) => {
            return {
              ...mask,
              polygons: mask.polygons.map((poly: any) => {
                let lbl = null;
                if (poly.label === null) {
                  lbl = null;
                } else if (labels[index].id === poly.label.id) {
                  lbl = null;
                } else {
                  lbl = poly.label;
                }

                return {
                  ...poly,
                  label: lbl,
                };
              }),
            };
          }),
        };
      })
    );
  };

  const replaceLabel = (index: number, newLabel: Label) => {
    setLabels((prev) =>
      prev.map((label, i) => (i === index ? newLabel : label))
    );
  };

  const replacePolygon = (
    imageIndex: number,
    maskIndex: number,
    polygonIndex: number,
    polygon: Polygon
  ) => {
    const newImages = [...images];
    newImages[imageIndex].masks[maskIndex].polygons[polygonIndex] = polygon;
    setImages(newImages);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        clicks: {
          clicks,
          setClicks,
          addClick,
        },
        previewClicks: {
          previewClicks,
          setPreviewClicks,
        },
        image: {
          image,
          setImage,
        },
        maskImg: {
          maskImg,
          setMaskImg,
        },
        previewMaskImg: {
          previewMaskImg,
          setPreviewMaskImg,
        },
        pressedKeys: {
          isCtrlKeyPressed,
        },
        masks: {
          masks,
          setMasks: setMasksOfCurrentImage,
          addMask,
          replaceMask,
        },
        action: {
          action,
          setAction,
        },
        polygons: {
          polygons,
          setPolygons,
          removePolygonNodes,
          addNodeAfterSpecificNode,
          replacePolygon,
        },
        selectedPolygonIndex: {
          selectedPolygonIndex,
          setSelectedPolygonIndex,
        },
        selectedMaskIndex: {
          selectedMaskIndex,
          setSelectedMaskIndex,
        },
        tensorAfterManualEditions: {
          tensorAfterManualEditions,
          setTensorAfterManualEditions,
        },
        boundingBox: {
          boundingBox,
          setBoundingBox,
        },
        maskAdditionType: {
          maskAdditionType,
          setMaskAdditionType,
        },
        images: {
          images,
          addImages,
          removeImages,
          replaceImage,
          setImages,
          currentImageIndex,
          setCurrentImageIndex,
        },
        allowedPolygonActions: {
          isNodeSelectionAllowed,
          setIsNodeSelectionAllowed,
          isNodeMovementAllowed,
          setIsNodeMovementAllowed,
          isNodeCreationAllowed,
          setIsNodeCreationAllowed,
          isPolygonCreationAllowed,
          setIsPolygonCreationAllowed,
        },
        selectedNodesIndexes: {
          selectedNodesIndexes,
          setSelectedNodesIndexes,
          addNewNodeToSelection,
        },
        labels: {
          labels,
          setLabels,
          addLabel,
          removeLabel,
          replaceLabel,
          currentLabel,
          setCurrentLabel,
        },
        canvasRef,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
