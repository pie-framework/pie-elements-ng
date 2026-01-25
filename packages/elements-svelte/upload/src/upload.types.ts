/**
 * Upload Element Types
 *
 * Corresponds to QTI 2.2 uploadInteraction
 * Allows candidates to upload files for assessment
 */

import type {
  PieEnvironment,
  PieEvaluation,
  PieModel,
  PieSession,
} from '@pie-element/shared-types';

/**
 * Uploaded file information
 */
export interface UploadedFile {
  /** File name */
  name: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  type: string;

  /** File data as base64 string or URL */
  data?: string;

  /** Upload timestamp */
  uploadedAt?: number;

  /** Optional file preview (for images) */
  preview?: string;
}

/**
 * Upload model - configuration for file upload
 */
export interface UploadModel extends PieModel {
  /** Element identifier */
  element: '@pie-element/upload';

  /** Accepted MIME types (e.g., "image/*", "application/pdf", ".txt") */
  acceptedTypes?: string[];

  /** Maximum file size in bytes */
  maxFileSize?: number;

  /** Maximum number of files (default: 1) */
  maxFiles?: number;

  /** Minimum number of files required (default: 1) */
  minFiles?: number;

  /** Show file preview for images */
  showPreview?: boolean;

  /** Allow replacing uploaded files */
  allowReplace?: boolean;

  /** Prompt text */
  prompt?: string;

  /** Enable prompt display */
  promptEnabled?: boolean;

  /** Rationale text (instructor only) */
  rationale?: string;

  /** Enable rationale display */
  rationaleEnabled?: boolean;

  /** Instructions for file upload */
  instructions?: string;
}

/**
 * Upload session - tracks uploaded files
 */
export interface UploadSession extends PieSession {
  /** Uploaded files */
  files?: UploadedFile[];

  /** Upload attempted flag */
  attempted?: boolean;
}

/**
 * Upload evaluation result
 */
export interface UploadEvaluation extends PieEvaluation {
  /** Whether required files were uploaded */
  complete: boolean;

  /** Number of files uploaded */
  filesUploaded?: number;

  /** Whether minimum files requirement met */
  metMinimumRequirement?: boolean;
}

/**
 * Props for Upload component
 */
export interface UploadComponentProps {
  /** Upload model */
  model: UploadModel;

  /** Upload session (bindable) */
  session: UploadSession;

  /** Evaluation result */
  evaluation?: UploadEvaluation;

  /** Environment */
  env: PieEnvironment;

  /** Session change callback */
  onSessionChange: (session: UploadSession) => void;
}

/**
 * File validation error
 */
export interface FileValidationError {
  /** Error type */
  type: 'size' | 'type' | 'count';

  /** Error message */
  message: string;

  /** File that caused the error (if applicable) */
  fileName?: string;
}
