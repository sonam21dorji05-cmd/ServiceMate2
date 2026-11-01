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