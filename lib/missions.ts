import { Mission } from './types';
import { readMissions } from './sheets';

/**
 * Query missions with optional filters
 */
export async function queryMissions(filters: {
  client?: string;
  location?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Mission[]> {
  const missions = await readMissions();

  return missions.filter((mission) => {
    if (filters.client && !mission.client.toLowerCase().includes(filters.client.toLowerCase())) {
      return false;
    }

    if (filters.location && mission.location.toLowerCase() !== filters.location.toLowerCase()) {
      return false;
    }

    if (filters.priority && mission.priority !== filters.priority) {
      return false;
    }

    if (filters.start_date) {
      const missionStart = new Date(mission.start_date);
      const filterStart = new Date(filters.start_date);
      if (missionStart < filterStart) {
        return false;
      }
    }

    if (filters.end_date) {
      const missionEnd = new Date(mission.end_date);
      const filterEnd = new Date(filters.end_date);
      if (missionEnd > filterEnd) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get mission by ID
 */
export async function getMission(missionId: string): Promise<Mission | undefined> {
  const missions = await readMissions();
  return missions.find((m) => m.project_id === missionId);
}

/**
 * Calculate mission duration in days
 */
export function getMissionDuration(mission: Mission): number {
  const startDate = new Date(mission.start_date);
  const endDate = new Date(mission.end_date);
  const durationMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
}

/**
 * Check if missions have overlapping dates
 */
export function hasDateOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  // Check if ranges overlap
  return s1 <= e2 && s2 <= e1;
}

/**
 * Get missions in a date range
 */
export async function getMissionsInDateRange(
  startDate: string,
  endDate: string
): Promise<Mission[]> {
  const missions = await readMissions();

  return missions.filter((mission) => {
    return hasDateOverlap(mission.start_date, mission.end_date, startDate, endDate);
  });
}

/**
 * Get urgent missions
 */
export async function getUrgentMissions(): Promise<Mission[]> {
  const missions = await readMissions();
  return missions.filter((m) => m.priority === 'Urgent');
}

/**
 * Get missions by priority
 */
export async function getMissionsByPriority(priority: string): Promise<Mission[]> {
  const missions = await readMissions();
  return missions.filter((m) => m.priority.toLowerCase() === priority.toLowerCase());
}
