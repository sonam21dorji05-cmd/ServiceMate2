import {
  collection,
  doc,
  DocumentData,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { MaintenanceInput, MaintenanceRecord, Vehicle } from '../types';

const recordsRef = collection(db, 'maintenance');

function toRecord(id: string, data: DocumentData): MaintenanceRecord {
  return {
    id,
    ownerId: data.ownerId,
    vehicleId: data.vehicleId,
    serviceType: data.serviceType,
    date: data.date,
    odometer: data.odometer,
    cost: data.cost ?? 0,
    notes: data.notes ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}

export async function addMaintenanceRecord(vehicle: Vehicle, input: MaintenanceInput) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');

  const batch = writeBatch(db);

  batch.set(doc(recordsRef), {
    ...input,
    vehicleId: vehicle.id,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });

  // Keep the vehicle's odometer up to date with the latest reading
  if (input.odometer > vehicle.odometer) {
    batch.update(doc(db, 'vehicles', vehicle.id), { odometer: input.odometer });
  }

  await batch.commit();
}

// Calls onChange every time this vehicle's records change in the cloud
export function subscribeToRecords(
  vehicleId: string,
  onChange: (records: MaintenanceRecord[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;
  if (!user) {
    onChange([]);
    return () => {};
  }

  const q = query(
    recordsRef,
    where('ownerId', '==', user.uid),
    where('vehicleId', '==', vehicleId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((d) => toRecord(d.id, d.data()));
      // Newest service first
      records.sort((a, b) => b.date - a.date || (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onChange(records);
    },
    (error) => onError?.(error)
  );
}

// Every record the user owns, across all vehicles (used to work out reminders)
export function subscribeToAllRecords(
  onChange: (records: MaintenanceRecord[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;
  if (!user) {
    onChange([]);
    return () => {};
  }

  const q = query(recordsRef, where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => toRecord(d.id, d.data()))),
    (error) => onError?.(error)
  );
}