// Simple test to check the current state of objectives and groups
console.log('=== OBJECTIVE MANAGEMENT DEBUG TEST ===');

// Test the API endpoints directly
const testAPI = async () => {
  // Read API URL from environment variable or use default
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  try {
    // Test groups endpoint
    const groupsResponse = await fetch(`${baseURL}/objectives/groups`);
    const groups = await groupsResponse.json();
    console.log('Groups from API:', groups);
    
    // Test objectives endpoint
    const objectivesResponse = await fetch(`${baseURL}/objectives`);
    const objectives = await objectivesResponse.json();
    console.log('Objectives from API:', objectives);
    
    // Check the mapping
    console.log('\nGroup-Objective mapping:');
    groups.forEach(group => {
      const groupObjectives = objectives.filter(obj => obj.objectiveGroupId === group.id);
      console.log(`- Group ${group.id} (${group.name}): ${groupObjectives.length} objectives`);
      groupObjectives.forEach(obj => {
        console.log(`  - Objective ${obj.id}: ${obj.title} (groupId: ${obj.objectiveGroupId})`);
      });
    });
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

testAPI();
