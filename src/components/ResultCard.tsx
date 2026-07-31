import React from 'react';
import { CalculationResult } from '../types';
import { formatEngineering, formatScientific, POWER_UNITS, ENERGY_UNITS, TIME_UNITS, FREQUENCY_UNITS, PEAK_POWER_UNITS } from '../utils/units';
import { SHAPE_FACTORS } from '../utils/calculations';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ResultCardProps {
  result: CalculationResult | null;
  calculatedFields: string[];
}

export function ResultCard({ result, calculatedFields }: ResultCardProps) {
  if (!result) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center shadow-sm">
        <div className="text-slate-300 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-700 tracking-tight">Ready to calculate</h3>
        <p className="text-sm text-slate-500 mt-2">
          Enter parameters on the left to see results.
        </p>
      </div>
    );
  }

  const { averagePower, repetitionRate, pulseEnergy, pulseDuration, peakPower, dutyCycle, pulseShape } = result;

  const renderMath = (math: string) => {
    return (
      <div className="my-4 overflow-x-auto text-slate-800 bg-slate-50 p-4 rounded-lg shadow-inner border border-slate-100">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {math}
        </ReactMarkdown>
      </div>
    );
  };

    const getExplanation = (field: string) => {
    switch (field) {
      case 'pulseEnergy': {
        const engEnergy = formatEngineering(pulseEnergy, ENERGY_UNITS);
        const mathStr = `
$$E_{\\text{pulse}} = \\frac{P_{\\text{avg}}}{f_{\\text{rep}}}$$

$$E_{\\text{pulse}} = \\frac{${averagePower}}{${repetitionRate}}$$

$$E_{\\text{pulse}} = ${pulseEnergy.toExponential(3)}\\text{ J}$$

$$E_{\\text{pulse}} = ${engEnergy.value.toPrecision(3)}\\text{ }${engEnergy.unit}$$
        `;
        return (
          <div key="energy" className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pulse Energy Calculation</h3>
            {renderMath(mathStr)}
            <p className="text-sm text-slate-600">
              The laser continuously emits {formatEngineering(averagePower, POWER_UNITS).value.toPrecision(3)} {formatEngineering(averagePower, POWER_UNITS).unit} of average power. 
              This energy is divided equally among {formatEngineering(repetitionRate, FREQUENCY_UNITS).value.toPrecision(3)} {formatEngineering(repetitionRate, FREQUENCY_UNITS).unit} pulses every second.
            </p>
          </div>
        );
      }
      case 'peakPower': {
        const engPeak = formatEngineering(peakPower, PEAK_POWER_UNITS);
        const engDuration = formatEngineering(pulseDuration, TIME_UNITS);
        const engEnergy = formatEngineering(pulseEnergy, ENERGY_UNITS);
        const shapeFactor = SHAPE_FACTORS[pulseShape];
        const shapeStr = pulseShape === 'rectangular' ? '' : `${shapeFactor} \\times`;
        
        const mathStr = `
$$P_{\\text{peak}} \\approx ${pulseShape === 'rectangular' ? '' : shapeFactor} \\frac{E_{\\text{pulse}}}{\\tau_{\\text{FWHM}}}$$

$$P_{\\text{peak}} \\approx ${shapeStr} \\frac{${pulseEnergy.toExponential(3)}}{${pulseDuration.toExponential(3)}}$$

$$P_{\\text{peak}} \\approx ${peakPower.toExponential(3)}\\text{ W}$$

$$P_{\\text{peak}} \\approx ${engPeak.value.toPrecision(3)}\\text{ }${engPeak.unit}$$
        `;
        return (
          <div key="peak" className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Peak Power Calculation</h3>
            {renderMath(mathStr)}
            <p className="text-sm text-slate-600 mb-2">
              Although the average power is only {formatEngineering(averagePower, POWER_UNITS).value.toPrecision(3)} {formatEngineering(averagePower, POWER_UNITS).unit}, 
              the energy is concentrated into extremely short {engDuration.value.toPrecision(3)} {engDuration.unit} pulses. 
              This produces a massive peak power of {engPeak.value.toPrecision(3)} {engPeak.unit} during the pulse itself.
            </p>
            {pulseShape !== 'rectangular' && (
              <p className="text-[11px] text-orange-800 bg-orange-50 p-3 rounded-lg border border-orange-200 mt-4 leading-relaxed">
                <span className="font-bold">Assumption:</span> A {pulseShape} temporal pulse shape was assumed, introducing a correction factor of {shapeFactor} because energy is distributed in the tails of the pulse.
              </p>
            )}
          </div>
        );
      }
      case 'averagePower': {
        const engPower = formatEngineering(averagePower, POWER_UNITS);
        const mathStr = `
$$P_{\\text{avg}} = E_{\\text{pulse}} \\times f_{\\text{rep}}$$

$$P_{\\text{avg}} = ${pulseEnergy.toExponential(3)} \\times ${repetitionRate.toExponential(3)}$$

$$P_{\\text{avg}} = ${averagePower.toExponential(3)}\\text{ W}$$

$$P_{\\text{avg}} = ${engPower.value.toPrecision(3)}\\text{ }${engPower.unit}$$
        `;
        return (
          <div key="avg" className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Average Power Calculation</h3>
            {renderMath(mathStr)}
            <p className="text-sm text-slate-600">
              By summing up the energy of all pulses emitted in one second, we find the average power delivered by the laser system.
            </p>
          </div>
        );
      }
      // Can add more cases if needed, but these are the main ones requested
      default: return null;
    }
  };

  const engDutyCycle = (dutyCycle * 100).toExponential(3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Avg Power', val: averagePower, units: POWER_UNITS, formula: 'P_avg = E_pulse × f_rep' },
          { label: 'Rep Rate', val: repetitionRate, units: FREQUENCY_UNITS, formula: 'f_rep = P_avg / E_pulse' },
          { label: 'Pulse Energy', val: pulseEnergy, units: ENERGY_UNITS, formula: 'E_pulse = P_avg / f_rep' },
          { label: 'Peak Power', val: peakPower, units: PEAK_POWER_UNITS, formula: 'P_peak ≈ 0.94 × (E_pulse / τ_FWHM)' },
        ].map(item => {
          const eng = formatEngineering(item.val, item.units);
          const isCalculated = calculatedFields.includes(item.label.toLowerCase().replace(' ', ''));
          // Only show calculated fields or default if none in this grid
          if (!isCalculated && calculatedFields.length > 0) return null;
          if (calculatedFields.length === 0 && item.label !== 'Pulse Energy' && item.label !== 'Peak Power') return null;

          return (
            <div key={item.label} className={`bg-white border ${isCalculated ? 'border-blue-300' : 'border-slate-200'} rounded-xl p-6 shadow-md flex flex-col justify-between`}>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold flex justify-between">
                  {isCalculated ? 'Calculated ' : ''}{item.label}
                </span>
                <div className="text-5xl font-light text-slate-900 mt-2">
                  {eng.value.toPrecision(3)} <span className="text-2xl text-blue-500">{eng.unit}</span>
                </div>
                <div className="text-sm text-slate-500 mt-2 font-mono flex flex-col space-y-1">
                  <span>SI: {formatScientific(item.val)} {item.units.find(u => u.factor === 1)?.label}</span>
                  {result.uncertainties && result.uncertainties[item.label.replace(' ', '').charAt(0).toLowerCase() + item.label.replace(' ', '').slice(1) as 'pulseEnergy'|'peakPower'] > 0 && isCalculated && (
                    <span className="text-orange-600">± {result.uncertainties[item.label.replace(' ', '').charAt(0).toLowerCase() + item.label.replace(' ', '').slice(1) as 'pulseEnergy'|'peakPower'].toPrecision(3)}%</span>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-600">
                {item.formula}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {calculatedFields.map(field => getExplanation(field))}
        {calculatedFields.length === 0 && (
          <>
            {getExplanation('pulseEnergy')}
            {getExplanation('peakPower')}
          </>
        )}
      </div>

      {/* Duty Cycle Info */}
      <div className="flex flex-col sm:flex-row bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-6">
        <div className="sm:w-1/4 p-4 border-b sm:border-b-0 sm:border-r border-slate-200">
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Duty Cycle %</span>
          <span className="text-xl font-bold text-slate-900">{engDutyCycle} %</span>
        </div>
        <div className="sm:w-1/4 p-4 border-b sm:border-b-0 sm:border-r border-slate-200">
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Repetition Period</span>
          <span className="text-xl font-bold text-slate-900">{formatEngineering(result.repetitionPeriod, TIME_UNITS).value.toPrecision(3)} {formatEngineering(result.repetitionPeriod, TIME_UNITS).unit}</span>
        </div>
        <div className="sm:w-2/4 p-4 flex items-center bg-slate-50">
          <p className="text-xs text-slate-600 leading-snug">
            The duty cycle of {dutyCycle.toExponential(3)} means the laser is actively emitting light for {engDutyCycle}% of the time. 
            Each pulse contains approximately {formatEngineering(pulseEnergy, ENERGY_UNITS).value.toPrecision(3)} {formatEngineering(pulseEnergy, ENERGY_UNITS).unit}. Concentrating this energy into a {formatEngineering(pulseDuration, TIME_UNITS).value.toPrecision(3)} {formatEngineering(pulseDuration, TIME_UNITS).unit} {pulseShape} pulse produces approximately {formatEngineering(peakPower, PEAK_POWER_UNITS).value.toPrecision(3)} {formatEngineering(peakPower, PEAK_POWER_UNITS).unit} of peak power.
            <br/><br/>
            A {formatEngineering(pulseDuration, TIME_UNITS).value.toPrecision(3)} {formatEngineering(pulseDuration, TIME_UNITS).unit} pulse is approximately {formatScientific(result.repetitionPeriod / pulseDuration, 3)} times shorter than the {formatEngineering(result.repetitionPeriod, TIME_UNITS).value.toPrecision(3)} {formatEngineering(result.repetitionPeriod, TIME_UNITS).unit} interval between pulses.
          </p>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200 shadow-sm text-[11px] text-orange-800 leading-relaxed">
        The calculated peak power assumes that the entered average power corresponds to the pulse train, that pulse energy is evenly distributed between pulses, and that the entered pulse duration is the intensity FWHM.
      </div>
      
      <details className="mt-6 group bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors text-slate-700 select-none">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Detailed Calculations</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4 text-xs text-slate-600">
          <div className="space-y-2">
            <h4 className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Variables</h4>
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-math:text-blue-600">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`* $P_{avg}$ = Average Power = ${formatScientific(averagePower)} W
* $f_{rep}$ = Repetition Rate = ${formatScientific(repetitionRate)} Hz
* $E_{pulse}$ = Pulse Energy = ${formatScientific(pulseEnergy)} J
* $\\tau_{FWHM}$ = Pulse Duration = ${formatScientific(pulseDuration)} s
* $P_{peak}$ = Peak Power = ${formatScientific(peakPower)} W
* $K_{shape}$ = Shape Factor = ${pulseShape === 'rectangular' ? '1' : pulseShape === 'gaussian' ? '~0.94' : '~0.88'}`}
              </ReactMarkdown>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Formulas & Substitution</h4>
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-math:text-blue-600">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`**Pulse Energy:** $E_{pulse} = P_{avg} / f_{rep}$

\`\`\`
E_pulse = ${formatScientific(averagePower)} / ${formatScientific(repetitionRate)} = ${formatScientific(pulseEnergy)} J
\`\`\`

**Peak Power:** $P_{peak} = K_{shape} \\times (E_{pulse} / \\tau_{FWHM})$

\`\`\`
P_peak = ${pulseShape === 'rectangular' ? '1' : pulseShape === 'gaussian' ? '0.94' : '0.88'} * (${formatScientific(pulseEnergy)} / ${formatScientific(pulseDuration)}) = ${formatScientific(peakPower)} W
\`\`\``}
              </ReactMarkdown>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Physical Interpretation</h4>
            <p>The laser emits {formatEngineering(averagePower, POWER_UNITS).value.toPrecision(3)} {formatEngineering(averagePower, POWER_UNITS).unit} of power on average. However, because it emits this energy in extremely short {formatEngineering(pulseDuration, TIME_UNITS).value.toPrecision(3)} {formatEngineering(pulseDuration, TIME_UNITS).unit} bursts rather than continuously, the instantaneous power during a pulse reaches a massive {formatEngineering(peakPower, PEAK_POWER_UNITS).value.toPrecision(3)} {formatEngineering(peakPower, PEAK_POWER_UNITS).unit}.</p>
          </div>
        </div>
      </details>
    </div>
  );
}
