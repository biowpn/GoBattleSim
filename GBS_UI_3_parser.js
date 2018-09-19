/* GBS_UI_3_parser.js */


function initMasterSummaryTableMetrics(){
	currentJobSize = 0;
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics[metric] = nameDisplayed || metric;
}

function getPokemonConfig(cfg, address){
	var arr = address.split('-');
	var i = parseInt(arr[0])-1, j = parseInt(arr[1])-1, k = parseInt(arr[2])-1; // indices start from 1 in address
	return cfg.players[i].parties[j].pokemon[k];
}


function batchSim(cfg, start){
	for (var i = start[0]; i < cfg.players.length; i++){
		let player = cfg.players[i];
		for (var j = start[1]; j < player.parties.length; j++){
			let party = player.parties[j];
			for (var k = start[2]; k < party.pokemon.length; k++){
				let pokemon = party.pokemon[k];
				let address = (i+1) + "-" + (j+1) + "-" + (k+1);
				let pokemonInstance;
				if (pokemon.box_index >= 0){
					pokemonInstance = Data.Users[i % Data.Users.length].box[pokemon.box_index];
				}else{
					pokemonInstance = getEntry(pokemon.name.trim().toLowerCase(), Data.Pokemon);
				}
				
				var attributesEnumeration = [
					{
						name: "name",
						matcher: x => getEntryIndex(x, Data.Pokemon),
						database: a => getPokemonOptions(parseInt(a[0]) - 1),
						default: "latios"
					},{
						name: "level",
						matcher: parseFloat,
						database: a => Data.LevelSettings,
						default: "40"
					},{
						name: "atkiv",
						matcher: parseInt,
						database: a => Data.IndividualValues,
						default: "15"
					},{
						name: "defiv",
						matcher: parseInt,
						database: a => Data.IndividualValues,
						default: "15"
					},{
						name: "stmiv",
						matcher: parseInt,
						database: a => Data.IndividualValues,
						default: "15"
					},{
						name: "fmove",
						matcher: getEntryIndex,
						database: a => Data.FastMoves,
						default: "current, legacy, exclusive"
					},{
						name: "cmove",
						matcher: getEntryIndex,
						database: a => Data.ChargedMoves,
						default: "current, legacy, exclusive"
					}
				];
				
				for (var m = start[3]; m < attributesEnumeration.length; m++){
					let attr = attributesEnumeration[m];
					let database = attr.database([i, j, k, m]);
					let expression = (pokemon[attr.name] || attr.default).toString().toLowerCase();
					if (attr.matcher(expression, database) >= 0){
						continue;
					}
					if (expression[0] == '='){// Dynamic Paster
						try{
							var pokemonSrc = getPokemonConfig(cfg, expression.slice(1));
							pokemon[attr.name] = pokemonSrc[attr.name];
							continue;
						}catch(err){
							sendFeedback(address + '.' + attr.name + ": Invalid Dynamic Paster", true);
							return [];
						}
					}else{ // Logical Expression
						let branches = [];
						let selector = expression[0];
						if (SELECTORS.includes(selector)){
							expression = expression.slice(1).trim();
						}
						expression = (expression || attr.default).toString();
						let matches = database.filter(Predicate(expression, pokemonInstance, attr.name));
						if (matches.length == 0){
							return [];
						}
						if (selector != '?'){
							createNewMetric('*' + address + '.' + attr.name);
						}
						for (let match of matches){
							let value_copy = pokemon[attr.name];
							pokemon[attr.name] = match.name;
							if (attr.name == "name" && match.box_index >= 0){
								pokemonInstance = Data.Users[i % Data.Users.length].box[pokemon.box_index];
								pokemon.level = pokemon.level || pokemonInstance.level;
								pokemon.atkiv = pokemon.atkiv || pokemonInstance.atkiv;
								pokemon.defiv = pokemon.defiv || pokemonInstance.defiv;
								pokemon.stmiv = pokemon.stmiv || pokemonInstance.stmiv;
								pokemon.fmove = pokemon.fmove || pokemonInstance.fmove;
								pokemon.cmove = pokemon.cmove || pokemonInstance.cmove;
							}
							branches = branches.concat(batchSim(cfg, [i, j, k, m+1]));
							cfg.players[i].parties[j].pokemon[k][attr.name] = value_copy;
						}
						if (selector == '?'){ // Averaging
							if (branches.length % matches.length == 0){
								let numSimsPerBranch = round(branches.length / matches.length);
								let branches2 = [];
								for (var p = 0; p < numSimsPerBranch; p++){
									let simsToAverage = [];
									for (var q = 0; q < matches.length; q++){
										simsToAverage.push(branches[p + q * numSimsPerBranch]);
									}
									branches2.push(averageSims(simsToAverage));
								}
								branches = branches2;
							}else{			
								branches = [averageSims(branches)];
							}
						}
						return branches;
					}	
				}
			}
		}
	}
	return runSim(JSON.parse(JSON.stringify(cfg)));
}

