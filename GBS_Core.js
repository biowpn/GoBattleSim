/* GBS_Core.js */

/* 
 *	PART I: SIMULATOR SETTINGS
 */

const EVENT_TYPE = {
	AtkrFree: 0,
	DfdrFree: 1,
	Hurt: 2,
	EnergyDelta: 3,
	Enter: 4,
	Dodge: 5,
	Announce: 6,
	MoveEffect: 7
};


/*
 *	PART II: GLOBAL FUNCTIONS
 */

function damage(dmg_giver, dmg_taker, move, weather){
	var stab = 1;
	if (move.pokeType == dmg_giver.pokeType1 || move.pokeType == dmg_giver.pokeType2){
		stab = Data.BattleSettings.sameTypeAttackBonusMultiplier;
	}
	var wab = 1;
	if (Data.TypeEffectiveness[move.pokeType].boostedIn == weather){
		wab = Data.BattleSettings.weatherAttackBonusMultiplier;
	}
	var fab = dmg_giver.fab || 1;
	var effe1 = Data.TypeEffectiveness[move.pokeType][dmg_taker.pokeType1] || 1;
	var effe2 = Data.TypeEffectiveness[move.pokeType][dmg_taker.pokeType2] || 1;
	return Math.ceil(0.5*dmg_giver.Atk/dmg_taker.Def*move.power*effe1*effe2*stab*wab*fab);
}

function calculateCP(pkm){
	return Math.max(10, Math.floor((pkm.baseAtk+pkm.atkiv)*Math.sqrt((pkm.baseDef+pkm.defiv)*(pkm.baseStm+pkm.stmiv))*pkm.cpm*pkm.cpm/10));
}

function calculateBreakpoints(dmg_giver, dmg_taker, move, weather){
	var breakpoints = [], lastDamage = 0, thisDamage = 0;
	var atkr = new Pokemon(dmg_giver);
	for (var i = 0; i < Data.LevelSettings.length; i++){
		atkr.Atk = (atkr.baseAtk + atkr.atkiv) * Data.LevelSettings[i].cpm;
		thisDamage = damage(atkr, dmg_taker, move, weather);
		if (thisDamage != lastDamage){
			breakpoints.unshift(Data.LevelSettings[i].value);
			lastDamage = thisDamage;
		}
	}
	return {
		"breakpoints": breakpoints,
		"finalDamage": thisDamage
	};
}


/*
 *	PART III: CLASSES
 */

/* Class <Move> */
// constructor
function Move(m, moveDatabase){
	if (typeof m == typeof 0 && m >= 0)
		leftMerge(this, moveDatabase[m]);
	else if (typeof m == typeof "")
		leftMerge(this, getEntry(m.toLowerCase(), moveDatabase));
	else
		leftMerge(this, m);

	if (this.effect_name){
		this.effect = getEntry(this.effect_name, Data.MoveEffects);
		this.effect.sub = getEntry(this.effect.sub_name, Core.MoveEffectSubroutines).sub;
	}
}



/* End of Class Move */



/* Class <Pokemon> */
// constructor
function Pokemon(cfg){
	this.id = round(1000000 * Math.random());
	
	var speciesData = {};
	if (typeof cfg.index == typeof 0 && cfg.index >= 0)
		speciesData = Data.Pokemon[cfg.index];
	else if (typeof cfg.name == typeof "")
		speciesData = getEntry(cfg.name.toLowerCase(), Data.Pokemon);
	else if (typeof cfg.species == typeof "")
		speciesData = getEntry(cfg.species.toLowerCase(), Data.Pokemon);
	else
		speciesData = cfg.species;
	this.name = speciesData.name;
	leftMerge(this, speciesData);
	

	this.fmove = new Move(cfg.fmove, Data.FastMoves);
	this.fmove_name = this.fmove.name;
	this.cmove = new Move(cfg.cmove, Data.ChargedMoves);
	this.cmove_name = this.cmove.name;
	
	this.nickname = cfg.nickname || "";

	this.raidTier = cfg.raid_tier;
	this.atkiv = parseInt(cfg.atkiv);
	this.defiv = parseInt(cfg.defiv);
	this.stmiv = parseInt(cfg.stmiv);
	this.level = parseFloat(cfg.level);
	
	this.choose = window['attackerChoose' + cfg.dodge] || attacherChoose0;
	
	this.immortal = false;
	this.playerCode = cfg.player_code;
	this.fab = cfg.fab || 1;
	
	this.init(true);
}


