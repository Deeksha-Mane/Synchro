// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function LandingPage() {
//   const { currentUser } = useAuth();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
//       {/* Navigation */}
//       <nav className="flex justify-between items-center p-6">
//         <div className="flex items-center space-x-3">
//           <div className="text-white text-2xl font-bold">Smart Sequencing</div>
//           <div className="text-orange-400 text-sm font-medium">
//             Conveyor & Buffer Management
//           </div>
//         </div>
//         <div className="space-x-4">
//           {currentUser ? (
//             <Link
//               to="/dashboard"
//               className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-300"
//             >
//               Dashboard
//             </Link>
//           ) : (
//             <Link
//               to="/login"
//               className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-300"
//             >
//               Login
//             </Link>
//           )}
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
//         <div className="max-w-6xl mx-auto">
//           <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
//             Smart Sequencing for
//             <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
//               {" "}
//               Manufacturing Excellence
//             </span>
//           </h1>

//           <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
//             Optimize conveyor lines and buffer management for maximum
//             throughput, minimize completion time, and prevent buffer overflows
//             in vehicle manufacturing.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
//             {currentUser ? (
//               <Link
//                 to="/dashboard"
//                 className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-red-700 transition duration-300 transform hover:scale-105"
//               >
//                 Open Control Center
//               </Link>
//             ) : (
//               <Link
//                 to="/login"
//                 className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-red-700 transition duration-300 transform hover:scale-105"
//               >
//                 Access System
//               </Link>
//             )}
//           </div>

//           {/* System Overview */}
//           <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-12">
//             <h2 className="text-2xl font-bold text-white mb-6">
//               System Overview
//             </h2>
//             <div className="grid md:grid-cols-2 gap-8 text-left">
//               <div>
//                 <h3 className="text-lg font-semibold text-orange-400 mb-3">
//                   Production Capacity
//                 </h3>
//                 <ul className="text-gray-300 space-y-2">
//                   <li>• 900 vehicles per day</li>
//                   <li>• 12 different color variants</li>
//                   <li>• 2 ovens (O1 & O2) operating simultaneously</li>
//                   <li>• 9 buffer lines (L1-L9) with varying capacities</li>
//                 </ul>
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-orange-400 mb-3">
//                   Optimization Goals
//                 </h3>
//                 <ul className="text-gray-300 space-y-2">
//                   <li>• Maximize color grouping efficiency</li>
//                   <li>• Prevent buffer overflow conditions</li>
//                   <li>• Minimize conveyor processing time</li>
//                   <li>• Optimize Jobs Per Hour (JPH)</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Features Grid */}
//         <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
//           <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
//             <div className="text-4xl mb-4">🏭</div>
//             <h3 className="text-lg font-semibold text-white mb-2">
//               Real-time Monitoring
//             </h3>
//             <p className="text-gray-300 text-sm">
//               Live tracking of conveyor lines and buffer status
//             </p>
//           </div>

//           <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
//             <div className="text-4xl mb-4">🎨</div>
//             <h3 className="text-lg font-semibold text-white mb-2">
//               Color Sequencing
//             </h3>
//             <p className="text-gray-300 text-sm">
//               Intelligent color grouping to reduce changeovers
//             </p>
//           </div>

//           <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
//             <div className="text-4xl mb-4">📊</div>
//             <h3 className="text-lg font-semibold text-white mb-2">
//               Analytics Dashboard
//             </h3>
//             <p className="text-gray-300 text-sm">
//               Comprehensive KPIs and performance metrics
//             </p>
//           </div>

