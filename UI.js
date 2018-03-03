
/* 
 * GLOBAL VARIABLES 
 */

// Storing user's Pokebox
var USER_POKEBOX = [];

// Pre-defined collections of Pokemon
var BEST_ATTACKERS_BY_TYPE_INDICES = [211, 247, 383, 242, 281, 67, 145, 243, 93, 102, 382, 143, 142, 88, 149, 75, 375, 381];
var TIER1_BOSSES_CURRENT_INDICES = [128, 319, 332, 360];
var TIER2_BOSSES_CURRENT_INDICES = [86, 90, 301, 302];
var TIER3_BOSSES_CURRENT_INDICES = [67, 123, 183, 220];
var TIER4_BOSSES_CURRENT_INDICES = [130, 142, 159, 247, 305, 358];
var TIER5_BOSSES_CURRENT_INDICES = [149, 383];

// To be populated dynamically
var RELEVANT_ATTACKERS_INDICES = [];
var POKEMON_BY_TYPE_INDICES = {};

// For auto complete
var POKEMON_SPECIES_OPTIONS = [];
var FAST_MOVES_OPTIONS = [];
var CHARGED_MOVE_OPTIONS = [];

const MAX_QUEUE_SIZE = 65536;
const MAX_SIM_PER_CONFIG = 1024;
const DEFAULT_SUMMARY_TABLE_METRICS = ['battle_result','duration','dfdr_HP_lost_percent','total_deaths'];
const DEFAULT_SUMMARY_TABLE_HEADERS = {'battle_result': 'Outcome',
										'duration': 'Time',
										'dfdr_HP_lost_percent': 'Progress',
										'total_deaths': '#Death'};

var totalAtkrTeamCount = 0;
var simQueue = []; // Batch individual sims configurations here
var simResults = []; // This is used to store all sims
var simResultsFiltered = []; // This is used to store filted sims
var atkrCopyPasteClipboard = null;

var MaxResultsPerPage = 30;
var pageStart = 0;
var pageNumber = 1;
var pageNumberMax = 1;

var enumTeamStart = 0;
var enumPokemonStart = 0;
var enumDefender = 0;
var MasterSummaryTableMetrics = [];
var MasterSummaryTableHeaders = {};
var MasterSummaryTableMetricsIncluded = {};
var MasterSummaryTableMetricsSorted = {};
var MasterSummaryTableMetricsFilter = {};
var MasterSummaryTableMetricsFilterOrder = [];
var MasterSummaryTableMetricsValues = {};




/* 
 * UI CORE FUNCTIONS 
 */

function initMasterSummaryTableMetrics(){
	MasterSummaryTableMetrics = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_METRICS));
	MasterSummaryTableHeaders = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_HEADERS));
	MasterSummaryTableMetricsIncluded = {};
	MasterSummaryTableMetricsSorted = {};
	MasterSummaryTableMetricsFilter = {};
	MasterSummaryTableMetricsValues = {};
	
	MasterSummaryTableMetrics.forEach(function(m){
		MasterSummaryTableMetricsIncluded[m] = true;
		MasterSummaryTableMetricsSorted[m] = 0;
		MasterSummaryTableMetricsFilter[m] = '*';
		MasterSummaryTableMetricsValues[m] = new Set();
	});
}

function createElement(type, innerHTML){
	var e = document.createElement(type);
	e.innerHTML = innerHTML;
	return e;
}

function createRow(rowData, type){
	type = type || "td";
	var row = document.createElement("tr");
	for (var i = 0; i < rowData.length; i++){
		var d = document.createElement(type);
		d.innerHTML = rowData[i];
		row.appendChild(d);
	}
	return row;
}

function createAttackerInputTemplate(i, j){
	var pkm = document.createElement("div");

	var row1 = document.createElement("tr");
	var row2 = document.createElement("tr");
	var row3 = document.createElement("tr");
	
	var tb1 = createElement("table", "<col width=50%><col width=20%><col width=6%><col width=6%><col width=6%><col width=6%><col width=6%>");
	row1.appendChild(createElement('td',"<input type='text' placeholder='Species' id='ui-species-"+i+'-'+j+"'>"));
	row1.appendChild(createElement('td',"<input type='number' placeholder='Copies' min='1' max='6'>"));
	row1.appendChild(createElement('td',"<a></a>"));
	row1.appendChild(createElement('td',"<a></a>"));
	row1.appendChild(createElement('td',"<a></a>"));
	row1.appendChild(createElement('td',"<a></a>"));
	row1.appendChild(createElement('td',"<a></a>"));
	tb1.appendChild(row1);
	
	var tb2 = createElement("table", "<col width=25%><col width=25%><col width=25%><col width=25%>");
	row2.appendChild(createElement('td',"<input type='number' placeholder='Level' min='1' max='40'>"));
	row2.appendChild(createElement('td',"<input type='number' placeholder='HP. IV' min='0' max='15'>"));
	row2.appendChild(createElement('td',"<input type='number' placeholder='Atk. IV' min='0' max='15'>"));
	row2.appendChild(createElement('td',"<input type='number' placeholder='Def. IV' min='0' max='15'>"));
	tb2.appendChild(row2);

	var tb3 = createElement("table", "<col width=35%><col width=35%><col width=30%>");
	row3.appendChild(createElement('td',"<input type='text' placeholder='Fast Move' id='ui-fmove-"+i+'-'+j+"'>"));
	row3.appendChild(createElement('td',"<input type='text' placeholder='Charged Move' id='ui-cmove-"+i+'-'+j+"'>"));
	row3.appendChild(createElement('td',"<select><option value='0'>No Dodge</option><option value='1'>Dodge Charged</option><option value='2'>Dodge All</option></select></td>"));
	tb3.appendChild(row3);
	
	pkm.appendChild(tb1);
	pkm.appendChild(tb2);
	pkm.appendChild(tb3);
	return pkm;
}

