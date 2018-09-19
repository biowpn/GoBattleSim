/* GBS_Core.js */

/* 
 *	PART I: SIMULATOR SETTINGS
 */

const MAX_NUM_POKEMON_PER_PARTY = 6;
const MAX_NUM_PARTIES_PER_PLAYER = 5;
const MAX_NUM_OF_PLAYERS = 21;
const MAX_BATTLE_DURATION_MS = 3600000;

const EVENT_TYPE = {
	Free: 0,
	Hurt: 1,
	EnergyDelta: 2,
	Enter: 3,
	Dodge: 4,
	Announce: 5,
	MoveEffect: 6
};


/*
 *	PART II: GLOBAL FUNCTIONS
 */

function damage(dmgGiver, dmgReceiver, move, weather){
	var stab = 1;
	if (move.pokeType == dmgGiver.pokeType1 || move.pokeType == dmgGiver.pokeType2){
		stab = Data.BattleSettings.sameTypeAttackBonusMultiplier;
	}
	var wab = 1;
	if (Data.TypeEffectiveness[move.pokeType].boostedIn == weather){
		wab = Data.BattleSettings.weatherAttackBonusMultiplier;
	}
	var fab = dmgGiver.fab || 1;
	var effe1 = Data.TypeEffectiveness[move.pokeType][dmgReceiver.pokeType1] || 1;
	var effe2 = Data.TypeEffectiveness[move.pokeType][dmgReceiver.pokeType2] || 1;
	return Math.floor(0.5*dmgGiver.Atk/dmgReceiver.Def*move.power*effe1*effe2*stab*wab*fab) + 1;
}

function calculateCP(pkm){
	return Math.max(10, Math.floor((pkm.baseAtk+pkm.atkiv)*Math.sqrt((pkm.baseDef+pkm.defiv)*(pkm.baseStm+pkm.stmiv))*pkm.cpm*pkm.cpm/10));
}



/*
 *	PART III: CLASSES
 */

/* Class <Move> */

// constructor
function Move(m, moveDatabase){
	if (typeof m == typeof 0 && m >= 0){
		leftMerge(this, moveDatabase[m]);
	}else if (typeof m == typeof ""){
		leftMerge(this, getEntry(m.toLowerCase(), moveDatabase));
	}else{
		leftMerge(this, m);
	}
	// TODO: Move Effects
}
/* End of Class Move */



/* Class <Pokemon> */

// constructor
function Pokemon(cfg){
	this.id = cfg.id;
	this.role = cfg.role;
	this.raidTier = cfg.raidTier;
	this.master = cfg.master || null;
	this.nickname = cfg.nickname || "";
	this.immortal = cfg.immortal || false;
	this.fab = cfg.fab || 1;
	
	let speciesData = {};
	if (typeof cfg.index == typeof 0 && cfg.index >= 0){
		speciesData = Data.Pokemon[cfg.index];
	}else if (typeof cfg.name == typeof ""){
		speciesData = getEntry(cfg.name.toLowerCase(), Data.Pokemon);
	}else{
		speciesData = cfg;
	}
	this.name = speciesData.name;
	this.pokeType1 = speciesData.pokeType1;
	this.pokeType2 = speciesData.pokeType2;
	this.baseAtk = speciesData.baseAtk;
	this.baseDef = speciesData.baseDef;
	this.baseStm = speciesData.baseStm;
	this.atkiv = parseInt(cfg.atkiv);
	this.defiv = parseInt(cfg.defiv);
	this.stmiv = parseInt(cfg.stmiv);
	this.level = cfg.level;
	this.cpm = parseFloat(cfg.cpm);
	if (isNaN(this.cpm)){
		this.cpm = 0;
		for (let level of Data.LevelSettings){
			if (this.level == level.name || this.level == level.value){
				this.cpm = level.cpm;
				break;
			}
		}
	}
	this.fmove = new Move(cfg.fmove, Data.FastMoves);
	this.cmove = new Move(cfg.cmove, Data.ChargedMoves);
	this.choose = cfg.choose || window[cfg.strategy] || strat1;
	this.init();
}

