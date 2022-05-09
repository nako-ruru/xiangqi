

// 默认路径为本程序的路径
vschess.defaultPath = "vschess/";
vschess.defaultOptions.globalCSS = vschess.defaultPath + "global.css";


vschess.defaultOptions.startTips = ["蓝色的着法含有变着"];
vschess.defaultOptions.recommendList = [];


// 创建编辑局面区域结束编辑按钮
vschess.load.prototype.createEditEndButton = function(){
    var _this = this;
    this.editEndButton = $('<button type="button" class="vschess-button vschess-tab-body-edit-end-button" style="display: none">\u786e \u5b9a</button>');
    this.editEndButton.appendTo(this.editArea);

    this.editEndButton.bind(this.options.click, function(){
        if (!_this.confirm("\u786e\u5b9a\u4f7f\u7528\u65b0\u7684\u5c40\u9762\u5417\uff1f\u5f53\u524d\u68cb\u8c31\u4f1a\u4e22\u5931\uff01")) {
            return false;
        }

        var fen				= vschess.situationToFen(_this.editSituation);
        var fenRound		= vschess.roundFen(fen);
        var errorList		= vschess.checkFen(fen);
        var errorListRound	= vschess.checkFen(fenRound);
        var turn = 0;

        if (errorList.length > errorListRound.length) {
            errorList = errorListRound;
            fen = fenRound;
            turn = 3;
        }

        if (errorList.length > 1) {
            var errorMsg = ["\u5f53\u524d\u5c40\u9762\u51fa\u73b0\u4e0b\u5217\u9519\u8bef\uff1a\n"];

            for (var i = 0; i < errorList.length; ++i) {
                errorMsg.push(i + 1, ".", errorList[i], i === errorList.length - 1 ? "\u3002" : "\uff1b\n");
            }

            alert(errorMsg.join(""));
        }
        else if (errorList.length > 0) {
            alert(errorList[0] + "\u3002");
        }
        else {
            _this.hideNodeEditModule();
            _this.hideEditModule();
            _this.showEditStartButton();
            _this.editTextarea.val("");
            _this.setNode({ fen: fen, comment: "", next: [], defaultIndex: 0 });
            _this.rebuildSituation();
            _this.setBoardByStep(0);
            _this.refreshMoveSelectListNode();
            _this.chessInfo = {};
            _this.insertInfoByCurrent();
            _this.refreshInfoEditor();
            _this.rebuildExportAll();
            _this.setExportFormat();
            _this.setTurn(turn);
            _this.setSaved(true);
        }
    });

    return this;
};

// 创建编辑局面区域棋子容器
vschess.load.prototype.createEditPieceArea = function(){
    var _this = this;
    var editPieceNameList = "RNBAKCP*rnbakcp";
    this.editPieceArea = $('<div class="vschess-tab-body-edit-area" style="display: none"></div>');
    this.editArea.append(this.editPieceArea);
    this.editPieceList = {};

    for (var i = 0; i < editPieceNameList.length; ++i) {
        var k = editPieceNameList.charAt(i);

        if (k === "*") {
            this.editPieceArea.append('<div class="vschess-piece-disabled"></div>');
        }
        else {
            this.editPieceList[k] = $('<div class="vschess-piece vschess-piece-' + k + '" draggable="true"><span></span></div>');
            this.editPieceList[k].appendTo(this.editPieceArea);
        }
    }

    this.editPieceArea.bind("dragover", function(e){
        e.preventDefault();
        return true;
    });

    this.editPieceArea.bind("drop", function(e){
        _this.editRemovePiece(_this.dragPiece);
        _this.fillEditBoard();
        var currentFen = vschess.situationToFen(_this.editSituation);
        _this.editTips.val(currentFen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : currentFen);
    });

    $.each(this.editPieceList, function(i){
        var currentIndex = -vschess.f2n[i];

        this.bind(_this.options.click, function(e){
            _this.editRemoveSelect();

            if (_this.editSelectedIndex === -99) {
                $(this).addClass("vschess-piece-s");
                _this.editSelectedIndex = currentIndex;
            }
            else {
                if (_this.editSelectedIndex === currentIndex) {
                    _this.editSelectedIndex = -99;
                }
                else {
                    $(this).addClass("vschess-piece-s");
                    _this.editSelectedIndex = currentIndex;
                }
            }
        });

        this.bind("selectstart", function(e) {
            e.preventDefault();
            return false;
        });

        this.bind("dragstart", function(e){
            e.dataTransfer.setData("text", e.target.innerHTML);
            _this.dragPiece = currentIndex;
            _this.editRemoveSelect();
            _this.editSelectedIndex = -99;
        });

        this.bind("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            _this.editRemovePiece(_this.dragPiece);
            _this.fillEditBoard();
            var currentFen = vschess.situationToFen(_this.editSituation);
            _this.editTips.val(currentFen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : currentFen);
            return false;
        });
    });

    return this;
};


