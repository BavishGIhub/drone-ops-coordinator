# Drone Operations Coordinator AI Agent

AI-powered agent for managing drone fleet operations, pilot assignments, and conflict detection with Google Sheets 2-way sync.

## 🚀 Features

- **Pilot Roster Management**: Query pilots by skill, certification, location, and availability
- **Drone Fleet Inventory**: Track drone capabilities, weather resistance, and maintenance status
- **Mission Assignment**: Match pilots and drones to missions based on requirements
- **Conflict Detection**: Identify double-bookings, skill mismatches, budget overruns, weather risks
- **Urgent Reassignments**: Fast-track replacements when pilots/drones become unavailable
- **Google Sheets Sync**: Real-time 2-way synchronization with 3 separate sheets
- **Chat Interface**: Natural language interaction powered by OpenAI GPT-4

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                    (Next.js Chat Interface)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes Layer                            │
│              /api/chat          /api/sheets                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI Agent (OpenAI GPT-4)                      │
│                    with Function Calling                         │
└─────┬───────┬────────┬──────────┬─────────┬─────────┬──────────┘
      │       │        │          │         │         │
      ▼       ▼        ▼          ▼         ▼         ▼
   roster  drones  missions  assignments conflicts urgent
    .ts     .ts      .ts        .ts        .ts      .ts
      │       │        │          │         │         │
      └───────┴────────┴──────────┴─────────┴─────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Google Sheets API │
              │   (3 Separate Sheets)│
              └─────────────────────┘
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4 with function calling
- **Database**: Google Sheets (3 separate sheets)
- **UI**: React + Tailwind CSS
- **Deployment**: Vercel

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Cloud Service Account with Sheets API access
- Access to 3 Google Sheets (pilots, drones, missions)

### 1. Clone the Repository

```bash
git clone https://github.com/BavishGIhub/drone-ops-coordinator.git
cd drone-ops-coordinator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=sk-your-openai-api-key

GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GOOGLE_SHEET_ID_PILOTS=1TGQEQVwqe4AuNbCwuDAz8fJIU-siQOz6TxfOwEBIe2k
GOOGLE_SHEET_ID_DRONES=14FZaCojfj8t-c96h0xXMrfsS17OavXJzj98-R2omajg
GOOGLE_SHEET_ID_MISSIONS=1LjnbDMiaY5PyqYtghXGvUgohgLCZAIu_mUs6a4AqMNg
```

### 4. Google Sheets Setup

#### Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name and click "Create"
   - Skip role assignment (click Continue)
   - Click "Done"
5. Generate a key:
   - Click on the service account
   - Go to "Keys" tab
   - Add Key > Create New Key > JSON
   - Download the JSON file
6. Extract credentials from JSON:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep the `\n` characters)

#### Prepare Google Sheets

You need 3 separate Google Sheets with the following structure:

**pilot_roster Sheet**
```
pilot_id | name | skills | certifications | location | status | current_assignment | available_from | daily_rate_inr
```

**drone_fleet Sheet**
```
drone_id | model | capabilities | status | location | current_assignment | maintenance_due | weather_resistance
```

**missions Sheet**
```
project_id | client | location | required_skills | required_certs | start_date | end_date | priority | mission_budget_inr | weather_forecast
```

