import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc } from 'firebase/firestore';

// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const API_URL = "http://localhost:8000";

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [buffers, setBuffers] = useState({});
  const [simStatus, setSimStatus] = useState({ running: false });
  const [loading, setLoading] = useState(false);

  // Listen to metrics from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'metrics', 'current'), (doc) => {
      if (doc.exists()) {
        setMetrics(doc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to buffer states
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'buffers'), (snapshot) => {
      const bufferData = {};
      snapshot.forEach((doc) => {
        bufferData[doc.id] = doc.data();
      });
      setBuffers(bufferData);
    });
    return () => unsubscribe();
  }, []);

  // Fetch simulation status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/simulation/status`);
        const data = await res.json();
        setSimStatus(data);
      } catch (err) {
        console.error('Status fetch error:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAPI = async (endpoint, method = 'POST', body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${API_URL}${endpoint}`, options);
      const data = await res.json();
      alert(data.message || 'Success');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const BufferCard = ({ id, data }) => {
    if (!data) return null;
    
    const occupancyPercent = Math.round((data.current_occupancy / data.capacity) * 100);
    const getColor = () => {
      if (occupancyPercent > 85) return 'bg-red-500';
      if (occupancyPercent > 60) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">{id}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getColor()}`}>
            {occupancyPercent}%
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Occupancy:</span>
            <span className="font-semibold">{data.current_occupancy}/{data.capacity}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Current Color:</span>
            <span className="font-semibold">{data.current_color || 'Empty'}</span>
          </div>
          
          {data.is_flex && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              FLEX
            </span>
          )}
          
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-gray-500">Primary Colors:</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.primary_colors?.map(c => (
                <span key={c} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Smart Paint Shop Sequencing System
        </h1>
        <p className="text-gray-600">Real-time Vehicle Scheduling & Optimization</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Control Panel</h2>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${simStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-semibold">
              {simStatus.running ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAPI('/api/seed', 'POST', { num_vehicles: 900 })}
            disabled={loading || simStatus.running}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Seed Data (900)
          </button>
          
          <button
            onClick={() => handleAPI('/api/simulation/start')}
            disabled={loading || simStatus.running}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Simulation
          </button>
          
          <button
            onClick={() => handleAPI('/api/simulation/stop')}
            disabled={loading || !simStatus.running}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Stop Simulation
          </button>
          
          <button
            onClick={() => handleAPI('/api/simulation/reset')}
            disabled={loading || simStatus.running}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Vehicles Processed</div>
            <div className="text-3xl font-bold text-blue-600">{metrics.vehicles_processed || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Throughput</div>
            <div className="text-3xl font-bold text-green-600">{metrics.throughput || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total Changeovers</div>
            <div className="text-3xl font-bold text-orange-600">{metrics.total_changeovers || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Efficiency</div>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.efficiency_percent?.toFixed(1) || 100}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">O2 Stoppages</div>
            <div className="text-3xl font-bold text-red-600">{metrics.o2_stoppage_events || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Buffer Overflows</div>
            <div className="text-3xl font-bold text-red-600">{metrics.buffer_overflow_events || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">O1 Occupancy</div>
            <div className="text-3xl font-bold text-indigo-600">
              {metrics.oven1_occupancy || 0}/{metrics.oven1_capacity || 56}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">O2 Occupancy</div>
            <div className="text-3xl font-bold text-indigo-600">
              {metrics.oven2_occupancy || 0}/{metrics.oven2_capacity || 80}
            </div>
          </div>
        </div>
      )}

      {/* Buffer Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Buffer Status</h2>
        
        {/* Oven 1 Zone */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Oven 1 Zone (C1, C2, C3)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['L1', 'L2', 'L3', 'L4'].map(id => (
              <BufferCard key={id} id={id} data={buffers[id]} />
            ))}
          </div>
        </div>
        
        {/* Oven 2 Zone */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-700">Oven 2 Zone (C4-C12)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {['L5', 'L6', 'L7', 'L8', 'L9'].map(id => (
              <BufferCard key={id} id={id} data={buffers[id]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;