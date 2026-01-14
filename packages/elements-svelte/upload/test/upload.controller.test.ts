import { describe, expect, it } from 'vitest';
import {
  addFile,
  clearFiles,
  createSession,
  evaluate,
  fileToUploadedFile,
  formatFileSize,
  getAcceptString,
  isImageType,
  isSessionComplete,
  removeFile,
  validateFile,
  validateModel,
} from '../src/upload.controller.js';
import type { UploadedFile, UploadModel, UploadSession } from '../src/upload.types.js';

describe('Upload Controller', () => {
  describe('validateModel', () => {
    it('should return no errors for valid model', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };

      const errors = validateModel(model);
      expect(errors).toEqual([]);
    });

    it('should require id', () => {
      const model = {
        element: '@pie-element/upload',
      } as UploadModel;

      const errors = validateModel(model);
      expect(errors).toContain('Model must have an id');
    });

    it('should validate maxFiles minimum', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        maxFiles: 0,
      };

      const errors = validateModel(model);
      expect(errors).toContain('maxFiles must be at least 1');
    });

    it('should validate minFiles minimum', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        minFiles: -1,
      };

      const errors = validateModel(model);
      expect(errors).toContain('minFiles must be at least 0');
    });

    it('should validate minFiles vs maxFiles', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        minFiles: 5,
        maxFiles: 3,
      };

      const errors = validateModel(model);
      expect(errors).toContain('minFiles cannot be greater than maxFiles');
    });

    it('should validate maxFileSize', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        maxFileSize: 0,
      };

      const errors = validateModel(model);
      expect(errors).toContain('maxFileSize must be greater than 0');
    });

    it('should accept valid configuration', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        maxFiles: 3,
        minFiles: 1,
        maxFileSize: 5 * 1024 * 1024,
        acceptedTypes: ['image/*', '.pdf'],
      };

      const errors = validateModel(model);
      expect(errors).toEqual([]);
    });
  });

  describe('createSession', () => {
    it('should create empty session with default values', () => {
      const session = createSession();

      expect(session).toEqual({
        files: [],
        attempted: false,
      });
    });
  });

  describe('validateFile', () => {
    const model: UploadModel = {
      id: 'upload-1',
      element: '@pie-element/upload',
      maxFileSize: 1024 * 1024, // 1MB
      maxFiles: 3,
      acceptedTypes: ['image/*', '.pdf'],
    };

    it('should accept valid file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const error = validateFile(file, model, []);

      expect(error).toBeNull();
    });

    it('should reject file exceeding size limit', () => {
      const largeContent = new Array(2 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const error = validateFile(file, model, []);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('size');
      expect(error?.message).toContain('exceeds maximum size');
      expect(error?.fileName).toBe('large.jpg');
    });

    it('should reject file when max count reached', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const currentFiles: UploadedFile[] = [
        { name: 'file1.jpg', size: 100, type: 'image/jpeg' },
        { name: 'file2.jpg', size: 100, type: 'image/jpeg' },
        { name: 'file3.jpg', size: 100, type: 'image/jpeg' },
      ];
      const error = validateFile(file, model, currentFiles);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('count');
      expect(error?.message).toContain('Maximum number of files');
    });

    it('should reject file with invalid type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const error = validateFile(file, model, []);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('type');
      expect(error?.message).toContain('invalid type');
      expect(error?.fileName).toBe('test.txt');
    });

    it('should accept wildcard MIME type', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const error = validateFile(file, model, []);

      expect(error).toBeNull();
    });

    it('should accept extension-based type', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const error = validateFile(file, model, []);

      expect(error).toBeNull();
    });

    it('should accept file when no acceptedTypes specified', () => {
      const modelNoTypes: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const error = validateFile(file, modelNoTypes, []);

      expect(error).toBeNull();
    });

    it('should use default max size when not specified', () => {
      const modelNoSize: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' });
      const error = validateFile(file, modelNoSize, []);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('size');
    });

    it('should default maxFiles to 1', () => {
      const modelNoMax: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const currentFiles: UploadedFile[] = [{ name: 'file1.jpg', size: 100, type: 'image/jpeg' }];
      const error = validateFile(file, modelNoMax, currentFiles);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('count');
    });
  });

  // fileToUploadedFile tests skipped - requires browser FileReader API
  // This functionality is tested in E2E tests instead
  describe.skip('fileToUploadedFile', () => {
    it('should convert file to uploaded file', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const uploadedFile = await fileToUploadedFile(file);

      expect(uploadedFile.name).toBe('test.txt');
      expect(uploadedFile.size).toBe(file.size);
      expect(uploadedFile.type).toBe('text/plain');
      expect(uploadedFile.data).toBeDefined();
      expect(uploadedFile.uploadedAt).toBeDefined();
    });

    it('should generate preview for images', async () => {
      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const uploadedFile = await fileToUploadedFile(file);

      expect(uploadedFile.preview).toBeDefined();
      expect(uploadedFile.preview).toBe(uploadedFile.data);
    });

    it('should not generate preview for non-images', async () => {
      const file = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });
      const uploadedFile = await fileToUploadedFile(file);

      expect(uploadedFile.preview).toBeUndefined();
    });
  });

  // addFile tests skipped - requires browser FileReader API
  // This functionality is tested in E2E tests instead
  describe.skip('addFile', () => {
    const model: UploadModel = {
      id: 'upload-1',
      element: '@pie-element/upload',
      maxFiles: 2,
      maxFileSize: 1024 * 1024,
    };

    it('should add valid file to session', async () => {
      const session = createSession();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const result = await addFile(session, file, model);

      expect(result.error).toBeUndefined();
      expect(result.session.files).toHaveLength(1);
      expect(result.session.files?.[0].name).toBe('test.txt');
      expect(result.session.attempted).toBe(true);
    });

    it('should return error for invalid file', async () => {
      const session = createSession();
      const largeContent = new Array(2 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });

      const result = await addFile(session, file, model);

      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('size');
      expect(result.session.files).toHaveLength(0);
    });

    it('should accumulate multiple files', async () => {
      let session = createSession();
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

      const result1 = await addFile(session, file1, model);
      session = result1.session;
      const result2 = await addFile(session, file2, model);

      expect(result2.error).toBeUndefined();
      expect(result2.session.files).toHaveLength(2);
    });
  });

  describe('removeFile', () => {
    it('should remove file at index', () => {
      const session: UploadSession = {
        files: [
          { name: 'file1.txt', size: 100, type: 'text/plain' },
          { name: 'file2.txt', size: 200, type: 'text/plain' },
          { name: 'file3.txt', size: 300, type: 'text/plain' },
        ],
        attempted: true,
      };

      const updated = removeFile(session, 1);

      expect(updated.files).toHaveLength(2);
      expect(updated.files?.[0].name).toBe('file1.txt');
      expect(updated.files?.[1].name).toBe('file3.txt');
    });

    it('should handle empty files array', () => {
      const session: UploadSession = {
        files: [],
        attempted: false,
      };

      const updated = removeFile(session, 0);

      expect(updated.files).toHaveLength(0);
    });
  });

  describe('clearFiles', () => {
    it('should clear all files', () => {
      const session: UploadSession = {
        files: [
          { name: 'file1.txt', size: 100, type: 'text/plain' },
          { name: 'file2.txt', size: 200, type: 'text/plain' },
        ],
        attempted: true,
      };

      const updated = clearFiles(session);

      expect(updated.files).toHaveLength(0);
      expect(updated.attempted).toBe(true);
    });
  });

  describe('isSessionComplete', () => {
    const model: UploadModel = {
      id: 'upload-1',
      element: '@pie-element/upload',
      minFiles: 2,
    };

    it('should return true when minimum files met', () => {
      const session: UploadSession = {
        files: [
          { name: 'file1.txt', size: 100, type: 'text/plain' },
          { name: 'file2.txt', size: 200, type: 'text/plain' },
        ],
        attempted: true,
      };

      expect(isSessionComplete(model, session)).toBe(true);
    });

    it('should return false when minimum files not met', () => {
      const session: UploadSession = {
        files: [{ name: 'file1.txt', size: 100, type: 'text/plain' }],
        attempted: true,
      };

      expect(isSessionComplete(model, session)).toBe(false);
    });

    it('should default minFiles to 1', () => {
      const modelNoMin: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };
      const session: UploadSession = {
        files: [{ name: 'file1.txt', size: 100, type: 'text/plain' }],
        attempted: true,
      };

      expect(isSessionComplete(modelNoMin, session)).toBe(true);
    });
  });

  describe('evaluate', () => {
    const model: UploadModel = {
      id: 'upload-1',
      element: '@pie-element/upload',
      minFiles: 2,
    };

    it('should return complete when requirements met', () => {
      const session: UploadSession = {
        files: [
          { name: 'file1.txt', size: 100, type: 'text/plain' },
          { name: 'file2.txt', size: 200, type: 'text/plain' },
        ],
        attempted: true,
      };

      const result = evaluate(model, session);

      expect(result.complete).toBe(true);
      expect(result.correct).toBe(true);
      expect(result.score).toBe(1);
      expect(result.filesUploaded).toBe(2);
      expect(result.metMinimumRequirement).toBe(true);
    });

    it('should return incomplete when requirements not met', () => {
      const session: UploadSession = {
        files: [{ name: 'file1.txt', size: 100, type: 'text/plain' }],
        attempted: true,
      };

      const result = evaluate(model, session);

      expect(result.complete).toBe(false);
      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
      expect(result.filesUploaded).toBe(1);
      expect(result.metMinimumRequirement).toBe(false);
    });

    it('should handle empty files', () => {
      const session: UploadSession = {
        files: [],
        attempted: false,
      };

      const result = evaluate(model, session);

      expect(result.complete).toBe(false);
      expect(result.filesUploaded).toBe(0);
    });

    it('should return incomplete for invalid model', () => {
      const invalidModel = { ...model, id: '' };
      const session = createSession();

      const result = evaluate(invalidModel, session);

      expect(result.score).toBe(0);
      expect(result.correct).toBe(false);
      expect(result.complete).toBe(false);
      expect(result.filesUploaded).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(999)).toBe('999 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should handle edge cases', () => {
      expect(formatFileSize(-10)).toBe('0 B');
      expect(formatFileSize(Infinity)).toBe('0 B');
    });
  });

  describe('getAcceptString', () => {
    it('should return accept string for accepted types', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        acceptedTypes: ['image/*', '.pdf', 'application/json'],
      };

      const acceptString = getAcceptString(model);

      expect(acceptString).toBe('image/*,.pdf,application/json');
    });

    it('should return undefined when no accepted types', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
      };

      const acceptString = getAcceptString(model);

      expect(acceptString).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const model: UploadModel = {
        id: 'upload-1',
        element: '@pie-element/upload',
        acceptedTypes: [],
      };

      const acceptString = getAcceptString(model);

      expect(acceptString).toBeUndefined();
    });
  });

  describe('isImageType', () => {
    it('should return true for image types', () => {
      expect(isImageType('image/jpeg')).toBe(true);
      expect(isImageType('image/png')).toBe(true);
      expect(isImageType('image/gif')).toBe(true);
      expect(isImageType('image/webp')).toBe(true);
    });

    it('should return false for non-image types', () => {
      expect(isImageType('text/plain')).toBe(false);
      expect(isImageType('application/pdf')).toBe(false);
      expect(isImageType('audio/mpeg')).toBe(false);
      expect(isImageType('video/mp4')).toBe(false);
    });
  });
});
