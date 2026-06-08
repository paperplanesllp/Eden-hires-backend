# Email Implementation Guide - Production Ready

## Overview
This document outlines the production-ready email flow for Eden Hire backend using Nodemailer with Hostinger SMTP configuration.

## Architecture

### Email Flow
```
Contact Form Submission
    ↓
    ├─→ Save to MongoDB (Priority - Always succeeds)
    │    ├─→ Contact (Hiring Inquiry)
    │    └─→ Job (Candidate Application)
    │
    └─→ Send Email (Non-blocking, logs on failure)
         ├─→ If Hiring: Send to sales@edenhire.ai
         └─→ If Job Application: Send to hr@edenhire.ai
```

## Features Implemented

✅ **Dual Email Routing**
- Hiring inquiries → sales@edenhire.ai
- Job applications → hr@edenhire.ai

✅ **Production-Grade Email Formatting**
- HTML email templates with professional styling
- Labeled form fields with values in tabular format
- Responsive email design
- Plain text fallback for compatibility

✅ **Robust Error Handling**
- MongoDB save always succeeds (data integrity priority)
- Email failures logged but non-blocking
- Graceful error messages returned to client
- SMTP connection verification on startup

✅ **Comprehensive Logging**
- Structured logs with timestamps
- Email sending tracking (messageId, response)
- Error logging with context (code, command)
- Non-blocking email errors clearly marked

✅ **Environment-Based Configuration**
- All credentials via environment variables
- Hostinger SMTP pre-configured
- Flexible email recipient configuration

## Updated Files

### 1. `/src/utils/sendEmail.js`
**Key Additions:**
- `formatEmailBody(data)` - Converts object to HTML table
- `createEmailTemplate(title, tableHtml)` - Professional email wrapper
- Enhanced `sendEmail()` with HTML support
- `verifyTransporter()` - SMTP connection verification
- Comprehensive JSDoc documentation

**Configuration:**
```javascript
SMTP_HOST: smtp.hostinger.com
SMTP_PORT: 465
SMTP_SECURE: true
```

### 2. `/src/controllers/contactController.js`
**Key Changes:**
- Added `SALES_EMAIL` environment variable usage
- `buildHiringEmail()` creates formatted HTML emails
- MongoDB save before email (data integrity)
- Non-blocking email error handling
- Validation for required fields
- User-friendly response messages

**Email Recipients:**
- Hiring inquiries → `SALES_EMAIL` (sales@edenhire.ai)

**Response Example:**
```json
{
  "success": true,
  "message": "Thank you! We have received your inquiry and will contact you soon.",
  "data": { /* contact object */ }
}
```

### 3. `/src/controllers/jobController.js`
**Key Changes:**
- Added `HR_EMAIL` environment variable usage
- `buildCandidateEmail()` creates formatted HTML emails
- Resume upload + MongoDB save before email
- Non-blocking email error handling
- Validation for required fields
- User-friendly response messages

**Email Recipients:**
- Job applications → `HR_EMAIL` (hr@edenhire.ai)

**Response Example:**
```json
{
  "success": true,
  "message": "Thank you for your application! We will review it and contact you soon.",
  "data": { /* job object */ }
}
```

### 4. `/.env` (Updated)
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

## Email Template Example

### HTML Email Format
```
┌─────────────────────────────────┐
│   New Hiring Inquiry            │ (Header with color)
├─────────────────────────────────┤
│ Name:                 John Doe  │
│ Email:       john@example.com   │
│ Company:         Acme Corp      │
│ Phone:           +1234567890    │
│ Role Hiring For:     Developer  │
│ Team Size:              10-50   │
│ Funding Stage:         Series A │
│ Key Challenge:   Scaling team   │
│ Submitted At:    [Timestamp]    │
└─────────────────────────────────┘
```

## Logging Examples

### Successful Email Send
```
[EMAIL] Sending email {
  "to": "sales@edenhire.ai",
  "subject": "New Hiring Inquiry",
  "replyTo": "john@example.com",
  "timestamp": "2026-06-08T10:30:00Z"
}

[EMAIL] Email sent successfully to sales@edenhire.ai {
  "messageId": "<abc123@edenhire.ai>",
  "response": "250 Message accepted",
  "timestamp": "2026-06-08T10:30:05Z"
}
```

