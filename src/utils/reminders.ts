import { getInterval } from '../constants/serviceIntervals';
import type { MaintenanceRecord, Vehicle } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_KM = 500;
const SOON_DAYS = 14;

export type ReminderStatus = 'overdue' | 'due-soon' | 'upcoming';

export type Reminder = {
  key: string;
  vehicle: Vehicle;
  serviceType: string;
  lastDate: number;
  lastOdometer: number;
  dueOdometer: number;
  dueDate: number;
  kmRemaining: number;
  daysRemaining: number;
  status: ReminderStatus;
};

// One reminder per service type, based on the most recent record of that type
export function computeReminders(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  now: number = Date.now()
): Reminder[] {
  const latest = new Map<string, MaintenanceRecord>();

  for (const record of records) {
    if (record.vehicleId !== vehicle.id) continue;
    const current = latest.get(record.serviceType);
    if (
      !current ||
      record.date > current.date ||
      (record.date === current.date && record.odometer > current.odometer)
    ) {
      latest.set(record.serviceType, record);
    }
  }

  const reminders: Reminder[] = [];

  latest.forEach((record, serviceType) => {
    const interval = getInterval(vehicle.vehicleType, serviceType);
    if (!interval) return;

    const dueOdometer = record.odometer + interval.km;
    const dueDate = record.date + interval.days * DAY_MS;
    const kmRemaining = dueOdometer - vehicle.odometer;
    const daysRemaining = Math.ceil((dueDate - now) / DAY_MS);

    // Whichever limit is reached first triggers the status
    let status: ReminderStatus = 'upcoming';
    if (kmRemaining <= 0 || daysRemaining <= 0) status = 'overdue';
    else if (kmRemaining <= SOON_KM || daysRemaining <= SOON_DAYS) status = 'due-soon';

    reminders.push({
      key: `${vehicle.id}-${serviceType}`,
      vehicle,
      serviceType,
      lastDate: record.date,
      lastOdometer: record.odometer,
      dueOdometer,
      dueDate,
      kmRemaining,
      daysRemaining,
      status,
    });
  });

  return reminders;
}

const ORDER: Record<ReminderStatus, number> = { overdue: 0, 'due-soon': 1, upcoming: 2 };

// Overdue first, then due soon, then upcoming; soonest first inside each group
export function computeAllReminders(
  vehicles: Vehicle[],
  records: MaintenanceRecord[]
): Reminder[] {
  const all: Reminder[] = [];
  vehicles.forEach((vehicle) => all.push(...computeReminders(vehicle, records)));

  return all.sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.daysRemaining - b.daysRemaining
  );
}