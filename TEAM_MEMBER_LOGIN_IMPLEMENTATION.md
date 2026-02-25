# Enterprise Team Member Login Implementation

## Overview
Implemented a dedicated username/password login system for enterprise team members. They can now login using the temporary credentials provided by their enterprise administrator, without needing to go through email-based OTP signup.

## Changes Made

### 1. Backend: New Member Login Endpoint
**File:** `backend-new/index.js` (Lines ~995-1070)

**Endpoint:** `POST /auth/login-member`

**Purpose:** Authenticate enterprise team members using their temporary username and password

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "customToken": "JWT_TOKEN",
  "devMode": true/false,
  "user": {
    "id": "user_id",
    "email": "member@email.com",
    "name": "Member Name",
    "role": "ENTERPRISE_MEMBER"
  }
}
```

**Response (Failure):**
```json
{
  "error": "Invalid username or password"
}
```

**Validation:**
- Checks if user exists with `temp_username`
- Verifies `temp_password` matches
- Ensures user has accepted invitation (`is_verified = true`)
- Returns 401 for invalid credentials
- Returns 403 if invitation not accepted yet

**Authentication Flow:**
1. Locate user by `temp_username` and ENTERPRISE_MEMBER role
2. Verify password matches `temp_password`
3. Generate JWT token (dev mode) or Firebase custom token (production)
4. Return token and user information

### 2. Backend: Enhanced Send-OTP Endpoint
**File:** `backend-new/index.js` (Lines ~746-850)

**Security Restrictions Added:**
1. Blocks existing ENTERPRISE_MEMBER users from using OTP-based login
   - Returns 403: "Enterprise team members must login with their provided credentials"
2. Prevents new ENTERPRISE_MEMBER signups via `/auth/send-otp`
   - Returns 403: "Enterprise team members cannot sign up independently"
   - Suggests requesting invitation from administrator

**Error Messages:**
- 403: "Enterprise team members must login with their provided credentials"
- 403: "Enterprise team members cannot sign up independently"

### 3. Frontend: API Service Addition
**File:** `frontend/services/api.ts` (Added loginMember method)

**New Method:**
```typescript
auth.loginMember = async (username: string, password: string) => {
  // Calls POST /auth/login-member
  // Returns: {customToken, devMode, user}
}
```

**Usage:**
```typescript
const response = await auth.loginMember(username, password);
localStorage.setItem("devToken", response.customToken);
// User can now make authenticated API calls
```

### 4. Frontend: AuthPage Component Update
**File:** `frontend/pages/AuthPage.tsx`

**Changes:**

#### New Auth Step Type
Added `MEMBER_LOGIN` to `AuthStep` union type:
```typescript
type AuthStep = "ROLE" | "EMAIL" | "OTP" | "PASSWORD" | "MEMBER_LOGIN";
```

#### New State Variables
```typescript
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
```

#### Updated Role Selection Logic
```typescript
const handleRoleSelect = (role: UserRole) => {
  if (role === UserRole.ENTERPRISE_MEMBER) {
    if (type === "SIGNUP") {
      // Prevent team members from signing up
      setError("Enterprise team members cannot sign up independently...");
      setShowLoginRedirect(true);
      return;
    }
    setStep("MEMBER_LOGIN"); // Go to username/password form
  } else {
    setStep("EMAIL"); // Regular email/OTP flow
  }
};
```

#### New Login Handler
```typescript
const handleMemberLogin = async (e: React.FormEvent) => {
  // 1. Call auth.loginMember(username, password)
  // 2. Store JWT token in localStorage if dev mode
  // 3. Sign in with Firebase if production
  // 4. Navigate to /member/dashboard
};
```

#### UI Changes

**Role Selection (LOGIN mode):**
- ENTERPRISE_MEMBER option now only visible in LOGIN mode
- Hidden from SIGNUP mode entirely
- Other roles renamed for clarity:
  - "Enterprise Partner" → "Enterprise Admin"

**Role Selection (SIGNUP mode):**
- ENTERPRISE_MEMBER option completely hidden
- Only allows USER, CONSULTANT, ENTERPRISE_ADMIN signup

**New Member Login Form:**
- Username input field (required)
- Password input field (required)
- Error message if credentials invalid
- Loading state during login
- Back button to return to role selection

#### Progress Bar
Updated percentage calculation to include MEMBER_LOGIN step:
```typescript
MEMBER_LOGIN: 50, // Same as EMAIL for consistency
```

#### Helper Text
Updated demo helper box to mention team member credentials:
```
"Team members use the credentials provided by their admin."
```

## User Flows

### Team Member Registration (Admin Invites)
1. Admin clicks "Invite Member" on Team Management page
2. Admin enters member email
3. Admin receives invitation link with temporary username and password
4. Admin shares credentials with team member

### Team Member Login
1. Team member goes to `/login`
2. Selects "Enterprise Team Member" role
3. Enters username and password (from invitation)
4. System verifies credentials against `temp_username` and `temp_password`
5. Generates JWT token
6. Stores token in localStorage (dev mode)
7. Redirects to `/member/dashboard`

### Failed Signup Attempt (Team Member)
1. Team member goes to `/signup`
2. Selects "Enterprise Team Member" role
3. System shows error: "Enterprise team members cannot sign up independently"
4. Offers button to go to login page

### Try to Use OTP as Team Member
1. Team member on login page, enters their email
2. System checks if they're an ENTERPRISE_MEMBER
3. Returns 403 error with message to use member login instead

## Security Considerations

1. **Temporary Credentials**
   - All team members use temporary `temp_username` and `temp_password`
   - These are generated by admin at invitation time
   - Not user-created passwords initially

2. **One-Way Flow**
   - Team members cannot convert to regular users via OTP
   - Team members cannot re-register independently
   - Only admin can manage team member lifecycle

3. **Token-Based Authentication**
   - JWT tokens generated with 24-hour expiry
   - Credentials never stored in localStorage
   - Only tokens are stored and used for subsequent requests

4. **Error Messages**
   - Generic "Invalid username or password" returned for security
   - Doesn't leak whether username exists
   - Guidance provided on proper authentication method

## Testing Checklist

✅ Backend endpoint `/auth/login-member` working
✅ Send-OTP blocks ENTERPRISE_MEMBER users
✅ API service has `loginMember` method
✅ AuthPage shows MEMBER_LOGIN form for team members
✅ Team member login redirects to `/member/dashboard`
✅ ENTERPRISE_MEMBER hidden from signup role options
✅ Error handling for invalid credentials
✅ Error handling for unaccepted invitations

## Database Fields Used

**User Table Fields:**
- `temp_username`: Generated username for team member
- `temp_password`: Generated password for team member  
- `is_verified`: Must be true (invitation accepted) to login
- `role`: Must be "ENTERPRISE_MEMBER"
- `email`: Used for backend reference

## API Endpoint Status

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/auth/login-member` | POST | ✅ New | Team member login with username/password |
| `/auth/send-otp` | POST | ✅ Updated | Now blocks ENTERPRISE_MEMBER users |
| `/auth/verify-otp` | POST | ✅ No change | Regular OTP verification |
| `/auth/me` | POST | ✅ No change | User sync after login |

## File Summary

| File | Changes | Lines |
|------|---------|-------|
| `backend-new/index.js` | Added `/auth/login-member` endpoint + enhanced `/auth/send-otp` | ~125 lines added |
| `frontend/services/api.ts` | Added `loginMember` method | ~10 lines added |
| `frontend/pages/AuthPage.tsx` | Complete rewrite with MEMBER_LOGIN step | Full rewrite |

## Next Steps

1. **Password Reset**: Implement password reset for team members
2. **Credentials Management**: Add "Change Password" feature for team members
3. **Session Management**: Implement session timeout and refresh
4. **Audit Logging**: Log all team member login attempts
5. **MFA**: Add optional multi-factor authentication for team members

## Deployment Notes

- No database schema changes required
- Existing `temp_username` and `temp_password` fields used
- Backward compatible with existing invitation system
- Can be deployed without downtime
- Works in both dev mode (JWT) and production (Firebase)
