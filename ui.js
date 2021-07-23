({
    /** プレイヤーID */
    playerId: -1,
    /** チャットの長さ */
    mPrevChatLength: 0,
    /** 盤面 */
    board: null,
    /** 各プレイヤーの現在のターンにおける選択の制約のデータ */
    selections: null,
    /** ゲーム開始時やプレイヤーの切り替え時に実行される */
    initialize: function(ui, chat, width, height, completeShareState) {
        this.playerId = -1;
        this.mPrevChatLength = 0;
        this.board = null;
        this.selections = null;
    },
    /**
     * 画面にUIを表示する
     * @param {*} ui 汎用関数
     * @param {*} chat プレイヤーに送信されているチャット
     */
    draw: function(ui, chat, width, height, completeShareState) {
        //画面の初期化
        ui.clear()

        //クリック時の関数でthisを使用するために変数として持つ
        var thisObj = this
        //描画のビューのID用のカウンタ
        var idCount = 0;
        //最も新しい盤面情報を描画するために一度描画用に盤面を取得したらtrueにする
        var isBoardDraw = false;
        
        //チャットで取得したゲームの状態を変数として保持する
        for (var index = chat.length - 1; index >= this.mPrevChatLength; index--) {
            var signalId = chat[index].rawBody.signalId;
            var shareIndexList = chat[index].rawBody.shareIndexList;
            if (signalId == -1) {
                //プレイヤーのIDをセット
                this.playerId = chat[index].rawBody.signal
            }
            else if (!isBoardDraw && ui.equal(shareIndexList, [])) {
                isBoardDraw = true;
                //盤面の表示用の値を取得
                this.board = chat[index].rawBody.shareState[0];
                //選択肢を取得
                this.selections = chat[index].rawBody.shareState[1];
            }
        }

        if (this.board != null) {
            for (var index1 = 0; index1 < this.board.length; index1++) {
                for (var index2 = 0; index2 < this.board[index1].length; index2++) {
                    //盤面の状態を描画
                    ui.register(idCount, 5 + index1 * 35, 5 + index2 * 35, 34, 34);
                    ui.pushFillRect(idCount, {color: "darkgreen"});
                    if (this.board[index1][index2] == 1) {
                        ui.pushFillOval(idCount, {color: "black", padding: 2});
                    }
                    else if (this.board[index1][index2] == 2) {
                        ui.pushFillOval(idCount, {color: "white", padding: 2});
                    }
                    ui.setOnClickListener(idCount, ui.deepCopy([index1, index2]), function(obj){
                        if (thisObj.selections[thisObj.playerId].length > 0) {
                            //選択を送信する
                            //パラメータ: selectionIndex: 選択の制約を指すためのインデックス, selectionId: 選択の制約のID（廃止予定）, selection: プレイヤーの選択, proof: 選択肢が妥当であることを示すデータ、バリデーションに利用する。ほとんどゲームではnullとなる
                            ui.sendSlectionChat(0, null, obj, null)
                        }
                    })
                    idCount++;
                }
            }
        }

        //新しいチャットのみを処理するため、前回のチャットのサイズを持っておく
        this.mPrevChatLength = chat.length

        //画面を描画
        ui.show();
    },

    /**
     * Canvas要素をクリックしたときのイベント
     * @param ui 汎用関数
     * @param {*} pageX キャンバスの左端からクリック位置まで距離
     * @param {*} pageY キャンバスの上端からクリック位置まで距離
     */
    onClick: function(ui, pageX, pageY) {
        //クリックした位置に存在するviewのリストを取得
        var ids = ui.getViews(pageX, pageY);
        ui.execViewProcess(ids);
    }
})
