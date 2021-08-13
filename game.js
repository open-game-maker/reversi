//GAME_V3
//リバーシ
({  
    //定数
    staticValue: {
        //選択肢の制約のインデックス
        SELECTION_INDEX_SELECT_POSITION: 0
    },
    
    //プレイヤー数
    numberOfPlayer: [2],

    /**
     * ゲームの初期化処理(game#initialize)
     * @param {*} ogm 汎用関数
     * @param {*} random 乱数生成
     * @param {*} rule ルール
     * @param {*} mode ターン数、プレイヤー数等のゲームの状態の中でプログラム上から変更できない値
     * @returns 次のゲームの状態
     */
    initialize: function(ogm, random, rule, mode) {
        //ゲームの状態
        var state = [];

        var stageSize = 0;

        if (rule != null) {
            if (rule.length > 0 && ogm.isNumber(rule[0])) {
                stageSize = rule[0];
            }
        } 
        if (stageSize <= 2) {
            stageSize = 8;
        }

        for (var count1 = 0; count1 < stageSize; count1++) {
            state.push([]);
            for (var count2 = 0; count2 < stageSize; count2++) {
                state[count1].push(0);
            }
        }

        var basePosition = Math.floor(stageSize / 2);

        state[basePosition - 1][basePosition - 1] = 1;
        state[basePosition][basePosition - 1] = 2;
        state[basePosition - 1][basePosition] = 2;
        state[basePosition][basePosition] = 1;

        //選択の情報をプレイヤーに送信
        var selections = ogm.newArray(2);
        selections[0].push(ogm.createPlayerSelect(this.staticValue.SELECTION_INDEX_SELECT_POSITION, this.staticValue.SELECTION_INDEX_SELECT_POSITION, null));

        //ゲーム状態をプレイヤーに共有する
        var shares = ogm.newArray(mode.numberOfPlayer);
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            shares[playerIndex].push([]);
        }

        //ゲームの情報をプレイヤーに送信する
        var signal = ogm.newArray(mode.numberOfPlayer);
        for (var index = 0; index < mode.numberOfPlayer; index++) {
            //プレイヤーIDを送る（シグナルIDの-1番目をプレイヤーIDを送る用とする）
            signal[index].push([ogm.PLAYER_ID_SIGNAL_ID, index]);
            //プレイヤー数を送る（シグナルIDの-2番目をプレイヤー数を送る用とする）
            signal[index].push([ogm.PLAYER_NUMBER_SIGNAL_ID, mode.numberOfPlayer]);
        }

        //処理結果を返す
        return ogm.createGameNextResult(
            state,
            selections,
            shares,
            null,
            signal,
            null
        );
    },
    /**
     * ゲームの次状態の生成(game#next)
     * @param {*} ogm initializeと同じ
     * @param {*} random initializeと同じ
     * @param {*} state 前のゲームの状態
     * @param {*} selectList プレイヤーの選択
     * @param {*} mode initializeと同じ
     * @returns 次のゲームの状態
     */
    next: function(ogm, random, state, selectList, mode) {
        var currentPlayerId = -1;

        //全プレイヤーの選択を処理
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            for (var selectIndex = 0; selectIndex < selectList[playerIndex].length; selectIndex++) {
                var playerSelect = selectList[playerIndex][selectIndex].playersSelection;
                if (selectList[playerIndex][selectIndex].selection.constraintsKey == this.staticValue.SELECTION_INDEX_SELECT_POSITION) {
                    var index1 = playerSelect[0]
                    var index2 = playerSelect[1]
                    //現在のプレイヤーを書き換える
                    currentPlayerId = ogm.deepCopy(playerIndex);
                    //石をおく
                    var playerStone = currentPlayerId + 1;
                    var convertedPlayerStone = this.convertPlayerId(currentPlayerId) + 1;
                    state[index1][index2] = playerStone;
                    for (var x = -1; x <= 1; x++) {
                        for (var y = -1; y <= 1; y++) {
                            if (x == 0 && y == 0) {
                                continue;
                            }
                            //各方向でとれるか判定
                            var dx = x;
                            var dy = y;
                            if (index1 + dx < 0 || state.length <= index1 + dx || index2 + dy < 0 || state[index1 + dx].length <= index2 + dy) {
                                //盤面外
                                continue;
                            }
                            if (state[index1 + dx][index2 + dy] != convertedPlayerStone) {
                                continue;
                            }

                            direction: while (true) {
                                if (index1 + dx < 0 || state.length <= index1 + dx || index2 + dy < 0 || state[index1 + dx].length <= index2 + dy) {
                                    //盤面外
                                    break;
                                }
                                switch (state[index1 + dx][index2 + dy]) {
                                    case (playerStone) : {
                                        //自分の石
                                        var dx2 = x;
                                        var dy2 = y;
                                        //相手の石を自分の石に変える処理
                                        changeStone: while (true) {
                                            if (index1 + dx2 < 0 || state.length <= index1 + dx2 || index2 + dy2 < 0 || state[index1 + dx2].length <= index2 + dy2) {
                                                //盤面外
                                                break;
                                            }
                                            switch (state[index1 + dx2][index2 + dy2]) {
                                                case (playerStone) : {
                                                    //自分の石
                                                    break changeStone;
                                                }
                                                case (convertedPlayerStone) : {
                                                    //相手の石
                                                    state[index1 + dx2][index2 + dy2] = playerStone;
                                                    break;
                                                }
                                                default : {
                                                    //空、ここは通らない
                                                    break changeStone;
                                                }
                                            }
                                            dx2 += x;
                                            dy2 += y;
                                        }
                                    }
                                    case (convertedPlayerStone) : {
                                        //相手の石
                                        break;
                                    }
                                    default : {
                                        //空
                                        break direction;
                                    }
                                }

                                //次のマスを調べるために更新
                                dx += x;
                                dy += y;
                            }
                        }
                    }
                }
            }
        }

        var otherPlayerId = this.convertPlayerId(currentPlayerId);

        var currentPlayerSelection = this.selectionConstraintsList[0].serachSelect(ogm, state, currentPlayerId)
        var otherPlayerSelection = this.selectionConstraintsList[0].serachSelect(ogm, state, otherPlayerId)

        //ゲームの勝者を表す変数（nullの場合はゲームは続く）
        var winnerSet = null;
        var selections = ogm.newArray(2);
        if (currentPlayerSelection.length <= 0
         && otherPlayerSelection.length <= 0) {
            //敗北プレイヤーの配列に要素が追加されている場合、ゲーム終了。勝利プレイヤーに1、敗北プレイヤーに0をセットする
            winnerSet = this.counting(state);
        }
        else {
            if (otherPlayerSelection.length > 0) {
                //選択の情報をプレイヤーに送信
                selections[otherPlayerId].push(ogm.createPlayerSelect(this.staticValue.SELECTION_INDEX_SELECT_POSITION, this.staticValue.SELECTION_INDEX_SELECT_POSITION, null));
            }
            else {
                selections[currentPlayerId].push(ogm.createPlayerSelect(this.staticValue.SELECTION_INDEX_SELECT_POSITION, this.staticValue.SELECTION_INDEX_SELECT_POSITION, null));
            }
        }
        
        //ゲーム状態をプレイヤーに共有する
        var shares = ogm.newArray(mode.numberOfPlayer);
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            shares[playerIndex].push([]);
        }

        //ゲームの情報をプレイヤーに送信する
        var signal = ogm.newArray(mode.numberOfPlayer);
        for (var index = 0; index < mode.numberOfPlayer; index++) {
            //プレイヤーIDを送る（シグナルIDの-1番目をプレイヤーIDを送る用とする）
            signal[index].push([ogm.PLAYER_ID_SIGNAL_ID, index]);
            //プレイヤー数を送る（シグナルIDの-2番目をプレイヤー数を送る用とする）
            signal[index].push([ogm.PLAYER_NUMBER_SIGNAL_ID, mode.numberOfPlayer]);
        }

        //プレイヤーの選択とゲームの状態から得られた処理結果を返す
        return ogm.createGameNextResult(
            state,
            selections,
            shares,
            null,
            signal,
            winnerSet
        );
    },
    //プレイヤーIDから相手プレイヤーIDに変換する
    convertPlayerId: function(playerId) {
        return playerId == 0 ? 1 : 0;
    },
    /**
     * 白と黒の石を数えて、その組を返す
     * @param board 盤面の情報
     * @returns [number, number] プレイヤー1の石の数、プレイヤー2の石の数
     */
    counting: function(board) {
        var player1Stone = 0;
        var player2Stone = 0;
        for (var i1 = 0; i1 < board.length; i1++) {
            for (var i2 = 0; i2 < board[i1].length; i2++) {
                if (board[i1][i2] == 1) {
                    player1Stone++;
                }
                else if (board[i1][i2] == 2) {
                    player2Stone++;
                } 
            }
        }
        return [player1Stone, player2Stone]
    },
    /**
     * 選択肢の制約
     */
    selectionConstraintsList: [
        {
            //定数
            staticValue: {
                //選択肢の制約のインデックス
                SELECTION_INDEX_SELECT_POSITION: 0
            },
            /**
             * プレイヤーが選択できるすべての選択肢の生成
             * @param {*} ogm 汎用関数
             * @param {*} shareState プレイヤーに渡されているゲームの状態の情報
             * @param {*} selectionSignal 選択に紐づけられている情報
             */
             createAll: function(
                ogm,
                shareState,
                selectionSignal
            ) {
                var playerId = shareState.getSignal(ogm.PLAYER_ID_SIGNAL_ID)[0][1];
                return this.serachSelect(ogm, shareState.getState([]), playerId);
            },
            serachSelect: function(ogm, board, playerId) {
                var selections = [];
                for (var index1 = 0; index1 < board.length; index1++) {
                    for (var index2 = 0; index2 < board[index1].length; index2++) {
                        //各マスにおけるか判定
                        if (board[index1][index2] != 0) {
                            //空でない場合、そこには石をおけないため、戻す
                            continue;
                        }
                        checkCell: for (var x = -1; x <= 1; x++) {
                            for (var y = -1; y <= 1; y++) {
                                if (x == 0 && y == 0) {
                                    continue;
                                }
                                //各方向でとれるか判定
                                var dx = x;
                                var dy = y;
                                var playerStone = playerId + 1;
                                var convertedPlayerStone = this.convertPlayerId(playerId) + 1;
                                if (index1 + dx < 0 || board.length <= index1 + dx || index2 + dy < 0 || board[index1 + dx].length <= index2 + dy) {
                                    //盤面外
                                    continue;
                                }
                                if (board[index1 + dx][index2 + dy] != convertedPlayerStone) {
                                    continue;
                                }
                                direction: while (true) {
                                    if (index1 + dx < 0 || board.length <= index1 + dx || index2 + dy < 0 || board[index1 + dx].length <= index2 + dy) {
                                        //盤面外
                                        break;
                                    }
                                    switch (board[index1 + dx][index2 + dy]) {
                                        case (playerStone) : {
                                            //自分の石
                                            selections.push([
                                                ogm.deepCopy([index1, index2]), null
                                            ]);
                                            //成功したのでマスの判定から抜ける
                                            break checkCell;
                                        }
                                        case (convertedPlayerStone) : {
                                            //相手の石引き続き判定を行う
                                            break;
                                        }
                                        default : {
                                            //空
                                            break direction;
                                        }
                                    }

                                    //次のマスを調べるために更新
                                    dx += x;
                                    dy += y;
                                }
                            }
                        }
                    }
                }
                return selections;
            },
            //プレイヤーIDから相手プレイヤーIDに変換する
            convertPlayerId: function(playerId) {
                return playerId == 0 ? 1 : 0;
            }
        }
    ]
})
