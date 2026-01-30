// Quick test to see if static imports work
import('@pie-element/multiple-choice')
  .then(mod => {
    console.log('✓ Element import successful:', mod.default?.name);
  })
  .catch(err => {
    console.error('✗ Element import failed:', err.message);
  });

import('@pie-element/multiple-choice/controller')
  .then(mod => {
    console.log('✓ Controller import successful:', mod.model ? 'has model method' : 'no model');
  })
  .catch(err => {
    console.error('✗ Controller import failed:', err.message);
  });
