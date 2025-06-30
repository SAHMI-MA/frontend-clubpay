# Authentication Setup Guide

## Setting Up Authentication for Contract Management

The contract management system now requires authentication. Here's how to set it up:

### 1. Mock Authentication for Testing

If you want to test the contract management without a full auth system, you can manually set a token in your browser's developer console:

```javascript
// Open browser developer tools (F12)
// Go to Console tab and run:
localStorage.setItem('authToken', 'your-test-token-here');

// Or for session-only storage:
sessionStorage.setItem('authToken', 'your-test-token-here');
```

### 2. Integration with Authentication System

The contract management component now uses the `@/utils/auth` utility which provides:

- `getAuthToken()` - Gets token from storage
- `setAuthToken(token, persistent)` - Sets token in storage
- `removeAuthToken()` - Removes token
- `isAuthenticated()` - Checks if user is authenticated
- `getAuthHeaders()` - Gets headers for API requests
- `handleAuthError(error)` - Handles auth errors

### 3. Backend Requirements

Your backend API at `http://localhost:8080/contracts` should:

1. Accept `Authorization: Bearer <token>` header
2. Return 401 status for invalid/missing tokens
3. Return proper contract data for valid tokens

### 4. Login Page

Create a login page at `/login` that:

1. Collects user credentials
2. Calls your authentication API
3. Uses `setAuthToken(token)` to store the received token
4. Redirects to the contracts page

### 5. Example Login Implementation

```typescript
// pages/login.tsx or components/login.tsx
import { useState } from 'react';
import { setAuthToken } from '@/utils/auth';

export function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const { token } = await response.json();
        setAuthToken(token);
        window.location.href = '/contracts'; // or use router
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Your login form UI */}
    </form>
  );
}
```

### 6. Current Error Handling

The contract management component now:

- ✅ Checks authentication on mount
- ✅ Shows authentication errors clearly
- ✅ Provides retry and login buttons
- ✅ Automatically redirects to login on 401 errors
- ✅ Includes auth headers in all API requests