Pokemon.prototype.init = function(constructorCalled){
	if (!constructorCalled){
		leftMerge(this, getEntry(this.name, Data.Pokemon));
		this.fmove = new Move(this.fmove_name, Data.FastMoves);
		this.cmove = new Move(this.cmove_name, Data.ChargedMoves);
	}
	
	this.initCurrentStats();
	
	this.hasDodged = false;
	this.active = false;
	
	this.timeEnterMs = 0;
	this.timeLeaveMs = 0;
	this.activeDurationMs = 0;
	this.numOfDeaths = 0;
	this.tdo = 0;
	this.totalFastMoveDamageOutput = 0;
	this.totalEnergyOvercharged = 0;
	this.numOfFastMoveHits = 0;
	this.numOfChargedMoveHits = 0;
	this.numOfAdditionalFastMoveHits = 0;
	
	this.heal();
}

Pokemon.prototype.initCurrentStats = function(){
	if (!this.raidTier){ // attacker
		this.cpm = Data.LevelSettings[round(2*this.level - 2)].cpm;
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = Math.floor(this.Stm);
	}else if (this.raidTier < 0){ // gym defender
		this.cpm = Data.LevelSettings[round(2*this.level - 2)].cpm;
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = 2 * Math.floor(this.Stm);
		this.playerCode = 'dfdr';
	}else {// raid boss
		this.cpm = getEntry(this.raidTier.toString(), Data.RaidTierSettings).cpm;
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = getEntry(this.raidTier.toString(), Data.RaidTierSettings).HP;
		this.playerCode = 'dfdr';
	}
}


Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
}

// A Pokemon gains/(loses) energy
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
		this.active = false;
	}
	this.gainEnergy(Math.ceil(dmg * Data.BattleSettings.energyDeltaPerHealthLost));
	this.hasDodged = false;
}

// Keeping record of tdo for performance analysis
Pokemon.prototype.attributeDamage = function(dmg, mType){
	this.tdo += dmg;
	if (mType == 'fast'){
		this.totalFastMoveDamageOutput += dmg;
		this.numOfFastMoveHits += 1;
		this.numOfAdditionalFastMoveHits += 1;
	}else{
		this.numOfChargedMoveHits += 1;
		this.numOfAdditionalFastMoveHits = 0;
	}
}


// Return the performance statistics of the Pokemon
Pokemon.prototype.getStatistics = function(){
	return {
		player_code: this.playerCode,
		name: this.name,
		hp: this.HP,
		energy: this.energy,
		tdo: this.tdo,
		tdo_fmove: this.totalFastMoveDamageOutput,
		duration: this.activeDurationMs/1000,
		dps: this.tdo / (this.activeDurationMs/1000),
		totalEnergyOvercharged: this.totalEnergyOvercharged,
		numOfFastMoveHits: this.numOfFastMoveHits,
		numOfChargedMoveHits: this.numOfChargedMoveHits,
		numOfAdditionalFastMoveHits: this.numOfAdditionalFastMoveHits
	};
}
/* End of Class <Pokemon> */


/* Class <Party> */
// constructor
function Party(cfg){
	this.playerCode = cfg.player_code;
	this.revive_strategy = cfg.revive_strategy;
	this.fab = cfg.fab || 1;
	
	this.pokemon = [];
	for (var k = 0; k < cfg.pokemon_list.length; k++){
		cfg.pokemon_list[k].player_code = this.playerCode;
		cfg.pokemon_list[k].fab = this.fab;
		for (var r = 0; r < cfg.pokemon_list[k].copies; r++){
			this.pokemon.push(new Pokemon(cfg.pokemon_list[k]));
		}
	}
	
	this.init();
}


Party.prototype.init = function(){
	this.pokemon.forEach(function(pkm){
		pkm.init();
	});
	this.active_idx = 0;
	this.active_pkm = this.pokemon[0];
}


// Switch the active Pokemon to the next Pokemon in the party
// Returns true if successful. Otherwise sets active_pkm to null
Party.prototype.sendNextPokemonUp = function (){
	if (++this.active_idx < this.pokemon.length){
		this.active_pkm = this.pokemon[this.active_idx];
		return true;
	}else{
		this.active_idx = -1;
		this.active_pkm = null;
		return false; 
	}
}

// Fully heal each fainted Pokemon, sets the active_pkm to the first one
Party.prototype.heal = function (){
	for (var i = 0; i < this.pokemon.length; i++){
		this.pokemon[i].heal();
	}
	this.active_idx = 0;
	this.active_pkm = this.pokemon[0];
}