Pokemon.prototype.init = function(){
	this.initCurrentStats();
	
	this.hasDodged = false;
	this.active = false;
	this.timeEnterMs = 0;
	this.timeLeaveMs = 0;
	this.activeDurationMs = 0;
	this.numOfDeaths = 0;
	this.tdo = 0;
	this.tdoFast = 0;
	
	this.heal();
}

Pokemon.prototype.initCurrentStats = function(){
	if (this.role == "gd"){ // gym defender
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = 2 * Math.floor(this.Stm);
	}else if (this.role == "rb") { // raid boss
		this.cpm = getEntry(this.raidTier.toString(), Data.RaidTierSettings).cpm;
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = getEntry(this.raidTier.toString(), Data.RaidTierSettings).HP;
	}else{ // default, attacker
		this.role = "a";
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = Math.floor(this.Stm);
	}
}

// Fully heal, and set energy to 0
Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
}

// A Pokemon gains/loses energy
Pokemon.prototype.gainEnergy = function(energyDelta){
	this.energy += energyDelta;
	if (this.energy > Data.BattleSettings.maximumEnergy){
		this.totalEnergyOvercharged += this.energy - Data.BattleSettings.maximumEnergy;
		this.energy = Data.BattleSettings.maximumEnergy;
	}
}

// A Pokemon takes damage and gains energy
Pokemon.prototype.takeDamage = function(dmg){
	this.HP -= dmg;
	if (this.HP <= 0 && !this.immortal){
		this.numOfDeaths++;
	}
	this.gainEnergy(Math.ceil(dmg * Data.BattleSettings.energyDeltaPerHealthLost));
	this.hasDodged = false;
}

// Keep record of TDO for performance analysis
Pokemon.prototype.attributeDamage = function(dmg, moveType){
	this.tdo += dmg;
	if (moveType == 'fast'){
		this.tdoFast += dmg;
	}
}

// Return the performance statistics of the Pokemon
Pokemon.prototype.getStatistics = function(){
	return {
		name: this.name,
		hp: this.HP,
		energy: this.energy,
		tdo: this.tdo,
		tdoFast: this.tdoFast,
		duration: this.activeDurationMs/1000,
		dps: this.tdo / (this.activeDurationMs/1000)
	};
}
/* End of Class <Pokemon> */



/* Class <Party> */

// constructor
function Party(cfg){
	this.revive = cfg.revive;
	this.fab = cfg.fab || 1;
	this.pokemon = [];
	for (let pokemon of cfg.pokemon){
		pokemon.fab = this.fab;
		for (var r = 0; r < pokemon.copies; r++){
			this.pokemon.push(new Pokemon(pokemon));
		}
	}
	this.headingPokemonIndex = 0;
	this.heal();
}


Party.prototype.init = function(){
	for (let pokemon of this.pokemon){
		pokemon.init();
	}
	this.headingPokemonIndex = 0;
}

Party.prototype.head = function(){
	return this.pokemon[this.headingPokemonIndex];
}

// Set heading Pokemon to the next Pokemon in the party
// Returns true if there is next Pokemon in the party and false otherwise
Party.prototype.selectNextPokemon = function(){
	return ++this.headingPokemonIndex < this.pokemon.length;
}

// Fully heal each fainted Pokemon, sets the heading pokemon to the first one
Party.prototype.heal = function (){
	for (let pokemon of this.pokemon){
		pokemon.heal();
	}
	this.headingPokemonIndex = 0;
}

// Return the performance statistics of the team
Party.prototype.getStatistics = function(){
	let sum_tdo = 0, sum_numOfDeaths = 0;
	for (let pokemon of this.pokemon){
		sum_tdo += pokemon.tdo;
		sum_numOfDeaths += pokemon.numOfDeaths;
	}
	return {
		tdo: sum_tdo,
		numOfDeaths: sum_numOfDeaths
	};
}
/* End of Class <Party> */



