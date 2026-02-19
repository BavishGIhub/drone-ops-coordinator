import React from 'react';

interface Assignment {
  pilot?: {
    pilot_id: string;
    name: string;
    location: string;
  };
  drone?: {
    drone_id: string;
    model: string;
  };
  mission?: {
    project_id: string;
    client: string;
    location: string;
  };
  cost?: number;
  warnings?: string[];
}

interface AssignmentCardProps {
  assignment: Assignment;
  title?: string;
}

export default function AssignmentCard({ assignment, title }: AssignmentCardProps) {
  return (
    <div className="my-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assignment.pilot && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Pilot</div>
            <div className="text-sm font-medium">{assignment.pilot.name}</div>
            <div className="text-xs text-gray-600">{assignment.pilot.pilot_id}</div>
            <div className="text-xs text-gray-600">{assignment.pilot.location}</div>
          </div>
        )}

        {assignment.drone && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Drone</div>
            <div className="text-sm font-medium">{assignment.drone.model}</div>
            <div className="text-xs text-gray-600">{assignment.drone.drone_id}</div>
          </div>
        )}

        {assignment.mission && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Mission</div>
            <div className="text-sm font-medium">{assignment.mission.client}</div>
            <div className="text-xs text-gray-600">{assignment.mission.project_id}</div>
            <div className="text-xs text-gray-600">{assignment.mission.location}</div>
          </div>
        )}
      </div>

      {assignment.cost !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm font-medium">
            Total Cost: <span className="text-blue-600">₹{assignment.cost.toLocaleString()}</span>
          </div>
        </div>
      )}

      {assignment.warnings && assignment.warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-yellow-700 uppercase mb-1">⚠️ Warnings</div>
          <ul className="text-sm text-yellow-800 space-y-1">
            {assignment.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
