import { Pilot, Drone, Mission } from './types';
import { readPilots, readDrones, updateAssignment } from './sheets';
import { hasRequiredSkills, hasRequiredCertifications } from './roster';
import { canOperateInWeather, isDroneAvailable } from './drones';
import { getMission, getMissionDuration } from './missions';

/**
 * Match pilots to a mission based on requirements
 */
export async function matchPilotsToMission(
  missionId: string,
  urgent: boolean = false
): Promise<Array<{ pilot: Pilot; score: number; cost: number; warnings: string[] }>> {
  const mission = await getMission(missionId);
  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  const pilots = await readPilots();
  const matches: Array<{ pilot: Pilot; score: number; cost: number; warnings: string[] }> = [];

  for (const pilot of pilots) {
    const warnings: string[] = [];
    let score = 0;

    // Skip if not available (unless urgent, then we consider other statuses too)
    if (!urgent && pilot.status !== 'Available') {
      continue;
    }

    // For urgent, only skip if explicitly unavailable or on leave
    if (urgent && (pilot.status === 'Unavailable' || pilot.status === 'On Leave')) {
      continue;
    }

    // Check location match
    if (pilot.location === mission.location) {
      score += 30;
    } else {
      warnings.push(`Location mismatch: Pilot in ${pilot.location}, mission in ${mission.location}`);
      score -= 10;
    }

    // Check skills
    if (hasRequiredSkills(pilot, mission.required_skills)) {
      score += 30;
    } else {
      warnings.push(`Missing required skills: ${mission.required_skills}`);
      if (!urgent) continue; // Skip if not urgent
      score -= 20;
    }

    // Check certifications
    if (hasRequiredCertifications(pilot, mission.required_certs)) {
      score += 30;
    } else {
      warnings.push(`Missing required certifications: ${mission.required_certs}`);
      if (!urgent) continue; // Skip if not urgent
      score -= 20;
    }

    // Calculate cost
    const duration = getMissionDuration(mission);
    const cost = pilot.daily_rate_inr * duration;

    // Check budget
    if (cost > mission.mission_budget_inr) {
      warnings.push(`Budget overrun: Cost ₹${cost} exceeds budget ₹${mission.mission_budget_inr}`);
      score -= 15;
    } else {
      score += 10;
    }

    // Availability date check
    const availableFrom = new Date(pilot.available_from);
    const missionStart = new Date(mission.start_date);
    if (availableFrom <= missionStart) {
      score += 10;
    } else {
      warnings.push(`Not available until ${pilot.available_from}`);
      score -= 10;
    }

    matches.push({ pilot, score, cost, warnings });
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Match drones to a mission based on requirements
 */
export async function matchDronesToMission(
  missionId: string
): Promise<Array<{ drone: Drone; score: number; warnings: string[] }>> {
  const mission = await getMission(missionId);
  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  const drones = await readDrones();
  const matches: Array<{ drone: Drone; score: number; warnings: string[] }> = [];

  for (const drone of drones) {
    const warnings: string[] = [];
    let score = 0;

    // Check if available
    if (!isDroneAvailable(drone)) {
      continue;
    }

    // Check location match
    if (drone.location === mission.location) {
      score += 30;
    } else {
      warnings.push(`Location mismatch: Drone in ${drone.location}, mission in ${mission.location}`);
      score -= 10;
    }

    // Check weather compatibility
    if (canOperateInWeather(drone, mission.weather_forecast)) {
      score += 40;
    } else {
      warnings.push(
        `Weather risk: Drone ${drone.weather_resistance} cannot operate in ${mission.weather_forecast} conditions`
      );
      continue; // Hard requirement
    }

    // Check capabilities (match required skills to drone capabilities)
    const requiredSkills = mission.required_skills.toLowerCase().split(',').map((s) => s.trim());
    const droneCapabilities = drone.capabilities.toLowerCase().split(',').map((c) => c.trim());

    let capabilityMatch = 0;
    for (const skill of requiredSkills) {
      if (droneCapabilities.some((cap) => cap.includes(skill) || skill.includes(cap))) {
        capabilityMatch++;
      }
    }

    if (capabilityMatch > 0) {
      score += capabilityMatch * 15;
    }

    matches.push({ drone, score, warnings });
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Create an assignment (assign pilot and drone to mission)
 */
export async function createAssignment(
  pilotId: string,
  droneId: string,
  missionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify mission exists
    const mission = await getMission(missionId);
    if (!mission) {
      return { success: false, message: `Mission ${missionId} not found` };
    }

    // Update pilot assignment
    await updateAssignment('pilot', pilotId, missionId);

    // Update drone assignment
    await updateAssignment('drone', droneId, missionId);

    return {
      success: true,
      message: `Successfully assigned ${pilotId} and ${droneId} to ${missionId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating assignment: ${error}`,
    };
  }
}

/**
 * Get all active assignments
 */
export async function getActiveAssignments(): Promise<
  Array<{ pilot: Pilot; drone?: Drone; mission?: Mission }>
> {
  const pilots = await readPilots();
  const drones = await readDrones();
  const { readMissions } = await import('./sheets');
  const missions = await readMissions();

  const assignments: Array<{ pilot: Pilot; drone?: Drone; mission?: Mission }> = [];

  for (const pilot of pilots) {
    if (pilot.current_assignment && pilot.current_assignment !== '-') {
      const mission = missions.find((m) => m.project_id === pilot.current_assignment);
      const drone = drones.find((d) => d.current_assignment === pilot.current_assignment);

      assignments.push({ pilot, drone, mission });
    }
  }

  return assignments;
}
