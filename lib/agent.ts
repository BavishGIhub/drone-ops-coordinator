import OpenAI from 'openai';
import { queryPilots, calculatePilotCost } from './roster';
import { queryDrones } from './drones';
import { queryMissions } from './missions';
import { matchPilotsToMission, matchDronesToMission, createAssignment } from './assignments';
import { detectConflicts } from './conflicts';
import { updatePilotStatus, updateDroneStatus } from './sheets';
import { urgentReassignment } from './urgent';

// Initialize OpenAI client lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Define tools for the AI agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_pilots',
      description: 'Query pilots by skill, certification, location, or availability status',
      parameters: {
        type: 'object',
        properties: {
          skill: {
            type: 'string',
            description: 'Filter by skill (e.g., "Mapping", "Inspection")',
          },
          certification: {
            type: 'string',
            description: 'Filter by certification (e.g., "DGCA", "Night Ops")',
          },
          location: {
            type: 'string',
            description: 'Filter by location (e.g., "Bangalore", "Mumbai")',
          },
          status: {
            type: 'string',
            description: 'Filter by status: "Available", "Assigned", "On Leave", "Unavailable"',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_drones',
      description: 'Query drones by capability, availability, location, or weather resistance',
      parameters: {
        type: 'object',
        properties: {
          capability: {
            type: 'string',
            description: 'Filter by capability (e.g., "LiDAR", "Thermal", "RGB")',
          },
          location: {
            type: 'string',
            description: 'Filter by location (e.g., "Bangalore", "Mumbai")',
          },
          status: {
            type: 'string',
            description: 'Filter by status: "Available", "Maintenance", "Deployed"',
          },
          weather_resistant: {
            type: 'boolean',
            description: 'Filter by weather resistance (true for rain-capable drones)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_missions',
      description: 'Query missions by client, location, priority, or date range',
      parameters: {
        type: 'object',
        properties: {
          client: {
            type: 'string',
            description: 'Filter by client name',
          },
          location: {
            type: 'string',
            description: 'Filter by mission location',
          },
          priority: {
            type: 'string',
            description: 'Filter by priority: "High", "Urgent", "Standard"',
          },
          start_date: {
            type: 'string',
            description: 'Filter missions starting on or after this date (ISO format)',
          },
          end_date: {
            type: 'string',
            description: 'Filter missions ending on or before this date (ISO format)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_pilot_cost',
      description: 'Calculate total cost for a pilot on a mission based on daily rate and mission duration',
      parameters: {
        type: 'object',
        properties: {
          pilot_id: {
            type: 'string',
            description: 'Pilot ID (e.g., "P001")',
          },
          mission_id: {
            type: 'string',
            description: 'Mission/Project ID (e.g., "PRJ001")',
          },
        },
        required: ['pilot_id', 'mission_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'match_pilot_to_mission',
      description: 'Find best matching pilots for a mission based on skills, certifications, location, and availability',
      parameters: {
        type: 'object',
        properties: {
          mission_id: {
            type: 'string',
            description: 'Mission/Project ID (e.g., "PRJ001")',
          },
          urgent: {
            type: 'boolean',
            description: 'Set to true for urgent reassignments that prioritize speed over cost',
          },
        },
        required: ['mission_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'match_drone_to_mission',
      description: 'Find best matching drones for a mission based on capabilities, weather resistance, and location',
      parameters: {
        type: 'object',
        properties: {
          mission_id: {
            type: 'string',
            description: 'Mission/Project ID (e.g., "PRJ001")',
          },
        },
        required: ['mission_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_conflicts',
      description: 'Detect conflicts like double-booking, skill mismatch, budget overrun, weather risk, or location mismatch',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for conflict detection (ISO format)',
          },
          end_date: {
            type: 'string',
            description: 'End date for conflict detection (ISO format)',
          },
          pilot_id: {
            type: 'string',
            description: 'Check conflicts for specific pilot',
          },
          drone_id: {
            type: 'string',
            description: 'Check conflicts for specific drone',
          },
          mission_id: {
            type: 'string',
            description: 'Check conflicts for specific mission',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_pilot_status',
      description: 'Update a pilot\'s status and sync to Google Sheet',
      parameters: {
        type: 'object',
        properties: {
          pilot_id: {
            type: 'string',
            description: 'Pilot ID (e.g., "P001")',
          },
          new_status: {
            type: 'string',
            enum: ['Available', 'On Leave', 'Unavailable', 'Assigned'],
            description: 'New status for the pilot',
          },
        },
        required: ['pilot_id', 'new_status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_drone_status',
      description: 'Update a drone\'s status and sync to Google Sheet',
      parameters: {
        type: 'object',
        properties: {
          drone_id: {
            type: 'string',
            description: 'Drone ID (e.g., "D001")',
          },
          new_status: {
            type: 'string',
            enum: ['Available', 'Maintenance', 'Deployed'],
            description: 'New status for the drone',
          },
        },
        required: ['drone_id', 'new_status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_assignment',
      description: 'Assign a pilot and drone to a mission',
      parameters: {
        type: 'object',
        properties: {
          pilot_id: {
            type: 'string',
            description: 'Pilot ID (e.g., "P001")',
          },
          drone_id: {
            type: 'string',
            description: 'Drone ID (e.g., "D001")',
          },
          mission_id: {
            type: 'string',
            description: 'Mission/Project ID (e.g., "PRJ001")',
          },
        },
        required: ['pilot_id', 'drone_id', 'mission_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'urgent_reassignment',
      description: 'Handle urgent reassignment when pilot or drone becomes unavailable. Returns top 3 ranked options.',
      parameters: {
        type: 'object',
        properties: {
          mission_id: {
            type: 'string',
            description: 'Mission/Project ID that needs reassignment (e.g., "PRJ001")',
          },
          reason: {
            type: 'string',
            description: 'Reason for urgent reassignment (e.g., "Pilot called in sick", "Drone malfunction")',
          },
        },
        required: ['mission_id', 'reason'],
      },
    },
  },
];

// Execute tool calls
async function executeToolCall(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  // Type guard to ensure we have a function tool call
  if (toolCall.type !== 'function') {
    return { error: 'Invalid tool call type' };
  }

  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`Executing tool: ${functionName}`, args);

  try {
    switch (functionName) {
      case 'query_pilots':
        return await queryPilots(args);

      case 'query_drones':
        return await queryDrones(args);

      case 'query_missions':
        return await queryMissions(args);

      case 'calculate_pilot_cost':
        return await calculatePilotCost(args.pilot_id, args.mission_id);

      case 'match_pilot_to_mission':
        return await matchPilotsToMission(args.mission_id, args.urgent || false);

      case 'match_drone_to_mission':
        return await matchDronesToMission(args.mission_id);

      case 'detect_conflicts':
        return await detectConflicts(args);

      case 'update_pilot_status':
        await updatePilotStatus(args.pilot_id, args.new_status);
        return { success: true, message: `Pilot ${args.pilot_id} status updated to ${args.new_status}` };

      case 'update_drone_status':
        await updateDroneStatus(args.drone_id, args.new_status);
        return { success: true, message: `Drone ${args.drone_id} status updated to ${args.new_status}` };

      case 'create_assignment':
        return await createAssignment(args.pilot_id, args.drone_id, args.mission_id);

      case 'urgent_reassignment':
        return await urgentReassignment(args.mission_id, args.reason);

      default:
        return { error: `Unknown tool: ${functionName}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${functionName}:`, error);
    return { error: error.message || 'Unknown error occurred' };
  }
}

// Main agent function
export async function runAgent(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  const openai = getOpenAIClient();
  
  const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: 'system',
    content: `You are a professional drone operations coordinator for Skylark Drones. You help manage:
- Pilot roster and availability
- Drone fleet inventory and capabilities
- Mission assignments and scheduling
- Conflict detection and resolution
- Urgent reassignments

When users ask questions or request actions:
1. Use the provided tools to query data and perform operations
2. Provide clear, concise responses with relevant details
3. Alert users to conflicts or warnings
4. For urgent situations, prioritize speed and feasibility
5. Always sync status updates to Google Sheets

Be professional, efficient, and proactive in identifying potential issues.`,
  };

  const allMessages = [systemMessage, ...messages];

  let response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: allMessages,
    tools,
    tool_choice: 'auto',
  });

  let iterations = 0;
  const maxIterations = 10;

  // Handle tool calls in a loop
  while (response.choices[0].message.tool_calls && iterations < maxIterations) {
    const toolCalls = response.choices[0].message.tool_calls;

    // Add assistant's message with tool calls
    allMessages.push(response.choices[0].message);

    // Execute all tool calls
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await executeToolCall(toolCall);
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        };
      })
    );

    // Add tool results to messages
    allMessages.push(...toolResults);

    // Get next response
    response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: allMessages,
      tools,
      tool_choice: 'auto',
    });

    iterations++;
  }

  return response.choices[0].message;
}