// Return the performance statistics of the team
Party.prototype.getStatistics = function(){
	var sum_tdo = 0, sum_numOfDeaths = 0;
	for (var i = 0; i < this.pokemon.length; i++){
		sum_tdo += this.pokemon[i].tdo;
		sum_numOfDeaths += this.pokemon[i].numOfDeaths;
	}
	
	return {
		tdo: sum_tdo,
		numOfDeaths: sum_numOfDeaths
	};
}
/* End of Class <Party> */


/* Class <Player> */
function Player(cfg){
	this.playerCode = cfg.player_code;
	this.fab = getFriendMultiplier(cfg.friend);
	
	this.parties = [];
	for (var j = 0; j < cfg.party_list.length; j++){
		cfg.party_list[j].player_code = this.playerCode;
		cfg.party_list[j].fab = this.fab;
		this.parties.push(new Party(cfg.party_list[j]));
	}
	this.init();
}

Player.prototype.init = function(){
	this.parties.forEach(function(party){
		party.init();
	});
	this.active_idx = 0;
	this.active_pkm = this.parties[0].active_pkm;
	this.num_rejoin = 0;
}

// Control asks for the next Pokemon, and the time before it is sent to field.
// Return -1 if this player is done.
Player.prototype.sendNextPokemonUp = function(){
	var timeBeforeActive = 0;
	var current_party = this.parties[this.active_idx];
	if (current_party.sendNextPokemonUp()){ // Current party has next active Pokemon up
		this.active_pkm = current_party.active_pkm;
		timeBeforeActive = Data.BattleSettings.swapDurationMs;
	}else{ // Current party all faint. Need to rejoin
		timeBeforeActive = Data.BattleSettings.rejoinDurationMs;
		if (current_party.revive_strategy == true){ // Revive currently party
			current_party.heal();
			this.active_pkm = current_party.active_pkm;
			timeBeforeActive += Data.BattleSettings.itemMenuAnimationTimeMs +  current_party.pokemon.length * Data.BattleSettings.maxReviveTimePerPokemonMs;
			this.num_rejoin++;
		}else{ // Try to switch to the next line-up, no need to revive
			if (++this.active_idx < this.parties.length){
				this.active_pkm = this.parties[this.active_idx].active_pkm;
				this.num_rejoin++;
			}else{ // Too bad, this player is out of game!
				this.active_idx = -1;
				this.active_pkm = null;
				timeBeforeActive = -1;
			}
		}
	}
	return timeBeforeActive;
}


Player.prototype.getStatistics = function(total_players_tdo){
	var sum_tdo = 0, sum_numOfDeaths = 0;
	for (var i = 0; i < this.parties.length; i++){
		var party_stat = this.parties[i].getStatistics();
		sum_tdo += party_stat.tdo;
		sum_numOfDeaths += party_stat.numOfDeaths;
	}
	
	return {
		player_code : this.playerCode,
		tdo : sum_tdo,
		tdo_percentage : sum_tdo/total_players_tdo * 100,
		num_rejoin : this.num_rejoin,
		numOfDeaths : sum_numOfDeaths
	};
}


/* End of Class <Player> */

/* Class <Timeline> */
// A heap-like data structure
// constructor
function Timeline(){
	this.list = [];
}

