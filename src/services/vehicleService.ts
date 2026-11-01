import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Vehicle, VehicleInput } from '../types';

const vehiclesRef = collection(db, 'vehicles');

function toVehicle(id: string, data: DocumentData): Vehicle {
  return {
    id,
    ownerId: data.ownerId,
    make: data.make,
    model: data.model,
    year: data.year,
    licensePlate: data.licensePlate,
    vehicleType: data.vehicleType,
    odometer: data.odometer,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}

export async function addVehicle(input: VehicleInput) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');

  await addDoc(vehiclesRef, {
    ...input,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });
}

// Calls onChange every time the user's vehicles change in the cloud
export function subscribeToVehicles(
  onChange: (vehicles: Vehicle[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;
  if (!user) {
    onChange([]);
    return () => {};
  }

  const q = query(vehiclesRef, where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const vehicles = snapshot.docs.map((d) => toVehicle(d.id, d.data()));
      // Newest first
      vehicles.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onChange(vehicles);
    },
    (error) => onError?.(error)
  );
}

// Calls onChange with one vehicle, or null if it no longer exists
export function subscribeToVehicle(
  id: string,
  onChange: (vehicle: Vehicle | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, 'vehicles', id),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      onChange(toVehicle(snapshot.id, snapshot.data()));
    },
    (error) => onError?.(error)
  );
}

export function updateVehicle(id: string, input: VehicleInput) {
  return updateDoc(doc(db, 'vehicles', id), { ...input });
}

export function deleteVehicle(id: string) {
  return deleteDoc(doc(db, 'vehicles', id));
}