// Simulate a specific configuration
function runSim(cfg){
	var app_world = new World(cfg);
	let simPerConfig = parseInt(cfg.simPerConfig) || 1;
	let interResults = [];
	for (var i = 0; i < simPerConfig; i++){
		app_world.init();
		app_world.battle();
		interResults.push(app_world.getStatistics());
	}
	currentJobSize += simPerConfig;
	
	let sims = [];
	if (cfg.aggregation == "avrg"){
		sims = [{input: cfg, output: averageOutputs(interResults)}];
	}else if (cfg.aggregation == "enum"){
		for (let res of interResults){
			sims.push({input: cfg, output: res});
		}
	}
	return sims;
}


function averageOutputs(results){
	var avrgR = JSON.parse(JSON.stringify(results[0])), numResults = results.length, numPlayer = results[0].playerStats.length;
	
	// These are the metrics to sum and average
	var generalStat_attrs = ['duration', 'tdo_percent', 'tdo', 'numOfDeaths'];
	var playerStats_attrs = ['tdo', 'tdo_percentage', 'num_rejoin'];
	var pokemonStats_attrs = [], pokemonStats_attrs_excluded = ['name', 'dps'];
	for (var attr in avrgR.pokemonStats[0][0][0]){
		if (!pokemonStats_attrs_excluded.includes(attr))
			pokemonStats_attrs.push(attr);
	}
	
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
		// pokemonStats
		for (var j = 0; j < numPlayer; j++){
			for (var k = 0; k < result.pokemonStats[j].length; k++){
				for (var p = 0; p < result.pokemonStats[j][k].length; p++){
					pokemonStats_attrs.forEach(function(attr){avrgR.pokemonStats[j][k][p][attr] += result.pokemonStats[j][k][p][attr];});
				}
			}
		}
	}
	
	// 3. Divide and get the results
	avrgR.generalStat.battle_result = round(avrgR.generalStat.battle_result/numResults*100, 2) + "%";
	avrgR.generalStat.dps = round(avrgR.generalStat.tdo/avrgR.generalStat.duration, 2);
	generalStat_attrs.forEach(function(attr){
		avrgR.generalStat[attr] = round(avrgR.generalStat[attr]/numResults, 2);
	});
	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){
			avrgR.playerStats[j][attr] = round(avrgR.playerStats[j][attr]/numResults, 2);
		});
	}
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < result.pokemonStats[j].length; k++){
			for (var p = 0; p < result.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){
					avrgR.pokemonStats[j][k][p][attr] = round(avrgR.pokemonStats[j][k][p][attr]/numResults, 2);
				});
				avrgR.pokemonStats[j][k][p].dps = round(avrgR.pokemonStats[j][k][p].tdo/avrgR.pokemonStats[j][k][p].duration, 2);
			}
		}
	}
	
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
	var playersNode = $$$(document.getElementById("input")).child("input-players").node;
	$(playersNode).sortable({axis: 'y'});
	addPlayerNode();
	addPlayerNode();
	write(playersNode.children[1], {team: "1", parties: [{pokemon: [{role: "rb"}]}]});
	
	try{
		populateQuickStartWizardBossList('current');
	}catch{
	}

	if (window.location.href.includes('?')){
		write(document.getElementById("input"), parseConfigFromURL(window.location.href));
	}
	if (!LocalData.QuickStartWizardNoShow && !window.location.href.includes('?')){
		$( "#quickStartWizard" ).dialog( "open" );
	}
	formatting(playersNode);
	relabel();
}

function requestSimulation(){
	sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Simulating...");
	setTimeout(function(){
		try{
			GoBattleSim();
			sendFeedback(currentJobSize + " sims have been performed", true);
			setTimeout(function(){
				document.getElementById('ui-mastersummarytable').scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
			}, 100);
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
		}catch(err){
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
			sendFeedbackDialog("Oops, something went wrong!");
		}
	}, 100);
}

function GoBattleSim(){
	var userInput = read();
	
	// Pre-processing configuration
	for (let player of userInput.players){
		for (let party of player.parties){
			for (let pokemon of party.pokemon){
				if (pokemon.role == "rb"){
					delete pokemon.atkiv;
					delete pokemon.defiv;
					delete pokemon.stmiv;
					delete pokemon.level;
				}else{
					delete pokemon.raidTier;
				}
			}
		}
	}
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfigToURL(userInput));
	userInput.hasLog = true;
	
	initMasterSummaryTableMetrics();
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations started");
	
	simResults = simResults.concat(batchSim(userInput, [0,0,0,0]));
	
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations completed");

	displayMasterSummaryTable();
}