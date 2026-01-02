# Fix Google One Tap Error

## Current Error
"Can't continue with google.com. Something went wrong"

## Root Cause
The Client ID in the code doesn't match your authorized domain configuration in Google Cloud Console.

## Fix Steps

### 1. Get the Correct Web Client ID

1. Go to: https://console.cloud.google.com/apis/credentials?project=confi360-7c790
2. Look for **OAuth 2.0 Client IDs** section
3. Find your **Web client** (NOT Android/iOS)
4. Click on the client name
5. Copy the **Client ID** (should look like: `266108283870-xxxxx.apps.googleusercontent.com`)

### 2. Configure Authorized Domains

While in the OAuth client settings:

**Authorized JavaScript origins:**
- Add: `https://confi360-7c790.web.app`
- Add: `https://confi360-7c790.firebaseapp.com`
- Add: `http://localhost:3000` (for local testing)

**Authorized redirect URIs:**
- Add: `https://confi360-7c790.web.app/__/auth/handler`
- Add: `https://confi360-7c790.firebaseapp.com/__/auth/handler`
- Add: `http://localhost:3000/__/auth/handler`

Click **SAVE**

### 3. Update the Code

Replace the Client ID in: `src/context/AuthContext.tsx` (line 61)

```typescript
const clientId = 'YOUR_ACTUAL_CLIENT_ID_HERE';
```

### 4. Redeploy

```bash
cd backend/frontend_2/frontend-next
npm run build
firebase deploy --only hosting
```

### 5. Clear Browser Cache

- Open your app in an **incognito/private window**
- Or clear browser cache and cookies
- The One Tap prompt should now work

## Alternative: Disable One Tap Temporarily

If you want to skip One Tap for now and use only the regular "Sign in with Google" button:

Comment out the One Tap useEffect in `AuthContext.tsx`:

```typescript
// useEffect(() => {
//   if (typeof window === 'undefined' || user) return;
//   ... entire One Tap initialization code ...
// }, [user]);
```

The regular Google Sign-In button will still work fine.
