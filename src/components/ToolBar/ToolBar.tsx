import { FC, useContext, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppContext, { MaskAdditionType } from '../../contexts/createContext';
import {
  gray,
  secondary,
} from '../../constants/colors';
import {
  faArrowPointer,
  faCircleCheck,
  faCircleDot,
  faCircleMinus,
  faCircleNodes,
  faCirclePlus,
  faCircleXmark,
  faUpDownLeftRight,
  faVectorSquare,
} from '@fortawesome/free-solid-svg-icons';
import { drawPolygons, drawRect } from '../../helpers/canvasDrawing';
import VerticalSeparator from '../VerticalSeparator/VerticalSeparator';
import Dropdown from 'react-bootstrap/Dropdown';
import { Label } from '../../contexts/context';

interface Props {}

const ToolBar: FC<Props> = () => {
  const {
    clicks: { clicks, setClicks },
    maskImg: { maskImg, setMaskImg },
    previewMaskImg: { previewMaskImg, setPreviewMaskImg },
    masks: { addMask },
    action: { action, setAction },
    polygons: { polygons, setPolygons, removePolygonNodes, replacePolygon },
    selectedMaskIndex: { selectedMaskIndex, setSelectedMaskIndex },
    selectedPolygonIndex: { selectedPolygonIndex, setSelectedPolygonIndex },
    maskAdditionType: { maskAdditionType, setMaskAdditionType },
    boundingBox: { boundingBox, setBoundingBox },
    image: { image },
    images: {
      images,
      currentImageIndex,
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
    },
    labels: {
      labels,
      currentLabel,
      setCurrentLabel,
    },
    canvasRef,
  } = useContext(AppContext)!;

  const iconSize = 'lg';
  const enabledIconColor = secondary;
  const disabledIconColor = gray;

  useEffect(() => {
    if (selectedNodesIndexes.length === 0) {
      setIsNodeMovementAllowed(false);
    }
  }, [selectedNodesIndexes]);

  const handleClickOnAddMask = (maskAdditionType: MaskAdditionType) => {
    setAction('mask-add');
    setMaskAdditionType(maskAdditionType);
  };

  const handleClickOnConfirmMaskAddition = () => {
    if (!maskImg) return;
    addMask({
      image: maskImg,
      polygons,
      clicks,
      bbox: boundingBox,
      werePolygonsEditedManually: false,
    });

    setMaskImg(null);
    setPreviewMaskImg(null);
    setPolygons([]);
    setClicks([]);
    setBoundingBox(null);
    setMaskAdditionType('none');
  };

  useEffect(() => {
    console.log('@@@@@previewMaskImg', previewMaskImg);
  }, [previewMaskImg]);

  const handleClickOnDismissMaskAddition = () => {
    if (currentImageIndex === null) return;

    setMaskImg(null);
    setPreviewMaskImg(null);
    setPolygons([]);
    setClicks([]);
    setBoundingBox(null);
    setMaskAdditionType('none');

    if (action === 'mask-add') {
      const canvas = canvasRef.current;

      if (!canvas || !image) return;

      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(0, 0, image.width, image.height);
      ctx.drawImage(image, 0, 0);

      images[currentImageIndex].masks.forEach((mask) => {
        if (mask.bbox) drawRect(canvas, mask.bbox);
      });

      images[currentImageIndex].masks.forEach((mask) => {
        drawPolygons(canvasRef.current!, mask.polygons, -1, []);
      });
    }
  };

  const handleClickOnAllowNodeSelection = () => {
    if (currentImageIndex === null) return;

    if (isNodeSelectionAllowed === false) {
      setIsNodeSelectionAllowed(true);
    } else {
      setIsNodeSelectionAllowed(false);
      setIsNodeMovementAllowed(false);
      setIsPolygonCreationAllowed(false);
      setSelectedNodesIndexes([]);

      const canvas = canvasRef.current;

      if (!canvas || !image) return;

      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(0, 0, image.width, image.height);
      ctx.drawImage(image, 0, 0);

      images[currentImageIndex].masks.forEach((mask) => {
        if (mask.bbox) drawRect(canvas, mask.bbox);
      });

      images[currentImageIndex].masks.forEach((mask) => {
        drawPolygons(canvasRef.current!, mask.polygons, -1, []);
      });
    }
  };

  const handleClickOnAllowNodeMovement = () => {
    if (isNodeMovementAllowed) {
      setIsNodeMovementAllowed(false);
    } else {
      setIsNodeMovementAllowed(true);
      setIsPolygonCreationAllowed(false);
    }
  };

  const handleClickOnAllowNodeCreation = () => {
    setIsNodeCreationAllowed(isNodeCreationAllowed === false ? true : false);
  };

  const handleClickOnAllowPolygonCreation = () => {
    if (!isPolygonCreationAllowed) {
      setSelectedMaskIndex(-1);
      setSelectedPolygonIndex(-1);

      setIsPolygonCreationAllowed(true);
    } else {
      setIsPolygonCreationAllowed(false);
    }
  };

  const handleClickOnRemoveSelectedNodes = () => {
    removePolygonNodes(selectedNodesIndexes);
    setSelectedNodesIndexes([]);
    setSelectedMaskIndex(-1);
    setSelectedPolygonIndex(-1);
  };

  const handleLabelSelection = (label: Label) => {
    setCurrentLabel(label.name);

    if (selectedMaskIndex > -1 && selectedPolygonIndex > -1) {
      if (currentImageIndex === null) return;

      replacePolygon(
        currentImageIndex,
        selectedMaskIndex,
        selectedPolygonIndex,
        {
          ...images[currentImageIndex].masks[selectedMaskIndex].polygons[
            selectedPolygonIndex
          ],
          label,
        }
      );
    }
  };

  const handleActionSelection = (eventKey: string | null) => {
    if (eventKey === 'Mask creation') {
      if (currentImageIndex === null) return;

      setAction('mask-add');
      setSelectedNodesIndexes([]);
      setIsNodeSelectionAllowed(false);
      setIsNodeMovementAllowed(false);
      setIsNodeCreationAllowed(false);
      setIsPolygonCreationAllowed(false);

      const canvas = canvasRef.current;

      if (!canvas || !image) return;

      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(0, 0, image.width, image.height);
      ctx.drawImage(image, 0, 0);

      images[currentImageIndex].masks.forEach((mask) => {
        if (mask.bbox) drawRect(canvas, mask.bbox);
      });

      images[currentImageIndex].masks.forEach((mask) => {
        drawPolygons(canvasRef.current!, mask.polygons, -1, []);
      });
    } else if (eventKey === 'Polygon edition') {
      setAction('polygon-edit');
    }
  };

  return (
    <div
      style={{ height: '50px' }}
      className='d-flex flex-row justify-content-center align-items-center p-2 bg-light border-secondary border'
    >
      <Dropdown onSelect={handleActionSelection}>
        <Dropdown.Toggle
          size='sm'
          className='mr-2'
          variant='outline-secondary'
          id='dropdown-basic'
          disabled={currentImageIndex === null}
        >
          {action === 'none' && 'Choose an action'}
          {action === 'mask-add' && 'Mask creation'}
          {action === 'polygon-edit' && 'Polygon edition'}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {['Mask creation', 'Polygon edition'].map((lbl) => {
            return (
              <Dropdown.Item
                key={lbl}
                eventKey={lbl}
              >
                {lbl}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
      <VerticalSeparator />
      <button
        className={`ml-2 p-1 border ${
          action === 'mask-add' &&
          maskAdditionType === 'point' &&
          currentImageIndex !== null
            ? 'border-secondary'
            : 'border-light'
        }`}
        onClick={() => handleClickOnAddMask('point')}
        disabled={
          (action === 'mask-add' && maskAdditionType === 'bbox') ||
          currentImageIndex === null ||
          action === 'polygon-edit' ||
          !images[currentImageIndex].hasEmbedding
        }
      >
        <FontAwesomeIcon
          icon={faCircleDot}
          size={iconSize}
          color={
            (action === 'mask-add' && maskAdditionType === 'bbox') ||
            currentImageIndex === null ||
            action === 'polygon-edit' ||
            !images[currentImageIndex].hasEmbedding
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={`p-1 ml-2 border ${
          action === 'mask-add' &&
          maskAdditionType === 'bbox' &&
          currentImageIndex !== null
            ? 'border-secondary'
            : 'border-light'
        }`}
        onClick={() => handleClickOnAddMask('bbox')}
        disabled={
          (action === 'mask-add' && maskAdditionType === 'point') ||
          currentImageIndex === null ||
          action === 'polygon-edit' ||
          !images[currentImageIndex].hasEmbedding
        }
      >
        <FontAwesomeIcon
          icon={faVectorSquare}
          size={iconSize}
          color={
            (action === 'mask-add' && maskAdditionType === 'point') ||
            currentImageIndex === null ||
            action === 'polygon-edit' ||
            !images[currentImageIndex].hasEmbedding
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={'p-1 ml-2 border border-light'}
        onClick={handleClickOnConfirmMaskAddition}
        disabled={
          action !== 'mask-add' ||
          (currentImageIndex !== null &&
            !images[currentImageIndex].hasEmbedding) ||
          (clicks.length === 0 && boundingBox === null)
        }
      >
        <FontAwesomeIcon
          icon={faCircleCheck}
          size={iconSize}
          color={
            action !== 'mask-add' ||
            (currentImageIndex !== null &&
              !images[currentImageIndex].hasEmbedding) ||
            (clicks.length === 0 && boundingBox === null)
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={'p-1 ml-2 mr-2 border border-light'}
        onClick={handleClickOnDismissMaskAddition}
        disabled={
          action !== 'mask-add' ||
          (currentImageIndex !== null &&
            !images[currentImageIndex].hasEmbedding) ||
          (clicks.length === 0 && boundingBox === null)
        }
      >
        <FontAwesomeIcon
          icon={faCircleXmark}
          size={iconSize}
          color={
            action !== 'mask-add' ||
            (currentImageIndex !== null &&
              !images[currentImageIndex].hasEmbedding) ||
            (clicks.length === 0 && boundingBox === null)
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <VerticalSeparator />
      <button
        className={`p-1 ml-2 border ${
          isPolygonCreationAllowed ? 'border-secondary' : 'border-light'
        }`}
        onClick={handleClickOnAllowPolygonCreation}
        disabled={
          action !== 'polygon-edit' ||
          isNodeSelectionAllowed ||
          isNodeMovementAllowed ||
          isNodeCreationAllowed
        }
      >
        <FontAwesomeIcon
          icon={faCircleNodes}
          size={iconSize}
          color={
            action !== 'polygon-edit' ||
            isNodeSelectionAllowed ||
            isNodeMovementAllowed ||
            isNodeCreationAllowed
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={`p-1 ml-2 border ${
          isNodeSelectionAllowed ? 'border-secondary' : 'border-light'
        }`}
        onClick={handleClickOnAllowNodeSelection}
        disabled={
          action !== 'polygon-edit' ||
          isNodeCreationAllowed ||
          isPolygonCreationAllowed
        }
      >
        <FontAwesomeIcon
          icon={faArrowPointer}
          size={iconSize}
          color={
            action !== 'polygon-edit' ||
            isNodeCreationAllowed ||
            isPolygonCreationAllowed
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={`p-1 ml-2 border ${
          isNodeMovementAllowed ? 'border-secondary' : 'border-light'
        }`}
        onClick={handleClickOnAllowNodeMovement}
        disabled={
          action !== 'polygon-edit' || selectedNodesIndexes.length === 0
        }
      >
        <FontAwesomeIcon
          icon={faUpDownLeftRight}
          size={iconSize}
          color={
            action !== 'polygon-edit' || selectedNodesIndexes.length === 0
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={`p-1 ml-2 border ${
          isNodeCreationAllowed ? 'border-secondary' : 'border-light'
        }`}
        onClick={handleClickOnAllowNodeCreation}
        disabled={
          action !== 'polygon-edit' ||
          isNodeSelectionAllowed ||
          isNodeMovementAllowed ||
          isPolygonCreationAllowed
        }
      >
        <FontAwesomeIcon
          icon={faCirclePlus}
          size={iconSize}
          color={
            action !== 'polygon-edit' ||
            isNodeSelectionAllowed ||
            isNodeMovementAllowed ||
            isPolygonCreationAllowed
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <button
        className={'p-1 mx-2 border border-light'}
        onClick={handleClickOnRemoveSelectedNodes}
        disabled={
          action !== 'polygon-edit' || selectedNodesIndexes.length === 0
        }
      >
        <FontAwesomeIcon
          icon={faCircleMinus}
          size={iconSize}
          color={
            action !== 'polygon-edit' || selectedNodesIndexes.length === 0
              ? disabledIconColor
              : enabledIconColor
          }
        />
      </button>
      <VerticalSeparator />
      <Dropdown>
        <Dropdown.Toggle
          size='sm'
          className='ml-2'
          variant='outline-secondary'
          id='dropdown-basic'
          disabled={labels.length === 0}
        >
          {currentLabel !== '' ? currentLabel : 'Choose a label'}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {labels.map((lbl) => {
            return (
              <Dropdown.Item
                key={lbl.id}
                eventKey={lbl.name}
                onClick={() => handleLabelSelection(lbl)}
              >
                {lbl.name}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default ToolBar;
