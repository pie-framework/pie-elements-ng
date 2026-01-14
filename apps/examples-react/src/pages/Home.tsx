import { Link } from 'react-router-dom';

export default function Home() {
  const elements = [
    {
      name: 'Hotspot',
      path: '/hotspot',
      description: 'Interactive image regions with clickable hotspots',
      status: 'Working',
    },
    {
      name: 'Number Line',
      path: '/number-line',
      description: 'Place points, lines, and rays on a number line',
      status: 'Partial',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">PIE React Elements Gallery</h1>
        <p className="text-xl text-gray-600">Interactive assessment components built with React</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elements.map((element) => (
          <Link
            key={element.path}
            to={element.path}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-2xl font-semibold text-gray-900">{element.name}</h2>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  element.status === 'Working'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {element.status}
              </span>
            </div>
            <p className="text-gray-600">{element.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500">More elements coming soon...</p>
      </div>
    </div>
  );
}