Timeline.prototype.insert = function(e){
	this.list.push(e);
	var i = this.list.length-1, j;
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

Timeline.prototype.extract_min = function(){
	var min_e = this.list[0], i = 0, j;
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
	return min_e;
}


/* End of Class <Timeline> */


/* Class <World> */
// constructor
// Takes a configuration dictionary object "cfg" for sim parameters
function World(cfg){
	// Set up general
	this.raid_tier = cfg['dfdrSettings']['raid_tier'];
	if (this.raid_tier == -1)
		this.timelimit = Data.BattleSettings.timelimitGymMs;
	else if (this.raid_tier < 5)
		this.timelimit = Data.BattleSettings.timelimitRaidMs;
	else
		this.timelimit = Data.BattleSettings.timelimitLegendaryRaidMs;
	this.weather = cfg['generalSettings']['weather'] || "EXTREME";
	this.hasLog = cfg['generalSettings']['logStyle'] || 0;
	this.dodgeBugActive = cfg['generalSettings']['dodgeBug'] || 0;
	this.isDefenderImmortal = cfg['generalSettings']['immortalDefender'] || 0;
	
	// Set up players
	this.players = [];
	for (var i = 0; i < cfg['atkrSettings'].length; i++)
		this.players.push(new Player(cfg['atkrSettings'][i]));
	
	// Set up defender
	this.dfdr = new Pokemon(cfg['dfdrSettings']);
	if (this.isDefenderImmortal){
		this.dfdr.immortal = true;
		this.players.forEach(function(player){
			player.parties.forEach(function(party){
				party.revive_strategy = false;
			});
		});
	}
	
	this.init();
}


World.prototype.init = function(){
	this.players.forEach(function(player){
		player.init();
	});
	this.dfdr.init();
	
	this.timeline = new Timeline();
	this.anyPlayerActive = true;
	this.anyAttackerFainted = false;
	this.projectedAttackerHurtEvent = null;
	this.battleDuration = 0;
	this.log = [];
}

// Player's Pokemon uses a move
World.prototype.attackerUsesMove = function(pkm, pkm_hurt, move, t){
	t += Data.BattleSettings[move.moveType + "MoveLagMs"];
	var energyDeltaEvent = {
		name: EVENT_TYPE.EnergyDelta, t: t + move.dws, subject: pkm, energyDelta: move.energyDelta
	};
	this.timeline.insert(energyDeltaEvent);
	
	var dmg = damage(pkm, pkm_hurt, move, this.weather);
	var hurtEvent = {
		name: EVENT_TYPE.Hurt, t: t + move.dws, subject: pkm_hurt, object: pkm, move: move, dmg: dmg
	};
	this.timeline.insert(hurtEvent);
	
	if (move.effect){
		move.effect.sub({
			"world": this,
			"parameters": move.effect.parameters,
			"pkm": pkm,
			"pkm_hurt": pkm_hurt,
			"move": move,
			"t": t,
			"hurtEvent": hurtEvent,
			"energyDeltaEvent": energyDeltaEvent
		});
	}
}

// Gym Defender/Raid Boss uses a move, hurting all active attackers
World.prototype.defenderUsesMove = function(pkm, move, t){
	var energyDeltaEvent = {
		name: EVENT_TYPE.EnergyDelta, t: t + move.dws, subject: pkm, energyDelta: move.energyDelta
	};
	this.timeline.insert(energyDeltaEvent);
	
	for (var i = 0; i < this.players.length; i++){
		var pkm_hurt = this.players[i].active_pkm;
		if (pkm_hurt && pkm_hurt.active){
			var dmg = damage(pkm, pkm_hurt, move, this.weather);
			var hurtEvent = {
				name: EVENT_TYPE.Hurt, t: t + move.dws, subject: pkm_hurt, object: pkm, move: move, dmg: dmg
			};
			this.timeline.insert(hurtEvent);
			if (move.effect){
				move.effect.sub({
					"world": this,
					"parameters": move.effect.parameters,
					"pkm": pkm,
					"pkm_hurt": pkm_hurt,
					"move": move,
					"t": t,
					"hurtEvent": hurtEvent,
					"energyDeltaEvent": energyDeltaEvent
				});
			}
		}
	}
	this.projectedAttackerHurtEvent = {name: EVENT_TYPE.Hurt, t: t + move.dws, object: pkm, move: move};
}



// Enqueue events to timeline according from a list of actions
// And ask for the next action when the attacker is free again
World.prototype.enqueueActions = function(pkm, pkm_hurt, t, actions){
	var tFree = t;
	for (var i = 0; i < actions.length; i++){
		if (actions[i] == 'f'){ // Use fast move
			this.timeline.insert({
				name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.fmove
			});
			tFree += pkm.fmove.duration + Data.BattleSettings.fastMoveLagMs;
		}else if (actions[i] == 'c'){ // Use charge move if energy is enough
			if (pkm.energy + pkm.cmove.energyDelta >= 0){
				this.timeline.insert({
					name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.cmove
				});
				tFree += pkm.cmove.duration + Data.BattleSettings.chargedMoveLagMs;
			}else{ // insufficient energy, use fmove instead
				this.timeline.insert({
					name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.fmove
				});
				tFree += pkm.fmove.duration + Data.BattleSettings.fastMoveLagMs;
			}
		}else if (actions[i] == 'd'){ // dodge
			this.timeline.insert({
				name: EVENT_TYPE.Dodge, t: tFree, subject: pkm
			});
			tFree += Data.BattleSettings.dodgeDurationMs;
		}else // wait
			tFree += actions[i];
	}
	this.timeline.insert({
		name: EVENT_TYPE.AtkrFree, t: tFree, subject: pkm
	});
}

// Finds and returns the next Hurt event of a specified Pokemon
World.prototype.nextHurtEventOf = function(pkm){
	for (var i = 0; i < this.timeline.list.length; i++){
		var thisEvent = this.timeline.list[i];
		if (thisEvent.name == EVENT_TYPE.Hurt && thisEvent.subject.id == pkm.id)
			return thisEvent;
	}
}


// Gym Defender/Raid Boss strategy
World.prototype.defenderChoose = function(pkm, t, current_move){
	// A defender decides the next action (at t + current_move.duration + delay) now (at t)

	var next_move = pkm.fmove;
	var next_t = t + current_move.duration;
	
	// If the projected energy is enough to use cmove, then 0.5 probablity it will use
	if (pkm.energy + current_move.energyDelta + pkm.cmove.energyDelta >= 0 && Math.random() <= 0.5){
		next_move = pkm.cmove;
	}
	// Add the defender delay
	next_t += 1500 + round(1000 * Math.random());
	
	this.timeline.insert({
		name: EVENT_TYPE.DfdrFree, t: next_t, subject: pkm, move: next_move
	});
	this.timeline.insert({
		name: EVENT_TYPE.Announce, t: next_t, subject: pkm, move: next_move
	});
}


// Gym Defender or Raid Boss moves at the start of a battle
World.prototype.defenderChooseInitial = function(dfdr, t){
	this.defenderUsesMove(dfdr, dfdr.fmove, t);
	this.defenderChoose(dfdr, t - dfdr.fmove.duration, dfdr.fmove);
}

// Check if any of the player is still in game
World.prototype.checkAnyPlayerActive = function(){
	for (var i = 0; i < this.players.length; i++){
		var pkm = this.players[i].active_pkm;
		if (pkm && pkm.HP > 0){
			return true;
		}
	}
	return false;
}


World.prototype.battle = function(){
	var t = Data.BattleSettings.arenaEntryLagMs;
	var elog = [];
	var dfdr = this.dfdr;
	
	for (var i = 0; i < this.players.length; i++){
		var atkr = this.players[i].active_pkm;
		if (atkr)
			atkr.active = true;
		this.timeline.insert({
			name: EVENT_TYPE.Enter, t: t, subject: atkr
		});
	}
	
	this.timeline.insert({
		name: EVENT_TYPE.Enter, t: t, subject: dfdr
	});
	this.defenderChooseInitial(dfdr, t);
	dfdr.active = true;

	while (dfdr.active && this.anyPlayerActive){
		var e = this.timeline.extract_min();
		t = e.t;
		if (t >= this.timelimit - Data.BattleSettings.arenaEarlyTerminationMs && !this.isDefenderImmortal)
			break;
		
		// 1. First process the event
		if (e.name == EVENT_TYPE.AtkrFree){
			var actions = e.subject.choose({
				t: t,
				dfdr: dfdr,
				weather: this.weather,
				dodgeBugActive: this.dodgeBugActive,
				projectedAttackerHurtEvent: this.projectedAttackerHurtEvent
			});
			this.enqueueActions(e.subject, dfdr, t, actions);
		}else if (e.name == EVENT_TYPE.DfdrFree){
			this.defenderChoose(e.subject, t, e.move);
		}else if (e.name == EVENT_TYPE.Hurt){
			if (e.subject.active && e.object.active){
				e.subject.takeDamage(e.dmg);
				e.subject.hasDodged = false;
				if (e.subject.HP <= 0 && e.subject.raidTier == 0)
					this.anyAttackerFainted = true;
				e.object.attributeDamage(e.dmg, e.move.moveType);
				elog.push(e);
			}
		}else if (e.name == EVENT_TYPE.EnergyDelta){
			e.subject.gainEnergy(e.energyDelta);
		}else if (e.name == EVENT_TYPE.Enter){
			e.subject.timeEnterMs = t;
			e.subject.active = true;
			if (e.subject.raidTier == 0) // Atkr
				this.timeline.insert({
					name: EVENT_TYPE.AtkrFree, t: t + 100, subject: e.subject
				});
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Dodge){
			var eHurt = this.nextHurtEventOf(e.subject);
			if (eHurt && !e.dodged && (eHurt.t - Data.BattleSettings.dodgeWindowMs) <= t && t <= eHurt.t){
				eHurt.dmg = Math.max(1, Math.floor(eHurt.dmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent)));
				e.dodged = true;
			}
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Announce){
			if (e.subject.raidTier == 0) // Atkr
				this.attackerUsesMove(e.subject, e.object, e.move, t);
			else
				this.defenderUsesMove(e.subject, e.move, t);
		}else if (e.name == EVENT_TYPE.MoveEffect){
			e.action(e);
			elog.push(e);
		}
		
		// 2. Check if some attacker fainted
		if (this.anyAttackerFainted){
			for (var i = 0; i < this.players.length; i++){
				var this_player = this.players[i], old_pkm = this.players[i].active_pkm;
				if (old_pkm && old_pkm.HP <= 0){
					for (var j = 0; j < this.timeline.list.length; j++){
						var thisEvent =  this.timeline.list[j];
						if (thisEvent.name == EVENT_TYPE.AtkrFree && thisEvent.subject.id == old_pkm.id)
							this.timeline.list.splice(j--, 1);
					}
					old_pkm.timeLeaveMs = t;
					old_pkm.activeDurationMs += t - old_pkm.timeEnterMs;
					var delay = this_player.sendNextPokemonUp(); // Ask for sending another attacker
					if (this_player.active_pkm)
						this.timeline.insert({
							name: EVENT_TYPE.Enter, t: t + delay, subject: this_player.active_pkm
						});
				}
			}
			this.anyAttackerFainted = false;
			this.anyPlayerActive = this.checkAnyPlayerActive();
		}
		
		// 3. Check if the defender fainted
		if (!dfdr.active){
			dfdr.timeLeaveMs = t;
			dfdr.activeDurationMs += t - dfdr.timeEnterMs;
		}
		
		// 4. Process the next event if it's at the same time before deciding whether the battle has ended
		if (this.timeline.list.length > 0 && t == this.timeline.list[0].t)
			continue;
		if (this.hasLog && elog.length > 0)
			this.appendToLog(elog);
		elog = [];
	}
	
	// Battle has ended, some leftovers
	if (this.hasLog && elog.length > 0)
		this.appendToLog(elog);
		
	this.battleDuration = t;
	for (var i = 0; i < this.players.length; i++){
		var pkm = this.players[i].active_pkm;
		if (pkm && pkm.active){
			pkm.timeLeaveMs = t;
			pkm.activeDurationMs += t - pkm.timeEnterMs;
		}
	}
	if (dfdr.active){
		dfdr.timeLeaveMs = t;
		dfdr.activeDurationMs += t - dfdr.timeEnterMs;
	}
}


