import { ReassignmentOption, Mission } from './types';
import { matchPilotsToMission, matchDronesToMission } from './assignments';
import { getMission } from './missions';

/**
 * Handle urgent reassignment when pilot/drone becomes unavailable
 * Prioritizes speed and feasibility over cost optimization
 */
export async function urgentReassignment(
  missionId: string,
  reason: string
): Promise<{
  mission: Mission;
  reason: string;
  options: ReassignmentOption[];
  recommendation: string;
}> {
  const mission = await getMission(missionId);
  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  // Get pilot and drone matches with urgent flag
  const pilotMatches = await matchPilotsToMission(missionId, true);
  const droneMatches = await matchDronesToMission(missionId);

  const options: ReassignmentOption[] = [];

  // Generate top combinations
  const maxOptions = 3;
  let optionsCreated = 0;

  for (const pilotMatch of pilotMatches) {
    if (optionsCreated >= maxOptions) break;

    for (const droneMatch of droneMatches) {
      if (optionsCreated >= maxOptions) break;

      const warnings = [...pilotMatch.warnings, ...droneMatch.warnings];
      const reasons: string[] = [];

      // Calculate feasibility score based on various factors
      let feasibilityScore = pilotMatch.score + droneMatch.score;

      // Same location as mission is highly preferred
      if (pilotMatch.pilot.location === mission.location) {
        feasibilityScore += 20;
        reasons.push('Pilot in same location as mission');
      }

      if (droneMatch.drone.location === mission.location) {
        feasibilityScore += 20;
        reasons.push('Drone in same location as mission');
      }

      // Immediate availability
      const availableFrom = new Date(pilotMatch.pilot.available_from);
      const missionStart = new Date(mission.start_date);
      if (availableFrom <= missionStart) {
        feasibilityScore += 15;
        reasons.push('Pilot immediately available');
      } else {
        warnings.push(`Pilot available from ${pilotMatch.pilot.available_from}`);
      }

      // Check if pilot currently available or can be freed
      if (pilotMatch.pilot.status === 'Available') {
        feasibilityScore += 10;
        reasons.push('Pilot currently available');
      } else if (pilotMatch.pilot.status === 'Assigned') {
        warnings.push('Pilot currently assigned to another mission');
        feasibilityScore -= 5;
      }

      // Cost consideration (but not blocking for urgent)
      if (pilotMatch.cost <= mission.mission_budget_inr) {
        feasibilityScore += 5;
        reasons.push('Within budget');
      } else {
        warnings.push(`Budget Overrun Warning: Cost ₹${pilotMatch.cost} exceeds budget ₹${mission.mission_budget_inr}`);
      }

      // Weather compatibility
      if (droneMatch.warnings.length === 0) {
        reasons.push('Drone suitable for weather conditions');
      }

      options.push({
        pilot: pilotMatch.pilot,
        drone: droneMatch.drone,
        cost: pilotMatch.cost,
        feasibility_score: feasibilityScore,
        warnings,
        reasons,
      });

      optionsCreated++;
    }
  }

  // Sort by feasibility score (descending)
  options.sort((a, b) => b.feasibility_score - a.feasibility_score);

  // Take top 3
  const topOptions = options.slice(0, 3);

  // Generate recommendation
  let recommendation = '';
  if (topOptions.length === 0) {
    recommendation = `CRITICAL: No suitable reassignment options found for mission ${missionId}. Reason: ${reason}. Consider extending mission deadline or adjusting requirements.`;
  } else {
    const best = topOptions[0];
    recommendation = `URGENT REASSIGNMENT RECOMMENDED:\n\n`;
    recommendation += `Assign ${best.pilot?.name} (${best.pilot?.pilot_id}) and ${best.drone?.model} (${best.drone?.drone_id})\n`;
    recommendation += `Cost: ₹${best.cost}\n`;
    recommendation += `Feasibility Score: ${best.feasibility_score}\n\n`;
    recommendation += `Reasons:\n${best.reasons.map((r) => `  • ${r}`).join('\n')}\n`;

    if (best.warnings.length > 0) {
      recommendation += `\n⚠️  WARNINGS:\n${best.warnings.map((w) => `  • ${w}`).join('\n')}\n`;
    }

    recommendation += `\nAlternative options are also available if needed.`;
  }

  return {
    mission,
    reason,
    options: topOptions,
    recommendation,
  };
}

/**
 * Find replacement pilot for a mission
 */
export async function findReplacementPilot(
  missionId: string,
  unavailablePilotId: string
): Promise<ReassignmentOption[]> {
  const pilotMatches = await matchPilotsToMission(missionId, true);

  // Filter out the unavailable pilot
  const alternatives = pilotMatches.filter((m) => m.pilot.pilot_id !== unavailablePilotId);

  return alternatives.slice(0, 3).map((match) => ({
    pilot: match.pilot,
    cost: match.cost,
    feasibility_score: match.score,
    warnings: match.warnings,
    reasons: [
      `Score: ${match.score}`,
      `Location: ${match.pilot.location}`,
      `Status: ${match.pilot.status}`,
    ],
  }));
}

/**
 * Find replacement drone for a mission
 */
export async function findReplacementDrone(
  missionId: string,
  unavailableDroneId: string
): Promise<ReassignmentOption[]> {
  const droneMatches = await matchDronesToMission(missionId);

  // Filter out the unavailable drone
  const alternatives = droneMatches.filter((m) => m.drone.drone_id !== unavailableDroneId);

  return alternatives.slice(0, 3).map((match) => ({
    drone: match.drone,
    cost: 0, // Drone cost is not tracked separately
    feasibility_score: match.score,
    warnings: match.warnings,
    reasons: [
      `Score: ${match.score}`,
      `Location: ${match.drone.location}`,
      `Status: ${match.drone.status}`,
    ],
  }));
}