function createTeamButtonTable(i){
	const iii = i;
	var tb = createElement("table","<col width=50%><col width=50%>");
	var row = createElement("tr","<td></td><td></td>");
	var b1 = createElement("button", "Add Pokemon");
	var b2 = createElement("button", "Remove Team");
	b1.addEventListener("click", function(){addPokemon(iii);});
	b2.addEventListener("click", function(){removeTeam(iii);});
	row.children[0].appendChild(b1);
	row.children[1].appendChild(b2);
	tb.appendChild(row);
	return tb;
}

function setDefenderInput(){

	var mode = document.getElementById("battleMode").value;
	var dfdrSection = document.getElementById("DefenderInput");
	var tb1 = createElement("table", "<col width=100%>");
	var tb2 = createElement("table", "");
	var tb3 = createElement("table", "<col width=50%><col width=50%>");
	var row1 = createElement("tr","");
	var row2 = createElement("tr","");
	var row3 = createElement("tr","");
	
	if (dfdrSection.children.length > 0){
		tb1 = dfdrSection.children[0];
		tb3 = dfdrSection.children[2];
	}else{
		row1.appendChild(createElement('td',"<input type='text' placeholder='Species' id='ui-species-d'>"));
		tb1.appendChild(row1);
		row3.appendChild(createElement('td',"<input type='text' placeholder='Fast Move' id='ui-fmove-d'>"));
		row3.appendChild(createElement('td',"<input type='text' placeholder='Charged Move' id='ui-cmove-d'>"));
		tb3.appendChild(row3);
	}

	if (mode=="gym"){
		tb2.innerHTML = "<col width=25%><col width=25%><col width=25%><col width=25%>";
		row2.appendChild(createElement("td","<input type='number' placeholder='Level'>"));
		row2.appendChild(createElement("td","<input type='number' placeholder='HP. IV'>"));
		row2.appendChild(createElement("td","<input type='number' placeholder='Atk. IV'>"));
		row2.appendChild(createElement("td","<input type='number' placeholder='Def. IV'>"));
	}else if (mode == "raid"){
		tb2.innerHTML = "<col width=100%>";
		row2.appendChild(createElement("td","Raid Tier:"));
		var raidSelection = document.createElement("select");
		raidSelection.id = "raidTier";
		for (var i = 1; i <= 5; i++){
			var option = createElement("option", i);
			option.value = i;
			raidSelection.appendChild(option);
		}
		row2.children[0].appendChild(raidSelection);
	}
	tb2.appendChild(row2);
	
	dfdrSection.innerHTML = "";
	dfdrSection.appendChild(tb1);
	dfdrSection.appendChild(tb2);
	dfdrSection.appendChild(tb3);
	
	$( '#ui-species-d' ).autocomplete({
		delay : 0,
		source : POKEMON_SPECIES_OPTIONS,
		change : function(event, ui) {
			if (this.value[0] == '$' && USER_POKEBOX.length > 0){
				var idx = parseInt(this.value.slice(1).split(' ')[0]);
				writeDefenderInput(document.getElementById("DefenderInput"), USER_POKEBOX[idx]);
			}
		}
	});
	
	$( '#ui-fmove-d' ).autocomplete({
		delay : 0,
		source: FAST_MOVES_OPTIONS
	});
	
	$( '#ui-cmove-d' ).autocomplete({
		delay : 0,
		source: CHARGED_MOVE_OPTIONS
	});
	
	
}

function parseAttackerInput(section){
	var row1 = section.children[0].children[1];
	var row2 = section.children[1].children[1];
	var row3 = section.children[2].children[1];
	
	var box_idx = -1;
	var nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$')
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
	
	var pkm = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		nickname : box_idx >= 0 ? USER_POKEBOX[box_idx].nickname : null,
		species: box_idx >= 0 ? USER_POKEBOX[box_idx].species : nameInputValue,
		copies: row1.children[1].children[0].valueAsNumber || 1,
		level: Math.max(1, Math.min(40,row2.children[0].children[0].valueAsNumber)),
		stmiv: Math.max(0, Math.min(15,row2.children[1].children[0].valueAsNumber)),
		atkiv: Math.max(0, Math.min(15,row2.children[2].children[0].valueAsNumber)),
		defiv: Math.max(0, Math.min(15,row2.children[3].children[0].valueAsNumber)),
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim(),
		dodge: row3.children[2].children[0].value,
		raid_tier : 0
	};
	return pkm;
}

function parseDefenderInput(section){
	var row1 = section.children[0].children[1];
	var row2 = section.children[1].children[1];
	var row3 = section.children[2].children[1];
	
	var box_idx = -1;
	var nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$')
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
	
	var pkm = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		team_idx : -1,
		nickname : box_idx >= 0 ? USER_POKEBOX[box_idx].nickname : null,
		species: box_idx >= 0 ? USER_POKEBOX[box_idx].species : nameInputValue,
		level : 1,
		atkiv : 0,
		defiv : 0,
		stmiv : 0,
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim()
	};
	if (document.getElementById("battleMode").value == "gym"){
		pkm['level'] = Math.max(1, Math.min(40,row2.children[0].children[0].valueAsNumber));
		pkm['stmiv'] = Math.max(0, Math.min(15,row2.children[1].children[0].valueAsNumber));
		pkm['atkiv'] = Math.max(0, Math.min(15,row2.children[2].children[0].valueAsNumber));
		pkm['defiv'] = Math.max(0, Math.min(15,row2.children[3].children[0].valueAsNumber));
		pkm['raid_tier'] = -1;
	}else if (document.getElementById("battleMode").value == "raid"){
		pkm['raid_tier'] = parseInt(document.getElementById("raidTier").value);
	}
	return pkm;
}

