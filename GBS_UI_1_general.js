/* GBS_UI_1_general.js */

var LOGICAL_OPERATORS = {
	',': 0,	':': 0, ';': 0, // OR
	'&': 1, '|': 1, // AND
	'!': 2 // NOT
};
var SELECTORS = ['*', '?'];
var acceptedNumericalAttributes = [
	'cp','atkiv','defiv','stmiv','level','dex',
	'baseAtk','baseDef','baseStm', 'rating',
	'power', 'duration', 'dws', 'energyDelta', 'value'
];

var DialogStack = [];

function round(value, numDigits){
	var multiplier = Math.pow(10, parseInt(numDigits) || 0);
	return Math.round(value * multiplier) / multiplier;
}

function createElement(type, innerHTML, attrsAndValues){
	var e = document.createElement(type);
	e.innerHTML = innerHTML;
	for (var attr in attrsAndValues){
		e.setAttribute(attr, attrsAndValues[attr]);
	}
	return e;
}

function searchParent(node, predicate){
	while (node.parentNode){
		node = node.parentNode;
		if (predicate(node)){
			return node;
		}
	}
}

function searchChild(node, predicate){
	if (predicate(node)){
		return node;
	}
	for (let child of node.children){
		let searchResult = searchChild(child, predicate);
		if (searchResult){
			return searchResult;
		}
	}
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

function toTitleCase(str){
	str = str || "";
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function leftMerge(objL, objR, attrs){
	if (attrs){
		attrs.forEach(function(attr){
			objL[attr] = objR[attr];
		});
			
	}else{
		for (var attr in objR)
			objL[attr] = objR[attr];
	}
}

// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function jsonToURI(json){ return encodeURIComponent(JSON.stringify(json)); }

function uriToJSON(urijson){ return JSON.parse(decodeURIComponent(urijson)); }



function Predicate(pd, parent, attr){
	if (typeof pd == typeof "")
		return createComplexPredicate(pd, parent, attr);
	else
		return pd;
}

function parseNumericalRange(str){
	if (!isNaN(parseFloat(str))){
		return ['value', str];
	}
	for (var i = 0; i < acceptedNumericalAttributes.length; i++){
		var attr = acceptedNumericalAttributes[i];
		if (str.substring(0, attr.length) == attr.toLowerCase())
			return [attr, str.slice(attr.length)];
	};
	return ['', str];
}

function createSimplePredicate(str, parent, attr){
	str = str.trim();
	
	var numericalParameters = parseNumericalRange(str.toLowerCase());
	if (numericalParameters[0] != ''){ // Match numerical attributes
		var bounds = numericalParameters[1].split((numericalParameters[1].includes('~') ? '~' : '-'));
		const num_attr = numericalParameters[0], 
			LBound = parseFloat(bounds[0]) || parseFloat(parent[attr]) || -1000000, 
			UBound = parseFloat(bounds[bounds.length-1]) || parseFloat(parent[attr]) || 1000000;
		return function(obj){
			return LBound <= obj[num_attr] && obj[num_attr] <= UBound;
		};
	}else if (Data.TypeEffectiveness.hasOwnProperty(str.toLowerCase()) || str.toLowerCase() == 'none'){ // Match types
		const str_const = str.toLowerCase();
		return function(obj){
			return ([obj.pokeType, obj.pokeType1, obj.pokeType2].includes(str_const));
		};
	}else if (str[0] == '@'){ // Match moves
		str = str.slice(1).toLowerCase();
		if (str.substring(0,3) == '<f>'){
			const str_const = str.slice(3).trim();
			return function(obj){
				var fmove = (typeof obj.fmove == typeof "" ? getEntry(obj.fmove, Data.FastMoves) : obj.fmove);
				if (fmove){
					return fmove.name.includes(str_const) || fmove.pokeType == str_const;
				}
				return false;
			};
		}else if (str.substring(0,3) == '<c>'){
			const str_const = str.slice(3).trim();
			return function(obj){
				var cmove = (typeof obj.cmove == typeof "" ? getEntry(obj.cmove, Data.ChargedMoves) : obj.cmove);
				if (cmove){
					return cmove.name.includes(str_const) || cmove.pokeType == str_const;
				}
				return false;
			};
		}else if (str.substring(0,3) == '<*>'){
			const pred_f = createSimplePredicate('@<f>' + str.slice(3)), pred_c = createSimplePredicate('@<c>' + str.slice(3));
			return function(obj){
				return pred_f(obj) && pred_c(obj);
			};
		}else{
			const pred_f = createSimplePredicate('@<f>' + str), pred_c = createSimplePredicate('@<c>' + str);
			return function(obj){
				return pred_f(obj) || pred_c(obj);
			};
		}
	}else if (str[0] == '$'){ // Box
		const str_const = str.slice(1).trim();
		return function(obj){
			return obj.box_index >= 0 && (!str_const || obj.nickname.includes(str_const));
		};
	}else if (str[0] == '%'){ // Raid Boss
		const str_const = str.slice(1);
		return function(obj){
			return obj.raidMarker && obj.raidMarker.includes(str_const);
		};
	}else if (str[0] == '+'){ // Evolutions
		const evolutions_const = getAllEvolutions(str.slice(1).trim().toLowerCase());
		return function(obj){
			return evolutions_const.includes(obj.name);
		};
	}else if (str.toLowerCase() == "current"){ // Current Move
		return function(obj){
			return parent[obj.moveType + "Moves"].includes(obj.name);
		};
	}else if (str.toLowerCase() == "legacy"){ // Legacy Move
		return function(obj){
			return parent[obj.moveType + "Moves_legacy"].includes(obj.name);
		};
	}else if (str.toLowerCase() == "exclusive"){ // Exclusive Move
		return function(obj){
			return parent[obj.moveType + "Moves_exclusive"].includes(obj.name);
		};
	}else{ // Match name/nickname/species
		const str_const = str.toLowerCase();
		return function(obj){
			if (obj.name && obj.name.includes(str_const))
				return true;
			return obj.label && obj.label.toLowerCase().includes(str_const);
		}
	}
}

function parseNextToken(expression){
	var position = 0, token = '', hasEscaped = false, startsWithWhiteSpace = true;
	while(position < expression.length){
		var c = expression[position];
		if (c == '^'){
			if (hasEscaped){
				c += '^';
				hasEscaped = false;
			}else{
				hasEscaped = true;
			}
		}else if (c == '(' || c == ')' || LOGICAL_OPERATORS.hasOwnProperty(c)){
			if (startsWithWhiteSpace || hasEscaped)
				token += c;
			if (!hasEscaped)
				break;
			hasEscaped = false;
		}else{
			token += c;
			hasEscaped = false;
			if (c != ' ')
				startsWithWhiteSpace = false;
		}
		position++;
	}
	return {
		'token': token,
		'expression': expression.slice(Math.max(position, token.length))
	};
}

function createComplexPredicate(expression, parent, attr){
	var tokensArr = [], stack = [];
	expression = expression.trim();
	
	// 1. Convert infix to postfix
	while (expression.length > 0){
		var parsedResult = parseNextToken(expression);
		var token = parsedResult.token.trim();
		expression = parsedResult.expression;

		if (token == '('){
			stack.push(token);
		}else if (token == ')'){
			while (stack.length && stack[stack.length-1] != '(')
				tokensArr.push(stack.pop());
			stack.pop();
		}else if (LOGICAL_OPERATORS.hasOwnProperty(token)){
			while(stack.length && stack[stack.length-1] != '(' && LOGICAL_OPERATORS[token] <= LOGICAL_OPERATORS[stack[stack.length-1]])
				tokensArr.push(stack.pop());
			stack.push(token);
		}else
			tokensArr.push(token);
	}
	while (stack.length > 0){
		tokensArr.push(stack.pop());
	}

	// 2. Evaluate the postfix expression using a stack
	for (var i = 0; i < tokensArr.length; i++){
		var token = tokensArr[i];
		if (LOGICAL_OPERATORS.hasOwnProperty(token)){
			const pred1 = stack.pop();
			if (token == ',' || token == ':' || token == ';'){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) || pred2(obj);
				});
			}else if (token == '&' || token == '|'){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) && pred2(obj);
				});
			}else if (token == '!'){
				stack.push(function(obj){
					return !pred1(obj);
				});
			}
		}else{
			stack.push(createSimplePredicate(token, parent, attr));
		}
	}
	
	if (stack.length > 0)
		return stack[0];
	else
		return function(obj){return true;}
}


