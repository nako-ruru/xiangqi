
let startFenPromise;
try {
    if(new URLSearchParams(window.location.search).get("custom-fen") === "1") {
        startFenPromise = httpGet("customfen")
    }
} catch (e) {
}
if(startFenPromise == null) {
    startFenPromise = httpGet("startfen")
}

function load() {
    startFenPromise
        .then(function(recommendListJson) {
            let chess;

            let recommendList = JSON.parse(recommendListJson).data;
            board = {
                fen:  getItem("moves"),
                side: getItem("side"),
            }
            if(!board.fen) {
                board = recommendList[0].fenList[0];
            }
            let params = {
                startTips: ["蓝色的着法含有变着"],
                defaultTab: "edit",
                chessData: board.fen,
                cloudApi: {
                    startFen: null
                },
                recommendList: recommendList,
                afterClickAnimate: function(){
                    if(updateStatus (chess)) {
                        makeRandomMove(chess);
                    }
                },
                loadFinish: function(){
                    let z = [
                        ".vschess-tab-title-comment",
                        ".vschess-tab-title-info",
                        ".vschess-tab-title-share",
                        ".vschess-tab-title-export",
                        ".vschess-tab-body-config-item-banRepeatLongThreat",
                        ".vschess-tab-body-config-item-banRepeatLongKill",
                        ".vschess-tab-body-edit-blank-button",
                        ".vschess-tab-body-edit-node-start-button",
                        ".vschess-tab-body-edit-open-button",
                        ".vschess-format-bar-copy",
                        ".vschess-format-bar-format",
                        ".vschess-format-bar-save"
                    ]
                    z.map(x => $(x)).forEach(x => x.hide());

                    editEnded = function () {
                        if(board.side === 'b') {
                            chess.setClickResponse(vschess.code.clickResponse.black)
                            chess.setTurn(vschess.code.turn.round)
                        } else {
                            chess.setClickResponse(vschess.code.clickResponse.red)
                            chess.setTurn(vschess.code.turn.none)
                        }
                        if(!myTurn(chess)) {
                            params.afterClickAnimate();
                        }
                        setItem("side", board.side)
                    };

                    chess.setBoardByStep(chess.moveList.length - 1);
                    editEnded();
                },
            };
            if(chess) {
                chess.unload();
            }
            chess = new vschess.load(".demo", params);
        });
}

function makeRandomMove (chess) {
    let forward = function () {
        let currentFen = chess.getCurrentFen();
        let board = currentFen.split(" ").slice(0, 2).join(" ");
        var list = chess.getUCCIList();
        var l = chess.getUCCIFenList();
        var fen = list.shift().split(" ").slice(0, 6).join(" ");
        var shortData = list.length ? fen + " moves " + list.join(" ") : fen;
        let url = "chess?board=" + board + "&fen=" + shortData;
        httpGet(url)
            .then(function (responseText) {
                if (responseText.indexOf("unknown") >= 0) {
                    setTimeout(forward, 1000);
                } else {
                    const regex = /move:(([a-i][0-9]){2})/;
                    let group = responseText.match(regex);
                    chess.movePieceByNode(group[1], 200, function () {
                        updateStatus(chess);

                        // 从开局开始
                        var list = chess.getMoveList();
                        var fen = list.shift().split(" ").slice(0, 2).join(" ");
                        var longData = list.length ? fen + " moves " + list.join(" ") : fen;
                        setItem("moves", longData);
                    });
                }
            });
    };
    forward();
}


function myTurn(chess) {
    let currentFen = chess.getCurrentFen();
    return (board.side === 'b') === currentFen.indexOf(" b ") >= 0;
}

function updateStatus (chess) {
    let status;

    let moveColor = 'Red';
    if (chess.getCurrentPlayer() === 2) {
        moveColor = 'Black';
    }

    let situation = vschess.fenToSituation(chess.getCurrentFen());
    let legalMoveList = vschess.legalMoveList(situation);
    let checkThreat = vschess.checkThreat(situation);
    if(legalMoveList.length === 0) {
        if(checkThreat) {
            status = 'Game over, ' + moveColor + ' is in checkmate.';
        } else {
            status = 'Game over, ' + moveColor + ' is in stalemate.';
        }
    }
    // game still on
    else {
        status = moveColor + ' to move';
        // check?
        if (checkThreat) {
            status += ', ' + moveColor + ' is in check';
        }
    }
    $("#status").html(status);
    $("#fen").html(chess.getCurrentFen());
    return status.indexOf("Game over") < 0;
}

function setItem(key, value) {
    localStorage.setItem(key, value)
    localStorage.setItem("last-update", new Date().getTime().toString())
}

function getItem(key) {
    function expired() {
        let lastUpdate = localStorage.getItem("last-update")
        if (!lastUpdate) {
            return true
        }
        return (new Date().getTime() - lastUpdate) >= 60 * 60 * 1000
    }
    if(expired()) {
        return ""
    }
    return localStorage.getItem(key);
}

function httpGet(url) {
    return new Promise(
        function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.onload = function () {
                if (this.status === 200) {
                    // Success
                    resolve(this.response);
                } else {
                    // Something went wrong (404 etc.)
                    reject(new Error(this.statusText));
                }
            };
            request.onerror = function () {
                reject(new Error(
                    'XMLHttpRequest Error: '+this.statusText));
            };
            request.open('GET', url);
            request.send();
        });
}