// 创建编辑局面区域输入框
vschess.load.prototype.createEditTextarea = function(){
    var _this = this;
    var UA = navigator.userAgent.toLowerCase(), contextMenu = "\u957f\u6309";
    !~UA.indexOf("android") && !~UA.indexOf("iph") && !~UA.indexOf("ipad") && (contextMenu = "\u53f3\u952e\u5355\u51fb");
    this.editTipsText = "\u70b9\u51fb\u53f3\u4fa7\u7684\u68cb\u5b50\u53ef\u5c06\u5176\u653e\u7f6e\u5728\u68cb\u76d8\u4e0a\uff0c" + contextMenu + "\u68cb\u76d8\u4e0a\u7684\u68cb\u5b50\u53ef\u4ee5\u5c06\u5176\u79fb\u9664\u3002";
    this.editTips = $('<input class="vschess-tab-body-edit-tips" value="' + this.editTipsText + '" style="display: none" readonly="readonly" />').appendTo(this.DOM);
    this.editTextarea = $('<textarea class="vschess-tab-body-edit-textarea" style="display: none"></textarea>').appendTo(this.editArea);

    this.editTextarea.bind("change" , function(){
        _this.fillEditBoardByText($(this).val());
        var currentFen = vschess.situationToFen(_this.editSituation);
        _this.editTips.val(currentFen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : currentFen);
    });

    this.editTextarea.bind("keydown", function(e){ e.ctrlKey && e.keyCode === 13 && _this.editTextarea.blur(); });
    return this;
};

// 创建编辑局面区域开始回合数编辑框
vschess.load.prototype.createEditStartRound = function(){
    var _this = this;
    this.editEditStartText = $('<div class="vschess-tab-body-edit-start-text" style="display: none">\u56de\u5408\uff1a</div>');
    this.editEditStartText.appendTo(this.editArea);
    this.editEditStartRound = $('<input type="number" class="vschess-tab-body-edit-start-round"  style="display: none"/>');
    this.editEditStartRound.appendTo(this.editArea);

    this.editEditStartRound.bind("change", function(){
        _this.editSituation[1] = vschess.limit($(this).val(), 1, Infinity, 1);
        _this.fillEditBoard();
        var currentFen = vschess.situationToFen(_this.editSituation);
        _this.editTips.val(currentFen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : currentFen);
    });

    return this;
};


// 创建编辑局面区域先行走子方选项
vschess.load.prototype.createEditStartPlayer = function(){
    var _this = this;
    this.editEditStartPlayer = $('<div class="vschess-tab-body-edit-start-player" style="display: none"><span></span></div>');
    this.editEditStartPlayer.appendTo(this.editArea);

    this.editEditStartPlayer.bind(this.options.click, function(){
        _this.editSituation[0] = 3 - _this.editSituation[0];
        _this.fillEditBoard();
        var currentFen = vschess.situationToFen(_this.editSituation);
        _this.editTips.val(currentFen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : currentFen);
    });

    return this;
};

vschess.load.prototype.createEditBoard = function () {
    var _this = this;
    this.editBoard = $('<div class="vschess-board-edit" style="display: none"></div>');
    this.DOM.append(this.editBoard);
    this.editBoard.append(new Array(91).join('<div class="vschess-piece"><span></span></div>'));
    this.editPiece = this.editBoard.children(".vschess-piece");

    return this;
}

let editEnded;

let board;


// 填充推荐开局列表
vschess.load.prototype.fillInRecommendList = function(classId){
    var _this = this;
    this.recommendList.empty();
    var list = this.recommendStartList[classId].fenList;

    for (var i = 0; i < list.length; ++i) {
        var recommendStart = $([
            '<li class="vschess-recommend-list-fen" data-fen="',
            list[i].fen,
            '" data-side="',
            list[i].side,
            '"><span>',
            i + 1,
            '.</span>',
            list[i].name,
            '</li>'
        ].join(""));
        this.recommendList.append(recommendStart);

        recommendStart.bind(this.options.click, function(){
            var fen = $(this).data("fen");
            _this.fillEditBoardByFen(fen);
            _this.editTips.val(fen.split(" ")[0] === vschess.blankFen.split(" ")[0] ? _this.editTipsText : fen);
            board = {
                fen: fen,
                side: $(this).data("side")
            }
            if (!_this.confirm("\u786e\u5b9a\u4f7f\u7528\u65b0\u7684\u5c40\u9762\u5417\uff1f\u5f53\u524d\u68cb\u8c31\u4f1a\u4e22\u5931\uff01")) {
                return false;
            }

            var fenRound		= vschess.roundFen(fen);
            var errorList		= vschess.checkFen(fen);
            var errorListRound	= vschess.checkFen(fenRound);
            var turn = 0;

            if (errorList.length > errorListRound.length) {
                errorList = errorListRound;
                fen = fenRound;
                turn = 3;
            }

            if (errorList.length > 1) {
                var errorMsg = ["\u5f53\u524d\u5c40\u9762\u51fa\u73b0\u4e0b\u5217\u9519\u8bef\uff1a\n"];

                for (var i = 0; i < errorList.length; ++i) {
                    errorMsg.push(i + 1, ".", errorList[i], i === errorList.length - 1 ? "\u3002" : "\uff1b\n");
                }

                alert(errorMsg.join(""));
            }
            else if (errorList.length > 0) {
                alert(errorList[0] + "\u3002");
            }
            else {
                _this.hideNodeEditModule();
                _this.hideEditModule();
                _this.showEditStartButton();
                _this.editTextarea.val("");
                _this.setNode({ fen: fen, comment: "", next: [], defaultIndex: 0 });
                _this.rebuildSituation();
                _this.setBoardByStep(0);
                _this.refreshMoveSelectListNode();
                _this.chessInfo = {};
                _this.insertInfoByCurrent();
                _this.refreshInfoEditor();
                _this.rebuildExportAll();
                _this.setExportFormat();
                _this.setSaved(true);

                vschess.defaultFen = fen;
                if(editEnded != null) {
                    editEnded();
                }
            }
        });
    }

    return this;
};


