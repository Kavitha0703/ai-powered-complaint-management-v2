export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  resizeWidth: number = 256
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // set canvas size to match the resized width/height (1:1 aspect ratio)
  canvas.width = resizeWidth;
  canvas.height = resizeWidth;

  // draw the cropped image onto the resized canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    resizeWidth,
    resizeWidth
  );

  return new Promise((resolve) => {
    // Generate a webp or jpeg data url. Use webp to save space, fallback to jpeg.
    resolve(canvas.toDataURL('image/webp', 0.8));
  });
}
