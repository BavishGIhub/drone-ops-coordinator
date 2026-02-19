# Decision Log

## 1. Key Assumptions

### Data Format
- **CSV Headers Match**: Assumed CSV column names in Google Sheets match exactly as specified in requirements
- **Date Format**: Assumed all dates are in ISO 8601 format (YYYY-MM-DD)
- **Comma-Separated Lists**: Skills, certifications, and capabilities stored as comma-separated strings
- **Currency**: All costs in Indian Rupees (INR)
- **Mission Duration**: Inclusive of both start and end dates (end_date - start_date + 1 day)

### Business Logic
- **Partial Skill Matching**: For non-urgent assignments, exact skill match required. For urgent, we allow partial matches with warnings
- **Location Flexibility**: Different locations emit warnings but don't block assignments (travel assumed possible)
- **Budget Overruns**: For urgent reassignments, budget overruns allowed but flagged prominently
- **Status Transitions**: When assigning, pilot status changes to "Assigned" and drone status to "Deployed"

### Google Sheets Structure
- **Sheet Name**: All data in "Sheet1" tab of each workbook
- **Header Row**: Row 1 contains headers, data starts from row 2
- **Three Separate Sheets**: Each entity type (pilots, drones, missions) in its own Google Sheet
- **Service Account Permissions**: Read and write access shared with service account

## 2. Trade-offs Chosen

### Framework: Next.js vs Alternatives

**Chosen**: Next.js 14 with App Router

**Alternatives Considered**:
- Express.js + React (separate frontend/backend)
- Django + React
- FastAPI + React

**Reasoning**:
- **Unified codebase**: Frontend and backend in one repository
- **Vercel deployment**: Seamless deployment with zero config
- **TypeScript support**: First-class TS support reduces bugs
- **API routes**: Built-in API routes eliminate need for separate server
- **Developer experience**: Hot reload, automatic code splitting

**Trade-off**: 
- Pro: Faster development, easier deployment
- Con: Less flexibility than microservices architecture

### AI: OpenAI Function Calling vs Custom NLP

**Chosen**: OpenAI GPT-4 with function calling

**Alternatives Considered**:
- Rule-based intent detection
- Custom NLP with spaCy/NLTK
- Langchain with custom tools
- Fine-tuned smaller model

**Reasoning**:
- **Natural conversation**: GPT-4 handles ambiguous queries gracefully
- **Function calling**: Native tool integration without complex prompting
- **Reliability**: Proven performance on complex queries
- **Maintenance**: No need to maintain NLP training data
- **Time to market**: Immediate functionality without training

**Trade-off**:
- Pro: Superior natural language understanding, no training needed
- Con: External API dependency, per-request costs, requires API key

### Sync: Synchronous vs Asynchronous Sheet Updates

**Chosen**: Synchronous updates to Google Sheets

**Alternatives Considered**:
- Message queue with background workers (Redis + Bull)
- Webhook-based bidirectional sync
- Local cache with periodic sync
- Event sourcing with audit log

**Reasoning**:
- **Simplicity**: No infrastructure for queues/workers
- **Consistency**: User sees immediate confirmation
- **Sheet as source**: Google Sheets is single source of truth
- **Low volume**: Expected update frequency doesn't require async
- **Error visibility**: Immediate feedback on sync failures

**Trade-off**:
- Pro: Simple, consistent, immediate feedback
- Con: Slower response times, no offline support, Sheet API rate limits

### Data Storage: Google Sheets vs Database

**Chosen**: Google Sheets as primary data store

**Alternatives Considered**:
- PostgreSQL with Supabase
- MongoDB Atlas
- Firebase Realtime Database
- Airtable

**Reasoning**:
- **Requirement**: Explicitly required in problem statement
- **Accessibility**: Non-technical users can view/edit data
- **No setup**: No database provisioning or migrations
- **Collaboration**: Built-in sharing and permissions
- **Export**: Easy CSV/Excel export for reporting

**Trade-off**:
- Pro: User-friendly, no infrastructure, built-in collaboration
- Con: Limited querying, no complex joins, API rate limits, slower than DB

## 3. Urgent Reassignment Interpretation

