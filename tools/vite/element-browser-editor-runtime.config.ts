import { defineConfig } from 'vite';
import { editorRuntimeVariant } from './editor-runtime-variant.ts';
import base from './element-browser.config.ts';

export default defineConfig(editorRuntimeVariant(base));
