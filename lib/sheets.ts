import { google } from 'googleapis';
import { Pilot, Drone, Mission } from './types';

// Initialize Google Sheets API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Sheet IDs from environment variables
const SHEET_ID_PILOTS = process.env.GOOGLE_SHEET_ID_PILOTS || '';
const SHEET_ID_DRONES = process.env.GOOGLE_SHEET_ID_DRONES || '';
const SHEET_ID_MISSIONS = process.env.GOOGLE_SHEET_ID_MISSIONS || '';

/**
 * Read pilots from Google Sheet
 */
export async function readPilots(): Promise<Pilot[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID_PILOTS,
      range: 'Sheet1!A2:I', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      pilot_id: row[0] || '',
      name: row[1] || '',
      skills: row[2] || '',
      certifications: row[3] || '',
      location: row[4] || '',
      status: (row[5] || 'Available') as Pilot['status'],
      current_assignment: row[6] || '-',
      available_from: row[7] || '',
      daily_rate_inr: parseFloat(row[8]) || 0,
    }));
  } catch (error) {
    console.error('Error reading pilots:', error);
    return [];
  }
}

/**
 * Read drones from Google Sheet
 */
export async function readDrones(): Promise<Drone[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID_DRONES,
      range: 'Sheet1!A2:H', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      drone_id: row[0] || '',
      model: row[1] || '',
      capabilities: row[2] || '',
      status: (row[3] || 'Available') as Drone['status'],
      location: row[4] || '',
      current_assignment: row[5] || '-',
      maintenance_due: row[6] || '',
      weather_resistance: row[7] || '',
    }));
  } catch (error) {
    console.error('Error reading drones:', error);
    return [];
  }
}

/**
 * Read missions from Google Sheet
 */
export async function readMissions(): Promise<Mission[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID_MISSIONS,
      range: 'Sheet1!A2:J', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      project_id: row[0] || '',
      client: row[1] || '',
      location: row[2] || '',
      required_skills: row[3] || '',
      required_certs: row[4] || '',
      start_date: row[5] || '',
      end_date: row[6] || '',
      priority: (row[7] || 'Standard') as Mission['priority'],
      mission_budget_inr: parseFloat(row[8]) || 0,
      weather_forecast: (row[9] || 'Sunny') as Mission['weather_forecast'],
    }));
  } catch (error) {
    console.error('Error reading missions:', error);
    return [];
  }
}

/**
 * Update pilot status in Google Sheet
 */
export async function updatePilotStatus(
  pilotId: string,
  newStatus: string
): Promise<void> {
  try {
    const pilots = await readPilots();
    const pilotIndex = pilots.findIndex((p) => p.pilot_id === pilotId);

    if (pilotIndex === -1) {
      throw new Error(`Pilot ${pilotId} not found`);
    }

    // Update the status column (F, which is column index 5, row is pilotIndex + 2 because of header)
    const rowNumber = pilotIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID_PILOTS,
      range: `Sheet1!F${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newStatus]],
      },
    });
  } catch (error) {
    console.error('Error updating pilot status:', error);
    throw error;
  }
}

/**
 * Update drone status in Google Sheet
 */
export async function updateDroneStatus(
  droneId: string,
  newStatus: string
): Promise<void> {
  try {
    const drones = await readDrones();
    const droneIndex = drones.findIndex((d) => d.drone_id === droneId);

    if (droneIndex === -1) {
      throw new Error(`Drone ${droneId} not found`);
    }

    // Update the status column (D, which is column index 3, row is droneIndex + 2)
    const rowNumber = droneIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID_DRONES,
      range: `Sheet1!D${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newStatus]],
      },
    });
  } catch (error) {
    console.error('Error updating drone status:', error);
    throw error;
  }
}

/**
 * Update assignment for pilot or drone
 */
export async function updateAssignment(
  sheetType: 'pilot' | 'drone',
  id: string,
  assignment: string
): Promise<void> {
  try {
    if (sheetType === 'pilot') {
      const pilots = await readPilots();
      const pilotIndex = pilots.findIndex((p) => p.pilot_id === id);

      if (pilotIndex === -1) {
        throw new Error(`Pilot ${id} not found`);
      }

      const rowNumber = pilotIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID_PILOTS,
        range: `Sheet1!G${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[assignment]],
        },
      });

      // Also update status to Assigned if assignment is not empty
      if (assignment && assignment !== '-') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID_PILOTS,
          range: `Sheet1!F${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Assigned']],
          },
        });
      }
    } else {
      const drones = await readDrones();
      const droneIndex = drones.findIndex((d) => d.drone_id === id);

      if (droneIndex === -1) {
        throw new Error(`Drone ${id} not found`);
      }

      const rowNumber = droneIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID_DRONES,
        range: `Sheet1!F${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[assignment]],
        },
      });

      // Also update status to Deployed if assignment is not empty
      if (assignment && assignment !== '-') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID_DRONES,
          range: `Sheet1!D${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Deployed']],
          },
        });
      }
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
}