### Design Philosophy
When a pilot or drone becomes suddenly unavailable, the system prioritizes **operational continuity** over **cost optimization**.

### Key Decisions

1. **Feasibility First**
   - Hard constraints: certifications, weather compatibility (for drones)
   - Soft constraints: skills (can have gaps with warnings), budget, location
   - Reasoning: In emergencies, getting the mission done matters more than perfect match

2. **Scoring System**
   ```
   Base score from pilot/drone match algorithms
   + 30 points: Location match with mission
   + 15 points: Immediate availability
   + 10 points: Currently Available status
   + 5 points: Within budget
   - Deductions: Missing skills, certs, wrong location
   ```

3. **Top 3 Options**
   - Always present 3 alternatives if available
   - Allows human judgment on trade-offs
   - First option is recommended, but others provide fallbacks

4. **Warning System**
   - Budget overruns flagged but not blocking
   - Location mismatches noted
   - Skill gaps explicitly listed
   - Reasoning: Let operations team make informed decision

5. **Same-Location Preference**
   - Heavy weight (30 points) for same location
   - Minimizes response time for urgent situations
   - Reduces travel costs implicitly

### Example Flow
```
User: "Urgent: Arjun sick, reassign PRJ001"
↓
Agent identifies PRJ001 requirements
↓
Searches all pilots (including Assigned status)
↓
Scores each by feasibility (not just cost)
↓
Returns top 3 with warnings:
  Option 1: Best score, ready now, slight budget overrun ⚠️
  Option 2: Good score, different location ⚠️
  Option 3: Lower score, perfect match but assigned elsewhere ⚠️
```

## 4. What I'd Do Differently With More Time

### Real-time Sync with Webhooks
**Current**: Polling-based reads, synchronous writes
**Better**: 
- Google Sheets AppScript webhook on changes
- WebSocket connection to frontend
- Real-time updates across multiple users
- Benefits: Instant sync, collaborative editing, reduced API calls

### Historical Analytics
**Current**: Current state only
**Better**:
- Track all assignments over time
- Pilot utilization rates
- Drone uptime/downtime statistics
- Budget vs actual cost trending
- Benefits: Business insights, forecasting, performance reviews

### Advanced Conflict Resolution
**Current**: Detection only, manual resolution
**Better**:
- Automated conflict resolution suggestions
- "Swap" recommendations (move pilot from lower priority)
- Multi-objective optimization (cost + speed + quality)
- Benefits: Reduce coordinator workload, optimal resource allocation

### Mobile Application
**Current**: Web-only responsive design
**Better**:
- Native mobile app (React Native)
- Offline mode with sync
- Push notifications for urgent reassignments
- QR code scanning for drone checkout
- Benefits: Field accessibility, real-time updates for pilots

### Multi-tenant Support
**Current**: Single organization
**Better**:
- Multiple organizations with separate data
- Role-based access control (admin, coordinator, pilot, viewer)
- Organization-level settings
- Benefits: SaaS product, enterprise ready

### Enhanced Testing
**Current**: Manual testing
**Better**:
- Unit tests for all business logic modules
- Integration tests for API routes
- E2E tests with Playwright
- Mock Google Sheets API for CI/CD
- Benefits: Confidence in changes, faster development

### Caching Layer
**Current**: Direct Google Sheets API calls
**Better**:
- Redis cache for frequently accessed data
- Cache invalidation on writes
- Reduced Sheets API quota usage
- Benefits: Faster response times, scalability

### Audit Log
**Current**: No change tracking
**Better**:
- Immutable audit log of all changes
- Who changed what, when
- Revert capability
- Benefits: Compliance, debugging, accountability

### Natural Language Understanding Improvements
**Current**: Relies entirely on GPT-4
**Better**:
- Fine-tuned model on domain-specific conversations
- Structured output parsing
- Confidence scores for ambiguous queries
- Benefits: Lower cost per query, faster responses, better accuracy

### Weather API Integration
**Current**: Manual weather forecast entry
**Better**:
- Real-time weather API integration
- Automatic forecast updates
- Weather alerts for active missions
- Benefits: More accurate risk assessment, proactive warnings

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-19  
**Author**: Drone Operations Coordinator Team
