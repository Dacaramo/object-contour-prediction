import { InferenceSession, Tensor } from 'onnxruntime-web';
import { useContext, useEffect, useState } from 'react';
import { handleImageScale } from './helpers/scaleHelper';
import { modelScaleProps } from './helpers/Interfaces';
import { findPolygons } from './helpers/openComputerVisionUtils';
import { onnxMaskToImage } from './helpers/maskUtils';
import { modelData } from './helpers/onnxModelAPI';
import Stage from './components/Stage';
import AppContext from './contexts/createContext';
import ort from 'onnxruntime-web';
/* @ts-ignore */
import npyjs from 'npyjs';
import ControlPanel, { SamImage } from './components/ControlPanel/ControlPanel';
import { replaceFileExtension } from './helpers/strings';
import { v4 as uuidv4 } from 'uuid';
import bathroomImg from './assets/data/bathroom.jpg';
import breakfastImg from './assets/data/breakfast.jpg';
import flowersImg from './assets/data/flowers.jpg';
import fruitImg from './assets/data/fruit.jpg';
import jamImg from './assets/data/jam.jpg';
import ketoImg from './assets/data/keto.jpg';
import meetingImg from './assets/data/meeting.jpg';
import roomImg from './assets/data/room.jpg';
import shoesImg from './assets/data/shoes.jpg';
import statueImg from './assets/data/statue.jpg';

const modelPath = './sam_model.onnx';

const imagesSrcs = [
  bathroomImg,
  breakfastImg,
  flowersImg,
  fruitImg,
  jamImg,
  ketoImg,
  meetingImg,
  roomImg,
  shoesImg,
  statueImg
] 

const App = () => {
  const {
    clicks: { clicks },
    previewClicks: { previewClicks },
    image: { setImage },
    maskImg: { setMaskImg },
    previewMaskImg: { setPreviewMaskImg },
    pressedKeys: { isCtrlKeyPressed },
    polygons: { setPolygons },
    tensorAfterManualEditions: {
      tensorAfterManualEditions,
    },
    boundingBox: { boundingBox },
    images: { images, currentImageIndex, addImages },
  } = useContext(AppContext)!;
  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);
  // Image embedding tensor
  const [baseTensor, setBaseTensor] = useState<Tensor | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    if (currentImageIndex !== null) {
      // Initialize the ONNX model
      const initModel = async () => {
        try {
          if (!modelPath) return;
          const model = await InferenceSession.create(modelPath);
          setModel(model);
        } catch (e) {
          console.log(e);
        }
      };
      initModel();

      const loadImageAndTryEmbedding = async () => {
        // Load the image
        await loadImage(images[currentImageIndex].image.src);

        // Load the Segment Anything pre-computed embedding
        // Assuming the embedding is inside /assets/data/ and has the same name as the current image

        if (images[currentImageIndex].hasEmbedding) {
          const embedding = await loadNpyTensor(
            `/assets/data/${replaceFileExtension(
              images[currentImageIndex].image.id,
              'npy'
            )}`,
            'float32'
          );

          setBaseTensor(embedding);
        }
      };
      loadImageAndTryEmbedding();
    }
  }, [currentImageIndex]);

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks, previewClicks, boundingBox, isCtrlKeyPressed]);

  const loadImage = async (src: string) => {
    try {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width;
        img.height = height;
        setImage(img);
      };

      img.onerror = () => {
        setImage(img);
      };
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    console.log('@@@@@model', model);
  }, [model])

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    const npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    // console.log('@@@@@npArray.shape', npArray.shape);
    // @ts-ignore
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  const fetchImages = () => {
    const imgs = imagesSrcs.map((src) => {
      const img = new Image();
      img.src = src;
      const tokenizedPath = src.split('/');
      const filename = tokenizedPath[tokenizedPath.length - 1];
      img.id = filename;
      return img;
    })

    const samImgs = imgs.map((img) => {
      return {
        id: uuidv4(),
        image: img,
        masks: [],
        hasEmbedding: true,
      } as SamImage;
    });

    addImages(samImgs);
  };

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        baseTensor === null ||
        modelScale === null
      )
        return;
      else {
        const feeds = modelData({
          clicks,
          baseTensor,
          tensorAfterManualEditions: tensorAfterManualEditions
            ? undefined
            : undefined,
          boundingBox: boundingBox ? boundingBox : undefined,
          modelScale,
        });
        const previewFeeds = modelData({
          clicks: previewClicks,
          baseTensor,
          tensorAfterManualEditions: tensorAfterManualEditions
            ? undefined
            : undefined,
          boundingBox: boundingBox ? boundingBox : undefined,
          modelScale,
        });

        if (feeds === undefined || previewFeeds === undefined) return;

        const results = await model.run(feeds);
        const previewResults = await model.run(previewFeeds);
        const output = results[model.outputNames[0]];
        const previewOutput = previewResults[model.outputNames[0]];

        const polygons = findPolygons(
          output.data,
          output.dims[2],
          output.dims[3],
        );

        setPolygons(polygons);

        setMaskImg(
          onnxMaskToImage(
            output.data,
            output.dims[2],
            output.dims[3],
            '#0072BD'
          )
        );
        setPreviewMaskImg(
          onnxMaskToImage(
            previewOutput.data,
            previewOutput.dims[2],
            previewOutput.dims[3],
            isCtrlKeyPressed ? '#FF0000' : '#00FF00'
          )
        );

        // if (boundingBox) {
        //   const feeds = modelData({
        //     clicks,
        //     baseTensor,
        //     tensorAfterManualEditions: tensorAfterManualEditions
        //       ? undefined
        //       : undefined,
        //     boundingBox: boundingBox ? boundingBox : undefined,
        //     modelScale,
        //   });

        //   if (feeds === undefined) return;

        //   const results = await model.run(feeds);
        //   const output = results[model.outputNames[0]];

        //   const polygons = findPolygons(
        //     output.data,
        //     output.dims[2],
        //     output.dims[3],
        //     canvasRef.current!
        //   );

        //   setPolygons(polygons);

        //   setMaskImg(
        //     onnxMaskToImage(
        //       output.data,
        //       output.dims[2],
        //       output.dims[3],
        //       '#0072BD'
        //     )
        //   );
        // }
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      {/* <Navbar
        style={{ height: '5%' }}
        className='w-100'
        bg='dark'
        expand='lg'
      >
        <Container className={'w-100 m-0 px-3'}>
          <Navbar.Brand className='mr-1'>
            <img
              src={logo}
              alt='logo'
              width={30}
            />
          </Navbar.Brand>
          <Navbar.Brand className='text-light'>
            <span>Annotation</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse
            className='w-100'
            id='basic-navbar-nav'
          >
            <Nav className='me-auto w-100'></Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar> */}
      <div
        style={{ height: '95%' }}
        className='w-100 d-flex flex-row justify-content-start align-items-start'
      >
        <ControlPanel />
        <Stage />
      </div>
    </>
  );
};

export default App;
