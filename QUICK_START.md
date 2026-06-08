# Email Setup & Quick Start Guide

## Installation & Setup

### 1. Verify Dependencies
All required dependencies are already in `package.json`:
```bash
npm install
```

### 2. Configure Environment Variables
Update your `.env` file with:

```env
# Email Configuration (Hostinger)
EMAIL_USER=hr@edenhire.ai
EMAIL_PASS=HREdenhire@2026#
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true

# Email Recipients
HR_EMAIL=hr@edenhire.ai
SALES_EMAIL=sales@edenhire.ai
```

### 3. Start the Server
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

You should see:
```
[EMAIL CONFIG] { host: 'smtp.hostinger.com', port: 465, ... }
[EMAIL] Verifying SMTP connection...
[EMAIL] SMTP connection verified successfully
```

## Project Structure (Updated)

```
server/
├── src/
│   ├── controllers/
│   │   ├── contactController.js (UPDATED - HTML emails)
│   │   └── jobController.js (UPDATED - HTML emails)
│   ├── utils/
│   │   └── sendEmail.js (UPDATED - New functions)
│   ├── routes/
│   ├── models/
│   ├── config/
│   └── server.js
├── .env (UPDATED - New variables)
├── .env.example (NEW - Reference)
└── EMAIL_IMPLEMENTATION.md (NEW - Full docs)
```

## Key Features

### ✅ Contact Form (Hiring Inquiry)
- **Route**: `POST /api/contact`
- **Email Recipient**: `SALES_EMAIL` (sales@edenhire.ai)
- **Subject**: "New Hiring Inquiry"
- **Data Saved**: MongoDB document + HTML email with all fields

### ✅ Job Application (Candidate)
- **Route**: `POST /api/job`
- **Email Recipient**: `HR_EMAIL` (hr@edenhire.ai)
- **Subject**: "New Candidate Application"
- **Data Saved**: MongoDB document + Resume upload + HTML email

### ✅ Error Handling
- MongoDB save always succeeds (data integrity first)
- Email failures are logged but don't break the response
- SMTP connection verified at startup
- Comprehensive logging with timestamps

### ✅ Email Formatting
- Professional HTML templates
- Labeled fields in table format
- Responsive design
- Plain text fallback

## Test Commands

### Test Contact Form
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "company": "Acme Corp",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "Senior Developer",
    "teamSize": "10-50",
    "fundingStage": "Series A",
    "challenge": "Scaling engineering team"
  }'
```

### Test Job Application
```bash
curl -X POST http://localhost:5000/api/job \
  -F "name=Jane Smith" \
  -F "email=jane@example.com" \
  -F "phone=+9876543210" \
  -F "currentRole=Senior Developer" \
  -F "experience=5" \
  -F "workPreference=Remote" \
  -F "skills=Node.js, React, MongoDB" \
  -F "location=USA" \
  -F "linkedin=https://linkedin.com/in/jane" \
  -F "roleLookingFor=Lead Engineer" \
  -F "file=@resume.pdf"
```

## Email Examples

### Hiring Inquiry Email
```
FROM: "Eden Hire" <hr@edenhire.ai>
TO: sales@edenhire.ai
REPLY-TO: john@example.com
SUBJECT: New Hiring Inquiry

┌─ NEW HIRING INQUIRY ─────────────────────┐
│                                           │
│ Name:               John Doe              │
│ Email:              john@example.com      │
│ Phone Number:       +1234567890           │
│ Company:            Acme Corp             │
│ Role Hiring For:    Senior Developer      │
│ Team Size:          10-50                 │
│ Funding Stage:      Series A              │
│ Key Challenge:      Scaling team          │
│ Submitted At:       [Timestamp]           │
│                                           │
└───────────────────────────────────────────┘
```

### Candidate Application Email
```
FROM: "Eden Hire" <hr@edenhire.ai>
TO: hr@edenhire.ai
REPLY-TO: jane@example.com
SUBJECT: New Candidate Application

