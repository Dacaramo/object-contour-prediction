export const hexToRGBA = (hex: string): number[] => {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b, 255]; // Assuming full opacity (255)
};

// Convert the onnx model mask prediction to ImageData
export const arrayToImageData = (
  input: any,
  width: number,
  height: number,
  hexColor: string
) => {
  const [r, g, b, a] = hexToRGBA(hexColor); // the masks's color
  const arr = new Uint8ClampedArray(4 * width * height).fill(0);
  for (let i = 0; i < input.length; i++) {
    // Threshold the onnx model mask prediction at 0.0
    // This is equivalent to thresholding the mask using predictor.model.mask_threshold
    // in python
    if (input[i] > 0.0) {
      arr[4 * i + 0] = r;
      arr[4 * i + 1] = g;
      arr[4 * i + 2] = b;
      arr[4 * i + 3] = a;
    }
  }
  return new ImageData(arr, height, width);
};

// Use a Canvas element to produce an image from ImageData
export const imageDataToImage = (imageData: ImageData) => {
  const canvas = imageDataToCanvas(imageData);
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
};

// Canvas elements can be created from ImageData
export const imageDataToCanvas = (imageData: ImageData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx?.putImageData(imageData, 0, 0);
  return canvas;
};

// Convert the onnx model mask output to an HTMLImageElement
export const onnxMaskToImage = (
  input: any,
  width: number,
  height: number,
  hexColor: string
) => {
  return imageDataToImage(arrayToImageData(input, width, height, hexColor));
};
