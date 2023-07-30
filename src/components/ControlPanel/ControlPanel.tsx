import { FC, useContext, useState, ChangeEvent } from 'react';
import AppContext from '../../contexts/createContext';
import { Label, Mask } from '../../contexts/context';
import ImageListItem from './ImageListItem/ImageListItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileImport,
  faFileExport,
  faTags,
} from '@fortawesome/free-solid-svg-icons';
import { replaceFileExtension } from '../../helpers/strings';
import { gray, secondary } from '../../constants/colors';
import VerticalSeparator from '../VerticalSeparator/VerticalSeparator';
import { doesFileExist } from '../../helpers/fileHandling';
import LabelModal from '../LabelModal/LabelModal';
import DeletionAlert from '../DeletionAlert/DeletionAlert';

export type Action = 'polygon-edit' | 'mask-edit' | 'mask-add' | 'none';

interface Props {}

export interface SamImage {
  id: string;
  image: HTMLImageElement;
  masks: Mask[];
  hasEmbedding: boolean;
}

const ControlPanel: FC<Props> = () => {
  const [filename] = useState<string>('myGeoJSON');
  const [isAlertShowing, setIsAlertShowing] = useState<boolean>(false);
  const [isLabelModalShowing, setIsLabelModalShowing] =
    useState<boolean>(false);

  const {
    action: { setAction },
    selectedMaskIndex: { setSelectedMaskIndex },
    selectedPolygonIndex: { setSelectedPolygonIndex },
    images: {
      images,
      removeImages,
      setImages,
      currentImageIndex,
      setCurrentImageIndex,
    },
    labels: { labels, setLabels },
  } = useContext(AppContext)!;

  const iconSize = 'lg';
  const enabledIconColor = secondary;

  const handleClickOnImport = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = Array.from(e.target.files)[0];

    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const jsonStr = e.target?.result?.toString();
      if (typeof jsonStr === 'string') {
        const jsonObj = JSON.parse(jsonStr);

        setImages(
          await Promise.all(
            jsonObj.images.map(async (img: any) => {
              const imgObj = new Image();
              imgObj.src = img.path;
              const tokenizedPath = (img.path as string).split('/');
              imgObj.id = tokenizedPath[tokenizedPath.length - 1];

              const currentImageFeatures = jsonObj.features.filter(
                (feat: any) => {
                  return feat.properties.image === img.id;
                }
              );

              const polygonsArray = currentImageFeatures.map((feat: any) => {
                return {
                  coordinates: feat.geometry.coordinates[0]
                    .map((arr: any) => {
                      return { x: arr[0], y: arr[1] };
                    })
                    .filter(
                      (_: any, j: number) =>
                        j < feat.geometry.coordinates[0].length - 1
                    ),
                  label: feat.properties.label
                    ? ({
                        id: feat.properties.label,
                        name: jsonObj.labels.find(
                          (lbl: any) => lbl.id === feat.properties.label
                        ).name,
                      } as Label)
                    : null,
                };
              });

              return {
                id: img.id,
                image: imgObj,
                masks: [
                  {
                    image: new Image(),
                    clicks: [],
                    bbox: null,
                    polygons: polygonsArray,
                    werePolygonsEditedManually: true,
                  },
                ],
                hasEmbedding: img.path_embeddings
                  ? await doesFileExist(img.path_embeddings)
                  : false,
              } as SamImage;
            })
          )
        );

        setLabels(
          await Promise.all(
            jsonObj.labels.map((lbl: any) => {
              return lbl;
            })
          )
        );
      }
    };

    reader.readAsText(file);
  };

  const handleClickOnExport = () => {
    if (images.length === 0) return;

    const features = [];
    for (let k = 0; k < images.length; k++) {
      for (let i = 0; i < images[k].masks.length; i++) {
        for (let j = 0; j < images[k].masks[i].polygons.length; j++) {
          const oldPolygon = images[k].masks[i].polygons[j];
          const newPolygon = oldPolygon.coordinates.map(({ x, y }) => [x, y]);
          // Must add a closing coordinate so the polygon ends where it starts
          newPolygon.push([
            oldPolygon.coordinates[0].x,
            oldPolygon.coordinates[0].y,
          ]);
          /**
           * Should be passed inside another array because that extra array is
           * for specifying inner rings and outer rings. In this case there's only
           * an outer ring because we know that the program can't generate polygons
           * inside other polygons.
           */
          features.push({
            type: 'Feature',
            properties: {
              image: images[k].id,
              label: oldPolygon.label ? oldPolygon.label.id : undefined,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [newPolygon],
            },
          });
        }
      }
    }

    const imgs = images.map((img) => {
      return {
        id: img.id,
        path: img.image.src,
        path_embeddings: img.hasEmbedding
          ? `${replaceFileExtension(img.image.src, 'npy')}`
          : undefined,
      };
    });

    const lbls: any = labels.map((lbl) => {
      return {
        id: lbl.id,
        name: lbl.name,
      };
    });

    const projectObjToExport = {
      type: 'FeatureCollection',
      name: 'NAME',
      images: imgs,
      labels: lbls,
      features,
    };

    const projectAsStr = JSON.stringify(projectObjToExport);
    const projectAsBlob = new Blob([projectAsStr], {
      type: 'application/json',
    });
    const projectUrl = URL.createObjectURL(projectAsBlob);
    const link = document.createElement('a');
    link.href = projectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(projectUrl);
  };

  const handleClickOnConfirmDeletion = () => {
    if (currentImageIndex === null) return;
    removeImages([currentImageIndex]);
    setCurrentImageIndex(null);
    setIsAlertShowing(false);
  };

  const handleClickOnDismissDeletion = () => {
    setIsAlertShowing(false);
  };

  const handleClickOnListItem = (i: number) => {
    setCurrentImageIndex(i);
    setSelectedMaskIndex(-1);
    setSelectedPolygonIndex(-1);

    if (!images[i].hasEmbedding) {
      setAction('polygon-edit');
    } else {
      setAction('mask-add');
    }
  };

  const handleClickOnManageLabels = () => {
    setIsLabelModalShowing(true);
  };

  const handleClickOnCloseLabelModal = () => {
    setIsLabelModalShowing(false);
  };

  return (
    <>
      <div
        style={{ width: '20%', minWidth: '400px' }}
        className={'h-100 d-flex flex-col justify-content-start align-items-start bg-light border-secondary border'}
      >
        <div
          style={{ height: '40px' }}
          className='d-flex flex-row justify-content-start align-items-center p-2'
        >
          <label
            style={{ cursor: 'pointer' }}
            htmlFor='projectFileInput'
          >
            <FontAwesomeIcon
              style={{ cursor: 'pointer' }}
              icon={faFileImport}
              size={iconSize}
              color={enabledIconColor}
            />
          </label>
          <input
            type='file'
            style={{ opacity: 0, zIndex: -1, display: 'block' }}
            className='position-absolute'
            id='projectFileInput'
            title='Upload a project file (GeoJSON)'
            accept='application/JSON'
            onChange={handleClickOnImport}
          />
          <FontAwesomeIcon
            style={
              currentImageIndex === null
                ? { cursor: 'default' }
                : { cursor: 'pointer' }
            }
            className={'ml-2 mr-2'}
            icon={faFileExport}
            size={iconSize}
            color={`${currentImageIndex === null ? gray : secondary}`}
            onClick={handleClickOnExport}
          />
          {/* <VerticalSeparator /> */}
          {/* <label
            htmlFor='imageInput'
            className='ml-2 cursor-pointer'
          >
            <FontAwesomeIcon
              className='cursor-pointer'
              icon={faImages}
              size={iconSize}
              color={enabledIconColor}
            />
          </label>
          <input
            type='file'
            className='absolute opacity-0 -z-[1] block'
            id='imageInput'
            title='Upload an image'
            accept='image/*'
            multiple
            onChange={handleImageUpload}
          /> */}
          {/* <label
            htmlFor='imageFolderInput'
            className='ml-2 cursor-pointer'
          >
            <FontAwesomeIcon
              className='cursor-pointer'
              icon={faFolder}
              size={iconSize}
              color={enabledIconColor}
            />
          </label>
          <input
            type='file'
            className='absolute opacity-0 -z-[1] block'
            id='imageFolderInput'
            title='Upload a folder of images'
            accept='image/*'
            multiple
            //@ts-ignore
            webkitdirectory=''
            onChange={handleImageUpload}
          /> */}
          {/* <button
            onClick={handleClickOnStartDeletion}
            disabled={currentImageIndex === null}
          >
            <FontAwesomeIcon
              className='ml-2 mr-2'
              icon={faTrashCan}
              size={iconSize}
              color={
                currentImageIndex === null
                  ? disabledIconColor
                  : enabledIconColor
              }
            />
          </button> */}
          <VerticalSeparator />
          <FontAwesomeIcon
            style={{ cursor: 'pointer' }}
            className='ml-2'
            icon={faTags}
            size={iconSize}
            color={enabledIconColor}
            onClick={handleClickOnManageLabels}
          />
        </div>
        {isAlertShowing && currentImageIndex !== null && (
          <DeletionAlert
            itemToDeleteText={images[currentImageIndex].image.id}
            onClickConfirm={handleClickOnConfirmDeletion}
            onClickDismiss={handleClickOnDismissDeletion}
          />
        )}
        {images.map(({ image, hasEmbedding }, i) => {
          return (
            <ImageListItem
              key={image.id}
              name={image.id}
              isFirstIndex={i === 0}
              isLastIndex={i === images.length - 1}
              isSelected={i === currentImageIndex}
              hasError={!hasEmbedding}
              onClick={() => handleClickOnListItem(i)}
            />
          );
        })}
        {/* <span className='p-2'>
          <b>Masks</b>
        </span>
        {action === 'none' && (
          <>
            <div className='flex flex-row justify-start items-start flex-wrap p-2'>
              {currentImageIndex !== null &&
                images[currentImageIndex].masks.map((mask, i) => {
                  return (
                    <button
                      key={i}
                      className={`rounded mb-2 px-2 py-1 mr-2 ${
                        mask.werePolygonsEditedManually
                          ? 'bg-orange-200'
                          : 'bg-orange-400'
                      } ${
                        mask.werePolygonsEditedManually
                          ? ''
                          : 'hover:bg-orange-500'
                      } ${
                        mask.werePolygonsEditedManually
                          ? ''
                          : 'active:bg-orange-600'
                      }`}
                      onMouseEnter={() => handleMouseEnter(i)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClickOnIndex(i)}
                      disabled={mask.werePolygonsEditedManually}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              <button
                className='rounded px-2 py-1 bg-orange-400 hover:bg-orange-500 active:bg-orange-600'
                onClick={handleClickOnAdd}
              >
                +
              </button>
            </div>
            <form
              className='p-2'
              onSubmit={handleClickOnExport}
            >
              <span>
                <b>Export polygons to GeoJSON</b>
              </span>
              <br />
              <label htmlFor='filename-input'>
                Enter the desired filename:
              </label>
              <br />
              <input
                className='mt-2'
                id='filename-input'
                type='text'
                placeholder='filename'
                onChange={(e) => setFilename(e.target.value)}
              />
              <br />
              <button
                className='rounded px-2 py-1 ml-auto bg-green-500 text-slate-50 mt-2'
                type='submit'
              >
                Export
              </button>
            </form>
          </>
        )}
        {action === 'polygon-edit' && <p className='mb-2'>Editing polygon</p>}
        {action === 'polygon-edit' && (
          <div className='flex flex-row justify-end items-center'>
            <button
              className='rounded px-2 py-1 ml-auto bg-green-500 text-slate-50'
              onClick={handleClickOnDrawPolygonAsContour}
            >
              {'polygon->contour'}
            </button>
          </div>
        )}
        {action === 'mask-add' && (
          <p className='mb-2'>
            <em>Adding a mask</em>
          </p>
        )}
        {action === 'mask-add' &&
          clicks.length === 0 &&
          boundingBox === null && (
            <div className='mb-2'>
              <label htmlFor='point-radio'>
                <input
                  type='radio'
                  id='point-radio'
                  value='point'
                  checked={maskAdditionType === 'point'}
                  onChange={handleRadioButtonChange}
                />
                Point
              </label>
              <label
                className='ml-2'
                htmlFor='bbox-radio'
              >
                <input
                  type='radio'
                  id='bbox-radio'
                  value='bbox'
                  checked={maskAdditionType === 'bbox'}
                  onChange={handleRadioButtonChange}
                />
                Bounding box
              </label>
            </div>
          )}
        {action === 'mask-edit' && (
          <p className='mb-2'>Editing mask #{currentIndex + 1}</p>
        )}
        {(action === 'mask-add' || action === 'mask-edit') && (
          <div className='flex flex-row justify-end items-center'>
            <button
              className='rounded px-2 py-1 ml-auto bg-red-500 text-slate-50'
              onClick={handleClickOnDismiss}
            >
              ✕
            </button>
            <button
              className='rounded px-2 py-1 ml-2 bg-green-500 text-slate-50'
              onClick={() => handleClickOnConfirm(action)}
            >
              ✓
            </button>
          </div>
        )} */}
        {isLabelModalShowing && (
          <LabelModal
            isShowing={isLabelModalShowing}
            onClose={handleClickOnCloseLabelModal}
          />
        )}
      </div>
    </>
  );
};

export default ControlPanel;
