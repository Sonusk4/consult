# Unified Authentication Flow - Testing Guide

## 🎯 Overview

The application now uses a **unified email + password authentication system** for all users, including enterprise team members. The old username-based login system has been deprecated.

## ✅ What Changed

### Backend Changes (`backend-new/index.js`)

1. **POST /enterprise/accept-invite** (Lines 735-806)
   - Auto-generates initial password: `{email-part}@ConsultaPro2025`
   - Creates consultant profile automatically with `type: "individual"`
   - Sets user role to `"USER"` instead of `"ENTERPRISE_MEMBER"`
   - Sets `password_changed: false` to force password change on first login
   - Returns `initialPassword` in response

2. **POST /auth/login-password** (Enhanced)
   - Now checks `password_changed` field
   - If `false`: Returns `requiresPasswordChange: true` with 30-min temp token
   - If `true`: Returns normal 24-hour permanent token

3. **POST /auth/change-password-first-login** (NEW - Lines 1707-1780)
   - Allows users to set permanent password on first login
   - Validates password length (min 8 characters)
   - Hashes password with bcrypt
   - Sets `password_changed: true`
   - Returns permanent token + user data

4. **POST /auth/login-member** (DEPRECATED)
   - Username-based login removed
   - All users now use email + password

### Frontend Changes

#### `frontend/services/api.ts`
- ✅ Removed: `auth.loginMember()`
- ✅ Added: `auth.changePasswordFirstLogin(newPassword)`
- ✅ Added: `auth.acceptInvitation(token, firebaseUid, phone, name)`

#### `frontend/pages/AuthPage.tsx`
- ✅ Removed: Enterprise Team Member role button
- ✅ Removed: MEMBER_LOGIN step
- ✅ Enhanced: `handlePasswordLogin()` - Detects first-time login
- ✅ Added: Password change modal for first-time users
- ✅ All roles now use standard email+password flow

#### `frontend/pages/enterprise/InviteAcceptPage.tsx`
- ✅ Completely redesigned - removed old 5-step flow
- ✅ New 3-step flow: Verify → Details → Success
- ✅ Displays auto-generated temporary password
- ✅ Shows login instructions with password change requirement
- ✅ Creates consultant profile via backend automatically

---

## 🧪 Testing Checklist

### Test 1: Enterprise Invitation Flow

**Prerequisites:**
- Enterprise admin account exists
- Admin can send invitations

**Steps:**
1. Login as enterprise admin
2. Navigate to Team Management
3. Send invitation to new email (e.g., `newmember@test.com`)
4. Check backend logs for invitation email details

**Expected Result:**
- ✅ Invitation email sent
- ✅ Backend generates `invite_token` and stores in database
- ✅ Email contains invitation link: `/invite/{token}`

---

### Test 2: Accept Invitation

**Steps:**
1. Click invitation link from email
2. Page should load with "Welcome! 🎉"
3. Email field is pre-filled (read-only)
4. Enter **Full Name** (e.g., "John Doe")
5. Enter **Phone Number** (e.g., "+91 9876543210")
6. Click "Continue to Setup"

**Expected Result:**
- ✅ Success page displays "Account Ready! 🎊"
- ✅ Shows temporary password: `newmember@ConsultaPro2025`
- ✅ Shows green checkmarks:
  - Account created ✓
  - Consultant profile created ✓
  - Ready to login ✓
- ✅ Shows login instructions

**Backend Verification:**
```sql
-- Check User table
SELECT id, email, role, password_changed, is_verified 
FROM "User" 
WHERE email = 'newmember@test.com';
-- Expected: role='USER', password_changed=false, is_verified=true

-- Check Consultant table
SELECT id, user_id, type, bio 
FROM "Consultant" 
WHERE user_id = (SELECT id FROM "User" WHERE email = 'newmember@test.com');
-- Expected: One row exists with type='individual'
```

---

### Test 3: First-Time Login

**Steps:**
1. Copy temporary password from success page
2. Navigate to login page (`/auth?type=LOGIN`)
3. Select role: **Consultant** (or any role)
4. Enter email: `newmember@test.com`
5. Enter password: `newmember@ConsultaPro2025`
6. Click "Continue with Password"