/* Class <Player> */

// constructor
function Player(cfg){
	this.index = cfg.index;
	this.fab = getFriendMultiplier(cfg.friend);
	this.team = cfg.team;
	this.rivals = [];
	this.parties = [];
	for (let party of cfg.parties){
		party.fab = this.fab;
		this.parties.push(new Party(party));
	}
	for (let party of this.parties){
		for (pokemon of party.pokemon){
			pokemon.master = this;
		}
	}
	this.headingPartyIndex = 0;
}


Player.prototype.init = function(){
	for (let party of this.parties){
		party.init();
	}
	this.headingPartyIndex = 0;
}

// Return the heading Pokemon of this player
Player.prototype.head = function(){
	let party = this.parties[this.headingPartyIndex];
	if (party){
		return party.head();
	}else{
		return null;
	}
}

// Control calls this function to ask for the next Pokemon of the player.
// Returns true if the heading party has next Pokemon, 
// and false otherwise, in which case Control should call selectNextParty()
Player.prototype.selectNextPokemon = function(){
	let party = this.parties[this.headingPartyIndex];
	if (party){
		return party.selectNextPokemon();
	}else{
		return false;
	}
}

// Set heading party to the next party
// Returns true if there is next party of the player and false otherwise
Player.prototype.selectNextParty = function(){
	return ++this.headingPartyIndex < this.parties.length;
}


Player.prototype.getStatistics = function(){
	let sum_tdo = 0, sum_numOfDeaths = 0;
	for (let party of this.parties){
		let party_stat = party.getStatistics();
		sum_tdo += party_stat.tdo;
		sum_numOfDeaths += party_stat.numOfDeaths;
	}
	return {
		name: "Player " + (this.index + 1),
		tdo: sum_tdo,
		numOfDeaths: sum_numOfDeaths
	};
}
/* End of Class <Player> */


/* Class <Timeline> */
// A priority queue

// constructor
function Timeline(){
	this.list = [];
}

// Enqueue a new event
Timeline.prototype.insert = function(e){
	this.list.push(e);
	let i = this.list.length-1, j;
	while ((j = Math.floor((i-1)/2)) >= 0){
		if (this.list[j].t > this.list[i].t){
			let temp = this.list[i];
			this.list[i] = this.list[j];
			this.list[j] = temp;
		}else{
			break;
		}
		i = j;
	}
}

// Remove the earliest event (with the smallest t) and returns it
Timeline.prototype.extract_min = function(){
	let e = this.list[0], i = 0, j;
	this.list[0] = this.list[this.list.length-1];
	this.list.pop();
	while ((j = 2*i + 1) < this.list.length){
		if (j+1 < this.list.length && this.list[j+1].t < this.list[j].t){
			m = j+1;
		}else{
			m = j;
		}
		if (this.list[i].t > this.list[m].t){
			let temp = this.list[i];
			this.list[i] = this.list[m];
			this.list[m] = temp;
		}else{
			break;
		}
		i = m;
	}
	return e;
}
/* End of Class <Timeline> */



/* Class <World> */

// constructor
function World(cfg){
	// Configure general parameters
	this.battleMode = cfg.battleMode;
	this.timelimit = parseInt(cfg.timelimit);
	if (!this.timelimit > 0){
		this.timelimit = -1;
	}
	this.weather = cfg.weather || "EXTREME";
	this.hasLog = cfg.hasLog || false;
	this.dodgeBugActive = cfg.dodgeBug || false;
	
	// Configure players
	this.players = [];
	for (let player of cfg.players){
		this.players.push(new Player(player));
	}
	// Configure matchups
	for (let player of this.players){
		for (let player2 of this.players){
			if (player2.team != player.team){ // If you are not in my team, then you are my enemy!
				player.rivals.push(player2);
			}
		}
	}
	// Give each player an index for battle log usage
	// Give each Pokemon a unique ID for later comparison purpose
	let pokemon_id = 0, player_index = 0;
	for (player of this.players){
		player.index = player_index++;
		for (party of player.parties){
			for (pokemon of party.pokemon){
				pokemon.id = pokemon_id++;
			}
		}
	}
	// Nullify revive strategy if unlimited time
	if (this.timelimit < 0){
		for (let player of this.players){
			if (player.team == "0"){
				for (let party of player.parties){
					party.revive = false;
				}
			}
		}
	}
	this.timeline = new Timeline();
	this.battleDuration = 0;
	this.log = [];
}


