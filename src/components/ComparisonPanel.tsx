import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CalculatorState, CalculationResult } from '../types';
import { formatEngineering, POWER_UNITS, ENERGY_UNITS, TIME_UNITS, FREQUENCY_UNITS, PEAK_POWER_UNITS } from '../utils/units';
import { toSI } from '../utils/units';
import { calculatePulseEnergy, calculatePeakPower, calculateDutyCycle } from '../utils/calculations';

interface ComparisonPanelProps {
  currentResult: CalculationResult | null;
  currentState: CalculatorState;
}

export function ComparisonPanel({ currentResult, currentState }: ComparisonPanelProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Minimal state for Configuration B
  const [avgPowerB, setAvgPowerB] = useState('30');
  const [repRateB, setRepRateB] = useState('1');
  const [durationB, setDurationB] = useState('50');
  const [powerUnitB, setPowerUnitB] = useState('W');
  const [repUnitB, setRepUnitB] = useState('MHz');
  const [durUnitB, setDurUnitB] = useState('fs');

  if (!currentResult) return null;

  let resultB: any = null;
  let error = '';

  try {
    const avgPB = toSI(parseFloat(avgPowerB), powerUnitB, POWER_UNITS);
    const repRB = toSI(parseFloat(repRateB), repUnitB, FREQUENCY_UNITS);
    const durB = toSI(parseFloat(durationB), durUnitB, TIME_UNITS);
    
    if (avgPB && repRB && durB) {
      const energyB = calculatePulseEnergy(avgPB, repRB);
      const peakB = calculatePeakPower(energyB, durB, currentState.pulseShape);
      const dutyB = calculateDutyCycle(repRB, durB);
      resultB = {
        pulseEnergy: energyB,
        peakPower: peakB,
        dutyCycle: dutyB
      };
    }
  } catch (e) {
    error = 'Invalid inputs for Config B';
  }

  const renderComparisonRow = (label: string, valA: number, valB: number, units: any[]) => {
    const engA = formatEngineering(valA, units);
    const engB = formatEngineering(valB, units);
    
    const ratio = valB / valA;
    let ratioText = '';
    if (ratio > 1) ratioText = `${ratio.toFixed(2)}x larger`;
    else if (ratio < 1) ratioText = `${(1/ratio).toFixed(2)}x smaller`;
    else ratioText = 'Equal';

    return (
      <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
        <div className="w-1/3 text-xs font-medium text-slate-500">{label}</div>
        <div className="w-1/4 text-xs text-slate-900 font-mono">
          {engA.value.toPrecision(3)} <span className="text-[10px] text-slate-400">{engA.unit}</span>
        </div>
        <div className="w-1/4 text-xs text-slate-900 font-mono">
          {engB.value.toPrecision(3)} <span className="text-[10px] text-slate-400">{engB.unit}</span>
        </div>
        <div className="w-1/4 text-[10px] text-right text-blue-600 font-bold uppercase tracking-wider">
          {ratioText}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 focus:outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Compare Configurations
        </h3>
        {expanded ? <ChevronUp className="text-slate-500 w-4 h-4" /> : <ChevronDown className="text-slate-500 w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="p-6 border-t border-slate-200 space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-4">Current Config (A)</h4>
              <div className="space-y-2 text-xs text-slate-700 font-mono">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Power:</span> 
                  <span>{currentState.averagePower.value} {currentState.averagePower.unit}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Rate:</span> 
                  <span>{currentState.repetitionRate.value} {currentState.repetitionRate.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span> 
                  <span>{currentState.pulseDuration.value} {currentState.pulseDuration.unit}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-4">Test Config (B)</h4>
              <div className="space-y-2">
                <div className="flex shadow-sm rounded-lg">
                   <input type="number" className="w-full bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={avgPowerB} onChange={e => setAvgPowerB(e.target.value)} />
                   <select className="bg-slate-100 border border-slate-200 rounded-r-lg px-2 py-1 text-[10px] text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={powerUnitB} onChange={e => setPowerUnitB(e.target.value)}>
                     {POWER_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                   </select>
                </div>
                <div className="flex shadow-sm rounded-lg">
                   <input type="number" className="w-full bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={repRateB} onChange={e => setRepRateB(e.target.value)} />
                   <select className="bg-slate-100 border border-slate-200 rounded-r-lg px-2 py-1 text-[10px] text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={repUnitB} onChange={e => setRepUnitB(e.target.value)}>
                     {FREQUENCY_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                   </select>
                </div>
                <div className="flex shadow-sm rounded-lg">
                   <input type="number" className="w-full bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={durationB} onChange={e => setDurationB(e.target.value)} />
                   <select className="bg-slate-100 border border-slate-200 rounded-r-lg px-2 py-1 text-[10px] text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none" value={durUnitB} onChange={e => setDurUnitB(e.target.value)}>
                     {TIME_UNITS.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
                   </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
              <div className="w-1/3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metric</div>
              <div className="w-1/4 text-[10px] font-bold text-blue-600 uppercase tracking-widest">Config A</div>
              <div className="w-1/4 text-[10px] font-bold text-orange-600 uppercase tracking-widest">Config B</div>
              <div className="w-1/4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Difference</div>
            </div>
            
            {resultB ? (
              <>
                {renderComparisonRow('Pulse Energy', currentResult.pulseEnergy, resultB.pulseEnergy, ENERGY_UNITS)}
                {renderComparisonRow('Peak Power', currentResult.peakPower, resultB.peakPower, PEAK_POWER_UNITS)}
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div className="w-1/3 text-xs font-medium text-slate-500">Duty Cycle</div>
                  <div className="w-1/4 text-xs text-slate-900 font-mono">
                    {(currentResult.dutyCycle * 100).toExponential(2)}<span className="text-[10px] text-slate-400">%</span>
                  </div>
                  <div className="w-1/4 text-xs text-slate-900 font-mono">
                    {(resultB.dutyCycle * 100).toExponential(2)}<span className="text-[10px] text-slate-400">%</span>
                  </div>
                  <div className="w-1/4 text-xs text-right text-blue-600 font-medium">
                    {currentResult.dutyCycle === resultB.dutyCycle ? 'Equal' : (resultB.dutyCycle > currentResult.dutyCycle ? 'Increased' : 'Decreased')}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-red-500 py-4 font-mono">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
