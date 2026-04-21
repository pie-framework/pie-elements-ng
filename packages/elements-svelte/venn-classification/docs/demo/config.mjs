import { reptileTileImageUrls } from './reptile-tile-image-urls.mjs';

export default {
  demos: [
    {
      id: 'reptile-egg-layer',
      title: 'Reptile & Egg-layer',
      description:
        "Non-math worked example from the PRD: sort animals by whether they're reptiles, egg-layers, both, or neither. Tiles show optional images plus captions.",
      tags: ['venn', 'classification', 'biology', 'non-math', 'images'],
      model: {
        id: '1',
        element: 'venn-classification',
        prompt: '<p>Sort each animal into the correct region of the Venn diagram.</p>',
        promptEnabled: true,
        circles: [{ label: 'Reptile' }, { label: 'Egg-layer' }],
        tiles: [
          {
            id: 'crocodile',
            label: 'Crocodile',
            imageUrl: reptileTileImageUrls.crocodile,
            imageAlt: 'Crocodile',
            correctRegion: [0, 1],
          },
          {
            id: 'turtle',
            label: 'Turtle',
            imageUrl: reptileTileImageUrls.turtle,
            imageAlt: 'Turtle',
            correctRegion: [0, 1],
          },
          {
            id: 'frog',
            label: 'Frog',
            imageUrl: reptileTileImageUrls.frog,
            imageAlt: 'Frog',
            correctRegion: [1],
          },
          {
            id: 'chicken',
            label: 'Chicken',
            imageUrl: reptileTileImageUrls.chicken,
            imageAlt: 'Chicken',
            correctRegion: [1],
          },
          {
            id: 'snake',
            label: 'Snake',
            imageUrl: reptileTileImageUrls.snake,
            imageAlt: 'Snake',
            correctRegion: [0, 1],
          },
          {
            id: 'dolphin',
            label: 'Dolphin',
            imageUrl: reptileTileImageUrls.dolphin,
            imageAlt: 'Dolphin',
            correctRegion: [],
          },
        ],
        scoringPolicy: 'partialPerTile',
      },
      session: {
        id: '1',
        element: 'venn-classification',
        placements: {
          crocodile: [1],
          dolphin: [0, 1],
          frog: null,
          chicken: null,
          turtle: null,
          snake: null,
        },
      },
    },
    {
      id: 'prime-odd',
      title: 'Prime & Odd numbers',
      description:
        "LaTeX tiles (roots, fractions, powers, products) so MathJax is clearly visible; classify each expression's integer value.",
      tags: ['venn', 'classification', 'math', 'numbers'],
      model: {
        id: '1',
        element: 'venn-classification',
        prompt:
          '<p>Each tile is an expression. Classify its <strong>value</strong> as <strong>prime</strong>, <strong>odd</strong>, both, or neither.</p><p>For example, \\( \\sqrt{9} \\) has value \\( 3 \\).</p>',
        promptEnabled: true,
        circles: [{ label: 'Prime' }, { label: 'Odd' }],
        tiles: [
          { id: 'two', label: '\\( \\sqrt{4} \\)', correctRegion: [0] },
          { id: 'three', label: '\\( \\frac{9}{3} \\)', correctRegion: [0, 1] },
          { id: 'five', label: '\\( \\frac{25}{5} \\)', correctRegion: [0, 1] },
          { id: 'nine', label: '\\( 3^2 \\)', correctRegion: [1] },
          { id: 'fifteen', label: '\\( 3 \\times 5 \\)', correctRegion: [1] },
          { id: 'four', label: '\\( 2^2 \\)', correctRegion: [] },
        ],
        scoringPolicy: 'partialPerTile',
      },
      session: {
        id: '1',
        element: 'venn-classification',
        placements: {
          two: null,
          three: null,
          five: null,
          nine: null,
          fifteen: null,
          four: null,
        },
      },
    },
    {
      id: 'shapes-overrides',
      title: 'Shapes (with region-label overrides)',
      description: 'Exercises allOrNothing scoring and per-region label overrides.',
      tags: ['venn', 'classification', 'overrides', 'geometry'],
      model: {
        id: '1',
        element: 'venn-classification',
        prompt:
          "<p>Classify each shape by whether it's a quadrilateral, has a right angle, both, or neither.</p>",
        promptEnabled: true,
        circles: [{ label: 'Quadrilateral' }, { label: 'Has a right angle' }],
        tiles: [
          { id: 'square', label: 'Square', correctRegion: [0, 1] },
          { id: 'rectangle', label: 'Rectangle', correctRegion: [0, 1] },
          { id: 'rhombus', label: 'Rhombus', correctRegion: [0] },
          { id: 'right-triangle', label: 'Right triangle', correctRegion: [1] },
          { id: 'circle', label: 'Circle', correctRegion: [] },
        ],
        regionLabels: {
          '0,1': 'Right-angled quadrilateral',
          '': 'Other shape',
        },
        scoringPolicy: 'allOrNothing',
      },
      session: {
        id: '1',
        element: 'venn-classification',
        placements: {
          square: null,
          rectangle: null,
          rhombus: null,
          'right-triangle': null,
          circle: null,
        },
      },
    },
  ],
};