World.prototype.init = function(){
	for (let player of this.players){
		player.init();
	}
	this.timeline = new Timeline();
	this.battleDuration = 0;
	this.log = [];
}

// A Pokemon uses an attack
World.prototype.pokemonUseAttack = function(pkm, move, t){
	t += Data.BattleSettings[move.moveType + "MoveLagMs"] || 0;
	let energyDeltaEvent = {
		name: EVENT_TYPE.EnergyDelta, t: t + move.dws, subject: pkm, energyDelta: move.energyDelta
	};
	this.timeline.insert(energyDeltaEvent);
	
	for (let rival of pkm.master.rivals){
		let target = rival.head();
		if (target && target.active){
			let dmg = damage(pkm, target, move, this.weather);
			let hurtEvent = {
				name: EVENT_TYPE.Hurt, t: t + move.dws, subject: target, object: pkm, move: move, dmg: dmg
			};
			this.timeline.insert(hurtEvent);
			target.incomingHurtEvent = hurtEvent;
			// TODO: Implement Move Effects
		}
	}
}

// Register events to timeline based on the action performed by a Pokemon
// Returns the time when the Pokemon will be free again
World.prototype.registerAction = function(pkm, t, action){
	if (!action){
		action = {};
	}
	t += action.delay || 0;
	if (action.name == 'fast'){ // Use fast move
		if (pkm.role == "a"){ // Add lag for human player's Pokemon
			t += Data.BattleSettings.fastMoveLagMs;
		}
		this.timeline.insert({
			name: EVENT_TYPE.Announce, t: t, subject: pkm, move: pkm.fmove
		});
		t += pkm.fmove.duration;
	}else if (action.name == "charged"){ // Use charged move
		if (pkm.energy + pkm.cmove.energyDelta >= 0){ // Energy requirement check
			if (pkm.role == "a"){ // Add lag for human player's Pokemon
				t += Data.BattleSettings.chargedMoveLagMs;
			}
			this.timeline.insert({
				name: EVENT_TYPE.Announce, t: t, subject: pkm, move: pkm.cmove
			});
			t += pkm.cmove.duration;
		}else{ // Insufficient energy, wait for 100ms and do nothing
			t += 100;
		}
	}else if (action.name == "dodge"){ // dodge
		if (pkm.role == "a"){ // Add swiping time for human player
			t += Data.BattleSettings.dodgeSwipeMs;
		}
		this.timeline.insert({
			name: EVENT_TYPE.Dodge, t: t, subject: pkm
		});
		t += Data.BattleSettings.dodgeDurationMs;
	}else if (action.name == "switch"){
		// TODO: Feature to be implemented
	}
	
	this.timeline.insert({
		name: EVENT_TYPE.Free, t: t, subject: pkm
	});
	return t;
}

// Check if any of the player is still in game
World.prototype.isTeamDefeated = function(team){
	for (let player of this.players){
		if (player.team == team){
			let pokemon = player.head();
			if (pokemon && pokemon.HP > 0){
				return false;
			}
		}
	}
	return true;
}

