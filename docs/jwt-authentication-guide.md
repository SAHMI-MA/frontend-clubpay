# JWT Authentication in Contract Management

## Overview

The contract management system now has robust JWT token authentication built-in. Every contract-related API request automatically includes the JWT token in the Authorization header, ensuring secure access to contract data.

## Authentication Flow

### 1. Token Storage
The system supports multiple token storage methods for compatibility:
- `localStorage.getItem('auth_token')` (primary)
- `localStorage.getItem('authToken')` (fallback)
- `sessionStorage.getItem('authToken')` (session-only)

### 2. Automatic Token Inclusion
Every contract API request automatically:
- ✅ Checks for a valid JWT token before making the request
- ✅ Includes the token in the `Authorization: Bearer <token>` header
- ✅ Validates token format (JWT structure)
- ✅ Provides detailed logging for debugging

### 3. Authentication Validation
Before any contract operation, the system:
```typescript
// Example: Creating a contract
export const createPlayerContract = createAsyncThunk(
  'contracts/createPlayerContract',
  async (contractData: CreatePlayerContractDto, { rejectWithValue }) => {
    try {
      // 🔐 Authentication check happens here automatically
      if (!tokenUtils.hasAuthToken()) {
        throw new Error('Authentication required: Please login to create contracts.');
      }
      
      // JWT token is automatically added to the request
      const data = await contractApi.createPlayerContract(contractData);
      return data;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);
```

## API Request Examples

### With Authentication (Automatic)
```typescript
// This request automatically includes JWT token
const contracts = await contractApi.getContracts('player', 'active');

// The actual HTTP request includes:
// Headers: {
//   'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   'Content-Type': 'application/json'
// }
```

### Authentication Status Check
```typescript
import { tokenUtils } from '@/lib/api';

// Check if user is authenticated
if (tokenUtils.hasAuthToken()) {
  // User is authenticated, proceed with contract operations
  dispatch(fetchPlayerContracts('active'));
} else {
  // Redirect to login
  console.log('User not authenticated, redirecting to login');
}
```

## Error Handling

### 1. Authentication Errors (401)
```typescript
// Automatic handling of 401 errors
if (response.status === 401) {
  console.error('Authentication failed (401 Unauthorized)');
  // Automatically clears invalid token
  removeAuthToken();
  throw new Error('Your session has expired. Please log in again.');
}
```

### 2. Permission Errors (403)
```typescript
// Automatic handling of 403 errors
if (response.status === 403) {
  console.error('Authorization failed (403 Forbidden)');
  throw new Error('You do not have permission to perform this action.');
}
```

### 3. Missing Token Errors
```typescript
// Before making requests to protected endpoints
const protectedEndpoints = ['contracts', 'players', 'staff', 'teams'];
const isProtectedEndpoint = protectedEndpoints.some(path => endpoint.includes(path));

if (isProtectedEndpoint && !authToken) {
  throw new Error(`Authentication required: No token found for accessing ${endpoint}`);
}
```

## Redux Integration

### Authentication Verification Action
```typescript
import { verifyAuthentication } from '@/lib/redux/contractSlice';

// Verify authentication before contract operations
const result = await dispatch(verifyAuthentication());
if (verifyAuthentication.fulfilled.match(result)) {
  // User is authenticated, proceed
  dispatch(fetchPlayerContracts());
} else {
  // Handle authentication failure
  console.error('Authentication failed:', result.payload);
}
```

### Authentication Selector
```typescript
import { selectIsAuthenticated } from '@/lib/redux/contractSlice';

const MyComponent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <ContractManagement />;
};
```

## Usage in Components

### 1. Automatic Authentication Check
```typescript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlayerContracts,
  selectPlayerContracts,
  selectContractsError,
  selectIsAuthenticated
} from '@/lib/redux/contractSlice';

const ContractsList = () => {
  const dispatch = useDispatch();
  const contracts = useSelector(selectPlayerContracts);
  const error = useSelector(selectContractsError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  useEffect(() => {
    if (isAuthenticated) {
      // JWT token is automatically included
      dispatch(fetchPlayerContracts('active'));
    } else {
      console.log('User not authenticated, cannot fetch contracts');
    }
  }, [dispatch, isAuthenticated]);
  
  // Handle authentication errors
  if (error?.includes('Authentication required')) {
    return (
      <div className="auth-error">
        <p>Please log in to view contracts</p>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {contracts.map(contract => (
        <div key={contract.id}>{contract.title}</div>
      ))}
    </div>
  );
};
```

