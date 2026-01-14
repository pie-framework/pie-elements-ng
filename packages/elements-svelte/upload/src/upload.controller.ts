/**
 * Upload Controller
 *
 * Business logic for file upload interaction
 * Maps to QTI uploadInteraction
 */

import type {
  FileValidationError,
  UploadEvaluation,
  UploadedFile,
  UploadModel,
  UploadSession,
} from './upload.types.js';

/**
 * Default maximum file size (10MB)
 */
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates upload model configuration
 */
export function validateModel(model: UploadModel): string[] {
  const errors: string[] = [];

  if (!model.id) {
    errors.push('Model must have an id');
  }

  if (model.maxFiles !== undefined && model.maxFiles < 1) {
    errors.push('maxFiles must be at least 1');
  }

  if (model.minFiles !== undefined && model.minFiles < 0) {
    errors.push('minFiles must be at least 0');
  }

  if (
    model.minFiles !== undefined &&
    model.maxFiles !== undefined &&
    model.minFiles > model.maxFiles
  ) {
    errors.push('minFiles cannot be greater than maxFiles');
  }

  if (model.maxFileSize !== undefined && model.maxFileSize < 1) {
    errors.push('maxFileSize must be greater than 0');
  }

  return errors;
}

/**
 * Creates an empty upload session
 */
export function createSession(): UploadSession {
  return {
    files: [],
    attempted: false,
  };
}

/**
 * Validates a file against model constraints
 */
export function validateFile(
  file: File,
  model: UploadModel,
  currentFiles: UploadedFile[]
): FileValidationError | null {
  const maxSize = model.maxFileSize || DEFAULT_MAX_FILE_SIZE;
  const maxFiles = model.maxFiles || 1;

  // Check file size
  if (file.size > maxSize) {
    return {
      type: 'size',
      message: `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`,
      fileName: file.name,
    };
  }

  // Check file count
  if (currentFiles.length >= maxFiles) {
    return {
      type: 'count',
      message: `Maximum number of files (${maxFiles}) reached`,
    };
  }

  // Check file type if acceptedTypes is specified
  if (model.acceptedTypes && model.acceptedTypes.length > 0) {
    const accepted = model.acceptedTypes.some((acceptedType) => {
      // Handle wildcard types like "image/*"
      if (acceptedType.includes('*')) {
        const baseType = acceptedType.split('/')[0];
        return file.type.startsWith(`${baseType}/`);
      }

      // Handle extension-based matching like ".pdf"
      if (acceptedType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
      }

      // Exact MIME type match
      return file.type === acceptedType;
    });

    if (!accepted) {
      return {
        type: 'type',
        message: `File "${file.name}" has invalid type. Accepted types: ${model.acceptedTypes.join(', ')}`,
        fileName: file.name,
      };
    }
  }

  return null;
}

/**
 * Converts a File object to UploadedFile
 */
export async function fileToUploadedFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
        uploadedAt: Date.now(),
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        uploadedFile.preview = reader.result as string;
      }

      resolve(uploadedFile);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Adds a file to the session
 */
export async function addFile(
  session: UploadSession,
  file: File,
  model: UploadModel
): Promise<{ session: UploadSession; error?: FileValidationError }> {
  const currentFiles = session.files || [];

  // Validate file
  const validationError = validateFile(file, model, currentFiles);
  if (validationError) {
    return { session, error: validationError };
  }

  // Convert to UploadedFile
  try {
    const uploadedFile = await fileToUploadedFile(file);

    return {
      session: {
        ...session,
        files: [...currentFiles, uploadedFile],
        attempted: true,
      },
    };
  } catch (error) {
    return {
      session,
      error: {
        type: 'type',
        message: error instanceof Error ? error.message : 'Failed to upload file',
        fileName: file.name,
      },
    };
  }
}

/**
 * Removes a file from the session by index
 */
export function removeFile(session: UploadSession, index: number): UploadSession {
  const currentFiles = session.files || [];

  return {
    ...session,
    files: currentFiles.filter((_, i) => i !== index),
  };
}

/**
 * Clears all files from the session
 */
export function clearFiles(session: UploadSession): UploadSession {
  return {
    ...session,
    files: [],
  };
}

/**
 * Checks if session meets upload requirements
 */
export function isSessionComplete(model: UploadModel, session: UploadSession): boolean {
  const filesCount = session.files?.length || 0;
  const minFiles = model.minFiles ?? 1;

  return filesCount >= minFiles;
}

/**
 * Evaluates the upload session
 */
export function evaluate(model: UploadModel, session: UploadSession): UploadEvaluation {
  const errors = validateModel(model);
  if (errors.length > 0) {
    return {
      score: 0,
      correct: false,
      complete: false,
      filesUploaded: 0,
    };
  }

  const filesCount = session.files?.length || 0;
  const minFiles = model.minFiles ?? 1;
  const complete = filesCount >= minFiles;

  return {
    score: complete ? 1 : 0,
    correct: complete,
    complete,
    filesUploaded: filesCount,
    metMinimumRequirement: filesCount >= minFiles,
  };
}

/**
 * Formats file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || !Number.isFinite(bytes)) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / k ** i;

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Gets accepted file types as a string for input accept attribute
 */
export function getAcceptString(model: UploadModel): string | undefined {
  if (!model.acceptedTypes || model.acceptedTypes.length === 0) {
    return undefined;
  }

  return model.acceptedTypes.join(',');
}

/**
 * Checks if a MIME type is an image
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
