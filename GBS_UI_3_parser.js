/* GBS_UI_3_parser.js */


function initMasterSummaryTableMetrics(){
	currentJobSize = 0;
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics[metric] = nameDisplayed || metric;
}


function getPokemonConfig(cfg, address){
	if (address == 'd')
		return cfg['dfdrSettings'];
	else{
		// indices start from 1 in address
		var arr = address.split('-');
		var i = parseInt(arr[0])-1, j = parseInt(arr[1])-1, k = parseInt(arr[2])-1;
		return cfg['atkrSettings'][i].party_list[j].pokemon_list[k];
	}
}


function iterBranch2(cfg, address, attr, exmatch, universe, start){
	var pkmInfo = getPokemonConfig(cfg, address);
	var expressionStr = pkmInfo[attr].toString();
	if (exmatch(expressionStr, universe) >= 0){
		return [];
	}
	
	var expressionStr_default = '', input_type = 0;
	if (attr == 'name'){
		expressionStr_default = 'latios';
		input_type = 0;
	}else if (['level', 'atkiv', 'defiv', 'stmiv'].includes(attr)){
		input_type = 1;
		expressionStr_default = universe[universe.length - 1].value;
	}else if (attr == 'fmove' || attr == 'cmove'){
		input_type = 2;
		expressionStr_default = 'current, legacy, exclusive';
		markMoveDatabase(attr[0], getEntryIndex(pkmInfo.name.toLowerCase(), Data.Pokemon));
	}

	if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var pkmConfig = getPokemonConfig(cfg, expressionStr.slice(1));
			pkmInfo[attr] = pkmConfig[attr];
			return [];
		}catch(err){
			sendFeedback(address + '.' + attr + ": Invalid address for Dynamic Assignment", true);
			return [0];
		}
	}else{ // Logical Expression
		var branches = [];
		var selector = expressionStr[0];
		if (SELECTORS.includes(selector))
			expressionStr = expressionStr.slice(1).trim();
		expressionStr = expressionStr || expressionStr_default;
		
		var matches = universe.filter(Predicate(expressionStr.toString()));
		if (matches.length == 0){
			// sendFeedback(address + '.' + attr + " {" + expressionStr + "}: No match", true);
			return [0];
		}
		
		if (selector != '?')
			createNewMetric('*' + address + '.' + attr);

		for (var i = 0; i < matches.length; i++){
			var cfg_copy = JSON.parse(JSON.stringify(cfg));
			var pkmConfig = getPokemonConfig(cfg_copy, address);
			if (input_type == 0){
				for(var attr in matches[i]){
					if (!pkmConfig[attr] || attr == 'name'){
						pkmConfig[attr] = matches[i][attr];
					}
				}
			}else if (input_type == 1){
				pkmConfig[attr] = matches[i].value;
			}else if (input_type == 2){
				pkmConfig[attr] = matches[i].name;
			}
			
			var tempResults = iterBranch(cfg_copy, start.slice(0, 4).concat([start[4] + 1]));
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

function iterBranch1(cfg, address, start){
	var branches = [];
	
	if (start[4] == 0){
		branches = iterBranch2(cfg, address, 'name', x => getEntryIndex(x, Data.Pokemon), getPokemonOptions(parseInt(address.split('-')[0]) - 1), start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 1){
		branches = iterBranch2(cfg, address, 'level', parseFloat, Data.LevelSettings, start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 2){
		branches = iterBranch2(cfg, address, 'atkiv', parseInt, Data.IndividualValues, start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 3){
		branches = iterBranch2(cfg, address, 'defiv', parseInt, Data.IndividualValues, start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 4){
		branches = iterBranch2(cfg, address, 'stmiv', parseInt, Data.IndividualValues, start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 5){
		branches = iterBranch2(cfg, address, 'fmove', getEntryIndex, Data.FastMoves, start);
		if (branches.length) return branches;
		start[4]++;
	}
	if (start[4] == 6){
		branches = iterBranch2(cfg, address, 'cmove', getEntryIndex, Data.ChargedMoves, start);
		if (branches.length) return branches;
		start[4]++;
	}
	
	return branches;
}

function iterBranch(cfg, start){
	if (!cfg)
		return [];

	var branches = [];
	if (start[0] == 0){
		for (var i = start[1]; i < cfg['atkrSettings'].length; i++){
			for (var j = start[2]; j < cfg['atkrSettings'][i].party_list.length; j++){
				for (var k = start[3]; k < cfg['atkrSettings'][i].party_list[j].pokemon_list.length; k++){
					branches = iterBranch1(cfg, (i+1)+'-'+(j+1)+'-'+(k+1), [start[0], i, j, k, start[4]]);
					if (branches.length)
						return branches;
					start[4] = 0;
				}
			}
		}
		start[0]++;
	}
	if (start[0] == 1){
		branches = iterBranch1(cfg, 'd', start);
		if (branches.length)
			return branches;
		start[0]++;
	}
	
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
		interResults.push(app_world.getStatistics());
	}
	currentJobSize += numSimRun;
	
	if (cfg['generalSettings']['reportType'] == 'avrg')
		resCollector.push({input: cfg, output: averageOutputs(interResults)});
	else if (cfg['generalSettings']['reportType'] == 'enum'){
		for (var i = 0; i < interResults.length; i++)
			resCollector.push({input: cfg, output: interResults[i]});
	}
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


function applicationInit(){
	addPlayerNode();
	document.getElementById("ui-defenderinputbody").innerHTML = "";
	document.getElementById("ui-defenderinputbody").appendChild(createDefenderNode());
	document.getElementById("simPerConfig").value = 1;
	populateQuickStartWizardBossList('current');

	if (window.location.href.includes('?')){
		writeUserInput(parseConfigFromUrl(window.location.href));
		goBattleSim();
	}
	if (!LocalData.QuickStartWizardNoShow && !window.location.href.includes('?'))
		$( "#quickStartWizard" ).dialog( "open" );
}

function requestSimulation(args){
	sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Simulating...");
	
	setTimeout(function(){
		goBattleSim(args);
		sendFeedback(currentJobSize + " sims have been performed", true);
		setTimeout(function(){
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
			document.getElementById('ui-mastersummarytable').scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
		}, 100);
	}, 100);
}

function goBattleSim(args){
	var userInput = readUserInput();
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfigToUrl(userInput));
	
	initMasterSummaryTableMetrics();
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations started");
	
	
	var tempResults = iterBranch(userInput, [0,0,0,0,0]);
	tempResults.forEach(function(sim){
		if (sim)
			simResults.push(sim);
	});
	
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations completed");
	
	if (args && args.sortBy){
		simResults.sort(function(a,b){
			return b.output.generalStat[args.sortBy] - a.output.generalStat[args.sortBy];
		});
	}

	displayMasterSummaryTable();
}