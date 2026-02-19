import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { queryPilots, calculatePilotCost } from './roster';
import { queryDrones } from './drones';
import { queryMissions } from './missions';
import { matchPilotsToMission, matchDronesToMission, createAssignment } from './assignments';
import { detectConflicts } from './conflicts';
import { updatePilotStatus, updateDroneStatus } from './sheets';
import { urgentReassignment } from './urgent';

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

const functionDeclarations = [
  {
    name: 'query_pilots',
    description: 'Query pilots by skill, certification, location, or availability status',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        skill: { type: SchemaType.STRING, description: 'Filter by skill' },
        certification: { type: SchemaType.STRING, description: 'Filter by certification' },
        location: { type: SchemaType.STRING, description: 'Filter by location' },
        status: { type: SchemaType.STRING, description: 'Filter by status' },
      },
    },
  },
  {
    name: 'query_drones',
    description: 'Query drones by capability, availability, location, or weather resistance',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        capability: { type: SchemaType.STRING, description: 'Filter by capability' },
        location: { type: SchemaType.STRING, description: 'Filter by location' },
        status: { type: SchemaType.STRING, description: 'Filter by status' },
        weather_resistant: { type: SchemaType.BOOLEAN, description: 'Filter by weather resistance' },
      },
    },
  },
  {
    name: 'query_missions',
    description: 'Query missions by client, location, priority',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        client: { type: SchemaType.STRING, description: 'Filter by client name' },
        location: { type: SchemaType.STRING, description: 'Filter by mission location' },
        priority: { type: SchemaType.STRING, description: 'Filter by priority' },
      },
    },
  },
];

async function executeToolCall(name: string, args: Record<string, unknown>) {
  console.log('Executing tool:', name, args);
  try {
    switch (name) {
      case 'query_pilots':
        return await queryPilots(args);
      case 'query_drones':
        return await queryDrones(args);
      case 'query_missions':
        return await queryMissions(args);
      case 'calculate_pilot_cost':
        return await calculatePilotCost(args.pilot_id as string, args.mission_id as string);
      case 'match_pilot_to_mission':
        return await matchPilotsToMission(args.mission_id as string, (args.urgent as boolean) || false);
      case 'match_drone_to_mission':
        return await matchDronesToMission(args.mission_id as string);
      case 'detect_conflicts':
        return await detectConflicts(args);
      case 'update_pilot_status':
        await updatePilotStatus(args.pilot_id as string, args.new_status as string);
        return { success: true, message: 'Pilot status updated' };
      case 'update_drone_status':
        await updateDroneStatus(args.drone_id as string, args.new_status as string);
        return { success: true, message: 'Drone status updated' };
      case 'create_assignment':
        return await createAssignment(args.pilot_id as string, args.drone_id as string, args.mission_id as string);
      case 'urgent_reassignment':
        return await urgentReassignment(args.mission_id as string, args.reason as string);
      default:
        return { error: 'Unknown tool' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error executing tool:', error);
    return { error: errorMessage };
  }
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function runAgent(messages: ChatMessage[]) {
  const genAI = getGeminiClient();
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
    tools: [{ functionDeclarations }],
    systemInstruction: 'You are a professional drone operations coordinator for Skylark Drones. Help manage pilots, drones, and missions. Be friendly and helpful. When someone greets you, respond warmly and explain what you can help with.',
  });

  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  
  let result = await chat.sendMessage(lastMessage.content);
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    const response = result.response;
    const candidate = response.candidates?.[0];
    
    if (!candidate?.content?.parts) break;

    const functionCalls = candidate.content.parts.filter(
      (part: any) => part.functionCall
    );

    if (functionCalls.length === 0) break;

    const functionResponses = await Promise.all(
      functionCalls.map(async (part: any) => {
        const { name, args } = part.functionCall;
        const output = await executeToolCall(name, args);
        return {
          functionResponse: {
            name,
            response: output,
          },
        };
      })
    );

    result = await chat.sendMessage(functionResponses);
    iterations++;
  }

  const finalResponse = result.response;
  const textPart = finalResponse.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.text
  );

  return {
    role: 'assistant' as const,
    content: textPart?.text || 'I apologize, but I was unable to generate a response. Please try again.',
  };
}