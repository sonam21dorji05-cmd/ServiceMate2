import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '../utils/format';
import type { Reminder } from '../utils/reminders';

const NOTIFIED_KEY = 'servicemate_notified_v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const ALERT_HOUR = 9; // scheduled alerts arrive at 9:00 AM
const REPEAT_DAYS = [1, 3, 7, 14]; // re-alerts while a service stays overdue

// Show notifications even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function at9am(ms: number): Date {
  const d = new Date(ms);
  d.setHours(ALERT_HOUR, 0, 0, 0);
  return d;
}

async function loadNotified(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveNotified(list: string[]) {
  try {
    await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
  } catch {
    // Not critical: worst case an alert is sent again
  }
}

function vehicleLabel(r: Reminder): string {
  return `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.licensePlate})`;
}

function overdueBody(r: Reminder): string {
  const parts: string[] = [];
  if (r.kmRemaining <= 0) parts.push(`${Math.abs(r.kmRemaining).toLocaleString()} km`);
  if (r.daysRemaining < 0) {
    const days = Math.abs(r.daysRemaining);
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
  }
  const by = parts.length > 0 ? ` by ${parts.join(' and ')}` : '';
  return `${vehicleLabel(r)} is overdue for ${r.serviceType}${by}.`;
}

function soonBody(r: Reminder): string {
  const days = r.daysRemaining;
  return `${vehicleLabel(r)}: ${r.serviceType} is due in ${r.kmRemaining.toLocaleString()} km or ${days} day${
    days === 1 ? '' : 's'
  }.`;
}

async function sendNow(title: string, body: string, data: Record<string, unknown>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}

async function scheduleAt(
  date: Date,
  title: string,
  body: string,
  data: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

async function doSync(reminders: Reminder[]) {
  const allowed = await ensurePermission();
  if (!allowed) return;

  // Rebuild every scheduled alert from the current data
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const notified = await loadNotified();
  const liveIds = new Set<string>();

  for (const r of reminders) {
    // The id changes whenever the service is logged again, so new cycles alert again
    const id = `${r.key}-${r.dueOdometer}-${r.dueDate}`;
    liveIds.add(id);
    const data = { vehicleId: r.vehicle.id };

    if (r.status === 'overdue') {
      // Immediate alert the first time this reminder is seen overdue
      if (!notified.includes(`${id}|overdue`)) {
        await sendNow(`${r.serviceType} is overdue`, overdueBody(r), data);
        notified.push(`${id}|overdue`);
      }
      // Recurring re-alerts while it stays overdue
      for (const days of REPEAT_DAYS) {
        await scheduleAt(
          at9am(now + days * DAY_MS),
          `Reminder: ${r.serviceType} still overdue`,
          overdueBody(r),
          data
        );
      }
      continue;
    }

    if (r.status === 'due-soon' && !notified.includes(`${id}|soon`)) {
      await sendNow(`${r.serviceType} due soon`, soonBody(r), data);
      notified.push(`${id}|soon`);
    }

    const headsUp = at9am(r.dueDate - 3 * DAY_MS);
    if (headsUp.getTime() > now) {
      await scheduleAt(
        headsUp,
        `${r.serviceType} due in 3 days`,
        `${vehicleLabel(r)} is due for ${r.serviceType} on ${formatDate(r.dueDate)}.`,
        data
      );
    }

    const dueDay = at9am(r.dueDate);
    if (dueDay.getTime() > now) {
      await scheduleAt(
        dueDay,
        `${r.serviceType} is due today`,
        `${vehicleLabel(r)} is due for ${r.serviceType} today.`,
        data
      );
    }
  }

  // Forget alerts for reminders that no longer exist
  await saveNotified(notified.filter((entry) => liveIds.has(entry.split('|')[0])));

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`[notifications] ${scheduled.length} scheduled`);
}

async function doClear() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIFIED_KEY);
}

// Runs one at a time, so overlapping updates cannot schedule duplicates
let queue: Promise<void> = Promise.resolve();

export function syncReminderNotifications(reminders: Reminder[]): Promise<void> {
  queue = queue
    .then(() => doSync(reminders))
    .catch((error) => console.warn('Notification sync failed', error));
  return queue;
}

export function clearAllNotifications(): Promise<void> {
  queue = queue
    .then(() => doClear())
    .catch((error) => console.warn('Clearing notifications failed', error));
  return queue;
}