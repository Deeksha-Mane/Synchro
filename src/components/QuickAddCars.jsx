import { useState, useEffect } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function QuickAddCars({ onClose, onSuccess }) {
  const [cars, setCars] = useState([]);
  const [currentCar, setCurrentCar] = useState({
    color: 'C1',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationCars, setSimulationCars] = useState([]);

  const colors = [
    { id: 'C1', name: 'White', hex: '#FFFFFF', volume: 40 },
    { id: 'C2', name: 'Silver', hex: '#C0C0C0', volume: 25 },
    { id: 'C3', name: 'Black', hex: '#000000', volume: 12 },
    { id: 'C4', name: 'Red', hex: '#FF0000', volume: 8 },
    { id: 'C5', name: 'Blue', hex: '#0000FF', volume: 3 },
    { id: 'C6', name: 'Green', hex: '#008000', volume: 2 },
    { id: 'C7', name: 'Yellow', hex: '#FFFF00', volume: 2 },
    { id: 'C8', name: 'Orange', hex: '#FFA500', volume: 2 },
    { id: 'C9', name: 'Purple', hex: '#800080', volume: 2 },
    { id: 'C10', name: 'Brown', hex: '#A52A2A', volume: 2 },
    { id: 'C11', name: 'Gray', hex: '#808080', volume: 2 },
    { id: 'C12', name: 'Pink', hex: '#FFC0CB', volume: 1 },
  ];

  const handleAddCar = () => {
    if (currentCar.quantity > 0) {
      setCars([...cars, { ...currentCar, id: Date.now() }]);
      setCurrentCar({ color: 'C1', quantity: 1 });
    }
  };

  const handleRemoveCar = (id) => {
    setCars(cars.filter(car => car.id !== id));
  };

  const getTotalCars = () => {
    return cars.reduce((sum, car) => sum + parseInt(car.quantity), 0);
  };

  const getColorDistribution = () => {
    const distribution = {};
    const total = getTotalCars();
    
    cars.forEach(car => {
      if (!distribution[car.color]) {
        distribution[car.color] = 0;
      }
      distribution[car.color] += parseInt(car.quantity);
    });

    return Object.entries(distribution).map(([color, count]) => ({
      color,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  };

  // Generate simulation preview
  const generateSimulation = () => {
    const simCars = [];
    let carIndex = 1;

    cars.forEach(carGroup => {
      for (let i = 0; i < parseInt(carGroup.quantity); i++) {
        const colorInfo = colors.find(c => c.id === carGroup.color);
        simCars.push({
          car_id: `CUSTOM${String(carIndex).padStart(4, '0')}`,
          color: carGroup.color,
          colorName: colorInfo.name,
          colorHex: colorInfo.hex,
          status: 'waiting',
          priority: colorInfo.volume,
          buffer_line: null,
          oven: null
        });
        carIndex++;
      }
    });

    setSimulationCars(simCars);
    setShowSimulation(true);
  };

  const handleSubmit = async () => {
    if (cars.length === 0) {
      alert('Please add at least one car');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      let carIndex = 1;

      // Generate unique starting number based on timestamp
      const uniqueStart = Date.now() % 10000;

      cars.forEach(carGroup => {
        for (let i = 0; i < parseInt(carGroup.quantity); i++) {
          const carId = uniqueStart + carIndex;
          const colorInfo = colors.find(c => c.id === carGroup.color);
          
          const carRef = doc(collection(db, 'cars'));
          // Match exact structure of original dataset
          batch.set(carRef, {
            car_id: carId,
            color: carGroup.color,
            status: 'waiting',
            buffer_line: null,
            oven: null,
            priority: colorInfo.volume,
            created_at: timestamp,
            updated_at: timestamp,
            source: 'manual_input'
          });
          
          carIndex++;
        }
      });

      await batch.commit();
      
      onSuccess && onSuccess(getTotalCars());
      onClose && onClose();
    } catch (error) {
      console.error('Error adding cars:', error);
      alert('Failed to add cars: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getColorHex = (colorId) => {
    return colors.find(c => c.id === colorId)?.hex || '#CCCCCC';
  };

  const getColorName = (colorId) => {
    return colors.find(c => c.id === colorId)?.name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">🚗 Quick Add Custom Cars</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">Add your custom car sequence for testing</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {/* Quick Add Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Add Cars</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setCurrentCar({ ...currentCar, color: color.id })}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        currentCar.color === color.id
                          ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title={`${color.name} (${color.volume}%)`}
                      type="button"
                    >
                      <div
                        className="w-full h-6 sm:h-8 rounded border border-gray-400"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs mt-1 font-medium">{color.id}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={currentCar.quantity}
                    onChange={(e) => setCurrentCar({ ...currentCar, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base sm:text-lg font-semibold focus:outline-none"
                  />
                  <button
                    onClick={handleAddCar}
                    type="button"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    ➕ Add
                  </button>
                </div>
                
                {/* Quick Add Buttons */}
                <div className="flex gap-2 mt-3">
                  {[5, 10, 20, 50].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => {
                        const newCar = { ...currentCar, quantity: qty };
                        setCars([...cars, { ...newCar, id: Date.now() }]);
                      }}
                      className="flex-1 px-2 sm:px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Added Cars List */}
          {cars.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Added Cars ({getTotalCars()} total)
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showPreview ? '📊 Hide' : '📊 Show'} Distribution
                </button>
              </div>

              {/* Distribution Preview */}
              {showPreview && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getColorDistribution().map(item => (
                      <div key={item.color} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: getColorHex(item.color) }}
                          />
                          <span className="font-semibold text-sm">{item.color}</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cars List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cars.map(car => (
                  <div
                    key={car.id}
                    className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: getColorHex(car.color) }}
                      />
                      <div>
                        <div className="font-semibold text-gray-800">
                          {car.color} - {getColorName(car.color)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Quantity: {car.quantity} cars
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCar(car.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulation Preview */}
          {showSimulation && simulationCars.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  🎬 Live Simulation Preview
                </h3>
                <button
                  onClick={() => setShowSimulation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {simulationCars.map((car, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:scale-105 cursor-pointer"
                      title={`${car.car_id} - ${car.colorName}`}
                    >
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 mb-2 shadow-sm"
                        style={{ backgroundColor: car.colorHex }}
                      />
                      <div className="text-xs font-semibold text-gray-700">{car.car_id}</div>
                      <div className="text-xs text-gray-500">{car.color}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <strong>{simulationCars.length}</strong> cars ready to be added
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    ✓ Validated
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    Ready to Submit
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base"
            >
              Cancel
            </button>
            
            {!showSimulation && cars.length > 0 && (
              <button
                onClick={generateSimulation}
                type="button"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                🎬 Preview Simulation
              </button>
            )}
            
            <button
              onClick={handleSubmit}
              type="button"
              disabled={loading || cars.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding {getTotalCars()} Cars...
                </span>
              ) : (
                `🚀 Add ${getTotalCars()} Cars to Database`
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <strong>✨ Pro Tip:</strong> Click "Preview Simulation" to see your cars before adding them to the database. All cars will be stored with the same structure as the original dataset and ready for algorithm processing!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
