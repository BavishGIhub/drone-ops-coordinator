import { Pilot, Mission } from './types';
import { readPilots, readMissions } from './sheets';

/**
 * Query pilots with optional filters
 */
export async function queryPilots(filters: {
  skill?: string;
  certification?: string;
  location?: string;
  status?: string;
}): Promise<Pilot[]> {
  const pilots = await readPilots();

  return pilots.filter((pilot) => {
    if (filters.skill) {
      const skills = pilot.skills.toLowerCase().split(',').map((s) => s.trim());
      if (!skills.some((s) => s.includes(filters.skill!.toLowerCase()))) {
        return false;
      }
    }

    if (filters.certification) {
      const certs = pilot.certifications.toLowerCase().split(',').map((c) => c.trim());
      if (!certs.some((c) => c.includes(filters.certification!.toLowerCase()))) {
        return false;
      }
    }

    if (filters.location && pilot.location.toLowerCase() !== filters.location.toLowerCase()) {
      return false;
    }

    if (filters.status && pilot.status !== filters.status) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate pilot cost for a mission
 */
export async function calculatePilotCost(
  pilotId: string,
  missionId: string
): Promise<{ pilot: Pilot; mission: Mission; totalCost: number; duration: number }> {
  const pilots = await readPilots();
  const missions = await readMissions();

  const pilot = pilots.find((p) => p.pilot_id === pilotId);
  const mission = missions.find((m) => m.project_id === missionId);

  if (!pilot) {
    throw new Error(`Pilot ${pilotId} not found`);
  }

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  // Calculate mission duration in days
  const startDate = new Date(mission.start_date);
  const endDate = new Date(mission.end_date);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

  const totalCost = pilot.daily_rate_inr * durationDays;

  return {
    pilot,
    mission,
    totalCost,
    duration: durationDays,
  };
}

/**
 * Get pilot's current assignment details
 */
export async function getPilotAssignment(pilotId: string): Promise<{
  pilot: Pilot;
  mission?: Mission;
}> {
  const pilots = await readPilots();
  const pilot = pilots.find((p) => p.pilot_id === pilotId);

  if (!pilot) {
    throw new Error(`Pilot ${pilotId} not found`);
  }

  let mission: Mission | undefined;

  if (pilot.current_assignment && pilot.current_assignment !== '-') {
    const missions = await readMissions();
    mission = missions.find((m) => m.project_id === pilot.current_assignment);
  }

  return { pilot, mission };
}

/**
 * Check if pilot is available for a date range
 */
export function isPilotAvailableForDates(
  pilot: Pilot,
  startDate: string,
  endDate: string
): boolean {
  // Check if pilot is in Available status
  if (pilot.status !== 'Available') {
    return false;
  }

  // Check if pilot is available from the required start date
  const availableFrom = new Date(pilot.available_from);
  const requiredStart = new Date(startDate);

  return availableFrom <= requiredStart;
}

/**
 * Check if pilot has required skills
 */
export function hasRequiredSkills(pilot: Pilot, requiredSkills: string): boolean {
  const pilotSkills = pilot.skills.toLowerCase().split(',').map((s) => s.trim());
  const required = requiredSkills.toLowerCase().split(',').map((s) => s.trim());

  return required.every((req) => pilotSkills.some((ps) => ps.includes(req)));
}

/**
 * Check if pilot has required certifications
 */
export function hasRequiredCertifications(pilot: Pilot, requiredCerts: string): boolean {
  const pilotCerts = pilot.certifications.toLowerCase().split(',').map((c) => c.trim());
  const required = requiredCerts.toLowerCase().split(',').map((c) => c.trim());

  return required.every((req) => pilotCerts.some((pc) => pc.includes(req)));
}
