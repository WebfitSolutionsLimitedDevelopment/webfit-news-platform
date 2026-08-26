const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 2200;

type CompressOptions = {
  maxBytes?: number;
  maxDimension?: number;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name} as an image.`));
    };

    image.decoding = 'async';
    image.src = url;
  });
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Could not compress image.')),
      type,
      quality
    );
  });
}

function outputFilename(original: string, mime: string) {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  const extension =
    mime === 'image/webp' ? 'webp' :
    mime === 'image/jpeg' ? 'jpg' :
    mime === 'image/png' ? 'png' :
    'webp';

  return `${base}.${extension}`;
}

export async function compressImageForUpload(
  file: File,
  options: CompressOptions = {}
) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image.`);
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error(`Could not determine the dimensions of ${file.name}.`);
  }

  let scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });

  if (!context) {
    throw new Error('Your browser could not start image compression.');
  }

  let quality = 0.88;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    blob = await canvasBlob(canvas, 'image/webp', quality);

    if (blob.size <= maxBytes) break;

    if (quality > 0.54) {
      quality = Math.max(0.54, quality - 0.08);
      continue;
    }

    width = Math.max(640, Math.round(width * 0.84));
    height = Math.max(1, Math.round(sourceHeight * (width / sourceWidth)));
    quality = 0.78;

    if (width <= 640 && blob.size > maxBytes) {
      quality = 0.48;
    }
  }

  if (!blob || blob.size > maxBytes) {
    throw new Error(
      `${file.name} could not be compressed below ${Math.round(maxBytes / 1024 / 1024)} MB.`
    );
  }

  return new File(
    [blob],
    outputFilename(file.name, blob.type || 'image/webp'),
    {
      type: blob.type || 'image/webp',
      lastModified: Date.now(),
    }
  );
}

export function formatUploadSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
