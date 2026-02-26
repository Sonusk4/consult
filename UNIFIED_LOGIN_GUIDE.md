# Unified Login Flow (Email + Password Only)

## Overview
Remove separate enterprise member login. When user accepts enterprise invitation, they get:
- Automatic consultant profile creation
- Email-based login (no username needed)
- Auto-generated permanent password

## Current Flow (TO REMOVE)

```
User registers → Gets invited to enterprise → Accepts invite → Sets username + password → Logs in with username
```

## New Flow (DESIRED)

```
User invited to enterprise → Accepts invite → Auto-creates consultant + sets password → Logs in with email + password
```

---

## Backend Changes Required

### 1. Modified Accept Invitation Endpoint
**Endpoint:** `POST /enterprise/accept-invite`

**Changed behavior:**
- Accept invitation (Firebase auth)
- Create/update consultant profile
- Auto-generate permanent password (hashed email + timestamp)
- Set role to "CONSULTANT" (or "USER" if flexible)
- Remove temp_username/temp_password usage

**Pseudo code:**
```javascript
app.post("/enterprise/accept-invite", async (req, res) => {
  const { token, firebase_uid, phone, name } = req.body;
  
  // Find invitation
  const invitedUser = await prisma.user.findUnique({
    where: { invite_token: token }
  });
  
  // Validate token not expired
  if (invitedUser.invite_token_expiry < new Date()) {
    return res.status(400).json({ error: "Invitation expired" });
  }
  
  // Auto-generate permanent password from email
  const autoPassword = `${invitedUser.email.split('@')[0]}@ConsultaPro2025`;
  const hashedPassword = await bcrypt.hash(autoPassword, 10);
  
  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: invitedUser.id },
    data: {
      firebase_uid,
      name: name || invitedUser.name,
      phone,
      is_verified: true,
      role: "USER", // Simple user role
      permanent_password: hashedPassword,
      password_changed: false, // Prompt password change on first login
      invite_token: null,
      invite_token_expiry: null
    }
  });
  
  // Create consultant profile
  await prisma.consultant.upsert({
    where: { userId: updatedUser.id },
    update: {},
    create: {
      userId: updatedUser.id,
      type: "individual"
    }
  });
  
  // Create user profile
  await prisma.userProfile.upsert({
    where: { userId: updatedUser.id },
    update: {},
    create: { userId: updatedUser.id }
  });
  
  return res.json({
    message: "Invitation accepted",
    user: updatedUser,
    initialPassword: autoPassword, // Send to user via email (not API response in production)
    needsPasswordChange: true
  });
});
```

### 2. Simplify Login to Email + Password Only
**Remove:** `POST /auth/login-member` (username-based)
**Keep:** `POST /auth/login-password` with modifications

**Modified endpoint:**
```javascript
app.post("/auth/login-password", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: "Email and password are required" 
    });
  }
  
  try {
    // Find user by email only
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        consultant: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }
    
    // Check if user accepted invitation
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: "Please accept the enterprise invitation first",
        invitationPending: true
      });
    }
    
    // Verify password
    const passwordValid = user.permanent_password 
      ? await bcrypt.compare(password, user.permanent_password)
      : false;
    
    if (!passwordValid) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }
    
    // Check if first login (needs password change)
    if (!user.password_changed) {
      // Return token with flag to prompt password change
      const tempToken = jwt.sign(
        { email: user.email, uid: user.id, temp: true },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );
      
      return res.json({
        message: "First login - please set a new password",
        tempToken,
        requiresPasswordChange: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }
    
    // Generate permanent token
    const token = jwt.sign(
      { email: user.email, uid: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isConsultant: !!user.consultant
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});
```

### 3. New Endpoint: Change Password on First Login
**Endpoint:** `POST /auth/change-password-first-login`

```javascript
app.post("/auth/change-password-first-login", verifyToken, async (req, res) => {
  const { newPassword } = req.body;
  
  if (!req.user.uid || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ 
      error: "Valid new password required (min 8 characters)" 
    });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.uid },
      data: {
        permanent_password: hashedPassword,
        password_changed: true
      }
    });
    
    // Generate permanent token after password change
    const token = jwt.sign(
      { email: updatedUser.email, uid: updatedUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: "Password changed successfully",
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
});
```

### 4. Remove Endpoints (No Longer Used)
- ~~`POST /auth/login-member`~~ (username-based member login)
- ~~`POST /auth/set-permanent-credentials`~~ (manual credential setup)
- ~~`POST /auth/check-username`~~ (username availability check)

---

## Frontend Changes Required

### 1. Update Invitation Acceptance Flow
File: `frontend/pages/InviteAcceptPage.tsx`

