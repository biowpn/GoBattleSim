
var GameMaster = {};
var currentMatrix = [[]];
var currentRowPokemon = [];
var currentColPokemon = [];
var currentRowStrategy = [];
var currentColStrategy = [];
var currentMatrixIsSymmetric = false;

var example_kanto_starters = [
    ['name', 'fmove', 'cmove', 'cmove2', 'cp'],
    ['Venusaur', 'Vine Whip', 'Frenzy Plant', 'Sludge Bomb', '1500'],
    ['Charizard', '*', 'Blast Burn', 'Dragon Claw', '1500'],
    ['Blastoise', '*', 'Hydro Cannon', '*', '1500']
];


function battleMatrixInit() {

    GBS.mode("pvp");

    $("#button-run").on("click", battleMatrixSubmit);

    $("#pokemon-input-dialog").dialog({
        autoOpen: false
    });
    $("#pokemon-input-dialog-opener").on("click", function () {
        $("#pokemon-input-dialog").dialog("open");
    });
    autocomplete_pokemon_name("#pokemon-name", "#pokemon-input-dialog");
    autocomplete_move_name("#pokemon-fmove", "#pokemon-input-dialog");
    autocomplete_move_name("#pokemon-cmove", "#pokemon-input-dialog");
    autocomplete_move_name("#pokemon-cmove2", "#pokemon-input-dialog");
    $("#pokemon-input-dialog-add-row").on("click", function () {
        var rawInput = $("#battleMatrix-input-row").val().trim().split('\n');
        var deli = rawInput[0].includes('\t') ? '\t' : ',';
        var attributes = parseCSVRow(rawInput[0], deli, '"');
        var row_new = Array(attributes.length);
        for (var i = 0; i < attributes.length; ++i) {
            row_new[i] = $("#pokemon-" + attributes[i]).val() || "";
        }
        rawInput.push(row_new.join(deli));
        $("#battleMatrix-input-row").val(rawInput.join('\n'));
    });
    $("#pokemon-input-dialog-add-col").on("click", function () {
        var rawInput = $("#battleMatrix-input-col").val().trim().split('\n');
        var deli = rawInput[0].includes('\t') ? '\t' : ',';
        var attributes = parseCSVRow(rawInput[0], deli, '"');
        var row_new = Array(attributes.length);
        for (var i = 0; i < attributes.length; ++i) {
            row_new[i] = $("#pokemon-" + attributes[i]).val() || "";
        }
        rawInput.push(row_new.join(deli));
        $("#battleMatrix-input-col").val(rawInput.join('\n'));
    });
    $("#pokemon-input-dialog-close").on("click", function () {
        $("#pokemon-input-dialog").dialog("close");
    });

    $("#example-kanto-starters").on("click", function () {
        $("#battleMatrix-input-row").val(example_kanto_starters.map(x => x.join('\t')).join('\n'));
    });

    $("#pokemon-input-duplicate").on("click", function () {
        $("#battleMatrix-input-col").val($("#battleMatrix-input-row").val());
    });
    $("#pokemon-input-swap").on("click", function () {
        var temp = $("#battleMatrix-input-row").val();
        $("#battleMatrix-input-row").val($("#battleMatrix-input-col").val())
        $("#battleMatrix-input-col").val(temp);
    });


    $("#battleMatrix-raw-output").on("change", function () {
        displayMatrix(currentMatrix, currentRowPokemon, currentColPokemon, "#battleMatrix-output");
    });

    $("#battleMatrix-augmented").on("change", function () {
        if ($("#battleMatrix-raw-output")[0].checked) {
            displayMatrix(currentMatrix, currentRowPokemon, currentColPokemon, "#battleMatrix-output");
        }
    });


    $("#battleMatrix-show-output-pokemon-row").on("change", function () {
        if (this.checked) {
            $("#battleMatrix-output-pokemon-row").show();
        } else {
            $("#battleMatrix-output-pokemon-row").hide();
        }
    });
    $("#battleMatrix-show-output-pokemon-col").on("change", function () {
        if (this.checked) {
            $("#battleMatrix-output-pokemon-col").show();
        } else {
            $("#battleMatrix-output-pokemon-col").hide();
        }
    });
    $("#battleMatrix-show-output").on("change", function () {
        if (this.checked) {
            $("#battleMatrix-output").show();
        } else {
            $("#battleMatrix-output").hide();
        }
    });
    $("#battleMatrix-show-output-strategy-row").on("change", function () {
        if (this.checked) {
            if (currentColStrategy.length + currentRowStrategy.length == 0) {
                solveBattleMatrix();
                displayStrategy(currentRowStrategy, currentRowPokemon, "#battleMatrix-output-strategy-row");
                displayStrategy(currentColStrategy, currentColPokemon, "#battleMatrix-output-strategy-col");
            }
            $("#battleMatrix-output-strategy-row").show();
        } else {
            $("#battleMatrix-output-strategy-row").hide();
        }
    });
    $("#battleMatrix-show-output-strategy-col").on("change", function () {
        if (this.checked) {
            if (currentColStrategy.length + currentRowStrategy.length == 0) {
                solveBattleMatrix();
                displayStrategy(currentRowStrategy, currentRowPokemon, "#battleMatrix-output-strategy-row");
                displayStrategy(currentColStrategy, currentColPokemon, "#battleMatrix-output-strategy-col");
            }
            $("#battleMatrix-output-strategy-col").show();
        } else {
            $("#battleMatrix-output-strategy-col").hide();
        }
    });

    $("#button-download-pokemon").on("click", function () {
        $("#download-pokemon-container").toggle(300);
    });
    $("#button-download-pokemon-row").on("click", function () {
        makeAndDownloadCSV(convertToTableForm(currentRowPokemon), "row_pokemon.csv");
        $("#download-pokemon-container").toggle(300);
    });
    $("#button-download-pokemon-col").on("click", function () {
        makeAndDownloadCSV(convertToTableForm(currentColPokemon), "col_pokemon.csv");
        $("#download-pokemon-container").toggle(300);
    });

    $("#button-download-matrix").on("click", function () {
        $("#download-matrix-container").toggle(300);
    });
    $("#button-download-matrix-matrix").on("click", function () {
        if ($("#battleMatrix-augmented")[0].checked) {
            makeAndDownloadCSV(appendNameRowsAndCols(currentMatrix, currentRowPokemon, currentColPokemon), "matrix_augmented.csv");
        } else {
            makeAndDownloadCSV(currentMatrix, "matrix.csv");
        }
        $("#download-matrix-container").toggle(300);
    });
    $("#button-download-matrix-tcf").on("click", function () {
        if ($("#battleMatrix-augmented")[0].checked) {
            makeAndDownloadCSV(convertToThreeColumnForm(currentMatrix, currentRowPokemon, currentColPokemon), "matrix_augmented_3col.csv");
        } else {
            makeAndDownloadCSV(convertToThreeColumnForm(currentMatrix), "matrix_3col.csv");
        }
        $("#download-matrix-container").toggle(300);
    });
}

