// Test script to verify the filtering logic for invalid progress objects
// This simulates what happens when the backend returns progress objects with zero IDs

interface PlayerObjectiveProgress {
  id: number;
  player: {
    id: number;
    firstName: string;
    lastName: string;
  };
  objective: {
    id: number;
    title?: string;
    name: string;
    bonusAmount: number;
  };
  isCompleted: boolean;
}

// Simulate the backend response with invalid progress objects
const mockBackendResponse: PlayerObjectiveProgress[] = [
  {
    id: 0,
    player: { id: 0, firstName: "", lastName: "" },
    objective: { id: 0, title: "", name: "", bonusAmount: 0 },
    isCompleted: false
  },
  {
    id: 0,
    player: { id: 0, firstName: "", lastName: "" },
    objective: { id: 0, title: "", name: "", bonusAmount: 0 },
    isCompleted: false
  },
  {
    id: 1,
    player: { id: 1, firstName: "John", lastName: "Doe" },
    objective: { id: 1, title: "Score 5 goals", name: "Score 5 goals", bonusAmount: 1000 },
    isCompleted: false
  }
];

// Apply the same filtering logic from our Redux slice
const validProgress = mockBackendResponse.filter((progress: PlayerObjectiveProgress) => 
  progress.id > 0 && 
  progress.player?.id > 0 &&
  progress.objective?.id > 0
);

console.log('--- Backend Response Filtering Test ---');
console.log('Total received:', mockBackendResponse.length);
console.log('Valid progress objects:', validProgress.length);
console.log('Invalid progress objects filtered out:', mockBackendResponse.length - validProgress.length);

console.log('\nValid progress objects:');
validProgress.forEach((p, index) => {
  console.log(`  ${index + 1}. Player ${p.player.firstName} ${p.player.lastName} (ID: ${p.player.id})`);
  console.log(`     Objective: ${p.objective.title} (ID: ${p.objective.id})`);
  console.log(`     Bonus: $${p.objective.bonusAmount}`);
});

console.log('\nInvalid progress objects (filtered out):');
const invalidProgress = mockBackendResponse.filter(p => 
  p.id === 0 || p.player?.id === 0 || p.objective?.id === 0
);
invalidProgress.forEach((p, index) => {
  console.log(`  ${index + 1}. IDs: progress=${p.id}, player=${p.player?.id}, objective=${p.objective?.id}`);
});

console.log('\n--- Test Complete ---');
