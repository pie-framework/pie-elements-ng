export default {
  "id": "upload-default",
  "element": "@pie-element/upload-svelte",
  "prompt": "<p>Upload your assignment files below.</p>",
  "promptEnabled": true,
  "instructions": "You can upload up to 3 files. Accepted formats: images, PDFs, and text files.",
  "maxFiles": 3,
  "minFiles": 1,
  "maxFileSize": 5242880,
  "acceptedTypes": ["image/*", ".pdf", ".txt", ".doc", ".docx"],
  "showPreview": true,
  "allowReplace": true,
  "rationale": "<p>File uploads allow students to submit their work for review and assessment.</p>",
  "rationaleEnabled": true
};