function parseCSVRow(str, deli, echar) {
    var data = [];
    var word = "";
    var escaped = false;
    for (var i = 0; i < str.length; i++) {
        if (str[i] == echar) {
            if (escaped) {
                data.push(word);
                word = "";
                escaped = false;
                ++i;
            } else {
                escaped = true;
            }
        } else if (str[i] == deli && !escaped) {
            data.push(word);
            word = "";
        } else {
            word += str[i];
        }
    }
    data.push(word);
    return data;
}

function getEntry(name, arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].name == name)
            return arr[i];
    }
}

function convertToTableForm(pkm_list) {
    var pkm_attrs = [];
    if (pkm_list.length > 0) {
        pkm_attrs = Object.keys(pkm_list[0]);
    } else {
        return [[]];
    }
    var tableForm = [["index"].concat(pkm_attrs)];
    for (var i = 0; i < pkm_list.length; i++) {
        var row = [i + 1];
        for (var j = 0; j < pkm_attrs.length; j++) {
            row.push(pkm_list[i][pkm_attrs[j]] || "");
        }
        tableForm.push(row);
    }
    return tableForm;
}

function convertToThreeColumnForm(matrix, row_pkm, col_pkm) {
    if (Array.isArray(row_pkm) && Array.isArray(col_pkm)) {
        var row_pkm_acr = makePokemonAcronyms(row_pkm);
        var col_pkm_acr = makePokemonAcronyms(col_pkm);
        var matrix_tcf = [["row_pkm", "col_pkm", "battle_score"]];
        for (var i = 0; i < row_pkm.length; ++i) {
            for (var j = 0; j < col_pkm.length; ++j) {
                matrix_tcf.push([row_pkm_acr[i], col_pkm_acr[j], matrix[i][j]]);
            }
        }
        return matrix_tcf;
    } else {
        var matrix_tcf = [["row_index", "col_index", "battle_score"]];
        for (var i = 0; i < matrix.length; ++i) {
            for (var j = 0; j < matrix[i].length; ++j) {
                matrix_tcf.push([i + 1, j + 1, matrix[i][j]]);
            }
        }
        return matrix_tcf;
    }
}