### 2. Create Contract with Authentication
```typescript
const CreateContractForm = ({ playerId }) => {
  const dispatch = useDispatch();
  const error = useSelector(selectContractsError);
  
  const handleSubmit = async (formData) => {
    try {
      // JWT token automatically included in the request
      const result = await dispatch(createPlayerContract({
        title: formData.title,
        playerId: playerId,
        salary: formData.salary,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hasBonus: formData.hasBonus
      }));
      
      if (createPlayerContract.fulfilled.match(result)) {
        console.log('✅ Contract created successfully');
      }
    } catch (error) {
      console.error('❌ Failed to create contract:', error);
    }
  };
  
  // Handle authentication errors
  if (error?.includes('Authentication required')) {
    return <div>Please log in to create contracts</div>;
  }
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

## Debugging Authentication

### 1. Console Logging
The system provides detailed console logs:
```
✅ Adding auth token to request: contracts
🔍 Fetching contracts with filters - Type: player, Status: active
🔐 Creating player contract with authenticated request
➕ Creating player contract for player ID: player-123
```

### 2. Error Messages
Clear error messages for authentication issues:
```
🚫 Authentication required for protected endpoint: contracts
⚠️ No auth token available for request: contracts
❌ Authentication failed (401 Unauthorized)
```

### 3. Token Validation
```typescript
import { tokenUtils } from '@/lib/api';

// Check token validity
const token = tokenUtils.getAuthToken();
console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'None');
console.log('Token valid format:', token ? tokenUtils.isValidJwtFormat(token) : false);
console.log('Has token:', tokenUtils.hasAuthToken());
```

## Security Features

### 1. Automatic Token Cleanup
- Invalid or expired tokens are automatically removed
- Failed authentication attempts clear stored tokens
- Multiple storage locations are cleaned simultaneously

### 2. Request Validation
- All contract endpoints require authentication
- Tokens are validated before API calls
- JWT format validation prevents invalid tokens

### 3. Error Boundaries
- Graceful handling of authentication failures
- Clear user feedback for auth issues
- Automatic redirect suggestions for login

## Best Practices

### 1. Always Check Authentication Status
```typescript
// Before any contract operation
const isAuthenticated = useSelector(selectIsAuthenticated);
if (!isAuthenticated) {
  // Handle unauthenticated state
  return <LoginRequired />;
}
```

### 2. Handle Authentication Errors Gracefully
```typescript
const error = useSelector(selectContractsError);
if (error?.includes('Authentication required')) {
  // Show login prompt instead of error message
  return <LoginPrompt message="Please log in to access contracts" />;
}
```

### 3. Use Authentication Verification for Critical Operations
```typescript
// For important operations, verify auth first
const handleDeleteContract = async (contractId) => {
  const authResult = await dispatch(verifyAuthentication());
  if (verifyAuthentication.fulfilled.match(authResult)) {
    await dispatch(deletePlayerContract(contractId));
  } else {
    // Handle authentication failure
    setError('Please log in again to delete contracts');
  }
};
```

## Token Management

### Setting Tokens (After Login)
```typescript
import { tokenUtils } from '@/lib/api';

// After successful login
const loginResponse = await authService.login(credentials);
tokenUtils.setAuthToken(loginResponse.access_token);

// Token is now automatically included in all contract requests
```

### Removing Tokens (Logout)
```typescript
import { tokenUtils } from '@/lib/api';

// During logout
tokenUtils.removeAuthToken();

// All subsequent contract requests will require re-authentication
```

The contract management system now provides comprehensive JWT authentication with automatic token inclusion, robust error handling, and clear user feedback for authentication-related issues.
