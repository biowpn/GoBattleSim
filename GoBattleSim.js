/*
	GoBattlerSim
		- A next-generation Pokemon GO battler simulator

	Author: biowp (https://github.com/ymenghank), inspired by Felix's BattleSim (https://github.com/doublefelix921/battlesim)
*/



/*
 *	PART I(a): MANUALLY DEFINED VARIABLES
 */

var POKEMON_MAX_ENERGY = 100;
var STAB_MULTIPLIER = 1.2;
var WAB_MULTIPLIER = 1.2;

var DODGE_COOLDOWN_MS = 500;
var DODGEWINDOW_LENGTH_MS = 700;
var DODGED_DAMAGE_REDUCTION_PERCENT = 0.75;
var ARENA_ENTRY_LAG_MS = 3000;
var SWITCHING_DELAY_MS = 900;
var TIMELIMIT_GYM_MS = 100000;
var REJOIN_TIME_MS = 10000;
var EACH_MAX_REVIVE_TIME_MS = 700;

var MAX_POKEMON_PER_PARTY = 6;
var MAX_NUMBER_OF_TEAMS = 5;
var TIMELIMIT_RAID_MS = [180000, 180000, 180000, 180000, 300000];

/* 
 *	PART I(b): HARD-CODING AREA
 */
 
 // TODO: Wait for Nick to get Fmoves and Cmoves data on the server
 
var FAST_MOVE_DATA = [{"name": "fury cutter", "moveType": "f", "power": 3.0, "pokeType": "bug", "energyDelta": 6, "dws": 100, "duration": 400}, {"name": "bug bite", "moveType": "f", "power": 5.0, "pokeType": "bug", "energyDelta": 6, "dws": 250, "duration": 500}, {"name": "bite", "moveType": "f", "power": 6.0, "pokeType": "dark", "energyDelta": 4, "dws": 300, "duration": 500}, {"name": "sucker punch", "moveType": "f", "power": 7.0, "pokeType": "dark", "energyDelta": 8, "dws": 300, "duration": 700}, {"name": "dragon breath", "moveType": "f", "power": 6.0, "pokeType": "dragon", "energyDelta": 4, "dws": 300, "duration": 500}, {"name": "thunder shock", "moveType": "f", "power": 5.0, "pokeType": "electric", "energyDelta": 8, "dws": 300, "duration": 600}, {"name": "spark", "moveType": "f", "power": 6.0, "pokeType": "electric", "energyDelta": 9, "dws": 300, "duration": 700}, {"name": "low kick", "moveType": "f", "power": 6.0, "pokeType": "fighting", "energyDelta": 6, "dws": 300, "duration": 600}, {"name": "karate chop", "moveType": "f", "power": 8.0, "pokeType": "fighting", "energyDelta": 10, "dws": 600, "duration": 800}, {"name": "ember", "moveType": "f", "power": 10.0, "pokeType": "fire", "energyDelta": 10, "dws": 600, "duration": 1000}, {"name": "wing attack", "moveType": "f", "power": 8.0, "pokeType": "flying", "energyDelta": 9, "dws": 550, "duration": 800}, {"name": "peck", "moveType": "f", "power": 10.0, "pokeType": "flying", "energyDelta": 10, "dws": 450, "duration": 1000}, {"name": "lick", "moveType": "f", "power": 5.0, "pokeType": "ghost", "energyDelta": 6, "dws": 200, "duration": 500}, {"name": "shadow claw", "moveType": "f", "power": 9.0, "pokeType": "ghost", "energyDelta": 6, "dws": 250, "duration": 700}, {"name": "vine whip", "moveType": "f", "power": 7.0, "pokeType": "grass", "energyDelta": 6, "dws": 350, "duration": 600}, {"name": "razor leaf", "moveType": "f", "power": 13.0, "pokeType": "grass", "energyDelta": 7, "dws": 600, "duration": 1000}, {"name": "mud shot", "moveType": "f", "power": 5.0, "pokeType": "ground", "energyDelta": 7, "dws": 350, "duration": 600}, {"name": "ice shard", "moveType": "f", "power": 12.0, "pokeType": "ice", "energyDelta": 12, "dws": 600, "duration": 1200}, {"name": "frost breath", "moveType": "f", "power": 10.0, "pokeType": "ice", "energyDelta": 8, "dws": 450, "duration": 900}, {"name": "quick attack", "moveType": "f", "power": 8.0, "pokeType": "normal", "energyDelta": 10, "dws": 250, "duration": 800}, {"name": "scratch", "moveType": "f", "power": 6.0, "pokeType": "normal", "energyDelta": 4, "dws": 300, "duration": 500}, {"name": "tackle", "moveType": "f", "power": 5.0, "pokeType": "normal", "energyDelta": 5, "dws": 300, "duration": 500}, {"name": "pound", "moveType": "f", "power": 7.0, "pokeType": "normal", "energyDelta": 6, "dws": 340, "duration": 600}, {"name": "cut", "moveType": "f", "power": 5.0, "pokeType": "normal", "energyDelta": 5, "dws": 300, "duration": 500}, {"name": "poison jab", "moveType": "f", "power": 10.0, "pokeType": "poison", "energyDelta": 7, "dws": 200, "duration": 800}, {"name": "acid", "moveType": "f", "power": 9.0, "pokeType": "poison", "energyDelta": 8, "dws": 400, "duration": 800}, {"name": "psycho cut", "moveType": "f", "power": 5.0, "pokeType": "psychic", "energyDelta": 8, "dws": 370, "duration": 600}, {"name": "rock throw", "moveType": "f", "power": 12.0, "pokeType": "rock", "energyDelta": 7, "dws": 500, "duration": 900}, {"name": "metal claw", "moveType": "f", "power": 8.0, "pokeType": "steel", "energyDelta": 7, "dws": 430, "duration": 700}, {"name": "bullet punch", "moveType": "f", "power": 9.0, "pokeType": "steel", "energyDelta": 10, "dws": 300, "duration": 900}, {"name": "water gun", "moveType": "f", "power": 5.0, "pokeType": "water", "energyDelta": 5, "dws": 300, "duration": 500}, {"name": "splash", "moveType": "f", "power": 0, "pokeType": "water", "energyDelta": 20, "dws": 1030, "duration": 1730}, {"name": "water gun fast blas", "moveType": "f", "power": 10.0, "pokeType": "water", "energyDelta": 6, "dws": 300, "duration": 1000}, {"name": "mud slap", "moveType": "f", "power": 15.0, "pokeType": "ground", "energyDelta": 12, "dws": 1150, "duration": 1400}, {"name": "zen headbutt", "moveType": "f", "power": 12.0, "pokeType": "psychic", "energyDelta": 10, "dws": 850, "duration": 1100}, {"name": "confusion", "moveType": "f", "power": 20.0, "pokeType": "psychic", "energyDelta": 15, "dws": 600, "duration": 1600}, {"name": "poison sting", "moveType": "f", "power": 5.0, "pokeType": "poison", "energyDelta": 7, "dws": 375, "duration": 600}, {"name": "bubble", "moveType": "f", "power": 12.0, "pokeType": "water", "energyDelta": 14, "dws": 750, "duration": 1200}, {"name": "feint attack", "moveType": "f", "power": 10.0, "pokeType": "dark", "energyDelta": 9, "dws": 750, "duration": 900}, {"name": "steel wing", "moveType": "f", "power": 11.0, "pokeType": "steel", "energyDelta": 6, "dws": 500, "duration": 800}, {"name": "fire fang", "moveType": "f", "power": 11.0, "pokeType": "fire", "energyDelta": 8, "dws": 640, "duration": 900}, {"name": "rock smash", "moveType": "f", "power": 15.0, "pokeType": "fighting", "energyDelta": 10, "dws": 550, "duration": 1300}, {"name": "transform", "moveType": "f", "power": 0, "pokeType": "normal", "energyDelta": 0, "dws": 300, "duration": 2230}, {"name": "counter", "moveType": "f", "power": 12.0, "pokeType": "fighting", "energyDelta": 8, "dws": 700, "duration": 900}, {"name": "powder snow", "moveType": "f", "power": 6.0, "pokeType": "ice", "energyDelta": 15, "dws": 850, "duration": 1000}, {"name": "charge beam", "moveType": "f", "power": 8.0, "pokeType": "electric", "energyDelta": 15, "dws": 850, "duration": 1100}, {"name": "volt switch", "moveType": "f", "power": 20.0, "pokeType": "electric", "energyDelta": 25, "dws": 1800, "duration": 2300}, {"name": "dragon tail", "moveType": "f", "power": 15.0, "pokeType": "dragon", "energyDelta": 9, "dws": 850, "duration": 1100}, {"name": "air slash", "moveType": "f", "power": 14.0, "pokeType": "flying", "energyDelta": 10, "dws": 1000, "duration": 1200}, {"name": "infestation", "moveType": "f", "power": 10.0, "pokeType": "bug", "energyDelta": 14, "dws": 850, "duration": 1100}, {"name": "struggle bug", "moveType": "f", "power": 15.0, "pokeType": "bug", "energyDelta": 0, "dws": 1200, "duration": 1500}, {"name": "astonish", "moveType": "f", "power": 8.0, "pokeType": "ghost", "energyDelta": 14, "dws": 700, "duration": 1100}, {"name": "hex", "moveType": "f", "power": 10.0, "pokeType": "ghost", "energyDelta": 15, "dws": 1000, "duration": 1200}, {"name": "iron tail", "moveType": "f", "power": 15.0, "pokeType": "steel", "energyDelta": 7, "dws": 850, "duration": 1100}, {"name": "fire spin", "moveType": "f", "power": 14.0, "pokeType": "fire", "energyDelta": 10, "dws": 850, "duration": 1100}, {"name": "bullet seed", "moveType": "f", "power": 8.0, "pokeType": "grass", "energyDelta": 14, "dws": 850, "duration": 1100}, {"name": "extrasensory", "moveType": "f", "power": 12.0, "pokeType": "psychic", "energyDelta": 12, "dws": 850, "duration": 1100}, {"name": "snarl", "moveType": "f", "power": 12.0, "pokeType": "dark", "energyDelta": 12, "dws": 850, "duration": 1100}, {"name": "hidden power", "moveType": "f", "power": 15.0, "pokeType": "normal", "energyDelta": 15, "dws": 1100, "duration": 1500}, {"name": "take down", "moveType": "f", "power": 8.0, "pokeType": "normal", "energyDelta": 10, "dws": 950, "duration": 1200}, {"name": "waterfall", "moveType": "f", "power": 16.0, "pokeType": "water", "energyDelta": 8, "dws": 950, "duration": 1200}, {"name": "yawn", "moveType": "f", "power": 0, "pokeType": "normal", "energyDelta": 15, "dws": 1400, "duration": 1700}, {"name": "present", "moveType": "f", "power": 5.0, "pokeType": "normal", "energyDelta": 20, "dws": 1100, "duration": 1300}];

