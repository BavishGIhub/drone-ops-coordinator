// Core data types for the drone operations system

export interface Pilot {
  pilot_id: string;
  name: string;
  skills: string; // Comma-separated
  certifications: string; // Comma-separated
  location: string;
  status: 'Available' | 'Assigned' | 'On Leave' | 'Unavailable';
  current_assignment: string;
  available_from: string; // ISO date
  daily_rate_inr: number;
}

export interface Drone {
  drone_id: string;
  model: string;
  capabilities: string; // Comma-separated
  status: 'Available' | 'Maintenance' | 'Deployed';
  location: string;
  current_assignment: string;
  maintenance_due: string; // ISO date
  weather_resistance: string; // e.g., "IP43 (Rain)" or "None (Clear Sky Only)"
}

export interface Mission {
  project_id: string;
  client: string;
  location: string;
  required_skills: string; // Comma-separated
  required_certs: string; // Comma-separated
  start_date: string; // ISO date
  end_date: string; // ISO date
  priority: 'High' | 'Urgent' | 'Standard';
  mission_budget_inr: number;
  weather_forecast: 'Sunny' | 'Cloudy' | 'Rainy';
}

export interface Assignment {
  pilot_id: string;
  drone_id: string;
  mission_id: string;
  assigned_date: string;
}

export interface Conflict {
  type: 'double-booking' | 'skill-mismatch' | 'cert-mismatch' | 'budget-overrun' | 'weather-risk' | 'location-mismatch';
  severity: 'high' | 'medium' | 'low';
  message: string;
  entity_id: string;
  mission_id?: string;
}

export interface ReassignmentOption {
  pilot?: Pilot;
  drone?: Drone;
  cost: number;
  feasibility_score: number;
  warnings: string[];
  reasons: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  tool_name: string;
  result: any;
}
