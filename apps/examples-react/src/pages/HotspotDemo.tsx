import HotspotComponent from '@pie-element/hotspot/src/delivery';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Hotspot model interface
interface HotspotShape {
  id: string;
  type: 'circle' | 'rectangle' | 'polygon';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  points?: number[];
  correct: boolean;
}

interface HotspotModel {
  id: string;
  element: string;
  prompt: string;
  imageUrl: string;
  dimensions: { width: number; height: number };
  shapes: HotspotShape[];
  multipleCorrect: boolean;
  outlineColor: string;
  hotspotColor: string;
  hoverOutlineColor: string;
  selectedHotspotColor: string;
  strokeWidth: number;
  mode?: 'gather' | 'view' | 'evaluate';
  disabled?: boolean;
}

// Sample configurations
const samples: Record<string, HotspotModel> = {
  default: {
    id: 'hotspot-demo-1',
    element: '@pie-element/hotspot',
    prompt: '<p><strong>Click on the red circle in the image below.</strong></p>',
    imageUrl:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9InJlZCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjgwIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DbGljayB0aGUgcmVkIGNpcmNsZTwvdGV4dD4KPC9zdmc+',
    dimensions: { width: 400, height: 300 },
    shapes: [
      {
        id: 'shape-1',
        type: 'circle',
        x: 200,
        y: 150,
        radius: 50,
        correct: true,
      },
    ],
    multipleCorrect: false,
    outlineColor: '#000000',
    hotspotColor: 'rgba(0, 255, 0, 0.3)',
    hoverOutlineColor: '#0000FF',
    selectedHotspotColor: 'rgba(255, 0, 0, 0.3)',
    strokeWidth: 2,
  },
  'simple-circle': {
    id: 'hotspot-simple-1',
    element: '@pie-element/hotspot',
    prompt: '<p><strong>Click on the red circle.</strong></p>',
    imageUrl:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9InJlZCIvPgo8L3N2Zz4=',
    dimensions: { width: 400, height: 300 },
    shapes: [
      {
        id: 'shape-1',
        type: 'circle',
        x: 200,
        y: 150,
        radius: 50,
        correct: true,
      },
    ],
    multipleCorrect: false,
    outlineColor: '#000000',
    hotspotColor: 'rgba(0, 255, 0, 0.3)',
    hoverOutlineColor: '#0000FF',
    selectedHotspotColor: 'rgba(255, 0, 0, 0.3)',
    strokeWidth: 2,
  },
};

export default function HotspotDemo() {
  const [searchParams] = useSearchParams();
  const sampleId = searchParams.get('sampleId') || 'default';
  const initialMode = (searchParams.get('mode') as 'gather' | 'view' | 'evaluate') || 'gather';

  const [mode, setMode] = useState<'gather' | 'view' | 'evaluate'>(initialMode);
  const [session, setSession] = useState({ answers: [] });

  const model = useMemo(() => {
    const sample = samples[sampleId] || samples.default;
    return {
      ...sample,
      mode,
      disabled: false,
    };
  }, [sampleId, mode]);

  const handleSessionChange = (newSession: { answers: unknown[] }) => {
    setSession(newSession);
  };

  const reset = () => {
    setSession({ answers: [] });
    setMode('gather');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Gallery
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-2">Hotspot</h1>
      <p className="text-lg text-gray-600 mb-8">Interactive image hotspot assessment element</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Element Preview</h2>
            <div className="bg-gray-50 p-6 rounded" style={{ position: 'relative', overflow: 'visible' }}>
              <HotspotComponent
                model={model}
                session={session}
                onSessionChange={handleSessionChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Mode</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'gather'}
                  onChange={() => setMode('gather')}
                  className="w-4 h-4"
                />
                <span>Gather</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'view'}
                  onChange={() => setMode('view')}
                  className="w-4 h-4"
                />
                <span>View</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'evaluate'}
                  onChange={() => setMode('evaluate')}
                  className="w-4 h-4"
                />
                <span>Evaluate</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <button
              type="button"
              onClick={reset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset
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
            { title: 'Image Interaction', desc: 'Click on specific regions' },
            { title: 'Shape Types', desc: 'Circles, rectangles, polygons' },
            { title: 'Multiple Selections', desc: 'Single or multiple hotspots' },
            { title: 'Visual Feedback', desc: 'Hover and selection states' },
            { title: 'Canvas-based', desc: 'Uses Konva for rendering' },
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
