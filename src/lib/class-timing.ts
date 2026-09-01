export interface BatchInfo {
  _id?: string;
  name?: string;
  date?: string;      // "YYYY-MM-DD"
  startTime?: string; // "19:00"
  endTime?: string;   // "20:00"
  days?: string[];    // ["Monday", "Tuesday", ...]
  gracePeriodMinutes?: number;
}

export interface ClassTimingStatus {
  isLiveNow: boolean;
  canJoin: boolean;
  statusLabel: string;
  statusBadge: "LIVE" | "UPCOMING" | "CONCLUDED" | "OFF_DAY";
  countdownText: string;
  detailedCountdown: string;
  permanentRoomId: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  nextSessionText: string;
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 19 * 60; // 19:00 default
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function formatMinutesTo12Hour(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHours}:${displayMins} ${period}`;
}

export function computeClassTimingStatus(batch?: BatchInfo | null): ClassTimingStatus {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[currentDayIndex];
  const todayDateStr = now.toISOString().split("T")[0];

  const startTimeStr = batch?.startTime || "19:00";
  const endTimeStr = batch?.endTime || "20:00";
  const batchDays = batch?.days && batch.days.length > 0
    ? batch.days
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const startMinutes = parseTimeToMinutes(startTimeStr);
  const endMinutes = parseTimeToMinutes(endTimeStr);
  const graceMinutes = batch?.gracePeriodMinutes ?? 15; // Allow joining 15 mins before class starts

  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  // Handle overnight / past-midnight class windows (e.g. 23:15 to 01:00)
  const isOvernight = endMinutes < startMinutes;
  const effectiveEndMinutes = isOvernight ? endMinutes + 1440 : endMinutes;
  const effectiveCurrentMinutes =
    isOvernight && currentMinutes < (startMinutes - graceMinutes)
      ? currentMinutes + 1440
      : currentMinutes;

  // Derive permanent meet link for this timing batch
  const batchTag = startTimeStr.replace(":", "");
  const batchIdClean = batch?._id ? batch._id.toString().slice(-6) : `t${batchTag}`;
  const permanentRoomId = `acuity-batch-${batchTag}-${batchIdClean}`;

  const startTimeFormatted = formatMinutesTo12Hour(startMinutes);
  const endTimeFormatted = formatMinutesTo12Hour(endMinutes);

  // If specific date is supplied (for scheduled class sessions)
  if (batch?.date) {
    if (batch.date === todayDateStr) {
      // 1. Is it currently in the live window today?
      if (effectiveCurrentMinutes >= (startMinutes - graceMinutes) && effectiveCurrentMinutes <= effectiveEndMinutes) {
        const remainingInClassMinutes = Math.max(0, Math.floor(effectiveEndMinutes - effectiveCurrentMinutes));
        return {
          isLiveNow: true,
          canJoin: true,
          statusLabel: "Class is Live Now",
          statusBadge: "LIVE",
          countdownText: `Ends in ${remainingInClassMinutes}m`,
          detailedCountdown: `Class is currently in session until ${endTimeFormatted} (${remainingInClassMinutes} minutes remaining).`,
          permanentRoomId,
          startTimeFormatted,
          endTimeFormatted,
          nextSessionText: `Today (${startTimeFormatted} – ${endTimeFormatted})`,
        };
      }

      // 2. Is it upcoming later today?
      if (effectiveCurrentMinutes < (startMinutes - graceMinutes)) {
        const diffSecondsTotal = Math.max(0, Math.floor(((startMinutes - graceMinutes) * 60) - (currentMinutes * 60)));
        const hours = Math.floor(diffSecondsTotal / 3600);
        const mins = Math.floor((diffSecondsTotal % 3600) / 60);
        const secs = diffSecondsTotal % 60;

        const formattedTime = hours > 0
          ? `${hours}h ${mins}m ${secs}s`
          : mins > 0
          ? `${mins}m ${secs}s`
          : `${secs}s`;

        return {
          isLiveNow: false,
          canJoin: false,
          statusLabel: `Starts at ${startTimeFormatted}`,
          statusBadge: "UPCOMING",
          countdownText: `Starts in ${formattedTime}`,
          detailedCountdown: `Class opens at ${startTimeFormatted} (${hours > 0 ? `${hours} hr ` : ""}${mins} mins remaining). Entry will be enabled automatically.`,
          permanentRoomId,
          startTimeFormatted,
          endTimeFormatted,
          nextSessionText: `Today at ${startTimeFormatted} – ${endTimeFormatted}`,
        };
      }

      // 3. Concluded for today
      return {
        isLiveNow: false,
        canJoin: false,
        statusLabel: "Concluded for Today",
        statusBadge: "CONCLUDED",
        countdownText: "Concluded",
        detailedCountdown: `This session concluded today at ${endTimeFormatted}.`,
        permanentRoomId,
        startTimeFormatted,
        endTimeFormatted,
        nextSessionText: `Concluded Today`,
      };
    } else if (batch.date > todayDateStr) {
      // Future date
      const [year, month, day] = batch.date.split("-").map(Number);
      const targetSessionStart = new Date(year, month - 1, day, Math.floor(startMinutes / 60), startMinutes % 60, 0);
      const diffMs = Math.max(0, targetSessionStart.getTime() - now.getTime());

      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const timeUntilStr = totalHours >= 24
        ? `${Math.floor(totalHours / 24)}d ${totalHours % 24}h ${totalMins}m`
        : `${totalHours}h ${totalMins}m ${totalSecs}s`;

      const sessionDateFormatted = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(targetSessionStart);

      return {
        isLiveNow: false,
        canJoin: false,
        statusLabel: `${sessionDateFormatted} at ${startTimeFormatted}`,
        statusBadge: "UPCOMING",
        countdownText: `Starts in ${timeUntilStr}`,
        detailedCountdown: `Scheduled for ${sessionDateFormatted} at ${startTimeFormatted} (in ${timeUntilStr}).`,
        permanentRoomId,
        startTimeFormatted,
        endTimeFormatted,
        nextSessionText: `${sessionDateFormatted} at ${startTimeFormatted}`,
      };
    } else {
      // Past date
      return {
        isLiveNow: false,
        canJoin: false,
        statusLabel: "Completed Session",
        statusBadge: "CONCLUDED",
        countdownText: "Completed",
        detailedCountdown: `Session was conducted on ${batch.date}.`,
        permanentRoomId,
        startTimeFormatted,
        endTimeFormatted,
        nextSessionText: `Completed`,
      };
    }
  }

  // If recurring batch without specific date
  const isClassDayToday = batchDays.includes(currentDayName);

  // 1. Is the class currently in the active live window?
  if (isClassDayToday && effectiveCurrentMinutes >= (startMinutes - graceMinutes) && effectiveCurrentMinutes <= effectiveEndMinutes) {
    const remainingInClassMinutes = Math.max(0, Math.floor(effectiveEndMinutes - effectiveCurrentMinutes));
    return {
      isLiveNow: true,
      canJoin: true,
      statusLabel: "Class is Live Now",
      statusBadge: "LIVE",
      countdownText: `Ends in ${remainingInClassMinutes}m`,
      detailedCountdown: `Class is currently in session until ${endTimeFormatted} (${remainingInClassMinutes} minutes remaining).`,
      permanentRoomId,
      startTimeFormatted,
      endTimeFormatted,
      nextSessionText: `Live Class in Session (${startTimeFormatted} – ${endTimeFormatted})`,
    };
  }

  // 2. Is today a class day and the class is upcoming later today?
  if (isClassDayToday && effectiveCurrentMinutes < (startMinutes - graceMinutes)) {
    const diffSecondsTotal = Math.max(0, Math.floor(((startMinutes - graceMinutes) * 60) - (currentMinutes * 60)));
    const hours = Math.floor(diffSecondsTotal / 3600);
    const mins = Math.floor((diffSecondsTotal % 3600) / 60);
    const secs = diffSecondsTotal % 60;

    const formattedTime = hours > 0
      ? `${hours}h ${mins}m ${secs}s`
      : mins > 0
      ? `${mins}m ${secs}s`
      : `${secs}s`;

    return {
      isLiveNow: false,
      canJoin: false,
      statusLabel: `Starts at ${startTimeFormatted}`,
      statusBadge: "UPCOMING",
      countdownText: `Starts in ${formattedTime}`,
      detailedCountdown: `Class opens at ${startTimeFormatted} (${hours > 0 ? `${hours} hr ` : ""}${mins} mins remaining). Entry will be enabled automatically.`,
      permanentRoomId,
      startTimeFormatted,
      endTimeFormatted,
      nextSessionText: `Today at ${startTimeFormatted} – ${endTimeFormatted}`,
    };
  }

  // 3. Class has concluded for today OR today is an off day -> Calculate next session
  let daysUntilNext = 1;
  let nextDayName = daysOfWeek[(currentDayIndex + daysUntilNext) % 7];
  while (!batchDays.includes(nextDayName) && daysUntilNext <= 7) {
    daysUntilNext++;
    nextDayName = daysOfWeek[(currentDayIndex + daysUntilNext) % 7];
  }

  const nextClassDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNext);
  const nextClassStart = new Date(nextClassDate.getFullYear(), nextClassDate.getMonth(), nextClassDate.getDate(), Math.floor(startMinutes / 60), startMinutes % 60, 0);

  const diffMs = Math.max(0, nextClassStart.getTime() - now.getTime());
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const totalSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  const timeUntilNextStr = totalHours > 24
    ? `${Math.floor(totalHours / 24)}d ${totalHours % 24}h ${totalMins}m`
    : `${totalHours}h ${totalMins}m ${totalSecs}s`;

  return {
    isLiveNow: false,
    canJoin: false,
    statusLabel: isClassDayToday ? "Concluded for Today" : "Rest / Self-Study Day",
    statusBadge: isClassDayToday ? "CONCLUDED" : "OFF_DAY",
    countdownText: `Next class in ${timeUntilNextStr}`,
    detailedCountdown: `Next live session is on ${nextDayName} at ${startTimeFormatted} (in ${timeUntilNextStr}).`,
    permanentRoomId,
    startTimeFormatted,
    endTimeFormatted,
    nextSessionText: `${nextDayName} at ${startTimeFormatted}`,
  };
}

export function getClassLiveState(cls?: { date?: string; startTime?: string; endTime?: string; status?: string } | null): "LIVE" | "UPCOMING" | "COMPLETED" | "DRAFT" | "CANCELLED" {
  if (!cls) return "UPCOMING";
  const status = (cls.status || "").toUpperCase();
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "DRAFT") return "DRAFT";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "LIVE") return "LIVE";

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = parseTimeToMinutes(cls.endTime || "20:00");
  const sessionDate = cls.date || todayStr;

  if (sessionDate < todayStr || (sessionDate === todayStr && nowMinutes > endMinutes)) {
    return "COMPLETED";
  }

  return "UPCOMING";
}

export function sortClassesByPriority<T extends { status?: string; date?: string; startTime?: string; endTime?: string }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const stateA = getClassLiveState(a);
    const stateB = getClassLiveState(b);

    const priorityOrder = {
      LIVE: 1,
      UPCOMING: 2,
      COMPLETED: 3,
      DRAFT: 4,
      CANCELLED: 5,
    };

    const pA = priorityOrder[stateA] || 6;
    const pB = priorityOrder[stateB] || 6;

    if (pA !== pB) {
      return pA - pB;
    }

    const dateA = a.date || "";
    const dateB = b.date || "";

    // Both UPCOMING -> Earliest start date and time first (Today, Tomorrow, etc.)
    if (stateA === "UPCOMING") {
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.startTime || "").localeCompare(b.startTime || "");
    }

    // Both COMPLETED -> Most recent concluded date and time first
    if (stateA === "COMPLETED") {
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.startTime || "").localeCompare(a.startTime || "");
    }

    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
}