### Email Failure (Non-blocking)
```
[EMAIL WARNING] Email sending failed (non-blocking) {
  "message": "connect ECONNREFUSED",
  "code": "ECONNREFUSED",
  "recipient": "sales@edenhire.ai",
  "contactId": "507f1f77bcf86cd799439011",
  "timestamp": "2026-06-08T10:30:05Z"
}
```

### SMTP Verification at Startup
```
[EMAIL] Verifying SMTP connection...
[EMAIL] SMTP connection verified successfully
```

## Data Priority & Error Handling

| Scenario | Result | Response |
|----------|--------|----------|
| MongoDB Save ✓ + Email ✓ | Complete success | 201 with data |
| MongoDB Save ✓ + Email ✗ | Partial success | 201 with data (email logged) |
| MongoDB Save ✗ | Complete failure | 500 error |
| Validation Error | Prevented | 400 Bad Request |

## Testing the Email Flow

### 1. Test Hiring Inquiry (Contact Form)
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

### 2. Test Candidate Application (Job Form)
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

## Startup Verification

When the server starts, you'll see:
```
[EMAIL CONFIG] {
  "host": "smtp.hostinger.com",
  "port": 465,
  "secure": true,
  "emailUser": "hr@edenhire.ai",
  "hasPassword": true
}

[EMAIL] Verifying SMTP connection...
[EMAIL] SMTP connection verified successfully
```

If SMTP verification fails, you'll see:
```
[EMAIL] SMTP verification failed {
  "message": "connect ECONNREFUSED",
  "code": "ECONNREFUSED",
  "timestamp": "..."
}
```

## Environment Variable Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| EMAIL_USER | hr@edenhire.ai | SMTP authentication user |
| EMAIL_PASS | HREdenhire@2026# | SMTP authentication password |
| SMTP_HOST | smtp.hostinger.com | Hostinger SMTP server |
| SMTP_PORT | 465 | SMTP port (SSL) |
| SMTP_SECURE | true | Use SSL/TLS encryption |
| HR_EMAIL | hr@edenhire.ai | Send candidate apps here |
| SALES_EMAIL | sales@edenhire.ai | Send hiring inquiries here |

## Deployment Checklist

- [ ] Verify all environment variables in production `.env`
- [ ] Test SMTP connection in staging environment
- [ ] Verify `HR_EMAIL` and `SALES_EMAIL` mailboxes exist
- [ ] Set up email forwarding if needed
- [ ] Monitor email logs for failures
- [ ] Test both contact form and job application flow
- [ ] Verify emails are received within 5-10 seconds
- [ ] Check spam folders in test emails
- [ ] Set up email alerts for critical failures

## Dependencies

- `nodemailer` v8.0.10+ (already installed)
- `dotenv` v17.4.2+ (already installed)
- `express` v5.2.1+ (already installed)
- `mongoose` v9.6.3+ (already installed)

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Rotate `EMAIL_PASS` regularly
- Use app-specific passwords if available from Hostinger
- Consider using environment variable management service in production
- Monitor SMTP logs for unauthorized access attempts

## Troubleshooting

### Email Not Sending
1. Check `[EMAIL CONFIG]` logs on startup
2. Verify `EMAIL_USER` and `EMAIL_PASS` are correct
3. Check MongoDB save succeeded (data in database)
4. Look for `[EMAIL ERROR]` logs with error code
5. Verify Hostinger SMTP port (usually 465 or 587)

### Connection Timeouts
1. Increase timeout values in `transporter` config
2. Check Hostinger server status
3. Verify firewall isn't blocking SMTP port 465

### Emails Going to Spam
1. Add SPF/DKIM/DMARC records for edenhire.ai
2. Use reply-to header (implemented)
3. Verify sender domain matches SMTP user

## Support

For issues with:
- **Hostinger SMTP**: Contact Hostinger support
- **Nodemailer**: Check [Nodemailer docs](https://nodemailer.com/)
- **Code**: Review logs and stack traces
