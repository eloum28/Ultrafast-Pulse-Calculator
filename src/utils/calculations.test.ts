import { describe, it, expect } from 'vitest';
import { calculatePulseEnergy, calculatePeakPower, calculateAveragePower, calculatePulseDuration, calculateRepetitionRate } from './calculations';

describe('Ultrafast Pulse Calculations', () => {
  it('Scenario 1: 30 W, 11 MHz, 50 fs, Gaussian', () => {
    const pAvg = 30;
    const fRep = 11e6;
    const pDur = 50e-15;
    const energy = calculatePulseEnergy(pAvg, fRep);
    const peakPower = calculatePeakPower(energy, pDur, 'gaussian');
    
    // Pulse energy should be approx 2.73 uJ
    expect(energy).toBeCloseTo(2.72727e-6, 11);
    // Peak power should be approx 51.3 MW
    expect(peakPower).toBeCloseTo(51272727, -2);
  });

  it('Scenario 2: Calculate Average Power', () => {
    const energy = 2.7272727e-6;
    const fRep = 11e6;
    const pAvg = calculateAveragePower(energy, fRep);
    expect(pAvg).toBeCloseTo(30, 0);
  });

  it('Scenario 3: Calculate Pulse Duration', () => {
    const energy = 2.7272727e-6;
    const peakPower = 51272727;
    const pDur = calculatePulseDuration(energy, peakPower, 'gaussian');
    expect(pDur).toBeCloseTo(50e-15, 16);
  });

  it('Scenario 4: Calculate Repetition Rate', () => {
    const pAvg = 30;
    const energy = 2.7272727e-6;
    const fRep = calculateRepetitionRate(pAvg, energy);
    expect(fRep).toBeCloseTo(11e6, -1);
  });
});
