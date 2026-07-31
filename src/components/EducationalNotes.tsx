import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function EducationalNotes() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 focus:outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Educational Notes
        </h3>
        {expanded ? <ChevronUp className="text-slate-500 w-4 h-4" /> : <ChevronDown className="text-slate-500 w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="p-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Average Power</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The continuous time-averaged power emitted by the laser. It determines heating effects and total energy delivered over time.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Pulse Energy</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The total amount of optical energy contained within a single laser pulse. Calculated by dividing average power by the repetition rate.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Peak Power</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The maximum optical power achieved during the pulse. Because the pulse duration is extremely short (e.g., femtoseconds), peak power can be gigawatts or terawatts even if average power is only a few watts.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Chirped Pulse Amplification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A technique to amplify ultrashort pulses without destroying the gain medium. The pulse is stretched in time (reducing peak power), amplified, and then re-compressed.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Pulse Shape</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A simple rectangular model assumes uniform power over the pulse duration. In reality, laser pulses typically have Gaussian or Sech² temporal profiles, meaning some energy is in the "tails", leading to lower peak powers than the rectangular estimate.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-100 pb-1">Missing Information</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You cannot calculate pulse energy from average power alone. The repetition rate dictates how that power is divided into pulses. A 10W laser could produce ten 1J pulses per second (10 Hz), or ten million 1µJ pulses per second (10 MHz).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
