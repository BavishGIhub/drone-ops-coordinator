import { NextRequest, NextResponse } from 'next/server';
import { readPilots, readDrones, readMissions, updatePilotStatus, updateDroneStatus } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'pilots':
        const pilots = await readPilots();
        return NextResponse.json({ data: pilots });

      case 'drones':
        const drones = await readDrones();
        return NextResponse.json({ data: drones });

      case 'missions':
        const missions = await readMissions();
        return NextResponse.json({ data: missions });

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: pilots, drones, or missions' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Sheets API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, id, status } = body;

    if (action === 'update_status') {
      if (type === 'pilot') {
        await updatePilotStatus(id, status);
        return NextResponse.json({ success: true, message: `Pilot ${id} status updated` });
      } else if (type === 'drone') {
        await updateDroneStatus(id, status);
        return NextResponse.json({ success: true, message: `Drone ${id} status updated` });
      }
    }

    return NextResponse.json({ error: 'Invalid action or type' }, { status: 400 });
  } catch (error: any) {
    console.error('Sheets API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
