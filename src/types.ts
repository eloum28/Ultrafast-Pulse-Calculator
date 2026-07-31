export type PulseShape = 'rectangular' | 'gaussian' | 'sech2';

export type CalculationMode = 
  | 'pulse-energy'
  | 'peak-power'
  | 'average-power'
  | 'pulse-duration'
  | 'repetition-rate'
  | 'all';

export interface BaseInput {
  value: string;
  unit: string;
  uncertainty?: string; // in percent
}

export interface CalculatorState {
  mode: CalculationMode;
  averagePower: BaseInput;
  repetitionRate: BaseInput;
  pulseEnergy: BaseInput;
  pulseDuration: BaseInput;
  peakPower: BaseInput;
  pulseShape: PulseShape;
}

export interface CalculationResult {
  averagePower: number; // in W
  repetitionRate: number; // in Hz
  pulseEnergy: number; // in J
  pulseDuration: number; // in s
  peakPower: number; // in W
  dutyCycle: number; // decimal
  pulseShape: PulseShape;
  repetitionPeriod: number; // in s
  uncertainties?: {
    pulseEnergy: number; // in percent
    peakPower: number; // in percent
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputs: CalculatorState;
  result: CalculationResult | null;
}