//           <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
//             <div className="text-4xl mb-4">⚡</div>
//             <h3 className="text-lg font-semibold text-white mb-2">
//               ML Optimization
//             </h3>
//             <p className="text-gray-300 text-sm">
//               Machine learning algorithms for smart scheduling
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// SmartSequencingLanding.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SmartSequencingLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [throughput, setThroughput] = useState(0);
  const [changeovers, setChangeovers] = useState(0);
  const [bufferOccupancy, setBufferOccupancy] = useState(0);
  const [pausedEvents, setPausedEvents] = useState(0);

  // Simulate live metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput((prev) => prev + Math.floor(Math.random() * 5));
      setChangeovers((prev) => prev + Math.floor(Math.random() * 2));
      setBufferOccupancy(Math.floor(Math.random() * 100));
      setPausedEvents((prev) => prev + Math.floor(Math.random() * 1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Vehicle colors for the demo
  const vehicleColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  // Steps for how it works section
  const steps = [
    {
      icon: "🔥",
      title: "Oven Production",
      description:
        "Multiple ovens produce vehicles with different colors and volumes.",
    },
    {
      icon: "📦",
      title: "Smart Buffer Allocation",
      description:
        "Vehicles are routed to preferred buffers based on color-volume mapping.",
    },
    {
      icon: "🔄",
      title: "Sequenced Conveyor Release",
      description:
        "Main conveyor picks the largest same-color run to minimize changeovers.",
    },
    {
      icon: "📊",
      title: "Real-time Optimization",
      description:
        "KPIs are continuously monitored and optimized for maximum throughput.",
    },
  ];

  // KPI metrics
  const kpis = [
    {
      title: "Throughput",
      value: `${throughput}`,
      description: "Vehicles processed",
      icon: "🚀",
    },
    {
      title: "Changeovers",
      value: `${changeovers}`,
      description: "Color switches minimized",
      icon: "🔄",
    },
    {
      title: "Buffer Occupancy",
      value: `${bufferOccupancy}%`,
      description: "Optimal utilization",
      icon: "📊",
    },
    {
      title: "Pause Events",
      value: `${pausedEvents}`,
      description: "Production interruptions",
      icon: "⏸",
    },
  ];

  // Technical stack
  const techStack = [
    { name: "Python + FastAPI", icon: "🐍" },
    { name: "Firebase Firestore", icon: "🔥" },
    { name: "React/JS Dashboard", icon: "⚛" },
    { name: "Tailwind CSS", icon: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SS</span>
              </div>
              <span className="text-xl font-bold">Smart Sequencing</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#problem"
                className="hover:text-blue-400 transition-colors"
              >
                Problem
              </a>
              <a
                href="#how-it-works"
                className="hover:text-blue-400 transition-colors"
              >
                How It Works
              </a>
              <a href="#demo" className="hover:text-blue-400 transition-colors">
                Live Demo
              </a>
              <a
                href="#metrics"
                className="hover:text-blue-400 transition-colors"
              >
                Metrics
              </a>
              <a
                href="#technical"
                className="hover:text-blue-400 transition-colors"
              >
                Technical
              </a>
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <a
                  href="#problem"
                  className="hover:text-blue-400 transition-colors"
                >
                  Problem
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-blue-400 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#demo"
                  className="hover:text-blue-400 transition-colors"
                >
                  Live Demo
                </a>
                <a
                  href="#metrics"
                  className="hover:text-blue-400 transition-colors"
                >
                  Metrics
                </a>
                <a
                  href="#technical"
                  className="hover:text-blue-400 transition-colors"
                >
                  Technical
                </a>
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-center"
                >
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Smart Sequencing for{" "}
            <span className="text-blue-400">Conveyor & Buffer Management</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Maximize throughput, minimize changeovers with our intelligent
            sequencing algorithm for PS5 manufacturing.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 mt-10">
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:-translate-y-1 shadow-lg text-center"
            >
              Access Dashboard
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-white/10 text-white font-bold py-3 px-8 rounded-lg border-2 border-white transition-all transform hover:-translate-y-1 text-center"
            >
              Start Simulation
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              The Manufacturing Challenge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimizing PS5 production with multiple ovens, buffers, and
              conveyor systems while minimizing changeovers and preventing
              overflow.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="bg-gray-100 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold">O1</span>
                    </div>
                    <p className="text-sm">Oven 1</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold">O2</span>
                    </div>
                    <p className="text-sm">Oven 2</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div
                      key={num}
                      className="bg-gray-200 p-3 rounded-lg text-center"
                    >
                      <span className="font-bold">L{num}</span>
                    </div>
                  ))}
                </div>

                <div className="h-4 bg-gray-300 rounded-full mb-6"></div>

                <div className="flex space-x-2 justify-center">
                  {vehicleColors.map((color, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 ${color} rounded-full`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:w-1/2">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Key Production Challenges
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <span className="text-red-500 text-xl">⚠</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Multiple Ovens & Buffers
                    </h4>
                    <p className="text-gray-600">
                      Coordinating production from O1 and O2 to buffers L1-L9
                      efficiently.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <span className="text-red-500 text-xl">🔄</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Minimize Changeovers
                    </h4>
                    <p className="text-gray-600">
                      Reducing color switches on the main conveyor to maximize
                      efficiency.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <span className="text-red-500 text-xl">🚫</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Prevent Overflow
                    </h4>
                    <p className="text-gray-600">
                      Ensuring buffers don't exceed capacity and cause
                      production halts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <span className="text-red-500 text-xl">📈</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Improve Efficiency
                    </h4>
                    <p className="text-gray-600">
                      Maximizing throughput while maintaining optimal resource
                      utilization.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How Smart Sequencing Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our dynamic color-volume based allocation system optimizes the
              entire production flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg transition-transform hover:-translate-y-2"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Dynamic Color-Volume Allocation
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">Vehicle Color</th>
                    <th className="px-4 py-3 text-left">Volume</th>
                    <th className="px-4 py-3 text-left">Preferred Buffers</th>
                    <th className="px-4 py-3 text-left">Alternate Buffers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                        <span>Red</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">High</td>
                    <td className="px-4 py-3">L1, L2</td>
                    <td className="px-4 py-3">L3, L4</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                        <span>Blue</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">Medium</td>
                    <td className="px-4 py-3">L3, L4</td>
                    <td className="px-4 py-3">L5, L6</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                        <span>Green</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">Low</td>
                    <td className="px-4 py-3">L7, L8</td>
                    <td className="px-4 py-3">L9</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Live Production Dashboard
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time visualization of our Smart Sequencing system in action.
            </p>
          </div>

          <div className="bg-gray-800 text-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Production Dashboard</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conveyor Visualization */}
              <div className="lg:col-span-2 bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-bold mb-4">Main Conveyor</h4>
                <div className="h-16 bg-gray-600 rounded-full mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 ${
                          vehicleColors[i % vehicleColors.length]
                        } rounded-full absolute animate-move-right`}
                        style={{
                          left: `${(i * 10) % 100}%`,
                          animationDelay: `${i * 0.5}s`,
                          animationDuration: "15s",
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                <h4 className="text-lg font-bold mb-4">Buffer Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="bg-gray-600 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">L{num}</span>
                        <span className="text-sm bg-green-500 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                      <div className="h-4 bg-gray-500 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${20 + num * 8}%` }}
                        ></div>
                      </div>
                      <div className="flex mt-2 space-x-1">
                        {vehicleColors.slice(0, 3).map((color, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 ${color} rounded-full`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics Panel */}
              <div className="bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-bold mb-4">Production Metrics</h4>
                <div className="space-y-4">
                  {kpis.map((kpi, index) => (
                    <div key={index} className="bg-gray-600 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold">{kpi.value}</div>
                          <div className="text-gray-300">{kpi.title}</div>
                        </div>
                        <div className="text-3xl">{kpi.icon}</div>
                      </div>
                      <div className="text-sm text-gray-400 mt-2">
                        {kpi.description}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-bold mb-2">Oven Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-600 p-3 rounded-lg">
                      <span>Oven 1</span>
                      <span className="bg-green-500 px-2 py-1 rounded text-sm">
                        Running
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-600 p-3 rounded-lg">
                      <span>Oven 2</span>
                      <span className="bg-green-500 px-2 py-1 rounded text-sm">
                        Running
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & KPIs Section */}
      <section id="metrics" className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Performance Metrics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quantifiable results demonstrating the efficiency of our Smart
              Sequencing system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{kpi.icon}</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {kpi.value}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {kpi.title}
                </h3>
                <p className="text-gray-600">{kpi.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Throughput Over Time
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-between p-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Overview Section */}
      <section id="technical" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Technical Architecture
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technologies for scalability and performance.
            </p>
          </div>

          <div className="bg-gray-100 p-8 rounded-xl shadow-lg mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              System Architecture
            </h3>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
                    <div className="font-bold mb-2">Ovens</div>
                    <div>O1, O2</div>
                  </div>
                  <div className="bg-green-500 text-white p-4 rounded-lg text-center">
                    <div className="font-bold mb-2">Buffers</div>
                    <div>L1-L9</div>
                  </div>
                  <div className="bg-purple-500 text-white p-4 rounded-lg text-center">
                    <div className="font-bold mb-2">Conveyor</div>
                    <div>Main Line</div>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                    API
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 text-white p-4 rounded-lg text-center">
                    <div className="font-bold mb-2">Firestore DB</div>
                    <div>Real-time Data</div>
                  </div>
                  <div className="bg-indigo-500 text-white p-4 rounded-lg text-center">
                    <div className="font-bold mb-2">React Dashboard</div>
                    <div>User Interface</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Technology Stack
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-6 rounded-xl text-center transition-transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-4">{tech.icon}</div>
                  <div className="font-bold text-gray-800">{tech.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-gray-100 p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Key Algorithms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">
                  Buffer Allocation
                </h4>
                <p className="text-gray-600">
                  Dynamic assignment based on color-volume mapping and current
                  buffer status.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">
                  Conveyor Selection
                </h4>
                <p className="text-gray-600">
                  Prioritizes largest same-color runs to minimize changeovers.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">
                  Overflow Handling
                </h4>
                <p className="text-gray-600">
                  Emergency routing when preferred buffers reach capacity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize Your Production Line?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Experience the power of Smart Sequencing with our interactive
            simulation and dashboard.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:-translate-y-1 shadow-lg text-center"
            >
              Try Simulation
            </Link>
            <button className="bg-transparent hover:bg-white/10 text-white font-bold py-3 px-8 rounded-lg border-2 border-white transition-all transform hover:-translate-y-1">
              View GitHub
            </button>
            <Link
              to="/login"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:-translate-y-1 text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">SS</span>
                </div>
                <span className="text-xl font-bold">Smart Sequencing</span>
              </div>
              <p className="text-gray-400">
                Intelligent conveyor and buffer management for optimized
                manufacturing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Project</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Releases
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Issues
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Team</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="sr-only">GitHub</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} Smart Sequencing. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SmartSequencingLanding;