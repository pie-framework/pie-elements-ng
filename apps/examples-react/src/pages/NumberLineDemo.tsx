import { NumberLine as NumberLineComponent } from '@pie-element/number-line/src/number-line';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Number Line model interface
interface NumberLineGraph {
  domain: { min: number; max: number };
  ticks: { minor: number; major: number };
  snapPerTick: number;
  initialElements: unknown[];
  availableTypes: {
    PF?: boolean;
    PE?: boolean;
    LFF?: boolean;
    LEF?: boolean;
    LFE?: boolean;
    LEE?: boolean;
    RFN?: boolean;
    REN?: boolean;
  };
  arrows: 'left' | 'right' | 'both' | 'none';
}

interface NumberLineModel {
  id: string;
  element: string;
  prompt: string;
  graph: NumberLineGraph;
  disabled: boolean;
}

// Sample configurations
const samples: Record<string, NumberLineModel> = {
  default: {
    id: 'number-line-demo-1',
    element: '@pie-element/number-line',
    prompt: '<p><strong>Place points on the number line.</strong></p>',
    graph: {
      domain: { min: -5, max: 5 },
      ticks: { minor: 1, major: 1 },
      snapPerTick: 1,
      initialElements: [],
      availableTypes: {
        PF: true,
        PE: true,
        LFF: true,
        LEF: true,
        LFE: true,
        LEE: true,
        RFN: true,
        REN: true,
      },
      arrows: 'both',
    },
    disabled: false,
  },
  'simple-points': {
    id: 'number-line-simple-1',
    element: '@pie-element/number-line',
    prompt: '<p><strong>Place two points at -2 and 3.</strong></p>',
    graph: {
      domain: { min: -10, max: 10 },
      ticks: { minor: 1, major: 5 },
      snapPerTick: 1,
      initialElements: [],
      availableTypes: {
        PF: true,
        PE: true,
      },
      arrows: 'both',
    },
    disabled: false,
  },
};

export default function NumberLineDemo() {
  const [searchParams] = useSearchParams();
  const sampleId = searchParams.get('sampleId') || 'default';

  const [session, setSession] = useState({ answer: [] });

  const model = useMemo(() => {
    return samples[sampleId] || samples.default;
  }, [sampleId]);

  const handleAddElement = (data: unknown) => {
    console.log('Add element:', data);
  };

  const handleMoveElement = (index: number, el: unknown, position: unknown) => {
    console.log('Move element:', index, el, position);
  };

  const handleDeleteElements = (indices: number[]) => {
    console.log('Delete elements:', indices);
  };

  const handleUndoElement = () => {
    console.log('Undo element');
  };

  const handleClearElements = () => {
    setSession({ answer: [] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Gallery
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-2">Number Line</h1>
      <p className="text-lg text-gray-600 mb-8">
        Interactive number line with points, lines, and rays
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Element Preview</h2>
            <div className="bg-gray-50 p-6 rounded">
              <NumberLineComponent
                model={model}
                answer={session.answer}
                onAddElement={handleAddElement}
                onMoveElement={handleMoveElement}
                onDeleteElements={handleDeleteElements}
                onUndoElement={handleUndoElement}
                onClearElements={handleClearElements}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <button
              type="button"
              onClick={handleClearElements}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Clear All
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Session</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Points', desc: 'Full or empty circle points' },
            { title: 'Lines & Rays', desc: 'Line segments and rays' },
            { title: 'Configurable Domain', desc: 'Custom min/max values' },
            { title: 'Ticks & Labels', desc: 'Configurable tick marks' },
            { title: 'Drag & Drop', desc: 'Interactive placement' },
            { title: 'Canvas-based', desc: 'SVG with D3' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
