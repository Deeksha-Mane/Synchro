import { useScheduling } from '../hooks/useScheduling';

export default function AlgorithmStatus() {
    const { systemStatus } = useScheduling();

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${systemStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} />
                    <span className="font-medium">
                        Scheduling Algorithm
                    </span>
                </div>
                <div className="text-sm text-gray-600">
                    {systemStatus.isRunning ? 'RUNNING' : 'STOPPED'}
                </div>
            </div>

            {systemStatus.isRunning && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                        <div className="font-semibold text-blue-600">{systemStatus.metrics.totalProcessed}</div>
                        <div className="text-gray-500">Processed</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-green-600">{systemStatus.metrics.jph.toFixed(1)}</div>
                        <div className="text-gray-500">JPH</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-orange-600">{systemStatus.metrics.colorChangeovers}</div>
                        <div className="text-gray-500">Changeovers</div>
                    </div>
                </div>
            )}
        </div>
    );
}