function makePokemonAcronyms(pkm_list) {
    var pkm_acr_list = [];
    for (var i = 0; i < pkm_list.length; ++i) {
        let name = toTitleCase(pkm_list[i].name || "");
        let fmove_acr = (pkm_list[i].fmove || "").split(" ").map(x => x[0].toUpperCase()).join("");
        let cmove_acr = (pkm_list[i].cmove || "").split(" ").map(x => x[0].toUpperCase()).join("");
        let cmove2_acr = (pkm_list[i].cmove2 || "").split(" ").map(x => x[0].toUpperCase()).join("");
        pkm_acr_list.push(fmove_acr + '.' + cmove_acr + '.' + cmove2_acr + ' ' + name);
    }
    return pkm_acr_list;
}

function makePokemonIconSpans(pkm_list) {
    var pkm_spans = [];
    for (var i = 0; i < pkm_list.length; ++i) {
        var pkm = pkm_list[i];
        var pkm_data = getEntry(pkm.name, GameMaster.Pokemon) || {};
        var span = $("<span>", {
            class: "input-with-icon species-input-with-icon",
            style: "background-image: url(" + pkm_data.icon + ")",
            title: pkm.fmove + "/" + pkm.cmove + (pkm.cmove2 ? "/" + pkm.cmove2 : "")
        });
        pkm_spans.push(span);
    }
    return pkm_spans;
}

function appendNameRowsAndCols(matrix, row_pkm, col_pkm) {
    var row_pkm_acr = makePokemonAcronyms(row_pkm);
    var col_pkm_acr = makePokemonAcronyms(col_pkm);
    var aug_matrix = [[""].concat(col_pkm_acr)];
    for (var i = 0; i < matrix.length; ++i) {
        aug_matrix.push([row_pkm_acr[i]].concat(matrix[i]));
    }
    return aug_matrix;
}

