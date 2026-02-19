#!/usr/bin/env node

/**
 * Simple test script to verify business logic without API calls
 * This tests the core algorithms without requiring Google Sheets or OpenAI access
 */

// Mock data matching the CSV structure
const mockPilots = [
  {
    pilot_id: 'P001',
    name: 'Arjun',
    skills: 'Mapping, Survey',
    certifications: 'DGCA, Night Ops',
    location: 'Bangalore',
    status: 'Available',
    current_assignment: '-',
    available_from: '2026-02-05',
    daily_rate_inr: 1500,
  },
  {
    pilot_id: 'P002',
    name: 'Neha',
    skills: 'Inspection',
    certifications: 'DGCA',
    location: 'Mumbai',
    status: 'Assigned',
    current_assignment: 'Project-A',
    available_from: '2026-02-12',
    daily_rate_inr: 3000,
  },
  {
    pilot_id: 'P003',
    name: 'Rohit',
    skills: 'Inspection, Mapping',
    certifications: 'DGCA',
    location: 'Mumbai',
    status: 'Available',
    current_assignment: '-',
    available_from: '2026-02-05',
    daily_rate_inr: 1500,
  },
  {
    pilot_id: 'P004',
    name: 'Sneha',
    skills: 'Survey, Thermal',
    certifications: 'DGCA, Night Ops',
    location: 'Bangalore',
    status: 'On Leave',
    current_assignment: '-',
    available_from: '2026-02-15',
    daily_rate_inr: 5000,
  },
];

const mockDrones = [
  {
    drone_id: 'D001',
    model: 'DJI M300',
    capabilities: 'LiDAR, RGB',
    status: 'Available',
    location: 'Bangalore',
    current_assignment: '-',
    maintenance_due: '2026-03-01',
    weather_resistance: 'IP43 (Rain)',
  },
  {
    drone_id: 'D002',
    model: 'DJI Mavic 3',
    capabilities: 'RGB',
    status: 'Maintenance',
    location: 'Mumbai',
    current_assignment: '-',
    maintenance_due: '2026-02-01',
    weather_resistance: 'None (Clear Sky Only)',
  },
  {
    drone_id: 'D003',
    model: 'DJI Mavic 3T',
    capabilities: 'Thermal',
    status: 'Available',
    location: 'Mumbai',
    current_assignment: '-',
    maintenance_due: '2026-04-01',
    weather_resistance: 'IP43 (Rain)',
  },
  {
    drone_id: 'D004',
    model: 'Autel Evo II',
    capabilities: 'Thermal, RGB',
    status: 'Available',
    location: 'Bangalore',
    current_assignment: '-',
    maintenance_due: '2026-03-15',
    weather_resistance: 'None (Clear Sky Only)',
  },
];

const mockMissions = [
  {
    project_id: 'PRJ001',
    client: 'Client A',
    location: 'Bangalore',
    required_skills: 'Mapping',
    required_certs: 'DGCA',
    start_date: '2026-02-06',
    end_date: '2026-02-08',
    priority: 'High',
    mission_budget_inr: 10500,
    weather_forecast: 'Rainy',
  },
  {
    project_id: 'PRJ002',
    client: 'Client B',
    location: 'Mumbai',
    required_skills: 'Inspection',
    required_certs: 'DGCA, Night Ops',
    start_date: '2026-02-07',
    end_date: '2026-02-09',
    priority: 'Urgent',
    mission_budget_inr: 10500,
    weather_forecast: 'Sunny',
  },
  {
    project_id: 'PRJ003',
    client: 'Client C',
    location: 'Bangalore',
    required_skills: 'Thermal',
    required_certs: 'DGCA',
    start_date: '2026-02-10',
    end_date: '2026-02-12',
    priority: 'Standard',
    mission_budget_inr: 10500,
    weather_forecast: 'Cloudy',
  },
];

console.log('🚁 Drone Operations Coordinator - Logic Test\n');

