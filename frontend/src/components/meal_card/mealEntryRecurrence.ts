import type { PlannedMealEntryRecurrence } from "@/api/generated";

function getWeekday(
  mealPlanStartDay: number | undefined,
  dayOffset: number,
): number {
  return ((mealPlanStartDay ?? 0) + dayOffset) % 7;
}

function getWeekdays(weekdays: unknown): number[] {
  if (!Array.isArray(weekdays)) {
    return [];
  }

  return weekdays.filter(
    (weekday): weekday is number =>
      typeof weekday === "number" &&
      Number.isInteger(weekday) &&
      weekday >= 0 &&
      weekday <= 6,
  );
}

/**
 * Returns the number of recurring occurrences after
 * the original entry's day and up to targetDay.
 *
 * The original occurrence is 0.
 * The first repeated occurrence is 1.
 */
function getOccurrenceNumber(
  sourceDay: number,
  targetDay: number,
  recurrence: PlannedMealEntryRecurrence,
  mealPlanStartDay: number | undefined,
): number {
  if (targetDay <= sourceDay) {
    return 0;
  }

  const interval = recurrence.interval ?? "week";

  const intervalCount = recurrence.interval_count ?? 1;

  if (!Number.isInteger(intervalCount) || intervalCount <= 0) {
    return 0;
  }

  if (interval === "day") {
    return Math.floor((targetDay - sourceDay) / intervalCount);
  }

  const recurrenceWeekdays = getWeekdays(recurrence.weekdays);

  const sourceWeekday = getWeekday(mealPlanStartDay, sourceDay);

  let occurrenceNumber = 0;

  for (let day = sourceDay + 1; day <= targetDay; day += 1) {
    const delta = day - sourceDay;
    const weeksSinceSource = Math.floor(delta / 7);

    if (weeksSinceSource % intervalCount !== 0) {
      continue;
    }

    const weekday = getWeekday(mealPlanStartDay, day);

    if (recurrenceWeekdays.length > 0) {
      if (!recurrenceWeekdays.includes(weekday)) {
        continue;
      }
    } else if (weekday !== sourceWeekday) {
      continue;
    }

    occurrenceNumber += 1;
  }

  return occurrenceNumber;
}

/**
 * Determines whether a planned food/recipe entry that
 * originated on sourceDay should appear on targetDay.
 *
 * `sourceDay` and `targetDay` are offsets from the
 * meal plan's start day.
 *
 * Recurrence weekday values use the normal weekday numbering:
 * Monday = 0 ... Sunday = 6.
 */
export function entryOccursOnDay({
  sourceDay,
  targetDay,
  recurrence,
  mealPlanStartDay,
}: {
  sourceDay: number;
  targetDay: number;
  recurrence?: PlannedMealEntryRecurrence | null;
  mealPlanStartDay?: number;
}): boolean {
  /*
   * The original entry always exists on its source day.
   */
  if (targetDay === sourceDay) {
    return true;
  }

  /*
   * No recurrence means the entry only exists
   * on its original day.
   */
  if (targetDay < sourceDay || recurrence == null) {
    return false;
  }

  const interval = recurrence.interval ?? "week";

  const intervalCount = recurrence.interval_count ?? 1;

  if (!Number.isInteger(intervalCount) || intervalCount <= 0) {
    return false;
  }

  /*
   * Stop recurrence after a specific meal-plan day.
   */
  if (
    recurrence.end === "on_day" &&
    recurrence.end_day != null &&
    targetDay > recurrence.end_day
  ) {
    return false;
  }

  /*
   * Daily recurrence.
   *
   * Every 1 day:
   *   source + 1, source + 2, source + 3...
   *
   * Every 2 days:
   *   source + 2, source + 4, source + 6...
   */
  if (interval === "day") {
    const delta = targetDay - sourceDay;

    if (delta % intervalCount !== 0) {
      return false;
    }

    if (recurrence.end === "after" && recurrence.end_after != null) {
      const occurrenceNumber = Math.floor(delta / intervalCount);

      return occurrenceNumber <= recurrence.end_after;
    }

    return true;
  }

  /*
   * Weekly recurrence.
   */
  const delta = targetDay - sourceDay;

  const weeksSinceSource = Math.floor(delta / 7);

  /*
   * The entry can only repeat on the selected
   * weekly interval.
   *
   * Every 1 week:
   *   0, 1, 2, 3...
   *
   * Every 2 weeks:
   *   0, 2, 4, 6...
   */
  if (weeksSinceSource % intervalCount !== 0) {
    return false;
  }

  const targetWeekday = getWeekday(mealPlanStartDay, targetDay);

  const recurrenceWeekdays = getWeekdays(recurrence.weekdays);

  /*
   * If no weekdays were saved, default to the
   * source entry's weekday.
   *
   * This also makes older recurrence records
   * without weekdays behave sensibly.
   */
  if (recurrenceWeekdays.length === 0) {
    const sourceWeekday = getWeekday(mealPlanStartDay, sourceDay);

    if (targetWeekday !== sourceWeekday) {
      return false;
    }
  } else if (!recurrenceWeekdays.includes(targetWeekday)) {
    return false;
  }

  /*
   * Apply "after N occurrences".
   */
  if (recurrence.end === "after" && recurrence.end_after != null) {
    const occurrenceNumber = getOccurrenceNumber(
      sourceDay,
      targetDay,
      recurrence,
      mealPlanStartDay,
    );

    if (occurrenceNumber > recurrence.end_after) {
      return false;
    }
  }

  return true;
}
