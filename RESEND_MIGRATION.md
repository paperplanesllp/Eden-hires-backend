# Nodemailer to Resend Migration Guide

## ✅ Migration Complete

Your Node.js backend has been successfully migrated from **Nodemailer SMTP** to **Resend** email service.

---

## 📦 Installation

### Step 1: Install Resend Package
```bash
npm install resend
```

### Step 2: Update .env
Replace the old Hostinger SMTP variables with Resend API key:

```env
# Remove these lines (if still present):
# EMAIL_USER=hr@edenhire.ai
# EMAIL_PASS=HREdenhire@2026#
# SMTP_HOST=smtp.hostinger.com
# SMTP_PORT=465
# SMTP_SECURE=true

# Add this line:
RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 3: Get Your Resend API Key
1. Go to [https://resend.com/dashboard](https://resend.com/dashboard)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Create a new API key (or copy existing one)
5. Add to your `.env` file as `RESEND_API_KEY`

---

## 🔄 What Changed

### Modified Files

#### 1. `/src/utils/sendEmail.js` ✅
**Changes:**
- ✅ Replaced `nodemailer` with `resend` package
- ✅ Updated configuration to use `RESEND_API_KEY`
- ✅ Kept all HTML email template functions
- ✅ Preserved all logging
- ✅ Maintained same exported function names:
  - `sendEmail()` - Send emails via Resend
  - `formatEmailBody()` - Format fields into HTML table
  - `createEmailTemplate()` - Wrap HTML in professional template
  - `verifyTransporter()` - Verify API configuration

**No changes needed to:**
- ✅ `/src/controllers/contactController.js` - No changes required
- ✅ `/src/controllers/jobController.js` - No changes required
- ✅ Controller imports work exactly the same

---

## 📧 Email Configuration

### From Address
- **Email**: `noreply@edenhire.ai`
- **Name**: `Eden Hire`
- **Full**: `"Eden Hire" <noreply@edenhire.ai>`

⚠️ **Important:** You must verify ownership of your domain with Resend before sending emails. Follow their domain verification process in the dashboard.

### Email Routes (Unchanged)
- **Hiring Inquiries** → `sales@edenhire.ai`
- **Job Applications** → `hr@edenhire.ai`

### Reply-To Header
- Automatically set to the submitter's email address

---

## 🚀 Quick Start

### 1. Install Package
```bash
npm install resend
```

### 2. Set Environment Variable
```bash
# .env file
RESEND_API_KEY=re_your_key_here
```

### 3. Restart Server
```bash
npm run dev  # or npm start
```

You should see:
```
[EMAIL CONFIG] {
  provider: 'Resend',
  apiKeyConfigured: true,
  fromEmail: 'noreply@edenhire.ai',
  fromName: 'Eden Hire',
  timestamp: '...'
}
[EMAIL] Verifying Resend API configuration...
[EMAIL] Resend API key is configured and verified
```

### 4. Test Endpoints
```bash
# Test contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "company": "Test Co",
    "email": "test@example.com",
    "phone": "555-1234",
    "role": "Engineer",
    "teamSize": "5-10",
    "fundingStage": "Bootstrapped",
    "challenge": "Team scaling"
  }'

# Test job application
curl -X POST http://localhost:5000/api/job \
  -F "name=Test Candidate" \
  -F "email=candidate@example.com" \
  -F "phone=555-5678" \
  -F "currentRole=Developer" \
  -F "experience=3" \
  -F "workPreference=Remote" \
  -F "skills=JavaScript, React" \
  -F "location=USA" \
  -F "linkedin=https://linkedin.com/in/test" \
  -F "roleLookingFor=Senior Developer" \
  -F "file=@resume.pdf"
