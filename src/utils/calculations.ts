import { PulseShape, CalculationResult } from '../types';

export const SHAPE_FACTORS = {
  rectangular: 1,
  gaussian: 0.94,
  sech2: 0.88,
};

export function calculatePulseEnergy(averagePower: number, repetitionRate: number): number {
  if (repetitionRate === 0) throw new Error('Repetition rate cannot be zero.');
  return averagePower / repetitionRate;
}

export function calculatePeakPower(pulseEnergy: number, pulseDuration: number, shape: PulseShape): number {
  if (pulseDuration === 0) throw new Error('Pulse duration cannot be zero.');
  const factor = SHAPE_FACTORS[shape];
  return factor * (pulseEnergy / pulseDuration);
}

export function calculateAveragePower(pulseEnergy: number, repetitionRate: number): number {
  return pulseEnergy * repetitionRate;
}

export function calculatePulseDuration(pulseEnergy: number, peakPower: number, shape: PulseShape): number {
  if (peakPower === 0) throw new Error('Peak power cannot be zero.');
  const factor = SHAPE_FACTORS[shape];
  return factor * (pulseEnergy / peakPower);
}

export function calculateRepetitionRate(averagePower: number, pulseEnergy: number): number {
  if (pulseEnergy === 0) throw new Error('Pulse energy cannot be zero.');
  return averagePower / pulseEnergy;
}

export function calculateDutyCycle(repetitionRate: number, pulseDuration: number): number {
  return repetitionRate * pulseDuration;
}