```typescript
// Before: Required username selection
// After: Auto-generate password, prompt for first-time password change

const handleAcceptInvitation = async () => {
  try {
    // Accept invitation via Firebase
    const idToken = await user.getIdToken();
    
    const response = await api.post("/enterprise/accept-invite", {
      token: inviteToken,
      firebase_uid: user.uid,
      phone: userPhone,
      name: userName
    });
    
    // Show initial password (for reference)
    setInitialPassword(response.data.initialPassword);
    setShowPasswordChangePrompt(true);
    
  } catch (error) {
    setError(error.message);
  }
};

// On first login, user must change password
const handleChangeFirstPassword = async (newPassword: string) => {
  try {
    const response = await api.post("/auth/change-password-first-login", {
      newPassword
    });
    
    // Save token and redirect to profile
    localStorage.setItem("authToken", response.data.token);
    navigate("/consultant-profile");
    
  } catch (error) {
    setError(error.message);
  }
};
```

### 2. Simplify Login Page
File: `frontend/pages/AuthPage.tsx`

```typescript
// Remove: Username/temp-password login
// Keep: Email + Password login only

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post("/auth/login-password", {
        email,
        password
      });
      
      if (response.data.requiresPasswordChange) {
        // Show password change modal
        setShowPasswordChange(true);
        // Store temp token for password change
        sessionStorage.setItem("tempToken", response.data.tempToken);
      } else {
        // Save token - user is logged in
        localStorage.setItem("authToken", response.data.token);
        navigate("/consultant-dashboard");
      }
      
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
    }
  };
  
  const handleChangePassword = async () => {
    try {
      const response = await api.post("/auth/change-password-first-login", {
        newPassword
      });
      
      localStorage.setItem("authToken", response.data.token);
      navigate("/consultant-dashboard");
      
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
      <button type="submit">Login</button>
      
      {showPasswordChange && (
        <PasswordChangeModal
          onSubmit={handleChangePassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
        />
      )}
    </form>
  );
};
```

### 3. Update API Service
File: `frontend/services/api.ts`

```typescript
export const auth = {
  // Remove: loginMember(username, password)
  
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login-password", { email, password });
    return response.data;
  },
  
  changePasswordFirstLogin: async (newPassword: string) => {
    const response = await api.post("/auth/change-password-first-login", {
      newPassword
    });
    return response.data;
  },
  
  acceptInvitation: async (token: string, firebase_uid: string, phone: string, name: string) => {
    const response = await api.post("/enterprise/accept-invite", {
      token,
      firebase_uid,
      phone,
      name
    });
    return response.data;
  }
};
```

---

## Database Schema (Updated User Model)

Remove these fields (no longer used):
- `temp_username` - Not needed
- `temp_password` - Not needed
- `permanent_username` - Not needed (use email)

Keep these fields:
- `email` - Use for login (primary identifier)
- `permanent_password` - Hashed password
- `password_changed` - Flag for first login
- `is_verified` - Invitation accepted
- `invite_token` - For accepting invitations
- `invite_token_expiry` - Token expiry

---

## Login Flow Diagram

```
┌─────────────────────────────────────┐
│  User receives enterprise invite    │
│  (email with accept link)           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Click "Accept Invitation"          │
│  Provides: Firebase auth + phone    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Backend:                           │
│  1. Validate token                  │
│  2. Create consultant profile       │
│  3. Auto-generate password          │
│  4. Set password_changed = false    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Show initial password              │
│  "Your temp password: {email}@..."  │
│  Redirect to login                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Login with email + password        │
│  GET /auth/login-password           │
└────────────┬────────────────────────┘
             │
             ├─ requiresPasswordChange: true
             │  ▼
             │ ShowPasswordChangeModal
             │  │
             │  ▼
             │ POST /auth/change-password-first-login
             │  │
             │  └─→ Generate permanent token
             │
             └─ Login successful with token
```

---

## Testing Checklist

- [ ] User receives email invite
- [ ] Click invite link → Firebase redirect
- [ ] Accept invitation form accepts Firebase auth
- [ ] Backend creates consultant profile
- [ ] Initial password displayed
- [ ] Login page shows email + password fields
- [ ] First login with initial password
- [ ] Prompted for password change (modal)
- [ ] Change password successfully
- [ ] Redirected to consultant dashboard with token
- [ ] Subsequent logins work with new password
- [ ] Email used (not username) in all places
- [ ] Consultant profile accessible after login

---

## Security Notes

1. **Auto-generated password** format:
   - First part of email + timestamp
   - Example: `user@ConsultaPro2025`
   - Or random 12 chars if you prefer
   - Sent via email notification, NOT in API response

2. **Password change required** on first login:
   - Set `password_changed: false` initially
   - Prompt user on next login
   - Force change before accessing resources

3. **Token expiry**:
   - Temp token: 30 minutes (for password change)
   - Permanent token: 24 hours
   - Temp token only valid for password change endpoint

4. **No session tokens**:
   - Use JWT for stateless auth
   - Include user ID and email in token claims
   - Verify token on protected routes

---

## Migration for Existing Users

If you have existing enterprise members:

```sql
-- Remove username fields from existing users
UPDATE users 
SET temp_username = NULL,
    temp_password = NULL,
    permanent_username = NULL
WHERE role = 'ENTERPRISE_MEMBER';

-- Set initial password to their email-based format
UPDATE users 
SET permanent_password = bcrypt(CONCAT(split_part(email, '@', 1), '@ConsultaPro2025')),
    password_changed = false
WHERE role = 'ENTERPRISE_MEMBER' AND permanent_password IS NULL;
```
