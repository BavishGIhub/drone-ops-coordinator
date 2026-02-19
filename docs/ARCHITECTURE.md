# Architecture Documentation

## System Overview

The Drone Operations Coordinator is a full-stack AI-powered application built with Next.js 14, TypeScript, and OpenAI GPT-4. It manages drone fleet operations with real-time synchronization to Google Sheets.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App Router (React 19)                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │  page.tsx    │  │ Components    │  │  Tailwind CSS       │  │  │
│  │  │  (Chat UI)   │  │ - ChatMessage │  │  - Responsive       │  │  │
│  │  │              │  │ - ChatInput   │  │  - Theme system     │  │  │
│  │  │              │  │ - DataTable   │  │                     │  │  │
│  │  │              │  │ - Conflicts   │  │                     │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └─────────────────────────┬────────────────────────────────────────│  │
│                            │ HTTP/REST                               │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────┐
│                     API ROUTES LAYER                                  │
│  ┌─────────────────────────┼────────────────────────────────────┐   │
│  │                         │                                     │   │
│  │  ┌──────────────────────▼──────────┐  ┌──────────────────┐  │   │
│  │  │  /api/chat/route.ts             │  │  /api/sheets/    │  │   │
│  │  │  - Receives messages            │  │  route.ts        │  │   │
│  │  │  - Calls AI agent               │  │  - Direct reads  │  │   │
│  │  │  - Returns responses            │  │  - Testing       │  │   │
│  │  └──────────────────┬──────────────┘  └──────────────────┘  │   │
│  └────────────────────┼─────────────────────────────────────────┘   │
│                       │                                              │
└───────────────────────┼──────────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────────┐
│                      AI AGENT LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  agent.ts - OpenAI GPT-4 Function Calling                     │   │
│  │  ┌──────────────────────────────────────────────────────────┐│   │
│  │  │  11 Tools/Functions Available:                           ││   │
│  │  │  1. query_pilots        7. detect_conflicts             ││   │
│  │  │  2. query_drones        8. update_pilot_status          ││   │
│  │  │  3. query_missions      9. update_drone_status          ││   │
│  │  │  4. calculate_cost      10. create_assignment           ││   │
│  │  │  5. match_pilot         11. urgent_reassignment         ││   │
│  │  │  6. match_drone                                          ││   │
│  │  └──────────────────────────────────────────────────────────┘│   │
│  └────────────┬──────────────┬──────────────┬───────────────────┘   │
│               │              │              │                        │
└───────────────┼──────────────┼──────────────┼────────────────────────┘
                │              │              │
┌───────────────▼──────────────▼──────────────▼────────────────────────┐
│                    BUSINESS LOGIC LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  roster.ts   │  │  drones.ts   │  │  missions.ts             │   │
│  │              │  │              │  │                          │   │
│  │ • Query      │  │ • Query      │  │ • Query                  │   │
│  │ • Calculate  │  │ • Weather    │  │ • Duration               │   │
│  │ • Skills     │  │ • Maint.     │  │ • Overlap                │   │
│  │ • Certs      │  │ • Available  │  │                          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │assignments.ts│  │ conflicts.ts │  │  urgent.ts               │   │
│  │              │  │              │  │                          │   │
│  │ • Match      │  │ • Detect 5   │  │ • Fast matching          │   │
│  │ • Score      │  │   types      │  │ • Top 3 options          │   │
│  │ • Create     │  │ • Severity   │  │ • Warnings               │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                            ▲                                          │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────────┐
│                      DATA ACCESS LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  sheets.ts - Google Sheets API Integration                    │    │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐    │    │
│  │  │  Read Operations │  │  Write Operations              │    │    │
│  │  │  • readPilots()  │  │  • updatePilotStatus()         │    │    │
│  │  │  • readDrones()  │  │  • updateDroneStatus()         │    │    │
│  │  │  • readMissions()│  │  • updateAssignment()          │    │    │
│  │  └──────────────────┘  └────────────────────────────────┘    │    │
│  │                              │                                 │    │
│  │  Authentication: Google Service Account JWT                   │    │
│  └──────────────────────────────┬─────────────────────────────────┘    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                    EXTERNAL SERVICES                                  │
│                                                                       │
│  ┌──────────────────────┐        ┌─────────────────────────────┐    │
│  │  Google Sheets API   │        │  OpenAI API (GPT-4)         │    │
│  │                      │        │                             │    │
│  │  3 Separate Sheets:  │        │  • Chat completions         │    │
│  │  • Pilot Roster      │        │  • Function calling         │    │
│  │  • Drone Fleet       │        │  • Natural language         │    │
│  │  • Missions          │        │                             │    │
│  └──────────────────────┘        └─────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client Layer (Frontend)

**Technology**: Next.js 14 App Router, React 19, Tailwind CSS

**Key Components**:
- `app/page.tsx`: Main chat interface with message history
- `components/ChatMessage.tsx`: Message bubble component
- `components/ChatInput.tsx`: User input with send button
- `components/DataTable.tsx`: Tabular data display
- `components/ConflictAlert.tsx`: Conflict warnings
- `components/AssignmentCard.tsx`: Assignment details card

**Responsibilities**:
- Render chat interface
- Handle user input
- Display AI responses
- Show structured data (tables, alerts, cards)
- Manage client-side state

### 2. API Routes Layer

**Technology**: Next.js API Routes (App Router)

**Endpoints**:

#### `/api/chat/route.ts` (POST)
- **Purpose**: Main chat endpoint
- **Input**: Array of messages
- **Process**: Calls AI agent, handles tool execution
- **Output**: AI response

