import config from './packages/elements-react/multiple-choice/docs/demo/config.mjs';
import { writeFileSync } from 'node:fs';

writeFileSync(
  './apps/element-demo/src/lib/samples/multiple-choice.json',
  JSON.stringify(config, null, 2)
);

console.log('✅ Converted multiple-choice config.mjs to JSON');