For each sheet:
1. Share the sheet with your service account email (the `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
2. Give it "Editor" permissions
3. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Examples

### Example Conversations

1. **Query Pilots**
   ```
   User: Show me available pilots in Bangalore with Mapping skills
   AI: [Returns filtered list of pilots]
   ```

2. **Check Weather Compatibility**
   ```
   User: Which drones can fly in rainy weather?
   AI: [Returns drones with IP43 rating]
   ```

3. **Assign Resources**
   ```
   User: Assign the best pilot and drone to PRJ001
   AI: [Analyzes requirements, suggests matches, creates assignment]
   ```

4. **Cost Calculation**
   ```
   User: What's the total cost for Arjun on PRJ002?
   AI: [Calculates: daily_rate × mission_duration]
   ```

5. **Status Update (Syncs to Google Sheets)**
   ```
   User: Mark Sneha as Available
   AI: [Updates Google Sheet and confirms]
   ```

6. **Conflict Detection**
   ```
   User: What conflicts exist for next week?
   AI: [Scans for double-bookings, skill mismatches, budget issues, etc.]
   ```

7. **Urgent Reassignment**
   ```
   User: Urgent: Arjun called in sick, need to reassign PRJ001 ASAP
   AI: [Returns top 3 ranked replacement options with warnings]
   ```

8. **Capability Check**
   ```
   User: Can P003 handle PRJ002?
   AI: [Checks skills/certs and warns if missing Night Ops certification]
   ```

## 🎯 AI Agent Tools

The agent has access to 11 specialized tools:

1. **query_pilots** - Filter pilots by skill, cert, location, status
2. **query_drones** - Filter drones by capability, location, weather resistance
3. **query_missions** - Filter missions by client, location, priority, dates
4. **calculate_pilot_cost** - Calculate total cost for pilot on mission
5. **match_pilot_to_mission** - Find best pilot matches with scoring
6. **match_drone_to_mission** - Find best drone matches with scoring
7. **detect_conflicts** - Identify all conflict types
8. **update_pilot_status** - Update pilot status (syncs to Sheets)
9. **update_drone_status** - Update drone status (syncs to Sheets)
10. **create_assignment** - Assign pilot + drone to mission
11. **urgent_reassignment** - Handle urgent replacements

## 🔍 Conflict Detection

The system detects 5 types of conflicts:

- **Double-booking**: Pilot/drone assigned to overlapping dates
- **Skill mismatch**: Pilot lacks required skills
- **Cert mismatch**: Pilot lacks required certifications
- **Budget overrun**: Pilot cost exceeds mission budget
- **Weather risk**: Non-waterproof drone assigned to rainy mission
- **Location mismatch**: Pilot/drone in different location than mission

## ⚡ Urgent Reassignment Logic

When handling urgent situations:

1. **Prioritizes feasibility over cost** - Any pilot meeting hard constraints considered
2. **Same-location preference** - Minimizes travel delay
3. **Returns top 3 ranked options** - With scores, costs, warnings
4. **Emits warnings instead of blocking** - Budget overruns allowed with warning
5. **Considers partially-matched pilots** - Even if some requirements not met

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Deploy via GitHub

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel project settings
5. Deploy

### Environment Variables in Vercel

In your Vercel project settings, add all variables from `.env`:

- `OPENAI_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID_PILOTS`
- `GOOGLE_SHEET_ID_DRONES`
- `GOOGLE_SHEET_ID_MISSIONS`

## 📁 Project Structure

```
/
├── app/
│   ├── page.tsx              # Main chat interface
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind styles
│   └── api/
│       ├── chat/
│       │   └── route.ts      # Chat API endpoint
│       └── sheets/
│           └── route.ts      # Sheet operations
├── components/
│   ├── ChatMessage.tsx       # Message bubble component
│   ├── ChatInput.tsx         # Input field component
│   ├── DataTable.tsx         # Table display component
│   ├── ConflictAlert.tsx     # Conflict alert component
│   └── AssignmentCard.tsx    # Assignment card component
├── lib/
│   ├── agent.ts              # AI agent with tools
│   ├── sheets.ts             # Google Sheets integration
│   ├── roster.ts             # Pilot management
│   ├── drones.ts             # Drone management
│   ├── missions.ts           # Mission management
│   ├── assignments.ts        # Assignment logic
│   ├── conflicts.ts          # Conflict detection
│   ├── urgent.ts             # Urgent reassignment logic
│   └── types.ts              # TypeScript types
├── data/
│   ├── pilot_roster.csv      # Sample pilot data
│   ├── drone_fleet.csv       # Sample drone data
│   └── missions.csv          # Sample mission data
├── docs/
│   ├── DECISION_LOG.md       # Design decisions
│   └── ARCHITECTURE.md       # Architecture details
├── .env.example              # Environment template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind config
├── next.config.js            # Next.js config
└── README.md                 # This file
```

## 🧪 Testing

### Manual Testing

Use the chat interface to test various scenarios:

```bash
npm run dev
```

Then try the example conversations listed above.

### API Testing

Test the sheets API directly:

```bash
# Get pilots
curl http://localhost:3000/api/sheets?type=pilots

# Get drones
curl http://localhost:3000/api/sheets?type=drones

# Get missions
curl http://localhost:3000/api/sheets?type=missions
```

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep your Google Service Account key secure
- Rotate OpenAI API keys regularly
- Use environment variables in Vercel for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License

## 🆘 Troubleshooting

### Google Sheets Not Syncing

- Verify service account email is shared with all 3 sheets
- Check that Sheet IDs are correct in `.env`
- Ensure `GOOGLE_PRIVATE_KEY` includes `\n` characters

### OpenAI API Errors

- Verify API key is valid
- Check you have credits available
- Ensure you're using GPT-4 model (requires access)

### Build Errors

- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Check Node.js version (18+ required)

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for Skylark Drones
