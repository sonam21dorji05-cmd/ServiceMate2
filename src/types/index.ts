export type VehicleType = 'car' | 'motorbike';

export type Vehicle = {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vehicleType: VehicleType;
  odometer: number;
  createdAt?: number;
};

export type VehicleInput = Omit<Vehicle, 'id' | 'ownerId' | 'createdAt'>;

export type MaintenanceRecord = {
  id: string;
  ownerId: string;
  vehicleId: string;
  serviceType: string;
  date: number; // service date in milliseconds
  odometer: number;
  cost: number;
  notes: string;
  createdAt?: number;
};

export type MaintenanceInput = Omit<
  MaintenanceRecord,
  'id' | 'ownerId' | 'vehicleId' | 'createdAt'
>;