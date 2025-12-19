# Email Configuration Check - Password Reset

## 🔴 Issue

Password reset is failing with "Failed to send reset email. please try again later."

## 🔍 Root Cause

The email service requires configuration in Railway environment variables:
- `EMAIL_HOST`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

If these are missing or incorrect, emails cannot be sent.

## ✅ Fix Applied

### 1. Enhanced Error Handling
- Added email configuration check
- Better error messages
- More specific error logging

### 2. Improved Client Error Messages
- Shows specific error if email service not configured
- Shows network errors separately
- Better user feedback

## 🔧 Required Railway Environment Variables

Add these to your Railway project:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### For Gmail:
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not regular password)

### For Other Providers:
- **Outlook**: `smtp-mail.outlook.com`
- **Yahoo**: `smtp.mail.yahoo.com`
- **Custom SMTP**: Use your provider's SMTP settings

## 🧪 Testing

### Test Email Configuration:
```bash
curl -X POST https://utleieskade-api2-production-2915.up.railway.app/users/send-password-reset-email \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@test.com"}'
```

### Expected Responses:

**Success:**
```json
{
  "status": "success",
  "message": "OTP sent to test@test.com"
}
```

**Email Not Configured:**
```json
{
  "status": "error",
  "message": "Email service is not configured. Please contact support."
}
```

**User Not Found:**
```json
{
  "status": "error",
  "message": "User with the email does not exist"
}
```

## 📝 Next Steps

1. **Check Railway Environment Variables**
   - Go to Railway dashboard
   - Select your API service
   - Go to Variables tab
   - Verify EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD are set

2. **If Missing, Add Email Configuration**
   - Add EMAIL_HOST (e.g., smtp.gmail.com)
   - Add EMAIL_USER (your email)
   - Add EMAIL_PASSWORD (app password)

3. **Restart API Service**
   - After adding variables, restart the service
   - Wait for deployment to complete

4. **Test Again**
   - Try password reset in app
   - Should now send email successfully

## 🔗 Railway Configuration

1. Go to: https://railway.app
2. Select your API project
3. Click on API service
4. Go to "Variables" tab
5. Add/Update:
   - `EMAIL_HOST`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
6. Restart service

---

**Last Updated**: December 6, 2025  
**Status**: Error handling improved, email configuration check added

