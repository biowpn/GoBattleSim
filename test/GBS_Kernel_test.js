
var Test_Raid = {
  "battleMode": "raid",
  "timelimit": 300000,
  "weather": "EXTREME",
  "dodgeBugActive": "0",
  "simPerConfig": 10,
  "aggregation": "avrg",
  "players": [
    {
      "team": "0",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Machamp",
              "role": "a",
              "copies": 6,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "2889",
              "raidTier": "3",
              "fmove": "Counter",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Dynamic Punch",
              "cmove2": "Dynamic Punch"
            }
          ],
          "revive": true
        }
      ]
    },
    {
      "team": "0",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Hariyama",
              "role": "a",
              "copies": 6,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "1",
              "fmove": "Counter",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Dynamic Punch",
              "cmove2": "Dynamic Punch"
            }
          ],
          "revive": true
        }
      ]
    },
    {
      "team": "1",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Tyranitar",
              "role": "rb",
              "copies": 1,
              "level": "",
              "stmiv": "",
              "atkiv": "",
              "defiv": "",
              "cp": "",
              "raidTier": "5",
              "fmove": "Iron Tail",
              "strategy": "strat0",
              "strategy2": "",
              "cmove": "Fire Blast",
              "cmove2": "Fire Blast"
            }
          ],
          "revive": false
        }
      ]
    }
  ]
};

GBS.request(Test_Raid);

console.log("Test Raid passed");

var Test_Gym = {
  "battleMode": "gym",
  "timelimit": 100000,
  "weather": "EXTREME",
  "dodgeBugActive": "0",
  "simPerConfig": 1,
  "aggregation": "enum",
  "players": [
    {
      "team": "0",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Machamp",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "2889",
              "raidTier": "3",
              "fmove": "Counter",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Dynamic Punch",
              "cmove2": "Dynamic Punch"
            },
            {
              "name": "Mewtwo",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "13",
              "cp": "3962",
              "raidTier": "5",
              "fmove": "Psycho Cut",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Shadow Ball",
              "cmove2": "Focus Blast"
            },
            {
              "name": "Latios",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "13",
              "cp": "3962",
              "raidTier": "5",
              "fmove": "Dragon Breath",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Dragon Claw",
              "cmove2": "Psychic"
            }
          ],
          "revive": false
        }
      ]
    },
    {
      "team": "1",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Blissey",
              "role": "gd",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "1",
              "fmove": "Zen Headbutt",
              "strategy": "strat0",
              "strategy2": "",
              "cmove": "Dazzling Gleam",
              "cmove2": ""
            },
            {
              "name": "Chansey",
              "role": "gd",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "1",
              "fmove": "Zen Headbutt",
              "strategy": "strat0",
              "strategy2": "",
              "cmove": "Psybeam",
              "cmove2": ""
            },
            {
              "name": "Dragonite",
              "role": "gd",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "4",
              "fmove": "Dragon Breath",
              "strategy": "strat0",
              "strategy2": "",
              "cmove": "Dragon Claw",
              "cmove2": "Hurricane"
            }
          ],
          "revive": false
        }
      ]
    }
  ]
};

GBS.request(Test_Gym);

console.log("Test Gym passed");


var Test_PvP = {
  "battleMode": "pvp",
  "timelimit": 240000,
  "weather": "EXTREME",
  "dodgeBugActive": "0",
  "simPerConfig": 1,
  "aggregation": "tree",
  "players": [
    {
      "team": "0",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Latios",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "3644",
              "raidTier": "5",
              "fmove": "Dragon Breath",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Dragon Claw",
              "cmove2": "Solar Beam"
            }
          ],
          "revive": false
        }
      ]
    },
    {
      "team": "1",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Latias",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "5",
              "fmove": "Dragon Breath",
              "strategy": "strat1",
              "strategy2": "",
              "cmove": "Outrage",
              "cmove2": "Psychic"
            }
          ],
          "revive": false
        }
      ]
    }
  ]
};

GBS.request(Test_PvP);

console.log("Test PvP 1 passed");


var Test_PvP2 = {
  "battleMode": "pvp",
  "timelimit": 240000,
  "weather": "EXTREME",
  "dodgeBugActive": "0",
  "simPerConfig": 0,
  "aggregation": "tree",
  "players": [
    {
      "team": "0",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Giratina (Altered Forme)",
              "label": "",
              "role": "a",
              "copies": 1,
              "level": "8",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "5",
              "fmove": "Shadow Claw",
              "strategy": "strat5",
              "strategy2": "1",
              "cmove": "Ancient Power",
              "cmove2": "Ancient Power"
            }
          ],
          "revive": false
        }
      ]
    },
    {
      "team": "1",
      "friend": "none",
      "parties": [
        {
          "name": "",
          "pokemon": [
            {
              "name": "Steelix",
              "label": "",
              "role": "a",
              "copies": 1,
              "level": "40",
              "stmiv": "15",
              "atkiv": "15",
              "defiv": "15",
              "cp": "",
              "raidTier": "1",
              "fmove": "Dragon Tail",
              "strategy": "strat5",
              "strategy2": "1",
              "cmove": "Crunch",
              "cmove2": "Crunch"
            }
          ],
          "revive": false
        }
      ]
    }
  ]
};

GBS.request(Test_PvP2);

console.log("Test PvP 2 passed");
