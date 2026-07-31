import React from 'react';
import { HistoryEntry } from '../types';
import { Trash2, Copy, Download, RefreshCw } from 'lucide-react';
import { formatEngineering, POWER_UNITS, FREQUENCY_UNITS, TIME_UNITS } from '../utils/units';

interface CalculationHistoryProps {
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  onDeleteEntry: (id: string) => void;
}

export function CalculationHistory({ history, onLoadHistory, onClearHistory, onDeleteEntry }: CalculationHistoryProps) {
  if (history.length === 0) return null;

  const exportCSV = () => {
    let csv = "Date,Mode,AvgPower,AvgPowerUnit,RepRate,RepRateUnit,PulseEnergy,EnergyUnit,PulseDuration,DurationUnit,PeakPower,PeakPowerUnit,Shape\n";
    history.forEach(h => {
      const date = new Date(h.timestamp).toISOString();
      const st = h.inputs;
      csv += `${date},${st.mode},${st.averagePower.value},${st.averagePower.unit},${st.repetitionRate.value},${st.repetitionRate.unit},${st.pulseEnergy.value},${st.pulseEnergy.unit},${st.pulseDuration.value},${st.pulseDuration.unit},${st.peakPower.value},${st.peakPower.unit},${st.pulseShape}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laser_calculations_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">History</h3>
        <div className="flex gap-2">
          <button 
            onClick={exportCSV}
            className="p-1.5 text-slate-500 hover:text-cyan-500 hover:bg-slate-800 rounded transition-colors"
            title="Export to CSV"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={onClearHistory}
            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded transition-colors"
            title="Clear History"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto scrollbar-hide">
        {history.map(entry => (
          <div key={entry.id} className="p-3 hover:bg-slate-800/50 flex items-center justify-between group transition-colors">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 mr-2">
                  {entry.inputs.mode.replace('-', ' ')}
                </span>
                <span className="text-[9px] text-slate-600">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-slate-300 truncate font-mono">
                {entry.inputs.averagePower.value && `${entry.inputs.averagePower.value}${entry.inputs.averagePower.unit}`}
                {entry.inputs.repetitionRate.value && ` @ ${entry.inputs.repetitionRate.value}${entry.inputs.repetitionRate.unit}`}
                {entry.inputs.pulseDuration.value && `, ${entry.inputs.pulseDuration.value}${entry.inputs.pulseDuration.unit}`}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onLoadHistory(entry)}
                className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded"
                title="Load"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                onClick={() => onDeleteEntry(entry.id)}
                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
