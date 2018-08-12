/* Comprehensive_DPS.js */

var Table = null;
var colHeaders = ["Pokemon", "Fast Move", "Charged Move", "DPS", "TDO", "DPS*TDO", "CP"];

var DEFAULT_LEVEL = 40;
var DEFAULT_IVs = [15, 15, 15];
var DEFAULT_ENEMY_CURRENT_DEFENSE = 160;
var DEFAULT_ENEMY_POKETYPE1 = 'none';
var DEFAULT_ENEMY_POKETYPE2 = 'none';
var DEFAULT_WEATHER = 'EXTREME';

var ConfigurableAttributes = [
	{'elementId': "ui-species_boss", 'qsField': "pkm", 'defaultValue': '', 'iconGetter': getPokemonIcon, 'databaseName': "Pokemon"}, 
	{'elementId': "d-pokeType1", 'qsField': "type1", 'defaultValue': DEFAULT_ENEMY_POKETYPE1}, 
	{'elementId': "d-pokeType2", 'qsField': "type2", 'defaultValue': DEFAULT_ENEMY_POKETYPE2}, 
	{'elementId': "fmove_boss", 'qsField': "fm", 'defaultValue': '', 'iconGetter': getTypeIcon, 'databaseName': "FastMoves"}, 
	{'elementId': "cmove_boss", 'qsField': "cm", 'defaultValue': '', 'iconGetter': getTypeIcon, 'databaseName': "ChargedMoves"}, 
	{'elementId': "weather", 'qsField': "wt", 'defaultValue': DEFAULT_WEATHER}, 
	{'elementId': "searchInput", 'qsField': "qs", 'defaultValue': ''},
	{'qsField': "by", defaultValue: "DPS"},
	{'qsField': "order", defaultValue: "desc"},
	{'qsField': "swpdsct", defaultValue: "off"},
];

var Context = {
	weather: DEFAULT_WEATHER,
	enemy: {},
	isEnemyNeutral: false,
	swapDiscount: 'off'
};

var ALL_COMBINATIONS = [];


Pokemon.prototype.calculateDPS = function(kwargs){
	var x = kwargs.x, y = kwargs.y;
	if (x == undefined || y == undefined){
		var intakeProfile = this.calculateDPSIntake(kwargs);
		x = (x == undefined ? intakeProfile.x : x);
		y = (y == undefined ? intakeProfile.y : y);
	}
	
	var FDmg = damage2(this, kwargs.enemy, this.fmove, kwargs.weather);
	var CDmg = damage2(this, kwargs.enemy, this.cmove, kwargs.weather);
	var FDur = this.fmove.duration/1000;
	var CDur = this.cmove.duration/1000;
	var CDWS = this.cmove.dws/1000;
	var FE = this.fmove.energyDelta;
	var CE = -this.cmove.energyDelta;
	
	if (CE >= 100){
		CE = CE + 0.5 * FE + 0.5 * y * CDWS;
	}
	
	var FDPS = FDmg/FDur;
	var FEPS = FE/FDur;
	var CDPS = CDmg/CDur;
	var CEPS = CE/CDur;
	
	this.st = this.Stm / y;
	this.dps = (FDPS * CEPS + CDPS * FEPS)/(CEPS + FEPS) + (CDPS - FDPS)/(CEPS + FEPS) * (1/2 - x/this.Stm) * y;
	this.tdo = this.dps * this.st;
	
	if (this.dps > CDPS){
		//console.log("Violation of Comp DPS Axiom: OVERflow: " + this.name + "," + this.fmove.name + "," + this.cmove.name);
		this.dps = CDPS;
		this.tdo = this.dps * this.st;
	}else if (this.dps < FDPS){
		//console.log("Violation of Comp DPS Axiom: UNDERflow: " + this.name + "," + this.fmove.name + "," + this.cmove.name);
		this.dps = FDPS;
		this.tdo = this.dps * this.st;
	}
	
	if (kwargs.swapDiscount == 'on'){
		this.dps = this.dps * (this.st / (this.st + Data.BattleSettings.swapDurationMs/1000));
	}
	
	return this.dps;
}


