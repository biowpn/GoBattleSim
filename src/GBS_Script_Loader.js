/* GBS_Script_Loader.js */

/**
	@file Load the scripts dynamically and manage the JSONs loading status.
	@author BIOWP
*/

var curTime = Date.now();
var raidBossListURL = "", pokemonDataFullURL = "", moveDataFullURL = "";
var requiredJSONStatus = { 
	// 0: Not loaded, 1: Started loading, 2: Successfully loaded
	'Pokemon': 0,
	'PokemonForms': 0,
	'RaidBosses': 0,
	'Moves': 0,
	'LevelSettings': 0
};

/** 
	This function will be called after all required JSONs and scripts are loaded.
*/
function onfinishLoadingAll(){
	GoBattleSimInit(); // DPSCalculatorInit();
};

$.ajax({ 
	url: "https://gamepress.gg/json-list?_format=json&game_tid=1&" + curTime, 
	dataType: 'json', 
	success: function(data){
		for(var i = 0; i < data.length; i++){
			var curr = data[i];
			if (curr.title == "raid-boss-list-PoGO"){
				raidBossListURL = curr.url;
			}
			if (curr.title == "pokemon-data-full-en-PoGO"){
				pokemonDataFullURL = curr.url;
			}
			if (curr.title == "move-data-full-PoGO"){
				moveDataFullURL = curr.url;
			}
		}
	},
	complete: function(){
		if (window.fetchSpeciesData){
			fetchSpeciesData();
			fetchMoveData();
			fetchRaidBossData();
		}
	}
});

var scriptsToLoad = [
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_Populate.js",

	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_Core.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_Populate_extras.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_UI_1_general.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_UI_2_dom.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_UI_3_parser.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/GBS_UI_4_dom2.js",
	"https://pokemongo.gamepress.gg/sites/pokemongo/files/js_files/comprehensive_dps.js"
];

var numScriptsToLoad = scriptsToLoad.length;
var numScriptsLoaded = 0;


// Load this script first because we need this script to load JSONs
$.getScript(scriptsToLoad[0] + "?" + curTime, function(){
	numScriptsLoaded++;
	fetchAll(function(){
		if (numScriptsLoaded >= numScriptsToLoad){
			onfinishLoadingAll();
		}
	});
});


for (var i = 1; i < numScriptsToLoad; i++){
	$.getScript(scriptsToLoad[i] + "?" + curTime, function(){
		numScriptsLoaded++;
		if (numScriptsLoaded >= numScriptsToLoad){
			for (var json_name in requiredJSONStatus){
				if (requiredJSONStatus[json_name] != 2){
					return;
				}
			}
			onfinishLoadingAll();
		}
	});
}