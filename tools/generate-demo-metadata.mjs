#!/usr/bin/env node

import { generateDemoMetadata } from './cli/src/lib/upstream/sync-demo-metadata.ts';

console.log('🔄 Generating demo metadata...\n');
await generateDemoMetadata();
console.log('\n✓ Complete!');
