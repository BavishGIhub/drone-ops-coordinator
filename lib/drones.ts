import { Drone, Mission } from './types';
import { readDrones } from './sheets';

/**
 * Query drones with optional filters
 */
export async function queryDrones(filters: {
  capability?: string;
  location?: string;
  status?: string;
  weather_resistant?: boolean;
}): Promise<Drone[]> {
  const drones = await readDrones();

  return drones.filter((drone) => {
    if (filters.capability) {
      const capabilities = drone.capabilities.toLowerCase().split(',').map((c) => c.trim());
      if (!capabilities.some((c) => c.includes(filters.capability!.toLowerCase()))) {
        return false;
      }
    }

    if (filters.location && drone.location.toLowerCase() !== filters.location.toLowerCase()) {
      return false;
    }

    if (filters.status && drone.status !== filters.status) {
      return false;
    }

    if (filters.weather_resistant !== undefined) {
      const isWeatherResistant = isWeatherProof(drone);
      if (isWeatherResistant !== filters.weather_resistant) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if drone is weather-resistant (can fly in rain)
 */
export function isWeatherProof(drone: Drone): boolean {
  const resistance = drone.weather_resistance.toLowerCase();
  return resistance.includes('ip') || resistance.includes('rain');
}

/**
 * Check if drone can operate in given weather conditions
 */
export function canOperateInWeather(drone: Drone, weather: string): boolean {
  const weatherLower = weather.toLowerCase();

  // If weather is sunny or cloudy, any drone can operate
  if (weatherLower === 'sunny' || weatherLower === 'cloudy') {
    return true;
  }

  // If weather is rainy, only weather-resistant drones can operate
  if (weatherLower === 'rainy') {
    return isWeatherProof(drone);
  }

  return true;
}

/**
 * Get drone's current assignment details
 */
export async function getDroneAssignment(droneId: string): Promise<{
  drone: Drone;
  mission?: Mission;
}> {
  const drones = await readDrones();
  const drone = drones.find((d) => d.drone_id === droneId);

  if (!drone) {
    throw new Error(`Drone ${droneId} not found`);
  }

  let mission: Mission | undefined;

  if (drone.current_assignment && drone.current_assignment !== '-') {
    const { readMissions } = await import('./sheets');
    const missions = await readMissions();
    mission = missions.find((m) => m.project_id === drone.current_assignment);
  }

  return { drone, mission };
}

/**
 * Check if drone needs maintenance
 */
export function needsMaintenance(drone: Drone): boolean {
  if (drone.status === 'Maintenance') {
    return true;
  }

  const maintenanceDue = new Date(drone.maintenance_due);
  const now = new Date();

  // Check if maintenance is due within the next 7 days
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return maintenanceDue <= sevenDaysFromNow;
}

/**
 * Check if drone is available (not in maintenance and not assigned)
 */
export function isDroneAvailable(drone: Drone): boolean {
  return drone.status === 'Available' && !needsMaintenance(drone);
}

/**
 * Get drones that need maintenance soon
 */
export async function getDronesNeedingMaintenance(): Promise<Drone[]> {
  const drones = await readDrones();
  return drones.filter((drone) => needsMaintenance(drone));
}
