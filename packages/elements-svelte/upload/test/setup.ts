// Mock FileReader for upload tests
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readyState = 0;

  readAsDataURL(blob: Blob) {
    // Simulate async read with simple base64 encoding
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${blob.type};base64,${btoa('mock-file-content')}`;
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsText(_blob: Blob) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock-file-content';
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsArrayBuffer(_blob: Blob) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  abort() {
    this.readyState = 2;
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
}

// @ts-expect-error - Mocking global FileReader
globalThis.FileReader = MockFileReader;
