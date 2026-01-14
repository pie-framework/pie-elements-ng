import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import HotspotDemo from './pages/HotspotDemo';
import NumberLineDemo from './pages/NumberLineDemo';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
                  PIE React Elements
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://github.com/pie-framework/pie-elements-ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotspot" element={<HotspotDemo />} />
          <Route path="/number-line" element={<NumberLineDemo />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
