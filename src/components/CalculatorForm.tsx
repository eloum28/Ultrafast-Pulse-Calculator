import React from 'react';
import { CalculatorState, CalculationMode, PulseShape, BaseInput } from '../types';
import { POWER_UNITS, ENERGY_UNITS, TIME_UNITS, FREQUENCY_UNITS, PEAK_POWER_UNITS } from '../utils/units';

interface CalculatorFormProps {
  state: CalculatorState;
  setState: React.Dispatch<React.SetStateAction<CalculatorState>>;
  onCalculate: () => void;
  error?: string;
}

export function CalculatorForm({ state, setState, onCalculate, error }: CalculatorFormProps) {
  const updateInput = (field: keyof CalculatorState, key: keyof BaseInput, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: { ...(prev[field] as BaseInput), [key]: value },
    }));
  };

  const renderInput = (
    label: string,
    field: keyof CalculatorState,
    units: { label: string }[],
    tooltip?: string,
    isCalculatedOutput?: boolean,
    showUncertainty?: boolean
  ) => {
    const data = state[field] as BaseInput;
    const isDisabled = isCalculatedOutput;
    
    return (
      <div className={`space-y-1 ${isDisabled ? 'opacity-70' : ''}`} title={tooltip}>
        <div className="flex justify-between items-center">
          <label className={`block text-xs ${isDisabled ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
            {isDisabled ? 'Calculated ' : ''}{label}
          </label>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex shadow-sm rounded-lg">
            <input
              type="number"
              className={`w-full ${isDisabled ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-900'} border border-r-0 rounded-l-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
              value={isDisabled && (!data.value || parseFloat(data.value) === 0) ? '' : data.value}
              onChange={(e) => updateInput(field, 'value', e.target.value)}
              placeholder={isDisabled ? "Auto-calculated" : "0.0"}
              step="any"
              disabled={isDisabled}
            />
            <select
              className={`${isDisabled ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-300'} border rounded-r-lg px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none`}
              value={data.unit}
              onChange={(e) => updateInput(field, 'unit', e.target.value)}
              disabled={isDisabled}
            >
              {units.map((u) => (
                <option key={u.label} value={u.label}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          {showUncertainty && !isDisabled && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500">Uncertainty (±%)</span>
              <input 
                type="number"
                className="w-16 bg-white border border-slate-300 shadow-sm rounded px-2 py-1 text-[10px] text-orange-600 outline-none focus:border-orange-500"
                placeholder="0"
                step="any"
                min="0"
                value={data.uncertainty || ''}
                onChange={(e) => updateInput(field, 'uncertainty', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const isFieldRequired = (field: keyof CalculatorState) => {
    if (state.mode === 'all') return true;
    switch (state.mode) {
      case 'pulse-energy': return field === 'averagePower' || field === 'repetitionRate';
      case 'peak-power': return field === 'averagePower' || field === 'repetitionRate' || field === 'pulseDuration' || field === 'pulseEnergy'; // User can enter energy directly or avg power + rep rate
      case 'average-power': return field === 'pulseEnergy' || field === 'repetitionRate';
      case 'pulse-duration': return field === 'pulseEnergy' || field === 'peakPower';
      case 'repetition-rate': return field === 'averagePower' || field === 'pulseEnergy';
      default: return false;
    }
  };

  const showEnergy = isFieldRequired('pulseEnergy') || state.mode === 'peak-power'; // Special case for peak power
  const showAvgPower = isFieldRequired('averagePower') || state.mode === 'peak-power';
  const showRepRate = isFieldRequired('repetitionRate') || state.mode === 'peak-power';
  const showDuration = isFieldRequired('pulseDuration');
  const showPeak = isFieldRequired('peakPower');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
          Calculation Mode
        </label>
        <select
          className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-900"
          value={state.mode}
          onChange={(e) => setState({ ...state, mode: e.target.value as CalculationMode })}
        >
          <option value="all">Calculate all possible values</option>
          <option value="pulse-energy">Pulse energy</option>
          <option value="peak-power">Peak power</option>
          <option value="average-power">Average power</option>
          <option value="pulse-duration">Pulse duration</option>
          <option value="repetition-rate">Repetition rate</option>
        </select>
      </div>

      <div className="space-y-4">
        {state.mode === 'all' ? (
          <>
            {renderInput('Average Power', 'averagePower', POWER_UNITS, undefined, false, true)}
            {renderInput('Repetition Rate', 'repetitionRate', FREQUENCY_UNITS, undefined, false, true)}
            {renderInput('Pulse Duration (FWHM)', 'pulseDuration', TIME_UNITS, undefined, false, true)}
            
            <div className="space-y-1">
              <label className="block text-xs text-slate-500">Pulse Shape</label>
              <select
                className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                value={state.pulseShape}
                onChange={(e) => setState({ ...state, pulseShape: e.target.value as PulseShape })}
              >
                <option value="rectangular">Rectangular (Engineering Estimate)</option>
                <option value="gaussian">Gaussian (0.94 factor)</option>
                <option value="sech2">Sech² (0.88 factor)</option>
              </select>
            </div>

            {renderInput('Pulse Energy', 'pulseEnergy', ENERGY_UNITS, undefined, true)}
            {renderInput('Peak Power', 'peakPower', PEAK_POWER_UNITS, undefined, true)}
          </>
        ) : (
          <>
            {(state.mode !== 'average-power' && state.mode !== 'repetition-rate' && state.mode !== 'pulse-duration') && 
              renderInput('Average Power', 'averagePower', POWER_UNITS, undefined, false, true)}
            
            {(state.mode !== 'pulse-energy' && state.mode !== 'repetition-rate' && state.mode !== 'average-power') && 
              renderInput('Repetition Rate', 'repetitionRate', FREQUENCY_UNITS, undefined, false, true)}
            
            {(state.mode !== 'pulse-energy') && 
              renderInput('Pulse Energy', 'pulseEnergy', ENERGY_UNITS)}
              
            {(state.mode !== 'pulse-duration' && state.mode !== 'repetition-rate' && state.mode !== 'average-power' && state.mode !== 'pulse-energy') && 
              renderInput('Pulse Duration (FWHM)', 'pulseDuration', TIME_UNITS, undefined, false, true)}
              
            {(state.mode === 'pulse-duration') && 
              renderInput('Peak Power', 'peakPower', PEAK_POWER_UNITS)}
              
            {(state.mode === 'peak-power' || state.mode === 'pulse-duration') && (
              <div className="space-y-1">
                <label className="block text-xs text-slate-500">
                  Pulse Shape
                </label>
                <select
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={state.pulseShape}
                  onChange={(e) => setState({ ...state, pulseShape: e.target.value as PulseShape })}
                >
                  <option value="rectangular">Rectangular (Engineering Estimate)</option>
                  <option value="gaussian">Gaussian (0.94 factor)</option>
                  <option value="sech2">Sech² (0.88 factor)</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 shadow-sm text-[11px] text-red-800 leading-relaxed">
          {error}
        </div>
      )}

      <button
        onClick={onCalculate}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all uppercase tracking-widest"
      >
        Calculate
      </button>
    </div>
  );
}