// Add events of the same time to battle log
// Format: [time] [team 1 pokemon] ... [team n pokemon] [defender]
World.prototype.appendToLog = function(events){
	var numPlayer = this.players.length;
	// Correspond to Enter, AtkrHurt, DfdrHurt, AtkrDogde, and move effect event
	var rowData = [{},{},{},{},{}];
	var nonEmpty = [false, false, false, false, false];
	var dfdrHurt_totalDmg = 0;
	for (var i = 0; i < rowData.length; i++){
		rowData[i].t = {
			'type': 'text',
			'text': round(events[0].t, 2)
		};
		rowData[i].dfdr = {
			'type': 'text',
			'text': ""
		};
		for (var j = 1; j <= numPlayer; j++)
			rowData[i][j] = {
				'type': 'text',
				'text': ""
			};
	}
	
	for (var i = 0; i < events.length; i++){
		var e = events[i];
		if (e.name == EVENT_TYPE.Enter){
			nonEmpty[0] = true;
			rowData[0][e.subject.playerCode] = {
				'type': 'pokemon',
				'name': e.subject.name,
				'nickname': e.subject.nickname
			};
		}else if (e.name == EVENT_TYPE.Hurt){
			if (e.subject.raidTier == 0){ // atkrHurt
				nonEmpty[1] = true;
				rowData[1][e.subject.playerCode] = {
					'type': 'text',
					'text': e.subject.HP + '(-' + e.dmg + ')'
				};
				rowData[1].dfdr = {
					'type': e.move.moveType + 'Move', 
					'name': e.move.name
				};
			}else{ // dfdrHurt
				nonEmpty[2] = true;
				dfdrHurt_totalDmg += e.dmg;
				rowData[2].dfdr = {
					'type': 'text',
					'text': e.subject.HP
				}; 
				rowData[2][e.object.playerCode] = {
					'type': e.move.moveType + 'Move', 
					'name': e.move.name
				};
			}
		}else if (e.name == EVENT_TYPE.Dodge){
			nonEmpty[3] = true;
			rowData[3][e.subject.playerCode] = {
				'type': 'text',
				'text': 'Dodge'
			};
		}else if (e.name == EVENT_TYPE.MoveEffect){
			nonEmpty[4] = true;
			rowData[4][e.subject.playerCode] = {
				'type': 'text', 
				'text': e.text
			};
		}
	}
	if (nonEmpty[2]){
		rowData[2].dfdr.text += '(-' + dfdrHurt_totalDmg + ')';
	}
	
	for (var i = 0; i < rowData.length; i++){
		if(nonEmpty[i])
			this.log.push(rowData[i]);
	}
}

