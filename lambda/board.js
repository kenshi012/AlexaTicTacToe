

const PLAYER_A = 5;
const PLAYER_B = 1;
const EMPTY = 0;

const SETPOSRES_FAILURE = -1;
const SETPOSRES_SUCCESS = 0;
const SETPOSRES_REACH = 9;
const SETPOSRES_GAMEEND_DRAW = 10;
const SETPOSRES_GAMEEND_WIN = 20;


// const BOARDSCORE =[3,1,3,1,9,1,3,1,3];

module.exports = class board{
    constructor () {
        this.board = [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY];
    }
    fromString(inputStr){
        let inputtVal = parseInt(inputStr, 10);
        let tmpVal = inputtVal;
        let boardTmp = [];
        let i = 0;
        for(i=0;i < 9; i++){
            boardTmp[i] = inputtVal % 10;
            inputtVal = parseInt(inputtVal /10, 10);
        }
        this.board = boardTmp.reverse();
    }
    toString(){
        let val = "";
        let i = 0;
        for( i = 0; i < 9; i++ ){
            val += this.board[i];
        }
        return val;
    }
    getBoardItem(pos){
        return this.board[pos];
    }
    toReadbleString(){
        const str = this.board.map((elem) => { 
            switch(elem){
                case PLAYER_A:
                    return "○";
                case PLAYER_B:
                    return "×";
                default:
                    return "-";
            }
        });        
        const retStrArray = [
            str[0]+str[1]+str[2],
            str[3]+str[4]+str[5],
            str[6]+str[7]+str[8]
        ];
        return retStrArray;
    }
    // dump(){
    //     const strArray = this.toReadbleString();
    //     console.log(strArray[0]);
    //     console.log(strArray[1]);
    //     console.log(strArray[2]);
    // }
    calcStatus(){
        // let line0 = this.board[0] + this.board[1] + this.board[2];
        // let line1 = this.board[3] + this.board[4] + this.board[5];
        // let line2 = this.board[6] + this.board[7] + this.board[8];
        // let line3 = this.board[0] + this.board[3] + this.board[6];
        // let line4 = this.board[1] + this.board[4] + this.board[7];
        // let line5 = this.board[2] + this.board[5] + this.board[8];
        // let line6 = this.board[0] + this.board[4] + this.board[8];
        // let line7 = this.board[2] + this.board[4] + this.board[6];
        this.linescores = [];
        let i = 0;
        for( i = 0; i < 3; i++ ){
            this.linescores.push(this.board[0+i*3] + this.board[1+i*3] + this.board[2+i*3]);
        }
        for( i = 0; i < 3; i++ ){
            this.linescores.push(this.board[i] + this.board[3+i] + this.board[2*3+i]);
        }
        this.linescores.push(this.board[0] + this.board[4] + this.board[8]);
        this.linescores.push(this.board[2] + this.board[4] + this.board[6]);
    }
    isEmpty(){
        this.calcStatus();
        let got = this.linescores.some(function(element, index, array) {
            return (element != EMPTY * 3);
        });
        return (got);
    }
    isGotGame(isPlayerA){
        const player = (isPlayerA) ? PLAYER_A : PLAYER_B;
        let got = this.linescores.some(function(element, index, array) {
            return (element == player * 3);
        });
        return (got);
    }
    isDrawGame(){
        let got = this.board.some(function(element, index, array) {
            return (element == EMPTY);
        });
        return !(got);
    }
    getReachedLine(isPlayerA){
        const player = (isPlayerA) ? PLAYER_A : PLAYER_B;
        let reachLines = [];
        this.linescores.some(function(element, index, array) {
            if (element == player * 2) { reachLines.push(index); }
        });
        return reachLines;        
    }
    runTest () {
        this.board = [5,0,0,1,5,0,0,0,0];
        this.calcStatus();
    }
    canSet (pos) {
        if(this.board[pos]!=0){
            return false;
        }
        return true;
    }
    doSet (isPlayerA, pos) {
        if(!this.canSet(pos)){
            return SETPOSRES_FAILURE;
        }
        this.board[pos] = (isPlayerA) ? PLAYER_A : PLAYER_B;
        this.calcStatus();
        if( this.isGotGame(isPlayerA) ){
            return SETPOSRES_GAMEEND_WIN;
        }
        if(this.isDrawGame()){
            return SETPOSRES_GAMEEND_DRAW;
        }
        const reachLines = this.getReachedLine(isPlayerA);
        if(reachLines.length > 0){
            return SETPOSRES_REACH;
        }
        return SETPOSRES_SUCCESS;
    }

    getReachLineEmptyPos (reachLines) {
        //相手のリーチ行を潰す。
        const line = reachLines[0];
        //空いている場所の探索
        if( 0 <= line && line < 3){
            if(this.board[0+line*3] == EMPTY)return (0+line*3);
            if(this.board[1+line*3] == EMPTY)return (1+line*3);
            if(this.board[2+line*3] == EMPTY)return (2+line*3);        
        }
        if( 3 <= line && line < 6){
            if(this.board[line-3] == EMPTY)return (line-3);
            if(this.board[3+line-3] == EMPTY)return (3+line-3);
            if(this.board[2*3+line-3] == EMPTY)return (2*3+line-3);
        }
        if(line == 6){
            if(this.board[0] == EMPTY)return 0;
            if(this.board[4] == EMPTY)return 4;
            if(this.board[8] == EMPTY)return 8;
        }
        if(this.board[2] == EMPTY)return 2;
        if(this.board[4] == EMPTY)return 4;
        if(this.board[6] == EMPTY)return 6;
        return -1;
    }

    advicePos(forPlayerA){
        const my_reachLines = this.getReachedLine(forPlayerA);
        if(my_reachLines.length > 0){
            let pos = this.getReachLineEmptyPos(my_reachLines);
            if(pos >= 0){
                return pos;
            }
        }
        const reachLines = this.getReachedLine(!forPlayerA);
        if(reachLines.length > 0){
            let pos = this.getReachLineEmptyPos(reachLines);
            return pos;
        }else{
            //空いている場所でスコアが高い場所を紹介
            const  posArray = [4,0,2,6,8,1,3,5,7];

            const found = posArray.find(function(element) {
                return this[element] == EMPTY;
            }, this.board);
            return found;
        }
        return -1;
    }
    getRandomPosAdvice(){
        let adPos = -1;
        while(true){
            const pos = Math.floor(Math.random() * Math.floor(8));
            if(this.canSet(pos)){
                adPos = pos;
                break;
            }
        }
        return adPos;
    }

}

module.exports.SETPOSRES_FAILURE = SETPOSRES_FAILURE;
module.exports.SETPOSRES_SUCCESS = SETPOSRES_SUCCESS;
module.exports.SETPOSRES_REACH = SETPOSRES_REACH;
module.exports.SETPOSRES_GAMEEND_DRAW = SETPOSRES_GAMEEND_DRAW;
module.exports.SETPOSRES_GAMEEND_WIN = SETPOSRES_GAMEEND_WIN;

module.exports.PLAYER_A = PLAYER_A;
module.exports.PLAYER_B = PLAYER_B;
module.exports.EMPTY = EMPTY;
