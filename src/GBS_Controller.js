
/**
	Application controller.
	@exports App
*/
var App = {};


/** 
	Application entry point.
*/
App.init = function() {	
	$.widget("custom.iconselectmenu", $.ui.selectmenu, {
	_renderItem: function( ul, item ) {
			var li = $("<li>"), wrapper = $("<div>", {text: item.label});
			if (item.disabled) {
				li.addClass("ui-state-disabled");
			}
			$("<span>", {
				style: item.element.attr("data-style"),
				"class": "ui-icon " + item.element.attr("data-class")
			}).appendTo(wrapper);
			return li.append(wrapper).appendTo(ul);
		}
	});

	dropdownMenuInit();
	try{
		welcomeDialogInit();
		moveEditFormInit();
		pokemonEditFormInit();
		parameterEditFormInit();
		modEditFormInit();
		userEditFormInit();
		MVLTableInit();
		teamBuilderInit();
		typeCheckerInit();
		battleMatrixInit();
	}catch(err){
		console.log(err);
	}
	
	$("#UserGuideOpener").click(function(){
		window.open('https://pokemongo.gamepress.gg/comprehensive-guide-GoBattleSim', '_blank')
	});
	$("#ChanegLogOpener").click(function(){
		window.open('https://pokemongo.gamepress.gg/GoBattleSim-and-comprehensive-dps-spreadsheet-change-log', '_blank')
	});
	$("#AddPlayerButton").click(function(){
		addPlayerNode();
	});
	$("#GoButton").click(App.onclickGo);
	$("#ClearButton").click(App.onclickClear);
	$("#CopyClipboardButton").click(function(){
		UI.copyTableToClipboard('MasterSummaryTable');
	});
	$("#CopyCSVButton").click(function(){
		UI.exportTableToCSV('MasterSummaryTable', 'GoBattleSim_result.csv');
	});

	var playersNode = $("#input").find("[name=input-players]")[0];
	$(playersNode).sortable({axis: 'y'});
	addPlayerNode();
	addPlayerNode();
	UI.write({team: "1", parties: [{pokemon: [{role: "rb"}]}]}, playersNode.children[1]);
	//comply();
	
	var weatherInput = $("#input").find("[name=input-weather]")[0];
	GM.each("weather", function(weatherSetting){
		weatherInput.appendChild(createElement('option', weatherSetting.label, {value: weatherSetting.name}));
	});
	$("#timelimit").val(GM.get("battle", "timelimitLegendaryRaidMs"));

	GM.fetch({
		complete: function(){
			if (window.location.href.includes('?')){
				UI.write(UI.importConfig());
				UI.refresh();
			}
		}
	});
	
	if (!LocalData.WelcomeDialogNoShow){
		$( "#WelcomeDialog" ).dialog( "open" );
	}
	
	GBS.settings();

	UI.refresh();
}

/** 
	Handler of "Go" button click event.
*/
App.onclickGo = function() {
	var input = UI.read();
	UI.exportConfig(input);
	UI.wait(function(){
		var battles = GBS.request(input);
		Simulations = Simulations.concat(battles);
		UI.updateMasterSummaryTable(Simulations, GBS.metrics());
	});
}

/** 
	Handler of "Clear" button click event.
*/
App.onclickClear = function() {
	Simulations = [];
	UI.exportConfig();
	UI.updateMasterSummaryTable(Simulations, GBS.metrics());
	UI.updateSimulationDetails();
}

/** 
	Handler of interactive battle log change event.
	@param {Object} battleInfo The current battle data in display.
*/
App.onBattleLogChange = function(battleInfo) {
	var output = GBS.run(battleInfo.input, battleInfo.output.battleLog || []);
	UI.updateSimulationDetails({
		input: battleInfo.input,
		output: output
	});
}


/*
	Non-interface members
*/
var Simulations = [];