/* UI_3_parser.js */

var parsedSpeciesFieldMatches = {};
var parsedFastMoveFieldMatches = {};
var parsedChargeMoveFieldMatches = {};

function initMasterSummaryTableMetrics(){
	currentJobSize = 0;
	parsedSpeciesFieldMatches = {};
	parsedFastMoveFieldMatches = {};
	parsedChargeMoveFieldMatches = {};
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics[metric] = nameDisplayed || metric;
}

function getPokemonInfoFromAddress(cfg, address){
	if (address == 'd')
		return cfg['dfdrSettings'];
	else{
		// indices start from 1 in address
		var arr = address.split('-');
		var i = parseInt(arr[0])-1, j = parseInt(arr[1])-1, k = parseInt(arr[2])-1;
		return cfg['atkrSettings'][i].party_list[j].pokemon_list[k];
	}
}

function parsePokemonAttributeExpression(cfg, address, attr, attr_idx, pred, universe){
	var pkmInfo = getPokemonInfoFromAddress(cfg, address);
	if (pkmInfo.stamp.includes(attr))
		return [];
	pkmInfo.stamp += ' ' + attr;
	if ((typeof pkmInfo[attr_idx] == typeof 0) && pkmInfo[attr_idx] >= 0){
		return [];
	}
	
	var expressionStr = pkmInfo[attr], expressionStr_default = '', input_type = 0;
	if (attr == 'species'){
		input_type = 0;
	}else if (['level','atkiv','defiv','stmiv'].includes(attr)){
		input_type = 1;
	}else if (attr == 'fmove' || attr == 'cmove'){
		input_type = 2;
		expressionStr_default = 'current,legacy,exclusive';
		markMoveDatabase(attr[0], pkmInfo.index);
	}
	
	var exact_match_idx = pred(expressionStr);
	if (!isNaN(exact_match_idx) && exact_match_idx >= 0){ // Exact Match
		pkmInfo[attr_idx] = exact_match_idx;
		return [];
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			pkmInfo[attr_idx] = getPokemonInfoFromAddress(cfg, expressionStr.slice(1))[attr_idx];
			return [];
		}catch(err){
			send_feedback(address + '.' + attr + ": Invalid address for Dynamic Assignment", true);
			return [0];
		}
	}else{ // Logical Expression
		var branches = [];
		var selector = expressionStr[0];
		if (SELECTORS.includes(selector))
			expressionStr = expressionStr.slice(1).trim();
		expressionStr = expressionStr || expressionStr_default;
		if (input_type == 1)
			expressionStr = 'value' + expressionStr;
		
		var matches = [];
		if (attr == 'species' && parsedSpeciesFieldMatches[address]){
			matches = parsedSpeciesFieldMatches[address];
		}else if (attr == 'fmove' && parsedFastMoveFieldMatches[address] && parsedFastMoveFieldMatches[address][pkmInfo.index]){
			matches = parsedFastMoveFieldMatches[address][pkmInfo.index];
		}else if (attr == 'cmove' && parsedChargeMoveFieldMatches[address] && parsedChargeMoveFieldMatches[address][pkmInfo.index]){
			matches = parsedChargeMoveFieldMatches[address][pkmInfo.index];
		}else{
			matches = universalGetter(expressionStr, universe);
			if (attr == 'species'){
				parsedSpeciesFieldMatches[address] = matches;
			}else if (attr == 'fmove'){
				if (!parsedFastMoveFieldMatches[address])
					parsedFastMoveFieldMatches[address] = {};
				parsedFastMoveFieldMatches[address][pkmInfo.index] = matches;
			}else if (attr == 'cmove'){
				if (!parsedChargeMoveFieldMatches[address])
					parsedChargeMoveFieldMatches[address] = {};
				parsedChargeMoveFieldMatches[address][pkmInfo.index] = matches;
			}
		}
		if (matches.length == 0){
			send_feedback(address + '[' + pkmInfo.label + '].' + attr + ": No match", true);
			return [0];
		}
		
		if (selector == '*')
			createNewMetric('*' + address + '.' + attr);

		for (var i = 0; i < matches.length; i++){
			var cfg_copy = JSON.parse(JSON.stringify(cfg));
			if (input_type == 0)
				copyAllInfo(getPokemonInfoFromAddress(cfg_copy, address), matches[i]);
			else if (input_type == 1)
				getPokemonInfoFromAddress(cfg_copy, address)[attr_idx] = matches[i].value;
			else if (input_type == 2)
				getPokemonInfoFromAddress(cfg_copy, address)[attr_idx] = matches[i].index;
			
			var tempResults = iterBranchHandler(cfg_copy);
			tempResults.forEach(function(sim){
				branches.push(sim);
			});
		}
		
		if (selector == '?'){
			if (branches.length % matches.length == 0){
				var numSimsPerBranch = Math.round(branches.length / matches.length);
				var branches_post_avrg = [];
				for (var i = 0; i < numSimsPerBranch; i++){
					var simsToAverage = [];
					for (var j = 0; j < matches.length; j++)
						simsToAverage.push(branches[i + j * numSimsPerBranch]);
					branches_post_avrg.push(averageSims(simsToAverage));
				}
				branches = branches_post_avrg;
			}else{			
				branches = [averageSims(branches)];
			}
		}
		
		return branches;
	}
}