var CHARGED_MOVE_DATA = [{"name": "wrap", "moveType": "c", "power": 60.0, "pokeType": "normal", "energyDelta": -33, "dws": 2050, "duration": 2900}, {"name": "hyper beam", "moveType": "c", "power": 150.0, "pokeType": "normal", "energyDelta": -100, "dws": 3300, "duration": 3800}, {"name": "dark pulse", "moveType": "c", "power": 80.0, "pokeType": "dark", "energyDelta": -50, "dws": 1400, "duration": 3000}, {"name": "sludge", "moveType": "c", "power": 50.0, "pokeType": "poison", "energyDelta": -33, "dws": 1200, "duration": 2100}, {"name": "vice grip", "moveType": "c", "power": 35.0, "pokeType": "normal", "energyDelta": -33, "dws": 1100, "duration": 1900}, {"name": "flame wheel", "moveType": "c", "power": 60.0, "pokeType": "fire", "energyDelta": -50, "dws": 2100, "duration": 2700}, {"name": "megahorn", "moveType": "c", "power": 90.0, "pokeType": "bug", "energyDelta": -100, "dws": 1700, "duration": 2200}, {"name": "flamethrower", "moveType": "c", "power": 70.0, "pokeType": "fire", "energyDelta": -50, "dws": 1500, "duration": 2200}, {"name": "dig", "moveType": "c", "power": 100.0, "pokeType": "ground", "energyDelta": -50, "dws": 2800, "duration": 4700}, {"name": "cross chop", "moveType": "c", "power": 50.0, "pokeType": "fighting", "energyDelta": -50, "dws": 800, "duration": 1500}, {"name": "psybeam", "moveType": "c", "power": 70.0, "pokeType": "psychic", "energyDelta": -50, "dws": 1300, "duration": 3200}, {"name": "earthquake", "moveType": "c", "power": 120.0, "pokeType": "ground", "energyDelta": -100, "dws": 2700, "duration": 3600}, {"name": "stone edge", "moveType": "c", "power": 100.0, "pokeType": "rock", "energyDelta": -100, "dws": 700, "duration": 2300}, {"name": "ice punch", "moveType": "c", "power": 50.0, "pokeType": "ice", "energyDelta": -33, "dws": 1300, "duration": 1900}, {"name": "heart stamp", "moveType": "c", "power": 40.0, "pokeType": "psychic", "energyDelta": -33, "dws": 1100, "duration": 1900}, {"name": "discharge", "moveType": "c", "power": 65.0, "pokeType": "electric", "energyDelta": -33, "dws": 1700, "duration": 2500}, {"name": "flash cannon", "moveType": "c", "power": 100.0, "pokeType": "steel", "energyDelta": -100, "dws": 1600, "duration": 2700}, {"name": "drill peck", "moveType": "c", "power": 60.0, "pokeType": "flying", "energyDelta": -33, "dws": 1700, "duration": 2300}, {"name": "ice beam", "moveType": "c", "power": 90.0, "pokeType": "ice", "energyDelta": -50, "dws": 1300, "duration": 3300}, {"name": "blizzard", "moveType": "c", "power": 130.0, "pokeType": "ice", "energyDelta": -100, "dws": 1500, "duration": 3100}, {"name": "heat wave", "moveType": "c", "power": 95.0, "pokeType": "fire", "energyDelta": -100, "dws": 1700, "duration": 3000}, {"name": "aerial ace", "moveType": "c", "power": 55.0, "pokeType": "flying", "energyDelta": -33, "dws": 1900, "duration": 2400}, {"name": "drill run", "moveType": "c", "power": 80.0, "pokeType": "ground", "energyDelta": -50, "dws": 1700, "duration": 2800}, {"name": "petal blizzard", "moveType": "c", "power": 110.0, "pokeType": "grass", "energyDelta": -100, "dws": 1700, "duration": 2600}, {"name": "mega drain", "moveType": "c", "power": 25.0, "pokeType": "grass", "energyDelta": -50, "dws": 950, "duration": 2600}, {"name": "bug buzz", "moveType": "c", "power": 90.0, "pokeType": "bug", "energyDelta": -50, "dws": 2000, "duration": 3700}, {"name": "poison fang", "moveType": "c", "power": 35.0, "pokeType": "poison", "energyDelta": -33, "dws": 900, "duration": 1700}, {"name": "night slash", "moveType": "c", "power": 50.0, "pokeType": "dark", "energyDelta": -33, "dws": 1300, "duration": 2200}, {"name": "bubble beam", "moveType": "c", "power": 45.0, "pokeType": "water", "energyDelta": -33, "dws": 1450, "duration": 1900}, {"name": "submission", "moveType": "c", "power": 60.0, "pokeType": "fighting", "energyDelta": -50, "dws": 1800, "duration": 2200}, {"name": "low sweep", "moveType": "c", "power": 40.0, "pokeType": "fighting", "energyDelta": -33, "dws": 1300, "duration": 1900}, {"name": "aqua jet", "moveType": "c", "power": 45.0, "pokeType": "water", "energyDelta": -33, "dws": 1700, "duration": 2600}, {"name": "aqua tail", "moveType": "c", "power": 50.0, "pokeType": "water", "energyDelta": -33, "dws": 1200, "duration": 1900}, {"name": "seed bomb", "moveType": "c", "power": 55.0, "pokeType": "grass", "energyDelta": -33, "dws": 1200, "duration": 2100}, {"name": "psyshock", "moveType": "c", "power": 65.0, "pokeType": "psychic", "energyDelta": -33, "dws": 2000, "duration": 2700}, {"name": "ancient power", "moveType": "c", "power": 70.0, "pokeType": "rock", "energyDelta": -33, "dws": 2850, "duration": 3500}, {"name": "rock tomb", "moveType": "c", "power": 70.0, "pokeType": "rock", "energyDelta": -50, "dws": 2250, "duration": 3200}, {"name": "rock slide", "moveType": "c", "power": 80.0, "pokeType": "rock", "energyDelta": -50, "dws": 1500, "duration": 2700}, {"name": "power gem", "moveType": "c", "power": 80.0, "pokeType": "rock", "energyDelta": -50, "dws": 1950, "duration": 2900}, {"name": "shadow sneak", "moveType": "c", "power": 50.0, "pokeType": "ghost", "energyDelta": -33, "dws": 2200, "duration": 2900}, {"name": "shadow punch", "moveType": "c", "power": 40.0, "pokeType": "ghost", "energyDelta": -33, "dws": 1300, "duration": 1700}, {"name": "ominous wind", "moveType": "c", "power": 50.0, "pokeType": "ghost", "energyDelta": -33, "dws": 1850, "duration": 2300}, {"name": "shadow ball", "moveType": "c", "power": 100.0, "pokeType": "ghost", "energyDelta": -50, "dws": 2400, "duration": 3000}, {"name": "magnet bomb", "moveType": "c", "power": 70.0, "pokeType": "steel", "energyDelta": -33, "dws": 2200, "duration": 2800}, {"name": "iron head", "moveType": "c", "power": 60.0, "pokeType": "steel", "energyDelta": -50, "dws": 1300, "duration": 1900}, {"name": "parabolic charge", "moveType": "c", "power": 25.0, "pokeType": "electric", "energyDelta": -50, "dws": 1200, "duration": 2800}, {"name": "thunder punch", "moveType": "c", "power": 45.0, "pokeType": "electric", "energyDelta": -33, "dws": 1700, "duration": 1800}, {"name": "thunder", "moveType": "c", "power": 100.0, "pokeType": "electric", "energyDelta": -100, "dws": 1200, "duration": 2400}, {"name": "thunderbolt", "moveType": "c", "power": 80.0, "pokeType": "electric", "energyDelta": -50, "dws": 1800, "duration": 2500}, {"name": "twister", "moveType": "c", "power": 45.0, "pokeType": "dragon", "energyDelta": -33, "dws": 950, "duration": 2800}, {"name": "dragon pulse", "moveType": "c", "power": 90.0, "pokeType": "dragon", "energyDelta": -50, "dws": 2150, "duration": 3600}, {"name": "dragon claw", "moveType": "c", "power": 50.0, "pokeType": "dragon", "energyDelta": -33, "dws": 1100, "duration": 1700}, {"name": "disarming voice", "moveType": "c", "power": 70.0, "pokeType": "fairy", "energyDelta": -33, "dws": 3200, "duration": 3900}, {"name": "draining kiss", "moveType": "c", "power": 60.0, "pokeType": "fairy", "energyDelta": -50, "dws": 1000, "duration": 2600}, {"name": "dazzling gleam", "moveType": "c", "power": 100.0, "pokeType": "fairy", "energyDelta": -50, "dws": 2100, "duration": 3500}, {"name": "moonblast", "moveType": "c", "power": 130.0, "pokeType": "fairy", "energyDelta": -100, "dws": 2200, "duration": 3900}, {"name": "play rough", "moveType": "c", "power": 90.0, "pokeType": "fairy", "energyDelta": -50, "dws": 1300, "duration": 2900}, {"name": "cross poison", "moveType": "c", "power": 40.0, "pokeType": "poison", "energyDelta": -33, "dws": 900, "duration": 1500}, {"name": "sludge bomb", "moveType": "c", "power": 80.0, "pokeType": "poison", "energyDelta": -50, "dws": 1100, "duration": 2300}, {"name": "sludge wave", "moveType": "c", "power": 110.0, "pokeType": "poison", "energyDelta": -100, "dws": 2000, "duration": 3200}, {"name": "gunk shot", "moveType": "c", "power": 130.0, "pokeType": "poison", "energyDelta": -100, "dws": 1700, "duration": 3100}, {"name": "bone club", "moveType": "c", "power": 40.0, "pokeType": "ground", "energyDelta": -33, "dws": 1000, "duration": 1600}, {"name": "bulldoze", "moveType": "c", "power": 80.0, "pokeType": "ground", "energyDelta": -50, "dws": 2600, "duration": 3500}, {"name": "mud bomb", "moveType": "c", "power": 55.0, "pokeType": "ground", "energyDelta": -33, "dws": 1700, "duration": 2300}, {"name": "signal beam", "moveType": "c", "power": 75.0, "pokeType": "bug", "energyDelta": -50, "dws": 1800, "duration": 2900}, {"name": "x scissor", "moveType": "c", "power": 45.0, "pokeType": "bug", "energyDelta": -33, "dws": 1200, "duration": 1600}, {"name": "flame charge", "moveType": "c", "power": 70.0, "pokeType": "fire", "energyDelta": -33, "dws": 2900, "duration": 3800}, {"name": "flame burst", "moveType": "c", "power": 70.0, "pokeType": "fire", "energyDelta": -50, "dws": 1000, "duration": 2600}, {"name": "fire blast", "moveType": "c", "power": 140.0, "pokeType": "fire", "energyDelta": -100, "dws": 3100, "duration": 4200}, {"name": "brine", "moveType": "c", "power": 60.0, "pokeType": "water", "energyDelta": -50, "dws": 1500, "duration": 2300}, {"name": "water pulse", "moveType": "c", "power": 70.0, "pokeType": "water", "energyDelta": -50, "dws": 2200, "duration": 3200}, {"name": "scald", "moveType": "c", "power": 80.0, "pokeType": "water", "energyDelta": -50, "dws": 1300, "duration": 3700}, {"name": "hydro pump", "moveType": "c", "power": 130.0, "pokeType": "water", "energyDelta": -100, "dws": 900, "duration": 3300}, {"name": "psychic", "moveType": "c", "power": 100.0, "pokeType": "psychic", "energyDelta": -100, "dws": 1300, "duration": 2800}, {"name": "psystrike", "moveType": "c", "power": 100.0, "pokeType": "psychic", "energyDelta": -50, "dws": 3000, "duration": 4400}, {"name": "icy wind", "moveType": "c", "power": 60.0, "pokeType": "ice", "energyDelta": -33, "dws": 2000, "duration": 3300}, {"name": "giga drain", "moveType": "c", "power": 50.0, "pokeType": "grass", "energyDelta": -100, "dws": 1200, "duration": 3900}, {"name": "fire punch", "moveType": "c", "power": 55.0, "pokeType": "fire", "energyDelta": -33, "dws": 1500, "duration": 2200}, {"name": "solar beam", "moveType": "c", "power": 180.0, "pokeType": "grass", "energyDelta": -100, "dws": 2700, "duration": 4900}, {"name": "leaf blade", "moveType": "c", "power": 70.0, "pokeType": "grass", "energyDelta": -33, "dws": 1250, "duration": 2400}, {"name": "power whip", "moveType": "c", "power": 90.0, "pokeType": "grass", "energyDelta": -50, "dws": 1250, "duration": 2600}, {"name": "air cutter", "moveType": "c", "power": 60.0, "pokeType": "flying", "energyDelta": -50, "dws": 1800, "duration": 2700}, {"name": "hurricane", "moveType": "c", "power": 110.0, "pokeType": "flying", "energyDelta": -100, "dws": 1200, "duration": 2700}, {"name": "brick break", "moveType": "c", "power": 40.0, "pokeType": "fighting", "energyDelta": -33, "dws": 800, "duration": 1600}, {"name": "swift", "moveType": "c", "power": 60.0, "pokeType": "normal", "energyDelta": -50, "dws": 2000, "duration": 2800}, {"name": "horn attack", "moveType": "c", "power": 40.0, "pokeType": "normal", "energyDelta": -33, "dws": 800, "duration": 1850}, {"name": "stomp", "moveType": "c", "power": 55.0, "pokeType": "normal", "energyDelta": -50, "dws": 1100, "duration": 1700}, {"name": "hyper fang", "moveType": "c", "power": 80.0, "pokeType": "normal", "energyDelta": -50, "dws": 1500, "duration": 2500}, {"name": "body slam", "moveType": "c", "power": 50.0, "pokeType": "normal", "energyDelta": -33, "dws": 1200, "duration": 1900}, {"name": "rest", "moveType": "c", "power": 50.0, "pokeType": "normal", "energyDelta": -33, "dws": 1500, "duration": 1900}, {"name": "struggle", "moveType": "c", "power": 35.0, "pokeType": "normal", "energyDelta": 0, "dws": 1200, "duration": 2200}, {"name": "scald blastoise", "moveType": "c", "power": 50.0, "pokeType": "water", "energyDelta": -100, "dws": 2500, "duration": 4700}, {"name": "hydro pump blastoise", "moveType": "c", "power": 90.0, "pokeType": "water", "energyDelta": -100, "dws": 2200, "duration": 4500}, {"name": "wrap green", "moveType": "c", "power": 25.0, "pokeType": "normal", "energyDelta": -33, "dws": 2050, "duration": 2900}, {"name": "wrap pink", "moveType": "c", "power": 25.0, "pokeType": "normal", "energyDelta": -33, "dws": 2050, "duration": 2900}, {"name": "close combat", "moveType": "c", "power": 100.0, "pokeType": "fighting", "energyDelta": -100, "dws": 1000, "duration": 2300}, {"name": "dynamic punch", "moveType": "c", "power": 90.0, "pokeType": "fighting", "energyDelta": -50, "dws": 1200, "duration": 2700}, {"name": "focus blast", "moveType": "c", "power": 140.0, "pokeType": "fighting", "energyDelta": -100, "dws": 3000, "duration": 3500}, {"name": "aurora beam", "moveType": "c", "power": 80.0, "pokeType": "ice", "energyDelta": -50, "dws": 3350, "duration": 3550}, {"name": "wild charge", "moveType": "c", "power": 90.0, "pokeType": "electric", "energyDelta": -50, "dws": 1700, "duration": 2600}, {"name": "zap cannon", "moveType": "c", "power": 140.0, "pokeType": "electric", "energyDelta": -100, "dws": 3000, "duration": 3700}, {"name": "avalanche", "moveType": "c", "power": 90.0, "pokeType": "ice", "energyDelta": -50, "dws": 1700, "duration": 2700}, {"name": "brave bird", "moveType": "c", "power": 90.0, "pokeType": "flying", "energyDelta": -100, "dws": 1000, "duration": 2000}, {"name": "sky attack", "moveType": "c", "power": 70.0, "pokeType": "flying", "energyDelta": -50, "dws": 1500, "duration": 2000}, {"name": "sand tomb", "moveType": "c", "power": 80.0, "pokeType": "ground", "energyDelta": -50, "dws": 1700, "duration": 4000}, {"name": "rock blast", "moveType": "c", "power": 50.0, "pokeType": "rock", "energyDelta": -33, "dws": 1600, "duration": 2100}, {"name": "silver wind", "moveType": "c", "power": 70.0, "pokeType": "bug", "energyDelta": -33, "dws": 1700, "duration": 3700}, {"name": "night shade", "moveType": "c", "power": 60.0, "pokeType": "ghost", "energyDelta": -50, "dws": 2100, "duration": 2600}, {"name": "gyro ball", "moveType": "c", "power": 80.0, "pokeType": "steel", "energyDelta": -50, "dws": 3000, "duration": 3300}, {"name": "heavy slam", "moveType": "c", "power": 70.0, "pokeType": "steel", "energyDelta": -50, "dws": 1500, "duration": 2100}, {"name": "overheat", "moveType": "c", "power": 160.0, "pokeType": "fire", "energyDelta": -100, "dws": 2600, "duration": 4000}, {"name": "grass knot", "moveType": "c", "power": 90.0, "pokeType": "grass", "energyDelta": -50, "dws": 1700, "duration": 2600}, {"name": "energy ball", "moveType": "c", "power": 90.0, "pokeType": "grass", "energyDelta": -50, "dws": 3000, "duration": 3900}, {"name": "futuresight", "moveType": "c", "power": 120.0, "pokeType": "psychic", "energyDelta": -100, "dws": 1400, "duration": 2700}, {"name": "mirror coat", "moveType": "c", "power": 60.0, "pokeType": "psychic", "energyDelta": -50, "dws": 2300, "duration": 2600}, {"name": "outrage", "moveType": "c", "power": 110.0, "pokeType": "dragon", "energyDelta": -50, "dws": 2500, "duration": 3900}, {"name": "crunch", "moveType": "c", "power": 70.0, "pokeType": "dark", "energyDelta": -33, "dws": 1300, "duration": 3200}, {"name": "foul play", "moveType": "c", "power": 70.0, "pokeType": "dark", "energyDelta": -50, "dws": 1700, "duration": 2000}, {"name": "surf", "moveType": "c", "power": 65.0, "pokeType": "water", "energyDelta": -50, "dws": 1400, "duration": 1700}, {"name": "draco meteor", "moveType": "c", "power": 150.0, "pokeType": "dragon", "energyDelta": -100, "dws": 3000, "duration": 3600}, {"name": "doom desire", "moveType": "c", "power": 80.0, "pokeType": "steel", "energyDelta": -50, "dws": 1400, "duration": 1700}, {"name": "psycho boost", "moveType": "c", "power": 70.0, "pokeType": "psychic", "energyDelta": -50, "dws": 3500, "duration": 4000}, {"name": "origin pulse", "moveType": "c", "power": 130.0, "pokeType": "water", "energyDelta": -100, "dws": 1400, "duration": 1700}, {"name": "precipice blades", "moveType": "c", "power": 130.0, "pokeType": "ground", "energyDelta": -100, "dws": 1400, "duration": 1700}];