// Function to start simulating a battle
World.prototype.battle = function(){
	let t = 0;
	let elog = [];
	let defeatedTeam = "";
	let faintedPokemon = null;
	
	t += Data.BattleSettings.arenaEntryLagMs;
	this.timelimit -= Data.BattleSettings.arenaEarlyTerminationMs;
	
	for (let player of this.players){
		this.timeline.insert({
			name: EVENT_TYPE.Enter, t: t, subject: player.head()
		});
	}

	while (!defeatedTeam && (t < this.timelimit || this.timelimit < 0) && this.battleDuration < MAX_BATTLE_DURATION_MS){
		let e = this.timeline.extract_min();
		t = e.t;
		
		// Process the event
		if (e.name == EVENT_TYPE.Free){
			if (e.subject.active){
				let currentAction = e.subject.buffedAction;
				let tFree = this.registerAction(e.subject, t, currentAction);
				e.subject.buffedAction = e.subject.choose({
					t: t,
					tFree: tFree,
					currentAction: currentAction,
					weather: this.weather,
					dodgeBugActive: this.dodgeBugActive
				});
			}
		}else if (e.name == EVENT_TYPE.Hurt){
			if (e.subject.active && e.object.active){
				e.subject.takeDamage(e.dmg);
				e.subject.incomingHurtEvent = null;
				if (e.subject.HP <= 0 && !e.subject.immortal){
					faintedPokemon = e.subject;
					e.subject.active = false;
				}
				e.object.attributeDamage(e.dmg, e.move.moveType);
				elog.push(e);
			}
		}else if (e.name == EVENT_TYPE.EnergyDelta){
			e.subject.gainEnergy(e.energyDelta);
		}else if (e.name == EVENT_TYPE.Enter){
			e.subject.timeEnterMs = t;
			e.subject.active = true;
			this.timeline.insert({
				name: EVENT_TYPE.Free, t: t + 100, subject: e.subject
			});
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Dodge){
			let eHurt = e.subject.incomingHurtEvent;
			if (eHurt && !e.dodged && (eHurt.t - Data.BattleSettings.dodgeWindowMs) <= t && t <= eHurt.t){
				eHurt.dmg = Math.max(1, Math.floor(eHurt.dmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent)));
				e.dodged = true;
			}
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Announce){
			this.pokemonUseAttack(e.subject, e.move, t);
		}else if (e.name == EVENT_TYPE.MoveEffect){
			// TODO
		}
		
		// Check if some Pokemon fainted and handle it
		if (faintedPokemon){
			let player = faintedPokemon.master;
			let party = player.parties[player.headingPartyIndex];
			faintedPokemon.timeLeaveMs = t;
			faintedPokemon.activeDurationMs += t - faintedPokemon.timeEnterMs;
			if (faintedPokemon.role == "gd" && this.battleMode == "gym"){
				// A gym defender's fainting will reset the battle if the battle mode if "gym"
				this.battleDuration += t;
				for (let e of this.timeline.list){
					e.t -= t;
				}
				t = 0;
			}
			if (player.selectNextPokemon()){ // Select next Pokemon from current party
				this.timeline.insert({
					name: EVENT_TYPE.Enter, t: t + Data.BattleSettings.swapDurationMs, subject: player.head()
				});
			}else if (party.revive){ // Max revive current party and re-lobby
				party.heal();
				this.timeline.insert({
					name: EVENT_TYPE.Enter, 
					t: t + Data.BattleSettings.itemMenuAnimationTimeMs + party.pokemon.length * Data.BattleSettings.maxReviveTimePerPokemonMs,
					subject: player.head()
				});
			}else if (player.selectNextParty()){ // Select next Party and re-lobby
				this.timeline.insert({
					name: EVENT_TYPE.Enter, 
					t: t + Data.BattleSettings.rejoinDurationMs,
					subject: player.head()
				});
			}else{ // This player is done. Check if his team is defeated
				if (this.isTeamDefeated(player.team)){
					defeatedTeam = player.team;
				}
			}
			faintedPokemon = null;
		}
		
		// Fetch and process the next event if it's at the same time
		if (this.timeline.list.length > 0 && t == this.timeline.list[0].t){
			continue;
		}else if (this.hasLog && elog.length > 0){
			this.appendToLog(elog);
			elog = [];
		}
	}
	
	// Battle has ended, some leftovers to handle
	if (this.hasLog && elog.length > 0){
		this.appendToLog(elog);
	}
	
	this.battleDuration += t;
	for (let player of this.players){
		let pkm = player.head();
		if (pkm && pkm.active){
			pkm.timeLeaveMs = t;
			pkm.activeDurationMs += t - pkm.timeEnterMs;
		}
	}
}

