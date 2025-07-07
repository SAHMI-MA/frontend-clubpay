# Player Seed Data

This file contains seed data for 15 players for a football team, including all the new attributes we've implemented.

## Team: FC Barcelona Academy

```json
[
  {
    "firstName": "Marc",
    "lastName": "Rodriguez",
    "dateOfBirth": "2001-03-15",
    "position": "GK",
    "playerNumber": 1,
    "rib": "ES9121000418450200051332",
    "playerImage": "https://example.com/players/marc-rodriguez.jpg",
    "teamId": 1
  },
  {
    "firstName": "David",
    "lastName": "Silva",
    "dateOfBirth": "2000-07-22",
    "position": "GK",
    "playerNumber": 13,
    "rib": "ES7620770024003102575766",
    "playerImage": "https://example.com/players/david-silva.jpg",
    "teamId": 1
  },
  {
    "firstName": "Carlos",
    "lastName": "Hernandez",
    "dateOfBirth": "1999-11-08",
    "position": "LB",
    "playerNumber": 3,
    "rib": "ES1000492352082414205416",
    "playerImage": "https://example.com/players/carlos-hernandez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Miguel",
    "lastName": "Torres",
    "dateOfBirth": "2000-05-14",
    "position": "CB",
    "playerNumber": 4,
    "rib": "ES6001820200123456789012",
    "playerImage": "https://example.com/players/miguel-torres.jpg",
    "teamId": 1
  },
  {
    "firstName": "Antonio",
    "lastName": "Lopez",
    "dateOfBirth": "1998-12-03",
    "position": "CB",
    "playerNumber": 5,
    "rib": "ES9420805801101234567891",
    "playerImage": "https://example.com/players/antonio-lopez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Francisco",
    "lastName": "Martinez",
    "dateOfBirth": "2001-08-17",
    "position": "RB",
    "playerNumber": 2,
    "rib": "ES7100302053091234567890",
    "playerImage": "https://example.com/players/francisco-martinez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Pablo",
    "lastName": "Ruiz",
    "dateOfBirth": "2000-02-25",
    "position": "CDM",
    "playerNumber": 6,
    "rib": "ES8930025901234567890123",
    "playerImage": "https://example.com/players/pablo-ruiz.jpg",
    "teamId": 1
  },
  {
    "firstName": "Alejandro",
    "lastName": "Moreno",
    "dateOfBirth": "1999-09-12",
    "position": "CM",
    "playerNumber": 8,
    "rib": "ES4920385778983000760236",
    "playerImage": "https://example.com/players/alejandro-moreno.jpg",
    "teamId": 1
  },
  {
    "firstName": "Sergio",
    "lastName": "Jimenez",
    "dateOfBirth": "2001-01-30",
    "position": "CM",
    "playerNumber": 14,
    "rib": "ES1020385778983000760237",
    "playerImage": "https://example.com/players/sergio-jimenez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Adrian",
    "lastName": "Vargas",
    "dateOfBirth": "2000-06-18",
    "position": "CAM",
    "playerNumber": 10,
    "rib": "ES3620385778983000760238",
    "playerImage": "https://example.com/players/adrian-vargas.jpg",
    "teamId": 1
  },
  {
    "firstName": "Luis",
    "lastName": "Alvarez",
    "dateOfBirth": "1999-04-07",
    "position": "LW",
    "playerNumber": 7,
    "rib": "ES5820385778983000760239",
    "playerImage": "https://example.com/players/luis-alvarez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Daniel",
    "lastName": "Castro",
    "dateOfBirth": "2001-10-11",
    "position": "RW",
    "playerNumber": 11,
    "rib": "ES7920385778983000760240",
    "playerImage": "https://example.com/players/daniel-castro.jpg",
    "teamId": 1
  },
  {
    "firstName": "Roberto",
    "lastName": "Fernandez",
    "dateOfBirth": "2000-03-28",
    "position": "ST",
    "playerNumber": 9,
    "rib": "ES9220385778983000760241",
    "playerImage": "https://example.com/players/roberto-fernandez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Javier",
    "lastName": "Gonzalez",
    "dateOfBirth": "1998-08-05",
    "position": "ST",
    "playerNumber": 21,
    "rib": "ES1420385778983000760242",
    "playerImage": "https://example.com/players/javier-gonzalez.jpg",
    "teamId": 1
  },
  {
    "firstName": "Manuel",
    "lastName": "Sanchez",
    "dateOfBirth": "2001-12-19",
    "position": "LM",
    "playerNumber": 16,
    "rib": "ES3620385778983000760243",
    "playerImage": "https://example.com/players/manuel-sanchez.jpg",
    "teamId": 1
  }
]
```

## Player Details Summary

### Goalkeepers (2)
- **Marc Rodriguez** (#1) - Main goalkeeper, 24 years old
- **David Silva** (#13) - Backup goalkeeper, 24 years old

### Defenders (4)
- **Carlos Hernandez** (#3) - Left Back, 25 years old
- **Miguel Torres** (#4) - Center Back, 24 years old  
- **Antonio Lopez** (#5) - Center Back (Captain), 26 years old
- **Francisco Martinez** (#2) - Right Back, 23 years old

### Midfielders (6)
- **Pablo Ruiz** (#6) - Defensive Midfielder, 24 years old
- **Alejandro Moreno** (#8) - Central Midfielder, 25 years old
- **Sergio Jimenez** (#14) - Central Midfielder, 24 years old
- **Adrian Vargas** (#10) - Attacking Midfielder (Playmaker), 24 years old
- **Luis Alvarez** (#7) - Left Winger, 25 years old
- **Manuel Sanchez** (#16) - Left Midfielder, 23 years old

### Forwards (3)
- **Daniel Castro** (#11) - Right Winger, 23 years old
- **Roberto Fernandez** (#9) - Striker (Main), 24 years old
- **Javier Gonzalez** (#21) - Striker (Secondary), 26 years old

## Formation Compatibility

This squad is designed to work with multiple formations:

### 4-4-2
- GK: Marc Rodriguez (#1)
- Defense: Martinez (#2), Torres (#4), Lopez (#5), Hernandez (#3)
- Midfield: Castro (#11), Moreno (#8), Ruiz (#6), Alvarez (#7)
- Attack: Fernandez (#9), Gonzalez (#21)

### 4-3-3
- GK: Marc Rodriguez (#1)
- Defense: Martinez (#2), Torres (#4), Lopez (#5), Hernandez (#3)
- Midfield: Ruiz (#6), Moreno (#8), Vargas (#10)
- Attack: Castro (#11), Fernandez (#9), Alvarez (#7)

### 4-2-3-1
- GK: Marc Rodriguez (#1)
- Defense: Martinez (#2), Torres (#4), Lopez (#5), Hernandez (#3)
- CDM: Ruiz (#6), Moreno (#8)
- CAM: Alvarez (#7), Vargas (#10), Castro (#11)
- ST: Fernandez (#9)

## Notes

- All players have valid Spanish RIB numbers for bank account information
- Player numbers follow traditional football numbering (1 for main GK, 2-6 for defense, 7-11 for midfield/attack)
- Ages range from 23-26 (realistic for a semi-professional academy team)
- Positions use the tactical abbreviations from our unified position system
- All players are assigned to teamId: 1 (assuming this is the first team in the database)
- Player image URLs are placeholder - replace with actual image URLs when available

## Usage in Development

You can use this data to seed your database for testing the new player attributes and tactical planner functionality. The diverse positions allow you to test various formations and player assignments.
