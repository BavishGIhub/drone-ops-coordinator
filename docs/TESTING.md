# Testing Guide

## Overview

This guide covers testing the Drone Operations Coordinator at different levels.

## 1. Business Logic Testing (No API Keys Required)

### Quick Test
```bash
npm test
```

This runs `test-logic.js` which verifies core business logic:
- Pilot filtering by location and skills
- Drone weather compatibility checks
- Cost calculations
- Budget overrun detection
- Skill and certification matching

**Expected Output:**
```
✅ All tests passed!
```

## 2. Build Testing

### Development Build
```bash
npm run dev
```
Opens development server at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

Verifies:
- TypeScript compilation
- Tailwind CSS processing
- API route generation
- Static page generation

## 3. Manual Testing Scenarios

Once you have API keys configured in `.env`:

### Scenario 1: Query Available Pilots
```
User: Show me available pilots in Bangalore with Mapping skills
Expected: List of pilots meeting criteria (Arjun)
```

### Scenario 2: Weather Compatibility Check
```
User: Which drones can fly in rainy weather?
Expected: List of IP43-rated drones (D001, D003)
```

### Scenario 3: Cost Calculation
```
User: What's the total cost for Arjun on PRJ001?
Expected: ₹4,500 (₹1,500 × 3 days)
```

### Scenario 4: Assignment Creation
```
User: Assign the best pilot and drone to PRJ001
Expected: 
- Analysis of matches
- Recommendation with scores
- Confirmation of assignment
- Google Sheets updated
```

### Scenario 5: Status Update (Tests Google Sheets Sync)
```
User: Mark Sneha as Available
Expected:
- Status updated in system
- Google Sheets updated
- Confirmation message
```

### Scenario 6: Conflict Detection
```
User: What conflicts exist for next week?
Expected: List of detected conflicts with severity levels
```

### Scenario 7: Urgent Reassignment
```
User: Urgent: Arjun called in sick, need to reassign PRJ001 ASAP
Expected:
- Top 3 replacement options
- Feasibility scores
- Cost estimates
- Warnings (if any)
```

### Scenario 8: Capability Validation
```
User: Can P003 (Rohit) handle PRJ002?
Expected: Warning about missing Night Ops certification
```

## 4. API Testing

### Test Sheets API Directly
```bash
# Get pilots
curl http://localhost:3000/api/sheets?type=pilots

# Get drones
curl http://localhost:3000/api/sheets?type=drones

# Get missions
curl http://localhost:3000/api/sheets?type=missions
```

### Test Chat API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me available pilots"}
    ]
  }'
```

## 5. Google Sheets Integration Testing

### Prerequisites
1. Create 3 Google Sheets (pilots, drones, missions)
2. Share each with your service account email
3. Copy Sheet IDs to `.env`

### Verification Steps

1. **Read Test**: Start the app, ask "Show me all pilots"
   - Should display data from your sheet

2. **Write Test**: Ask "Mark P001 as On Leave"
   - Check Google Sheet - status column should update

3. **Assignment Test**: Ask "Assign P001 and D001 to PRJ001"
   - Check both pilot and drone sheets
   - `current_assignment` columns should update

### Common Issues

**Issue**: "Missing credentials" error
- **Fix**: Verify `.env` has correct `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`

**Issue**: "Sheet not found" error
- **Fix**: Verify Sheet IDs in `.env` are correct (the long string in the URL)

**Issue**: "Permission denied" error
- **Fix**: Share the sheet with your service account email with Editor permissions

## 6. Integration Testing Checklist

- [ ] Application starts without errors
- [ ] Chat interface loads properly
- [ ] Can query pilots from Google Sheets
- [ ] Can query drones from Google Sheets
- [ ] Can query missions from Google Sheets
- [ ] Status updates sync to Google Sheets
- [ ] Assignment creation updates multiple sheets
- [ ] Conflict detection works correctly
- [ ] Urgent reassignment provides ranked options
- [ ] Error messages are user-friendly

## 7. Performance Testing

### Expected Response Times
- **Query operations**: < 2 seconds
- **Status updates**: < 3 seconds (includes Google Sheets API)
- **Assignment creation**: < 4 seconds
- **Conflict detection**: < 3 seconds
- **Urgent reassignment**: < 5 seconds

### Load Considerations
- Google Sheets API: 100 requests per 100 seconds
- OpenAI API: Varies by tier
- Consider implementing rate limiting for production

## 8. Edge Cases to Test

1. **Empty Results**: Query for non-existent pilot
   ```
   User: Show me pilots named XYZ
   Expected: "No pilots found matching criteria"
   ```

2. **No Available Resources**: Try to assign when all pilots busy
   ```
   User: Assign pilots to PRJ001
   Expected: "No available pilots meeting requirements"
   ```

3. **Budget Constraints**: Assign expensive pilot to low-budget mission
   ```
   User: Assign Sneha to PRJ001
   Expected: Budget overrun warning
   ```

4. **Weather Incompatibility**: Assign non-waterproof drone to rainy mission
   ```
   User: Assign D002 to PRJ001 (rainy weather)
   Expected: Weather risk conflict detected
   ```

5. **Certification Gaps**: Assign pilot without required certs
   ```
   User: Assign P001 to PRJ002
   Expected: Warning about missing Night Ops certification
   ```

## 9. Security Testing

### Environment Variables
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in source code
- [ ] API keys not exposed in client-side code

### Input Validation
- [ ] User inputs are validated before processing
- [ ] SQL injection not applicable (using Sheets API)
- [ ] XSS protection via React's built-in escaping

## 10. Deployment Testing (Vercel)

### Pre-deployment Checklist
- [ ] `npm run build` succeeds
- [ ] All environment variables documented
- [ ] `.env.example` is up to date
- [ ] README deployment section is complete

### Post-deployment Verification
- [ ] Application loads at Vercel URL
- [ ] All API routes respond correctly
- [ ] Google Sheets sync works in production
- [ ] OpenAI API calls succeed
- [ ] No console errors in browser

## 11. Troubleshooting Tests

### Debug Mode
Add to `.env`:
```
NODE_ENV=development
```

This enables:
- Detailed error messages
- Console logging
- Stack traces

### Common Test Failures

**Test fails: "Network error"**
- Check internet connection
- Verify API endpoints are accessible

**Test fails: "Invalid API key"**
- Verify `OPENAI_API_KEY` in `.env`
- Check key has not expired

**Test fails: "Sheet not accessible"**
- Verify sheet sharing with service account
- Check Sheet ID is correct
- Verify service account has Sheets API enabled

## 12. Continuous Testing

### Automated Checks
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build

# Logic tests
npm test
```

### Pre-commit Checklist
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Documentation updated

---

**Last Updated**: 2026-02-19  
**Version**: 1.0
