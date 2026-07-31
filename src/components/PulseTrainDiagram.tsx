import React from 'react';
import { CalculationResult } from '../types';
import { formatEngineering, TIME_UNITS } from '../utils/units';

interface PulseTrainDiagramProps {
  result: CalculationResult | null;
}

export function PulseTrainDiagram({ result }: PulseTrainDiagramProps) {
  if (!result) return null;

  const { repetitionRate, pulseDuration, averagePower, peakPower, repetitionPeriod, pulseShape } = result;
  
  // For visual purposes, we can't draw the real scale
  const pulseWidthPx = Math.max(10, Math.min(40, Math.log10(pulseDuration * 1e15) * 10)); 
  const gapWidthPx = 150;
  const viewBoxWidth = 800;
  const viewBoxHeight = 350; // Increased height for two plots
  
  const numPulses = 5;
  const trainYBase = 150;
  const trainYPeak = 40;
  const trainAvgY = trainYBase - (trainYBase - trainYPeak) * 0.15;
  
  const singleYBase = 320;
  const singleYPeak = 210;
  const singleCenterX = 400;
  const singlePulseWidthPx = 120; // Much wider for zoomed view
  const singleFwhmWidthPx = pulseShape === 'rectangular' ? singlePulseWidthPx : singlePulseWidthPx * 0.8;
  const singleHalfY = singleYPeak + (singleYBase - singleYPeak) / 2;

  return (
    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 relative min-h-[400px]">
      <div className="flex justify-between items-start absolute top-6 left-6 right-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pulse Train & Profile</h3>
        <span className="text-[9px] text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
          Conceptual diagram — not drawn to temporal scale
        </span>
      </div>
      
      <div className="w-full h-full flex items-center justify-center pt-8">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto font-sans mt-4">
          
          {/* --- TOP PLOT: PULSE TRAIN --- */}
          {/* Grid lines */}
          <line x1="0" y1={trainYPeak} x2={viewBoxWidth} y2={trainYPeak} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-slate-800" />
          <line x1="0" y1={trainAvgY} x2={viewBoxWidth} y2={trainAvgY} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-amber-500/40" />
          <line x1="0" y1={trainYBase} x2={viewBoxWidth} y2={trainYBase} stroke="currentColor" strokeWidth="1" className="text-slate-800" />
          
          {/* Vertical Axis */}
          <line x1="0" y1="20" x2="0" y2={trainYBase} stroke="currentColor" strokeWidth="1" className="text-slate-800" />
          
          {/* Average Power Label */}
          <text x={viewBoxWidth - 10} y={trainAvgY - 10} textAnchor="end" className="fill-amber-500 text-[10px] uppercase tracking-widest">
            Avg: {averagePower.toExponential(2)} W
          </text>
          
          {/* Peak Power Label */}
          <text x={viewBoxWidth - 10} y={trainYPeak - 10} textAnchor="end" className="fill-cyan-500 text-[10px] uppercase tracking-widest">
            Peak: {peakPower.toExponential(2)} W
          </text>
          
          {/* Pulses */}
          {Array.from({ length: numPulses }).map((_, i) => {
            const x = gapWidthPx / 2 + i * gapWidthPx;
            return (
              <g key={i} className="group">
                <path 
                  d={pulseShape === 'rectangular' 
                    ? `M ${x - pulseWidthPx/2} ${trainYBase} L ${x - pulseWidthPx/2} ${trainYPeak} L ${x + pulseWidthPx/2} ${trainYPeak} L ${x + pulseWidthPx/2} ${trainYBase}`
                    : `M ${x - pulseWidthPx * 1.5} ${trainYBase} C ${x - pulseWidthPx * 0.5} ${trainYBase}, ${x - pulseWidthPx * 0.5} ${trainYPeak}, ${x} ${trainYPeak} C ${x + pulseWidthPx * 0.5} ${trainYPeak}, ${x + pulseWidthPx * 0.5} ${trainYBase}, ${x + pulseWidthPx * 1.5} ${trainYBase}`} 
                  fill="url(#pulseGrad)" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-cyan-500"
                />
              </g>
            );
          })}
          
          {/* Repetition period annotation */}
          <g className="text-cyan-400 text-[10px]">
            <line x1={gapWidthPx / 2} y1={trainYPeak - 20} x2={gapWidthPx / 2} y2={trainYPeak - 10} stroke="currentColor" strokeWidth="1" className="text-slate-600" />
            <line x1={gapWidthPx / 2 + gapWidthPx} y1={trainYPeak - 20} x2={gapWidthPx / 2 + gapWidthPx} y2={trainYPeak - 10} stroke="currentColor" strokeWidth="1" className="text-slate-600" />
            <line x1={gapWidthPx / 2} y1={trainYPeak - 15} x2={gapWidthPx / 2 + gapWidthPx} y2={trainYPeak - 15} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-cyan-500/50" />
            <rect x={gapWidthPx} y={trainYPeak - 23} width="120" height="16" fill="#020617" rx="2" />
            <text x={gapWidthPx + 60} y={trainYPeak - 11} textAnchor="middle">
              T = {formatEngineering(repetitionPeriod, TIME_UNITS).value.toPrecision(3)} {formatEngineering(repetitionPeriod, TIME_UNITS).unit}
            </text>
          </g>

          {/* --- BOTTOM PLOT: SINGLE PULSE ZOOMED --- */}
          <text x="0" y={singleYPeak - 15} className="fill-slate-500 text-[10px] uppercase font-bold tracking-widest">Zoomed Pulse Profile ({pulseShape})</text>
          
          <line x1="0" y1={singleYPeak} x2={viewBoxWidth} y2={singleYPeak} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-slate-800" />
          <line x1="0" y1={singleHalfY} x2={viewBoxWidth} y2={singleHalfY} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-800" />
          <line x1="0" y1={singleYBase} x2={viewBoxWidth} y2={singleYBase} stroke="currentColor" strokeWidth="1" className="text-slate-800" />
          
          <path 
            d={pulseShape === 'rectangular' 
              ? `M ${singleCenterX - singlePulseWidthPx/2} ${singleYBase} L ${singleCenterX - singlePulseWidthPx/2} ${singleYPeak} L ${singleCenterX + singlePulseWidthPx/2} ${singleYPeak} L ${singleCenterX + singlePulseWidthPx/2} ${singleYBase}`
              : `M ${singleCenterX - singlePulseWidthPx * 1.5} ${singleYBase} C ${singleCenterX - singlePulseWidthPx * 0.5} ${singleYBase}, ${singleCenterX - singlePulseWidthPx * 0.5} ${singleYPeak}, ${singleCenterX} ${singleYPeak} C ${singleCenterX + singlePulseWidthPx * 0.5} ${singleYPeak}, ${singleCenterX + singlePulseWidthPx * 0.5} ${singleYBase}, ${singleCenterX + singlePulseWidthPx * 1.5} ${singleYBase}`} 
            fill="url(#pulseGrad)" 
            stroke="currentColor" 
            strokeWidth="3" 
            className="text-cyan-500"
          />

          {/* FWHM annotation */}
          <g className="text-slate-400 text-[10px]">
            <line x1={singleCenterX - singleFwhmWidthPx / 2} y1={singleHalfY - 5} x2={singleCenterX - singleFwhmWidthPx / 2} y2={singleHalfY + 5} stroke="currentColor" strokeWidth="1" />
            <line x1={singleCenterX + singleFwhmWidthPx / 2} y1={singleHalfY - 5} x2={singleCenterX + singleFwhmWidthPx / 2} y2={singleHalfY + 5} stroke="currentColor" strokeWidth="1" />
            <line x1={singleCenterX - singleFwhmWidthPx / 2} y1={singleHalfY} x2={singleCenterX + singleFwhmWidthPx / 2} y2={singleHalfY} stroke="currentColor" strokeWidth="1" />
            <rect x={singleCenterX - 40} y={singleHalfY - 8} width="80" height="16" fill="#020617" rx="2" />
            <text x={singleCenterX} y={singleHalfY + 4} textAnchor="middle">
              FWHM = {formatEngineering(pulseDuration, TIME_UNITS).value.toPrecision(3)} {formatEngineering(pulseDuration, TIME_UNITS).unit}
            </text>
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(6 182 212)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(6 182 212)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