// Return the statistis and battle log
World.prototype.getStatistics = function(){
	// The information package include four parts:
	var general_stat = {};	// 1. General statistics (time, winner, etc)
	var player_stats = [];	// 2. Players performance statistics
	var pokemon_stats = [];	// 3. Individual Pokemon performance statistics, including the defender
	var battle_log = [];	// 4. Battle log
	
	general_stat['duration'] = this.battleDuration/1000;
	general_stat['numOfDeaths'] = 0;
	general_stat['battle_result'] = this.dfdr.active ? "Lose" : "Win";
	
	general_stat['tdo'] = this.dfdr.maxHP - this.dfdr.HP;
	general_stat['tdo_percent'] = general_stat['tdo'] / this.dfdr.maxHP * 100;
	general_stat['dps'] = general_stat['tdo'] / (this.battleDuration/1000);
	
	for (var i = 0; i < this.players.length; i++){
		var player = this.players[i];
		var ts = player.getStatistics(general_stat['tdo']);
		general_stat['numOfDeaths'] += ts['numOfDeaths'];
		player_stats.push(ts);
		pokemon_stats.push([]);
		for (var j = 0; j < player.parties.length; j++){
			pokemon_stats[i].push([]);
			for (var k = 0; k < player.parties[j].pokemon.length; k++)
				pokemon_stats[i][j].push(player.parties[j].pokemon[k].getStatistics());
		}
	}
	pokemon_stats.push(this.dfdr.getStatistics());
	
	return {
		generalStat : general_stat,
		playerStats : player_stats,
		pokemonStats : pokemon_stats,
		battleLog : this.log
	};	
}


