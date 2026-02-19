import { Conflict, Pilot, Drone, Mission } from './types';
import { readPilots, readDrones, readMissions } from './sheets';
import { hasRequiredSkills, hasRequiredCertifications } from './roster';
import { canOperateInWeather } from './drones';
import { getMissionDuration, hasDateOverlap } from './missions';

/**
 * Detect all conflicts for a given context
 */
export async function detectConflicts(params: {
  start_date?: string;
  end_date?: string;
  pilot_id?: string;
  drone_id?: string;
  mission_id?: string;
}): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  const pilots = await readPilots();
  const drones = await readDrones();
  const missions = await readMissions();

  // Filter entities based on params
  let pilotsToCheck = pilots;
  let dronesToCheck = drones;
  let missionsToCheck = missions;

  if (params.pilot_id) {
    pilotsToCheck = pilots.filter((p) => p.pilot_id === params.pilot_id);
  }

  if (params.drone_id) {
    dronesToCheck = drones.filter((d) => d.drone_id === params.drone_id);
  }

  if (params.mission_id) {
    missionsToCheck = missions.filter((m) => m.project_id === params.mission_id);
  }

  // Filter missions by date range if provided
  if (params.start_date && params.end_date) {
    missionsToCheck = missions.filter((m) =>
      hasDateOverlap(m.start_date, m.end_date, params.start_date!, params.end_date!)
    );
  }

  // Check for double-booking conflicts
  conflicts.push(...detectDoubleBookings(pilotsToCheck, dronesToCheck, missions));

  // Check for skill/cert mismatches
  conflicts.push(...detectSkillMismatches(pilotsToCheck, missions));

  // Check for budget overruns
  conflicts.push(...detectBudgetOverruns(pilotsToCheck, missions));

  // Check for weather risks
  conflicts.push(...detectWeatherRisks(dronesToCheck, missions));

  // Check for location mismatches
  conflicts.push(...detectLocationMismatches(pilotsToCheck, dronesToCheck, missions));

  return conflicts;
}

/**
 * Detect double-booking conflicts
 */
