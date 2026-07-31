import React, { useState, useEffect } from 'react';
import { CalculatorState, CalculationResult, HistoryEntry, BaseInput } from './types';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultCard } from './components/ResultCard';
import { ChatbotPanel } from './components/ChatbotPanel';
import { PulseTrainDiagram } from './components/PulseTrainDiagram';
import { IntensityCalculator } from './components/IntensityCalculator';
import { CalculationHistory } from './components/CalculationHistory';
import { ComparisonPanel } from './components/ComparisonPanel';
import { EducationalNotes } from './components/EducationalNotes';
import { toSI } from './utils/units';
import {
  calculatePulseEnergy,
  calculatePeakPower,
  calculateAveragePower,
  calculatePulseDuration,
  calculateRepetitionRate,
  calculateDutyCycle
} from './utils/calculations';
import { POWER_UNITS, ENERGY_UNITS, TIME_UNITS, FREQUENCY_UNITS, PEAK_POWER_UNITS } from './utils/units';

const INITIAL_STATE: CalculatorState = {
  mode: 'all',
  averagePower: { value: '30', unit: 'W' },
  repetitionRate: { value: '11', unit: 'MHz' },
  pulseEnergy: { value: '', unit: 'µJ' },
  pulseDuration: { value: '50', unit: 'fs' },
  peakPower: { value: '', unit: 'MW' },
  pulseShape: 'gaussian',
};