/* End of Class <World> */



/* 
 * Strategies.js 
 */

// Brutal force to find out how to maximize damage within a limited time (guaranteed to fit in at least one fmove/cmove)
// and be free afterwards, at the same time satisfies energy rule
// returns the damage, totaltime needd, and a list of 'f'/'c' like ['f','f','c','f'] representing the optimal action
// Note it will returns [-1, -1, []] if there's no solution for negative initial energy
function strategyMaxDmg(T, initE, fDmg, fE, fDur, cDmg, cE, cDur){
	var maxC = Math.floor(T/cDur), maxF = 0, optimalC = 0, optimalF = 0, optimalDamage = -1, optimalTime = -1;

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
// These functions should return a list of planned actions
// like ['f', 'c', 100, 'd'] <- means use a FMove, then a Cmove, then wait for 100s and finally dodge

// 0. No dodging
function attacherChoose0(state){
	if (this.energy + this.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}

// 1. Aggressive dodge charged
function attackerChoose1(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projectedAttackerHurtEvent;
	var weather = state.weather;
	var dodgeBugActive = state.dodgeBugActive;
	
	if (t < hurtEvent.t && hurtEvent.move.moveType == 'charged' && !this.hasDodged){
		this.hasDodged = true;
		
		var timeTillHurt = hurtEvent.t - t;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = dodgeBugActive ? undodgedDmg : Math.floor(undodgedDmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent));
		var fDmg = damage(this, dfdr, this.fmove, weather);
		var cDmg = damage(this, dfdr, this.cmove, weather);

		// Goal: Maximize damage before time runs out
		if (this.HP > dodgedDmg){
			// (a) if this Pokemon can survive the dodged damage, then it's better to dodge
			var res = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + Data.BattleSettings.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + Data.BattleSettings.chargedMoveLagMs);
			return res[2].concat([Math.max(timeTillHurt - Data.BattleSettings.dodgeWindowMs - res[1], 0), 'd']);
		} else{
			// (b) otherwise, just don't bother to dodge, and YOLO!
			// Compare two strategies: a FMove at the end (resF) or a CMove at the end (resC) by exploiting DWS
			var resF = strategyMaxDmg(timeTillHurt - this.fmove.dws - Data.BattleSettings.fastMoveLagMs, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + Data.BattleSettings.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + Data.BattleSettings.chargedMoveLagMs);
			var resC = strategyMaxDmg(timeTillHurt - this.cmove.dws - Data.BattleSettings.chargedMoveLagMs, this.energy + this.cmove.energyDelta, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + Data.BattleSettings.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + Data.BattleSettings.chargedMoveLagMs);
			if (resC[0] + cDmg > resF[0] + fDmg && resC[1] >= 0){ 
				// Use a cmove at the end is better, on the condition that it obeys the energy rule
				return resC[2].concat('c');
			}else{
				return resF[2].concat('f');
			}
		}
	}
	
	if (this.energy + this.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}

// 2. Conservative dodge all
function attackerChoose2(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projectedAttackerHurtEvent;
	var weather = state.weather;
	var dodgeBugActive = state.dodgeBugActive;
	
	var fDmg = damage(this, dfdr, this.fmove, weather);
	var cDmg = damage(this, dfdr, this.cmove, weather);
	
	if (t < hurtEvent.t && !this.hasDodged){ // Case 1: A new attack has been announced and has not been dodged
		this.hasDodged = true; // prevent double dodging
		var timeTillHurt = hurtEvent.t - t - Data.BattleSettings.dodgeSwipeMs;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = dodgeBugActive ? undodgedDmg : Math.floor(undodgedDmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent));
		var opt_strat = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
					this.fmove.duration + Data.BattleSettings.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + Data.BattleSettings.chargedMoveLagMs);
		var res = opt_strat[2];
		if (hurtEvent.move.moveType == 'fast') { // Case 1a: A fast move has been announced
			if (this.HP > dodgedDmg){ // Only dodge when necessary
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - Data.BattleSettings.dodgeWindowMs + Data.BattleSettings.dodgeSwipeMs)); // wait until dodge window open
				res.push('d');
			}
		}else{ // Case 1b: A charge move has been announced
			if (this.HP > dodgedDmg){
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - Data.BattleSettings.dodgeWindowMs + Data.BattleSettings.dodgeSwipeMs)); // wait until dodge window open
				res.push('d');
				res.push('c'); // attempt to use cmove
			}
		}
		return res;
	}else{ // Case 2: No new attack has been announced or has dodged the incoming attack
		var res = [];
		if (t > hurtEvent.t){ // just after dodging the current attack
			var timeTillHurt = hurtEvent.t - t - Data.BattleSettings.dodgeSwipeMs + (hurtEvent.move.duration - hurtEvent.move.dws) + 1500 + dfdr.fmove.dws;
			if (this.energy + this.cmove.energyDelta >= 0 && this.cmove.duration < timeTillHurt)
				res.push('c');
			else
				res.push('f');
		}
		if (res.length == 0){ //just wait
			res.push(200);
		}
		return res;
	}
}


