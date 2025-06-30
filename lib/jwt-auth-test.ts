// JWT Authentication Test for Contract Management
// This file can be used to test authentication functionality

import { tokenUtils } from '@/lib/api';
import { contractApi } from '@/lib/api/contract-api';

/**
 * Test JWT authentication functionality
 */
export const testJWTAuthentication = async () => {
  console.log('🧪 Testing JWT Authentication for Contract Management');
  
  // Test 1: Check token utilities
  console.log('📝 Test 1: Token Utilities');
  console.log('Has token:', tokenUtils.hasAuthToken());
  const currentToken = tokenUtils.getAuthToken();
  console.log('Current token:', currentToken ? `${currentToken.substring(0, 20)}...` : 'None');
  
  if (currentToken) {
    console.log('Token valid format:', tokenUtils.isValidJwtFormat(currentToken));
  }
  
  // Test 2: Test contract API with authentication
  console.log('\n📝 Test 2: Contract API Authentication');
  try {
    if (tokenUtils.hasAuthToken()) {
      console.log('✅ Token available, testing contract API...');
      
      // This should work with valid token
      const contracts = await contractApi.getContracts('player', 'active');
      console.log('✅ Successfully fetched contracts:', contracts.length);
      
    } else {
      console.log('❌ No token available, testing should fail...');
      
      // This should fail without token
      try {
        await contractApi.getContracts('player', 'active');
        console.log('❌ UNEXPECTED: Request succeeded without token');
      } catch (error: any) {
        console.log('✅ EXPECTED: Request failed without token:', error?.message || error);
      }
    }
  } catch (error: any) {
    console.log('❌ Contract API test failed:', error?.message || error);
  }
  
  // Test 3: Test token validation
  console.log('\n📝 Test 3: Token Validation');
  const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const invalidToken = 'invalid-token-format';
  
  console.log('Valid JWT format test:', tokenUtils.isValidJwtFormat(validJWT));
  console.log('Invalid token format test:', tokenUtils.isValidJwtFormat(invalidToken));
  
  // Test 4: Test authentication error handling
  console.log('\n📝 Test 4: Authentication Error Handling');
  try {
    // Temporarily clear token
    const originalToken = tokenUtils.getAuthToken();
    tokenUtils.removeAuthToken();
    
    console.log('Token cleared, testing authentication requirement...');
    await contractApi.getContracts('player');
    console.log('❌ UNEXPECTED: Request succeeded without authentication');
    
    // Restore original token if it existed
    if (originalToken) {
      tokenUtils.setAuthToken(originalToken);
    }
  } catch (error: any) {
    console.log('✅ EXPECTED: Authentication required error:', error?.message || error);
    
    // Restore original token if it existed
    if (currentToken) {
      tokenUtils.setAuthToken(currentToken);
    }
  }
  
  console.log('\n✅ JWT Authentication tests completed!');
};

/**
 * Test authentication in Redux slice
 */
export const testReduxAuthentication = async (dispatch: any) => {
  console.log('🧪 Testing Redux Authentication');
  
  try {
    // Import the actions
    const { verifyAuthentication, fetchPlayerContracts } = await import('@/lib/redux/contractSlice');
    
    // Test authentication verification
    console.log('📝 Testing authentication verification...');
    const authResult = await dispatch(verifyAuthentication());
    
    if (verifyAuthentication.fulfilled.match(authResult)) {
      console.log('✅ Authentication verified successfully');
      
      // Test fetching contracts
      console.log('📝 Testing contract fetching...');
      const contractsResult = await dispatch(fetchPlayerContracts('active'));
      
      if (fetchPlayerContracts.fulfilled.match(contractsResult)) {
        console.log('✅ Contracts fetched successfully:', contractsResult.payload.length);
      } else {
        console.log('❌ Failed to fetch contracts:', contractsResult.payload);
      }
    } else {
      console.log('❌ Authentication verification failed:', authResult.payload);
    }
  } catch (error: any) {
    console.log('❌ Redis authentication test failed:', error?.message || error);
  }
};

/**
 * Usage example:
 * 
 * // In a React component or test file:
 * import { testJWTAuthentication, testReduxAuthentication } from './jwt-auth-test';
 * 
 * // Test basic JWT functionality
 * testJWTAuthentication();
 * 
 * // Test Redux integration (requires dispatch)
 * const dispatch = useDispatch();
 * testReduxAuthentication(dispatch);
 */
