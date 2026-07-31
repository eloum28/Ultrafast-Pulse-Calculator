import React, { useState } from 'react';
import { CalculationResult } from '../types';
import { LENGTH_UNITS, toSI } from '../utils/units';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IntensityCalculatorProps {
  result: CalculationResult | null;
}

export function IntensityCalculator({ result }: IntensityCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [beamSize, setBeamSize] = useState('10');
  const [beamUnit, setBeamUnit] = useState('µm');
  const [beamType, setBeamType] = useState<'radius' | 'diameter'>('diameter');
  const [beamProfile, setBeamProfile] = useState<'uniform' | 'gaussian'>('gaussian');

  if (!result) return null;

  let intensityWm2 = 0;
  let intensityWcm2 = 0;
  let error = '';

  try {
    const size = parseFloat(beamSize);
    if (!isNaN(size) && size > 0) {
      const sizeSI = toSI(size, beamUnit, LENGTH_UNITS);
      const radius = beamType === 'radius' ? sizeSI : sizeSI / 2;
      const area = Math.PI * radius * radius;
      
      // For Gaussian, using 1/e^2 radius definition means peak intensity is 2 * P / (pi * w^2)
      const factor = beamProfile === 'gaussian' ? 2 : 1;
      
      intensityWm2 = (result.peakPower * factor) / area;
      intensityWcm2 = intensityWm2 / 10000; // 1 m^2 = 10,000 cm^2
    }
  } catch (e) {
    error = 'Invalid beam size.';
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 focus:outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Peak Intensity Calculator</h3>
        {expanded ? <ChevronUp className="text-slate-500 w-4 h-4" /> : <ChevronDown className="text-slate-500 w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="p-6 border-t border-slate-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs text-slate-500">
                  Beam Definition
                </label>
                <div className="flex shadow-sm rounded-lg">
                  <select
                    className="w-1/2 bg-white border border-slate-300 border-r-0 rounded-l-lg px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={beamProfile}
                    onChange={(e) => setBeamProfile(e.target.value as any)}
                  >
                    <option value="gaussian">Gaussian (1/e²)</option>
                    <option value="uniform">Uniform (Top-hat)</option>
                  </select>
                  <select
                    className="w-1/2 bg-slate-100 border border-slate-300 rounded-r-lg px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={beamType}
                    onChange={(e) => setBeamType(e.target.value as any)}
                  >
                    <option value="diameter">Diameter</option>
                    <option value="radius">Radius</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-500">
                  Beam Size
                </label>
                <div className="flex shadow-sm rounded-lg">
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-300 border-r-0 rounded-l-lg px-3 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={beamSize}
                    onChange={(e) => setBeamSize(e.target.value)}
                    min="0"
                    step="any"
                  />
                  <select
                    className="bg-slate-100 border border-slate-300 rounded-r-lg px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={beamUnit}
                    onChange={(e) => setBeamUnit(e.target.value)}
                  >
                    {LENGTH_UNITS.map((u) => (
                      <option key={u.label} value={u.label}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Peak Intensity</span>
              {intensityWm2 > 0 ? (
                <div className="mt-2">
                  <div className="text-3xl font-light text-slate-900">
                    {intensityWcm2.toExponential(3)} <span className="text-lg text-blue-500">W/cm²</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    {intensityWm2.toExponential(3)} W/m²
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs mt-2">Enter a valid beam size to calculate intensity.</div>
              )}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 shadow-sm text-[11px] text-orange-800 leading-relaxed">
            <span className="font-bold block mb-1">Warning</span>
            Focused intensity depends strongly on beam profile (M² factor), aberrations, and the exact definition of spot size. 
            The values calculated here are theoretical ideals. Actual focal intensities may be significantly lower due to real-world optical imperfections.
          </div>
        </div>
      )}
    </div>
  );
}
