# Match Bonus Implementation Guide

## Overview
Added a `bonus` attribute to the Match entity to set default participation bonuses for specific matches. This allows coaches to configure different bonus amounts based on match importance, competition level, or other factors.

## Implementation Details

### 1. Type Definitions Updated

#### Match Interface
```typescript
export interface Match {
  id: number;
  nomMatch: string;
  city: string;
  opposition: string;
  dateTime: string | Date;
  formation?: string;
  bonus?: number; // NEW: Default participation bonus for this match
  team: { ... };
  // ... other fields
}
```

#### DTOs Updated
```typescript
export interface CreateMatchDto {
  // ... existing fields
  bonus?: number; // NEW: Default participation bonus for this match
}

export interface UpdateMatchDto {
  // ... existing fields  
  bonus?: number; // NEW: Default participation bonus for this match
}
```

### 2. UI Components Updated

#### Match Management Form
- **Create Match Dialog**: Added "Participation Bonus" field (number input with step 0.01)
- **Edit Match Dialog**: Added "Participation Bonus" field 
- **Match Details View**: Shows participation bonus when set

#### Form State Management
```typescript
const [matchForm, setMatchForm] = useState({
  // ... existing fields
  bonus: "", // NEW: Default participation bonus
})
```

### 3. Business Logic Integration

#### Tactical Planner Enhancement
The tactical planner now uses the match bonus when assigning players:

```typescript
// For starters: Use match bonus or default (500)
bonus: match.bonus || 500

// For substitutes: Use half match bonus or default (250)  
bonus: match.bonus ? match.bonus * 0.5 : 250
```

### 4. User Experience Features

#### Match Creation Workflow
1. **Set Match Details**: Name, opposition, city, date/time
2. **Select Team**: Choose which team is playing
3. **Configure Formation**: Optional tactical formation
4. **Set Participation Bonus**: Optional bonus amount for this match
5. **Save Match**: Creates match with all settings

#### Tactical Planning Integration
- When assigning players in tactical planner, bonuses are automatically calculated based on match settings
- Starters receive full match bonus (or 500 default)
- Substitutes receive 50% of match bonus (or 250 default)
- Automatic toast notifications show bonus calculations

### 5. Examples & Use Cases

#### Different Match Types
```typescript
// League match - standard bonus
{ nomMatch: "vs City FC", bonus: 300 }

// Cup final - higher bonus
{ nomMatch: "Cup Final vs United", bonus: 1000 }

// Friendly match - lower bonus  
{ nomMatch: "Friendly vs Academy", bonus: 100 }

// No bonus set - uses defaults
{ nomMatch: "Training Match", bonus: undefined }
```

#### Automatic Bonus Calculation
- **Match bonus: 800**
  - Starters get: 800 each
  - Substitutes get: 400 each (50% of match bonus)

- **No match bonus set**
  - Starters get: 500 each (default)
  - Substitutes get: 250 each (default)

### 6. Technical Benefits

#### Flexibility
- Different bonus structures per match
- Optional field - backward compatible
- Automatic fallback to defaults

#### Business Logic
- Coaches can incentivize important matches
- Clear bonus structure for players
- Transparent calculation in UI

#### Data Management
- Stored at match level for consistency
- Applied automatically during player assignment
- Historical tracking of match bonuses

### 7. Future Enhancements

Potential improvements for future iterations:
- **Role-based multipliers**: Different percentages for different roles
- **Performance bonuses**: Additional bonuses based on match outcomes
- **Budget validation**: Check against team budget before setting high bonuses
- **Bonus templates**: Predefined bonus structures for different competition types
- **Player notifications**: Alert players about bonus amounts for upcoming matches

## Usage Instructions

### Setting Match Bonus
1. Go to **Match Management** → **Schedule Match**
2. Fill in basic match details
3. Enter **Participation Bonus** amount (optional)
4. Save match

### Using in Tactical Planning
1. Open **Tactical Planner** for a match
2. Assign players to positions
3. Bonuses are automatically calculated based on match settings
4. Save tactical plan - bonuses are applied to all participants

The implementation provides a flexible, user-friendly way to manage match-specific bonuses while maintaining backward compatibility and clear business logic.
