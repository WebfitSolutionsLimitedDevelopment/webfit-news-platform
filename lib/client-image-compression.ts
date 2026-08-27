const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_TARGET_BYTES = Math.floor(1.85 * 1024 * 1024);
const DEFAULT_MAX_DIMENSION = 2200;
const MIN_DIMENSION = 360;

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
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not compress image.'));
        }
      },
      type,
      quality
    );
  });
}

function outputFilename(original: string, mime: string) {
  const base = original.replace(/\.[^.]+$/, '') || 'image';

  const extension =
    mime === 'image/webp'
      ? 'webp'
      : mime === 'image/jpeg'
        ? 'jpg'
        : mime === 'image/png'
          ? 'png'
          : 'webp';

  return `${base}.${extension}`;
}

function calculateDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number
) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(sourceWidth, sourceHeight)
  );

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

function resizeDimensions(
  width: number,
  height: number,
  factor: number
) {
  const longestSide = Math.max(width, height);

  if (longestSide <= MIN_DIMENSION) {
    return { width, height };
  }

  const newLongestSide = Math.max(
    MIN_DIMENSION,
    Math.round(longestSide * factor)
  );

  const scale = newLongestSide / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encodeAtBestQuality(
  canvas: HTMLCanvasElement,
  targetBytes: number
) {
  const mime = 'image/webp';

  let low = 0.18;
  let high = 0.92;

  let bestBlob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const quality = (low + high) / 2;

    const blob = await canvasBlob(
      canvas,
      mime,
      quality
    );

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (bestBlob) {
    return bestBlob;
  }

  return canvasBlob(canvas, mime, 0.16);
}

export async function compressImageForUpload(
  file: File,
  options: CompressOptions = {}
) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image.`);
  }

  const maxBytes =
    options.maxBytes ?? DEFAULT_MAX_BYTES;

  const targetBytes = Math.min(
    DEFAULT_TARGET_BYTES,
    Math.floor(maxBytes * 0.93)
  );

  const maxDimension =
    options.maxDimension ?? DEFAULT_MAX_DIMENSION;

  /*
   * If the image is already comfortably below the upload limit,
   * leave it untouched.
   */
  if (file.size <= targetBytes) {
    return file;
  }

  const image = await loadImage(file);

  const sourceWidth =
    image.naturalWidth || image.width;

  const sourceHeight =
    image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error(
      `Could not determine the dimensions of ${file.name}.`
    );
  }

  let { width, height } = calculateDimensions(
    sourceWidth,
    sourceHeight,
    maxDimension
  );

  const canvas = document.createElement('canvas');

  const context = canvas.getContext('2d', {
    alpha: true,
  });

  if (!context) {
    throw new Error(
      'Your browser could not start image compression.'
    );
  }

  let bestBlob: Blob | null = null;

  /*
   * Each pass tries a range of WebP qualities.
   * If quality alone cannot reach the target,
   * reduce dimensions and try again.
   */
  for (let resizeAttempt = 0; resizeAttempt < 14; resizeAttempt += 1) {
    canvas.width = width;
    canvas.height = height;

    context.clearRect(
      0,
      0,
      width,
      height
    );

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob = await encodeAtBestQuality(
      canvas,
      targetBytes
    );

    if (
      !bestBlob ||
      blob.size < bestBlob.size
    ) {
      bestBlob = blob;
    }

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      break;
    }

    const previousWidth = width;
    const previousHeight = height;

    const resized = resizeDimensions(
      width,
      height,
      0.82
    );

    width = resized.width;
    height = resized.height;

    /*
     * If we have reached the minimum dimensions,
     * perform one final aggressive encoding attempt.
     */
    if (
      width === previousWidth &&
      height === previousHeight
    ) {
      const emergencyBlob = await canvasBlob(
        canvas,
        'image/webp',
        0.1
      );

      if (
        !bestBlob ||
        emergencyBlob.size < bestBlob.size
      ) {
        bestBlob = emergencyBlob;
      }

      break;
    }
  }

  if (!bestBlob || bestBlob.size > maxBytes) {
    throw new Error(
      `${file.name} could not be compressed below ${Math.round(
        maxBytes / 1024 / 1024
      )} MB.`
    );
  }

  return new File(
    [bestBlob],
    outputFilename(
      file.name,
      bestBlob.type || 'image/webp'
    ),
    {
      type: bestBlob.type || 'image/webp',
      lastModified: Date.now(),
    }
  );
}

export function formatUploadSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024)
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}