// POKEMON_SPECIES_DATA is populated somewhere else
var POKEMON_SPECIES_DATA = [{"dex": 1, "name": "bulbasaur", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 118, "baseDef": 118, "baseStm": 90, "fastMoves": ["vine whip", "tackle"], "chargedMoves": ["sludge bomb", "seed bomb", "power whip"]}, {"dex": 2, "name": "ivysaur", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 151, "baseDef": 151, "baseStm": 120, "fastMoves": ["razor leaf", "vine whip"], "chargedMoves": ["sludge bomb", "solar beam", "power whip"]}, {"dex": 3, "name": "venusaur", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 198, "baseDef": 198, "baseStm": 160, "fastMoves": ["razor leaf", "vine whip"], "chargedMoves": ["sludge bomb", "petal blizzard", "solar beam"]}, {"dex": 4, "name": "charmander", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 116, "baseDef": 96, "baseStm": 78, "fastMoves": ["ember", "scratch"], "chargedMoves": ["flame charge", "flame burst", "flamethrower"]}, {"dex": 5, "name": "charmeleon", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 158, "baseDef": 129, "baseStm": 116, "fastMoves": ["ember", "fire fang"], "chargedMoves": ["fire punch", "flame burst", "flamethrower"]}, {"dex": 6, "name": "charizard", "pokeType1": "fire", "pokeType2": "flying", "baseAtk": 223, "baseDef": 176, "baseStm": 156, "fastMoves": ["fire spin", "air slash"], "chargedMoves": ["fire blast", "dragon claw", "overheat"]}, {"dex": 7, "name": "squirtle", "pokeType1": "water", "pokeType2": "none", "baseAtk": 94, "baseDef": 122, "baseStm": 88, "fastMoves": ["bubble", "tackle"], "chargedMoves": ["aqua jet", "aqua tail", "water pulse"]}, {"dex": 8, "name": "wartortle", "pokeType1": "water", "pokeType2": "none", "baseAtk": 126, "baseDef": 155, "baseStm": 118, "fastMoves": ["water gun", "bite"], "chargedMoves": ["aqua jet", "ice beam", "hydro pump"]}, {"dex": 9, "name": "blastoise", "pokeType1": "water", "pokeType2": "none", "baseAtk": 171, "baseDef": 210, "baseStm": 158, "fastMoves": ["water gun", "bite"], "chargedMoves": ["flash cannon", "ice beam", "hydro pump"]}, {"dex": 10, "name": "caterpie", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 55, "baseDef": 62, "baseStm": 90, "fastMoves": ["bug bite", "tackle"], "chargedMoves": ["struggle"]}, {"dex": 11, "name": "metapod", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 45, "baseDef": 94, "baseStm": 100, "fastMoves": ["bug bite", "tackle"], "chargedMoves": ["struggle"]}, {"dex": 12, "name": "butterfree", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 167, "baseDef": 151, "baseStm": 120, "fastMoves": ["struggle bug", "confusion"], "chargedMoves": ["bug buzz", "psychic", "signal beam"]}, {"dex": 13, "name": "weedle", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 63, "baseDef": 55, "baseStm": 80, "fastMoves": ["bug bite", "poison sting"], "chargedMoves": ["struggle"]}, {"dex": 14, "name": "kakuna", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 46, "baseDef": 86, "baseStm": 90, "fastMoves": ["bug bite", "poison sting"], "chargedMoves": ["struggle"]}, {"dex": 15, "name": "beedrill", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 169, "baseDef": 150, "baseStm": 130, "fastMoves": ["infestation", "poison jab"], "chargedMoves": ["sludge bomb", "aerial ace", "x scissor"]}, {"dex": 16, "name": "pidgey", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 85, "baseDef": 76, "baseStm": 80, "fastMoves": ["quick attack", "tackle"], "chargedMoves": ["twister", "aerial ace", "air cutter"]}, {"dex": 17, "name": "pidgeotto", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 117, "baseDef": 108, "baseStm": 126, "fastMoves": ["wing attack", "steel wing"], "chargedMoves": ["twister", "aerial ace", "air cutter"]}, {"dex": 18, "name": "pidgeot", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 166, "baseDef": 157, "baseStm": 166, "fastMoves": ["air slash", "steel wing"], "chargedMoves": ["hurricane", "aerial ace", "brave bird"]}, {"dex": 19, "name": "rattata", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 103, "baseDef": 70, "baseStm": 60, "fastMoves": ["tackle", "quick attack"], "chargedMoves": ["dig", "hyper fang", "body slam"]}, {"dex": 20, "name": "raticate", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 161, "baseDef": 144, "baseStm": 110, "fastMoves": ["bite", "quick attack"], "chargedMoves": ["dig", "hyper fang", "hyper beam"]}, {"dex": 21, "name": "spearow", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 112, "baseDef": 61, "baseStm": 80, "fastMoves": ["peck", "quick attack"], "chargedMoves": ["aerial ace", "drill peck", "sky attack"]}, {"dex": 22, "name": "fearow", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 182, "baseDef": 135, "baseStm": 130, "fastMoves": ["peck", "steel wing"], "chargedMoves": ["aerial ace", "drill run", "sky attack"]}, {"dex": 23, "name": "ekans", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 110, "baseDef": 102, "baseStm": 70, "fastMoves": ["poison sting", "acid"], "chargedMoves": ["wrap", "poison fang", "sludge bomb"]}, {"dex": 24, "name": "arbok", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 167, "baseDef": 158, "baseStm": 120, "fastMoves": ["bite", "acid"], "chargedMoves": ["dark pulse", "sludge wave", "gunk shot"]}, {"dex": 25, "name": "pikachu", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 112, "baseDef": 101, "baseStm": 70, "fastMoves": ["thunder shock", "quick attack"], "chargedMoves": ["discharge", "thunderbolt", "wild charge"]}, {"dex": 26, "name": "raichu", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 193, "baseDef": 165, "baseStm": 120, "fastMoves": ["volt switch", "spark"], "chargedMoves": ["brick break", "thunder punch", "wild charge"]}, {"dex": 27, "name": "sandshrew", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 126, "baseDef": 145, "baseStm": 100, "fastMoves": ["scratch", "mud shot"], "chargedMoves": ["dig", "rock slide", "sand tomb"]}, {"dex": 28, "name": "sandslash", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 182, "baseDef": 202, "baseStm": 150, "fastMoves": ["metal claw", "mud shot"], "chargedMoves": ["earthquake", "rock tomb", "bulldoze"]}, {"dex": 29, "name": "nidoran female", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 86, "baseDef": 94, "baseStm": 110, "fastMoves": ["bite", "poison sting"], "chargedMoves": ["poison fang", "body slam", "sludge bomb"]}, {"dex": 30, "name": "nidorina", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 117, "baseDef": 126, "baseStm": 140, "fastMoves": ["bite", "poison sting"], "chargedMoves": ["poison fang", "dig", "sludge bomb"]}, {"dex": 31, "name": "nidoqueen", "pokeType1": "poison", "pokeType2": "ground", "baseAtk": 180, "baseDef": 174, "baseStm": 180, "fastMoves": ["poison jab", "bite"], "chargedMoves": ["earthquake", "sludge wave", "stone edge"]}, {"dex": 32, "name": "nidoran male", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 105, "baseDef": 76, "baseStm": 92, "fastMoves": ["peck", "poison sting"], "chargedMoves": ["horn attack", "body slam", "sludge bomb"]}, {"dex": 33, "name": "nidorino", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 137, "baseDef": 112, "baseStm": 122, "fastMoves": ["poison jab", "poison sting"], "chargedMoves": ["horn attack", "dig", "sludge bomb"]}, {"dex": 34, "name": "nidoking", "pokeType1": "poison", "pokeType2": "ground", "baseAtk": 204, "baseDef": 157, "baseStm": 162, "fastMoves": ["poison jab", "iron tail"], "chargedMoves": ["earthquake", "sludge wave", "megahorn"]}, {"dex": 35, "name": "clefairy", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 107, "baseDef": 116, "baseStm": 140, "fastMoves": ["pound", "zen headbutt"], "chargedMoves": ["disarming voice", "body slam", "moonblast"]}, {"dex": 36, "name": "clefable", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 178, "baseDef": 171, "baseStm": 190, "fastMoves": ["charge beam", "zen headbutt"], "chargedMoves": ["dazzling gleam", "psychic", "moonblast"]}, {"dex": 37, "name": "vulpix", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 96, "baseDef": 122, "baseStm": 76, "fastMoves": ["quick attack", "ember"], "chargedMoves": ["body slam", "flamethrower", "flame charge"]}, {"dex": 38, "name": "ninetales", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 169, "baseDef": 204, "baseStm": 146, "fastMoves": ["feint attack", "fire spin"], "chargedMoves": ["heat wave", "overheat", "solar beam"]}, {"dex": 39, "name": "jigglypuff", "pokeType1": "normal", "pokeType2": "fairy", "baseAtk": 80, "baseDef": 44, "baseStm": 230, "fastMoves": ["pound", "feint attack"], "chargedMoves": ["disarming voice", "gyro ball", "dazzling gleam"]}, {"dex": 40, "name": "wigglytuff", "pokeType1": "normal", "pokeType2": "fairy", "baseAtk": 156, "baseDef": 93, "baseStm": 280, "fastMoves": ["pound", "feint attack"], "chargedMoves": ["dazzling gleam", "hyper beam", "play rough"]}, {"dex": 41, "name": "zubat", "pokeType1": "poison", "pokeType2": "flying", "baseAtk": 83, "baseDef": 76, "baseStm": 80, "fastMoves": ["quick attack", "bite"], "chargedMoves": ["poison fang", "air cutter", "swift"]}, {"dex": 42, "name": "golbat", "pokeType1": "poison", "pokeType2": "flying", "baseAtk": 161, "baseDef": 153, "baseStm": 150, "fastMoves": ["wing attack", "bite"], "chargedMoves": ["shadow ball", "air cutter", "poison fang"]}, {"dex": 43, "name": "oddish", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 131, "baseDef": 116, "baseStm": 90, "fastMoves": ["razor leaf", "acid"], "chargedMoves": ["seed bomb", "sludge bomb", "moonblast"]}, {"dex": 44, "name": "gloom", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 153, "baseDef": 139, "baseStm": 120, "fastMoves": ["razor leaf", "acid"], "chargedMoves": ["petal blizzard", "sludge bomb", "moonblast"]}, {"dex": 45, "name": "vileplume", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 202, "baseDef": 170, "baseStm": 150, "fastMoves": ["razor leaf", "acid"], "chargedMoves": ["petal blizzard", "solar beam", "moonblast"]}, {"dex": 46, "name": "paras", "pokeType1": "bug", "pokeType2": "grass", "baseAtk": 121, "baseDef": 99, "baseStm": 70, "fastMoves": ["scratch", "bug bite"], "chargedMoves": ["cross poison", "x scissor", "seed bomb"]}, {"dex": 47, "name": "parasect", "pokeType1": "bug", "pokeType2": "grass", "baseAtk": 165, "baseDef": 146, "baseStm": 120, "fastMoves": ["struggle bug", "fury cutter"], "chargedMoves": ["cross poison", "x scissor", "solar beam"]}, {"dex": 48, "name": "venonat", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 100, "baseDef": 102, "baseStm": 120, "fastMoves": ["bug bite", "confusion"], "chargedMoves": ["poison fang", "psybeam", "signal beam"]}, {"dex": 49, "name": "venomoth", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 179, "baseDef": 150, "baseStm": 140, "fastMoves": ["infestation", "confusion"], "chargedMoves": ["silver wind", "psychic", "bug buzz"]}, {"dex": 50, "name": "diglett", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 109, "baseDef": 88, "baseStm": 20, "fastMoves": ["mud slap", "scratch"], "chargedMoves": ["dig", "mud bomb", "rock tomb"]}, {"dex": 51, "name": "dugtrio", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 167, "baseDef": 147, "baseStm": 70, "fastMoves": ["sucker punch", "mud slap"], "chargedMoves": ["earthquake", "mud bomb", "stone edge"]}, {"dex": 52, "name": "meowth", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 92, "baseDef": 81, "baseStm": 80, "fastMoves": ["scratch", "bite"], "chargedMoves": ["night slash", "dark pulse", "foul play"]}, {"dex": 53, "name": "persian", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 150, "baseDef": 139, "baseStm": 130, "fastMoves": ["scratch", "feint attack"], "chargedMoves": ["foul play", "power gem", "play rough"]}, {"dex": 54, "name": "psyduck", "pokeType1": "water", "pokeType2": "none", "baseAtk": 122, "baseDef": 96, "baseStm": 100, "fastMoves": ["water gun", "zen headbutt"], "chargedMoves": ["psybeam", "aqua tail", "cross chop"]}, {"dex": 55, "name": "golduck", "pokeType1": "water", "pokeType2": "none", "baseAtk": 191, "baseDef": 163, "baseStm": 160, "fastMoves": ["water gun", "confusion"], "chargedMoves": ["psychic", "hydro pump", "ice beam"]}, {"dex": 56, "name": "mankey", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 148, "baseDef": 87, "baseStm": 80, "fastMoves": ["karate chop", "scratch"], "chargedMoves": ["cross chop", "low sweep", "brick break"]}, {"dex": 57, "name": "primeape", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 207, "baseDef": 144, "baseStm": 130, "fastMoves": ["low kick", "counter"], "chargedMoves": ["close combat", "low sweep", "night slash"]}, {"dex": 58, "name": "growlithe", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 136, "baseDef": 96, "baseStm": 110, "fastMoves": ["ember", "bite"], "chargedMoves": ["flame wheel", "body slam", "flamethrower"]}, {"dex": 59, "name": "arcanine", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 227, "baseDef": 166, "baseStm": 180, "fastMoves": ["fire fang", "snarl"], "chargedMoves": ["fire blast", "wild charge", "crunch"]}, {"dex": 60, "name": "poliwag", "pokeType1": "water", "pokeType2": "none", "baseAtk": 101, "baseDef": 82, "baseStm": 80, "fastMoves": ["bubble", "mud shot"], "chargedMoves": ["bubble beam", "mud bomb", "body slam"]}, {"dex": 61, "name": "poliwhirl", "pokeType1": "water", "pokeType2": "none", "baseAtk": 130, "baseDef": 130, "baseStm": 130, "fastMoves": ["bubble", "mud shot"], "chargedMoves": ["water pulse", "mud bomb", "bubble beam"]}, {"dex": 62, "name": "poliwrath", "pokeType1": "water", "pokeType2": "fighting", "baseAtk": 182, "baseDef": 187, "baseStm": 180, "fastMoves": ["bubble", "rock smash"], "chargedMoves": ["hydro pump", "dynamic punch", "ice punch"]}, {"dex": 63, "name": "abra", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 195, "baseDef": 103, "baseStm": 50, "fastMoves": ["zen headbutt", "charge beam"], "chargedMoves": ["psyshock", "signal beam", "shadow ball"]}, {"dex": 64, "name": "kadabra", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 232, "baseDef": 138, "baseStm": 80, "fastMoves": ["psycho cut", "confusion"], "chargedMoves": ["psybeam", "dazzling gleam", "shadow ball"]}, {"dex": 65, "name": "alakazam", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 271, "baseDef": 194, "baseStm": 110, "fastMoves": ["psycho cut", "confusion"], "chargedMoves": ["futuresight", "focus blast", "shadow ball"]}, {"dex": 66, "name": "machop", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 137, "baseDef": 88, "baseStm": 140, "fastMoves": ["rock smash", "karate chop"], "chargedMoves": ["low sweep", "brick break", "cross chop"]}, {"dex": 67, "name": "machoke", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 177, "baseDef": 130, "baseStm": 160, "fastMoves": ["low kick", "karate chop"], "chargedMoves": ["submission", "brick break", "dynamic punch"]}, {"dex": 68, "name": "machamp", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 234, "baseDef": 162, "baseStm": 180, "fastMoves": ["bullet punch", "counter"], "chargedMoves": ["heavy slam", "dynamic punch", "close combat"]}, {"dex": 69, "name": "bellsprout", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 139, "baseDef": 64, "baseStm": 100, "fastMoves": ["vine whip", "acid"], "chargedMoves": ["power whip", "sludge bomb", "wrap"]}, {"dex": 70, "name": "weepinbell", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 172, "baseDef": 95, "baseStm": 130, "fastMoves": ["bullet seed", "acid"], "chargedMoves": ["power whip", "sludge bomb", "seed bomb"]}, {"dex": 71, "name": "victreebel", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 207, "baseDef": 138, "baseStm": 160, "fastMoves": ["razor leaf", "acid"], "chargedMoves": ["leaf blade", "sludge bomb", "solar beam"]}, {"dex": 72, "name": "tentacool", "pokeType1": "water", "pokeType2": "poison", "baseAtk": 97, "baseDef": 182, "baseStm": 80, "fastMoves": ["bubble", "poison sting"], "chargedMoves": ["bubble beam", "water pulse", "wrap"]}, {"dex": 73, "name": "tentacruel", "pokeType1": "water", "pokeType2": "poison", "baseAtk": 166, "baseDef": 237, "baseStm": 160, "fastMoves": ["acid", "poison jab"], "chargedMoves": ["hydro pump", "sludge wave", "blizzard"]}, {"dex": 74, "name": "geodude", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 132, "baseDef": 163, "baseStm": 80, "fastMoves": ["rock throw", "tackle"], "chargedMoves": ["rock slide", "rock tomb", "dig"]}, {"dex": 75, "name": "graveler", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 164, "baseDef": 196, "baseStm": 110, "fastMoves": ["rock throw", "mud slap"], "chargedMoves": ["dig", "stone edge", "rock blast"]}, {"dex": 76, "name": "golem", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 211, "baseDef": 229, "baseStm": 160, "fastMoves": ["rock throw", "mud slap"], "chargedMoves": ["stone edge", "rock blast", "earthquake"]}, {"dex": 77, "name": "ponyta", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 170, "baseDef": 132, "baseStm": 100, "fastMoves": ["tackle", "ember"], "chargedMoves": ["flame charge", "flame wheel", "stomp"]}, {"dex": 78, "name": "rapidash", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 207, "baseDef": 167, "baseStm": 130, "fastMoves": ["low kick", "fire spin"], "chargedMoves": ["fire blast", "drill run", "heat wave"]}, {"dex": 79, "name": "slowpoke", "pokeType1": "water", "pokeType2": "psychic", "baseAtk": 109, "baseDef": 109, "baseStm": 180, "fastMoves": ["water gun", "confusion"], "chargedMoves": ["water pulse", "psyshock", "psychic"]}, {"dex": 80, "name": "slowbro", "pokeType1": "water", "pokeType2": "psychic", "baseAtk": 177, "baseDef": 194, "baseStm": 190, "fastMoves": ["water gun", "confusion"], "chargedMoves": ["water pulse", "psychic", "ice beam"]}, {"dex": 81, "name": "magnemite", "pokeType1": "electric", "pokeType2": "steel", "baseAtk": 165, "baseDef": 128, "baseStm": 50, "fastMoves": ["spark", "thunder shock"], "chargedMoves": ["discharge", "magnet bomb", "thunderbolt"]}, {"dex": 82, "name": "magneton", "pokeType1": "electric", "pokeType2": "steel", "baseAtk": 223, "baseDef": 182, "baseStm": 100, "fastMoves": ["spark", "charge beam"], "chargedMoves": ["zap cannon", "magnet bomb", "flash cannon"]}, {"dex": 83, "name": "farfetchd", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 124, "baseDef": 118, "baseStm": 104, "fastMoves": ["air slash", "fury cutter"], "chargedMoves": ["aerial ace", "air cutter", "leaf blade"]}, {"dex": 84, "name": "doduo", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 158, "baseDef": 88, "baseStm": 70, "fastMoves": ["peck", "quick attack"], "chargedMoves": ["drill peck", "aerial ace", "brave bird"]}, {"dex": 85, "name": "dodrio", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 218, "baseDef": 145, "baseStm": 120, "fastMoves": ["feint attack", "steel wing"], "chargedMoves": ["drill peck", "aerial ace", "brave bird"]}, {"dex": 86, "name": "seel", "pokeType1": "water", "pokeType2": "none", "baseAtk": 85, "baseDef": 128, "baseStm": 130, "fastMoves": ["ice shard", "lick"], "chargedMoves": ["aurora beam", "icy wind", "aqua tail"]}, {"dex": 87, "name": "dewgong", "pokeType1": "water", "pokeType2": "ice", "baseAtk": 139, "baseDef": 184, "baseStm": 180, "fastMoves": ["frost breath", "iron tail"], "chargedMoves": ["aurora beam", "water pulse", "blizzard"]}, {"dex": 88, "name": "grimer", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 135, "baseDef": 90, "baseStm": 160, "fastMoves": ["poison jab", "mud slap"], "chargedMoves": ["sludge", "mud bomb", "sludge bomb"]}, {"dex": 89, "name": "muk", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 190, "baseDef": 184, "baseStm": 210, "fastMoves": ["infestation", "poison jab"], "chargedMoves": ["dark pulse", "gunk shot", "sludge wave"]}, {"dex": 90, "name": "shellder", "pokeType1": "water", "pokeType2": "none", "baseAtk": 116, "baseDef": 168, "baseStm": 60, "fastMoves": ["ice shard", "tackle"], "chargedMoves": ["bubble beam", "water pulse", "icy wind"]}, {"dex": 91, "name": "cloyster", "pokeType1": "water", "pokeType2": "ice", "baseAtk": 186, "baseDef": 323, "baseStm": 100, "fastMoves": ["frost breath", "ice shard"], "chargedMoves": ["aurora beam", "hydro pump", "avalanche"]}, {"dex": 92, "name": "gastly", "pokeType1": "ghost", "pokeType2": "poison", "baseAtk": 186, "baseDef": 70, "baseStm": 60, "fastMoves": ["lick", "astonish"], "chargedMoves": ["night shade", "dark pulse", "sludge bomb"]}, {"dex": 93, "name": "haunter", "pokeType1": "ghost", "pokeType2": "poison", "baseAtk": 223, "baseDef": 112, "baseStm": 90, "fastMoves": ["shadow claw", "astonish"], "chargedMoves": ["shadow punch", "dark pulse", "sludge bomb"]}, {"dex": 94, "name": "gengar", "pokeType1": "ghost", "pokeType2": "poison", "baseAtk": 261, "baseDef": 156, "baseStm": 120, "fastMoves": ["sucker punch", "hex"], "chargedMoves": ["shadow ball", "focus blast", "sludge bomb"]}, {"dex": 95, "name": "onix", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 85, "baseDef": 288, "baseStm": 70, "fastMoves": ["rock throw", "tackle"], "chargedMoves": ["sand tomb", "stone edge", "heavy slam"]}, {"dex": 96, "name": "drowzee", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 89, "baseDef": 158, "baseStm": 120, "fastMoves": ["pound", "confusion"], "chargedMoves": ["psybeam", "psyshock", "psychic"]}, {"dex": 97, "name": "hypno", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 144, "baseDef": 215, "baseStm": 170, "fastMoves": ["zen headbutt", "confusion"], "chargedMoves": ["futuresight", "psychic", "focus blast"]}, {"dex": 98, "name": "krabby", "pokeType1": "water", "pokeType2": "none", "baseAtk": 181, "baseDef": 156, "baseStm": 60, "fastMoves": ["bubble", "mud shot"], "chargedMoves": ["vice grip", "bubble beam", "water pulse"]}, {"dex": 99, "name": "kingler", "pokeType1": "water", "pokeType2": "none", "baseAtk": 240, "baseDef": 214, "baseStm": 110, "fastMoves": ["bubble", "metal claw"], "chargedMoves": ["vice grip", "x scissor", "water pulse"]}, {"dex": 100, "name": "voltorb", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 109, "baseDef": 114, "baseStm": 80, "fastMoves": ["spark", "tackle"], "chargedMoves": ["discharge", "thunderbolt", "gyro ball"]}, {"dex": 101, "name": "electrode", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 173, "baseDef": 179, "baseStm": 120, "fastMoves": ["spark", "volt switch"], "chargedMoves": ["discharge", "thunderbolt", "hyper beam"]}, {"dex": 102, "name": "exeggcute", "pokeType1": "grass", "pokeType2": "psychic", "baseAtk": 107, "baseDef": 140, "baseStm": 120, "fastMoves": ["confusion", "bullet seed"], "chargedMoves": ["seed bomb", "psychic", "ancient power"]}, {"dex": 103, "name": "exeggutor", "pokeType1": "grass", "pokeType2": "psychic", "baseAtk": 233, "baseDef": 158, "baseStm": 190, "fastMoves": ["bullet seed", "extrasensory"], "chargedMoves": ["seed bomb", "psychic", "solar beam"]}, {"dex": 104, "name": "cubone", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 90, "baseDef": 165, "baseStm": 100, "fastMoves": ["mud slap", "rock smash"], "chargedMoves": ["bone club", "dig", "bulldoze"]}, {"dex": 105, "name": "marowak", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 144, "baseDef": 200, "baseStm": 120, "fastMoves": ["mud slap", "rock smash"], "chargedMoves": ["bone club", "dig", "earthquake"]}, {"dex": 106, "name": "hitmonlee", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 224, "baseDef": 211, "baseStm": 100, "fastMoves": ["low kick", "rock smash"], "chargedMoves": ["close combat", "low sweep", "stone edge"]}, {"dex": 107, "name": "hitmonchan", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 193, "baseDef": 212, "baseStm": 100, "fastMoves": ["bullet punch", "counter"], "chargedMoves": ["fire punch", "ice punch", "thunder punch", "close combat"]}, {"dex": 108, "name": "lickitung", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 108, "baseDef": 137, "baseStm": 180, "fastMoves": ["lick", "zen headbutt"], "chargedMoves": ["hyper beam", "stomp", "power whip"]}, {"dex": 109, "name": "koffing", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 119, "baseDef": 164, "baseStm": 80, "fastMoves": ["tackle", "infestation"], "chargedMoves": ["sludge", "sludge bomb", "dark pulse"]}, {"dex": 110, "name": "weezing", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 174, "baseDef": 221, "baseStm": 130, "fastMoves": ["tackle", "infestation"], "chargedMoves": ["sludge bomb", "shadow ball", "dark pulse"]}, {"dex": 111, "name": "rhyhorn", "pokeType1": "ground", "pokeType2": "rock", "baseAtk": 140, "baseDef": 157, "baseStm": 160, "fastMoves": ["mud slap", "rock smash"], "chargedMoves": ["bulldoze", "horn attack", "stomp"]}, {"dex": 112, "name": "rhydon", "pokeType1": "ground", "pokeType2": "rock", "baseAtk": 222, "baseDef": 206, "baseStm": 210, "fastMoves": ["mud slap", "rock smash"], "chargedMoves": ["surf", "earthquake", "stone edge"]}, {"dex": 113, "name": "chansey", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 60, "baseDef": 176, "baseStm": 500, "fastMoves": ["pound", "zen headbutt"], "chargedMoves": ["psychic", "hyper beam", "dazzling gleam"]}, {"dex": 114, "name": "tangela", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 183, "baseDef": 205, "baseStm": 130, "fastMoves": ["vine whip", "infestation"], "chargedMoves": ["grass knot", "sludge bomb", "solar beam"]}, {"dex": 115, "name": "kangaskhan", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 181, "baseDef": 165, "baseStm": 210, "fastMoves": ["mud slap", "low kick"], "chargedMoves": ["crunch", "earthquake", "outrage"]}, {"dex": 116, "name": "horsea", "pokeType1": "water", "pokeType2": "none", "baseAtk": 129, "baseDef": 125, "baseStm": 60, "fastMoves": ["water gun", "bubble"], "chargedMoves": ["bubble beam", "dragon pulse", "flash cannon"]}, {"dex": 117, "name": "seadra", "pokeType1": "water", "pokeType2": "none", "baseAtk": 187, "baseDef": 182, "baseStm": 110, "fastMoves": ["water gun", "dragon breath"], "chargedMoves": ["aurora beam", "dragon pulse", "hydro pump"]}, {"dex": 118, "name": "goldeen", "pokeType1": "water", "pokeType2": "none", "baseAtk": 123, "baseDef": 115, "baseStm": 90, "fastMoves": ["peck", "mud shot"], "chargedMoves": ["water pulse", "horn attack", "aqua tail"]}, {"dex": 119, "name": "seaking", "pokeType1": "water", "pokeType2": "none", "baseAtk": 175, "baseDef": 154, "baseStm": 160, "fastMoves": ["peck", "waterfall"], "chargedMoves": ["ice beam", "water pulse", "megahorn"]}, {"dex": 120, "name": "staryu", "pokeType1": "water", "pokeType2": "none", "baseAtk": 137, "baseDef": 112, "baseStm": 60, "fastMoves": ["tackle", "water gun"], "chargedMoves": ["swift", "bubble beam", "power gem"]}, {"dex": 121, "name": "starmie", "pokeType1": "water", "pokeType2": "psychic", "baseAtk": 210, "baseDef": 184, "baseStm": 120, "fastMoves": ["hidden power", "water gun"], "chargedMoves": ["hydro pump", "power gem", "psychic"]}, {"dex": 122, "name": "mr mime", "pokeType1": "psychic", "pokeType2": "fairy", "baseAtk": 192, "baseDef": 233, "baseStm": 80, "fastMoves": ["confusion", "zen headbutt"], "chargedMoves": ["psybeam", "psychic", "shadow ball"]}, {"dex": 123, "name": "scyther", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 218, "baseDef": 170, "baseStm": 140, "fastMoves": ["fury cutter", "air slash"], "chargedMoves": ["night slash", "x scissor", "aerial ace"]}, {"dex": 124, "name": "jynx", "pokeType1": "ice", "pokeType2": "psychic", "baseAtk": 223, "baseDef": 182, "baseStm": 130, "fastMoves": ["frost breath", "confusion"], "chargedMoves": ["draining kiss", "avalanche", "psyshock"]}, {"dex": 125, "name": "electabuzz", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 198, "baseDef": 173, "baseStm": 130, "fastMoves": ["thunder shock", "low kick"], "chargedMoves": ["thunder punch", "thunderbolt", "thunder"]}, {"dex": 126, "name": "magmar", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 206, "baseDef": 169, "baseStm": 130, "fastMoves": ["ember", "karate chop"], "chargedMoves": ["fire blast", "fire punch", "flamethrower"]}, {"dex": 127, "name": "pinsir", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 238, "baseDef": 197, "baseStm": 130, "fastMoves": ["rock smash", "bug bite"], "chargedMoves": ["vice grip", "x scissor", "close combat"]}, {"dex": 128, "name": "tauros", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 198, "baseDef": 197, "baseStm": 150, "fastMoves": ["tackle", "zen headbutt"], "chargedMoves": ["horn attack", "iron head", "earthquake"]}, {"dex": 129, "name": "magikarp", "pokeType1": "water", "pokeType2": "none", "baseAtk": 29, "baseDef": 102, "baseStm": 40, "fastMoves": ["splash"], "chargedMoves": ["struggle"]}, {"dex": 130, "name": "gyarados", "pokeType1": "water", "pokeType2": "flying", "baseAtk": 237, "baseDef": 197, "baseStm": 190, "fastMoves": ["bite", "waterfall"], "chargedMoves": ["hydro pump", "crunch", "outrage"]}, {"dex": 131, "name": "lapras", "pokeType1": "water", "pokeType2": "ice", "baseAtk": 165, "baseDef": 180, "baseStm": 260, "fastMoves": ["frost breath", "water gun"], "chargedMoves": ["hydro pump", "surf", "blizzard"]}, {"dex": 132, "name": "ditto", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 91, "baseDef": 91, "baseStm": 96, "fastMoves": ["transform"], "chargedMoves": ["struggle"]}, {"dex": 133, "name": "eevee", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 104, "baseDef": 121, "baseStm": 110, "fastMoves": ["quick attack", "tackle"], "chargedMoves": ["dig", "swift"]}, {"dex": 134, "name": "vaporeon", "pokeType1": "water", "pokeType2": "none", "baseAtk": 205, "baseDef": 177, "baseStm": 260, "fastMoves": ["water gun"], "chargedMoves": ["water pulse", "hydro pump", "aqua tail"]}, {"dex": 135, "name": "jolteon", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 232, "baseDef": 201, "baseStm": 130, "fastMoves": ["thunder shock", "volt switch"], "chargedMoves": ["discharge", "thunderbolt", "thunder"]}, {"dex": 136, "name": "flareon", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 246, "baseDef": 204, "baseStm": 130, "fastMoves": ["ember", "fire spin"], "chargedMoves": ["fire blast", "flamethrower", "overheat"]}, {"dex": 137, "name": "porygon", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 153, "baseDef": 139, "baseStm": 130, "fastMoves": ["charge beam", "hidden power"], "chargedMoves": ["solar beam", "hyper beam", "zap cannon"]}, {"dex": 138, "name": "omanyte", "pokeType1": "rock", "pokeType2": "water", "baseAtk": 155, "baseDef": 174, "baseStm": 70, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["ancient power", "bubble beam", "rock blast"]}, {"dex": 139, "name": "omastar", "pokeType1": "rock", "pokeType2": "water", "baseAtk": 207, "baseDef": 227, "baseStm": 140, "fastMoves": ["mud shot", "water gun"], "chargedMoves": ["ancient power", "hydro pump", "rock blast"]}, {"dex": 140, "name": "kabuto", "pokeType1": "rock", "pokeType2": "water", "baseAtk": 148, "baseDef": 162, "baseStm": 60, "fastMoves": ["scratch", "mud shot"], "chargedMoves": ["ancient power", "aqua jet", "rock tomb"]}, {"dex": 141, "name": "kabutops", "pokeType1": "rock", "pokeType2": "water", "baseAtk": 220, "baseDef": 203, "baseStm": 120, "fastMoves": ["mud shot", "rock smash"], "chargedMoves": ["ancient power", "water pulse", "stone edge"]}, {"dex": 142, "name": "aerodactyl", "pokeType1": "rock", "pokeType2": "flying", "baseAtk": 221, "baseDef": 164, "baseStm": 160, "fastMoves": ["steel wing", "bite"], "chargedMoves": ["ancient power", "iron head", "hyper beam"]}, {"dex": 143, "name": "snorlax", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 190, "baseDef": 190, "baseStm": 320, "fastMoves": ["zen headbutt", "lick"], "chargedMoves": ["heavy slam", "hyper beam", "earthquake"]}, {"dex": 144, "name": "articuno", "pokeType1": "ice", "pokeType2": "flying", "baseAtk": 192, "baseDef": 249, "baseStm": 180, "fastMoves": ["frost breath"], "chargedMoves": ["ice beam", "icy wind", "blizzard"]}, {"dex": 145, "name": "zapdos", "pokeType1": "electric", "pokeType2": "flying", "baseAtk": 253, "baseDef": 188, "baseStm": 180, "fastMoves": ["charge beam"], "chargedMoves": ["zap cannon", "thunderbolt", "thunder"]}, {"dex": 146, "name": "moltres", "pokeType1": "fire", "pokeType2": "flying", "baseAtk": 251, "baseDef": 184, "baseStm": 180, "fastMoves": ["fire spin"], "chargedMoves": ["fire blast", "heat wave", "overheat"]}, {"dex": 147, "name": "dratini", "pokeType1": "dragon", "pokeType2": "none", "baseAtk": 119, "baseDef": 94, "baseStm": 82, "fastMoves": ["dragon breath", "iron tail"], "chargedMoves": ["wrap", "twister", "aqua tail"]}, {"dex": 148, "name": "dragonair", "pokeType1": "dragon", "pokeType2": "none", "baseAtk": 163, "baseDef": 138, "baseStm": 122, "fastMoves": ["dragon breath", "iron tail"], "chargedMoves": ["wrap", "aqua tail", "dragon pulse"]}, {"dex": 149, "name": "dragonite", "pokeType1": "dragon", "pokeType2": "flying", "baseAtk": 263, "baseDef": 201, "baseStm": 182, "fastMoves": ["dragon tail", "steel wing"], "chargedMoves": ["hurricane", "hyper beam", "outrage"]}, {"dex": 150, "name": "mewtwo", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 300, "baseDef": 182, "baseStm": 193, "fastMoves": ["psycho cut", "confusion"], "chargedMoves": ["psychic", "shadow ball", "hyper beam", "focus blast"]}, {"dex": 151, "name": "mew", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 210, "baseDef": 210, "baseStm": 200, "fastMoves": ["pound"], "chargedMoves": ["blizzard", "earthquake", "psychic", "focus blast", "thunder", "fire blast", "solar beam", "hyper beam"]}, {"dex": 152, "name": "chikorita", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 92, "baseDef": 122, "baseStm": 90, "fastMoves": ["vine whip", "tackle"], "chargedMoves": ["energy ball", "grass knot", "body slam"]}, {"dex": 153, "name": "bayleef", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 122, "baseDef": 155, "baseStm": 120, "fastMoves": ["razor leaf", "tackle"], "chargedMoves": ["energy ball", "grass knot", "ancient power"]}, {"dex": 154, "name": "meganium", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 168, "baseDef": 202, "baseStm": 160, "fastMoves": ["razor leaf", "vine whip"], "chargedMoves": ["petal blizzard", "solar beam", "earthquake"]}, {"dex": 155, "name": "cyndaquil", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 116, "baseDef": 96, "baseStm": 78, "fastMoves": ["ember", "tackle"], "chargedMoves": ["flame charge", "swift", "flamethrower"]}, {"dex": 156, "name": "quilava", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 158, "baseDef": 129, "baseStm": 116, "fastMoves": ["ember", "tackle"], "chargedMoves": ["flame charge", "dig", "flamethrower"]}, {"dex": 157, "name": "typhlosion", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 223, "baseDef": 176, "baseStm": 156, "fastMoves": ["ember", "shadow claw"], "chargedMoves": ["fire blast", "overheat", "solar beam"]}, {"dex": 158, "name": "totodile", "pokeType1": "water", "pokeType2": "none", "baseAtk": 117, "baseDef": 116, "baseStm": 100, "fastMoves": ["water gun", "scratch"], "chargedMoves": ["crunch", "aqua jet", "water pulse"]}, {"dex": 159, "name": "croconaw", "pokeType1": "water", "pokeType2": "none", "baseAtk": 150, "baseDef": 151, "baseStm": 130, "fastMoves": ["water gun", "scratch"], "chargedMoves": ["crunch", "ice punch", "water pulse"]}, {"dex": 160, "name": "feraligatr", "pokeType1": "water", "pokeType2": "none", "baseAtk": 205, "baseDef": 197, "baseStm": 170, "fastMoves": ["waterfall", "bite"], "chargedMoves": ["crunch", "hydro pump", "ice beam"]}, {"dex": 161, "name": "sentret", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 79, "baseDef": 77, "baseStm": 70, "fastMoves": ["scratch", "quick attack"], "chargedMoves": ["dig", "brick break", "grass knot"]}, {"dex": 162, "name": "furret", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 148, "baseDef": 130, "baseStm": 170, "fastMoves": ["quick attack", "sucker punch"], "chargedMoves": ["dig", "brick break", "hyper beam"]}, {"dex": 163, "name": "hoothoot", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 67, "baseDef": 101, "baseStm": 120, "fastMoves": ["feint attack", "peck"], "chargedMoves": ["aerial ace", "sky attack", "night shade"]}, {"dex": 164, "name": "noctowl", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 145, "baseDef": 179, "baseStm": 200, "fastMoves": ["wing attack", "extrasensory"], "chargedMoves": ["psychic", "sky attack", "night shade"]}, {"dex": 165, "name": "ledyba", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 72, "baseDef": 142, "baseStm": 80, "fastMoves": ["tackle", "bug bite"], "chargedMoves": ["silver wind", "swift", "aerial ace"]}, {"dex": 166, "name": "ledian", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 107, "baseDef": 209, "baseStm": 110, "fastMoves": ["struggle bug", "bug bite"], "chargedMoves": ["bug buzz", "silver wind", "aerial ace"]}, {"dex": 167, "name": "spinarak", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 105, "baseDef": 73, "baseStm": 80, "fastMoves": ["poison sting", "bug bite"], "chargedMoves": ["night slash", "signal beam", "cross poison"]}, {"dex": 168, "name": "ariados", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 161, "baseDef": 128, "baseStm": 140, "fastMoves": ["poison sting", "infestation"], "chargedMoves": ["shadow sneak", "megahorn", "cross poison"]}, {"dex": 169, "name": "crobat", "pokeType1": "poison", "pokeType2": "flying", "baseAtk": 194, "baseDef": 178, "baseStm": 170, "fastMoves": ["air slash", "bite"], "chargedMoves": ["shadow ball", "air cutter", "sludge bomb"]}, {"dex": 170, "name": "chinchou", "pokeType1": "water", "pokeType2": "electric", "baseAtk": 106, "baseDef": 106, "baseStm": 150, "fastMoves": ["bubble", "spark"], "chargedMoves": ["water pulse", "thunderbolt", "bubble beam"]}, {"dex": 171, "name": "lanturn", "pokeType1": "water", "pokeType2": "electric", "baseAtk": 146, "baseDef": 146, "baseStm": 250, "fastMoves": ["water gun", "charge beam"], "chargedMoves": ["hydro pump", "thunderbolt", "thunder"]}, {"dex": 172, "name": "pichu", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 77, "baseDef": 63, "baseStm": 40, "fastMoves": ["thunder shock"], "chargedMoves": ["thunderbolt", "disarming voice", "thunder punch"]}, {"dex": 173, "name": "cleffa", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 75, "baseDef": 91, "baseStm": 100, "fastMoves": ["pound", "zen headbutt"], "chargedMoves": ["grass knot", "psyshock", "signal beam"]}, {"dex": 174, "name": "igglybuff", "pokeType1": "normal", "pokeType2": "fairy", "baseAtk": 69, "baseDef": 34, "baseStm": 180, "fastMoves": ["pound", "feint attack"], "chargedMoves": ["wild charge", "shadow ball", "psychic"]}, {"dex": 175, "name": "togepi", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 67, "baseDef": 116, "baseStm": 70, "fastMoves": ["hidden power", "peck"], "chargedMoves": ["ancient power", "psyshock", "dazzling gleam"]}, {"dex": 176, "name": "togetic", "pokeType1": "fairy", "pokeType2": "flying", "baseAtk": 139, "baseDef": 191, "baseStm": 110, "fastMoves": ["extrasensory", "hidden power"], "chargedMoves": ["ancient power", "dazzling gleam", "aerial ace"]}, {"dex": 177, "name": "natu", "pokeType1": "psychic", "pokeType2": "flying", "baseAtk": 134, "baseDef": 89, "baseStm": 80, "fastMoves": ["peck", "quick attack"], "chargedMoves": ["night shade", "psyshock", "drill peck"]}, {"dex": 178, "name": "xatu", "pokeType1": "psychic", "pokeType2": "flying", "baseAtk": 192, "baseDef": 146, "baseStm": 130, "fastMoves": ["air slash", "feint attack"], "chargedMoves": ["ominous wind", "futuresight", "aerial ace"]}, {"dex": 179, "name": "mareep", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 114, "baseDef": 82, "baseStm": 110, "fastMoves": ["tackle", "thunder shock"], "chargedMoves": ["body slam", "thunderbolt", "discharge"]}, {"dex": 180, "name": "flaaffy", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 145, "baseDef": 112, "baseStm": 140, "fastMoves": ["tackle", "charge beam"], "chargedMoves": ["power gem", "thunderbolt", "discharge"]}, {"dex": 181, "name": "ampharos", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 211, "baseDef": 172, "baseStm": 180, "fastMoves": ["charge beam", "volt switch"], "chargedMoves": ["zap cannon", "focus blast", "thunder"]}, {"dex": 182, "name": "bellossom", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 169, "baseDef": 189, "baseStm": 150, "fastMoves": ["razor leaf", "acid"], "chargedMoves": ["leaf blade", "petal blizzard", "dazzling gleam"]}, {"dex": 183, "name": "marill", "pokeType1": "water", "pokeType2": "fairy", "baseAtk": 37, "baseDef": 93, "baseStm": 140, "fastMoves": ["tackle", "bubble"], "chargedMoves": ["bubble beam", "aqua tail", "body slam"]}, {"dex": 184, "name": "azumarill", "pokeType1": "water", "pokeType2": "fairy", "baseAtk": 112, "baseDef": 152, "baseStm": 200, "fastMoves": ["rock smash", "bubble"], "chargedMoves": ["play rough", "hydro pump", "ice beam"]}, {"dex": 185, "name": "sudowoodo", "pokeType1": "rock", "pokeType2": "none", "baseAtk": 167, "baseDef": 198, "baseStm": 140, "fastMoves": ["rock throw", "counter"], "chargedMoves": ["stone edge", "earthquake", "rock slide"]}, {"dex": 186, "name": "politoed", "pokeType1": "water", "pokeType2": "none", "baseAtk": 174, "baseDef": 192, "baseStm": 180, "fastMoves": ["mud shot", "bubble"], "chargedMoves": ["hydro pump", "blizzard", "surf"]}, {"dex": 187, "name": "hoppip", "pokeType1": "grass", "pokeType2": "flying", "baseAtk": 67, "baseDef": 101, "baseStm": 70, "fastMoves": ["tackle", "bullet seed"], "chargedMoves": ["grass knot", "dazzling gleam", "seed bomb"]}, {"dex": 188, "name": "skiploom", "pokeType1": "grass", "pokeType2": "flying", "baseAtk": 91, "baseDef": 127, "baseStm": 110, "fastMoves": ["tackle", "bullet seed"], "chargedMoves": ["grass knot", "dazzling gleam", "energy ball"]}, {"dex": 189, "name": "jumpluff", "pokeType1": "grass", "pokeType2": "flying", "baseAtk": 118, "baseDef": 197, "baseStm": 150, "fastMoves": ["infestation", "bullet seed"], "chargedMoves": ["energy ball", "dazzling gleam", "solar beam"]}, {"dex": 190, "name": "aipom", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 136, "baseDef": 112, "baseStm": 110, "fastMoves": ["scratch", "astonish"], "chargedMoves": ["low sweep", "swift", "aerial ace"]}, {"dex": 191, "name": "sunkern", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 55, "baseDef": 55, "baseStm": 60, "fastMoves": ["razor leaf", "cut"], "chargedMoves": ["energy ball", "grass knot", "seed bomb"]}, {"dex": 192, "name": "sunflora", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 185, "baseDef": 148, "baseStm": 150, "fastMoves": ["razor leaf", "bullet seed"], "chargedMoves": ["solar beam", "petal blizzard", "sludge bomb"]}, {"dex": 193, "name": "yanma", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 154, "baseDef": 94, "baseStm": 130, "fastMoves": ["quick attack", "wing attack"], "chargedMoves": ["ancient power", "aerial ace", "silver wind"]}, {"dex": 194, "name": "wooper", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 75, "baseDef": 75, "baseStm": 110, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["mud bomb", "dig", "body slam"]}, {"dex": 195, "name": "quagsire", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 152, "baseDef": 152, "baseStm": 190, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["sludge bomb", "earthquake", "stone edge"]}, {"dex": 196, "name": "espeon", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 261, "baseDef": 194, "baseStm": 130, "fastMoves": ["confusion", "zen headbutt"], "chargedMoves": ["psybeam", "psychic", "futuresight"]}, {"dex": 197, "name": "umbreon", "pokeType1": "dark", "pokeType2": "none", "baseAtk": 126, "baseDef": 250, "baseStm": 190, "fastMoves": ["feint attack", "snarl"], "chargedMoves": ["dark pulse", "foul play"]}, {"dex": 198, "name": "murkrow", "pokeType1": "dark", "pokeType2": "flying", "baseAtk": 175, "baseDef": 87, "baseStm": 120, "fastMoves": ["peck", "feint attack"], "chargedMoves": ["drill peck", "foul play", "dark pulse"]}, {"dex": 199, "name": "slowking", "pokeType1": "water", "pokeType2": "psychic", "baseAtk": 177, "baseDef": 194, "baseStm": 190, "fastMoves": ["water gun", "confusion"], "chargedMoves": ["blizzard", "psychic", "fire blast"]}, {"dex": 200, "name": "misdreavus", "pokeType1": "ghost", "pokeType2": "none", "baseAtk": 167, "baseDef": 167, "baseStm": 120, "fastMoves": ["astonish", "hex"], "chargedMoves": ["shadow sneak", "dark pulse", "ominous wind"]}, {"dex": 201, "name": "unown", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 136, "baseDef": 91, "baseStm": 96, "fastMoves": ["hidden power"], "chargedMoves": ["struggle"]}, {"dex": 202, "name": "wobbuffet", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 60, "baseDef": 106, "baseStm": 380, "fastMoves": ["counter", "splash"], "chargedMoves": ["mirror coat"]}, {"dex": 203, "name": "girafarig", "pokeType1": "normal", "pokeType2": "psychic", "baseAtk": 182, "baseDef": 133, "baseStm": 140, "fastMoves": ["tackle", "confusion"], "chargedMoves": ["psychic", "thunderbolt", "mirror coat"]}, {"dex": 204, "name": "pineco", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 108, "baseDef": 146, "baseStm": 100, "fastMoves": ["tackle", "bug bite"], "chargedMoves": ["gyro ball", "rock tomb", "sand tomb"]}, {"dex": 205, "name": "forretress", "pokeType1": "bug", "pokeType2": "steel", "baseAtk": 161, "baseDef": 242, "baseStm": 150, "fastMoves": ["bug bite", "struggle bug"], "chargedMoves": ["heavy slam", "earthquake", "rock tomb"]}, {"dex": 206, "name": "dunsparce", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 131, "baseDef": 131, "baseStm": 200, "fastMoves": ["bite", "astonish"], "chargedMoves": ["dig", "rock slide", "drill run"]}, {"dex": 207, "name": "gligar", "pokeType1": "ground", "pokeType2": "flying", "baseAtk": 143, "baseDef": 204, "baseStm": 130, "fastMoves": ["fury cutter", "wing attack"], "chargedMoves": ["dig", "aerial ace", "night slash"]}, {"dex": 208, "name": "steelix", "pokeType1": "steel", "pokeType2": "ground", "baseAtk": 148, "baseDef": 333, "baseStm": 150, "fastMoves": ["iron tail", "dragon tail"], "chargedMoves": ["earthquake", "heavy slam", "crunch"]}, {"dex": 209, "name": "snubbull", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 137, "baseDef": 89, "baseStm": 120, "fastMoves": ["tackle", "bite"], "chargedMoves": ["crunch", "dazzling gleam", "brick break"]}, {"dex": 210, "name": "granbull", "pokeType1": "fairy", "pokeType2": "none", "baseAtk": 212, "baseDef": 137, "baseStm": 180, "fastMoves": ["bite", "snarl"], "chargedMoves": ["crunch", "play rough", "close combat"]}, {"dex": 211, "name": "qwilfish", "pokeType1": "water", "pokeType2": "poison", "baseAtk": 184, "baseDef": 148, "baseStm": 130, "fastMoves": ["poison sting", "water gun"], "chargedMoves": ["aqua tail", "ice beam", "sludge wave"]}, {"dex": 212, "name": "scizor", "pokeType1": "bug", "pokeType2": "steel", "baseAtk": 236, "baseDef": 191, "baseStm": 140, "fastMoves": ["bullet punch", "fury cutter"], "chargedMoves": ["x scissor", "iron head", "night slash"]}, {"dex": 213, "name": "shuckle", "pokeType1": "bug", "pokeType2": "rock", "baseAtk": 17, "baseDef": 396, "baseStm": 40, "fastMoves": ["struggle bug", "rock throw"], "chargedMoves": ["rock blast", "stone edge", "gyro ball"]}, {"dex": 214, "name": "heracross", "pokeType1": "bug", "pokeType2": "fighting", "baseAtk": 234, "baseDef": 189, "baseStm": 160, "fastMoves": ["counter", "struggle bug"], "chargedMoves": ["megahorn", "close combat", "earthquake"]}, {"dex": 215, "name": "sneasel", "pokeType1": "dark", "pokeType2": "ice", "baseAtk": 189, "baseDef": 157, "baseStm": 110, "fastMoves": ["ice shard", "feint attack"], "chargedMoves": ["avalanche", "ice punch", "foul play"]}, {"dex": 216, "name": "teddiursa", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 142, "baseDef": 93, "baseStm": 120, "fastMoves": ["scratch", "lick"], "chargedMoves": ["cross chop", "crunch", "play rough"]}, {"dex": 217, "name": "ursaring", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 236, "baseDef": 144, "baseStm": 180, "fastMoves": ["metal claw", "counter"], "chargedMoves": ["close combat", "hyper beam", "play rough"]}, {"dex": 218, "name": "slugma", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 118, "baseDef": 71, "baseStm": 80, "fastMoves": ["ember", "rock throw"], "chargedMoves": ["flame burst", "flame charge", "rock slide"]}, {"dex": 219, "name": "magcargo", "pokeType1": "fire", "pokeType2": "rock", "baseAtk": 139, "baseDef": 209, "baseStm": 100, "fastMoves": ["ember", "rock throw"], "chargedMoves": ["heat wave", "overheat", "stone edge"]}, {"dex": 220, "name": "swinub", "pokeType1": "ice", "pokeType2": "ground", "baseAtk": 90, "baseDef": 74, "baseStm": 100, "fastMoves": ["tackle", "powder snow"], "chargedMoves": ["icy wind", "body slam", "rock slide"]}, {"dex": 221, "name": "piloswine", "pokeType1": "ice", "pokeType2": "ground", "baseAtk": 181, "baseDef": 147, "baseStm": 200, "fastMoves": ["ice shard", "powder snow"], "chargedMoves": ["avalanche", "bulldoze", "stone edge"]}, {"dex": 222, "name": "corsola", "pokeType1": "water", "pokeType2": "rock", "baseAtk": 118, "baseDef": 156, "baseStm": 110, "fastMoves": ["tackle", "bubble"], "chargedMoves": ["rock blast", "power gem", "bubble beam"]}, {"dex": 223, "name": "remoraid", "pokeType1": "water", "pokeType2": "none", "baseAtk": 127, "baseDef": 69, "baseStm": 70, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["aurora beam", "water pulse", "rock blast"]}, {"dex": 224, "name": "octillery", "pokeType1": "water", "pokeType2": "none", "baseAtk": 197, "baseDef": 141, "baseStm": 150, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["gunk shot", "water pulse", "aurora beam"]}, {"dex": 225, "name": "delibird", "pokeType1": "ice", "pokeType2": "flying", "baseAtk": 128, "baseDef": 90, "baseStm": 90, "fastMoves": ["present"], "chargedMoves": ["ice punch", "icy wind", "aerial ace"]}, {"dex": 226, "name": "mantine", "pokeType1": "water", "pokeType2": "flying", "baseAtk": 148, "baseDef": 260, "baseStm": 130, "fastMoves": ["bubble", "wing attack"], "chargedMoves": ["water pulse", "ice beam", "aerial ace"]}, {"dex": 227, "name": "skarmory", "pokeType1": "steel", "pokeType2": "flying", "baseAtk": 148, "baseDef": 260, "baseStm": 130, "fastMoves": ["steel wing", "air slash"], "chargedMoves": ["brave bird", "sky attack", "flash cannon"]}, {"dex": 228, "name": "houndour", "pokeType1": "dark", "pokeType2": "fire", "baseAtk": 152, "baseDef": 93, "baseStm": 90, "fastMoves": ["feint attack", "ember"], "chargedMoves": ["crunch", "flamethrower", "dark pulse"]}, {"dex": 229, "name": "houndoom", "pokeType1": "dark", "pokeType2": "fire", "baseAtk": 224, "baseDef": 159, "baseStm": 150, "fastMoves": ["snarl", "fire fang"], "chargedMoves": ["crunch", "fire blast", "foul play"]}, {"dex": 230, "name": "kingdra", "pokeType1": "water", "pokeType2": "dragon", "baseAtk": 194, "baseDef": 194, "baseStm": 150, "fastMoves": ["waterfall", "dragon breath"], "chargedMoves": ["hydro pump", "blizzard", "outrage"]}, {"dex": 231, "name": "phanpy", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 107, "baseDef": 107, "baseStm": 180, "fastMoves": ["tackle", "rock smash"], "chargedMoves": ["bulldoze", "rock slide", "body slam"]}, {"dex": 232, "name": "donphan", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 214, "baseDef": 214, "baseStm": 180, "fastMoves": ["tackle", "counter"], "chargedMoves": ["earthquake", "heavy slam", "play rough"]}, {"dex": 233, "name": "porygon2", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 198, "baseDef": 183, "baseStm": 170, "fastMoves": ["hidden power", "charge beam"], "chargedMoves": ["solar beam", "hyper beam", "zap cannon"]}, {"dex": 234, "name": "stantler", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 192, "baseDef": 132, "baseStm": 146, "fastMoves": ["tackle", "zen headbutt"], "chargedMoves": ["stomp", "wild charge", "megahorn"]}, {"dex": 235, "name": "smeargle", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 40, "baseDef": 88, "baseStm": 110, "fastMoves": ["tackle"], "chargedMoves": ["struggle"]}, {"dex": 236, "name": "tyrogue", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 64, "baseDef": 64, "baseStm": 70, "fastMoves": ["rock smash", "tackle"], "chargedMoves": ["brick break", "rock slide", "low sweep"]}, {"dex": 237, "name": "hitmontop", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 173, "baseDef": 214, "baseStm": 100, "fastMoves": ["rock smash", "counter"], "chargedMoves": ["close combat", "gyro ball", "stone edge"]}, {"dex": 238, "name": "smoochum", "pokeType1": "ice", "pokeType2": "psychic", "baseAtk": 153, "baseDef": 116, "baseStm": 90, "fastMoves": ["powder snow", "pound"], "chargedMoves": ["ice beam", "ice punch", "psyshock"]}, {"dex": 239, "name": "elekid", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 135, "baseDef": 110, "baseStm": 90, "fastMoves": ["thunder shock", "low kick"], "chargedMoves": ["thunder punch", "brick break", "discharge"]}, {"dex": 240, "name": "magby", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 151, "baseDef": 108, "baseStm": 90, "fastMoves": ["ember", "karate chop"], "chargedMoves": ["brick break", "fire punch", "flame burst"]}, {"dex": 241, "name": "miltank", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 157, "baseDef": 211, "baseStm": 190, "fastMoves": ["tackle", "zen headbutt"], "chargedMoves": ["stomp", "body slam", "gyro ball"]}, {"dex": 242, "name": "blissey", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 129, "baseDef": 229, "baseStm": 510, "fastMoves": ["pound", "zen headbutt"], "chargedMoves": ["psychic", "hyper beam", "dazzling gleam"]}, {"dex": 243, "name": "raikou", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 241, "baseDef": 210, "baseStm": 180, "fastMoves": ["thunder shock", "volt switch"], "chargedMoves": ["thunder", "thunderbolt", "wild charge"]}, {"dex": 244, "name": "entei", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 235, "baseDef": 176, "baseStm": 230, "fastMoves": ["fire spin", "fire fang"], "chargedMoves": ["flamethrower", "fire blast", "overheat"]}, {"dex": 245, "name": "suicune", "pokeType1": "water", "pokeType2": "none", "baseAtk": 180, "baseDef": 235, "baseStm": 200, "fastMoves": ["extrasensory", "snarl"], "chargedMoves": ["hydro pump", "bubble beam", "water pulse"]}, {"dex": 246, "name": "larvitar", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 115, "baseDef": 93, "baseStm": 100, "fastMoves": ["bite", "rock smash"], "chargedMoves": ["stomp", "crunch", "ancient power"]}, {"dex": 247, "name": "pupitar", "pokeType1": "rock", "pokeType2": "ground", "baseAtk": 155, "baseDef": 133, "baseStm": 140, "fastMoves": ["bite", "rock smash"], "chargedMoves": ["dig", "crunch", "ancient power"]}, {"dex": 248, "name": "tyranitar", "pokeType1": "rock", "pokeType2": "dark", "baseAtk": 251, "baseDef": 212, "baseStm": 200, "fastMoves": ["bite", "iron tail"], "chargedMoves": ["fire blast", "crunch", "stone edge"]}, {"dex": 249, "name": "lugia", "pokeType1": "psychic", "pokeType2": "flying", "baseAtk": 193, "baseDef": 323, "baseStm": 212, "fastMoves": ["extrasensory", "dragon tail"], "chargedMoves": ["sky attack", "hydro pump", "futuresight"]}, {"dex": 250, "name": "ho oh", "pokeType1": "fire", "pokeType2": "flying", "baseAtk": 239, "baseDef": 274, "baseStm": 193, "fastMoves": ["extrasensory", "steel wing"], "chargedMoves": ["brave bird", "fire blast", "solar beam"]}, {"dex": 251, "name": "celebi", "pokeType1": "psychic", "pokeType2": "grass", "baseAtk": 210, "baseDef": 210, "baseStm": 200, "fastMoves": ["confusion", "charge beam"], "chargedMoves": ["hyper beam", "psychic", "dazzling gleam"]}, {"dex": 252, "name": "treecko", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 124, "baseDef": 104, "baseStm": 80, "fastMoves": ["pound", "bullet seed"], "chargedMoves": ["energy ball", "aerial ace", "grass knot"]}, {"dex": 253, "name": "grovyle", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 172, "baseDef": 130, "baseStm": 100, "fastMoves": ["quick attack", "bullet seed"], "chargedMoves": ["leaf blade", "aerial ace", "grass knot"]}, {"dex": 254, "name": "sceptile", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 223, "baseDef": 180, "baseStm": 140, "fastMoves": ["fury cutter", "bullet seed"], "chargedMoves": ["leaf blade", "aerial ace", "earthquake"]}, {"dex": 255, "name": "torchic", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 130, "baseDef": 92, "baseStm": 90, "fastMoves": ["scratch", "ember"], "chargedMoves": ["flame charge", "flamethrower", "rock tomb"]}, {"dex": 256, "name": "combusken", "pokeType1": "fire", "pokeType2": "fighting", "baseAtk": 163, "baseDef": 115, "baseStm": 120, "fastMoves": ["peck", "ember"], "chargedMoves": ["flame charge", "flamethrower", "rock slide"]}, {"dex": 257, "name": "blaziken", "pokeType1": "fire", "pokeType2": "fighting", "baseAtk": 240, "baseDef": 141, "baseStm": 160, "fastMoves": ["counter", "fire spin"], "chargedMoves": ["focus blast", "overheat", "brave bird"]}, {"dex": 258, "name": "mudkip", "pokeType1": "water", "pokeType2": "none", "baseAtk": 126, "baseDef": 93, "baseStm": 100, "fastMoves": ["tackle", "water gun"], "chargedMoves": ["dig", "sludge", "stomp"]}, {"dex": 259, "name": "marshtomp", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 156, "baseDef": 133, "baseStm": 140, "fastMoves": ["mud shot", "water gun"], "chargedMoves": ["mud bomb", "sludge", "surf"]}, {"dex": 260, "name": "swampert", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 208, "baseDef": 175, "baseStm": 200, "fastMoves": ["mud shot", "water gun"], "chargedMoves": ["earthquake", "sludge wave", "surf"]}, {"dex": 261, "name": "poochyena", "pokeType1": "dark", "pokeType2": "none", "baseAtk": 96, "baseDef": 63, "baseStm": 70, "fastMoves": ["tackle", "snarl"], "chargedMoves": ["crunch", "dig", "poison fang"]}, {"dex": 262, "name": "mightyena", "pokeType1": "dark", "pokeType2": "none", "baseAtk": 171, "baseDef": 137, "baseStm": 140, "fastMoves": ["bite", "fire fang"], "chargedMoves": ["crunch", "play rough", "poison fang"]}, {"dex": 263, "name": "zigzagoon", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 58, "baseDef": 80, "baseStm": 76, "fastMoves": ["tackle", "rock smash"], "chargedMoves": ["dig", "grass knot", "thunderbolt"]}, {"dex": 264, "name": "linoone", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 142, "baseDef": 128, "baseStm": 156, "fastMoves": ["shadow claw", "tackle"], "chargedMoves": ["dig", "grass knot", "thunder"]}, {"dex": 265, "name": "wurmple", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 75, "baseDef": 61, "baseStm": 90, "fastMoves": ["tackle", "bug bite"], "chargedMoves": ["struggle"]}, {"dex": 266, "name": "silcoon", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 60, "baseDef": 91, "baseStm": 100, "fastMoves": ["poison sting", "bug bite"], "chargedMoves": ["struggle"]}, {"dex": 267, "name": "beautifly", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 189, "baseDef": 98, "baseStm": 120, "fastMoves": ["struggle bug", "infestation"], "chargedMoves": ["silver wind", "air cutter", "bug buzz"]}, {"dex": 268, "name": "cascoon", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 60, "baseDef": 91, "baseStm": 100, "fastMoves": ["poison sting", "bug bite"], "chargedMoves": ["struggle"]}, {"dex": 269, "name": "dustox", "pokeType1": "bug", "pokeType2": "poison", "baseAtk": 98, "baseDef": 172, "baseStm": 120, "fastMoves": ["struggle bug", "confusion"], "chargedMoves": ["silver wind", "sludge bomb", "bug buzz"]}, {"dex": 270, "name": "lotad", "pokeType1": "water", "pokeType2": "grass", "baseAtk": 71, "baseDef": 86, "baseStm": 80, "fastMoves": ["water gun", "razor leaf"], "chargedMoves": ["bubble beam", "energy ball"]}, {"dex": 271, "name": "lombre", "pokeType1": "water", "pokeType2": "grass", "baseAtk": 112, "baseDef": 128, "baseStm": 120, "fastMoves": ["bubble", "razor leaf"], "chargedMoves": ["bubble beam", "ice beam", "grass knot"]}, {"dex": 272, "name": "ludicolo", "pokeType1": "water", "pokeType2": "grass", "baseAtk": 173, "baseDef": 191, "baseStm": 160, "fastMoves": ["bubble", "razor leaf"], "chargedMoves": ["hydro pump", "blizzard", "solar beam"]}, {"dex": 273, "name": "seedot", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 71, "baseDef": 86, "baseStm": 80, "fastMoves": ["bullet seed", "quick attack"], "chargedMoves": ["energy ball", "grass knot", "foul play"]}, {"dex": 274, "name": "nuzleaf", "pokeType1": "grass", "pokeType2": "dark", "baseAtk": 134, "baseDef": 78, "baseStm": 140, "fastMoves": ["razor leaf", "feint attack"], "chargedMoves": ["leaf blade", "grass knot", "foul play"]}, {"dex": 275, "name": "shiftry", "pokeType1": "grass", "pokeType2": "dark", "baseAtk": 200, "baseDef": 121, "baseStm": 180, "fastMoves": ["razor leaf", "feint attack"], "chargedMoves": ["leaf blade", "hurricane", "foul play"]}, {"dex": 276, "name": "taillow", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 106, "baseDef": 61, "baseStm": 80, "fastMoves": ["peck", "quick attack"], "chargedMoves": ["aerial ace"]}, {"dex": 277, "name": "swellow", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 185, "baseDef": 130, "baseStm": 120, "fastMoves": ["wing attack", "steel wing"], "chargedMoves": ["aerial ace", "brave bird", "sky attack"]}, {"dex": 278, "name": "wingull", "pokeType1": "water", "pokeType2": "flying", "baseAtk": 106, "baseDef": 61, "baseStm": 80, "fastMoves": ["water gun", "quick attack"], "chargedMoves": ["water pulse", "air cutter", "ice beam"]}, {"dex": 279, "name": "pelipper", "pokeType1": "water", "pokeType2": "flying", "baseAtk": 175, "baseDef": 189, "baseStm": 120, "fastMoves": ["water gun", "wing attack"], "chargedMoves": ["hydro pump", "hurricane", "blizzard"]}, {"dex": 280, "name": "ralts", "pokeType1": "psychic", "pokeType2": "fairy", "baseAtk": 79, "baseDef": 63, "baseStm": 56, "fastMoves": ["confusion", "charge beam"], "chargedMoves": ["psyshock", "disarming voice", "shadow sneak"]}, {"dex": 281, "name": "kirlia", "pokeType1": "psychic", "pokeType2": "fairy", "baseAtk": 117, "baseDef": 100, "baseStm": 76, "fastMoves": ["confusion", "charge beam"], "chargedMoves": ["psychic", "disarming voice", "shadow sneak"]}, {"dex": 282, "name": "gardevoir", "pokeType1": "psychic", "pokeType2": "fairy", "baseAtk": 237, "baseDef": 220, "baseStm": 136, "fastMoves": ["confusion", "charge beam"], "chargedMoves": ["psychic", "dazzling gleam", "shadow ball"]}, {"dex": 283, "name": "surskit", "pokeType1": "bug", "pokeType2": "water", "baseAtk": 93, "baseDef": 97, "baseStm": 80, "fastMoves": ["bubble", "bug bite"], "chargedMoves": ["aqua jet", "bubble beam", "signal beam"]}, {"dex": 284, "name": "masquerain", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 192, "baseDef": 161, "baseStm": 140, "fastMoves": ["infestation", "air slash"], "chargedMoves": ["air cutter", "ominous wind", "silver wind"]}, {"dex": 285, "name": "shroomish", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 74, "baseDef": 110, "baseStm": 120, "fastMoves": ["tackle", "bullet seed"], "chargedMoves": ["seed bomb", "grass knot", "energy ball"]}, {"dex": 286, "name": "breloom", "pokeType1": "grass", "pokeType2": "fighting", "baseAtk": 241, "baseDef": 153, "baseStm": 120, "fastMoves": ["counter", "bullet seed"], "chargedMoves": ["dynamic punch", "seed bomb", "sludge bomb"]}, {"dex": 287, "name": "slakoth", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 104, "baseDef": 104, "baseStm": 120, "fastMoves": ["yawn"], "chargedMoves": ["body slam", "night slash", "brick break"]}, {"dex": 288, "name": "vigoroth", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 159, "baseDef": 159, "baseStm": 160, "fastMoves": ["scratch", "counter"], "chargedMoves": ["body slam", "bulldoze", "brick break"]}, {"dex": 289, "name": "slaking", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 290, "baseDef": 183, "baseStm": 273, "fastMoves": ["yawn"], "chargedMoves": ["hyper beam", "play rough", "earthquake"]}, {"dex": 290, "name": "nincada", "pokeType1": "bug", "pokeType2": "ground", "baseAtk": 80, "baseDef": 153, "baseStm": 62, "fastMoves": ["scratch", "bug bite"], "chargedMoves": ["night slash", "bug buzz", "aerial ace"]}, {"dex": 291, "name": "ninjask", "pokeType1": "bug", "pokeType2": "flying", "baseAtk": 196, "baseDef": 114, "baseStm": 122, "fastMoves": ["fury cutter", "metal claw"], "chargedMoves": ["shadow ball", "bug buzz", "aerial ace"]}, {"dex": 292, "name": "shedinja", "pokeType1": "bug", "pokeType2": "ghost", "baseAtk": 153, "baseDef": 80, "baseStm": 2, "fastMoves": ["bite", "struggle bug"], "chargedMoves": ["shadow sneak", "aerial ace", "dig"]}, {"dex": 293, "name": "whismur", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 92, "baseDef": 42, "baseStm": 128, "fastMoves": ["pound", "astonish"], "chargedMoves": ["stomp", "disarming voice", "flamethrower"]}, {"dex": 294, "name": "loudred", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 134, "baseDef": 81, "baseStm": 168, "fastMoves": ["bite", "rock smash"], "chargedMoves": ["crunch", "disarming voice", "flamethrower"]}, {"dex": 295, "name": "exploud", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 179, "baseDef": 142, "baseStm": 208, "fastMoves": ["bite", "astonish"], "chargedMoves": ["crunch", "disarming voice", "fire blast"]}, {"dex": 296, "name": "makuhita", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 99, "baseDef": 54, "baseStm": 144, "fastMoves": ["rock smash", "tackle"], "chargedMoves": ["heavy slam", "low sweep", "cross chop"]}, {"dex": 297, "name": "hariyama", "pokeType1": "fighting", "pokeType2": "none", "baseAtk": 209, "baseDef": 114, "baseStm": 288, "fastMoves": ["counter", "bullet punch"], "chargedMoves": ["heavy slam", "close combat", "dynamic punch"]}, {"dex": 298, "name": "azurill", "pokeType1": "normal", "pokeType2": "fairy", "baseAtk": 36, "baseDef": 71, "baseStm": 100, "fastMoves": ["splash", "bubble"], "chargedMoves": ["bubble beam", "ice beam", "body slam"]}, {"dex": 299, "name": "nosepass", "pokeType1": "rock", "pokeType2": "none", "baseAtk": 82, "baseDef": 236, "baseStm": 60, "fastMoves": ["rock throw", "spark"], "chargedMoves": ["rock blast", "rock slide", "thunderbolt"]}, {"dex": 300, "name": "skitty", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 84, "baseDef": 84, "baseStm": 100, "fastMoves": ["feint attack", "tackle"], "chargedMoves": ["dig", "disarming voice", "wild charge"]}, {"dex": 301, "name": "delcatty", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 132, "baseDef": 132, "baseStm": 140, "fastMoves": ["feint attack", "zen headbutt"], "chargedMoves": ["play rough", "disarming voice", "wild charge"]}, {"dex": 302, "name": "sableye", "pokeType1": "dark", "pokeType2": "ghost", "baseAtk": 141, "baseDef": 141, "baseStm": 100, "fastMoves": ["shadow claw", "feint attack"], "chargedMoves": ["power gem", "foul play", "shadow sneak"]}, {"dex": 303, "name": "mawile", "pokeType1": "steel", "pokeType2": "fairy", "baseAtk": 155, "baseDef": 155, "baseStm": 100, "fastMoves": ["bite", "astonish"], "chargedMoves": ["play rough", "vice grip", "iron head"]}, {"dex": 304, "name": "aron", "pokeType1": "steel", "pokeType2": "rock", "baseAtk": 121, "baseDef": 168, "baseStm": 100, "fastMoves": ["tackle", "metal claw"], "chargedMoves": ["iron head", "rock tomb", "body slam"]}, {"dex": 305, "name": "lairon", "pokeType1": "steel", "pokeType2": "rock", "baseAtk": 158, "baseDef": 240, "baseStm": 120, "fastMoves": ["metal claw", "iron tail"], "chargedMoves": ["body slam", "rock slide", "heavy slam"]}, {"dex": 306, "name": "aggron", "pokeType1": "steel", "pokeType2": "rock", "baseAtk": 198, "baseDef": 314, "baseStm": 140, "fastMoves": ["dragon tail", "iron tail"], "chargedMoves": ["thunder", "stone edge", "heavy slam"]}, {"dex": 307, "name": "meditite", "pokeType1": "fighting", "pokeType2": "psychic", "baseAtk": 78, "baseDef": 107, "baseStm": 60, "fastMoves": ["confusion", "rock smash"], "chargedMoves": ["ice punch", "psyshock", "low sweep"]}, {"dex": 308, "name": "medicham", "pokeType1": "fighting", "pokeType2": "psychic", "baseAtk": 121, "baseDef": 152, "baseStm": 120, "fastMoves": ["psycho cut", "counter"], "chargedMoves": ["ice punch", "psychic", "dynamic punch"]}, {"dex": 309, "name": "electrike", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 123, "baseDef": 78, "baseStm": 80, "fastMoves": ["quick attack", "spark"], "chargedMoves": ["thunderbolt", "discharge", "swift"]}, {"dex": 310, "name": "manectric", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 215, "baseDef": 127, "baseStm": 140, "fastMoves": ["snarl", "charge beam"], "chargedMoves": ["thunder", "wild charge", "flame burst"]}, {"dex": 311, "name": "plusle", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 167, "baseDef": 147, "baseStm": 120, "fastMoves": ["spark", "quick attack"], "chargedMoves": ["thunderbolt", "discharge", "swift"]}, {"dex": 312, "name": "minun", "pokeType1": "electric", "pokeType2": "none", "baseAtk": 147, "baseDef": 167, "baseStm": 120, "fastMoves": ["spark", "quick attack"], "chargedMoves": ["thunderbolt", "discharge", "swift"]}, {"dex": 313, "name": "volbeat", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 143, "baseDef": 171, "baseStm": 130, "fastMoves": ["struggle bug", "tackle"], "chargedMoves": ["signal beam", "bug buzz", "thunderbolt"]}, {"dex": 314, "name": "illumise", "pokeType1": "bug", "pokeType2": "none", "baseAtk": 143, "baseDef": 171, "baseStm": 130, "fastMoves": ["struggle bug", "tackle"], "chargedMoves": ["silver wind", "bug buzz", "dazzling gleam"]}, {"dex": 315, "name": "roselia", "pokeType1": "grass", "pokeType2": "poison", "baseAtk": 186, "baseDef": 148, "baseStm": 100, "fastMoves": ["poison jab", "razor leaf"], "chargedMoves": ["petal blizzard", "sludge bomb", "dazzling gleam"]}, {"dex": 316, "name": "gulpin", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 80, "baseDef": 99, "baseStm": 140, "fastMoves": ["pound", "rock smash"], "chargedMoves": ["sludge", "gunk shot", "ice beam"]}, {"dex": 317, "name": "swalot", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 140, "baseDef": 159, "baseStm": 200, "fastMoves": ["rock smash", "infestation"], "chargedMoves": ["gunk shot", "sludge bomb", "ice beam"]}, {"dex": 318, "name": "carvanha", "pokeType1": "water", "pokeType2": "dark", "baseAtk": 171, "baseDef": 39, "baseStm": 90, "fastMoves": ["bite", "snarl"], "chargedMoves": ["aqua jet", "crunch", "poison fang"]}, {"dex": 319, "name": "sharpedo", "pokeType1": "water", "pokeType2": "dark", "baseAtk": 243, "baseDef": 83, "baseStm": 140, "fastMoves": ["bite", "waterfall"], "chargedMoves": ["hydro pump", "crunch", "poison fang"]}, {"dex": 320, "name": "wailmer", "pokeType1": "water", "pokeType2": "none", "baseAtk": 136, "baseDef": 68, "baseStm": 260, "fastMoves": ["splash", "water gun"], "chargedMoves": ["heavy slam", "water pulse", "body slam"]}, {"dex": 321, "name": "wailord", "pokeType1": "water", "pokeType2": "none", "baseAtk": 175, "baseDef": 87, "baseStm": 340, "fastMoves": ["zen headbutt", "water gun"], "chargedMoves": ["surf", "blizzard", "hyper beam"]}, {"dex": 322, "name": "numel", "pokeType1": "fire", "pokeType2": "ground", "baseAtk": 119, "baseDef": 82, "baseStm": 120, "fastMoves": ["ember", "tackle"], "chargedMoves": ["bulldoze", "heat wave", "stomp"]}, {"dex": 323, "name": "camerupt", "pokeType1": "fire", "pokeType2": "ground", "baseAtk": 194, "baseDef": 139, "baseStm": 140, "fastMoves": ["ember", "rock smash"], "chargedMoves": ["earthquake", "overheat", "solar beam"]}, {"dex": 324, "name": "torkoal", "pokeType1": "fire", "pokeType2": "none", "baseAtk": 151, "baseDef": 234, "baseStm": 140, "fastMoves": ["fire spin", "ember"], "chargedMoves": ["overheat", "solar beam", "earthquake"]}, {"dex": 325, "name": "spoink", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 125, "baseDef": 145, "baseStm": 120, "fastMoves": ["splash", "zen headbutt"], "chargedMoves": ["psybeam", "shadow ball", "mirror coat"]}, {"dex": 326, "name": "grumpig", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 171, "baseDef": 211, "baseStm": 160, "fastMoves": ["charge beam", "extrasensory"], "chargedMoves": ["psychic", "shadow ball", "mirror coat"]}, {"dex": 327, "name": "spinda", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 116, "baseDef": 116, "baseStm": 120, "fastMoves": ["sucker punch", "psycho cut"], "chargedMoves": ["dig", "rock tomb", "icy wind"]}, {"dex": 328, "name": "trapinch", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 162, "baseDef": 78, "baseStm": 90, "fastMoves": ["mud shot", "struggle bug"], "chargedMoves": ["sand tomb", "dig", "crunch"]}, {"dex": 329, "name": "vibrava", "pokeType1": "ground", "pokeType2": "dragon", "baseAtk": 134, "baseDef": 99, "baseStm": 100, "fastMoves": ["mud shot", "dragon breath"], "chargedMoves": ["sand tomb", "bulldoze", "bug buzz"]}, {"dex": 330, "name": "flygon", "pokeType1": "ground", "pokeType2": "dragon", "baseAtk": 205, "baseDef": 168, "baseStm": 160, "fastMoves": ["mud shot", "dragon tail"], "chargedMoves": ["earthquake", "dragon claw", "stone edge"]}, {"dex": 331, "name": "cacnea", "pokeType1": "grass", "pokeType2": "none", "baseAtk": 156, "baseDef": 74, "baseStm": 100, "fastMoves": ["poison sting", "sucker punch"], "chargedMoves": ["grass knot", "brick break", "seed bomb"]}, {"dex": 332, "name": "cacturne", "pokeType1": "grass", "pokeType2": "dark", "baseAtk": 221, "baseDef": 115, "baseStm": 140, "fastMoves": ["poison jab", "sucker punch"], "chargedMoves": ["dark pulse", "dynamic punch", "grass knot"]}, {"dex": 333, "name": "swablu", "pokeType1": "normal", "pokeType2": "flying", "baseAtk": 76, "baseDef": 139, "baseStm": 90, "fastMoves": ["peck", "astonish"], "chargedMoves": ["disarming voice", "aerial ace", "ice beam"]}, {"dex": 334, "name": "altaria", "pokeType1": "dragon", "pokeType2": "flying", "baseAtk": 141, "baseDef": 208, "baseStm": 150, "fastMoves": ["peck", "dragon breath"], "chargedMoves": ["sky attack", "dazzling gleam", "dragon pulse"]}, {"dex": 335, "name": "zangoose", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 222, "baseDef": 124, "baseStm": 146, "fastMoves": ["fury cutter", "shadow claw"], "chargedMoves": ["close combat", "night slash", "dig"]}, {"dex": 336, "name": "seviper", "pokeType1": "poison", "pokeType2": "none", "baseAtk": 196, "baseDef": 118, "baseStm": 146, "fastMoves": ["poison jab", "iron tail"], "chargedMoves": ["poison fang", "crunch", "wrap"]}, {"dex": 337, "name": "lunatone", "pokeType1": "rock", "pokeType2": "psychic", "baseAtk": 178, "baseDef": 163, "baseStm": 180, "fastMoves": ["rock throw", "confusion"], "chargedMoves": ["psychic", "rock slide", "moonblast"]}, {"dex": 338, "name": "solrock", "pokeType1": "rock", "pokeType2": "psychic", "baseAtk": 178, "baseDef": 163, "baseStm": 180, "fastMoves": ["rock throw", "confusion"], "chargedMoves": ["psychic", "rock slide", "solar beam"]}, {"dex": 339, "name": "barboach", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 93, "baseDef": 83, "baseStm": 100, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["aqua tail", "ice beam", "mud bomb"]}, {"dex": 340, "name": "whiscash", "pokeType1": "water", "pokeType2": "ground", "baseAtk": 151, "baseDef": 142, "baseStm": 220, "fastMoves": ["water gun", "mud shot"], "chargedMoves": ["water pulse", "blizzard", "mud bomb"]}, {"dex": 341, "name": "corphish", "pokeType1": "water", "pokeType2": "none", "baseAtk": 141, "baseDef": 113, "baseStm": 86, "fastMoves": ["bubble", "rock smash"], "chargedMoves": ["vice grip", "bubble beam", "aqua jet"]}, {"dex": 342, "name": "crawdaunt", "pokeType1": "water", "pokeType2": "dark", "baseAtk": 224, "baseDef": 156, "baseStm": 126, "fastMoves": ["waterfall", "snarl"], "chargedMoves": ["vice grip", "bubble beam", "night slash"]}, {"dex": 343, "name": "baltoy", "pokeType1": "ground", "pokeType2": "psychic", "baseAtk": 77, "baseDef": 131, "baseStm": 80, "fastMoves": ["confusion", "extrasensory"], "chargedMoves": ["gyro ball", "psybeam", "dig"]}, {"dex": 344, "name": "claydol", "pokeType1": "ground", "pokeType2": "psychic", "baseAtk": 140, "baseDef": 236, "baseStm": 120, "fastMoves": ["extrasensory", "confusion"], "chargedMoves": ["gyro ball", "psychic", "earthquake"]}, {"dex": 345, "name": "lileep", "pokeType1": "rock", "pokeType2": "grass", "baseAtk": 105, "baseDef": 154, "baseStm": 132, "fastMoves": ["acid", "infestation"], "chargedMoves": ["grass knot", "mirror coat", "ancient power"]}, {"dex": 346, "name": "cradily", "pokeType1": "rock", "pokeType2": "grass", "baseAtk": 152, "baseDef": 198, "baseStm": 172, "fastMoves": ["acid", "infestation"], "chargedMoves": ["grass knot", "bulldoze", "stone edge"]}, {"dex": 347, "name": "anorith", "pokeType1": "rock", "pokeType2": "bug", "baseAtk": 176, "baseDef": 100, "baseStm": 90, "fastMoves": ["struggle bug", "scratch"], "chargedMoves": ["cross poison", "aqua jet", "ancient power"]}, {"dex": 348, "name": "armaldo", "pokeType1": "rock", "pokeType2": "bug", "baseAtk": 222, "baseDef": 183, "baseStm": 150, "fastMoves": ["fury cutter", "struggle bug"], "chargedMoves": ["cross poison", "water pulse", "rock blast"]}, {"dex": 349, "name": "feebas", "pokeType1": "water", "pokeType2": "none", "baseAtk": 29, "baseDef": 102, "baseStm": 40, "fastMoves": ["splash", "tackle"], "chargedMoves": ["mirror coat"]}, {"dex": 350, "name": "milotic", "pokeType1": "water", "pokeType2": "none", "baseAtk": 192, "baseDef": 242, "baseStm": 190, "fastMoves": ["waterfall", "dragon tail"], "chargedMoves": ["surf", "blizzard", "hyper beam"]}, {"dex": 351, "name": "castform", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 139, "baseDef": 139, "baseStm": 140, "fastMoves": ["bite", "rock smash"], "chargedMoves": ["stomp", "crunch", "ancient power"]}, {"dex": 352, "name": "kecleon", "pokeType1": "normal", "pokeType2": "none", "baseAtk": 161, "baseDef": 212, "baseStm": 120, "fastMoves": ["lick", "sucker punch"], "chargedMoves": ["foul play", "flamethrower", "thunder", "ice beam", "aerial ace", "shadow sneak"]}, {"dex": 353, "name": "shuppet", "pokeType1": "ghost", "pokeType2": "none", "baseAtk": 138, "baseDef": 66, "baseStm": 88, "fastMoves": ["feint attack", "astonish"], "chargedMoves": ["ominous wind", "night shade", "shadow sneak"]}, {"dex": 354, "name": "banette", "pokeType1": "ghost", "pokeType2": "none", "baseAtk": 218, "baseDef": 127, "baseStm": 128, "fastMoves": ["hex", "shadow claw"], "chargedMoves": ["shadow ball", "dazzling gleam", "thunder"]}, {"dex": 355, "name": "duskull", "pokeType1": "ghost", "pokeType2": "none", "baseAtk": 70, "baseDef": 162, "baseStm": 40, "fastMoves": ["hex", "astonish"], "chargedMoves": ["ominous wind", "night shade", "shadow sneak"]}, {"dex": 356, "name": "dusclops", "pokeType1": "ghost", "pokeType2": "none", "baseAtk": 124, "baseDef": 234, "baseStm": 80, "fastMoves": ["hex", "feint attack"], "chargedMoves": ["shadow punch", "ice punch", "fire punch"]}, {"dex": 357, "name": "tropius", "pokeType1": "grass", "pokeType2": "flying", "baseAtk": 136, "baseDef": 165, "baseStm": 198, "fastMoves": ["air slash", "razor leaf"], "chargedMoves": ["stomp", "aerial ace", "leaf blade"]}, {"dex": 358, "name": "chimecho", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 175, "baseDef": 174, "baseStm": 150, "fastMoves": ["extrasensory", "astonish"], "chargedMoves": ["energy ball", "shadow ball", "psyshock"]}, {"dex": 359, "name": "absol", "pokeType1": "dark", "pokeType2": "none", "baseAtk": 246, "baseDef": 120, "baseStm": 130, "fastMoves": ["psycho cut", "snarl"], "chargedMoves": ["dark pulse", "thunder", "megahorn"]}, {"dex": 360, "name": "wynaut", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 41, "baseDef": 86, "baseStm": 190, "fastMoves": ["splash", "counter"], "chargedMoves": ["mirror coat"]}, {"dex": 361, "name": "snorunt", "pokeType1": "ice", "pokeType2": "none", "baseAtk": 95, "baseDef": 95, "baseStm": 100, "fastMoves": ["powder snow", "hex"], "chargedMoves": ["avalanche", "icy wind", "shadow ball"]}, {"dex": 362, "name": "glalie", "pokeType1": "ice", "pokeType2": "none", "baseAtk": 162, "baseDef": 162, "baseStm": 160, "fastMoves": ["ice shard", "frost breath"], "chargedMoves": ["avalanche", "gyro ball", "shadow ball"]}, {"dex": 363, "name": "spheal", "pokeType1": "ice", "pokeType2": "water", "baseAtk": 95, "baseDef": 90, "baseStm": 140, "fastMoves": ["water gun", "rock smash"], "chargedMoves": ["aurora beam", "body slam", "water pulse"]}, {"dex": 364, "name": "sealeo", "pokeType1": "ice", "pokeType2": "water", "baseAtk": 137, "baseDef": 132, "baseStm": 180, "fastMoves": ["water gun", "powder snow"], "chargedMoves": ["aurora beam", "body slam", "water pulse"]}, {"dex": 365, "name": "walrein", "pokeType1": "ice", "pokeType2": "water", "baseAtk": 182, "baseDef": 176, "baseStm": 220, "fastMoves": ["waterfall", "frost breath"], "chargedMoves": ["blizzard", "earthquake", "water pulse"]}, {"dex": 366, "name": "clamperl", "pokeType1": "water", "pokeType2": "none", "baseAtk": 133, "baseDef": 149, "baseStm": 70, "fastMoves": ["water gun"], "chargedMoves": ["body slam", "ice beam", "water pulse"]}, {"dex": 367, "name": "huntail", "pokeType1": "water", "pokeType2": "none", "baseAtk": 197, "baseDef": 194, "baseStm": 110, "fastMoves": ["water gun", "bite"], "chargedMoves": ["crunch", "ice beam", "aqua tail"]}, {"dex": 368, "name": "gorebyss", "pokeType1": "water", "pokeType2": "none", "baseAtk": 211, "baseDef": 194, "baseStm": 110, "fastMoves": ["water gun", "confusion"], "chargedMoves": ["draining kiss", "psychic", "water pulse"]}, {"dex": 369, "name": "relicanth", "pokeType1": "water", "pokeType2": "rock", "baseAtk": 162, "baseDef": 234, "baseStm": 200, "fastMoves": ["water gun", "zen headbutt"], "chargedMoves": ["ancient power", "aqua tail", "hydro pump"]}, {"dex": 370, "name": "luvdisc", "pokeType1": "water", "pokeType2": "none", "baseAtk": 81, "baseDef": 134, "baseStm": 86, "fastMoves": ["water gun", "splash"], "chargedMoves": ["draining kiss", "water pulse", "aqua jet"]}, {"dex": 371, "name": "bagon", "pokeType1": "dragon", "pokeType2": "none", "baseAtk": 134, "baseDef": 107, "baseStm": 90, "fastMoves": ["bite", "ember"], "chargedMoves": ["flamethrower", "twister", "crunch"]}, {"dex": 372, "name": "shelgon", "pokeType1": "dragon", "pokeType2": "none", "baseAtk": 172, "baseDef": 179, "baseStm": 130, "fastMoves": ["ember", "dragon breath"], "chargedMoves": ["flamethrower", "dragon pulse", "twister"]}, {"dex": 373, "name": "salamence", "pokeType1": "dragon", "pokeType2": "flying", "baseAtk": 277, "baseDef": 168, "baseStm": 190, "fastMoves": ["dragon tail", "fire fang"], "chargedMoves": ["fire blast", "hydro pump", "draco meteor"]}, {"dex": 374, "name": "beldum", "pokeType1": "steel", "pokeType2": "psychic", "baseAtk": 96, "baseDef": 141, "baseStm": 80, "fastMoves": ["take down"], "chargedMoves": ["struggle"]}, {"dex": 375, "name": "metang", "pokeType1": "steel", "pokeType2": "psychic", "baseAtk": 138, "baseDef": 185, "baseStm": 120, "fastMoves": ["zen headbutt", "metal claw"], "chargedMoves": ["psychic", "gyro ball", "psyshock"]}, {"dex": 376, "name": "metagross", "pokeType1": "steel", "pokeType2": "psychic", "baseAtk": 257, "baseDef": 247, "baseStm": 160, "fastMoves": ["bullet punch", "zen headbutt"], "chargedMoves": ["psychic", "flash cannon", "earthquake"]}, {"dex": 377, "name": "regirock", "pokeType1": "rock", "pokeType2": "none", "baseAtk": 179, "baseDef": 356, "baseStm": 160, "fastMoves": ["rock throw", "rock smash"], "chargedMoves": ["stone edge", "zap cannon", "focus blast"]}, {"dex": 378, "name": "regice", "pokeType1": "ice", "pokeType2": "none", "baseAtk": 179, "baseDef": 356, "baseStm": 160, "fastMoves": ["frost breath", "rock smash"], "chargedMoves": ["blizzard", "earthquake", "focus blast"]}, {"dex": 379, "name": "registeel", "pokeType1": "steel", "pokeType2": "none", "baseAtk": 143, "baseDef": 285, "baseStm": 160, "fastMoves": ["metal claw", "rock smash"], "chargedMoves": ["flash cannon", "hyper beam", "focus blast"]}, {"dex": 380, "name": "latias", "pokeType1": "dragon", "pokeType2": "psychic", "baseAtk": 228, "baseDef": 268, "baseStm": 160, "fastMoves": ["dragon breath", "zen headbutt"], "chargedMoves": ["psychic", "dragon claw", "thunder"]}, {"dex": 381, "name": "latios", "pokeType1": "dragon", "pokeType2": "psychic", "baseAtk": 268, "baseDef": 228, "baseStm": 160, "fastMoves": ["dragon breath", "zen headbutt"], "chargedMoves": ["psychic", "dragon claw", "solar beam"]}, {"dex": 382, "name": "kyogre", "pokeType1": "water", "pokeType2": "none", "baseAtk": 270, "baseDef": 251, "baseStm": 182, "fastMoves": ["waterfall"], "chargedMoves": ["hydro pump", "blizzard", "thunder"]}, {"dex": 383, "name": "groudon", "pokeType1": "ground", "pokeType2": "none", "baseAtk": 270, "baseDef": 251, "baseStm": 182, "fastMoves": ["mud shot", "dragon tail"], "chargedMoves": ["earthquake", "fire blast", "solar beam"]}, {"dex": 384, "name": "rayquaza", "pokeType1": "dragon", "pokeType2": "flying", "baseAtk": 284, "baseDef": 170, "baseStm": 191, "fastMoves": ["air slash", "dragon tail"], "chargedMoves": ["outrage", "aerial ace", "ancient power"]}, {"dex": 385, "name": "jirachi", "pokeType1": "steel", "pokeType2": "psychic", "baseAtk": 210, "baseDef": 210, "baseStm": 200, "fastMoves": ["confusion", "charge beam"], "chargedMoves": ["dazzling gleam", "psychic", "doom desire"]}, {"dex": 386, "name": "deoxys", "pokeType1": "psychic", "pokeType2": "none", "baseAtk": 1, "baseDef": 1, "baseStm": 1, "fastMoves": ["zen headbutt", "counter"], "chargedMoves": ["psycho boost", "zap cannon", "swift"]}];;