┌─ NEW CANDIDATE APPLICATION ───────────────┐
│                                            │
│ Name:               Jane Smith             │
│ Email:              jane@example.com       │
│ Phone Number:       +9876543210            │
│ Current Role:       Senior Developer       │
│ Years of Experience: 5                     │
│ Work Preference:    Remote                 │
│ Skills:             Node.js, React, Mongo  │
│ Location:           USA                    │
│ LinkedIn Profile:   https://linkedin....   │
│ Role Looking For:   Lead Engineer          │
│ Resume URL:         [Cloudinary URL]       │
│ Submitted At:       [Timestamp]            │
│                                            │
└────────────────────────────────────────────┘
```

## Response Examples

### Successful Submission
```json
{
  "success": true,
  "message": "Thank you! We have received your inquiry and will contact you soon.",
  "data": {
    "_id": "607f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-06-08T10:30:00.000Z"
  }
}
```

### Validation Error
```json
{
  "success": false,
  "message": "All fields are required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "An error occurred while processing your request. Please try again later."
}
```

## Logging Output

### On Startup
```
[EMAIL CONFIG] {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  emailUser: 'hr@edenhire.ai',
  hasPassword: true
}
[EMAIL] Verifying SMTP connection...
[EMAIL] SMTP connection verified successfully
```

### On Successful Submission
```
[START] createContact - Request received { timestamp: '...' }
[STEP] Validating request body
[DB] Saving contact to MongoDB
[DB] Contact saved successfully { id: '...', timestamp: '...' }
[EMAIL] Attempting to send email to sales@edenhire.ai
[EMAIL] Sending email { to: 'sales@edenhire.ai', ... }
[EMAIL] Email sent successfully to sales@edenhire.ai { messageId: '...' }
[STEP] Response returning success
```

### On Email Failure (Non-blocking)
```
[DB] Contact saved successfully { id: '...', timestamp: '...' }
[EMAIL] Attempting to send email to sales@edenhire.ai
[EMAIL WARNING] Email sending failed (non-blocking) {
  message: 'connect ECONNREFUSED',
  recipient: 'sales@edenhire.ai',
  contactId: '...',
  timestamp: '...'
}
[STEP] Response returning success
```

## Verification Checklist

- [ ] Server starts without email config errors
- [ ] SMTP connection verified at startup
- [ ] Contact form email sends to SALES_EMAIL
- [ ] Job application email sends to HR_EMAIL
- [ ] MongoDB saves succeed (check database)
- [ ] Emails have professional HTML formatting
- [ ] Emails include all submitted fields
- [ ] Reply-to field is set correctly
- [ ] Email failures don't block API responses
- [ ] Logs show timestamps and IDs for tracking

## Environment Variables Reference

| Variable | Example | Purpose |
|----------|---------|---------|
| EMAIL_USER | hr@edenhire.ai | SMTP username |
| EMAIL_PASS | password | SMTP password |
| SMTP_HOST | smtp.hostinger.com | SMTP server |
| SMTP_PORT | 465 | SMTP port |
| SMTP_SECURE | true | Use SSL/TLS |
| HR_EMAIL | hr@edenhire.ai | Job app recipient |
| SALES_EMAIL | sales@edenhire.ai | Hiring inquiry recipient |

## Troubleshooting

### Emails Not Sending
1. Check server startup logs for SMTP errors
2. Verify EMAIL_USER and EMAIL_PASS are correct
3. Confirm MongoDB save succeeded (data is in database)
4. Check [EMAIL ERROR] logs for specific error code
5. Test SMTP manually with: `npm run test:smtp`

### Connection Refused
- Verify SMTP_HOST and SMTP_PORT are correct
- Check if Hostinger SMTP is accessible from your network
- Verify firewall isn't blocking port 465

### Emails in Spam
- Add SPF/DKIM records for edenhire.ai domain
- Email from address matches SMTP user
- Use descriptive subject lines

## File Changes Summary

### New Functions in `sendEmail.js`
- `formatEmailBody(data)` - HTML table formatter
- `createEmailTemplate(title, tableHtml)` - Email wrapper
- Enhanced exports

### Updated `contactController.js`
- HTML email formatting with all fields
- Non-blocking email error handling
- Better response messages
- Field validation

### Updated `jobController.js`
- HTML email formatting with all fields
- Non-blocking email error handling
- Better response messages
- Field validation

### Updated `.env`
- Added SMTP configuration
- Added email recipient addresses

## Next Steps

1. Deploy to production
2. Set up SPF/DKIM records
3. Monitor email logs
4. Test with real email addresses
5. Configure email forwarding if needed
6. Set up alerts for email failures

For detailed documentation, see `EMAIL_IMPLEMENTATION.md`
