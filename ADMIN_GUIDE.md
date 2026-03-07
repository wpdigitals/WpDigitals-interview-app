# WP Digitals Interviewer - Admin Access Guide

## Admin Login Credentials

**Admin Portal URL:** https://code-screener.preview.emergentagent.com/admin/login

**Default Admin Credentials:**
- **Email:** admin@wpdigitals.com
- **Password:** WPDigitals@2024

⚠️ **Security Note:** Change these credentials in production by updating the admin authentication logic in `/app/backend/server.py`

---

## Admin Dashboard Features

### 1. **Statistics Overview**
View real-time statistics at the top of the dashboard:
- Total Interviews
- Completed Interviews
- Active Interviews
- Terminated Interviews

### 2. **Interview Management**
Access the complete list of all interviews with:
- Candidate name and email
- Role applied for
- Experience level
- Current status (active/completed/terminated)
- Interview phase
- Creation date

### 3. **View Interview Details**
Click the "👁️ View" button to see:
- Complete candidate information (name, email, phone, role, tech stack, social links)
- Interview status and phase
- Number of video recordings captured
- **Scores** (if completed):
  - Communication Score /10
  - Technical Score /10
  - Problem Solving Score /10
  - System Thinking Score /10
  - Total Score /40
- Hiring recommendation (Hire/Consider/Reject)
- **Full Interview Transcript** with all questions and answers

### 4. **Delete Interview**
Click the "🗑️ Delete" button to:
- Remove interview from system
- Delete all associated messages
- Remove evaluation results
- Requires confirmation before deletion

### 5. **Send Interview Invitation**
Click "📧 Send Interview Invitation" button to:
- Enter candidate name
- Enter candidate email
- Select interview date
- Select interview time
- System stores invitation in database
- Ready for email service integration (SendGrid/Resend)

---

## Admin Workflow

### Typical Admin Tasks:

1. **Review New Interviews**
   - Log in to admin dashboard
   - Check "Active" interviews count
   - View list of ongoing interviews

2. **Check Completed Interviews**
   - Filter by "completed" status
   - View interview details
   - Review scores and transcripts
   - Check video recording count
   - Read hiring recommendation

3. **Manage Terminated Interviews**
   - View interviews that were stopped early
   - Check termination reason (5 unanswered questions or candidate stopped)
   - Review partial responses
   - Decide on re-interview if needed

4. **Schedule Re-interviews**
   - Use "Send Interview Invitation" feature
   - Enter candidate details
   - Set date and time
   - Candidate receives invitation link

5. **Clean Up Data**
   - Delete test interviews
   - Remove old/invalid interviews
   - Maintain database hygiene

---

## Candidate Interview Flow

### For Candidates:
1. Sign in with Google at `/login`
2. Complete 3-part registration:
   - Upload resume (auto-parsed)
   - Review and edit details
   - Submit KYC documents
3. Start interview with:
   - Camera recording (required)
   - 2-minute timer per question
   - Paste prevention
   - 3 phases: Behavioral → Technical → Practical

### Interview Controls:
- **Stop Interview Button** (Red button in header)
  - Candidate can stop anytime
  - Confirmation required
  - Redirects to statistics page
  - Admin can see stopped interviews

### After Interview:
- **Completed:** See evaluation scores and recommendation
- **Terminated:** View statistics page showing:
  - Questions answered
  - Total time taken
  - Average time per question
  - Next steps information

---

## Technical Details

### Database Collections:
- `admins` - Admin user accounts
- `admin_sessions` - Admin login sessions
- `users` - Candidate Google OAuth accounts
- `user_sessions` - Candidate sessions
- `candidates` - Full candidate profiles
- `interviews` - Interview metadata
- `messages` - Interview conversation history
- `results` - Evaluation scores and recommendations
- `invitations` - Interview invitation records

### API Endpoints:
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/me` - Get current admin
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/interviews` - List all interviews
- `GET /api/admin/interviews/{id}/details` - Full interview details
- `DELETE /api/admin/interviews/{id}` - Delete interview
- `POST /api/admin/send-invitation` - Send email invitation

---

## Security Best Practices

1. **Change Default Password**
   - Update hardcoded credentials in production
   - Use environment variables
   - Implement proper password hashing (bcrypt)

2. **Session Management**
   - Admin sessions expire after 7 days
   - HttpOnly cookies prevent XSS attacks
   - Secure flag ensures HTTPS only

3. **Access Control**
   - All admin routes require authentication
   - Invalid sessions are automatically cleared
   - Admin and candidate sessions are separate

4. **Data Protection**
   - Video recordings stored securely in database
   - Candidate data accessible only by admin
   - No public endpoints expose sensitive data

---

## Future Enhancements

Potential admin features to add:
- Email service integration (SendGrid/Resend)
- Video playback in admin dashboard
- Export interview reports as PDF
- Bulk delete functionality
- Interview analytics dashboard
- Role-based admin permissions
- Audit logs for admin actions
- Custom email templates
- Automated interview scheduling
- SMS notifications

---

## Support

For technical support or issues:
- Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
- Check frontend console for errors
- Verify MongoDB connection
- Ensure EMERGENT_LLM_KEY is valid

---

**Last Updated:** January 2026
**Platform:** WP Digitals Interviewer
**Version:** 1.0
