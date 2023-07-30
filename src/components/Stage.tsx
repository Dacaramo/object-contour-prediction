import { useContext, useEffect, useRef } from 'react';
import * as _ from 'underscore';
import Tool from './Tool/Tool';
import { BoundingBox, Polygon, modelInputProps } from '../helpers/Interfaces';
import AppContext from '../contexts/createContext';
import { 
  getBoundingBox, 
  isCoordinateInsideBbox, 
  isCoordinateInsidePolygon
} from '../helpers/linearAlgebraUtils';
import { polygonsToOnnxMask } from '../helpers/openComputerVisionUtils';
import { pointToLineDistance } from '../helpers/linearAlgebraUtils';
import { drawRect, drawPreviewPoint } from '../helpers/canvasDrawing';
import { drawPolygons } from '../helpers/canvasDrawing';
import { Tensor } from 'onnxruntime-web';
import ToolBar from './ToolBar/ToolBar';

const Stage = () => {
  const {
    clicks: { clicks, addClick },
    previewClicks: { setPreviewClicks },
    image: { image },
    previewMaskImg: { setPreviewMaskImg },
    masks: { setMasks, replaceMask, addMask },
    action: { action },
    selectedMaskIndex: { selectedMaskIndex, setSelectedMaskIndex },
    selectedPolygonIndex: { selectedPolygonIndex, setSelectedPolygonIndex },
    tensorAfterManualEditions: {
      setTensorAfterManualEditions,
    },
    boundingBox: { boundingBox, setBoundingBox },
    maskAdditionType: { maskAdditionType },
    images: { images, currentImageIndex },
    allowedPolygonActions: {
      isNodeSelectionAllowed,
      isNodeMovementAllowed,
      isNodeCreationAllowed,
      isPolygonCreationAllowed,
    },
    selectedNodesIndexes: {
      selectedNodesIndexes,
      setSelectedNodesIndexes,
      addNewNodeToSelection,
    },
    polygons: { addNodeAfterSpecificNode },
    labels: { setCurrentLabel },
    canvasRef,
  } = useContext(AppContext)!;

  const bbox = useRef<BoundingBox>({
    topLeftCorner: {
      x: -1,
      y: -1,
    },
    bottomRightCorner: {
      x: -1,
      y: -1,
    },
  });
  const nodeIndex = useRef<number>(-1);
  const polygon = useRef<Polygon>({
    coordinates: [],
    label: null,
  });
  const tempPolygon = useRef<Polygon>({
    coordinates: [],
    label: null,
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!image) return;
    if (currentImageIndex === null) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, image.width, image.height);
    ctx.drawImage(image, 0, 0);

    // masks.forEach((mask) => {
    //   if (mask.bbox) drawRect(canvas, mask.bbox);
    // });

    images[currentImageIndex].masks.forEach((mask, i) => {
      let index = -1;
      if (action === 'polygon-edit' && i === selectedMaskIndex) {
        index = selectedPolygonIndex;
      }

      drawPolygons(canvas, mask.polygons, index, selectedNodesIndexes);
    });
  }, [
    image,
    images,
    selectedMaskIndex,
    selectedPolygonIndex,
    selectedNodesIndexes,
  ]);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [
    selectedMaskIndex,
    selectedPolygonIndex,
    isPolygonCreationAllowed,
    currentImageIndex,
  ]);

  useEffect(() => {
    setSelectedNodesIndexes([]);
  }, [currentImageIndex, selectedMaskIndex, selectedPolygonIndex]);

  const getClick = (
    scaledX: number,
    scaledY: number,
    unscaledX: number,
    unscaledY: number,
    purpose: 'increase' | 'decrease'
  ): modelInputProps => {
    const clickType = purpose === 'increase' ? 1 : 0;
    return { scaledX, scaledY, unscaledX, unscaledY, clickType };
  };

  const handleMouseMove = _.throttle((e: any) => {
    const el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    const unscaledX = e.clientX - rect.left;
    const unscaledY = e.clientY - rect.top;
    const imageScale = image ? image.width / el.offsetWidth : 1;
    const scaledX = unscaledX * imageScale;
    const scaledY = unscaledY * imageScale;
    const clickPurpose = e.ctrlKey ? 'decrease' : 'increase';
    const click = getClick(
      scaledX,
      scaledY,
      unscaledX,
      unscaledY,
      clickPurpose
    );

    const clickedCoordinate = { x: scaledX, y: scaledY };

    if (action === 'mask-add') {
      if (maskAdditionType === 'point') {
        if (click) setPreviewClicks([...clicks, click]);
      } else if (maskAdditionType === 'bbox') {
        if (
          bbox.current.topLeftCorner.x === -1 &&
          bbox.current.topLeftCorner.y === -1
        ) {
          return;
        }
        if (currentImageIndex === null) return;

        // Define the bottom right corner of the bbox
        bbox.current.bottomRightCorner = {
          x: clickedCoordinate.x,
          y: clickedCoordinate.y,
        };

        const canvas = canvasRef.current;

        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Clean and redraw all that was already drawn + the current bbox
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.drawImage(image, 0, 0);

        images[currentImageIndex].masks.forEach((mask) => {
          drawPolygons(canvasRef.current!, mask.polygons, -1, []);
        });

        drawRect(canvas, bbox.current);
      }
    }
    if (action === 'mask-edit') {
      if (click) setPreviewClicks([...clicks, click]);
    }
    if (action === 'polygon-edit') {
      if (isNodeMovementAllowed) {
        if (nodeIndex.current > -1) {
          if (currentImageIndex === null) return;

          const averagePosition = { x: 0, y: 0 };
          for (const index of selectedNodesIndexes) {
            averagePosition.x += polygon.current.coordinates[index].x;
            averagePosition.y += polygon.current.coordinates[index].y;
          }
          averagePosition.x /= selectedNodesIndexes.length;
          averagePosition.y /= selectedNodesIndexes.length;

          const offsetX = clickedCoordinate.x - averagePosition.x;
          const offsetY = clickedCoordinate.y - averagePosition.y;

          for (const index of selectedNodesIndexes) {
            polygon.current.coordinates[index].x += offsetX;
            polygon.current.coordinates[index].y += offsetY;
          }

          const newPolygons = [
            ...images[currentImageIndex].masks[selectedMaskIndex].polygons,
          ];
          newPolygons[selectedPolygonIndex] = polygon.current;

          if (!canvasRef.current || !image) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          if (!ctx) return;

          ctx.clearRect(0, 0, image.width, image.height);
          ctx.drawImage(image, 0, 0);

          images[currentImageIndex].masks.forEach((mask, i) => {
            drawPolygons(
              canvasRef.current!,
              i === selectedMaskIndex ? newPolygons : mask.polygons,
              i === selectedMaskIndex ? selectedPolygonIndex : -1,
              i === selectedMaskIndex ? selectedNodesIndexes : []
            );
          });

          replaceMask(selectedMaskIndex, {
            ...images[currentImageIndex].masks[selectedMaskIndex],
            werePolygonsEditedManually: true,
          });
        }
      } else if (isNodeCreationAllowed) {
        if (currentImageIndex === null) return;
        if (selectedMaskIndex === -1 || selectedPolygonIndex === -1) return;

        const threshold = 5;

        const canvas = canvasRef.current;

        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Clean and redraw all that was already drawn
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.drawImage(image, 0, 0);

        images[currentImageIndex].masks.forEach((mask, j) => {
          drawPolygons(
            canvasRef.current!,
            mask.polygons,
            j === selectedMaskIndex ? selectedPolygonIndex : -1,
            []
          );
        });

        images[currentImageIndex].masks.forEach((mask) => {
          mask.polygons.forEach((poly) => {
            // Iterate over line segments
            for (let i = 0; i < poly.coordinates.length; i++) {
              const p1 = poly.coordinates[i];
              const p2 = poly.coordinates[(i + 1) % poly.coordinates.length];

              // Calculate the distance between the mouse position and the segment delimited by both points
              const distance = pointToLineDistance(
                clickedCoordinate.x,
                clickedCoordinate.y,
                p1.x,
                p1.y,
                p2.x,
                p2.y
              );

              if (distance <= threshold) {
                // Calculate the position of the preview point inside the line segment
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const t =
                  ((clickedCoordinate.x - p1.x) * dx +
                    (clickedCoordinate.y - p1.y) * dy) /
                  (dx * dx + dy * dy);
                const previewX = p1.x + dx * t;
                const previewY = p1.y + dy * t;

                drawPreviewPoint(canvas, { x: previewX, y: previewY });

                break;
              }
            }
          });
        });
      } else if (isPolygonCreationAllowed) {
        if (currentImageIndex === null) return;

        const canvas = canvasRef.current;

        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Clean and redraw all that was already drawn
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.drawImage(image, 0, 0);

        images[currentImageIndex].masks.forEach((mask) => {
          if (
            mask.polygons.length === 1 &&
            mask.polygons[0].coordinates.length === 0
          ) {
            return;
          }
          drawPolygons(canvasRef.current!, mask.polygons, -1, []);
        });

        const previousNodes = [...tempPolygon.current.coordinates];
        previousNodes.push({
          x: clickedCoordinate.x,
          y: clickedCoordinate.y,
        });
        drawPolygons(
          canvas,
          [{ coordinates: previousNodes, label: null }],
          -1,
          []
        );
      }
    }
  }, 15);

  const handleMouseClick = (e: any) => {
    const rect = e.target.getBoundingClientRect();
    const unscaledX = e.clientX - rect.left;
    const unscaledY = e.clientY - rect.top;
    const imageScale = image ? image.width / e.target.offsetWidth : 1;
    const scaledX = unscaledX * imageScale;
    const scaledY = unscaledY * imageScale;
    const clickPurpose = e.ctrlKey ? 'decrease' : 'increase';
    const click = getClick(
      scaledX,
      scaledY,
      unscaledX,
      unscaledY,
      clickPurpose
    );

    const clickedCoordinate = { x: scaledX, y: scaledY };

    if (action === 'mask-add') {
      if (maskAdditionType === 'point') {
        addClick(click);
      }
    } else if (action === 'mask-edit') {
      if (boundingBox) {
        if (isCoordinateInsideBbox(clickedCoordinate, boundingBox)) {
          addClick(click);
        }
      } else {
        addClick(click);
      }
    } else if (action === 'polygon-edit') {
      if (currentImageIndex === null) return;

      let isInsidePolygon = false;
      images[currentImageIndex].masks.forEach((currentMask, i) => {
        currentMask.polygons.forEach((currentPolygon, j) => {
          if (
            isCoordinateInsidePolygon(
              clickedCoordinate,
              currentPolygon.coordinates
            )
          ) {
            isInsidePolygon = true;
            polygon.current = currentPolygon;
            setSelectedMaskIndex(i);
            setSelectedPolygonIndex(j);
            setCurrentLabel(
              currentPolygon.label ? currentPolygon.label.name : ''
            );
            // setAction('polygon-edit');
          }
        });
      });

      if (isNodeSelectionAllowed) {
        if (selectedMaskIndex > -1 && selectedPolygonIndex > -1) {
          if (!canvasRef.current) return;
          if (currentImageIndex === null) return;

          if (e.ctrlKey && e.shiftKey) {
            if (
              isCoordinateInsidePolygon(
                clickedCoordinate,
                polygon.current.coordinates
              )
            ) {
              setSelectedNodesIndexes(
                polygon.current.coordinates.map((_, i) => i)
              );
            }
          } else {
            let dx: number, dy: number, d: number;
            images[currentImageIndex].masks[selectedMaskIndex].polygons[
              selectedPolygonIndex
            ].coordinates.forEach(({ x, y }, i) => {
              dx = Math.abs(clickedCoordinate.x - x);
              dy = Math.abs(clickedCoordinate.y - y);
              d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

              if (d < 5) {
                if (e.ctrlKey) {
                  addNewNodeToSelection(i);
                } else {
                  setSelectedNodesIndexes([i]);
                }
                return;
              }
            });
          }
        }
      }

      if (isNodeCreationAllowed) {
        if (currentImageIndex === null) return;
        if (selectedMaskIndex === -1 || selectedPolygonIndex === -1) return;

        const threshold = 5;

        images[currentImageIndex].masks.forEach((mask) => {
          mask.polygons.forEach((poly) => {
            // Iterate over line segments
            for (let i = 0; i < poly.coordinates.length; i++) {
              const p1 = poly.coordinates[i];
              const p2 = poly.coordinates[(i + 1) % poly.coordinates.length];

              // Calculate the distance between the mouse position and the segment delimited by both points
              const distance = pointToLineDistance(
                clickedCoordinate.x,
                clickedCoordinate.y,
                p1.x,
                p1.y,
                p2.x,
                p2.y
              );

              if (distance <= threshold) {
                // Calculate the position of the preview point inside the line segment
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const t =
                  ((clickedCoordinate.x - p1.x) * dx +
                    (clickedCoordinate.y - p1.y) * dy) /
                  (dx * dx + dy * dy);
                const previewX = p1.x + dx * t;
                const previewY = p1.y + dy * t;

                addNodeAfterSpecificNode(
                  { x: previewX, y: previewY },
                  i,
                  selectedMaskIndex,
                  selectedPolygonIndex
                );

                break;
              }
            }
          });
        });
      } else if (isPolygonCreationAllowed) {
        tempPolygon.current.coordinates.push({
          x: clickedCoordinate.x,
          y: clickedCoordinate.y,
        });
      }

      if (!isInsidePolygon) {
        if (selectedMaskIndex > -1 || selectedPolygonIndex > -1) {
          const currentMask =
            images[currentImageIndex].masks[selectedMaskIndex];
          const currentPolygon = currentMask.polygons[selectedPolygonIndex];

          if (!image) return;

          const onnxMask = polygonsToOnnxMask(
            [currentPolygon],
            image.width,
            image.height
          );

          const bBox = getBoundingBox(currentPolygon.coordinates);

          if (!bBox) return;

          const tensor = new Tensor('float32', onnxMask, [1, 1, 256, 256]);

          // setBoundingBox(bBox);

          setTensorAfterManualEditions(tensor);
        }

        // setSelectedMaskIndex(-1);
        // setSelectedPolygonIndex(-1);
        // setAction('none');
      }
    }
  };

  const handleMouseDown = (e: any) => {
    const rect = e.target.getBoundingClientRect();
    const unscaledX = e.clientX - rect.left;
    const unscaledY = e.clientY - rect.top;
    const imageScale = image ? image.width / e.target.offsetWidth : 1;
    const scaledX = unscaledX * imageScale;
    const scaledY = unscaledY * imageScale;
    const clickedCoordinate = { x: scaledX, y: scaledY };

    if (action === 'mask-add') {
      if (maskAdditionType === 'bbox') {
        // Define the top left corner of the bbox
        bbox.current.topLeftCorner = {
          x: clickedCoordinate.x,
          y: clickedCoordinate.y,
        };
      }
    } else if (action === 'polygon-edit') {
      if (selectedMaskIndex > -1 && selectedPolygonIndex > -1) {
        if (!canvasRef.current) return;
        if (currentImageIndex === null) return;

        let dx: number, dy: number, d: number;
        images[currentImageIndex].masks[selectedMaskIndex].polygons[
          selectedPolygonIndex
        ].coordinates.forEach(({ x, y }, i) => {
          if (selectedNodesIndexes.includes(i)) {
            dx = Math.abs(clickedCoordinate.x - x);
            dy = Math.abs(clickedCoordinate.y - y);
            d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

            if (d <= 5) {
              nodeIndex.current = i;
              return;
            }
          }
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (action === 'mask-add') {
      if (maskAdditionType !== 'bbox') return;
      if (
        bbox.current.topLeftCorner.x === bbox.current.bottomRightCorner.x &&
        bbox.current.topLeftCorner.y === bbox.current.bottomRightCorner.y
      ) {
        return;
      }

      setBoundingBox(bbox.current);

      // Restart the bbox for new drawing
      bbox.current = {
        topLeftCorner: {
          x: -1,
          y: -1,
        },
        bottomRightCorner: {
          x: -1,
          y: -1,
        },
      };
    } else if (action === 'polygon-edit') {
      if (selectedMaskIndex > -1 && selectedPolygonIndex > -1) {
        if (currentImageIndex === null) return;

        const newPolygons = [
          ...images[currentImageIndex].masks[selectedMaskIndex].polygons,
        ];
        newPolygons[selectedPolygonIndex] = polygon.current;

        // replaceMask(selectedMaskIndex, {
        //   ...images[currentImageIndex].masks[selectedMaskIndex],
        //   polygons: newPolygons,
        // });

        nodeIndex.current = -1;
      }
    }
  };

  const handleMouseOut = () => {
    setPreviewMaskImg(null);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'd') {
      if (selectedMaskIndex === -1 || selectedPolygonIndex === -1) return;
      if (currentImageIndex === null) return;

      const newPolygons = images[currentImageIndex].masks[
        selectedMaskIndex
      ].polygons.filter((_, i) => i !== selectedPolygonIndex);
      const newMasks = images[currentImageIndex].masks.map((mask, i) => {
        if (i !== selectedMaskIndex) return mask;
        else return { ...mask, polygons: newPolygons };
      });

      setMasks(newMasks);

      setSelectedMaskIndex(-1);
      setSelectedPolygonIndex(-1);
      // setAction('none');
    } else if (e.key === 'Enter') {
      if (isPolygonCreationAllowed) {
        if (currentImageIndex === null) return;

        const newMask = {
          image: new Image(),
          polygons: [{ ...tempPolygon.current }],
          clicks: [],
          bbox: null,
          werePolygonsEditedManually: true,
        };

        addMask(newMask);
        setSelectedMaskIndex(-1);
        setSelectedPolygonIndex(-1);

        tempPolygon.current = {
          coordinates: [],
          label: null,
        };
      }
    }
  };

  return (
    <div
      style={{ width: '80%', height: '80%' }}
      className={'d-flex justify-content-center align-items-center'}
    >
      <div
        className={'h-100 position-relative d-flex flex-column justify-content-start align-items-center'}
      >
        <div className='mb-2'>
          <ToolBar />
        </div>
        <Tool
          handleMouseMove={handleMouseMove}
          handleMouseClick={handleMouseClick}
          handleMouseOut={handleMouseOut}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default Stage;