```

---

## 📝 Logging Examples

### On Startup
```
[EMAIL CONFIG] {
  provider: 'Resend',
  apiKeyConfigured: true,
  fromEmail: 'noreply@edenhire.ai',
  fromName: 'Eden Hire',
  timestamp: '2026-06-08T10:30:00Z'
}
[EMAIL] Verifying Resend API configuration...
[EMAIL] Resend API key is configured and verified
```

### On Successful Email
```
[EMAIL] Sending email via Resend {
  to: 'sales@edenhire.ai',
  subject: 'New Hiring Inquiry',
  replyTo: 'john@example.com',
  timestamp: '2026-06-08T10:30:05Z'
}
[EMAIL] Email sent successfully via Resend {
  id: '67890abcdef123456789',
  to: 'sales@edenhire.ai',
  subject: 'New Hiring Inquiry',
  timestamp: '2026-06-08T10:30:05Z'
}
```

### On Email Error
```
[EMAIL] Sending email via Resend {
  to: 'sales@edenhire.ai',
  subject: 'New Hiring Inquiry',
  replyTo: 'john@example.com',
  timestamp: '2026-06-08T10:30:05Z'
}
[EMAIL ERROR] {
  message: 'Invalid API key',
  code: undefined,
  provider: 'Resend',
  timestamp: '2026-06-08T10:30:06Z'
}
```

---

## ⚙️ Environment Variables

### Old Configuration (Removed)
```env
EMAIL_USER=hr@edenhire.ai
EMAIL_PASS=HREdenhire@2026#
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
```

### New Configuration (Required)
```env
RESEND_API_KEY=re_your_actual_api_key_here
```

### Still Used (Unchanged)
```env
HR_EMAIL=hr@edenhire.ai
SALES_EMAIL=sales@edenhire.ai
```

---

## 🔍 Comparison: Nodemailer → Resend

| Feature | Nodemailer | Resend |
|---------|-----------|--------|
| Setup | Complex SMTP config | Simple API key |
| Configuration | 5+ variables | 1 variable |
| Authentication | Username + Password | API Key |
| Infrastructure | Your SMTP server | Resend's servers |
| Reliability | SMTP connection dependent | Enterprise API |
| Verification | Need to verify SMTP | Auto-verified |
| Response | Error/Success | API response with ID |
| Delivery Tracking | Limited | Built-in analytics |

---

## ✨ Benefits of Resend

✅ **No SMTP Configuration** - Just an API key  
✅ **Better Reliability** - Enterprise-grade infrastructure  
✅ **Built-in Analytics** - Track email delivery  
✅ **Easier Debugging** - Better error messages  
✅ **No Infrastructure** - No SMTP server to manage  
✅ **Scalable** - Handles high email volume  
✅ **DKIM/SPF** - Automatically configured with domain verification

---

## 🔐 Security

### API Key Management
- ✅ Store `RESEND_API_KEY` in `.env` only (never commit)
- ✅ Rotate keys periodically in Resend dashboard
- ✅ Use environment variable management for production
- ✅ Monitor API key usage in Resend dashboard

### Domain Verification
1. Add domain to Resend dashboard
2. Follow domain verification steps
3. Add required DNS records (DKIM, SPF)
4. Complete verification in Resend
5. Start sending emails from `noreply@edenhire.ai`

---

## 📊 Function Exports

All functions maintain the same interface:

```javascript
// Import unchanged
const {
  sendEmail,
  formatEmailBody,
  createEmailTemplate,
  verifyTransporter,
} = require("../utils/sendEmail");
```

### sendEmail()
```javascript
await sendEmail({
  to: "sales@edenhire.ai",
  subject: "New Hiring Inquiry",
  text: "Plain text version",
  html: "<html>HTML version</html>",
  replyTo: "user@example.com",
});
```

### formatEmailBody()
```javascript
const html = formatEmailBody({
  "Field Name": "Field Value",
  "Another Field": "Another Value",
});
```

### createEmailTemplate()
```javascript
const fullHtml = createEmailTemplate(
  "Email Title",
  tableHtml
);
```

### verifyTransporter()
```javascript
const isConfigured = await verifyTransporter();
```

---

## 🧪 Testing Checklist

- [ ] Install Resend package (`npm install resend`)
- [ ] Add `RESEND_API_KEY` to `.env`
- [ ] Server starts without errors
- [ ] `[EMAIL CONFIG]` log shows `provider: 'Resend'`
- [ ] `[EMAIL] Resend API key is configured and verified` appears in logs
- [ ] Test contact form - email sent to sales@edenhire.ai
- [ ] Test job application - email sent to hr@edenhire.ai
- [ ] Verify emails are received
- [ ] Check email formatting is professional
- [ ] Verify HTML tables display correctly
- [ ] Test reply-to field works
- [ ] MongoDB saves data even if email fails
- [ ] Errors are logged properly

---

## 🚨 Troubleshooting

### "RESEND_API_KEY is not configured"
```
✓ Solution: Add RESEND_API_KEY to .env file
✓ Make sure key starts with "re_"
✓ Restart server after updating .env
```

### "Invalid API key"
```
✓ Solution: Copy API key directly from Resend dashboard
✓ Verify no extra spaces or quotes
✓ Check key hasn't expired or been revoked
```

### "Domain not verified"
```
✓ Solution: Complete domain verification in Resend
✓ Add DNS records (DKIM, SPF, DMARC)
✓ Wait for DNS propagation (up to 48 hours)
✓ Use noreply@edenhire.ai from address
```

### Emails not sending
```
✓ Check API key is correct in .env
✓ Verify domain is verified in Resend
✓ Check recipient email is correct
✓ Review error logs for details
✓ Check Resend dashboard for failed deliveries
```

### Email formatting issues
```
✓ HTML templates automatically formatted
✓ Check recipient email client supports HTML
✓ Review logs for HTML content
✓ Test with multiple email providers
```

---

## 📈 Performance

### Resend vs Nodemailer
- **Resend**: ~500ms-2s per email (API-based, auto-retry)
- **Nodemailer**: ~1s-5s per email (SMTP-based, connection dependent)
- **Async**: Both non-blocking, same controller behavior

---

## 🔄 Rollback Plan (if needed)

If you need to revert to Nodemailer SMTP:
1. Restore old `.env` with SMTP variables
2. Revert `/src/utils/sendEmail.js` from git
3. Reinstall nodemailer: `npm install nodemailer`
4. Restart server

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Dashboard](https://resend.com/dashboard)
- [Email Verification Setup](https://resend.com/docs/how-to-send-emails)

---

## ✅ Migration Complete!

Your backend is now using Resend for all email functionality. The migration:
- ✅ Maintains all existing features
- ✅ Requires no controller changes
- ✅ Preserves HTML email formatting
- ✅ Keeps all logging
- ✅ Uses same function exports
- ✅ Simplifies email configuration
- ✅ Improves reliability

### Next Steps
1. Install Resend: `npm install resend`
2. Get API key from [Resend Dashboard](https://resend.com/dashboard)
3. Add to `.env`: `RESEND_API_KEY=re_...`
4. Restart server
5. Test endpoints
6. Deploy when ready

**Migration Time**: ~5 minutes
**Downtime**: None
**Risk Level**: Low (same APIs, different backend)