#### `/api/sheets/route.ts` (GET, POST)
- **Purpose**: Direct sheet operations for testing
- **GET**: Retrieve pilots/drones/missions
- **POST**: Update status directly

**Responsibilities**:
- Request validation
- Error handling
- Response formatting
- CORS handling (if needed)

### 3. AI Agent Layer

**Technology**: OpenAI GPT-4 with function calling

**File**: `lib/agent.ts`

**Process Flow**:
1. Receive user message
2. Send to OpenAI with tool definitions
3. Execute tool calls
4. Return results to OpenAI
5. Get final response
6. Return to user

**Tools** (11 total):
- Data queries (pilots, drones, missions)
- Cost calculation
- Matching algorithms
- Conflict detection
- Status updates
- Assignment creation
- Urgent reassignment

**Responsibilities**:
- Natural language understanding
- Tool selection
- Conversation management
- Context maintenance

### 4. Business Logic Layer

**Technology**: TypeScript modules

**Modules**:

#### `roster.ts` - Pilot Management
- Query with filters
- Cost calculation
- Availability checking
- Skill/certification validation

#### `drones.ts` - Drone Management
- Query with filters
- Weather compatibility
- Maintenance status
- Availability checking

#### `missions.ts` - Mission Management
- Query with filters
- Duration calculation
- Date overlap detection
- Priority filtering

#### `assignments.ts` - Assignment Logic
- Pilot-to-mission matching with scoring
- Drone-to-mission matching with scoring
- Assignment creation
- Active assignment tracking

#### `conflicts.ts` - Conflict Detection
- Double-booking detection
- Skill/cert mismatch detection
- Budget overrun detection
- Weather risk detection
- Location mismatch detection

#### `urgent.ts` - Urgent Reassignment
- Fast-track matching
- Top 3 ranked options
- Warning generation
- Feasibility scoring

**Responsibilities**:
- Core business logic
- Domain rules enforcement
- Data validation
- Algorithm implementation

### 5. Data Access Layer

**Technology**: Google Sheets API (googleapis npm package)

**File**: `lib/sheets.ts`

**Authentication**: Service Account JWT

**Operations**:

**Read**:
- `readPilots()`: Fetch all pilots
- `readDrones()`: Fetch all drones
- `readMissions()`: Fetch all missions

**Write**:
- `updatePilotStatus()`: Update pilot status
- `updateDroneStatus()`: Update drone status
- `updateAssignment()`: Update assignment field

**Responsibilities**:
- Google Sheets API communication
- Authentication management
- Data transformation (rows → objects)
- Error handling
- Rate limit management

### 6. External Services

#### Google Sheets API
- **Purpose**: Data storage and retrieval
- **Authentication**: Service Account
- **Rate Limits**: 100 requests per 100 seconds per user
- **Sheets**: 3 separate workbooks

#### OpenAI API
- **Model**: GPT-4
- **Features**: Function calling
- **Rate Limits**: Varies by tier
- **Cost**: Per token pricing

## Data Flow

### Query Flow (Read)
```
User input → Chat API → Agent → Tool execution → Business logic → Data access → Google Sheets
                ↓                                                                      ↓
User response ← Chat API ← Agent ← Tool result ← Business logic ← Data access ← Response
```

### Update Flow (Write)
```
User command → Chat API → Agent → Tool execution → Business logic → Data access
                                                                         ↓
                                                                   Google Sheets
                                                                   (status updated)
                                                                         ↓
User confirmation ← Chat API ← Agent ← Tool result ← Business logic ← Success
```

### Assignment Flow
```
User request → Agent → match_pilot_to_mission + match_drone_to_mission
                           ↓
                      Score & rank matches
                           ↓
                      User confirms
                           ↓
                      create_assignment
                           ↓
                      Update pilot status → Sheets
                      Update drone status → Sheets
                      Update assignments → Sheets
```

## Security Considerations

1. **API Keys**: Stored in environment variables, never in code
2. **Service Account**: Limited permissions (Sheets API only)
3. **Rate Limiting**: Implement client-side throttling
4. **Input Validation**: Sanitize all user inputs
5. **CORS**: Configure for production domain
6. **Environment Separation**: Different keys for dev/prod

## Scalability Considerations

### Current Limits
- Google Sheets: 5M cells per sheet, 100 req/100s
- OpenAI: Model-dependent rate limits
- Vercel: Function timeout 10s (hobby), 60s (pro)

### Scaling Strategies
1. **Caching**: Add Redis for frequently accessed data
2. **Background Jobs**: Queue long-running operations
3. **Database Migration**: Move to PostgreSQL for high volume
4. **CDN**: Cache static assets
5. **Horizontal Scaling**: Vercel auto-scales

## Deployment Architecture

```
GitHub Repo → Vercel
               ↓
        ┌──────┴──────┐
        │   Edge CDN   │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Serverless  │
        │  Functions   │
        └──────┬──────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
Google Sheets         OpenAI API
```

## Monitoring & Observability

### Current
- Console logs
- Vercel dashboard
- Error tracking via try-catch

### Recommended Additions
- Sentry for error tracking
- Vercel Analytics
- Custom metrics (assignment rate, conflict detection rate)
- OpenAI usage tracking

## Type System

**File**: `lib/types.ts`

**Core Types**:
- `Pilot`: Pilot entity
- `Drone`: Drone entity
- `Mission`: Mission entity
- `Assignment`: Assignment relationship
- `Conflict`: Conflict information
- `ReassignmentOption`: Urgent reassignment option

Benefits:
- Compile-time type checking
- IntelliSense support
- Self-documenting code
- Reduced runtime errors

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-19
