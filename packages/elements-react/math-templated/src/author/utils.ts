import type { MathTemplatedConfiguration } from '../types.js';

export const generateValidationMessage = (config: MathTemplatedConfiguration) => {
  const { maxResponseAreas } = config;

  const responseAreasMessage =
    '\nCorrect answers should not be blank.' +
    '\nEach answer defined for a response area should be unique.' +
    '\nThere should be at least 1 ' +
    (maxResponseAreas ? `and at most ${maxResponseAreas} ` : '') +
    'response area' +
    (maxResponseAreas ? 's' : '') +
    ' defined.';

  return 'Validation requirements:' + responseAreasMessage;
};