var CPM_TABLE = [0.094, 0.13513743215803847, 0.16639787, 0.19265091454861796, 0.21573247, 0.23657265541932715, 0.25572005, 0.27353037931097973, 0.29024988, 0.30605738000722543, 0.3210876, 0.3354450348019347, 0.34921268, 0.36245775711118555, 0.3752356, 0.3875924191428145, 0.39956728, 0.4111935439951595, 0.4225, 0.4329264087965774, 0.44310755, 0.4530599628689135, 0.4627984, 0.4723360827308573, 0.48168495, 0.49085580932476297, 0.49985844, 0.5087017591555174, 0.51739395, 0.5259424956328841, 0.5343543, 0.5426357508963908, 0.5507927, 0.5588305922386229, 0.5667545, 0.574569134506658, 0.5822789, 0.5898879034974399, 0.5974, 0.6048236602280411, 0.6121573, 0.6194041050661919, 0.6265671, 0.6336491667895227, 0.64065295, 0.6475809587060136, 0.65443563, 0.6612192609753201, 0.667934, 0.6745818887829742, 0.6811649, 0.6876848943474521, 0.69414365, 0.7005428891384746, 0.7068842, 0.713169102419072, 0.7193991, 0.7255756180718899, 0.7317, 0.7347410173422504, 0.7377695, 0.7407855800803546, 0.74378943, 0.7467812039953893, 0.74976104, 0.7527290986842915, 0.7556855, 0.7586303636507689, 0.76156384, 0.7644860688461087, 0.76739717, 0.7702972738840048, 0.7731865, 0.7760649434180147, 0.77893275, 0.7817900775756758, 0.784637, 0.7874735905949481, 0.7903];

