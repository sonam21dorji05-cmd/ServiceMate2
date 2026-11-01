import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Vehicle, VehicleInput } from '../types';

const vehiclesRef = collection(db, 'vehicles');

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
      const vehicles: Vehicle[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          make: data.make,
          model: data.model,
          year: data.year,
          licensePlate: data.licensePlate,
          vehicleType: data.vehicleType,
          odometer: data.odometer,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      // Newest first
      vehicles.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onChange(vehicles);
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