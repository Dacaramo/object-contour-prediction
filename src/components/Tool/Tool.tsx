import { useContext, useEffect, useState } from 'react';
import AppContext from '../../contexts/createContext';
import { ToolProps } from '../../helpers/Interfaces';
import { drawPolygons } from '../../helpers/canvasDrawing';
import * as _ from 'underscore';

const Tool = ({
  handleMouseMove,
  handleMouseClick,
  handleMouseOut,
  handleMouseDown,
  handleMouseUp,
}: ToolProps) => {
  const [isSrcValid, setIsSrcValid] = useState<boolean>(false);
  const [isSrcValidationCompleted, setIsSrcValidationCompleted] =
    useState<boolean>(false);
  // Determine if we should shrink or grow the images to match the
  // width or the height of the page and setup a ResizeObserver to
  // monitor changes in the size of the page
  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);

  const {
    clicks: { clicks },
    image: { image },
    images: { images, currentImageIndex },
    maskImg: { maskImg },
    selectedPolygonIndex: { selectedPolygonIndex },
    selectedMaskIndex: { selectedMaskIndex },
    selectedNodesIndexes: { selectedNodesIndexes },
    previewMaskImg: { previewMaskImg },
    pressedKeys: { isCtrlKeyPressed },
    action: { action },
    maskAdditionType: { maskAdditionType },
    canvasRef,
  } = useContext(AppContext)!;

  const bodyElement = document.body;
  const cursorStyle =
    maskAdditionType === 'bbox'
      ? 'crosshair'
      : isCtrlKeyPressed
      ? 'no-drop'
      : 'cell';
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === bodyElement) {
        fitToPage();
      }
    }
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!image) return;
    if (currentImageIndex === null) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    images[currentImageIndex].masks.forEach((mask, i) => {
      let index = -1;
      if (action === 'polygon-edit' && i === selectedMaskIndex) {
        index = selectedPolygonIndex;
      }

      drawPolygons(canvas, mask.polygons, index, selectedNodesIndexes);
    });
  }, [image, isSrcValid, isSrcValidationCompleted]);

  useEffect(() => {
    fitToPage();
    resizeObserver.observe(bodyElement);
    return () => {
      resizeObserver.unobserve(bodyElement);
    };
  }, [image]);

  const fitToPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasAspectRation = canvas.width / canvas.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(canvasAspectRation > screenAspectRatio);
  };

  const handleValidSrc = () => {
    setIsSrcValid(true);
    setIsSrcValidationCompleted(true);
  };

  const handleInvalidSrc = () => {
    setIsSrcValid(false);
    setIsSrcValidationCompleted(true);
  };

  return (
    <>
      {image && (
        <img
          style={{ display: 'none', zIndex: -100, opacity: 0 }}
          className='position-absolute'
          src={image.src}
          onError={handleInvalidSrc}
          onLoad={handleValidSrc}
        />
      )}
      {image && !isSrcValidationCompleted && <span>Loading...</span>}
      {image &&
        isSrcValidationCompleted &&
        (!isSrcValid ? (
          <span>
            Image not found, please upload the image to /assets/data/ and try
            again
          </span>
        ) : (
          <canvas
            style={{
              zIndex: 0,
              cursor:
                maskAdditionType === 'none' || action === 'polygon-edit'
                  ? undefined
                  : cursorStyle,
            }}
            className={`${shouldFitToWidth ? 'w-100' : 'h-100'}`}
            width={image.width}
            height={image.height}
            ref={canvasRef}
            onClick={handleMouseClick}
            onMouseMove={handleMouseMove}
            onMouseOut={
              action === 'none' ? undefined : () => _.defer(handleMouseOut)
            }
            onTouchStart={action === 'none' ? undefined : handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          ></canvas>
        ))}
      {/* {image && (
        <img
          style={{ zIndex: 0 }}
          onClick={action === 'none' ? undefined : handleMouseClick}
          onMouseMove={action === 'none' ? undefined : handleMouseMove}
          onMouseOut={
            action === 'none' ? undefined : () => _.defer(handleMouseOut)
          }
          onTouchStart={action === 'none' ? undefined : handleMouseMove}
          src={image.src}
          className={`w-[800px] ${action === 'none' ? '' : cursorClass}`}
        ></img>
      )} */}
      {maskImg && action !== 'none' && action !== 'polygon-edit' && (
        <img
          style={{
            zIndex: 2,
            top: '50px',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
          src={maskImg.src}
          className={`${
            shouldFitToWidth ? 'w-100' : 'h-100'
          } position-absolute mt-2`}
        ></img>
      )}
      {previewMaskImg && action !== 'none' && action !== 'polygon-edit' && (
        <img
          style={{
            zIndex: 1,
            opacity: isCtrlKeyPressed ? 0 : 0.6,
            top: '50px',
            pointerEvents: 'none',
          }}
          src={previewMaskImg.src}
          className={`${
            shouldFitToWidth ? 'w-100' : 'h-100'
          } position-absolute mt-2`}
        ></img>
      )}
      {/* {masks &&
        action === 'none' &&
        masks.map((mask, i) => {
          return (
            <img
              key={i}
              style={{ zIndex: 2 }}
              src={mask.image.src}
              className={`position-absolute top-[50px] mt-2 opacity-60 pointer-events-none`}
            />
          );
        })} */}
      {clicks.map(({ unscaledX, unscaledY, clickType }, i) => {
        return (
          <div
            key={i}
            style={{
              zIndex: 4,
              position: 'absolute',
              left: unscaledX - 15,
              top: unscaledY - 15,
              width: 30,
              height: 30,
              borderWidth: 5,
              borderRadius: 50,
              backgroundColor: clickType === 1 ? 'green' : 'red',
              borderColor: 'yellow',
            }}
          />
        );
      })}
    </>
  );
};

export default Tool;
