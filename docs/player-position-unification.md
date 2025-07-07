# Player Position Unification

This document describes the unification of player positions between the Player Management system and the Tactical Planner.

## Problem

Previously, the Player Management system used generic positions like:
- "Goalkeeper"
- "Defender"
- "Midfielder"
- "Forward"

While the Tactical Planner used specific tactical roles like:
- "GK", "LB", "CB", "RB", "LWB", "RWB"
- "CDM", "CM", "CAM", "LM", "RM"
- "LW", "RW", "ST"

This created inconsistency when assigning players to tactical positions.

## Solution

### Unified Position System

All player positions are now unified in `lib/utils.ts` with two utility functions:

1. **`getTacticalPositions()`** - Returns all available positions
2. **`getPositionDisplayName(position)`** - Returns formatted display names

### Tactical Field Positions

These positions match the roles used in formations:
- **GK** - Goalkeeper
- **LB** - Left Back
- **CB** - Center Back
- **RB** - Right Back
- **LWB** - Left Wing Back
- **RWB** - Right Wing Back
- **CDM** - Defensive Midfielder
- **CM** - Center Midfielder
- **CAM** - Attacking Midfielder
- **LM** - Left Midfielder
- **RM** - Right Midfielder
- **LW** - Left Winger
- **RW** - Right Winger
- **ST** - Striker

### Staff Positions

Non-playing positions for team management:
- Coach
- Assistant Coach
- Physiotherapist
- Manager

## Implementation

### Utility Functions (`lib/utils.ts`)
- **`getTacticalFieldPositions()`** - Returns only field positions for player creation
- **`getTacticalPositions()`** - Returns all positions including staff roles for filtering/display
- **`getPositionDisplayName(position)`** - Returns formatted display names

### Player Form (`components/team-management/player-form.tsx`)
- Updated to use `getTacticalFieldPositions()` for the position dropdown (field positions only)
- **NEW**: Uses searchable Combobox component instead of basic Select dropdown
- Displays friendly names using `getPositionDisplayName()`
- **NEW**: Only shows tactical field positions (no staff roles like Coach, Manager)
- Position values stored in database use tactical abbreviations (e.g., "GK", "CM")
- **NEW**: Supports search functionality to quickly find positions (e.g., type "goal" to find "GK - Goalkeeper")

### Tactical Planner (`components/tactical-planner.tsx`)
- Already uses tactical abbreviations in formations
- No changes needed - positions remain consistent

## Benefits

1. **Consistency** - Same position codes used throughout the app
2. **Accurate Assignment** - Players can be properly assigned to tactical positions
3. **Maintainability** - Centralized position definitions
4. **Extensibility** - Easy to add new positions or formations
5. **Improved UX** - Searchable dropdown with grouped options for easier position selection
6. **Professional UI** - Modern combobox component with search and keyboard navigation

## Future Considerations

If formations are modified in the tactical planner, the position list can be updated in `lib/utils.ts` or dynamically extracted using the `extractPositionsFromFormations()` utility function.
