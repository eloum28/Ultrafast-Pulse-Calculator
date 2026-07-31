import React from 'react';
// Unit definitions and conversions to base SI units

export const POWER_UNITS = [
  { label: 'pW', factor: 1e-12 },
  { label: 'nW', factor: 1e-9 },
  { label: 'µW', factor: 1e-6 },
  { label: 'mW', factor: 1e-3 },
  { label: 'W', factor: 1 },
  { label: 'kW', factor: 1e3 },
];

export const ENERGY_UNITS = [
  { label: 'fJ', factor: 1e-15 },
  { label: 'pJ', factor: 1e-12 },
  { label: 'nJ', factor: 1e-9 },
  { label: 'µJ', factor: 1e-6 },
  { label: 'mJ', factor: 1e-3 },
  { label: 'J', factor: 1 },
];

export const TIME_UNITS = [
  { label: 'as', factor: 1e-18 },
  { label: 'fs', factor: 1e-15 },
  { label: 'ps', factor: 1e-12 },
  { label: 'ns', factor: 1e-9 },
  { label: 'µs', factor: 1e-6 },
  { label: 'ms', factor: 1e-3 },
  { label: 's', factor: 1 },
];

export const FREQUENCY_UNITS = [
  { label: 'Hz', factor: 1 },
  { label: 'kHz', factor: 1e3 },
  { label: 'MHz', factor: 1e6 },
  { label: 'GHz', factor: 1e9 },
];

export const PEAK_POWER_UNITS = [
  { label: 'W', factor: 1 },
  { label: 'kW', factor: 1e3 },
  { label: 'MW', factor: 1e6 },
  { label: 'GW', factor: 1e9 },
  { label: 'TW', factor: 1e12 },
  { label: 'PW', factor: 1e15 },
];

export const LENGTH_UNITS = [
  { label: 'nm', factor: 1e-9 },
  { label: 'µm', factor: 1e-6 },
  { label: 'mm', factor: 1e-3 },
  { label: 'cm', factor: 1e-2 },
  { label: 'm', factor: 1 },
];

export function toSI(value: number, unitLabel: string, unitsArray: {label: string, factor: number}[]): number {
  const unit = unitsArray.find(u => u.label === unitLabel);
  if (!unit) throw new Error(`Unknown unit: ${unitLabel}`);
  return value * unit.factor;
}

export function fromSI(value: number, unitLabel: string, unitsArray: {label: string, factor: number}[]): number {
  const unit = unitsArray.find(u => u.label === unitLabel);
  if (!unit) throw new Error(`Unknown unit: ${unitLabel}`);
  return value / unit.factor;
}

// Format to nearest reasonable unit
export function formatEngineering(value: number, unitsArray: {label: string, factor: number}[]): { value: number, unit: string } {
  if (value === 0) return { value: 0, unit: unitsArray.find(u => u.factor === 1)?.label || unitsArray[0].label };
  
  const absVal = Math.abs(value);
  // Find the largest unit that is smaller than the value, or the smallest unit if value is very small
  let bestUnit = unitsArray[0];
  for (let i = 0; i < unitsArray.length; i++) {
    if (absVal >= unitsArray[i].factor) {
      bestUnit = unitsArray[i];
    } else {
      break;
    }
  }

  // Edge case for units that might be too big 
  // If the value is smaller than the smallest unit, use the smallest unit
  if (absVal < unitsArray[0].factor) {
      bestUnit = unitsArray[0];
  }

  return {
    value: value / bestUnit.factor,
    unit: bestUnit.label
  };
}

export function formatScientific(value: number, sigFigs: number = 3): React.ReactNode {
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exponent);
  
  if (exponent >= -2 && exponent <= 2) {
    return Number(value.toPrecision(sigFigs)).toString();
  }
  
  return (
    <span>
      {Number(mantissa.toPrecision(sigFigs))} &times; 10<sup>{exponent}</sup>
    </span>
  );
}