function getAllEvolutions(name){
	var evolutions = [name], pkm = getEntry(name, Data.Pokemon);
	if (pkm){
		for (evo of pkm.evolutions){
			evolutions = evolutions.concat(getAllEvolutions(evo));
		}
	}
	return evolutions;
}


function getPokemonOptions(userIndex){
	var speciesOptions = [];
	if (0 <= userIndex && userIndex < Data.Users.length){
		var userBox = Data.Users[userIndex].box;
		for (var i = 0; i < userBox.length; i++){
			userBox[i].box_index = i;
			userBox[i].label = userBox[i].nickname;
			speciesOptions.push(userBox[i]);
		}
	}
	return speciesOptions.concat(Data.Pokemon);
}


function createPokemonNameInput(){
	var nameInput = createElement('input', '', {
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', 
		style: 'background-image: url(' + getPokemonIcon({dex: 0}) + ')', name: "pokemon-name"
	});
	$( nameInput ).autocomplete({
		minLength : 0,
		delay : 200,
		source : function(request, response){
			var user_idx = 0;
			// TODO: Dynamically bind user ID to player node
			var searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term), matches = [];
			matches = getPokemonOptions(user_idx).filter(Predicate(searchStr));
			response(matches);
		},
		select : function(event, ui){
			var pkmInfo = ui.item;
			ui.item.value = toTitleCase(ui.item.name);
			if (pkmInfo.box_index >= 0){
				let pokemonNode = $$$(this).parent("pokemon").node;
				write(pokemonNode, pkmInfo);
				formatting(pokemonNode);
			}
			this.setAttribute('style', 'background-image: url(' + pkmInfo.icon + ')');
			// TODO: Set raid tier
		},
		change : function(event, ui){
			if (!ui.item){ // Change not due to selecting an item from menu
				let idx = getEntryIndex(this.value.toLowerCase(), Data.Pokemon);
				this.setAttribute('style', 'background-image: url(' + getPokemonIcon({index: idx}) + ')');
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompletePokemonItem;

	return nameInput;
}

function createPokemonMoveInput(moveType){
	var placeholder_ = "", attr_ = "";
	if (moveType == "fast"){
		placeholder_ = "Fast Move";
		attr_ = "fmove";
	}else if (moveType == "charged"){
		placeholder_ = "Charged Move";
		attr_ = "cmove";
	}
	var moveInput = createElement('input', '', {
		type: 'text', placeholder: placeholder_, name: "pokemon-" + attr_,
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	$( moveInput ).autocomplete({
		minLength : 0,
		delay : 0,
		source: function(request, response){
			let moveNode = null;
			for (var i = 0; i < this.bindings.length; i++){
				if (this.bindings[i].name == "pokemon-fmove" || this.bindings[i].name == "pokemon-cmove"){
					moveNode = this.bindings[i];
				}
			}
			let pokemonInstance = getEntry($$$(moveNode).parent("pokemon").child("pokemon-name").val().trim().toLowerCase(), Data.Pokemon);
			let searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term), matches = [];
			if (searchStr == '' && pokemonInstance){ //special case
				searchStr = 'current, legacy, exclusive';
			}
			matches = Data[toTitleCase(moveType) + "Moves"].filter(Predicate(searchStr, pokemonInstance, attr_));
			response(matches);
		},
		select: function(event, ui) {
			this.setAttribute('style', 'background-image: url(' + ui.item.icon + ')');
		},
		change: function(event, ui) {
			if (!ui.item){ // Change not due to selecting an item from menu
				let idx = getEntryIndex(this.value.trim().toLowerCase(), Data[toTitleCase(moveType) + "Moves"]);
				this.setAttribute('style', 'background-image: url(' + getTypeIcon({mtype: moveType, index: idx}) + ')');
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	moveInput.onfocus = function(){$(this).autocomplete("search", "");};
	
	return moveInput;
}


function addFilterToFooter(table){
	table.columns().flatten().each(function (colIdx){
		table.column(colIdx).footer().innerHTML = "";
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).footer()
			)
			.on( 'change', function (){
				table.column( colIdx ).search( $(this).val() ).draw();
			});
		
		select.append( $("<option value=' '>*</option>") );
		table.column( colIdx ).cache( 'search' ).sort().unique()
			.each( function ( d ) {
				var op = document.createElement('option');
				op.value = d;
				op.innerHTML = d;
				select.append(op);
			});
	});
}


function sendFeedback(msg, appending, feedbackElementId){
	var feedbackEl = document.getElementById(feedbackElementId || "feedback_message");
	if (feedbackEl){
		if (appending){
			feedbackEl.innerHTML += '<p>' + msg + '</p>';
		}else
			feedbackEl.innerHTML = '<p>' + msg + '</p>';
	}
}

function sendFeedbackDialog(msg, dialogTitle){
	var d = $(createElement('div', msg, {
		title: dialogTitle || document.title
	})).dialog({
		buttons: {
			"OK": function(){
				$(this).dialog("close");
			}
		}
	});
	DialogStack.push(d);
	return d;
}

function getTableContent(dt){
	var content = [];
	var hrow = dt.table().header().children[0];
	let r = [];
	for (let child of hrow.children){
		r.push(child.innerText.trim());
	}
	content.push(r);
	var data = dt.rows().data();
	for (var i = 0; i < data.length; i++){
		let r = [];
		for (var j = 0; j < data[i].length; j++){
			r.push(createElement("div", data[i][j]).innerText.trim());
		}
		content.push(r);
	}
	return content;
}


function copyTableToClipboard(elementId){
	var copyStr = "";
	var content = getTableContent($("#" + elementId).DataTable());
	for (var i = 0; i < content.length; i++){
		copyStr += content[i].join("\t") + "\n";
	}
	copyToClipboard(copyStr);
	sendFeedbackDialog("Table has been copied to clipboard");
}

function exportTableToCSV(elementId, filename){
	filename = filename || "table.csv";
	let csvStr = "data:text/csv;charset=utf-8,";
	var content = getTableContent($("#" + elementId).DataTable());
	for (var i = 0; i < content.length; i++){
		csvStr += content[i].join(",") + "\r\n";
	}
	var encodedUri = encodeURI(csvStr);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", filename);
	link.innerHTML= "Click Here to download";
	document.body.appendChild(link);
	link.click();
}

function createIconLabelDiv(iconURL, label, iconClass){
	return "<div><span class='" + iconClass + "'>" + "<img src='"+iconURL+"'></img></span><span class='apitem-label'>" + label + "</span></div>";
}

function createIconLabelSpan(icon, label, cls){
	return '<span class="input-with-icon ' + cls + '" style="background-image: url(' + icon + ')">' + label + '</span>';
}

function _renderAutocompletePokemonItem(ul, item){
    return $( "<li>" )
        .append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-pokemon-icon') + "</div>" )
        .appendTo( ul );
}

function _renderAutocompleteMoveItem(ul, item){
    return $( "<li>" )
		.append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-move-icon') + "</div>" )
        .appendTo( ul );
}