var POKEMON_TYPE_ADVANTAGES = {"normal": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.0, "ghost": 0.51, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "fighting": {"normal": 1.4, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 0.51, "steel": 1.4, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.4, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "flying": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "poison": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 0.714, "ground": 0.714, "rock": 0.714, "bug": 1.0, "ghost": 0.714, "steel": 0.51, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "ground": {"normal": 1.0, "fighting": 1.0, "flying": 0.51, "poison": 1.4, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 1.4, "fire": 1.4, "water": 1.0, "grass": 0.714, "electric": 1.4, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "rock": {"normal": 1.0, "fighting": 0.714, "flying": 1.4, "poison": 1.0, "ground": 0.714, "rock": 1.0, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.4, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "bug": {"normal": 1.0, "fighting": 0.714, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 0.714, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "ghost": {"normal": 0.51, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 1.0}, "steel": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.0, "electric": 0.714, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "fire": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 1.4, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "water": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.4, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.4, "water": 0.714, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "grass": {"normal": 1.0, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.4, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.4, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "electric": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 0.51, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.0, "water": 1.4, "grass": 0.714, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "psychic": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.4, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.0, "dragon": 1.0, "dark": 0.51, "fairy": 1.0}, "ice": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 1.4, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 0.714, "dragon": 1.4, "dark": 1.0, "fairy": 1.0}, "dragon": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.0, "fairy": 0.51}, "dark": {"normal": 1.0, "fighting": 0.714, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 0.714}, "fairy": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.4, "fairy": 1.0}};

var WEATHER_BOOSTED_TYPES = {"SUNNY_CLEAR": ["grass", "ground", "fire"], "RAIN": ["water", "electric", "bug"], "PARTLY_CLOUDY": ["normal", "rock"], "CLOUDY": ["fairy", "fighting", "poison"], "WINDY": ["dragon", "flying", "psychic"], "SNOW": ["ice", "steel"], "FOG": ["dark", "ghost"], "EXTREME": []};

var WEATHER_LIST = ["SUNNY_CLEAR", "RAIN", "PARTLY_CLOUDY", "CLOUDY", "WINDY", "SNOW", "FOG", "EXTREME"];

var RAID_BOSS_CPM = [0.61, 0.67, 0.7300000190734863, 0.7900000214576721, 0.7900000214576721];

var RAID_BOSS_HP = [600, 1800, 3000, 7500, 12500];


/*
 *	PART I(c): IMPORT GAME DATA DYNAMICALLY
 */
/*
function getPokemonType1FromString(S){
	var L = S.split(",");
	return L[0].trim().toLowerCase();
}

function getPokemonType2FromString(S){
	var L = S.split(",");
	if (L.length > 1)
		return L[1].trim().toLowerCase();
	else
		return "none";
}

function getMovesFromString(S){
	var L = S.split(",");
	var res = [];
	for (var i = 0; i < L.length; i++)
		res.push(L[i].trim().toLowerCase());
	return res;
}

$(document).ready(function() {
	$.getJSON('https://s3.us-east-2.amazonaws.com/gamepress-json/pogo/pokemon-data-full.json',
	function(data) {
		for(var i = 0; i < data.length; i++){
			POKEMON_SPECIES_DATA.push({
				dex : parseInt(data[i].number),
				name : data[i].title_1.toLowerCase(),
				pokeType1 : getPokemonType1FromString(data[i].field_pokemon_type),
				pokeType2 : getPokemonType2FromString(data[i].field_pokemon_type),
				baseAtk : parseInt(data[i].atk),
				baseDef : parseInt(data[i].def),
				baseStm : parseInt(data[i].sta),
				fastMoves : getMovesFromString(data[i].field_primary_moves),
				chargedMoves : getMovesFromString(data[i].field_secondary_moves),
				fastMoves_legacy : getMovesFromString(data[i].field_legacy_quick_moves),
				chargedMoves_legacy : getMovesFromString(data[i].field_legacy_charge_moves)
			});
		}
	});
});
*/ 


/*
 *	PART II: GLOBAL FUNCTIONS
 */

function damage(dmg_giver, dmg_taker, move, weather){
	var stab = 1;
	if (move.pokeType == dmg_giver.pokeType1 || move.pokeType == dmg_giver.pokeType2){
		stab = STAB_MULTIPLIER;
	}
	var wab = 1;
	if (WEATHER_BOOSTED_TYPES[weather].includes(move.pokeType)){
		wab = WAB_MULTIPLIER;
	}
	var effe1 = POKEMON_TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType1] || 1;
	var effe2 = POKEMON_TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType2] || 1;
	return Math.ceil(0.5*dmg_giver.Atk/dmg_taker.Def*move.power*effe1*effe2*stab*wab);
 }
 