function writeAttackerInput(section, pkm){
	var row1 = section.children[0].children[1];
	var row2 = section.children[1].children[1];
	var row3 = section.children[2].children[1];
	
	if (pkm.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkm.box_index + ' ' + pkm.nickname + ' (' + pkm.species +')';
	else
		row1.children[0].children[0].value = pkm.species;
	
	row1.children[1].children[0].value = pkm.copies;
	row2.children[0].children[0].value = pkm.level;
	row2.children[1].children[0].value = pkm.stmiv;
	row2.children[2].children[0].value = pkm.atkiv;
	row2.children[3].children[0].value = pkm.defiv;
	row3.children[0].children[0].value = pkm.fmove;
	row3.children[1].children[0].value = pkm.cmove;
	row3.children[2].children[0].value = pkm.dodge;
}

function writeDefenderInput(section, pkm){
	var row1 = section.children[0].children[1];
	var row2 = section.children[1].children[1];
	var row3 = section.children[2].children[1];
	
	if (pkm.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkm.box_index + ' ' + pkm.nickname + ' (' + pkm.species +')';
	else
		row1.children[0].children[0].value = pkm['species'];
	
	row3.children[0].children[0].value = pkm['fmove'];
	row3.children[1].children[0].value = pkm['cmove'];
	if (document.getElementById("battleMode").value == "gym"){
		row2.children[0].children[0].value = pkm['level'];
		row2.children[1].children[0].value = pkm['stmiv'];
		row2.children[2].children[0].value = pkm['atkiv'];
		row2.children[3].children[0].value = pkm['defiv'];
	}else if (document.getElementById("battleMode").value ==  "raid"){
		document.getElementById("raidTier").value = pkm['raid_tier'];
	}
}

function readUserInput(){
	var gSettings = {};
	if (document.getElementById("battleMode").value == "raid")
		gSettings['raidTier'] = (parseInt(document.getElementById("raidTier").value));
	else if (document.getElementById("battleMode").value == "gym")
		gSettings['raidTier'] = -1;
	gSettings['weather'] = document.getElementById("weather").value;
	gSettings['dodgeBug'] = parseInt(document.getElementById("dodgeBug").value);
	gSettings['simPerConfig'] = Math.max(1, Math.min(MAX_SIM_PER_CONFIG, document.getElementById("simPerConfig").valueAsNumber));
	gSettings['reportType'] = document.getElementById("reportType").value;
	if (gSettings['reportType'] == 'avrg')
		gSettings['logStyle'] = 0;
	else if (totalAtkrTeamCount > 3)
		gSettings['logStyle'] = 1;
	else
		gSettings['logStyle'] = 2;
	
	var atkr_parties = [];
	var attackerSections = document.getElementById("AttackerInput").children;
	for (var i = 0; i < attackerSections.length; i++){
		atkr_parties.push([]);
		var sec = attackerSections[i];
		for (var j = 1; j < sec.children.length - 1; j++)
			atkr_parties[i].push(parseAttackerInput(sec.children[j]));
	}
	
	var defenderSection = document.getElementById("DefenderInput");
	var dfdr_info = parseDefenderInput(defenderSection);
	return {generalSettings : gSettings,
			atkrSettings : atkr_parties,
			dfdrSettings : dfdr_info,
			enumeratedValues : {}
			};
}

function copyAllInfo(pkm_to, pkm_from){
	pkm_to.nickname = pkm_from.nickname;
	pkm_to.box_index = pkm_from.box_index;
	pkm_to.species = pkm_from.species;
	pkm_to.index = get_species_index_by_name(pkm_from.species);
	pkm_to.level = pkm_from.level;
	pkm_to.atkiv = pkm_from.atkiv;
	pkm_to.defiv = pkm_from.defiv;
	pkm_to.stmiv = pkm_from.stmiv;
	pkm_to.fmove = pkm_from.fmove;
	pkm_to.fmove_index = get_fmove_index_by_name(pkm_to.fmove);
	pkm_to.cmove = pkm_from.cmove;
	pkm_to.cmove_index = get_cmove_index_by_name(pkm_to.cmove);
}

function repositionAllPokemon(start, end){
	var teams = document.getElementById("AttackerInput");
	start = start || 0;
	end = end || teams.children.length;
	for (var i = start; i < end; i++){
		const iii = i;
		var team = teams.children[i];
		team.children[0].innerHTML = "Team " + (i+1);
		for (var j = 1; j < team.children.length - 1; j++){
			const jjj = j;
			var symsbolsAndFunctions = [["&larr;", function(){pastePokemon(iii, jjj);}],
										["&rarr;", function(){copyPokemon(iii, jjj);}],		
										["&uarr;", function(){movePokemonUp(iii, jjj);}],
										["&darr;", function(){movePokemonDown(iii, jjj);}],
										["&#10006;", function(){removePokemon(iii, jjj);}]];
			for (var k = 0; k < symsbolsAndFunctions.length; k++){
				var td = team.children[j].children[0].children[1].children[k+2];
				var b = createElement("a", symsbolsAndFunctions[k][0]);
				b.addEventListener("click", symsbolsAndFunctions[k][1]);
				td.removeChild(td.children[0]);
				td.appendChild(b);
			}
		}
		team.removeChild(team.children[team.children.length - 1]);
		team.appendChild(createTeamButtonTable(i));
	}
}

function addPokemon(i){
	var team = document.getElementById("AttackerInput").children[i];
	team.removeChild(team.children[team.children.length - 1]);
	
	const ii = i, jj = team.children.length;
	team.appendChild(createAttackerInputTemplate(ii, jj));
	
	$( '#ui-species-'+ii+'-'+jj ).autocomplete({
		delay : 0,
		source: POKEMON_SPECIES_OPTIONS,
		change : function(event, ui) {
			if (this.value[0] == '$' && USER_POKEBOX.length > 0){
				var idx = parseInt(this.value.slice(1).split(' ')[0]);
				writeAttackerInput(document.getElementById("AttackerInput").children[ii].children[jj], USER_POKEBOX[idx]);
			}
		}
	});
	
	$( '#ui-fmove-'+ii+'-'+jj ).autocomplete({
		delay : 0,
		source: FAST_MOVES_OPTIONS
	});
	
	$( '#ui-cmove-'+ii+'-'+jj ).autocomplete({
		delay : 0,
		source: CHARGED_MOVE_OPTIONS
	});
	
	
	team.appendChild(createElement("div",""));
	repositionAllPokemon(i, i+1);
}

function removePokemon(i, j){
	var team = document.getElementById("AttackerInput").children[i];
	if (team.children.length > 3){
		team.removeChild(team.children[j]);
		repositionAllPokemon(i, i+1);
	}else
		send_feedback("Can't remove the only attacker in the team. Use Remove Team instead");
}

function swapChildren(parent, i1, i2){
	var children = [];
	while (parent.children.length > 0){
		children.push(parent.children[0]);
		parent.removeChild(parent.children[0]);
	}
	var intermediate = children[i1];
	children[i1] = children[i2];
	children[i2] = intermediate;
	for (var k = 0; k < children.length; k++)
		parent.appendChild(children[k]);
}

function movePokemonUp(i, j){
	var team = document.getElementById("AttackerInput").children[i];
	if (j > 1){
		swapChildren(team, j, j - 1);
		repositionAllPokemon(i, i + 1);
	}
}

function movePokemonDown(i, j){
	var team = document.getElementById("AttackerInput").children[i];
	if (j < team.children.length - 2){
		swapChildren(team, j, j + 1);
		repositionAllPokemon(i, i + 1);
	}
}

function copyPokemon(i, j){
	var pkmSection = document.getElementById("AttackerInput").children[i].children[j];
	atkrCopyPasteClipboard = parseAttackerInput(pkmSection);
}

function pastePokemon(i, j){
	if (atkrCopyPasteClipboard){
		var pkmSection = document.getElementById("AttackerInput").children[i].children[j];
		writeAttackerInput(pkmSection, atkrCopyPasteClipboard);
	}
}

function addTeam(){
	if (totalAtkrTeamCount < MAX_NUM_OF_PLAYERS){
		var teams = document.getElementById("AttackerInput");
		var newTeam = document.createElement("div");
		newTeam.appendChild(createElement("h3","Team" + (totalAtkrTeamCount+1)));
		// newTeam.appendChild(createAttackerInputTemplate(totalAtkrTeamCount, 1));
		newTeam.appendChild(createElement("div",""));
		teams.appendChild(newTeam);
		addPokemon(totalAtkrTeamCount);
		
		totalAtkrTeamCount++;
		repositionAllPokemon(totalAtkrTeamCount - 1);
	}else{
		send_feedback("exceeding maximum parties allowed");
	}
}

function removeTeam(i){
	if (totalAtkrTeamCount >= 2){
		var teams = document.getElementById("AttackerInput");
		teams.removeChild(teams.children[i]);
		totalAtkrTeamCount--;
		repositionAllPokemon(i);
	}
	else
		send_feedback("Can't remove the only team");
}


function writeUserInput(cfg){
	document.getElementById("battleMode").value = (cfg['generalSettings']['raidTier'] == -1) ? "gym" : "raid";
	document.getElementById("weather").value = cfg['generalSettings']['weather'];
	document.getElementById("dodgeBug").value = cfg['generalSettings']['dodgeBug'];
	document.getElementById("simPerConfig").value = cfg['generalSettings']['simPerConfig'];
	document.getElementById("reportType").value = cfg['generalSettings']['reportType'];
	
	var attackerSections = document.getElementById("AttackerInput");
	while (attackerSections.children.length > 0)
		attackerSections.removeChild(attackerSections.children[attackerSections.children.length - 1]);
	totalAtkrTeamCount = 0;
	
	for (var i = 0; i < cfg['atkrSettings'].length; i++){
		addTeam();
		for (var j = 0; j < cfg['atkrSettings'][i].length; j++){
			if (j >= 1)
				addPokemon(i);
			writeAttackerInput(attackerSections.children[i].children[j+1], cfg['atkrSettings'][i][j]);
		}
	}
		
	setDefenderInput();
	var defenderSection = document.getElementById("DefenderInput");
	writeDefenderInput(defenderSection, cfg['dfdrSettings']);
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics.push(metric);
	MasterSummaryTableMetricsIncluded[metric] = false;
	MasterSummaryTableMetricsSorted[metric] = 0;
	MasterSummaryTableMetricsFilter[metric] = '*';
	MasterSummaryTableMetricsValues[metric] = new Set();
	MasterSummaryTableHeaders[metric] = nameDisplayed || metric;
}

function sortByDeepAttr(data, attrs, reversed){
	data.sort(function(a, b){
		for (var i = 0; i < attrs.length; i++){
			a = a[attrs[i]];
			b = b[attrs[i]];
		}
		return ((a == b) ? 0 : (a < b ? -1 : 1)) * reversed;
	});
}

function filterAllSimsBy(filter){
	filter = filter || MasterSummaryTableMetricsFilter;
	
	simResultsFiltered = [];
	var simSelectedByMetric = {};
	for (var j = 0; j < MasterSummaryTableMetrics.length; j++){
		simSelectedByMetric[MasterSummaryTableMetrics[j]] = [];
	}
	for (var i = 0; i < simResults.length; i++){
		var sim = simResults[i];
		var simMetricAndValues = {};
		sim.included = true;
		for (var j = 0; j < MasterSummaryTableMetrics.length; j++){
			var metric = MasterSummaryTableMetrics[j];
			var thisValue = (metric[0] == '*') ? sim.input.enumeratedValues[metric] : sim.output.generalStat[metric];
			var filter = MasterSummaryTableMetricsFilter[metric];
			simMetricAndValues[metric] = thisValue;
			if (filter == '*')
				continue;
			else if (filter == '*first'){
				if (simSelectedByMetric[metric].includes(thisValue)){
					sim.included = false;
					break;
				}
			}
			else if (filter != thisValue){
				sim.included = false;
				break;
			}
		}
		if (sim.included){
			simResultsFiltered.push(sim);
			MasterSummaryTableMetrics.forEach(function(metric){
				MasterSummaryTableMetricsValues[metric].add(simMetricAndValues[metric]);		
				var filter = MasterSummaryTableMetricsFilter[metric];
				if (filter == '*first'){
					var thisValue = (metric[0] == '*') ? sim.input.enumeratedValues[metric] : sim.output.generalStat[metric];
					simSelectedByMetric[metric].push(thisValue);
				}
			});
		}
	}
	pageNumber = 1;
	pageNumberMax = Math.max(Math.ceil((simResultsFiltered.length-1)/MaxResultsPerPage), 1);
	pageStart = 0;
}

function sortAllSimsBy(attr){
	if (MasterSummaryTableMetricsSorted[attr] == 0)
		MasterSummaryTableMetricsSorted[attr] = 1;
	if (attr[0] == '*')
		sortByDeepAttr(simResults, ['input', 'enumeratedValues', attr], MasterSummaryTableMetricsSorted[attr]);
	else
		sortByDeepAttr(simResults, ['output', 'generalStat', attr], MasterSummaryTableMetricsSorted[attr]);
	MasterSummaryTableMetricsSorted[attr] *= -1;
}

function clearAllSims(){
	simResults = [];
	simResultsFiltered = [];
	pageStart = 0;
	pageNumber = 1;
	pageNumberMax = 1;
	displayMasterSummaryTable();
}

function createMasterSummaryTable(){
	var table = document.createElement("table");

	var selectedMetrics = [], selectedHeaders = [], selectedSortedFunctions = [];
	for (var i = 0; i < MasterSummaryTableMetrics.length; i++){
		const metric = MasterSummaryTableMetrics[i];
		if (MasterSummaryTableMetricsIncluded[metric]){
			selectedMetrics.push(metric);
			selectedHeaders.push(MasterSummaryTableHeaders[metric]);
			selectedSortedFunctions.push(function(){
				sortAllSimsBy(metric);
				filterAllSimsBy();
				displayMasterSummaryTable();
			});
		}
	}
	var headers = createRow(selectedHeaders.concat(["Details"]),"th");
	for (var i = 0; i < headers.children.length - 1; i++){
		headers.children[i].onclick = selectedSortedFunctions[i];
	}
	table.appendChild(headers);
	var resultCountCurrentPage = 0;
	for (var i = pageStart; i < simResultsFiltered.length && resultCountCurrentPage < MaxResultsPerPage; i++){
		var sim = simResultsFiltered[i];
		if (sim.included){
			var row = [];
			for (var j = 0; j < selectedMetrics.length; j++){
				const m = selectedMetrics[j];
				const v = (m[0] == '*') ? sim.input.enumeratedValues[m] : sim.output.generalStat[m];
				row.push(v || '');
			}
			row.push("<a onclick='displayDetail("+i+")'>Detail</a>");
			table.appendChild(createRow(row, "td"));
			resultCountCurrentPage++;
		}
	}
	return table;
}

function createTeamStatisticsTable(simRes){
	var table = document.createElement("table");
	table.appendChild(createRow(["Team#","TDO","TDO%","#Rejoin","#Deaths"],"th"));
	for (var i = 0; i < simRes.output.teamStat.length; i++){
		var ts = simRes.output.teamStat[i];
		table.appendChild(createRow([ts.team, ts.tdo, ts.tdo_percentage, ts.num_rejoin, ts.total_deaths],"td"));
	}
	return table;
}

function createPokemonStatisticsTable(simRes){
	var table = document.createElement("table");
	table.appendChild(createRow(["Team#",
								"<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>",
								"HP",
								"Energy",
								"TDO",
								"Duration",
								"DPS",
								"TEW"],"th"));
	for (var i = 0; i < simRes.output.pokemonStat.length; i++){
		var ps = simRes.output.pokemonStat[i];
		table.appendChild(createRow([ps.team, ps.img, ps.hp, ps.energy, ps.tdo, ps.duration, ps.dps, ps.tew],"td"));
	}
	return table;
}

function createBattleLogTable(simRes){
	var table = document.createElement("table");
	var log = simRes.output.battleLog;
	if (simRes.input.generalSettings.logStyle == 1){
		var headers = ["Time",
					"Team#",
					"<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>",
					"Action",
					"Defender"];
		table.appendChild(createRow(headers, "th"));
		
		for (var i = 0; i < log.length; i++){
			table.appendChild(createRow(log[i]), "td");
		}
	}else if (simRes.input.generalSettings.logStyle == 2){
		var headers = ["Time"];
		for (var i = 1; i <= totalAtkrTeamCount; i++)
			headers.push("Team"+i);
		headers.push("Defender");
		table.appendChild(createRow(headers, "th"));
		
		for (var i = 0; i < log.length; i++){
			table.appendChild(createRow(log[i]), "td");
		}
	}
	return table;
}


function enqueueSim(cfg){
	if (simQueue.length < MAX_QUEUE_SIZE){
		var cfg_copy = JSON.parse(JSON.stringify(cfg));
		simQueue.push(cfg_copy);
	}else
		send_feedback("Too many sims to unpack. Try to use less enumerators");
}

function unpackSpeciesKeyword(str){
	str = str.trim().toLowerCase();
	if (str == '' || str == 'rlvt')
		return RELEVANT_ATTACKERS_INDICES;
	else if (str[0] == '{' && str[str.length - 1] == '}'){
		var names = str.slice(1, str.length - 1).trim().split(',');
		var indices = [];
		for (var i = 0; i < names.length; i++){
			var pkm_idx = get_species_index_by_name(names[i].trim());
			if (pkm_idx >= 0)
				indices.push(pkm_idx);
			else
				send_feedback(names[i].trim() + " parsed to none inside list intializer", true);
		}
		return indices;
	}else if (str == 'babt')
		return BEST_ATTACKERS_BY_TYPE_INDICES;
	else if (str == 't1')
		return TIER1_BOSSES_CURRENT_INDICES;
	else if (str == 't2')
		return TIER2_BOSSES_CURRENT_INDICES;
	else if (str == 't3')
		return TIER3_BOSSES_CURRENT_INDICES;
	else if (str == 't4')
		return TIER4_BOSSES_CURRENT_INDICES;
	else if (str == 't5')
		return TIER5_BOSSES_CURRENT_INDICES;
	else if (str == 'all'){
		var pokemonIndices = [];
		for (var i = 0; i < POKEMON_SPECIES_DATA.length; i++)
			pokemonIndices.push(i);
		return pokemonIndices;
	}else if (POKEMON_BY_TYPE_INDICES.hasOwnProperty(str))
		return POKEMON_BY_TYPE_INDICES[str];
}

function unpackMoveKeyword(str, moveType, pkmIndex){
	var prefix = (moveType == 'f') ? "fast" : "charged";
	pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;

	str = str.toLowerCase();
	var moveIndices = [];
	var moveNames = [];
	if (str == '' || str == 'aggr'){
		moveNames = POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves"];
		moveNames = moveNames.concat(POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves_legacy"]);
		var exMoveNames = POKEMON_SPECIES_DATA[pkmIndex].exclusiveMoves;
		for (var i = 0; i < exMoveNames.length; i++){
			var move_idx = pred(exMoveNames[i].trim());
			if (move_idx >= 0)
				moveIndices.push(move_idx);
		}
	}
	else if (str == 'cur')
		moveNames = POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves"];
	else if (str[0] == '{' && str[str.length - 1] == '}')
		moveNames = str.slice(1, str.length - 1).split(',');
	else if (str == 'all'){
		var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
		for (var i = 0; i < MovesData.length; i++)
			moveIndices.push(i);
	}
	
	for (var i = 0; i < moveNames.length; i++){
		var move_idx = pred(moveNames[i].trim());
		if (move_idx >= 0)
			moveIndices.push(move_idx);
	}
	return moveIndices;
}

function parseSpeciesExpression(cfg, pkmInfo, enumPrefix){
	if (pkmInfo.index >= 0)
		return 0;
	var expressionStr = pkmInfo.species;

	if (expressionStr[0] == '*'){// Enumerator
		var enumVariableName = '*' + enumPrefix + '.species';
		if (expressionStr[1] == '$'){ // Special case: User Pokebox. Also set the Level, IVs and moves
			if (USER_POKEBOX.length > 0 && !MasterSummaryTableMetrics.includes(enumVariableName))
				createNewMetric(enumVariableName);
			for (var i = 0; i < USER_POKEBOX.length; i++){
				copyAllInfo(pkmInfo, USER_POKEBOX[i]);
				pkmInfo.box_index = i;
				cfg['enumeratedValues'][enumVariableName] = '$' + i + ' ' + USER_POKEBOX[i].nickname;
				enqueueSim(cfg);
				MasterSummaryTableMetricsValues[enumVariableName].add(cfg['enumeratedValues'][enumVariableName]);
			}
		}else{
			var indices = unpackSpeciesKeyword(expressionStr.slice(1));
			if (indices.length == 0){
				send_feedback(expressionStr + " parsed to none", true);
				return -1;
			}
			if (!MasterSummaryTableMetrics.includes(enumVariableName))
				createNewMetric(enumVariableName);
					
			for (var k = 0; k < indices.length; k++){
				pkmInfo.index = indices[k];
				pkmInfo.species = POKEMON_SPECIES_DATA[indices[k]].name;
				cfg['enumeratedValues'][enumVariableName] = pkmInfo.species;
				enqueueSim(cfg);
				MasterSummaryTableMetricsValues[enumVariableName].add(pkmInfo.species);
			}
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split(',');
			var teamIdx = parseInt(arr[0].trim()), pkmIdx = parseInt(arr[1].trim());
			pkmInfo.index = cfg['atkrSettings'][teamIdx][pkmIdx].index;
			pkmInfo.species = cfg['atkrSettings'][teamIdx][pkmIdx].species;
			
			if (cfg['atkrSettings'][teamIdx][pkmIdx].box_index >= 0){
				copyAllInfo(pkmInfo, cfg['atkrSettings'][teamIdx][pkmIdx]);
			}
			enqueueSim(cfg);
			return -1;
		}catch(err){
			console.log(err);
		}
	}else{
		pkmInfo.index = get_species_index_by_name(expressionStr);		
	}
	
	return (pkmInfo.index >= 0) ? 0 : -1;
}

function parseMoveExpression(cfg, pkmInfo, enumPrefix, moveType){
	if (pkmInfo[moveType+'move_index'] >= 0)
		return 0;
	var expressionStr = pkmInfo[moveType+'move'];
	var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
	
	if (expressionStr[0] == '*'){ // Enumerator
		var enumVariableName = '*' + enumPrefix + '.' + moveType + 'move';
		var moveIndices = unpackMoveKeyword(expressionStr.slice(1), moveType, pkmInfo.index);
		if (moveIndices.length == 0){
			send_feedback(expressionStr + " parsed to none", true);
			return -1;
		}
		if (!MasterSummaryTableMetrics.includes(enumVariableName))
			createNewMetric(enumVariableName);
		for (var k = 0; k < moveIndices.length; k++){
			pkmInfo[moveType+'move_index'] = moveIndices[k];
			pkmInfo[moveType+'move'] = MovesData[moveIndices[k]].name;
			cfg['enumeratedValues'][enumVariableName] = pkmInfo[moveType+'move'];
			enqueueSim(cfg);
			MasterSummaryTableMetricsValues[enumVariableName].add(pkmInfo[moveType+'move']);
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split(',');
			var teamIdx = parseInt(arr[0].trim()), pkmIdx = parseInt(arr[1].trim());
			pkmInfo[moveType+'move_index'] = cfg['atkrSettings'][teamIdx][pkmIdx][moveType+'move_index'];
			pkmInfo[moveType+'move'] = cfg['atkrSettings'][teamIdx][pkmIdx][moveType+'move'];
			enqueueSim(cfg);
			return -1;
		}catch(err){
			console.log(err);
		}
	}else{
		pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;
		pkmInfo[moveType+'move_index'] = pred(expressionStr);
	}
	return (pkmInfo[moveType+'move_index'] >= 0) ? 0 : -1;
}

function enumeratePokemon(cfg, pkmInfo, enumPrefix){
	if (parseSpeciesExpression(cfg, pkmInfo, enumPrefix) == -1)
		return -1;	
	if (parseMoveExpression(cfg, pkmInfo, enumPrefix, 'f') == -1)
		return -1;
	if (parseMoveExpression(cfg, pkmInfo, enumPrefix, 'c') == -1)
		return -1;
	return 0;
}

function processQueue(cfg){
	for (var i = enumTeamStart; i < cfg['atkrSettings'].length; i++){
		for (var j = enumPokemonStart; j < cfg['atkrSettings'][i].length; j++){
			if (enumeratePokemon(cfg, cfg['atkrSettings'][i][j], i+','+j) == -1)
				return -1;
			enumPokemonStart++;
		}
		enumTeamStart++;
		enumPokemonStart = 0;
	}
	if (enumDefender == 0 && enumeratePokemon(cfg, cfg['dfdrSettings'], 'd') == -1)
		return -1;
	enumDefender++;

	return 0;
}

function runSim(cfg){
	var interResults = [];
	for (var i = 0; i < cfg['generalSettings']['simPerConfig']; i++){
		var app_world = new World();
		app_world.config(cfg);
		app_world.battle();
		interResults.push(app_world.get_statistics());
	}
	if (cfg['generalSettings']['reportType'] == 'avrg')
		simResults.push({input: cfg, output: averageResults(interResults)});
	else if (cfg['generalSettings']['reportType'] == 'enum'){
		for (var i = 0; i < interResults.length; i++)
			simResults.push({input: cfg, output: interResults[i], included: true});
	}
}

function averageResults(results){
	var avrgResult = results[0];
	var numResults = results.length;
	var sumWin = 0, sumDuration = 0, sumEnemyHPLostPctg = 0, sumDeaths = 0;
	for (var i = 0; i < numResults; i++){
		var gs = results[i]['generalStat'];
		if (gs['battle_result'] == 'Win')
			sumWin++;
		sumDuration += gs['duration'];
		sumEnemyHPLostPctg += gs['dfdr_HP_lost_percent'];
		sumDeaths += gs['total_deaths'];
	}
	if (numResults > 1){
		avrgResult['generalStat']['battle_result'] = Math.round(sumWin/numResults*10)/10 + "Win";
	}else{
		avrgResult['generalStat']['battle_result'] = results[0]['generalStat']['battle_result'];
	}
	avrgResult['generalStat']['duration'] = Math.round(sumDuration/numResults*10)/10;
	avrgResult['generalStat']['dfdr_HP_lost_percent'] = Math.round(sumEnemyHPLostPctg/numResults*100)/100;
	avrgResult['generalStat']['total_deaths'] = Math.round(sumDeaths/numResults*100)/100;
	
	return avrgResult;
}


function clearFeedbackTables(){
	document.getElementById("feedback_table1").innerHTML = "";
	document.getElementById("feedback_table2").innerHTML = "";
	document.getElementById("feedback_table3").innerHTML = "";
}

function turnPage(command){
	if (command == 1 && pageStart + MaxResultsPerPage < simResultsFiltered.length){
		pageStart += MaxResultsPerPage;
		pageNumber++;
	}
	else if (command == -1 && pageStart - MaxResultsPerPage >= 0){
		pageStart -= MaxResultsPerPage;
		pageNumber--;
	}
	else if (command == 2){
		pageNumber = 1;
		while (pageStart + MaxResultsPerPage < simResultsFiltered.length){
			pageNumber++;
			pageStart += MaxResultsPerPage;
		}
	}
	else if (command == -2){
		pageStart = 0;
		pageNumber = 1;
	}	
	displayMasterSummaryTable();
}

function displayMetricsControlTable(){
	document.getElementById("feedback_table1").innerHTML = "";
	var table = createElement("table","<col width=10%><col width=25%><col width=15%><col width=50%>");
	table.id = "MetricsControlTable";
	table.appendChild(createRow(["Index", "Metric", "Included", "Filter"],"th"));

	for (var i = 0; i < MasterSummaryTableMetrics.length; i++){
		const metric = MasterSummaryTableMetrics[i];
		
		var row = createElement("tr","");
		row.appendChild(createElement("td", i));
		row.appendChild(createElement("td", MasterSummaryTableHeaders[metric]));
		
		var checkedBoxObj = createElement("input","");
		checkedBoxObj.type = 'checkbox';
		checkedBoxObj.onclick = function(){
			MasterSummaryTableMetricsIncluded[metric] = this.checked;
			displayMasterSummaryTable();
		};
		checkedBoxObj.checked = MasterSummaryTableMetricsIncluded[metric];
		var td = createElement("td","");
		td.appendChild(checkedBoxObj);
		row.appendChild(td);
		
		var selectObj = createElement("select","<option value='*'>*</option><option value='*first'>*first</option>");
		var options = Array.from(MasterSummaryTableMetricsValues[metric]);
		options.sort();
		options.forEach(function(opt){
			var option = createElement("option", opt);
			option.value = opt;
			selectObj.appendChild(option);
		});
		selectObj.value = MasterSummaryTableMetricsFilter[metric];
		selectObj.onchange = function(){
			var metricChangedIndex = MasterSummaryTableMetricsFilterOrder.indexOf(metric);
			if (metricChangedIndex == -1){ // A new layer of filter
				MasterSummaryTableMetricsFilterOrder.push(metric);
				metricChangedIndex = MasterSummaryTableMetricsFilterOrder.length - 1;
			}
			MasterSummaryTableMetricsFilter[metric] = this.value; //update the filter
			if (this.value == '*'){ // Remove this and deeper layers of filters
				for (var j = MasterSummaryTableMetricsFilterOrder.length - metricChangedIndex; j > 0; j--){
					var metricToRemove = MasterSummaryTableMetricsFilterOrder.pop();
					MasterSummaryTableMetricsFilter[metricToRemove] = '*';
				}
			}
			MasterSummaryTableMetrics.forEach(function(m){
				if (!MasterSummaryTableMetricsFilterOrder.includes(m)){
					MasterSummaryTableMetricsValues[m] = new Set();
				}
			});
			filterAllSimsBy();
			displayMetricsControlTable();
			displayMasterSummaryTable();
		};
		
		var filterTd = createElement("td","");
		filterTd.appendChild(selectObj);
		row.appendChild(filterTd);
		
		table.append(row);
	}
	document.getElementById("feedback_table1").appendChild(table);
}

function displayMasterSummaryTable(){
	document.getElementById("feedback_table2").innerHTML = "";
	document.getElementById("feedback_table3").innerHTML = "";
	document.getElementById("feedback_buttons").innerHTML = "<button onclick='clearAllSims()'>Clear All</button>";
	document.getElementById("feedback_table2").appendChild(createMasterSummaryTable());
	var tb2 = createElement("table","<col width=20%><col width=20%><col width=20%><col width=20%><col width=20%>");
	var tr2 = createElement("tr","");
	tr2.appendChild(createElement("td","<button onclick='turnPage(-2)'>First</button>"));
	tr2.appendChild(createElement("td","<button onclick='turnPage(-1)'>Prev</button>"));
	tr2.appendChild(createElement("td","Page " + pageNumber + " of " + pageNumberMax));
	tr2.appendChild(createElement("td","<button onclick='turnPage(1)'>Next</button>"));
	tr2.appendChild(createElement("td","<button onclick='turnPage(2)'>Last</button>"));
	tb2.appendChild(tr2);
	document.getElementById("feedback_table2").appendChild(tb2);
}

function displayDetail(i){
	clearFeedbackTables();
	writeUserInput(simResultsFiltered[i]['input']);
	document.getElementById("feedback_buttons").innerHTML = "";
	var b = createElement("button","Back");
	b.onclick = function(){
		clearFeedbackTables();
		displayMetricsControlTable();
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	document.getElementById("feedback_table1").appendChild(createTeamStatisticsTable(simResultsFiltered[i]));
	document.getElementById("feedback_table2").appendChild(createPokemonStatisticsTable(simResultsFiltered[i]));
	document.getElementById("feedback_table3").innerHTML = "<button onclick='displayBattleLog("+i+")'>Display Battle Log</button>";
	
}

function displayBattleLog(i){
	document.getElementById("feedback_table3").innerHTML = "";
	document.getElementById("feedback_table3").appendChild(createBattleLogTable(simResultsFiltered[i]));
}

function send_feedback(msg, appending){
	if (appending){
		document.getElementById("feedback_message").innerHTML += '<br>' + msg;
	}else
		document.getElementById("feedback_message").innerHTML = msg;
}

function main(){
	initMasterSummaryTableMetrics();
	enumTeamStart = 0;
	enumPokemonStart = 0;
	enumDefender = 0;
	simQueue.push(readUserInput());
	send_feedback("");
	while (simQueue.length > 0){
		var cfg = simQueue[0];
		if (processQueue(cfg) == -1)
			simQueue.shift();
		else
			runSim(simQueue.shift());
	}
	clearFeedbackTables();
	filterAllSimsBy();
	displayMetricsControlTable();
	displayMasterSummaryTable();
	send_feedback(simResults.length + " simulations were done.", true);
}