// Move Effects
var Core = {
	"MoveEffectSubroutines": [
		{
			"name": "hp_draining",
			"sub": function(kwargs){
				kwargs.world.timeline.insert({
					name: EVENT_TYPE.MoveEffect, t: kwargs.t + kwargs.move.dws, subject: kwargs.pkm, hurtEvent: kwargs.hurtEvent,
					action: function(e){
						var pkm = e.subject;
						e.value = Math.ceil(e.hurtEvent.dmg * kwargs.parameters.multiplier);
						e.text = '(+' + e.value + ' HP)';
						pkm.HP = Math.min(pkm.maxHP, pkm.HP + e.value);
					}
				});
			}
		},
		{
			"name": "stat_modification",
			"sub": function(kwargs){
				if (Math.random() < kwargs.parameters.prob){
					for (var i = 0; i < kwargs.parameters.targets.length; i++){
						var subj = kwargs[kwargs.parameters.targets[i]], stat = kwargs.parameters.stats[i];
						if (!subj[stat+'_stage'])
							subj[stat+'_stage'] = 0;
						subj[stat+'_stage'] = Math.min(10, Math.max(-10, subj[stat+'_stage'] + kwargs.parameters.stage_deltas[i]));
						subj[stat] = (subj['base'+stat] + subj[stat.toLowerCase()+'iv']) * subj.cpm * (1 + subj[stat+'_stage'] * 0.01);
					}
				}
			}
		},
		{
			"name": "transform",
			"sub": function(kwargs){
				pkm = kwargs.pkm;
				pkm_hurt = kwargs.pkm_hurt;
				pkm.baseAtk = pkm_hurt.baseAtk;
				pkm.baseDef = pkm_hurt.baseDef;
				pkm.pokeType1 = pkm_hurt.pokeType1;
				pkm.pokeType2 = pkm_hurt.pokeType2;
				pkm.fmove = new Move(pkm_hurt.fmove);
				pkm.cmove = new Move(pkm_hurt.cmove);
				pkm.initCurrentStats();
			}
		}
	]
};