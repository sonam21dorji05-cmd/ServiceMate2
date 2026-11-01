import type { VehicleType } from '../types';

export type ServiceInterval = { km: number; days: number };

const CAR_INTERVALS: Record<string, ServiceInterval> = {
  'Oil Change': { km: 8000, days: 180 },
  'Tire Rotation': { km: 10000, days: 180 },
  'Brake Service': { km: 20000, days: 365 },
  'Battery Replacement': { km: 40000, days: 730 },
  'Air Filter': { km: 20000, days: 365 },
  'General Inspection': { km: 10000, days: 180 },
};

// Motorbikes need servicing sooner than cars
const MOTORBIKE_INTERVALS: Record<string, ServiceInterval> = {
  'Oil Change': { km: 4000, days: 120 },
  'Tire Rotation': { km: 8000, days: 180 },
  'Brake Service': { km: 10000, days: 365 },
  'Battery Replacement': { km: 30000, days: 730 },
  'Air Filter': { km: 10000, days: 365 },
  'General Inspection': { km: 6000, days: 180 },
};

// Returns null for services without a fixed interval (for example "Other")
export function getInterval(
  vehicleType: VehicleType,
  serviceType: string
): ServiceInterval | null {
  const table = vehicleType === 'motorbike' ? MOTORBIKE_INTERVALS : CAR_INTERVALS;
  return table[serviceType] ?? null;
}