function parsePokemonInput(cfg, address){
	var branches = [];
	
	branches = parsePokemonAttributeExpression(cfg, address, 'species', 'index', 
		get_species_index_by_name, getPokemonSpeciesOptions(parseInt(address.split('-')[0]) - 1));
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'level', 'level', parseFloat, LEVEL_VALUES);
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'atkiv', 'atkiv', parseInt, IV_VALUES);
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'defiv', 'defiv', parseInt, IV_VALUES);
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'stmiv', 'stmiv', parseInt, IV_VALUES);
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'fmove', 'fmove_index', get_fmove_index_by_name, FAST_MOVE_DATA);
	if (branches.length) return branches;
	branches = parsePokemonAttributeExpression(cfg, address, 'cmove', 'cmove_index', get_cmove_index_by_name, CHARGED_MOVE_DATA);
	if (branches.length) return branches;
	
	return branches;
}

function parseWeatherInput(cfg){
	var branches = [];
	if (cfg.generalSettings.weather == '*'){
		createNewMetric('weather');
		for (var i = 0; i < WEATHER_LIST.length; i++){
			cfg.generalSettings.weather = WEATHER_LIST[i];
			runSim(JSON.parse(JSON.stringify(cfg)), branches);
		}
	}
	
	return branches;
}

function iterBranchHandler(cfg){
	if (!cfg)
		return [];
	if (maxJobSize && currentJobSize > maxJobSize){
		console.log('Aborted due to current job size(' + currentJobSize + ') exceeding maxJobSize(' + maxJobSize + ')');
		return [];
	}
	
	var branches = [];
	for (var i = 0; i < cfg['atkrSettings'].length; i++){
		for (var j = 0; j < cfg['atkrSettings'][i].party_list.length; j++){
			for (var k = 0; k < cfg['atkrSettings'][i].party_list[j].pokemon_list.length; k++){
				branches = parsePokemonInput(cfg, (i+1)+'-'+(j+1)+'-'+(k+1));
				if (branches.length)
					return branches;
			}
		}
	}
	branches = parsePokemonInput(cfg, 'd');
	if (branches.length)
		return branches;
	
	branches = parseWeatherInput(cfg);
	if (branches.length)
		return branches;
	
	runSim(cfg, branches);
	return branches;
}

function runSim(cfg, resCollector){	
	var app_world = new World(cfg);
	var numSimRun = parseInt(cfg['generalSettings']['simPerConfig']);
	var interResults = [];
	for (var i = 0; i < numSimRun; i++){
		app_world.init();
		app_world.battle();
		interResults.push(app_world.get_statistics());
	}
	if (cfg['generalSettings']['reportType'] == 'avrg')
		resCollector.push({input: cfg, output: averageOutputs(interResults)});
	else if (cfg['generalSettings']['reportType'] == 'enum'){
		for (var i = 0; i < interResults.length; i++)
			resCollector.push({input: cfg, output: interResults[i]});
	}
	currentJobSize += interResults.length;
}