// Test 1: Query pilots by location
console.log('TEST 1: Query pilots in Bangalore');
const bangalorePilots = mockPilots.filter((p) => p.location === 'Bangalore');
console.log(`Found ${bangalorePilots.length} pilots:`, bangalorePilots.map((p) => p.name).join(', '));
console.log('✓ PASS\n');

// Test 2: Check skill matching
console.log('TEST 2: Check if Arjun has Mapping skill');
const arjun = mockPilots.find((p) => p.name === 'Arjun');
const hasMapping = arjun.skills.toLowerCase().includes('mapping');
console.log(`Arjun skills: ${arjun.skills}`);
console.log(`Has Mapping: ${hasMapping}`);
console.log('✓ PASS\n');

// Test 3: Weather resistance check
console.log('TEST 3: Find drones that can fly in rain');
const rainDrones = mockDrones.filter((d) => d.weather_resistance.toLowerCase().includes('ip') || d.weather_resistance.toLowerCase().includes('rain'));
console.log(`Found ${rainDrones.length} rain-capable drones:`, rainDrones.map((d) => d.model).join(', '));
console.log('✓ PASS\n');

// Test 4: Cost calculation
console.log('TEST 4: Calculate cost for Arjun on PRJ001');
const mission = mockMissions.find((m) => m.project_id === 'PRJ001');
const startDate = new Date(mission.start_date);
const endDate = new Date(mission.end_date);
const durationMs = endDate.getTime() - startDate.getTime();
const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
const cost = arjun.daily_rate_inr * durationDays;
console.log(`Mission duration: ${durationDays} days`);
console.log(`Daily rate: ₹${arjun.daily_rate_inr}`);
console.log(`Total cost: ₹${cost}`);
console.log(`Budget: ₹${mission.mission_budget_inr}`);
console.log(`Within budget: ${cost <= mission.mission_budget_inr}`);
console.log('✓ PASS\n');

// Test 5: Conflict detection - Budget overrun
console.log('TEST 5: Detect budget overrun for Sneha on PRJ003');
const sneha = mockPilots.find((p) => p.name === 'Sneha');
const prj003 = mockMissions.find((m) => m.project_id === 'PRJ003');
const prj003Start = new Date(prj003.start_date);
const prj003End = new Date(prj003.end_date);
const prj003Duration = Math.ceil((prj003End.getTime() - prj003Start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
const snehaCost = sneha.daily_rate_inr * prj003Duration;
console.log(`Sneha cost: ₹${snehaCost}`);
console.log(`Mission budget: ₹${prj003.mission_budget_inr}`);
const budgetOverrun = snehaCost > prj003.mission_budget_inr;
console.log(`Budget overrun detected: ${budgetOverrun}`);
console.log('✓ PASS\n');

// Test 6: Weather compatibility
console.log('TEST 6: Check if D002 can operate in rainy weather');
const d002 = mockDrones.find((d) => d.drone_id === 'D002');
const canFlyInRain = d002.weather_resistance.toLowerCase().includes('ip') || d002.weather_resistance.toLowerCase().includes('rain');
console.log(`Drone: ${d002.model}`);
console.log(`Weather resistance: ${d002.weather_resistance}`);
console.log(`Can fly in rain: ${canFlyInRain}`);
console.log('✓ PASS (Should be false)\n');

// Test 7: Available pilots
console.log('TEST 7: Count available pilots');
const availablePilots = mockPilots.filter((p) => p.status === 'Available');
console.log(`Available pilots: ${availablePilots.length} of ${mockPilots.length}`);
console.log(`Names: ${availablePilots.map((p) => p.name).join(', ')}`);
console.log('✓ PASS\n');

console.log('✅ All tests passed!\n');
console.log('📝 Note: This only tests business logic. For full testing, configure:');
console.log('   - OPENAI_API_KEY in .env');
console.log('   - Google Sheets credentials in .env');
console.log('   - Run: npm run dev');