function get_species_index_by_name(name) {
	var i = 0;
	while (i < POKEMON_SPECIES_DATA.length){
		if (name.toLowerCase() == POKEMON_SPECIES_DATA[i]['name'])
			break;
		++i;
	}
	if (i == POKEMON_SPECIES_DATA.length)
		throw new Error("<" + name + ">: Pokemon Species Not Found");
	return i;
 }
 
function get_fmove_object_by_name(name){
	name = name.toLowerCase();
	var i = 0;
	while (i < FAST_MOVE_DATA.length){
		if (name == FAST_MOVE_DATA[i].name)
			break;
		++i;
	}
	if (i == FAST_MOVE_DATA.length)
		throw new Error("Fast Move <" + name + ">: Move Not Found");
	return FAST_MOVE_DATA[i];
 }
 
function get_cmove_object_by_name(name){
	name = name.toLowerCase();
	var i = 0;
	while (i < CHARGED_MOVE_DATA.length){
		if (name == CHARGED_MOVE_DATA[i].name)
			break;
		++i;
	}
	if (i == CHARGED_MOVE_DATA.length)
		throw new Error("Charged Move <" + name + ">: Move Not Found");
	return CHARGED_MOVE_DATA[i];
 }

function pokemon_img_by_id(dex, size){
	size = size || "MS";
	var dex_string = dex.toString();
	while (dex_string.length < 3)
		dex_string = "0" + dex_string;
	return "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/" + dex_string + size + ".png'></img>";
}
 