function averageOutputs(results){
	var avrgR = JSON.parse(JSON.stringify(results[0])), numResults = results.length, numPlayer = results[0].playerStats.length;
	
	// These are the metrics to sum and average
	var generalStat_attrs = ['duration', 'tdo_percent', 'tdo', 'total_deaths'];
	var playerStats_attrs = ['tdo', 'tdo_percentage', 'num_rejoin'];
	var pokemonStats_attrs = [], pokemonStats_attrs_excluded = ['player_code', 'index', 'name', 'dps'];
	for (var attr in avrgR.pokemonStats[0][0][0]){
		if (!pokemonStats_attrs_excluded.includes(attr))
			pokemonStats_attrs.push(attr);
	};
	
	// 1. Initialize everything to 0
	avrgR['generalStat']['battle_result'] = 0;
	generalStat_attrs.forEach(function(attr){ avrgR.generalStat[attr] = 0; });
	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){ avrgR.playerStats[j][attr] = 0; });
	}
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < avrgR.pokemonStats[j].length; k++){
			for (var p = 0; p < avrgR.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){ avrgR.pokemonStats[j][k][p][attr] = 0; });
			}
		}
	}
	pokemonStats_attrs.forEach(function(attr){ avrgR.pokemonStats[numPlayer - 1][attr] = 0; });
	
	// 2. Sum them up
	for (var i = 0; i < numResults; i++){
		var result = results[i];
		// generalStat
		if (result.generalStat.battle_result == 'Win')
			avrgR.generalStat.battle_result++;
		generalStat_attrs.forEach(function(attr){ avrgR.generalStat[attr] += result.generalStat[attr]; });
		// playerStats
		for (var j = 0; j < numPlayer; j++){
			playerStats_attrs.forEach(function(attr){ avrgR.playerStats[j][attr] += result.playerStats[j][attr]; });
		}
		// pokemonStats, excluding defender first
		for (var j = 0; j < numPlayer; j++){
			for (var k = 0; k < result.pokemonStats[j].length; k++){
				for (var p = 0; p < result.pokemonStats[j][k].length; p++){
					pokemonStats_attrs.forEach(function(attr){avrgR.pokemonStats[j][k][p][attr] += result.pokemonStats[j][k][p][attr];});
				}
			}
		}
		// pokemonStats, defender
		pokemonStats_attrs.forEach(function(attr){avrgR.pokemonStats[numPlayer - 1][attr] += result.pokemonStats[numPlayer - 1][attr];});
	}
	
	// 3. Divide and get the results
	avrgR.generalStat.battle_result = Math.round(avrgR.generalStat.battle_result/numResults*10000)/100 + "%";
	avrgR.generalStat.dps = Math.round(avrgR.generalStat.tdo/avrgR.generalStat.duration*100)/100;
	generalStat_attrs.forEach(function(attr){
		avrgR.generalStat[attr] = Math.round(avrgR.generalStat[attr]/numResults*100)/100;
	});
	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){
			avrgR.playerStats[j][attr] = Math.round(avrgR.playerStats[j][attr]/numResults*100)/100;
		});
	}
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < result.pokemonStats[j].length; k++){
			for (var p = 0; p < result.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){
					avrgR.pokemonStats[j][k][p][attr] = Math.round(avrgR.pokemonStats[j][k][p][attr]/numResults*100)/100;
				});
				avrgR.pokemonStats[j][k][p].dps = Math.round(avrgR.pokemonStats[j][k][p].tdo/avrgR.pokemonStats[j][k][p].duration*100)/100;
			}
		}
	}
	pokemonStats_attrs.forEach(function(attr){
		avrgR.pokemonStats[numPlayer][attr] = Math.round(avrgR.pokemonStats[numPlayer][attr]/numResults*100)/100;
	});
	avrgR.pokemonStats[numPlayer].dps = Math.round(avrgR.pokemonStats[numPlayer].tdo/avrgR.pokemonStats[numPlayer].duration*100)/100;
	
	avrgR.battleLog = [];
	return avrgR;
}

function averageSims(sims){
	var outputsToAverage = [];
	for (var i = 0; i < sims.length; i++)
		outputsToAverage.push(sims[i].output);
	return {
		input: sims[0].input,
		output: averageOutputs(outputsToAverage)
	};
}