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

var attributesEnumeration = [
	{
		name: "name",
		matcher: x => getEntryIndex(x, Data.Pokemon),
		database: a => getPokemonOptions(true),
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
		matcher: x => getEntryIndex(x, Data.FastMoves),
		database: a => Data.FastMoves,
		default: "current, legacy, exclusive"
	},{
		name: "cmove",
		matcher: x => getEntryIndex(x, Data.ChargedMoves),
		database: a => Data.ChargedMoves,
		default: "current, legacy, exclusive"
	}
];
				
function batchSim(cfg, start){
	for (var i = start[0]; i < cfg.players.length; i++){
		let player = cfg.players[i];
		for (var j = start[1]; j < player.parties.length; j++){
			let party = player.parties[j];
			for (var k = start[2]; k < party.pokemon.length; k++){
				let pokemon = party.pokemon[k];
				let pokemonInstance = getEntry(pokemon.name.trim().toLowerCase(), Data.Pokemon);
				for (var m = start[3]; m < attributesEnumeration.length; m++){
					let attr = attributesEnumeration[m];
					let database = attr.database([i, j, k, m]);
					let expression = (pokemon[attr.name] || attr.default).toString().toLowerCase();
					if (attr.matcher(expression) >= 0){
						continue;
					}
					if (expression[0] == '='){ // Dynamic Paster
						try{
							var pokemonSrc = getPokemonConfig(cfg, expression.slice(1));
							pokemon[attr.name] = pokemonSrc[attr.name];
							continue;
						}catch(err){
							sendFeedback((i+1) + "-" + (j+1) + "-" + (k+1) + '.' + attr.name + ": Invalid Dynamic Paster", true);
							return [];
						}
					}else{ // Logical Expression
						let branches = [];
						let selector = expression[0];
						if (SELECTORS.includes(selector)){
							expression = expression.slice(1).trim() || attr.default;
						}
						let matches = database.filter(Predicate(expression, pokemonInstance, attr.name));
						if (matches.length == 0){
							return [];
						}
						if (selector != '?'){
							createNewMetric('*' + (i+1) + "-" + (j+1) + "-" + (k+1) + '.' + attr.name);
						}
						for (let match of matches){
							let cfg_copy = JSON.parse(JSON.stringify(cfg));
							pokemon = cfg_copy.players[i].parties[j].pokemon[k];
							pokemon[attr.name] = match.name;
							if (attr.name == "name" && match.uid){
								for (let a of ["level", "atkiv", "defiv", "stmiv", "fmove", "cmove"]){
									pokemon[a] = (pokemon[a] || match[a]).toString().replace("#", match[a]);
									if (selector != '?'){
										createNewMetric('*' + (i+1) + "-" + (j+1) + "-" + (k+1) + '.' + a);
									}
								}
							}
							branches = branches.concat(batchSim(cfg_copy, [i, j, k, m+1]));
						}
						if (selector == '?'){ // Forced prouping	
							branches = [branches];
						}
						return branches;
					}	
				}
				start[3] = 0;
			}
			start[2] = 0;
		}
		start[1] = 0;
	}
	return [cfg];
}

// Simulate a specific configuration
function runSimulation(cfg){
	var world = new World(cfg);
	let simPerConfig = parseInt(cfg.simPerConfig) || 1;
	let simulations = [];
	for (var i = 0; i < simPerConfig; i++){
		world.init();
		world.battle();
		simulations.push({
			input: cfg,
			output: world.getStatistics()
		});
	}
	currentJobSize += simPerConfig;
	if (cfg.aggregation == "avrg"){
		simulations = [averageSimulations(simulations)];
	}
	return simulations;
}