export default function App() {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculatedFields, setCalculatedFields] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('pulseCalcHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pulseCalcHistory', JSON.stringify(history));
  }, [history]);

  const handleCalculate = () => {
    setError('');
    
    try {
      const parse = (field: keyof CalculatorState, units: any[]) => {
        const data = state[field] as any;
        if (!data.value) return 0;
        const val = parseFloat(data.value);
        if (isNaN(val)) throw new Error(`Invalid number for ${field}`);
        if (val < 0) throw new Error(`${field} cannot be negative`);
        return toSI(val, data.unit, units);
      };

      const avgP = parse('averagePower', POWER_UNITS);
      const repR = parse('repetitionRate', FREQUENCY_UNITS);
      const pEnergy = parse('pulseEnergy', ENERGY_UNITS);
      const pDur = parse('pulseDuration', TIME_UNITS);
      const pkP = parse('peakPower', PEAK_POWER_UNITS);

      let finalAvgP = avgP;
      let finalRepR = repR;
      let finalPEnergy = pEnergy;
      let finalPDur = pDur;
      let finalPkP = pkP;
      
      const fieldsCalculated: string[] = [];

      switch (state.mode) {
        case 'all':
          if (!avgP || !repR || !pDur) throw new Error("Average power, repetition rate, and pulse duration are required.");
          finalPEnergy = calculatePulseEnergy(avgP, repR);
          finalPkP = calculatePeakPower(finalPEnergy, pDur, state.pulseShape);
          fieldsCalculated.push('pulseenergy', 'peakpower');
          break;
          
        case 'pulse-energy':
          if (!avgP || !repR) throw new Error("Average power and repetition rate are required.");
          finalPEnergy = calculatePulseEnergy(avgP, repR);
          fieldsCalculated.push('pulseenergy');
          break;
          
        case 'peak-power':
          if (pEnergy && pDur) {
             finalPkP = calculatePeakPower(pEnergy, pDur, state.pulseShape);
             finalPEnergy = pEnergy;
          } else if (avgP && repR && pDur) {
             finalPEnergy = calculatePulseEnergy(avgP, repR);
             finalPkP = calculatePeakPower(finalPEnergy, pDur, state.pulseShape);
          } else {
             throw new Error("Provide (Energy and Duration) OR (Avg Power, Rep Rate, and Duration).");
          }
          fieldsCalculated.push('peakpower');
          break;

        case 'average-power':
          if (!pEnergy || !repR) throw new Error("Pulse energy and repetition rate are required.");
          finalAvgP = calculateAveragePower(pEnergy, repR);
          fieldsCalculated.push('averagepower');
          break;

        case 'pulse-duration':
          if (!pEnergy || !pkP) throw new Error("Pulse energy and peak power are required.");
          finalPDur = calculatePulseDuration(pEnergy, pkP, state.pulseShape);
          fieldsCalculated.push('pulseduration');
          break;

        case 'repetition-rate':
          if (!avgP || !pEnergy) throw new Error("Average power and pulse energy are required.");
          finalRepR = calculateRepetitionRate(avgP, pEnergy);
          fieldsCalculated.push('repetitionrate');
          break;
      }

      if (finalPDur && finalPDur < 1e-18) console.warn("Pulse duration below 1 as");
      if (finalRepR && finalRepR > 1e12) console.warn("Repetition rate above 1 THz");

      const dutyCycle = calculateDutyCycle(finalRepR, finalPDur);
      const repetitionPeriod = finalRepR > 0 ? 1 / finalRepR : 0;

      const getUncertainty = (field: keyof CalculatorState) => {
        const data = state[field];
        if (typeof data === 'object' && data !== null && 'uncertainty' in data) {
          const valStr = (data as BaseInput).uncertainty;
          if (!valStr) return 0;
          const val = parseFloat(valStr);
          return isNaN(val) ? 0 : val;
        }
        return 0;
      };

      const uAvgP = getUncertainty('averagePower');
      const uRepR = getUncertainty('repetitionRate');
      const uPDur = getUncertainty('pulseDuration');

      let uEnergy = 0;
      let uPeak = 0;

      if (fieldsCalculated.includes('pulseenergy') || state.mode === 'all') {
         uEnergy = Math.sqrt(uAvgP * uAvgP + uRepR * uRepR);
      }
      if (fieldsCalculated.includes('peakpower') || state.mode === 'all') {
         if (fieldsCalculated.includes('pulseenergy') || state.mode === 'all') {
             uPeak = Math.sqrt(uAvgP * uAvgP + uRepR * uRepR + uPDur * uPDur);
         } else {
             const uEnergyIn = getUncertainty('pulseEnergy');
             uPeak = Math.sqrt(uEnergyIn * uEnergyIn + uPDur * uPDur);
         }
      }

      const finalResult: CalculationResult = {
        averagePower: finalAvgP,
        repetitionRate: finalRepR,
        pulseEnergy: finalPEnergy,
        pulseDuration: finalPDur,
        peakPower: finalPkP,
        dutyCycle,
        pulseShape: state.pulseShape,
        repetitionPeriod,
        uncertainties: {
          pulseEnergy: uEnergy,
          peakPower: uPeak
        }
      };

      setResult(finalResult);
      setCalculatedFields(fieldsCalculated);

      const newHistoryEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        inputs: { ...state },
        result: finalResult
      };
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 50)); // Keep last 50

    } catch (e: any) {
      setError(e.message || "An error occurred during calculation.");
    }
  };

  const loadPreset = (presetName: string) => {
    switch (presetName) {
      case 'yb-fiber':
        setState({ ...INITIAL_STATE, mode: 'all', averagePower: { value: '30', unit: 'W' }, repetitionRate: { value: '11', unit: 'MHz' }, pulseDuration: { value: '50', unit: 'fs' }, pulseShape: 'gaussian' });
        break;
      case 'seed':
        setState({ ...INITIAL_STATE, mode: 'all', averagePower: { value: '50', unit: 'mW' }, repetitionRate: { value: '11', unit: 'MHz' }, pulseDuration: { value: '10', unit: 'ps' }, pulseShape: 'gaussian' });
        break;
      case 'ti-sapphire':
        setState({ ...INITIAL_STATE, mode: 'all', averagePower: { value: '500', unit: 'mW' }, repetitionRate: { value: '80', unit: 'MHz' }, pulseDuration: { value: '30', unit: 'fs' }, pulseShape: 'sech2' });
        break;
      case 'cpa':
        setState({ ...INITIAL_STATE, mode: 'all', averagePower: { value: '10', unit: 'W' }, repetitionRate: { value: '1', unit: 'kHz' }, pulseDuration: { value: '30', unit: 'fs' }, pulseShape: 'gaussian' });
        break;
    }
    setResult(null);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setState(entry.inputs);
    setResult(entry.result);
  };

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden selection:bg-cyan-500/30">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Ultrafast Pulse <span className="text-cyan-400">Calculator</span></h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 uppercase tracking-widest mr-2 hidden sm:inline-block">Presets:</span>
          {[
            { id: 'yb-fiber', label: 'Yb:Fiber' },
            { id: 'ti-sapphire', label: 'Ti:Sapphire' },
            { id: 'cpa', label: 'CPA System' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors text-slate-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Inputs */}
        <aside className="w-80 border-r border-slate-800 p-6 space-y-6 flex-shrink-0 bg-slate-950 overflow-y-auto">
          <CalculatorForm 
            state={state} 
            setState={setState} 
            onCalculate={handleCalculate} 
            error={error} 
          />
          
          <CalculationHistory 
            history={history}
            onLoadHistory={loadHistoryEntry}
            onClearHistory={() => setHistory([])}
            onDeleteEntry={(id) => setHistory(prev => prev.filter(h => h.id !== id))}
          />
          
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed mt-6">
            <span className="font-bold block mb-1 text-amber-400">Important Disclaimer</span>
            This calculator provides theoretical estimates based on the entered values and selected pulse shape. Actual laser performance may differ because of pulse pedestals, imperfect compression, measurement uncertainty, spatial beam shape, optical losses, nonlinear effects, and temporal contrast.
          </div>
        </aside>

        {/* Center Panel: Results & Diagram */}
        <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto bg-slate-900/20">
          <ResultCard result={result} calculatedFields={calculatedFields} />
          <PulseTrainDiagram result={result} />
          <IntensityCalculator result={result} />
          <ComparisonPanel currentResult={result} currentState={state} />
          <EducationalNotes />
        </div>

        {/* Right Sidebar: Chatbot Assistant */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/30 flex flex-col flex-shrink-0 hidden lg:flex">
          <ChatbotPanel context={{ inputs: state, result }} />
        </aside>
      </main>

      {/* Global Footer */}
      <footer className="h-10 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-500 flex-shrink-0 hidden sm:flex">
        <div className="flex space-x-4 uppercase tracking-widest">
          <span className="hover:text-slate-300 cursor-pointer">History</span>
          <span className="hover:text-slate-300 cursor-pointer">Formulas</span>
          <span className="hover:text-slate-300 cursor-pointer text-amber-500">Safety Disclaimer</span>
        </div>
        <div>© {new Date().getFullYear()} OptiPulse Scientific • V2.4.1</div>
      </footer>
    </div>
  );
}