/*
 *	PART III: CLASSES
 */
 
 

/* Class <Pokemon> and <PokemonSpecies> */
// constructor
function Pokemon(pd){
	var i = get_species_index_by_name(pd.species_name);
	this.dex = POKEMON_SPECIES_DATA[i]['dex'];
	this.species_name = POKEMON_SPECIES_DATA[i]['name'];
	this.pokeType1 = POKEMON_SPECIES_DATA[i]['pokeType1'];
	this.pokeType2 = POKEMON_SPECIES_DATA[i]['pokeType2'];
	this.baseAtk = POKEMON_SPECIES_DATA[i]['baseAtk'];
	this.baseDef = POKEMON_SPECIES_DATA[i]['baseDef'];
	this.baseStm = POKEMON_SPECIES_DATA[i]['baseStm'];
	this.fastMoves = POKEMON_SPECIES_DATA[i]['fastMoves'];
	this.chargedMoves = POKEMON_SPECIES_DATA[i]['chargedMoves'];
	
	this.name = pd.nickname || this.species_name;
	this.ivAtk = pd.atkiv;
	this.ivDef = pd.defiv;
	this.ivStm = pd.stmiv;
	this.cpm = CPM_TABLE[Math.round(2*pd.level-2)];
	this.fmove = pd.fmove_obj || get_fmove_object_by_name(pd.fmove);
	this.cmove = pd.cmove_obj || get_cmove_object_by_name(pd.cmove);
	
	this.Atk = (this.baseAtk + this.ivAtk) * this.cpm;
	this.Def = (this.baseDef + this.ivDef) * this.cpm;
	this.Stm = (this.baseStm + this.ivStm) * this.cpm;
	this.raidTier = pd.raid_tier;
	if (this.raidTier < 0) { // gym defender
		this.maxHP = 2 * Math.floor(this.Stm);
	} else if (this.raidTier == 0){ // attacker
		this.maxHP = Math.floor(this.Stm);
	} else {// raid boss
		this.cpm = RAID_BOSS_CPM[this.raidTier - 1];
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = RAID_BOSS_HP[this.raidTier - 1];
	}
	this.dodgeStrat = pd.dodge || false;
	this.party_index = pd.team_idx;
	
	this.active = false;
	this.reset_stats();
}

// Reset Pokemon battle stats for a new battle
Pokemon.prototype.reset_stats = function(){
	this.heal();
	// Some statistics for performance analysis
	this.time_enter_ms = 0;
	this.time_leave_ms = 0;
	this.total_time_active_ms = 0;
	this.num_deaths = 0;
	this.total_damage_output = 0;
	this.total_fmove_damage_output = 0;
	this.total_energy_gained = 0;
	this.total_energy_gained_from_damage = 0;
	this.total_energy_overcharged = 0;
}

// A Pokemon gains/(loses) energy
Pokemon.prototype.gain_energy = function(energyDelta, fromDamage){
	if (energyDelta > 0){
		var overChargedPart = Math.max(0, this.energy + energyDelta - POKEMON_MAX_ENERGY);
		var realGain = energyDelta - overChargedPart;
		this.energy += realGain;
		this.total_energy_gained += realGain;
		this.total_energy_overcharged += overChargedPart;
		if (fromDamage){
			this.total_energy_gained_from_damage += realGain;
		}
	}else{
		this.energy += energyDelta;
	}
}

// A Pokemon takes damage and gains energy = dmg/2
// Returns the overkilled part of damage
Pokemon.prototype.take_damage = function(dmg){
	this.HP -= dmg;
	var overKilledPart = 0;
	if (this.HP <= 0){
		this.num_deaths++;
		this.active = false;
		overKilledPart = -this.HP;
	}
	this.gain_energy(Math.ceil((dmg - overKilledPart)/2), true);
}

// Keeping record of total_damage_output for performance analysis
Pokemon.prototype.contribute = function(dmg, mType){
	this.total_damage_output += dmg;
	if (mType == 'f'){
		this.total_fmove_damage_output += dmg;
	}
}

// As if receiving a Max Revive
Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
}

// Return the performance statistics of the Pokemon
Pokemon.prototype.get_statistics = function(){
	//Team#	Pokemon	HP	Energy	TDO	Duration	DPS	TEO
	var stat = {
		img : pokemon_img_by_id(this.dex),
		team : this.party_index + 1,
		pokemon : this.name,
		hp : this.HP,
		energy : this.energy,
		tdo: this.total_damage_output,
		duration : Math.round(this.total_time_active_ms/100)/10,
		dps : Math.round(this.total_damage_output / (this.total_time_active_ms/1000)*100)/100,
		teo : this.total_energy_overcharged
	};

	return stat;
}
/* End of Class <Pokemon> */


/* Class <Party> */
// constructor
function Party(index){
	this.list = [];
	this.index = index;
	this.active_idx = -1;
	this.active_pkm = null;
	this.num_rejoin = 0;
}

// Add a pokemon to the party
Party.prototype.add = function(pkm){
	if (this.list.length == MAX_POKEMON_PER_PARTY){
		throw "Exceeding maximum party size";
	}
	this.list.push(pkm);
	pkm.party_index = this.index;
	if (!this.active_pkm) {
		this.active_pkm = pkm;
		this.active_idx = 0;
	}
}

// Switch the active Pokemon to the next Pokemon in the party
// Returns true if successful. Otherwise sets active_pkm to null
Party.prototype.next_up = function (){
	if (this.active_idx + 1 < this.list.length){
		this.active_idx++;
		this.active_pkm = this.list[this.active_idx];
		return true;
	}else{
		this.active_idx = -1;
		this.active_pkm = null;
		return false; 
	}
}

// Fully heal each fainted Pokemon, sets the active_pkm to the first one,
// and returns the time took before rejoining
Party.prototype.full_heal = function (){
	var t = REJOIN_TIME_MS;
	for (var i = 0; i < this.list.length; i++){
		if (this.list[i].HP <= 0){
			this.list[i].heal();
			t += EACH_MAX_REVIVE_TIME_MS;
		}
	}
	this.active_idx = 0;
	this.active_pkm = this.list[0];
	this.num_rejoin++;
	return t;
}

// Reset the stats of all Pokemon
Party.prototype.reset_all = function(){
	for (var i = 0; i < this.list.length; i++){
		this.list[i].reset_stats();
	}
	this.active_idx = 0;
	this.active_pkm = this.list[0];
	this.num_rejoin = 0;
}

// Return the performance statistics of the team
Party.prototype.get_statistics = function(total_enemy_HP_deducted){
	var sum_tdo = 0;
	var sum_num_deaths = 0;
	for (var i = 0; i < this.list.length; i++){
		sum_tdo += this.list[i].total_damage_output;
		sum_num_deaths += this.list[i].num_deaths;
	}
	
	// Team#	TDO	TDO%	#Rejoin	total_deaths
	var stat = {
		team : this.index + 1,
		tdo : sum_tdo,
		tdo_percentage : Math.round(sum_tdo/total_enemy_HP_deducted*100*100)/100,
		num_rejoin : this.num_rejoin,
		total_deaths : sum_num_deaths
	};
	
	return stat;
}
/* End of Class <Party> */


