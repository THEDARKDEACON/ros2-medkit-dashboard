import { useState } from 'react';
import { useFaults } from '../features/api/hooks';
import { FaultTimeline } from '../components/faults/FaultTimeline';
import { FaultMonitor } from '../components/faults/FaultMonitor';
import { FaultDetail } from '../components/faults/FaultDetail';
import type { Fault } from '../types/api';

export function Faults() {
  const { data: faults = [] } = useFaults();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex-none">
        <h1 className="text-3xl font-bold">Fault Management</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor, analyze, and diagnose system faults
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6">
        {/* Timeline View */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Fault History</h2>
          <FaultTimeline
            faults={faults}
            onFaultSelect={setSelectedFault}
            height={200}
          />
        </div>

        {/* Current Faults and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
          {/* Fault Monitor */}
          <div className="rounded-lg border bg-card p-4 shadow-sm h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Active Faults</h2>
            <div className="flex-1 overflow-y-auto">
              <FaultMonitor
                onFaultSelect={setSelectedFault}
                showFilter={true}
              />
            </div>
          </div>

          {/* Fault Detail */}
          <div className="rounded-lg border bg-card p-4 shadow-sm h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Fault Details</h2>
            <div className="flex-1 overflow-y-auto pr-2">
              {selectedFault ? (
                <FaultDetail faultCode={selectedFault.code} />
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed border-border rounded-lg text-muted-foreground">
                  Select a fault to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