function averageSimulations(sims){
	var avrgOutput = JSON.parse(JSON.stringify(sims[0].output));
	var numSims = sims.length, numPlayer = avrgOutput.playerStats.length;
	avrgOutput.battleLog = [];
	
	// These are the metrics to sum and average
	var generalStat_attrs = ['duration', 'tdo_percent', 'tdo', 'numOfDeaths'];
	var playerStats_attrs = ['tdo', 'tdo_percentage', 'num_rejoin'];
	var pokemonStats_attrs = [];
	for (var attr in avrgOutput.pokemonStats[0][0][0]){
		if (attr != "name" && attr != "dps")
			pokemonStats_attrs.push(attr);
	}
	
	// 1. Initialize everything to 0
	avrgOutput['generalStat']['battle_result'] = 0;
	generalStat_attrs.forEach(function(attr){ avrgOutput.generalStat[attr] = 0; });
	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){ avrgOutput.playerStats[j][attr] = 0; });
	}
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < avrgOutput.pokemonStats[j].length; k++){
			for (var p = 0; p < avrgOutput.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){ avrgOutput.pokemonStats[j][k][p][attr] = 0; });
			}
		}
	}
	
	// 2. Sum them up
	for (var i = 0; i < numSims; i++){
		var out = sims[i].output;
		// generalStat
		if (out.generalStat.battle_result == 'Win')
			avrgOutput.generalStat.battle_result++;
		generalStat_attrs.forEach(function(attr){ avrgOutput.generalStat[attr] += out.generalStat[attr]; });
		// playerStats
		for (var j = 0; j < numPlayer; j++){
			playerStats_attrs.forEach(function(attr){ avrgOutput.playerStats[j][attr] += out.playerStats[j][attr]; });
		}
		// pokemonStats
		for (var j = 0; j < numPlayer; j++){
			for (var k = 0; k < out.pokemonStats[j].length; k++){
				for (var p = 0; p < out.pokemonStats[j][k].length; p++){
					pokemonStats_attrs.forEach(function(attr){avrgOutput.pokemonStats[j][k][p][attr] += out.pokemonStats[j][k][p][attr];});
				}
			}
		}
	}
	
	// 3. Divide and get the results
	avrgOutput.generalStat.battle_result = round(avrgOutput.generalStat.battle_result/numSims*100, 2) + "%";
	avrgOutput.generalStat.dps = round(avrgOutput.generalStat.tdo/avrgOutput.generalStat.duration, 2);
	generalStat_attrs.forEach(function(attr){
		avrgOutput.generalStat[attr] = round(avrgOutput.generalStat[attr]/numSims, 2);
	});
	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){
			avrgOutput.playerStats[j][attr] = round(avrgOutput.playerStats[j][attr]/numSims, 2);
		});
	}
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < avrgOutput.pokemonStats[j].length; k++){
			for (var p = 0; p < avrgOutput.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){
					avrgOutput.pokemonStats[j][k][p][attr] = round(avrgOutput.pokemonStats[j][k][p][attr]/numSims, 2);
				});
				avrgOutput.pokemonStats[j][k][p].dps = round(avrgOutput.pokemonStats[j][k][p].tdo/avrgOutput.pokemonStats[j][k][p].duration, 2);
			}
		}
	}
	
	return {
		input: sims[0].input,
		output: avrgOutput
	};
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


function processConfig(config){
	if (config.hasOwnProperty("length")){
		var sims = [];
		for (let subConfig of config){
			sims = sims.concat(processConfig(subConfig));
		}
		return [averageSimulations(sims)];
	}else{
		return runSimulation(config);
	}
}


function GoBattleSim(){
	var userInput = read();
	
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfig(userInput));
	userInput.hasLog = true;
	
	initMasterSummaryTableMetrics();
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations started");
	
	var configurations = batchSim(userInput, [0,0,0,0]);
	for (let config of configurations){
		simResults = simResults.concat(processConfig(config));
	}
	
	date = new Date();
	console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds()  + ": Simulations completed");

	displayMasterSummaryTable();
}


function applicationInit(){
	var playersNode = $$$(document.getElementById("input")).child("input-players").node;
	$(playersNode).sortable({axis: 'y'});
	addPlayerNode();
	addPlayerNode();
	write(playersNode.children[1], {team: "1", parties: [{pokemon: [{role: "rb"}]}]});

	if (window.location.href.includes('?')){
		write(document.getElementById("input"), importConfig(window.location.href));
	}

	formatting(playersNode);
	relabel();
}