Pokemon.prototype.calculateDPSIntake = function(kwargs){
	if (kwargs.isEnemyNeutral){
		return {
			x: -this.cmove.energyDelta * 0.5 + this.fmove.energyDelta * 0.5,
			y: 900 / this.Def
		};
	}else{
		var FDmg = damage2(kwargs.enemy, this, kwargs.enemy.fmove, Context.weather);
		var CDmg = damage2(kwargs.enemy, this, kwargs.enemy.cmove, Context.weather);
		var FDur = kwargs.enemy.fmove.duration/1000 + 2;
		var CDur = kwargs.enemy.cmove.duration/1000 + 2;
		var FE = kwargs.enemy.fmove.energyDelta;
		var CE = -kwargs.enemy.cmove.energyDelta;
		
		var n = Math.max(1, 3 * CE / 100);
		
		return {
			x:  -this.cmove.energyDelta * 0.5 + this.fmove.energyDelta * 0.5 + 0.5 * (n * FDmg + CDmg)/(n + 1),
			y: (n * FDmg + CDmg)/(n * FDur + CDur)
		};
	}
}


function damage2(dmg_giver, dmg_taker, move, weather){
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
	return 0.5*dmg_giver.Atk/dmg_taker.Def*move.power*effe1*effe2*stab*wab*fab + 0.5;
}



function setConfigFromUrl(url){
	if (url.includes('?')){
		var cfg = {};
		ConfigurableAttributes.forEach(function(info){
			cfg[info.qsField] = getParameterByName(info.qsField, url) || info.defaultValue;
			$('#' + info.elementId).val(cfg[info.qsField] || info.defaultValue);
			if (info.iconGetter){
				$('#' + info.elementId).attr('style', "background-image: url(" + info.iconGetter({name: cfg[info.qsField], mtype: info.elementId[0]}) + ")");
			}
			if (info.databaseName){
				$('#' + info.elementId).attr('index', getEntryIndex(cfg[info.qsField].toLowerCase(), Data[info.databaseName]));
			}
		});
		if (cfg['pkm'] && cfg['type1'] == 'none' && cfg['type2'] == 'none'){
			var pkm = getEntry(cfg['pkm'].toLowerCase(), Data.Pokemon);
			if (pkm){
				$('#d-pokeType1').val(pkm.pokeType1);
				$('#d-pokeType2').val(pkm.pokeType2);
			}
		}
		if (cfg['by'] || cfg['order']){
			var col_idx = colHeaders.indexOf(cfg['by'] || 'DPS');
			if (col_idx >= 0){
				Table.order([col_idx, cfg['order'] || 'desc']);
			}
		}
		if (cfg['swpdsct'] == 'on'){
			Context.swapDiscount = "on";
			$( "#ui-swapDiscount-checkbox" ).attr("checked", true);
			$( "#ui-swapDiscount-checkbox" ).checkboxradio( "refresh" );
		}
	}
}

function setUrlFromConfig(){
	var cfg = {}, non_default_flag = false;
	
	var sortingSetting = Table.settings().context[0].aaSorting[0];
	if (sortingSetting){
		var sortBy = [colHeaders[sortingSetting[0]], sortingSetting[1]];
		cfg['by'] = sortBy[0];
		cfg['order'] = sortBy[1];
	}
	cfg['swpdsct'] = Context.swapDiscount;
	ConfigurableAttributes.forEach(function(info){
		var val = info.elementId ? $('#' + info.elementId).val() : cfg[info.qsField];
		if (val == info.defaultValue){
			delete cfg[info.qsField];
		}else{
			cfg[info.qsField] = val;
			non_default_flag = true;
		}
	});
	
	var comp = $.param(cfg);
	window.history.pushState('', '', window.location.href.split('?')[0] + (comp ? '?' : '') + comp);
}




function applicationInit(){
	acceptedNumericalAttributes = acceptedNumericalAttributes.concat(['dps', 'tdo']);
	
	var weatherSelect = document.getElementById('weather');
	Data.WeatherSettings.forEach(function(weatherSetting){
		weatherSelect.appendChild(createElement('option', weatherSetting.name, {value: weatherSetting.name}));
	});
	weatherSelect.value = DEFAULT_WEATHER;
	
	var enemySpeciesNode = document.getElementById('ui-species_boss');
	var enemyFastMoveNode = document.getElementById('fmove_boss');
	var enemyChargedMoveNode = document.getElementById('cmove_boss');
	
	autocompletePokemonNodeSpecies(enemySpeciesNode);
	$( enemySpeciesNode ).on( "autocompleteselect", function(event, ui){
		document.getElementById('d-pokeType1').value = ui.item.pokeType1;
		document.getElementById('d-pokeType2').value = ui.item.pokeType2;
		leftMerge(Context.enemy, ui.item);
		$(this).val(ui.item.label);
		this.setAttribute('index', getEntryIndex(ui.item.name, Data.Pokemon));
		if ($(enemyFastMoveNode).attr('index') >= 0 && $(enemyChargedMoveNode).attr('index') >= 0){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	autocompletePokemonNodeMoves(enemyFastMoveNode);
	$( enemyFastMoveNode ).on( "autocompleteselect", function(event, ui){
		$(this).val(ui.item.label);
		this.setAttribute('index', getEntryIndex(ui.item.name, Data.FastMoves));
		if ($(enemySpeciesNode).attr('index') >= 0 && $(enemyChargedMoveNode).attr('index') >= 0){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	autocompletePokemonNodeMoves(enemyChargedMoveNode);
	$( enemyChargedMoveNode ).on( "autocompleteselect", function(event, ui){
		$(this).val(ui.item.label);
		this.setAttribute('index', getEntryIndex(ui.item.name, Data.ChargedMoves));
		if ($(enemySpeciesNode).attr('index') >= 0 && $(enemyFastMoveNode).attr('index') >= 0){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	var enemyPokeType1Select = document.getElementById('d-pokeType1');
	var enemyPokeType2Select = document.getElementById('d-pokeType2');
	enemyPokeType1Select.appendChild(createElement('option', toTitleCase(DEFAULT_ENEMY_POKETYPE1), {value: DEFAULT_ENEMY_POKETYPE1}));
	enemyPokeType2Select.appendChild(createElement('option', toTitleCase(DEFAULT_ENEMY_POKETYPE2), {value: DEFAULT_ENEMY_POKETYPE2}));
	for (var pokeType in Data.TypeEffectiveness){
		enemyPokeType1Select.appendChild(createElement('option', toTitleCase(pokeType), {value: pokeType}));
		enemyPokeType2Select.appendChild(createElement('option', toTitleCase(pokeType), {value: pokeType}));
	}
	enemyPokeType1Select.value = DEFAULT_ENEMY_POKETYPE1;
	enemyPokeType2Select.value = DEFAULT_ENEMY_POKETYPE2;	
	
	var table = document.getElementById('ranking_table');
	var headerRow = document.createElement('tr');
	colHeaders.forEach(function(header){
		headerRow.innerHTML += '<th>' + header + '<\/th>';
	});
	table.children[0].appendChild(headerRow);
	
	Table = $(table).DataTable({
		lengthChange: false,
		autoWidth: false,
		deferRender: true,
		columnDefs: [
			{"width": "24%"},
			{"width": "18%"},
			{"width": "18%"},
			{"width": "10%"},
			{"width": "10%"},
			{"width": "10%"},
			{"width": "10%"},
		],
		aoColumns: [
			null,
            null,
            null,
            { "orderSequence": [ "desc", "asc"] },
            { "orderSequence": [ "desc", "asc"] },
            { "orderSequence": [ "desc", "asc"] },
            { "orderSequence": [ "desc", "asc"] }
        ]
	});
	$('#ranking_table_filter').hide();
	Table.order( [ 3, 'desc' ] );
	Table.table().header().onclick = function(){
		setUrlFromConfig();
	}
	
	setConfigFromUrl(window.location.href);
	generateSpreadsheet(Data.Pokemon);
}


function applyContext(){
	Context.weather = document.getElementById('weather').value;
	
	Context.isEnemyNeutral = false;
	var d_index = getEntryIndex($('#ui-species_boss').val().trim().toLowerCase(), Data.Pokemon);
	var d_fmove_index = getEntryIndex($('#fmove_boss').val().trim().toLowerCase(), Data.FastMoves);
	var d_cmove_index = getEntryIndex($('#cmove_boss').val().trim().toLowerCase(), Data.ChargedMoves);
	if (d_index < 0 || d_fmove_index < 0 || d_cmove_index < 0){
		Context.isEnemyNeutral = true;
		d_index = d_fmove_index = d_cmove_index = 0;
	}
	
	Context.enemy = new Pokemon({
		index: d_index,
		fmove: d_fmove_index,
		cmove: d_cmove_index,
		level: 40,
		atkiv: DEFAULT_IVs[0],
		defiv: DEFAULT_IVs[1],
		stmiv: DEFAULT_IVs[2],
		raid_tier: 0
	});
	Context.enemy.pokeType1 = document.getElementById('d-pokeType1').value;
	Context.enemy.pokeType2 = document.getElementById('d-pokeType2').value;
	
	if (Context.isEnemyNeutral){
		Context.enemy.Def = DEFAULT_ENEMY_CURRENT_DEFENSE;
	}
	
	setUrlFromConfig();
}


function createIconLabelSpan(icon, label, cls){
	return '<span class="input-with-icon ' + cls + '" style="background-image: url(' + icon + ')">' + label + '</span>';
}


function generateSpreadsheet(pokemonCollection){
	ALL_COMBINATIONS = [];
	Table.clear();
	applyContext();
	
	for (var i = 0; i < pokemonCollection.length; i++){
		var p = pokemonCollection[i];
		var bestPkm = null;

		var fastMoves_all = p.fmove ? [p.fmove] : p.fastMoves.concat(p.fastMoves_legacy).concat(p.fastMoves_exclusive);
		var chargedMoves_all = p.cmove ? [p.cmove] : p.chargedMoves.concat(p.chargedMoves_legacy).concat(p.chargedMoves_exclusive);
		for (var j = 0; j < fastMoves_all.length; j++){
			var fmove = getEntry(fastMoves_all[j], Data.FastMoves);
			if (!fmove){
				console.log("Move not found: " + fastMoves_all[j]);
				continue;
			}
			for (var k = 0; k < chargedMoves_all.length; k++){
				var cmove = getEntry(chargedMoves_all[k], Data.ChargedMoves);
				if (!cmove){
					console.log("Move not found: " + chargedMoves_all[k]);
					continue;
				}
				
				var pkm = new Pokemon({
					'species': p,
					'fmove': fmove,
					'cmove': cmove,
					'level': p.level || DEFAULT_LEVEL,
					'atkiv': typeof p.atkiv == typeof 0 ? p.atkiv : DEFAULT_IVs[0],
					'defiv': typeof p.defiv == typeof 0 ? p.defiv : DEFAULT_IVs[1],
					'stmiv': typeof p.stmiv == typeof 0 ? p.stmiv : DEFAULT_IVs[2],
					'raid_tier': 0
				});
				pkm.cp = calculateCP(pkm);
				pkm.calculateDPS(Context);
				
				if (bestPkm == null){
					bestPkm = pkm;
					pkm.best = true;
				}else{
					if (pkm.dps > bestPkm.dps){
						bestPkm.best = false;
						pkm.best = true;
						bestPkm = pkm;
					}else{
						pkm.best = false;
					}
				}
				
				Table.row.add([
					createIconLabelSpan(pkm.icon, p.nickname || pkm.label, 'species-input-with-icon'), 
					createIconLabelSpan(pkm.fmove.icon, pkm.fmove.label, 'move-input-with-icon'), 
					createIconLabelSpan(pkm.cmove.icon, pkm.cmove.label, 'move-input-with-icon'), 
					Math.round(pkm.dps * 1000) / 1000, 
					Math.round(pkm.tdo * 10) / 10,
					Math.round(pkm.dps * pkm.tdo * 10) / 10,
					pkm.cp
				]);
				
				ALL_COMBINATIONS.push(pkm);
			}
		}
	}
	console.log(Date() + ": All DPS calculated");
	pred = createComplexPredicate($('#searchInput').val());
	$("#ranking_table").DataTable().draw();
}

function updateSpreadsheet(){
	applyContext();
	var bestEachSpecies = {};
	
	var i = 0;
	Table.data().each(function(row){
		var pkm = ALL_COMBINATIONS[i];
		
		pkm.calculateDPS(Context);
		row[3] = Math.round(pkm.dps * 1000) / 1000;
		row[4] = Math.round(pkm.tdo * 10) / 10;
		row[5] = Math.round(pkm.dps * pkm.tdo * 10) / 10;

		var curBest = bestEachSpecies[pkm.name];
		if (curBest){
			if (pkm.dps > curBest.dps){
				curBest.best = false;
				bestEachSpecies[pkm.name] = pkm;
				pkm.best = true;
			}else{
				pkm.best = false;
			}
		}else{
			pkm.best = true;
			bestEachSpecies[pkm.name] = pkm;
		}
		
		i++;
	});
	
	console.log(Date() + ": All DPS re-calculated");
	Table.rows().invalidate();
	pred = createComplexPredicate($('#searchInput').val());
	$("#ranking_table").DataTable().draw();
}

function requestSpreadsheet(startover){
	calculationMethod = function(){};
	uniqueSpecies = document.getElementById('ui-uniqueSpecies-checkbox').checked;
	
	if (startover){
		var pokebox_checkbox = document.getElementById('ui-use-box-checkbox');
		if (pokebox_checkbox.checked){
			if (!Data.Users.length || userID2 == '0'){
				sendFeedbackDialog("To use your Pokemon, please log in");
				pokebox_checkbox.checked = false;
				$(pokebox_checkbox).button('refresh');
				return;
			}else{
				calculationMethod = function(){
					generateSpreadsheet(Data.Users[0].box);
				};
			}
		}else{
			calculationMethod = function(){
				generateSpreadsheet(Data.Pokemon);
			};
		}
	}else{
		calculationMethod = updateSpreadsheet;
	}
	
	sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Calculating...");
	setTimeout(function(){
		try{
			calculationMethod();
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
		}catch(err){
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
			sendFeedbackDialog("Oops, an issue occurred: " + err.toString());
		}
		
	}, 50);
}


function getSpreadsheetContentText(){
	var content = [];
	var data = Table.rows().data();
	for (var i = 0; i < data.length; i++){
		let rowText = [];
		for (var j = 0; j < data[i].length; j++){
			rowText.push(createElement("div", data[i][j]).innerText);
		}
		content.push(rowText);
	}
	return content;
}

function copySpreadsheetToClipboard(){
	let copyStr = "Pokemon\tFast Move\tCharged Move\tDPS\tTDO\tDPS*TDO\tCP\n";
	var content = getSpreadsheetContentText();
	for (var i = 0; i < content.length; i++){
		copyStr += content[i].join("\t") + "\n";
	}
	copyToClipboard(copyStr);
	sendFeedbackDialog("Spreadsheet has been copied to clipboard");
}

function exportSpreadsheetToCSV(){
	let csvContent = "data:text/csv;charset=utf-8,";
	csvContent += "Pokemon,Fast Move,Charged Move,DPS,TDO,DPS*TDO,CP" + "\r\n";
	var content = getSpreadsheetContentText();
	for (var i = 0; i < content.length; i++){
		csvContent += content[i].join(",") + "\r\n";
	}

	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "comprehensive_dps.csv");
	link.innerHTML= "Click Here to download";
	document.body.appendChild(link);
	link.click();
}



var lastKeyUpTime = 0;
pred = function(obj){return true;}

function search_trigger(){
	lastKeyUpTime = Date.now();
	setTimeout(function(){
		if (Date.now() - lastKeyUpTime >= 600){
			pred = createComplexPredicate($('#searchInput').val());
			$("#ranking_table").DataTable().draw();
		}
	}, 600);
}

var uniqueSpecies = false;

$.fn.dataTable.ext.search.push(
    function(settings, searchData, index, rowData, counter){
		var pkm = ALL_COMBINATIONS[index];
		var selected = true;
		try{ 
			selected = pred(pkm) && (!uniqueSpecies || pkm.best);
		}catch(err){ 
			selected = true; 
		}
		return selected;
    }
);




/*
	Features yet to be released
*/

// Generate a spectrum of DPS
function generateSpectrum(pkm, settings){
	settings = settings || {};
	var X_min = settings.X_min || 0, X_max = settings.X_max || 100, X_num = settings.X_num || 100, X_step = (X_max - X_min) / X_num;
	var Y_min = settings.Y_min || 0, Y_max = settings.Y_max || 1500/pkm.Def, Y_num = settings.Y_num || 100, Y_step = (Y_max - Y_min) / Y_num;
	var DPS_spectrum = [];
	for (var x = X_min; x < X_max; x += X_step){
		var row = [];
		for (var y = Y_min; y < Y_max; y += Y_step){
			row.push(pkm.calculateDPS({
				'x': x, 'y': y, 'enemy': Context.enemy, 'weather': Context.weather, 'swapDiscount': Context.swapDiscount
			}));
		}
		DPS_spectrum.push(row);
	}
	return DPS_spectrum;
}

// Defender ability
function calculateDefender(){
	DPS_dict = {};
	
	var type_list = ['none'];
	for (var type in Data.TypeEffectiveness){
		type_list.push(type);
	}
	
	Context.enemy.Def = DEFAULT_ENEMY_CURRENT_DEFENSE;
	for (var i = 0; i < type_list.length - 1; i++){
		type1 = type_list[i];
		for (var j = i + 1; j < type_list.length; j++){
			type2 = type_list[j];
			Context.enemy.pokeType1 = type1;
			Context.enemy.pokeType2 = type2;
			DPS_dict[type1 + ',' + type2] = 0;
			DPS_dict[type2 + ',' + type1] = 0;
			for (var k = 0; k < ALL_COMBINATIONS.length; k++){
				var pkm = ALL_COMBINATIONS[k];
				pkm.calculateDPS({
					'y': 400 / pkm.Def,
					'enemy': Context.enemy,
					'weather': Context.weather
				});
				if (pkm.dps > DPS_dict[type1 + ',' + type2]){
					DPS_dict[type1 + ',' + type2] = pkm.dps;
					DPS_dict[type2 + ',' + type1] = pkm.dps;
				}
			}
		}
	}
	
	for (var i = 0; i < ALL_COMBINATIONS.length; i++){
		var pkm = ALL_COMBINATIONS[i];
		var dps_in = DPS_dict[pkm.pokeType1 + ',' + pkm.pokeType2];
		pkm.defender_time = 2 * pkm.Stm * pkm.Def / (dps_in * DEFAULT_ENEMY_CURRENT_DEFENSE);
	}
	
	ALL_COMBINATIONS.sort(function(a,b){return b.defender_time - a.defender_time;});
	
	names = [];
	str = '';
	for (var i = 0; i < ALL_COMBINATIONS.length && names.length < 100; i++){
		name = ALL_COMBINATIONS[i].label;
		if (!names.includes(name)){
			str += name + '\t' + ALL_COMBINATIONS[i].defender_time + '\n';
			names.push(name);
		}
	}
	copy(str.trim());
}


// PVP Outcome
function calculatePVP(pkm1, pkm2){
	var FDmg1 = damage(pkm1, pkm2, pkm1.fmove, Context.weather), FDmg2 = damage(pkm2, pkm1, pkm2.fmove, Context.weather);
	var CDmg1 = damage(pkm1, pkm2, pkm1.cmove, Context.weather), CDmg2 = damage(pkm2, pkm1, pkm2.cmove, Context.weather);
	var FDur1 = pkm1.fmove.duration/1000, FDur2 = pkm2.fmove.duration/1000;
	var CDur1 = pkm1.cmove.duration/1000, CDur2 = pkm2.cmove.duration/1000;
	var FE1 = pkm1.fmove.energyDelta, FE2 = pkm2.fmove.energyDelta;
	var CE1 = -pkm1.cmove.energyDelta, CE2 = -pkm2.cmove.energyDelta;
	var HP1 = pkm1.Stm, HP2 = pkm2.Stm;
	
	// TODO
}