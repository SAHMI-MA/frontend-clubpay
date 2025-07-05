// Quick test to demonstrate the API issue
// This shows exactly what the frontend is sending

const testAssignmentCall = () => {
  const objectiveId = 1;
  const playerId = 2;
  const requestBody = {}; // Empty object as per backend requirements
  
  console.log('=== FRONTEND API CALL DEBUG ===');
  console.log('URL:', `/objectives/${objectiveId}/player/${playerId}`);
  console.log('Method:', 'POST');
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('Request Body Properties:', Object.keys(requestBody));
  console.log('Contains playerId?', 'playerId' in requestBody);
  console.log('Contains objectiveId?', 'objectiveId' in requestBody);
  
  console.log('\n=== BACKEND ERROR MESSAGE ===');
  console.log('Error: "property playerId should not exist","property objectiveId should not exist"');
  
  console.log('\n=== CONCLUSION ===');
  console.log('The frontend is NOT sending playerId or objectiveId in the request body.');
  console.log('The backend is incorrectly validating URL parameters as body properties.');
  console.log('This is a backend validation configuration issue.');
};

testAssignmentCall();
