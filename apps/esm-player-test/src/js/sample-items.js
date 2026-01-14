/**
 * Sample Items Library
 *
 * Collection of test items for validating player and element functionality.
 */

export const SAMPLE_ITEMS = [
  {
    id: 'multiple-choice-simple',
    title: 'Multiple Choice - Simple',
    description: 'Basic multiple choice question',
    elements: [
      {
        element: 'multiple-choice',
        id: 'mc1',
      },
    ],
    models: [
      {
        id: 'mc1',
        element: 'multiple-choice',
        prompt: '<p>What is 2 + 2?</p>',
        choices: [
          { label: '3', value: 'a' },
          { label: '4', value: 'b' },
          { label: '5', value: 'c' },
          { label: '6', value: 'd' },
        ],
        choiceMode: 'radio',
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'mc1',
        element: 'multiple-choice',
        value: [],
      },
    ],
  },
  {
    id: 'multiple-choice-checkbox',
    title: 'Multiple Choice - Checkbox',
    description: 'Multiple choice with checkbox mode (select multiple)',
    elements: [
      {
        element: 'multiple-choice',
        id: 'mc2',
      },
    ],
    models: [
      {
        id: 'mc2',
        element: 'multiple-choice',
        prompt: '<p>Select all prime numbers:</p>',
        choices: [
          { label: '1', value: 'a' },
          { label: '2', value: 'b' },
          { label: '3', value: 'c' },
          { label: '4', value: 'd' },
          { label: '5', value: 'e' },
          { label: '6', value: 'f' },
        ],
        choiceMode: 'checkbox',
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'mc2',
        element: 'multiple-choice',
        value: [],
      },
    ],
  },
  {
    id: 'hotspot-basic',
    title: 'Hotspot - Basic',
    description: 'Image hotspot question',
    elements: [
      {
        element: 'hotspot',
        id: 'hs1',
      },
    ],
    models: [
      {
        id: 'hs1',
        element: 'hotspot',
        prompt: '<p>Click on the circle</p>',
        imageUrl: 'https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=Sample+Image',
        hotspots: [{ id: '1', shape: 'circle', x: 300, y: 200, radius: 50 }],
        multipleCorrect: false,
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'hs1',
        element: 'hotspot',
        value: [],
      },
    ],
  },
  {
    id: 'number-line-plot',
    title: 'Number Line - Plot Points',
    description: 'Number line with point plotting',
    elements: [
      {
        element: 'number-line',
        id: 'nl1',
      },
    ],
    models: [
      {
        id: 'nl1',
        element: 'number-line',
        prompt: '<p>Plot the point at 5 on the number line</p>',
        min: 0,
        max: 10,
        step: 1,
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'nl1',
        element: 'number-line',
        value: [],
      },
    ],
  },
  {
    id: 'multi-element-math',
    title: 'Multi-Element - Math Problem',
    description: 'Item with multiple elements of different types',
    elements: [
      {
        element: 'multiple-choice',
        id: 'me1',
      },
      {
        element: 'number-line',
        id: 'me2',
      },
    ],
    models: [
      {
        id: 'me1',
        element: 'multiple-choice',
        prompt: '<p><strong>Part A:</strong> What is 3 × 4?</p>',
        choices: [
          { label: '7', value: 'a' },
          { label: '12', value: 'b' },
          { label: '15', value: 'c' },
          { label: '16', value: 'd' },
        ],
        choiceMode: 'radio',
        responseMode: 'gather',
      },
      {
        id: 'me2',
        element: 'number-line',
        prompt: '<p><strong>Part B:</strong> Plot your answer on the number line</p>',
        min: 0,
        max: 20,
        step: 1,
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'me1',
        element: 'multiple-choice',
        value: [],
      },
      {
        id: 'me2',
        element: 'number-line',
        value: [],
      },
    ],
  },
  {
    id: 'multi-element-mixed',
    title: 'Multi-Element - Mixed Types',
    description: 'Item with three different element types',
    elements: [
      {
        element: 'multiple-choice',
        id: 'mm1',
      },
      {
        element: 'hotspot',
        id: 'mm2',
      },
      {
        element: 'slider',
        id: 'mm3',
      },
    ],
    models: [
      {
        id: 'mm1',
        element: 'multiple-choice',
        prompt: '<p><strong>Question 1:</strong> Which color is primary?</p>',
        choices: [
          { label: 'Red', value: 'a' },
          { label: 'Green', value: 'b' },
          { label: 'Purple', value: 'c' },
          { label: 'Orange', value: 'd' },
        ],
        choiceMode: 'radio',
        responseMode: 'gather',
      },
      {
        id: 'mm2',
        element: 'hotspot',
        prompt: '<p><strong>Question 2:</strong> Click on the red area</p>',
        imageUrl: 'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Red',
        hotspots: [{ id: '1', shape: 'rect', x: 100, y: 100, width: 200, height: 100 }],
        multipleCorrect: false,
        responseMode: 'gather',
      },
      {
        id: 'mm3',
        element: 'slider',
        prompt: '<p><strong>Question 3:</strong> How confident are you? (1-10)</p>',
        min: 1,
        max: 10,
        step: 1,
        responseMode: 'gather',
      },
    ],
    sessions: [
      {
        id: 'mm1',
        element: 'multiple-choice',
        value: [],
      },
      {
        id: 'mm2',
        element: 'hotspot',
        value: [],
      },
      {
        id: 'mm3',
        element: 'slider',
        value: null,
      },
    ],
  },
];

/**
 * Get item by ID
 * @param {string} itemId
 * @returns {Object|null}
 */
export function getItemById(itemId) {
  return SAMPLE_ITEMS.find((item) => item.id === itemId) || null;
}

/**
 * Get all unique element types used across all items
 * @returns {string[]}
 */
export function getAllElementTypes() {
  const types = new Set();

  for (const item of SAMPLE_ITEMS) {
    if (item.elements) {
      for (const element of item.elements) {
        if (element.element) {
          types.add(element.element);
        }
      }
    }
  }

  return Array.from(types).sort();
}

/**
 * Get element types used in a specific item
 * @param {Object} item
 * @returns {string[]}
 */
export function getElementTypesForItem(item) {
  if (!item || !item.elements) {
    return [];
  }

  const types = new Set();
  for (const element of item.elements) {
    if (element.element) {
      types.add(element.element);
    }
  }

  return Array.from(types).sort();
}