// Add events of the same time to battle log
World.prototype.appendToLog = function(events){
	let logEntry = {
		t: round(events[0].t / 1000, 2),
		events: new Array(this.players.length)
	};
	for (let e of events){
		if (e.name == EVENT_TYPE.Enter){
			logEntry.events[e.subject.master.index] = {
				type: 'pokemon',
				eventType: EVENT_TYPE.Enter,
				name: e.subject.name,
				nickname: e.subject.nickname
			};
		}else if (e.name == EVENT_TYPE.Hurt){
			if (!logEntry.events[e.subject.master.index] || logEntry.events[e.subject.master.index].eventType != EVENT_TYPE.Hurt){
				logEntry.events[e.subject.master.index] = {
					type: 'text',
					eventType: EVENT_TYPE.Hurt,
					text: e.subject.HP,
					value: 0
				};
			}
			logEntry.events[e.subject.master.index].value += e.dmg;
			logEntry.events[e.object.master.index] = {
				type: e.move.moveType + 'Move', 
				name: e.move.name
			};
		}else if (e.name == EVENT_TYPE.Dodge){
			logEntry.events[e.subject.master.index] = {
				type: 'text',
				text: 'Dodge'
			};
		}else if (e.name == EVENT_TYPE.MoveEffect){
			logEntry.events[e.subject.master.index] = {
				type: 'text', 
				text: e.text
			};
		}
	}
	for (let e of logEntry.events){
		if (e && e.eventType == EVENT_TYPE.Hurt){
			e.text += "(-" + e.value + ")";
		}
	}
	this.log.push(logEntry);
}

// From the perspective of team "0"
World.prototype.getBattleResult = function(){
	return this.isTeamDefeated("1") ? "Win" : "Lose";
}

// Return the statistis and battle log
World.prototype.getStatistics = function(){
	let general_stat = {};
	let player_stats = [];
	let pokemon_stats = [];
	
	general_stat['duration'] = this.battleDuration/1000;
	general_stat['battle_result'] = this.getBattleResult();
	let sumTDO = 0, sumMaxHP = 0;
	general_stat['numOfDeaths'] = 0;
	for (let player of this.players){
		let ts = player.getStatistics();
		if (player.team == "0"){
			general_stat['numOfDeaths'] += ts['numOfDeaths'];
		}
		player_stats.push(ts);
		let playerStat = [];
		for (let party of player.parties){
			let partyStat = [];
			for (let pokemon of party.pokemon){
				partyStat.push(pokemon.getStatistics());
				if (player.team == "0"){
					sumTDO += pokemon.tdo;
				}else{
					sumMaxHP += pokemon.maxHP;
				}
			}
			playerStat.push(partyStat);
		}
		pokemon_stats.push(playerStat);
	}
	general_stat['tdo'] = sumTDO;
	general_stat['tdo_percent'] = sumTDO / sumMaxHP * 100;
	general_stat['dps'] = sumTDO / (this.battleDuration/1000);
	
	return {
		generalStat: general_stat,
		playerStats: player_stats,
		pokemonStats: pokemon_stats,
		battleLog: this.log
	};	
}
/* End of Class <World> */


// Strategies: these functions are called when control is asking for the next action.
// They should return an action object with the following attributes:
// - name: "fast", "charge", "dodge", "switch"
// - delay: in milliseconds
// - address* (for "switch" action only): [@party index, @pokemon index]