function makeAndDownloadCSV(arrayOfLines, filename) {
    filename = filename || "whatever.csv";
    var lineArray = [];
    //  lineArray = ["SEP=,"]; // For better compatiblity with Excel
    arrayOfLines.forEach(function (infoArray) {
        lineArray.push(infoArray.map(x => x.toString()).join(","));
    });
    var csvContent = lineArray.join("\n");

    var blob = new Blob([csvContent], {
        type: "application/csv;charset=utf-8;"
    });

    if (window.navigator.msSaveBlob) {
        // FOR IE BROWSER
        navigator.msSaveBlob(blob, filename);
    } else {
        // FOR OTHER BROWSERS
        var link = document.createElement("a");
        var csvUrl = URL.createObjectURL(blob);
        link.href = csvUrl;
        link.style = "visibility:hidden";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function makeAndDisplay(arrayOfLines, deli, textareaEl) {
    var lines = [];
    for (var i = 0; i < arrayOfLines.length; ++i) {
        lines.push(arrayOfLines[i].join(deli));
    }
    $(textareaEl).text(lines.join('\n'));
}


function displayPokemon(pkm_list, containerEl) {
    $(containerEl).empty();
    for (var i = 0; i < pkm_list.length; ++i) {
        var pkm = pkm_list[i];

        var pkm_data = getEntry(pkm.name, GameMaster.Pokemon) || {};
        var fmove_data = getEntry(pkm.fmove, GameMaster.PvEMoves) || {};
        var cmove_data = getEntry(pkm.cmove, GameMaster.PvEMoves) || {};
        var cmove2_data = {};
        if (pkm.cmove2) {
            cmove2_data = getEntry(pkm.cmove2, GameMaster.PvEMoves);
        }
        var pkm_row = $("<div>", { class: "row" });
        pkm_row.append($("<div>", { class: "col-sm-6 col-md-3" }).html(createIconLabelSpan(pkm_data.icon, pkm_data.label, "species-input-with-icon")));
        pkm_row.append($("<div>", { class: "col-sm-6 col-md-3" }).html(createIconLabelSpan(fmove_data.icon, fmove_data.label, "move-input-with-icon")));
        pkm_row.append($("<div>", { class: "col-sm-6 col-md-3" }).html(createIconLabelSpan(cmove_data.icon, cmove_data.label, "move-input-with-icon")));
        if (pkm.cmove2) {
            pkm_row.append($("<div>", { class: "col-sm-6 col-md-3" }).html(createIconLabelSpan(cmove2_data.icon, cmove2_data.label, "move-input-with-icon")));
        }
        $(containerEl).append(pkm_row);
    }
}

function displayMatrix(matrix, row_pkm, col_pkm, containerEl) {
    $(containerEl).empty();
    if ($("#battleMatrix-raw-output")[0].checked) {
        var textarea = $("<textarea>", {
            class: "form-control rounded-0",
            rows: "10"
        });
        $(containerEl).append(textarea);
        if ($("#battleMatrix-augmented")[0].checked) {
            matrix = appendNameRowsAndCols(matrix, row_pkm, col_pkm);
        }
        makeAndDisplay(matrix, '\t', textarea);
        return;
    }

    var row_pkm_spans = makePokemonIconSpans(row_pkm);
    var col_pkm_spans = makePokemonIconSpans(col_pkm);
    var table = $("<table>", {
        class: "center_stuff"
    });
    var firstRow = $("<tr>");
    firstRow.append($("<td></td>"));
    for (var i = 0; i < col_pkm_spans.length; ++i) {
        firstRow.append($("<td>").append(col_pkm_spans[i]));
    }
    table.append(firstRow);
    for (var i = 0; i < row_pkm.length; ++i) {
        var row = $("<tr>").append($("<td>").append(row_pkm_spans[i]));
        for (var j = 0; j < col_pkm.length; ++j) {
            var score = Math.round(matrix[i][j] * 100) / 100;
            var color_hsl = "hsl(0, 0%, 100%)";
            if (score < 0) {
                color_hsl = "hsl(0, 100%, " + (70 + (score + 1) * 30) + "%)";
            } else if (score > 0) {
                color_hsl = "hsl(120, 100%, " + (70 + (1 - score) * 30) + "%)";
            }
            row.append(
                $("<td>")
                    .text(score)
                    .css("text-align", "center")
                    .css("background-color", color_hsl)
            );
        }
        table.append(row);
    }
    $(containerEl).append(table);
}


function displayStrategy(strategy, pkm_list, containerEl) {
    $(containerEl).empty();
    if (!Array.isArray(strategy)) {
        $(containerEl).text(strategy);
        return;
    }
    var pkm_spans = makePokemonIconSpans(pkm_list);
    var pkm_acrs = makePokemonAcronyms(pkm_list);
    var table = $("<table>", {
        class: "center_stuff"
    });
    var firstRow = $("<tr>");
    firstRow.append($("<th>Pokemon</th>")).append($("<th>Weight</th>"));
    table.append(firstRow);
    for (var i = 0; i < strategy.length; ++i) {
        if (strategy[i] == 0) {
            continue;
        }
        var row = $("<tr>");
        row.append($("<td>").append(pkm_spans[i]).append(pkm_acrs[i]));
        row.append($("<td>").append(Math.round(strategy[i] * 10000) / 100 + "%"));
        table.append(row);
    }
    $(containerEl).append(table);
}

function try_parse(v) {
    if (isNaN(parseFloat(v))) {
        return v;
    } else {
        return parseFloat(v);
    }
}

function directOrBatch(dbname, query, species) {
    var direct_match = GM.get(dbname, query.toLowerCase(), species);
    if (direct_match) {
        return [direct_match];
    }
    else {
        if (query[0] == "*") {
            query = query.substr(1);
        }
        if (species && query.length == 0) {
            query = "current, legacy, exclusive";
        }
        return GM.select(dbname, query, species);
    }
}

/**
 * 
 * @param {*} pkm wild card fields: {name, fmove, cmove, cmove2}
 */
function batchPokemon(pkm) {
    var combs = [];

    var species_matches = directOrBatch("pokemon", pkm.name);
    for (let species of species_matches) {
        let pkm_basic = {};
        Object.assign(pkm_basic, pkm);
        Object.assign(pkm_basic, species);
        let pkm2 = new PokemonInput(pkm_basic);

        var fmove_matches = directOrBatch("fast", pkm.fmove, species);
        var cmove_matches = directOrBatch("charge", pkm.cmove, species);
        var cmove2_matches = directOrBatch("charge", pkm.cmove2, species);
        for (let fmove of fmove_matches) {
            for (let cmove of cmove_matches) {
                if (cmove2_matches) {
                    for (let cmove2 of cmove2_matches) {
                        if (cmove2.name == cmove.name) {
                            continue;
                        }
                        let p = Object.assign({}, pkm2);
                        p.fmove = generateEngineMove(fmove);
                        p.cmoves = [cmove, cmove2].map(generateEngineMove);
                        combs.push(p);
                    }
                }
                else {
                    let p = Object.assign({}, pkm2);
                    p.fmove = generateEngineMove(fmove);
                    p.cmoves = [cmove].map(generateEngineMove);
                    combs.push(p);
                }
            }
        }
    }

    return combs;
}

function parsePokemonPool(str) {
    var rawRows = str.trim().split("\n");
    var deli = rawRows[0].includes('\t') ? '\t' : ',';
    var attributes = parseCSVRow(rawRows[0], deli, '"');
    var pool = [];
    for (var i = 1; i < rawRows.length; i++) {
        var rowData = parseCSVRow(rawRows[i], deli, '"');
        var pokemon = {};
        for (var j = 0; j < attributes.length; j++) {
            pokemon[attributes[j]] = try_parse((rowData[j] || ""));
        }
        pool = pool.concat(batchPokemon(pokemon));
    }
    return pool;
}

function solveBattleMatrix() {
    var m = currentRowPokemon.length;
    var n = currentColPokemon.length;
    var doSolve = true;
    if (m * n >= 128 * 128) {
        doSolve = confirm("The matrix is quite large and might take some time to solve. Proceed?");
    }
    if (doSolve) {
        var game = new Game(new DoubleArray2D(currentMatrix), m, n);
        game.solve();
        var rowStrat = new DoubleArray1D(Array(m).fill(0));
        var colStrat = new DoubleArray1D(Array(n).fill(0));
        game.optstrat(true, rowStrat.ptr);
        game.optstrat(false, colStrat.ptr);
        currentRowStrategy = [...Array(m).keys()].map(i => rowStrat.at(i));
        currentColStrategy = [...Array(n).keys()].map(j => colStrat.at(j));
    }
}

function battleMatrixSubmit() {
    var rowPokemon = parsePokemonPool($("#battleMatrix-input-row").val());
    var colPokemon = parsePokemonPool($("#battleMatrix-input-col").val());
    currentMatrixIsSymmetric = colPokemon.length == 0;

    var reqInput = {
        "battleMode": "battlematrix",
        "rowPokemon": rowPokemon,
        "colPokemon": colPokemon,
        "avergeByShield": $("#battleMatrix-enum-shields")[0].checked
    };

    console.log(reqInput);

    GBS.prepare(reqInput);
    GBS.run();
    console.log(GBS.collect());

    // $("#running-screen").show();

    return;
}

function displayBattleMatrixOutput(reqOutput) {

    currentRowPokemon = reqOutput["rowPokemon"];
    currentColPokemon = reqOutput["colPokemon"];
    currentMatrix = reqOutput["matrix"];
    currentRowStrategy = [];
    currentColStrategy = [];

    if (currentMatrixIsSymmetric) {
        for (var i = 0; i < currentMatrix.length; ++i) {
            currentMatrix[i][i] = 0;
        }
    }

    if (currentRowPokemon.length <= 128) {
        displayPokemon(currentRowPokemon, "#battleMatrix-output-pokemon-row");
    } else {
        $("#battleMatrix-output-pokemon-row").empty();
        $("#battleMatrix-output-pokemon-row").text("Too many Pokemon to display. Please download as .csv");
    }

    if (currentColPokemon.length <= 128) {
        displayPokemon(currentColPokemon, "#battleMatrix-output-pokemon-col");
    } else {
        $("#battleMatrix-output-pokemon-col").empty();
        $("#battleMatrix-output-pokemon-col").text("Too many Pokemon to display. Please download as .csv");
    }

    if (currentRowPokemon.length <= 128 && currentColPokemon.length <= 128) {
        displayMatrix(currentMatrix, currentRowPokemon, currentColPokemon, "#battleMatrix-output");
    } else {
        $("#battleMatrix-output").empty();
        $("#battleMatrix-output").text("Matrix too large to display. Please download as .csv");
    }

    // Solve the game if user toggles optimal strategy on
    if ($("#battleMatrix-show-output-strategy-col")[0].checked || $("#battleMatrix-show-output-strategy-row")[0].checked) {
        solveBattleMatrix();
        displayStrategy(currentRowStrategy, currentRowPokemon, "#battleMatrix-output-strategy-row");
        displayStrategy(currentColStrategy, currentColPokemon, "#battleMatrix-output-strategy-col");
    }

    $("#button-download-pokemon").attr("disabled", false);
    $("#button-download-matrix").attr("disabled", false);
    $("#running-screen").hide();

}

function autocomplete_pokemon_name(el) {
    $(el).autocomplete({
        minLength: 0,
        delay: 200,
        source: function (request, response) {
            var matches = [];
            if (GameMaster.Pokemon) {
                for (var i = 0; i < GameMaster.Pokemon.length; ++i) {
                    let pkm = GameMaster.Pokemon[i];
                    if (pkm.name.includes(request.term.toLowerCase())) {
                        matches.push(pkm);
                    }
                }
            }
            response(matches);
        },
        select: function (event, ui) {
            $(el).css("background-image", "url(" + ui.item.icon + ')');
        }
    }).autocomplete("instance")._renderItem = _renderAutocompletePokemonItem;
}


function autocomplete_move_name(el, container) {
    var moveType = $(el).attr("name").includes("fmove") ? "fast" : "charged";
    $(el).autocomplete({
        minLength: 0,
        delay: 200,
        appendTo: $(container),
        source: function (request, response) {
            var matches = [];
            if (request.term == "") {
                var id_parts = $(el).attr("id").split("-");
                var id_prefix = id_parts.slice(0, id_parts.length - 1).join('-');
                var pkm_name = $("#" + id_prefix + "-name").val().toLowerCase();
                for (var i = 0; i < GameMaster.Pokemon.length; ++i) {
                    let pkm = GameMaster.Pokemon[i];
                    if (pkm.name == pkm_name) {
                        let mpname = moveType + "Moves";
                        let movepool = pkm[mpname].concat(pkm[mpname + "_legacy"] || []);
                        for (var j = 0; j < GameMaster.PvEMoves.length; ++j) {
                            let move = GameMaster.PvEMoves[j];
                            if (movepool.includes(move.name)) {
                                matches.push(move);
                            }
                        }
                        break;
                    }
                }
                if (matches.length == 0) {
                    matches = GameMaster.PvEMoves.filter(x => x.movetype == moveType);
                }
            } else {
                for (var i = 0; i < GameMaster.PvEMoves.length; ++i) {
                    let move = GameMaster.PvEMoves[i];
                    if (move.name.includes(request.term.toLowerCase())) {
                        matches.push(move);
                    }
                }
            }
            response(matches);
        },
        select: function (event, ui) {
            $(el).css("background-image", "url(" + ui.item.icon + ')');
        }
    }).autocomplete("instance")._renderItem = _renderAutocompleteMoveItem;

    $(el).on("focus", function (event) {
        $(el).autocomplete("search", "");
    });

}
