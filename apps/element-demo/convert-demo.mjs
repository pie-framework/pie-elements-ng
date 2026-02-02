import config from './packages/elements-react/multiple-choice/docs/demo/config.mjs';
import { writeFileSync } from 'fs';

writeFileSync(
  './apps/element-demo/src/lib/data/sample-configs/react/multiple-choice.json',
  JSON.stringify(config, null, 2)
);

console.log('✅ Converted multiple-choice config.mjs to JSON');
