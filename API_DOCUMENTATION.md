# API Endpoints Documentation

## Contact Form Endpoint (Hiring Inquiry)

### `POST /api/contact`

Send a hiring inquiry through the contact form.

#### Request Body
```json
{
  "name": "John Doe",
  "company": "Acme Corporation",
  "email": "john@example.com",
  "phone": "+1 (555) 123-4567",
  "role": "Senior Developer",
  "teamSize": "10-50",
  "fundingStage": "Series A",
  "challenge": "Scaling engineering team to 50+ engineers"
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✓ | Full name of contact |
| company | string | ✓ | Company name |
| email | string | ✓ | Contact email (used for reply-to) |
| phone | string | ✓ | Contact phone number |
| role | string | ✓ | Job role/position hiring for |
| teamSize | string | ✓ | Current team size (e.g., "10-50") |
| fundingStage | string | ✓ | Funding stage (e.g., "Series A", "Seed") |
| challenge | string | ✓ | Key hiring challenge/requirement |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Thank you! We have received your inquiry and will contact you soon.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "company": "Acme Corporation",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "role": "Senior Developer",
    "teamSize": "10-50",
    "fundingStage": "Series A",
    "challenge": "Scaling engineering team to 50+ engineers",
    "createdAt": "2026-06-08T10:30:00.000Z",
    "updatedAt": "2026-06-08T10:30:00.000Z"
  }
}
```

#### Validation Error (400)
```json
{
  "success": false,
  "message": "All fields are required"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "An error occurred while processing your inquiry. Please try again later."
}
```

#### Email Details
- **Recipient**: `SALES_EMAIL` (from env: sales@edenhire.ai)
- **Subject**: "New Hiring Inquiry"
- **From**: "Eden Hire" <hr@edenhire.ai>
- **Reply-To**: User's email from request
- **Format**: HTML with professional styling

---

## Job Application Endpoint (Candidate)

### `POST /api/job`

Submit a job application with resume file.

#### Request Body (Multipart Form Data)
```
name: Jane Smith
email: jane@example.com
phone: +1 (555) 987-6543
currentRole: Senior Product Manager
experience: 7
workPreference: Remote
skills: Product Strategy, Analytics, Team Management, Go-to-Market
location: San Francisco, CA
linkedin: https://linkedin.com/in/jane-smith
roleLookingFor: Director of Product
file: [resume.pdf] (binary)
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✓ | Full name |
| email | string | ✓ | Email (used for reply-to) |
| phone | string | ✓ | Phone number |
| currentRole | string | ✓ | Current job title |
| experience | string | ✓ | Years of experience |
| workPreference | string | ✓ | Work arrangement preference (Remote, On-site, Hybrid) |
| skills | string | ✓ | Comma-separated skills list |
| location | string | ✓ | Current location |
| linkedin | string | ✓ | LinkedIn profile URL |
| roleLookingFor | string | ✓ | Target job position |
| file | file | ✓ | Resume PDF/DOC file |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Thank you for your application! We will review it and contact you soon.",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 (555) 987-6543",
    "currentRole": "Senior Product Manager",
    "experience": "7",
    "workPreference": "Remote",
    "skills": "Product Strategy, Analytics, Team Management, Go-to-Market",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/jane-smith",
    "roleLookingFor": "Director of Product",
    "resumeUrl": "https://res.cloudinary.com/...",
    "createdAt": "2026-06-08T10:35:00.000Z",
    "updatedAt": "2026-06-08T10:35:00.000Z"
  }
}
```

#### Validation Errors

**Missing Resume File (400)**
```json
{
  "success": false,
  "message": "Resume file is required."
}
```

**Missing Fields (400)**
```json
{
  "success": false,
  "message": "All fields are required"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "An error occurred while processing your application. Please try again later."
}
```

#### Email Details
- **Recipient**: `HR_EMAIL` (from env: hr@edenhire.ai)
- **Subject**: "New Candidate Application"
- **From**: "Eden Hire" <hr@edenhire.ai>
- **Reply-To**: Candidate's email from request
- **Format**: HTML with professional styling
- **Resume**: Linked in email (Cloudinary URL)

---

## Email Flow Diagram

```
Client Submission
    ↓
API Endpoint (/api/contact or /api/job)
    ↓
Validation
    ├─ Invalid → 400 Response
    └─ Valid → Continue
    ↓
Save to MongoDB
    ├─ Failed → 500 Response
    └─ Success → Continue (Data now persisted)
    ↓
Upload Resume (Job only)
    ├─ Failed → 500 Response
    └─ Success → Continue
    ↓
Send Email (Async)
    ├─ Success → 201 Response with data
    ├─ Failed → Still 201 Response with data (logged as error)
    └─ Both → Data available in database
    ↓
Email Received
    ├─ Contact → sales@edenhire.ai
    └─ Job → hr@edenhire.ai
```

---

## Response Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 201 | Created | Submission successful (email may fail but data saved) |
| 400 | Bad Request | Validation failed or missing fields |
| 500 | Server Error | Database error, file upload error, or other server issue |

---

## Error Handling

### Data Persistence Guarantee
✅ If response is 201, the submission was saved to MongoDB
✓ Email sending is non-blocking
- Email failure won't affect API response
- Email failures are logged server-side

### Retry Strategy
- **No retry needed** for 201 responses
- **Retry allowed** for 500 responses (safe - duplicate check optional)
- **Don't retry** for 400 responses

---

## Example Implementations

### JavaScript/Fetch - Contact Form
```javascript
const submitContactForm = async (formData) => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('Submission successful:', result.message);
  } else {
    console.error('Submission failed:', result.message);
  }
  
  return result;
};
```

### JavaScript/FormData - Job Application
```javascript
const submitJobApplication = async (formElement) => {
  const formData = new FormData(formElement);
  
  const response = await fetch('/api/job', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('Application submitted:', result.message);
    console.log('Resume URL:', result.data.resumeUrl);
  } else {
    console.error('Application failed:', result.message);
  }
  
  return result;
};
```

### React Hook - Contact Form
```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showSuccessMessage(result.message);
      resetForm();
    } else {
      showErrorMessage(result.message);
    }
  } catch (error) {
    showErrorMessage('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## Testing

### Contact Form
```bash
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
```

### Job Application
```bash
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

## Important Notes

1. **Email is Non-blocking**: A 201 response means data was saved, but doesn't guarantee email was sent
2. **Server-Side Logging**: Email failures are logged server-side for debugging
3. **No Duplicate Protection**: Frontend should prevent double-clicks, not API
4. **File Size Limits**: Check Cloudinary limits on resume files
5. **CORS**: API respects CORS configuration from .env
6. **Rate Limiting**: Not currently implemented; consider adding for production

---

## Support

For API issues:
- Check server logs for error details
- Verify all required fields are present
- Check content-type headers
- Test with curl before debugging frontend code