**Expected Result:**
- ✅ **Password change modal appears**
- ✅ Modal title: "Change Password"
- ✅ Message: "This is your first login. Please set a permanent password for your account."
- ✅ Shows password requirements:
  - ✓ At least 8 characters
  - ✓ One uppercase letter
  - ✓ One lowercase letter
  - ✓ One number
  - ✓ One special character (!@#$%^&*)

---

### Test 4: Set Permanent Password

**Steps:**
1. In password change modal:
2. Enter **New Password**: `MySecure123!`
3. Enter **Confirm Password**: `MySecure123!`
4. Click "Set Password"

**Expected Result:**
- ✅ Modal closes
- ✅ User is redirected to appropriate dashboard:
  - Consultant → `/consultant/dashboard`
  - User → `/user/dashboard`
  - Enterprise Admin → `/enterprise/dashboard`
- ✅ User is fully logged in
- ✅ Profile data is accessible

**Backend Verification:**
```sql
-- Check password_changed flag
SELECT email, password_changed, permanent_password IS NOT NULL as has_password
FROM "User" 
WHERE email = 'newmember@test.com';
-- Expected: password_changed=true, has_password=true
```

---

### Test 5: Subsequent Login

**Steps:**
1. Logout
2. Navigate to login page
3. Enter email: `newmember@test.com`
4. Enter password: `MySecure123!` (permanent password)
5. Click "Continue with Password"

**Expected Result:**
- ✅ **No password change modal**
- ✅ Direct redirect to dashboard
- ✅ Normal 24-hour token issued
- ✅ User data loaded correctly

---

### Test 6: Email Instead of Username (Negative Test)

**Steps:**
1. Try to find "Team Member Login" option on login page
2. Try to login with username

**Expected Result:**
- ✅ "Team Member Login" option **NOT visible**
- ✅ Only standard email+password login available
- ✅ No username input field anywhere

---

## 🔍 Edge Cases to Test

### Edge Case 1: Expired Invitation Token
- Click old invitation link (expired token)
- **Expected:** "Invalid or expired invitation link" error

### Edge Case 2: Weak Password on First Login
- Try password: `password` (too weak)
- **Expected:** Error message about password requirements

### Edge Case 3: Mismatched Passwords
- Enter different passwords in "New" and "Confirm"
- **Expected:** "Passwords do not match" error

### Edge Case 4: Login Before Password Change
- After accepting invite, try to login via API without changing password
- **Expected:** `requiresPasswordChange: true` in response

### Edge Case 5: Copy-Paste Temporary Password
- Use browser copy button on success page
- Paste in login form
- **Expected:** Login works, password change modal appears

---

## 🔧 Backend Endpoints Summary

### 1. Accept Invitation
```http
POST /enterprise/accept-invite
Content-Type: application/json

{
  "token": "invite-token-uuid",
  "firebase_uid": "mock-uid-newemail-at-test-dot-com",
  "phone": "+91 9876543210",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Invitation accepted successfully",
  "user": {
    "id": 123,
    "email": "newemail@test.com",
    "name": "John Doe",
    "role": "USER"
  },
  "initialPassword": "newemail@ConsultaPro2025",
  "consultant": {
    "id": 456,
    "type": "individual"
  }
}
```

### 2. First-Time Login
```http
POST /auth/login-password
Content-Type: application/json

{
  "email": "newemail@test.com",
  "password": "newemail@ConsultaPro2025"
}
```

**Response (First Login):**
```json
{
  "customToken": "jwt-token-30min",
  "user": { ... },
  "requiresPasswordChange": true
}
```

### 3. Change Password
```http
POST /auth/change-password-first-login
Authorization: Bearer {jwt-token-30min}
Content-Type: application/json

{
  "newPassword": "MySecure123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "customToken": "jwt-token-24hour",
  "user": { ... }
}
```

### 4. Subsequent Login
```http
POST /auth/login-password
Content-Type: application/json

{
  "email": "newemail@test.com",
  "password": "MySecure123!"
}
```

**Response:**
```json
{
  "customToken": "jwt-token-24hour",
  "user": { ... }
}
```

---

## 📝 Database Schema Changes

### User Table
```prisma
model User {
  id                    Int       @id @default(autoincrement())
  email                 String    @unique
  role                  Role      @default(USER)
  permanent_password    String?   // Hashed password
  password_changed      Boolean   @default(false) // NEW: Forces password change on first login
  is_verified           Boolean   @default(false)
  invite_token          String?   @unique
  invite_token_expiry   DateTime?
  
  // DEPRECATED (to be removed in future):
  // temp_username       String?
  // temp_password       String?
  // permanent_username  String?
}
```

### Consultant Table
```prisma
model Consultant {
  id          Int       @id @default(autoincrement())
  user_id     Int       @unique
  type        String?   // "individual" or "enterprise"
  bio         String?
  expertise   String[]  @default([])
  // ... other fields
}
```

---

## 🚀 Running Tests

### Start Backend
```bash
cd d:\consult\backend-new
node index.js
```
Backend should be running on: http://localhost:5000

### Start Frontend
```bash
cd d:\consult\frontend
npm run dev
```
Frontend should be running on: http://localhost:3000

---

## ✅ Success Criteria

**Frontend:**
- ✅ No TypeScript errors
- ✅ No username input fields visible
- ✅ Password change modal appears on first login
- ✅ All role selections work (User, Consultant, Enterprise Admin)
- ✅ Proper redirects after login based on role

**Backend:**
- ✅ `/enterprise/accept-invite` creates consultant profile
- ✅ Initial password auto-generated correctly
- ✅ `password_changed` flag works as expected
- ✅ Token expiry times correct (30min temp, 24hr permanent)
- ✅ Old `/auth/login-member` endpoint returns 404

**Security:**
- ✅ Passwords hashed with bcrypt
- ✅ Temp tokens expire after 30 minutes
- ✅ Cannot reuse invitation token after acceptance
- ✅ Old temp passwords don't work after password change

---

## 🐛 Known Issues & Limitations

1. **Email Sending:** If email sending fails in dev mode, check backend logs for temporary password
2. **Firebase Auth:** In dev mode, uses mock Firebase UIDs - production requires real Firebase config
3. **Token Expiry:** Backend must be restarted if making schema changes
4. **Copy-Paste:** On some browsers, copying password might not work - manual typing required

---

## 📧 Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check backend terminal for API errors
3. Verify database records with SQL queries above
4. Ensure both servers are running on correct ports

**Backend Port:** 5000  
**Frontend Port:** 3000  
**Database:** PostgreSQL (connection string in `.env`)

---

## 🎉 Testing Complete Checklist

- [ ] Test 1: Enterprise Invitation Flow
- [ ] Test 2: Accept Invitation
- [ ] Test 3: First-Time Login
- [ ] Test 4: Set Permanent Password
- [ ] Test 5: Subsequent Login
- [ ] Test 6: Email Instead of Username
- [ ] Edge Case 1: Expired Token
- [ ] Edge Case 2: Weak Password
- [ ] Edge Case 3: Mismatched Passwords
- [ ] Edge Case 4: Login Before Change
- [ ] Edge Case 5: Copy-Paste Password

---

**Last Updated:** 2025-02-25  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅
