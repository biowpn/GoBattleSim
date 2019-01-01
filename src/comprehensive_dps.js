/* Comprehensive_DPS.js */

/**
	@file Comprehensive DPS Calculator, UI Control and others
	@author BIOWP
*/

var DEFAULT_ATTACKER_LEVEL = 40;
var DEFAULT_ATTACKER_IVs = [15, 15, 15];
var DEFAULT_ENEMY_DPS1 = 900;
var DEFAULT_ENEMY_LEVEL = 40;
var DEFAULT_ENEMY_IVs = [15, 15, 15];
var DEFAULT_ENEMY_CURRENT_DEFENSE = 160;
var DEFAULT_ENEMY_POKETYPE1 = 'none';
var DEFAULT_ENEMY_POKETYPE2 = 'none';
var DEFAULT_WEATHER = 'EXTREME';
var DEFAULT_TOTAL_ENERGY_GAINED = 400;


var Context = {
	weather: DEFAULT_WEATHER,
	enemy: {},
	isEnemyNeutral: false,
	swapDiscount: false,
	battleMode: 'regular'
};


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
	
	if (CE >= 100 && kwargs.battleMode != "pvp"){
		CE = CE + 0.5 * FE + 0.5 * y * CDWS;
	}
	
	var FDPS = FDmg/FDur;
	var FEPS = FE/FDur;
	var CDPS = CDmg/CDur;
	var CEPS = CE/CDur;
	
	if (kwargs.battleMode == "pvp"){
		this.st = this.Stm / y;
		let modFEPS = Math.max(0, FEPS - x/this.st);
		let totalEnergyGained = 3 * this.st * modFEPS;
		let discountFactor = (totalEnergyGained - 2 * CE) / totalEnergyGained;
		if (discountFactor < 0 || discountFactor > 1){
			discountFactor = 0;
		}
		CDmg = CDmg * discountFactor;
		this.dps = FDPS + modFEPS * CDmg / CE;
		this.tdo = this.dps * this.st;
		return this.dps;
	}else{
		this.st = this.Stm / y;
		this.dps = (FDPS * CEPS + CDPS * FEPS)/(CEPS + FEPS) + (CDPS - FDPS)/(CEPS + FEPS) * (1/2 - x/this.Stm) * y;
		this.tdo = this.dps * this.st;
		
		if (this.dps > CDPS){
			this.dps = CDPS;
			this.tdo = this.dps * this.st;
		}else if (this.dps < FDPS){
			this.dps = FDPS;
			this.tdo = this.dps * this.st;
		}
		
		if (kwargs.swapDiscount){
			this.dps = this.dps * (this.st / (this.st + Data.BattleSettings.swapDurationMs/1000));
		}
		return this.dps;
	}
}


Pokemon.prototype.calculateDPSIntake = function(kwargs){
	if (kwargs.isEnemyNeutral){
		if (kwargs.battleMode == "pvp"){
			return {
				x: -this.cmove.energyDelta * 0.5,
				y: DEFAULT_ENEMY_DPS1 * 1.5 / this.Def
			};
		}else{
			return {
				x: -this.cmove.energyDelta * 0.5 + this.fmove.energyDelta * 0.5,
				y: DEFAULT_ENEMY_DPS1 / this.Def
			};
		}
	}else{
		var FDmg = damage2(kwargs.enemy, this, kwargs.enemy.fmove, kwargs.weather);
		var CDmg = damage2(kwargs.enemy, this, kwargs.enemy.cmove, kwargs.weather);
		var FDur = kwargs.enemy.fmove.duration/1000 + 2;
		var CDur = kwargs.enemy.cmove.duration/1000 + 2;
		var FE = kwargs.enemy.fmove.energyDelta;
		var CE = -kwargs.enemy.cmove.energyDelta;
		if (kwargs.battleMode == "pvp"){
			return {
				x: 0,
				y: FDmg / (FDur - 2) + FE / (FDur - 2) * CDmg / CE
			};
		}else{
			var n = Math.max(1, 3 * CE / 100);
			return {
				x: -this.cmove.energyDelta * 0.5 + this.fmove.energyDelta * 0.5 + 0.5 * (n * FDmg + CDmg)/(n + 1),
				y: (n * FDmg + CDmg)/(n * FDur + CDur)
			};
		}
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


function applicationInit(){
	acceptedNumericalAttributes = acceptedNumericalAttributes.concat(['dps', 'tdo']);
	
	$.fn.dataTable.Api.register( 'rows().generate()', function () {
		return this.iterator( 'row', function ( context, index ) {
		  context.oApi._fnCreateTr( context, index );
		} );
	});
	
	var weatherSelect = document.getElementById('weather');
	Data.WeatherSettings.forEach(function(weatherSetting){
		weatherSelect.appendChild(createElement('option', weatherSetting.name, {value: weatherSetting.name}));
	});
	weatherSelect.value = DEFAULT_WEATHER;
	
	var enemySpeciesNodeContainer = document.getElementById('enemy-pokemon-name-container');
	var enemyFastMoveNodeContainer = document.getElementById('enemy-pokemon-fmove-container');
	var enemyChargedMoveNodeContainer = document.getElementById('enemy-pokemon-cmove-container');
	
	var enemySpeciesNode = createPokemonNameInput();
	enemySpeciesNode.id = "pokemon-name";
	var enemyFastMoveNode = createPokemonMoveInput("fast");
	enemyFastMoveNode.id = "pokemon-fmove";
	var enemyChargedMoveNode = createPokemonMoveInput("charged");
	enemyChargedMoveNode.id = "pokemon-cmove";
	
	enemySpeciesNodeContainer.appendChild(enemySpeciesNode);
	$( enemySpeciesNode ).on( "autocompleteselect", function(event, ui){
		$('#pokemon-pokeType1').val(ui.item.pokeType1);
		$('#pokemon-pokeType2').val(ui.item.pokeType2);
		leftMerge(Context.enemy, ui.item);
		if (getEntry(enemyFastMoveNode.value.toLowerCase(), Data.FastMoves) && getEntry(enemyChargedMoveNode.value.toLowerCase(), Data.ChargedMoves)){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	enemyFastMoveNodeContainer.appendChild(enemyFastMoveNode);
	$( enemyFastMoveNode ).on( "autocompleteselect", function(event, ui){
		if (getEntry(enemySpeciesNode.value.toLowerCase(), Data.Pokemon) && getEntry(enemyChargedMoveNode.value.toLowerCase(), Data.ChargedMoves)){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	enemyChargedMoveNodeContainer.appendChild(enemyChargedMoveNode);
	$( enemyChargedMoveNode ).on( "autocompleteselect", function(event, ui){
		if (getEntry(enemySpeciesNode.value.toLowerCase(), Data.Pokemon) && getEntry(enemyFastMoveNode.value.toLowerCase(), Data.FastMoves)){
			this.blur();
			requestSpreadsheet(false);
		}
	});
	
	var enemyPokeType1Select = document.getElementById('pokemon-pokeType1');
	var enemyPokeType2Select = document.getElementById('pokemon-pokeType2');
	enemyPokeType1Select.appendChild(createElement('option', toTitleCase(DEFAULT_ENEMY_POKETYPE1), {value: DEFAULT_ENEMY_POKETYPE1}));
	enemyPokeType2Select.appendChild(createElement('option', toTitleCase(DEFAULT_ENEMY_POKETYPE2), {value: DEFAULT_ENEMY_POKETYPE2}));
	for (var pokeType in Data.TypeEffectiveness){
		enemyPokeType1Select.appendChild(createElement('option', toTitleCase(pokeType), {value: pokeType}));
		enemyPokeType2Select.appendChild(createElement('option', toTitleCase(pokeType), {value: pokeType}));
	}
	enemyPokeType1Select.value = DEFAULT_ENEMY_POKETYPE1;
	enemyPokeType2Select.value = DEFAULT_ENEMY_POKETYPE2;	
	
	var Table = $("#ranking_table").DataTable({
		lengthChange: false,
		autoWidth: false,
		deferRender: true,
		columns: [
			{title: "Pokemon", data: "ui_name", width: "24%"},
			{title: "Fast Move", data: "ui_fmove", width: "18%"},
			{title: "Charged Move", data: "ui_cmove", width: "18%"},
			{title: "DPS", data: "ui_dps", width: "10%", orderSequence: [ "desc", "asc"]},
			{title: "TDO", data: "ui_tdo", width: "10%", orderSequence: [ "desc", "asc"]},
			{title: "DPS^3*TDO", data: "ui_overall", width: "10%", orderSequence: [ "desc", "asc"]},
			{title: "CP", data: "ui_cp", width: "10%", orderSequence: [ "desc", "asc"]}
		],
		scrollX: true
	});
	Table.order( [ 3, 'desc' ] );
	$('#ranking_table_filter').hide();

	generateSpreadsheet(Data.Pokemon);
}


function applyContext(){
	Context.weather = document.getElementById('weather').value;
	
	Context.isEnemyNeutral = false;
	var d_index = getEntryIndex($('#pokemon-name').val().trim().toLowerCase(), Data.Pokemon);
	var d_fmove_index = getEntryIndex($('#pokemon-fmove').val().trim().toLowerCase(), Data.FastMoves);
	var d_cmove_index = getEntryIndex($('#pokemon-cmove').val().trim().toLowerCase(), Data.ChargedMoves);
	if (d_index < 0 || d_fmove_index < 0 || d_cmove_index < 0){
		Context.isEnemyNeutral = true;
		d_index = d_fmove_index = d_cmove_index = 0;
	}
	
	Context.enemy = new Pokemon({
		index: d_index,
		fmove: d_fmove_index,
		cmove: d_cmove_index,
		level: DEFAULT_ENEMY_LEVEL,
		atkiv: DEFAULT_ENEMY_IVs[0],
		defiv: DEFAULT_ENEMY_IVs[1],
		stmiv: DEFAULT_ENEMY_IVs[2],
		raidTier: 0
	});
	Context.enemy.pokeType1 = document.getElementById('pokemon-pokeType1').value;
	Context.enemy.pokeType2 = document.getElementById('pokemon-pokeType2').value;
	
	if (Context.isEnemyNeutral){
		Context.enemy.Def = DEFAULT_ENEMY_CURRENT_DEFENSE;
	}
	
	var cpcap = parseInt(document.getElementById("ui-cpcap").value);
	if (!isNaN(cpcap) && cpcap > 0){
		LeagueCPCap = cpcap;
	}else{
		LeagueCPCap = 0;
	}
}


function generateSpreadsheet(pokemonCollection){
	var Table = $("#ranking_table").DataTable();
	Table.clear();
	applyContext();
	for (let p of pokemonCollection){
		var bestPkm = {dps: -1};
		var fastMoves_all = p.fmove ? [p.fmove] : p.fastMoves.concat(p.fastMoves_legacy).concat(p.fastMoves_exclusive);
		var chargedMoves_all = p.cmove ? [p.cmove] : p.chargedMoves.concat(p.chargedMoves_legacy).concat(p.chargedMoves_exclusive);
		for (let fmove of fastMoves_all){
			for (let cmove of chargedMoves_all){
				var pkm = new Pokemon({
					name: p.name,
					fmove: fmove,
					cmove: cmove,
					level: p.level || DEFAULT_ATTACKER_LEVEL,
					atkiv: p.atkiv >= 0 ? p.atkiv : DEFAULT_ATTACKER_IVs[0],
					defiv: p.defiv >= 0 ? p.defiv : DEFAULT_ATTACKER_IVs[1],
					stmiv: p.stmiv >= 0 ? p.stmiv : DEFAULT_ATTACKER_IVs[2]
				});
				if (!pkm.fmove.name || !pkm.cmove.name){ // Move not found in database
					continue;
				}
				for (var attr in p){
					if (!pkm.hasOwnProperty(attr)){
						pkm[attr] = p[attr];
					}
				}
				if (LeagueCPCap > 0){
					adjustStatsUnderCPCap(pkm, LeagueCPCap);
				}
				
				pkm.calculateDPS(Context);
				if (pkm.dps > bestPkm.dps){
					bestPkm.best = false;
					pkm.best = true;
					bestPkm = pkm;
				}else{
					pkm.best = false;
				}
				
				pkm.ui_name = createIconLabelSpan(p.icon, p.nickname || p.label, 'species-input-with-icon');
				pkm.ui_fmove = createIconLabelSpan(pkm.fmove.icon, pkm.fmove.label, 'move-input-with-icon');
				pkm.ui_cmove = createIconLabelSpan(pkm.cmove.icon, pkm.cmove.label, 'move-input-with-icon');
				pkm.ui_dps = round(pkm.dps, 3);
				pkm.ui_tdo = round(pkm.tdo, 1);
				pkm.ui_overall = round(pkm.dps**3/1000 * pkm.tdo, 1);
				pkm.ui_cp = calculateCP(pkm);
				
				Table.row.add(pkm);
			}
		}
	}
	console.log(Date() + ": All DPS calculated");
	pred = createComplexPredicate($('#searchInput').val());
	$("#ranking_table").DataTable().draw();
}


function updateSpreadsheet(){
	var Table = $("#ranking_table").DataTable();
	applyContext();
	var bestEachSpecies = {};
	var dataLength = Table.data().length;
	for (var i = 0; i < dataLength; i++){
		var pkm = Table.row(i).data();
		
		pkm.calculateDPS(Context);
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
		
		pkm.ui_dps = round(pkm.dps, 3);
		pkm.ui_tdo = round(pkm.tdo, 1);
		pkm.ui_overall = round(pkm.dps**3/1000 * pkm.tdo, 1)
		Table.row(i).data(pkm);
	}
	console.log(Date() + ": All DPS re-calculated");
	pred = createComplexPredicate($('#searchInput').val());
	$("#ranking_table").DataTable().draw();
}


function requestSpreadsheet(startover){
	calculationMethod = function(){};
	
	uniqueSpecies = false;
	document.getElementById('ui-uniqueSpecies-checkbox').checked = false;
	$("#ui-uniqueSpecies-checkbox").button('refresh');
	
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


var lastKeyUpTime = 0;
pred = function(obj){return true;}

function search_trigger(){
	lastKeyUpTime = Date.now();
	setTimeout(function(){
		if (Date.now() - lastKeyUpTime >= 600){
			var DT = $("#ranking_table").DataTable();
			pred = createComplexPredicate($('#searchInput').val());
			DT.draw();
		}
	}, 600);
}

var uniqueSpecies = false;

function markFirstInstancePerSpecies(){
	var data = $("#ranking_table").DataTable().rows({search: "applied"}).data();
	var speciesHasOccured = {};
	for (var i = 0; i < data.length; i++){
		if (!speciesHasOccured[data[i].name]){
			data[i].best = true;
			speciesHasOccured[data[i].name] = true;
		}else{
			data[i].best = false;
		}
	}
}

$.fn.dataTable.ext.search.push(
    function(settings, searchData, index, rowData, counter){
		var selected = true;
		try{ 
			selected = pred(rowData) && (!uniqueSpecies || rowData.best);
		}catch(err){ 
			selected = true; 
		}
		return selected;
    }
);

var LeagueCPCap = 0;

function adjustStatsUnderCPCap(pkm, cp){
	var old_cp = calculateCP(pkm);
	if (old_cp > cp){
		pkm.cpm = pkm.cpm * Math.sqrt(cp / old_cp);
		pkm.role = "a";
		pkm.calculateStats();
	}
}

function applyCPCap(cap){
	LeagueCPCap = cap;
	requestSpreadsheet(false);
}



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


function calculateDPSGrades(maxDPS){
	var DT = $("#ranking_table").DataTable();
	var data = DT.data();
	for (var i = 0; i < data.length; i++){
		var score = data[i].ui_dps / maxDPS;
		if (score >= 0.976190){
			grade = "A";
		}else if (score >= 0.928571){
			grade = "A-";
		}else if (score >= 0.880952){
			grade = "B+";
		}else if (score >= 0.833333){
			grade = "B";
		}else if (score >= 0.785714){
			grade = "B-";
		}else if (score >= 0.738095){
			grade = "C+";
		}else if (score >= 0.690476){
			grade = "C";
		}else if (score >= 0.642857){
			grade = "C-";
		}else{
			grade = "X";
		}
		data[i].ui_cp = grade;
	}
	DT.rows().invalidate();
}