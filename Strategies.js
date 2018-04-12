/* Strategies.js */


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


// No dodging
function atkr_choose_0(state){
	if (this.energy + this.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}



// Agressive dodging
function atkr_choose_1(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projected_atkrHurtEvent;
	var weather = state.weather;
	var dodge_bug = state.dodge_bug;
	
	if (t < hurtEvent.t && (hurtEvent.move.moveType == 'c' || [2,4].includes(this.dodgeStrat)) && !this.has_dodged_next_attack){
		this.has_dodged_next_attack = true;
		
		var timeTillHurt = hurtEvent.t - t;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = Math.floor(undodgedDmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT));
		if (dodge_bug == 1){
			dodgedDmg = undodgedDmg;
		}
		var fDmg = damage(this, dfdr, this.fmove, weather);
		var cDmg = damage(this, dfdr, this.cmove, weather);

		// Goal: Maximize damage before time runs out
		if (this.HP > dodgedDmg){
			// (a) if this Pokemon can survive the dodged damage, then it's better to dodge
			var res = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + FAST_MOVE_LAG_MS, cDmg, this.cmove.energyDelta, this.cmove.duration + CHARGED_MOVE_LAG_MS);
			return res[2].concat([Math.max(timeTillHurt - DODGEWINDOW_LENGTH_MS - res[1], 0), 'd']);
		} else{
			// (b) otherwise, just don't bother to dodge, and YOLO!
			// Compare two strategies: a FMove at the end (resF) or a CMove at the end (resC) by exploiting DWS
			var resF = strategyMaxDmg(timeTillHurt - this.fmove.dws - FAST_MOVE_LAG_MS, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + FAST_MOVE_LAG_MS, cDmg, this.cmove.energyDelta, this.cmove.duration + CHARGED_MOVE_LAG_MS);
			var resC = strategyMaxDmg(timeTillHurt - this.cmove.dws - CHARGED_MOVE_LAG_MS, this.energy + this.cmove.energyDelta, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + FAST_MOVE_LAG_MS, cDmg, this.cmove.energyDelta, this.cmove.duration + CHARGED_MOVE_LAG_MS);
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


// Conservative dodging
function atkr_choose_2(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projected_atkrHurtEvent;
	var weather = state.weather;
	var dodge_bug = state.dodge_bug;
	
	var fDmg = damage(this, dfdr, this.fmove, weather);
	var cDmg = damage(this, dfdr, this.cmove, weather);
	
	if (t < hurtEvent.t && !this.has_dodged_next_attack){ // Case 1: A new attack has been announced and has not been dodged
		this.has_dodged_next_attack = true; // prevent double dodging
		var timeTillHurt = hurtEvent.t - t - DODGE_REACTION_TIME_MS;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = Math.floor(undodgedDmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT));
		if (dodge_bug == 1){
			dodgedDmg = undodgedDmg;
		}
		var opt_strat = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
					this.fmove.duration + FAST_MOVE_LAG_MS, cDmg, this.cmove.energyDelta, this.cmove.duration + CHARGED_MOVE_LAG_MS);
		var res = opt_strat[2];
		if (hurtEvent.move.moveType == 'f') { // Case 1a: A fast move has been announced
			if ([2,4].includes(this.dodgeStrat) && this.HP > dodgedDmg){ // Only dodge when necessary
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - DODGEWINDOW_LENGTH_MS + DODGE_REACTION_TIME_MS)); // wait until dodge window open
				res.push('d');
			}
		}else{ // Case 1b: A charge move has been announced
			if (this.HP > dodgedDmg){
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - DODGEWINDOW_LENGTH_MS + DODGE_REACTION_TIME_MS)); // wait until dodge window open
				res.push('d');
				res.push('c'); // attempt to use cmove
			}
		}
		return res;
	}else{ // Case 2: No new attack has been announced or has dodged the incoming attack
		var res = [];
		if (t > hurtEvent.t){ // just after dodging the current attack
			var move_proj = [2,4].includes(this.dodgeStrat) ? dfdr.fmove : dfdr.cmove;
			var timeTillHurt = hurtEvent.t - t - DODGE_REACTION_TIME_MS + (hurtEvent.move.duration - hurtEvent.move.dws) + 1500 + move_proj.dws;
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