function detectDoubleBookings(
  pilots: Pilot[],
  drones: Drone[],
  missions: Mission[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check pilot double-bookings
  for (const pilot of pilots) {
    if (!pilot.current_assignment || pilot.current_assignment === '-') continue;

    const pilotMission = missions.find((m) => m.project_id === pilot.current_assignment);
    if (!pilotMission) continue;

    // Check if pilot is assigned to any overlapping missions
    const overlappingMissions = missions.filter(
      (m) =>
        m.project_id !== pilot.current_assignment &&
        pilots.some((p) => p.pilot_id === pilot.pilot_id && p.current_assignment === m.project_id)
    );

    for (const overlap of overlappingMissions) {
      if (
        hasDateOverlap(
          pilotMission.start_date,
          pilotMission.end_date,
          overlap.start_date,
          overlap.end_date
        )
      ) {
        conflicts.push({
          type: 'double-booking',
          severity: 'high',
          message: `Pilot ${pilot.pilot_id} is double-booked for overlapping missions ${pilotMission.project_id} and ${overlap.project_id}`,
          entity_id: pilot.pilot_id,
          mission_id: pilotMission.project_id,
        });
      }
    }
  }

  // Check drone double-bookings
  for (const drone of drones) {
    if (!drone.current_assignment || drone.current_assignment === '-') continue;

    const droneMission = missions.find((m) => m.project_id === drone.current_assignment);
    if (!droneMission) continue;

    // Check if drone is assigned to any overlapping missions
    const overlappingMissions = missions.filter(
      (m) =>
        m.project_id !== drone.current_assignment &&
        drones.some((d) => d.drone_id === drone.drone_id && d.current_assignment === m.project_id)
    );

    for (const overlap of overlappingMissions) {
      if (
        hasDateOverlap(
          droneMission.start_date,
          droneMission.end_date,
          overlap.start_date,
          overlap.end_date
        )
      ) {
        conflicts.push({
          type: 'double-booking',
          severity: 'high',
          message: `Drone ${drone.drone_id} is double-booked for overlapping missions ${droneMission.project_id} and ${overlap.project_id}`,
          entity_id: drone.drone_id,
          mission_id: droneMission.project_id,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect skill and certification mismatches
 */
function detectSkillMismatches(pilots: Pilot[], missions: Mission[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const pilot of pilots) {
    if (!pilot.current_assignment || pilot.current_assignment === '-') continue;

    const mission = missions.find((m) => m.project_id === pilot.current_assignment);
    if (!mission) continue;

    // Check skills
    if (!hasRequiredSkills(pilot, mission.required_skills)) {
      conflicts.push({
        type: 'skill-mismatch',
        severity: 'high',
        message: `Pilot ${pilot.pilot_id} lacks required skills for mission ${mission.project_id}. Required: ${mission.required_skills}, Has: ${pilot.skills}`,
        entity_id: pilot.pilot_id,
        mission_id: mission.project_id,
      });
    }

    // Check certifications
    if (!hasRequiredCertifications(pilot, mission.required_certs)) {
      conflicts.push({
        type: 'cert-mismatch',
        severity: 'high',
        message: `Pilot ${pilot.pilot_id} lacks required certifications for mission ${mission.project_id}. Required: ${mission.required_certs}, Has: ${pilot.certifications}`,
        entity_id: pilot.pilot_id,
        mission_id: mission.project_id,
      });
    }
  }

  return conflicts;
}

/**
 * Detect budget overruns
 */
function detectBudgetOverruns(pilots: Pilot[], missions: Mission[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const pilot of pilots) {
    if (!pilot.current_assignment || pilot.current_assignment === '-') continue;

    const mission = missions.find((m) => m.project_id === pilot.current_assignment);
    if (!mission) continue;

    const duration = getMissionDuration(mission);
    const cost = pilot.daily_rate_inr * duration;

    if (cost > mission.mission_budget_inr) {
      conflicts.push({
        type: 'budget-overrun',
        severity: 'medium',
        message: `Mission ${mission.project_id} budget overrun. Pilot ${pilot.pilot_id} cost ₹${cost} exceeds budget ₹${mission.mission_budget_inr}`,
        entity_id: pilot.pilot_id,
        mission_id: mission.project_id,
      });
    }
  }

  return conflicts;
}

/**
 * Detect weather-related risks
 */
function detectWeatherRisks(drones: Drone[], missions: Mission[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const drone of drones) {
    if (!drone.current_assignment || drone.current_assignment === '-') continue;

    const mission = missions.find((m) => m.project_id === drone.current_assignment);
    if (!mission) continue;

    if (!canOperateInWeather(drone, mission.weather_forecast)) {
      conflicts.push({
        type: 'weather-risk',
        severity: 'high',
        message: `Drone ${drone.drone_id} (${drone.weather_resistance}) cannot operate in ${mission.weather_forecast} conditions for mission ${mission.project_id}`,
        entity_id: drone.drone_id,
        mission_id: mission.project_id,
      });
    }
  }

  return conflicts;
}

/**
 * Detect location mismatches
 */
function detectLocationMismatches(
  pilots: Pilot[],
  drones: Drone[],
  missions: Mission[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check pilot location mismatches
  for (const pilot of pilots) {
    if (!pilot.current_assignment || pilot.current_assignment === '-') continue;

    const mission = missions.find((m) => m.project_id === pilot.current_assignment);
    if (!mission) continue;

    if (pilot.location !== mission.location) {
      conflicts.push({
        type: 'location-mismatch',
        severity: 'low',
        message: `Pilot ${pilot.pilot_id} in ${pilot.location} but mission ${mission.project_id} is in ${mission.location}`,
        entity_id: pilot.pilot_id,
        mission_id: mission.project_id,
      });
    }
  }

  // Check drone location mismatches
  for (const drone of drones) {
    if (!drone.current_assignment || drone.current_assignment === '-') continue;

    const mission = missions.find((m) => m.project_id === drone.current_assignment);
    if (!mission) continue;

    if (drone.location !== mission.location) {
      conflicts.push({
        type: 'location-mismatch',
        severity: 'low',
        message: `Drone ${drone.drone_id} in ${drone.location} but mission ${mission.project_id} is in ${mission.location}`,
        entity_id: drone.drone_id,
        mission_id: mission.project_id,
      });
    }
  }

  return conflicts;
}