// 创建其他按钮
vschess.load.prototype.createEditOtherButton = function(){
    var _this = this;

    // 打开棋谱按钮
    var buttonId = "vschess-tab-body-edit-open-button-" + vschess.guid();
    this.editOpenButton = $('<label for="' + buttonId + '" class="vschess-button vschess-tab-body-edit-open-button">\u6253\u5f00\u68cb\u8c31</label>');
    this.editOpenButton.appendTo(this.editArea);
    this.editOpenFile = $('<input type="file" class="vschess-tab-body-edit-open-file" id="' + buttonId + '" />');
    this.editOpenFile.appendTo(this.editArea);

    this.editOpenFile.bind("change", function(){
        if (typeof FileReader === "function") {
            if (this.files.length) {
                var file = this.files[0];
                var ext = file.name.split(".").pop().toLowerCase();
                var reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function(){
                    if (!_this.confirm("\u786e\u5b9a\u6253\u5f00\u8be5\u68cb\u8c31\u5417\uff1f\u5f53\u524d\u68cb\u8c31\u4f1a\u4e22\u5931\uff01")) {
                        return false;
                    }

                    var RegExp    = vschess.RegExp();
                    var fileData  = new Uint8Array(this.result);
                    var chessData = vschess.join(fileData);

                    if (~vschess.binaryExt.indexOf(ext)) {
                        var chessNode = vschess.binaryToNode(fileData);
                        var chessInfo = vschess.binaryToInfo(fileData);
                    }
                    else {
                        !RegExp.ShiJia.test(chessData) && (chessData = vschess.iconv2UTF8(fileData));
                        var chessNode = vschess.dataToNode(chessData);
                        var chessInfo = vschess.dataToInfo(chessData);
                    }

                    _this.setBoardByStep(0);
                    _this.setNode(chessNode);
                    _this.rebuildSituation();
                    _this.refreshMoveSelectListNode();
                    _this.setBoardByStep(0);
                    _this.chessInfo = chessInfo;
                    _this.insertInfoByCurrent();
                    _this.refreshInfoEditor();
                    _this.rebuildExportAll();
                    _this.setExportFormat();
                    _this.editNodeTextarea.val("");
                    _this.hideNodeEditModule();
                    _this.hideEditModule();
                    _this.showEditStartButton();
                    _this.setSaved(true);
                }
            }
        }
        else {
            alert("\u5bf9\u4e0d\u8d77\uff0c\u8be5\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u6253\u5f00\u68cb\u8c31\u3002");
        }

        this.value = "";
    });

    // 重新开局按钮
    this.editBeginButton = $('<button type="button" class="vschess-button vschess-tab-body-edit-begin-button">\u91cd\u65b0\u5f00\u5c40</button>');
    this.editBeginButton.appendTo(this.editArea);

    this.editBeginButton.bind(this.options.click, function(){
        if (!_this.confirm("\u786e\u5b9a\u91cd\u65b0\u5f00\u5c40\u5417\uff1f\u5f53\u524d\u68cb\u8c31\u4f1a\u4e22\u5931\uff01")) {
            return false;
        }

        _this.setNode({ fen: vschess.defaultFen, comment: "", next: [], defaultIndex: 0 });
        _this.rebuildSituation();
        _this.setBoardByStep(0);
        _this.refreshMoveSelectListNode();
        _this.chessInfo = {};
        _this.insertInfoByCurrent();
        _this.refreshInfoEditor();
        _this.rebuildExportAll();
        _this.setExportFormat();
        _this.setTurn(0);
        _this.setSaved(true);

        if(editEnded != null) {
            editEnded();
        }
    });

    // 清空棋盘按钮
    this.editBlankButton = $('<button type="button" class="vschess-button vschess-tab-body-edit-blank-button">\u6e05\u7a7a\u68cb\u76d8</button>');
    this.editBlankButton.appendTo(this.editArea);

    this.editBlankButton.bind(this.options.click, function(){
        _this.createEditOtherItem();
        _this.pause(false);
        _this.fillInRecommendList(0);
        _this.hideEditStartButton();
        _this.hideNodeEditModule();
        _this.showEditModule();
        _this.fillEditBoardByFen(vschess.blankFen);
        _this.editSelectedIndex = -99;
        _this.dragPiece = null;
    });

    return this;
};