/* Class <Event> */
// constructor
function Event(name, t, subject, object, move, dmg, energyDelta){
	this.name = name;
	this.t = t;
	this.subject = subject;
	this.object = object;
	this.move = move;
	this.dmg = dmg;
	this.energyDelta = energyDelta;
	this.dodged = false; //prevent double dodging (you want to reduce damage to 1/16?? Nice dreaming)
}
/* End of Class <Event> */



/* Class <Timeline> */
// constructor
function Timeline(){
	this.list = [];
}

// Insert a new event and the timeline remains sorted
Timeline.prototype.enqueue = function (e){
	var i = 0;
	while(i < this.list.length && e.t > this.list[i].t){
		i++;
	}
	this.list.splice(i, 0, e);
}

// Remove the first (earliest) event in the queue
Timeline.prototype.dequeue = function (){
	return this.list.shift();
}

// Finds and returns the next Hurt event of a specified Pokemon
Timeline.prototype.nextHurtEventOf = function(pkm){
	for (var i = 0; i < this.list.length; i++)
		if (this.list[i].name == "Hurt" && this.list[i].subject == pkm)
			return this.list[i];
}
/* End of Class <Timeline> */


/* Class <World> */
// constructor
function World(){
	this.atkr_parties = [];
	this.dfdr = null;
	this.tline = new Timeline();
	this.battle_length = 0;
	this.log = [];
}

// Takes a configuration dictionary object "cfg" for sim parameters
// Should call this function before calling "::battle()" which runs the simulation
World.prototype.config = function(cfg){
	// Set up general
	this.raid_tier = cfg['generalSettings']['raidTier'];
	if (this.raid_tier == -1)
		this.timelimit_ms = TIMELIMIT_GYM_MS;
	else
		this.timelimit_ms = TIMELIMIT_RAID_MS[this.raid_tier - 1];
	this.weather = cfg['generalSettings']['weather'] || "EXTREME";
	this.log_style = cfg['generalSettings']['logStyle'] || 0;
	this.random_seed = cfg['generalSettings']['randomSeed'] || 0;
	
	// Set up attacker
	var atkr_parties = cfg['atkrSettings'];
	for (var i = 0; i < atkr_parties.length; i++){
		var ap = new Party(i);
		for (var j = 0; j < atkr_parties[i].length; j++){
			for (var k = 0; k < atkr_parties[i][j].copies; k++)
				ap.add(new Pokemon(atkr_parties[i][j]));
		}
		this.atkr_parties.push(ap);
	}
	
	// Set up defender
	this.dfdr = new Pokemon(cfg['dfdrSettings']);
}


// (Re)Initialize the world to prepare for new sim
World.prototype.init = function (raidTier){
	for (var i = 0; i < this.atkr_parties.length; i++){
		this.atkr_parties[i].reset_all();
	}
	this.dfdr.reset_stats();
	this.log = [];
	this.tline = new Timeline();
	this.battle_length = 0;
}

// Player's Pokemon uses a move
World.prototype.atkr_use_move = function(pkm, pkm_hurt, move, t){
	var dmg = damage(pkm, pkm_hurt, move, this.weather);
	this.tline.enqueue(new Event("Anounce", t, pkm, pkm_hurt, move, 0, 0));
	this.tline.enqueue(new Event("Hurt", t + move.dws, pkm_hurt, pkm, move, dmg, 0));
	this.tline.enqueue(new Event("EnergyDelta", t + move.dws, pkm, 0, 0, 0, move.energyDelta));
}

// Gym Defender/Raid Boss uses a move, hurting all active attackers
World.prototype.dfdr_use_move = function(pkm, move, t){
	this.tline.enqueue(new Event("Anounce", t, pkm, 0, move, 0, 0));
	for (var i = 0; i < this.atkr_parties.length; i++){
		var pkm_hurt = this.atkr_parties[i].active_pkm;
		if (pkm_hurt && pkm_hurt.active){
			var dmg = damage(pkm, pkm_hurt, move, this.weather);
			this.tline.enqueue(new Event("Hurt", t + move.dws, pkm_hurt, pkm, move, dmg, 0));
		}
	}
	this.tline.enqueue(new Event("EnergyDelta", t + move.dws, pkm, 0, 0, 0, move.energyDelta));
}

// Brutal force to find out how to maximize damage within a limited time (guaranteed to fit in at least one fmove/cmove)
// and be free afterwards, at the same time satisfies energy rule
// returns the damage, totaltime needd, and a list of 'f'/'c' like ['f','f','c','f'] representing the optimal action
// Note it will returns [-1, -1, []] if there's no solution for negative initial energy
function strategyMaxDmg(T, initE, fDmg, fE, fDur, cDmg, cE, cDur){
	var maxC = Math.floor(T/cDur);
	var maxF = 0;
	var optimalC = 0;
	var optimalF = 0;
	var optimalDamage = -1;
	var optimalTime = -1;
	for (var c = maxC; c >= 0; c--){
		maxF = Math.floor((T - c * cDur)/fDur);
		for (var f = maxF; f >= 0; f--){
			if (initE + f * fE + c * cE < 0)
				break; // Failing the energy requirement
			if (f * fDmg + c * cDmg > optimalDamage){ // Found a better solution
				optimalDamage = f * fDmg + c * cDmg;
				optimalTime = f * fDur + c * cDur;
				optimalF = f;
				optimalC = c;
			}
		}
	}
	// Now form and return a valid sequece of actions
	var solution = [];
	var projE = initE;
	while (optimalC > 0 || optimalF > 0){
		if (projE + cE >= 0 && optimalC > 0){
			solution.push('c');
			projE += cE;
			optimalC--;
		}else{
			solution.push('f');
			projE += fE;
			optimalF--;
		}
	}
	return [optimalDamage, optimalTime, solution];
}

// Player strategy
// This function should return a list of planned actions
// like ['f', 'c', 100, 'd'] <- means use a FMove, then a Cmove, then wait for 100s and finally dodge
World.prototype.atkr_choose = function (pkm, t){
	var dfdr = this.dfdr;
	
	if (pkm.dodgeStrat == "DodgeCMove"){
		// The optimal dodging should be: 
		// - Minimize waiting (waiting should always be avoided)
		// - Maximize time left before dodging (dodge as late as possible)
		// - Maximize damage done before dodging
		var hurtEvent = this.tline.nextHurtEventOf(pkm);
		if (hurtEvent && hurtEvent.move.moveType == 'c' && !hurtEvent.dodged){
			var timeTillHurt = hurtEvent.t - t;
			
			// 1. If can't fit in a fmove or a cmove (whichever has earliest DWS), just dodge and attack
			if (timeTillHurt < pkm.fmove.dws && timeTillHurt < pkm.cmove.dws){
				var decision = [Math.max(0, timeTillHurt - DODGEWINDOW_LENGTH_MS), 'd'];
				if (pkm.energy + pkm.cmove.energyDelta >= 0)
					return decision.concat('c');
				else
					return decision.concat('f');
			}
			
			var fDmg = damage(pkm, dfdr, pkm.fmove, this.weather);
			var cDmg = damage(pkm, dfdr, pkm.cmove, this.weather);

			// (2) Otherwise, need to maximize damage before time runs out
			if (pkm.HP > Math.floor(hurtEvent.dmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT))){
				// (2a) if this Pokemon can survive the dodged damage, then it's better to dodge
				var res = strategyMaxDmg(timeTillHurt, pkm.energy, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration);
				return res[2].concat([Math.max(timeTillHurt - DODGEWINDOW_LENGTH_MS - res[1], 0), 'd']);
			} else{
				// (2b) otherwise, just don't bother to dodge, and shine like the sun before dying!
				// Compare two strategies: a FMove at the end (resF) or a CMove at the end (resC) by exploiting DWS
				var resF = strategyMaxDmg(timeTillHurt - pkm.fmove.dws, pkm.energy, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration);
				var resC = strategyMaxDmg(timeTillHurt - pkm.cmove.dws, pkm.energy + pkm.cmove.energyDelta, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration);
				if (resC[0] + cDmg > resF[0] + fDmg && resC[1] >= 0){ 
					// Use a cmove at the end is better, on the condition that it obeys the energy rule
					return resC[2].concat('c');
				}else{
					return resF[2].concat('f');
				}
			} 
		}
	}
	
	// No dodging or no need to dodge
	if (pkm.energy + pkm.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}

// Gym Defender/Raid Boss strategy
World.prototype.dfdr_choose = function (pkm, t, current_move){
	// A defender decides what to do at time = t + current_move.duration + delay, not at time = t
	var next_move = pkm.fmove;
	var next_t = t + current_move.duration;
	
	if (pkm.energy + current_move.energyDelta + pkm.cmove.energyDelta >= 0 && Math.random() <= 0.5){
			next_move = pkm.cmove;
	}
	// Add the defender delay
	if (this.randomness){
		next_t += 1500 + Math.round(1000 * Math.random());
	}else{
		next_t += 2000;
	}
	
	this.dfdr_use_move(pkm, next_move, next_t);
	this.tline.enqueue(new Event("DfdrFree", next_t, pkm, 0, next_move, 0, 0));
}

// Enqueue events to timeline according from a list of actions
// And ask for the next action when the attacker is free again
World.prototype.enqueueActions = function(pkm, pkm_hurt, t, actions){
	var tFree = t;
	for (var i = 0; i < actions.length; i++){
		if (actions[i] == 'f'){
			this.atkr_use_move(pkm, pkm_hurt, pkm.fmove, tFree);
			tFree += pkm.fmove.duration;
		} else if (actions[i] == 'c'){
			this.atkr_use_move(pkm, pkm_hurt, pkm.cmove, tFree);
			tFree += pkm.cmove.duration;
		} else if (actions[i] == 'd'){
			this.tline.enqueue(new Event("Dodge", tFree, pkm, 0,0,0,0));
			tFree += DODGE_COOLDOWN_MS;
		} else
			tFree += actions[i];
	}
	this.tline.enqueue(new Event("AtkrFree", tFree, pkm, 0,0,0,0));
	if (tFree == t)
		throw "dangerous: stuck at time" + t;
}


// Gym Defender or Raid Boss moves at the start of a battle
World.prototype.initial_dfdr_choose = function (dfdr){
	this.dfdr_use_move(dfdr, dfdr.fmove, 1000);
	this.dfdr_use_move(dfdr, dfdr.fmove, 1000 + Math.max(1000, dfdr.fmove.duration));
	this.tline.enqueue(new Event("DfdrFree", 1000 + Math.max(1000, dfdr.fmove.duration), dfdr, 0, dfdr.fmove, 0, 0));
}

// Check if any of the atkrs on the field is alive
World.prototype.any_atkr_alive = function (){
	for (var i = 0; i < this.atkr_parties.length; i++){
		var pkm = this.atkr_parties[i].active_pkm;
		if (pkm && pkm.HP > 0){
			return true;
		}
	}
	return false;
}


// TODO: Main function for simulating a battle
World.prototype.battle = function (){
	var t = 0;
	var elog = [];
	var dfdr = this.dfdr;
	
	this.tline.enqueue(new Event("Enter", 0, dfdr, 0, 0, 0, 0));
	this.tline.enqueue(new Event("DfdrFree", 0, dfdr, 0, 0, 0, 0));
	for (var p = 0; p < this.atkr_parties.length; p++){
		var atkr = this.atkr_parties[p].active_pkm;
		this.tline.enqueue(new Event("Enter", 0, atkr, 0, 0, 0, 0));
	}
	
	while (dfdr.HP > 0 && this.any_atkr_alive() && t < this.timelimit_ms){
		var e = this.tline.dequeue();
		t = e.t;
		
		// 1. First process the event
		if (e.name == "AtkrFree"){
			var actions = this.atkr_choose(e.subject, t);
			this.enqueueActions(e.subject, dfdr, t, actions);
		}else if (e.name == "DfdrFree"){
			if (t > 0)
				this.dfdr_choose(e.subject, t, e.move);
			else	
				this.initial_dfdr_choose(dfdr);
		}else if (e.name == "Hurt"){
			if (e.subject.active){
				e.subject.take_damage(e.dmg);
				e.object.contribute(e.dmg + Math.min(0, e.subject.HP), e.move.moveType);
				elog.push(e);
			}
		}else if (e.name == "EnergyDelta"){
			e.subject.gain_energy(e.energyDelta, false);
		}else if (e.name == "Enter"){
			e.subject.time_enter_ms = t;
			e.subject.active = true;
			if (e.subject.raidTier == 0) // Atkr
				this.tline.enqueue(new Event("AtkrFree", t + 100, e.subject, 0,0,0,0));
			elog.push(e);
		}else if (e.name == "Dodge"){
			var eHurt = this.tline.nextHurtEventOf(e.subject);
			if (eHurt && (eHurt.t - DODGEWINDOW_LENGTH_MS) <= t && t <= eHurt.t && !eHurt.dodged){
				eHurt.dmg = Math.floor(eHurt.dmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT));
				eHurt.dodged = true;
			}
			elog.push(e);
		}else if (e.name == "Anounce"){
			// Do nothing
		}
		
		// 2. Check if some attacker fainted
		for (var i = 0; i < this.atkr_parties.length; i++){
			var this_party = this.atkr_parties[i];
			var old_pkm = this_party.active_pkm;
			if (old_pkm && old_pkm.HP <= 0){
				old_pkm.time_leave_ms = t;
				old_pkm.total_time_active_ms += t - old_pkm.time_enter_ms;	
				var new_tline = new Timeline();
				var new_pkm = null;
				var delay = 0;
				if (this_party.next_up()){ 
					// If there's still a survivor, need to redirect queued damage to the it
					new_pkm = this_party.active_pkm;
					for (var i = 0; i < this.tline.list.length; i++){
						var e = this.tline.list[i];
						if (e.name == "Hurt" && e.subject.party_index == old_pkm.party_index){
							e.subject = new_pkm;
							e.dmg = damage(e.object, new_pkm, e.move, this.weather);
						}
					}
				} else{ // Otherwise, the whole team fainted. So revive them and rejoin
					delay = this_party.full_heal();
					new_pkm = this_party.active_pkm;
				}
				// Erase the queued events of previous active attacker
				for (var i = 0; i < this.tline.list.length; i++){
					var e = this.tline.list[i];
					if (e.subject.party_index != old_pkm.party_index && 
							 e.object.party_index != old_pkm.party_index){
						new_tline.enqueue(e);
					}
				}
				this.tline = new_tline;
				this.tline.enqueue(new Event("Enter", t + SWITCHING_DELAY_MS + delay, new_pkm, 0,0,0,0));
			}
		}
		
		// 3. Check if the defender fainted
		if (dfdr.HP <= 0){
			dfdr.time_leave_ms = t;
			dfdr.total_time_active_ms = t - dfdr.time_enter_ms;
		}
		
		// 4. Process the next event if it's at the same time before deciding whether the battle has ended
		if (this.tline.list && t == this.tline.list[0].t){ 
			continue;
		}
		if(this.log_style && elog.length > 0)
			this["add_to_log_s" + this.log_style](elog);
		elog = [];
		
	}
	
	// Battle has ended
	this.battle_length = t;
	
	for (var i = 0; i < this.atkr_parties.length; i++){
		var pkm = this.atkr_parties[i].active_pkm;
		if (pkm && pkm.time_leave_ms == 0){
			pkm.time_leave_ms = t;
			pkm.total_time_active_ms = t - pkm.time_enter_ms;
		}
	}
	
	if (dfdr.time_leave_ms == 0){
		dfdr.time_leave_ms = t;
		dfdr.total_time_active_ms += t - dfdr.time_enter_ms;
	}
}


// Add events to Style-1 battle log
// Style-1 battle log format: [time] [team] [pokemon] [action] [defender]
World.prototype.add_to_log_s1 = function(events){
	for (var i = 0; i < events.length; i++){
		var e = events[i];
		var rowData = [Math.round(e.t/10)/100, "", "", "", ""];
		if (e.subject.party_index >= 0){ // Attacker event
			rowData[1] = e.subject.party_index + 1;
			rowData[2] = pokemon_img_by_id(e.subject.dex);
		}else{ // Defender event
			rowData[4] = pokemon_img_by_id(e.subject.dex);
		}
		
		if (e.name == "Enter"){
			rowData[3] = "entered";
		}else if (e.name == "Hurt"){
			rowData[3] = e.move.name;
			if (e.subject.raidTier == 0){ // atkrHurt
				rowData[2] = e.subject.HP + '(-' + e.dmg + ')';
				rowData[4] = pokemon_img_by_id(e.object.dex);
			} else{ // dfdrHurt
				rowData[1] = e.object.party_index + 1;
				rowData[2] = pokemon_img_by_id(e.object.dex);
				rowData[4] = e.subject.HP + '(-' + e.dmg + ')';
			}
		}else if (e.name == "Dodge"){
			rowData[3] = "dodged";
		}
		this.log.push(rowData);
	}
}


// Add events of the same time to Style-2 battle log
// Style-2 battle log format: [time] [team 1 pokemon] ... [team n pokemon] [defender]
World.prototype.add_to_log_s2 = function addBattleLog(events){
	var numTeam = this.atkr_parties.length;
	
	// Correspond to Enter rowData, AtkrHurt rowData, DfdrHurt rowData and AtkrDogde rowData
	var rowData = [[],[],[],[]];
	var nonEmpty = [false, false, false, false];
	var dfdrHurt_totalDmg = 0;
	
	for (var i = 0; i < 4; i++){
		rowData[i].push(Math.round((events[0]).t/10)/100);
		for (var j = 0; j < numTeam + 1; j++)
			rowData[i].push("");
	}

	for (var i = 0; i < events.length; i++){
		var e = events[i];
		if (e.name == "Enter"){
			nonEmpty[0] = true;
			if (e.subject.party_index == -1)
				rowData[0][numTeam + 1] = pokemon_img_by_id(e.subject.dex);
			else
				rowData[0][e.subject.party_index + 1] = pokemon_img_by_id(e.subject.dex);
		}else if (e.name == "Hurt"){
			if (e.subject.raidTier == 0){ // atkrHurt
				nonEmpty[1] = true;
				rowData[1][e.subject.party_index + 1] = e.subject.HP + '(-' + e.dmg + ')';
				rowData[1][numTeam + 1] = e.move.name;
			} else{ // dfdrHurt
				nonEmpty[2] = true;
				dfdrHurt_totalDmg += e.dmg;
				rowData[2][numTeam + 1] = e.subject.HP; // calculate dmg later
				rowData[2][e.object.party_index + 1] = e.move.name;
			}
		}else if (e.name == "Dodge"){
			nonEmpty[3] = true;
			rowData[3][e.subject.party_index + 1] = "dodge";
		}
	}
	
	if (nonEmpty[2]){
		rowData[2][numTeam + 1] += '(-' + dfdrHurt_totalDmg + ')';
	}
	
	for (var i = 0; i < 4; i++){
		if(nonEmpty[i])
			this.log.push(rowData[i]);
	}
}

// Return the statistis and battle log
World.prototype.get_statistics = function(){
	// The information package include four parts:
	var general_stat = [];	// 1. General statistics (time, winner, etc)
	var team_stats = [];	// 2. Attacker Team performance statistics
	var pokemon_stats = [];	// 3. Individual Pokemon performance statistics, including the defender
	var battle_log = [];	// 4. Battle log (if number of team <= 3, will generate style 2 log)
	
	general_stat['duration'] = Math.round(this.battle_length/100)/10;
	general_stat['total_deaths'] = 0;
	if (this.dfdr.HP > 0) // defender is still active
		general_stat['result'] = "Lose";
	else
		general_stat['result'] = "Win";

	var total_dfdr_HP_lost = this.dfdr.maxHP - Math.max(0, this.dfdr.HP);

	for (var i = 0; i < this.atkr_parties.length; i++){
		var team = this.atkr_parties[i];
		var ts = team.get_statistics(total_dfdr_HP_lost);
		team_stats.push(ts);
		general_stat['total_deaths'] += ts['total_deaths'];
		for (var j = 0; j < team.list.length; j++){
			pokemon_stats.push(team.list[j].get_statistics());
		}
	}
	
	return {
		generalStat : general_stat,
		teamStat : team_stats,
		pokemonStat : pokemon_stats,
		battleLog : this.log
	};
	
}


/* End of Class <World> */




