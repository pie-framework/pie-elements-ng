export default {
  demos: [
    {
      id: 'anatomy-heart',
      title: 'Human Anatomy - Heart Location',
      description: 'Single correct answer identifying the heart in a human body diagram',
      tags: ['anatomy', 'single-select', 'biology', 'basic'],
      model: {
        id: '1',
        element: 'hotspot',
        disabled: false,
        mode: 'gather',
        dimensions: {
          height: 500,
          width: 400
        },
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2Ij5IdW1hbiBCb2R5IERpYWdyYW08L3RleHQ+PC9zdmc+',
        hotspotColor: 'rgba(255, 200, 200, 0.3)',
        hotspotList: ['rgba(255, 200, 200, 0.3)'],
        outlineColor: 'red',
        outlineList: ['red'],
        selectedHotspotColor: 'rgba(255, 100, 100, 0.5)',
        hoverOutlineColor: 'darkred',
        multipleCorrect: false,
        partialScoring: false,
        strokeWidth: 3,
        promptEnabled: true,
        rationaleEnabled: true,
        teacherInstructionsEnabled: true,
        toolbarEditorPosition: 'bottom',
        prompt: '<p><strong>Click on the location of the human heart.</strong></p><p>The heart is a muscular organ that pumps blood throughout the body.</p>',
        rationale: '<p>The heart is located in the <strong>thoracic cavity</strong>, slightly left of center between the lungs. It sits behind and slightly to the left of the sternum (breastbone).</p>',
        teacherInstructions: '<p>Students should identify the heart\'s location in the upper left chest area. Common mistakes include selecting too far right or too low in the abdomen.</p>',
        shapes: {
          rectangles: [
            {
              id: '1',
              x: 160,
              y: 140,
              width: 80,
              height: 100,
              index: 0,
              correct: true
            },
            {
              id: '2',
              x: 150,
              y: 280,
              width: 100,
              height: 80,
              index: 1,
              correct: false
            }
          ],
          circles: [
            {
              id: '3',
              x: 200,
              y: 100,
              radius: 35,
              index: 2,
              correct: false
            }
          ],
          polygons: []
        }
      },
      session: {
        id: '1',
        element: 'hotspot',
        answers: []
      }
    },
    {
      id: 'geography-continents',
      title: 'World Geography - Continents',
      description: 'Multiple correct answers with partial scoring for identifying specific continents',
      tags: ['geography', 'multi-select', 'partial-scoring', 'intermediate'],
      model: {
        id: '2',
        element: 'hotspot',
        disabled: false,
        mode: 'gather',
        dimensions: {
          height: 400,
          width: 800
        },
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2FkZDhlNiIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIj5Xb3JsZCBNYXA8L3RleHQ+PC9zdmc+',
        hotspotColor: 'rgba(255, 215, 0, 0.25)',
        hotspotList: ['rgba(255, 215, 0, 0.25)'],
        outlineColor: 'orange',
        outlineList: ['orange'],
        selectedHotspotColor: 'rgba(255, 140, 0, 0.5)',
        hoverOutlineColor: 'darkorange',
        multipleCorrect: true,
        partialScoring: true,
        strokeWidth: 4,
        promptEnabled: true,
        rationaleEnabled: true,
        teacherInstructionsEnabled: true,
        toolbarEditorPosition: 'bottom',
        prompt: '<p><strong>Geography Challenge:</strong> Select all continents that are <em>entirely</em> located in the <strong>Southern Hemisphere</strong>.</p><p><small>Hint: A continent must have <u>no land</u> north of the equator to qualify.</small></p>',
        rationale: '<p>Only <strong>Antarctica</strong> and <strong>Australia</strong> are entirely in the Southern Hemisphere.</p><ul><li><strong>Antarctica</strong> - Completely surrounds the South Pole</li><li><strong>Australia</strong> - The only continent-nation, entirely south of the equator</li><li>Africa, South America, and Asia all cross the equator</li></ul>',
        teacherInstructions: '<p>This question tests understanding of hemispheres and continental geography. Students often incorrectly include South America or Africa because they have large portions in the southern hemisphere.</p><p>With partial scoring enabled, students receive credit proportional to correct selections minus incorrect ones.</p>',
        shapes: {
          rectangles: [
            {
              id: '1',
              x: 50,
              y: 150,
              width: 120,
              height: 100,
              index: 0,
              correct: false
            },
            {
              id: '2',
              x: 200,
              y: 180,
              width: 100,
              height: 120,
              index: 1,
              correct: false
            }
          ],
          circles: [
            {
              id: '3',
              x: 680,
              y: 280,
              radius: 55,
              index: 2,
              correct: true
            }
          ],
          polygons: [
            {
              id: '4',
              points: [
                { x: 350, y: 320 },
                { x: 280, y: 350 },
                { x: 320, y: 380 },
                { x: 400, y: 385 },
                { x: 430, y: 340 }
              ],
              index: 3,
              correct: true
            },
            {
              id: '5',
              points: [
                { x: 500, y: 120 },
                { x: 480, y: 180 },
                { x: 540, y: 220 },
                { x: 620, y: 200 },
                { x: 640, y: 150 },
                { x: 580, y: 100 }
              ],
              index: 4,
              correct: false
            }
          ]
        }
      },
      session: {
        id: '2',
        element: 'hotspot',
        answers: []
      }
    },
    {
      id: 'geometry-polygons',
      title: 'Geometry - Identify Quadrilaterals',
      description: 'Math problem with rich text and LaTeX identifying specific polygon types',
      tags: ['math', 'geometry', 'rich-text', 'latex', 'multi-select'],
      model: {
        id: '3',
        element: 'hotspot',
        disabled: false,
        mode: 'gather',
        dimensions: {
          height: 500,
          width: 700
        },
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2ZmZmZmZiIvPjxsaW5lIHgxPSIwIiB5MT0iMjUwIiB4Mj0iNzAwIiB5Mj0iMjUwIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIzNTAiIHkxPSIwIiB4Mj0iMzUwIiB5Mj0iNTAwIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjM1MCIgeT0iMjUwIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5HZW9tZXRyaWMgU2hhcGVzPC90ZXh0Pjwvc3ZnPg==',
        hotspotColor: 'rgba(137, 183, 244, 0.25)',
        hotspotList: ['rgba(137, 183, 244, 0.25)'],
        outlineColor: 'blue',
        outlineList: ['blue'],
        selectedHotspotColor: 'rgba(70, 130, 255, 0.45)',
        hoverOutlineColor: 'darkblue',
        multipleCorrect: true,
        partialScoring: true,
        strokeWidth: 5,
        promptEnabled: true,
        rationaleEnabled: true,
        teacherInstructionsEnabled: true,
        toolbarEditorPosition: 'bottom',
        prompt: '<div><p><strong>Geometry Problem:</strong></p><p>A <em>parallelogram</em> is a quadrilateral where opposite sides are parallel. The area formula is:</p><p style="text-align: center;">$$A = b \\times h$$</p><p>where \\(b\\) is the base length and \\(h\\) is the perpendicular height.</p><p><strong>Select all shapes that are parallelograms.</strong></p><p><small>Remember: Rectangles, squares, and rhombuses are special types of parallelograms!</small></p></div>',
        rationale: '<div><p>The parallelograms in this diagram are:</p><ol><li><strong>Rectangle</strong> - All angles are 90°, opposite sides parallel and equal</li><li><strong>Rhombus</strong> - All sides equal length, opposite sides parallel</li><li><strong>Generic Parallelogram</strong> - Opposite sides parallel and equal, but not right angles</li></ol><p>The trapezoid is <strong>not</strong> a parallelogram because only one pair of sides is parallel.</p><p>Mathematical notation: If \\(ABCD\\) is a parallelogram, then \\(\\overline{AB} \\parallel \\overline{CD}\\) and \\(\\overline{AD} \\parallel \\overline{BC}\\).</p></div>',
        teacherInstructions: '<p>This problem combines geometric knowledge with the ability to recognize special cases. Students need to understand that:</p><ul><li>All rectangles are parallelograms</li><li>All rhombuses are parallelograms</li><li>Squares are both rectangles and rhombuses</li><li>Trapezoids have only ONE pair of parallel sides</li></ul><p>Math rendering is enabled with MathJax for LaTeX formulas.</p>',
        shapes: {
          rectangles: [
            {
              id: '1',
              x: 80,
              y: 80,
              width: 140,
              height: 100,
              index: 0,
              correct: true
            },
            {
              id: '2',
              x: 480,
              y: 300,
              width: 100,
              height: 120,
              index: 1,
              correct: false
            }
          ],
          circles: [
            {
              id: '3',
              x: 580,
              y: 120,
              radius: 50,
              index: 2,
              correct: false
            }
          ],
          polygons: [
            {
              id: '4',
              points: [
                { x: 120, y: 300 },
                { x: 200, y: 270 },
                { x: 280, y: 300 },
                { x: 200, y: 330 }
              ],
              index: 3,
              correct: true
            },
            {
              id: '5',
              points: [
                { x: 350, y: 100 },
                { x: 420, y: 80 },
                { x: 480, y: 180 },
                { x: 350, y: 180 }
              ],
              index: 4,
              correct: true
            },
            {
              id: '6',
              points: [
                { x: 360, y: 280 },
                { x: 420, y: 260 },
                { x: 450, y: 350 },
                { x: 330, y: 350 }
              ],
              index: 5,
              correct: false
            }
          ]
        }
      },
      session: {
        id: '3',
        element: 'hotspot',
        answers: []
      }
    }
  ]
};