// Gym Defender/Raid Boss strategy
function strat0(state){
	let projectedEnergyDelta = 0;
	let defenderDelay;
	if (state.currentAction){
		if (state.currentAction.name == "fast"){
			projectedEnergyDelta = this.fmove.energyDelta;
		}else if (state.currentAction.name == "charged"){
			projectedEnergyDelta = this.cmove.energyDelta;
		}
		defenderDelay = 1500 + round(1000 * Math.random()) // Add the defender delay;
	}else{
		defenderDelay = 0;
	}
	if (this.energy + projectedEnergyDelta + this.cmove.energyDelta >= 0 && Math.random() <= 0.5){
		actionName = "charged";
	}else{
		actionName = "fast";
	}
	return {
		name: actionName,
		delay: defenderDelay
	};
}

// Attacker strategy: No dodging
function strat1(state){
	let projectedEnergyDelta = 0;
	if (state.currentAction){
		if (state.currentAction.name == "fast"){
			projectedEnergyDelta = this.fmove.energyDelta;
		}else if (state.currentAction.name == "charged"){
			projectedEnergyDelta = this.cmove.energyDelta;
		}
	}
	if (this.energy + projectedEnergyDelta + this.cmove.energyDelta >= 0){
		return {name: "charged", delay: 0};
	}else{
		return {name: "fast", delay: 0};
	}
}

// Attacker strategy: Dodge Charged
function strat2(state){
	if (state.t < state.tFree){
		return;
	}
	let hurtEvent = this.incomingHurtEvent;
	if (hurtEvent && hurtEvent.move.moveType == "charged" && !this.hasDodged){
		let undodgedDmg = hurtEvent.dmg;
		let dodgedDmg = Math.max(1, Math.floor(undodgedDmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent)));
		if (state.dodgeBugActive){
			dodgedDmg = undodgedDmg;
		}
		if (dodgedDmg < this.HP){
			let timeTillHurt = hurtEvent.t - state.tFree;
			if (timeTillHurt > this.cmove.duration + Data.BattleSettings.chargedMoveLagMs + Data.BattleSettings.dodgeSwipeMs){
				// Fit in another charge move
				return {name: "charged", delay: 0};
			}else if (timeTillHurt > this.fmove.duration + Data.BattleSettings.fastMoveLagMs + Data.BattleSettings.dodgeSwipeMs){
				// Fit in another fast move
				return {name: "fast", delay: 0};
			}else if (timeTillHurt < Data.BattleSettings.dodgeWindowMs + Data.BattleSettings.dodgeSwipeMs){
				// Dodge window open, just directly dodge
				this.hasDodged = true;
				return {name: "dodge", delay: 0};
			}else{
				// Dodge window not open, but can't fit in a fast move, so delay a little while and then dodge
				this.hasDodged = true;
				return {
					name: "dodge",
					delay: timeTillHurt - Data.BattleSettings.dodgeWindowMs - Data.BattleSettings.dodgeSwipeMs
				};
			}
		}
	}
	// strat1
	let projectedEnergyDelta = 0;
	if (state.currentAction){
		if (state.currentAction.name == "fast"){
			projectedEnergyDelta = this.fmove.energyDelta;
		}else if (state.currentAction.name == "charged"){
			projectedEnergyDelta = this.cmove.energyDelta;
		}
	}
	if (this.energy + projectedEnergyDelta + this.cmove.energyDelta >= 0){
		return {name: "charged", delay: 0};
	}else{
		return {name: "fast", delay: 0};
	}
}

// Attacker strategy: Dodge All
function strat3(state){
	let t = state.t;
	let tFree = state.tFree;
	let hurtEvent = this.incomingHurtEvent;
	// TODO
	if (hurtEvent && !this.hasDodged){

	}else if (this.hasDodged){
		
	}else{
		
	}
	// strat1
	let projectedEnergyDelta = 0;
	if (state.currentAction){
		if (state.currentAction.name == "fast"){
			projectedEnergyDelta = this.fmove.energyDelta;
		}else if (state.currentAction.name == "charged"){
			projectedEnergyDelta = this.cmove.energyDelta;
		}
	}
	if (this.energy + projectedEnergyDelta + this.cmove.energyDelta >= 0){
		return {name: "charged", delay: 0};
	}else{
		return {name: "fast", delay: 0};
	}
}


// TODO: Move Effects