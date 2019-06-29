/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
// const questions = require('./questions');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const board = require('./board.js');

// const ANSWER_COUNT = 4;
// const GAME_LENGTH = 5;
const QUESTION_POS = 1;
const QUESTION_START_NEWGAME = 2;

function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
  return hasDisplay;
}
/**
 * ディスプレイサポート（APL対応）判定値
 * @author zono_0
 */ 
const supportsApl = (handlerInput) => {
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL'];

  return hasDisplay;
};

function innnerNumToPosStr(handlerInput, posnum) {
  
  let posStr = "";
  switch(posnum){
    case 0: posStr = "左上";  break;
    case 1: posStr = "上";  break;
    case 2: posStr = "右上";  break;
    case 3: posStr = "左";  break;
    case 4: posStr = "真ん中";  break;
    case 5: posStr = "右";  break;
    case 6: posStr = "左下";  break;
    case 7: posStr = "下";  break;
    case 8: posStr = "右下";  break;
  }
  return posStr;
}
function endGame(handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const speechOutput = requestAttributes.t('CANCEL_MESSAGE');

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .withShouldEndSession(true)
    .getResponse();
}

function startGame(newGame, handlerInput) {
  console.log("startGame start");

  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  let speechOutput = newGame
    ? requestAttributes.t('WELCOME_GAME_MESSAGE', requestAttributes.t('GAME_NAME'))
      + requestAttributes.t('START_GAME_MESSAGE')
    : requestAttributes.t('START_GAME_MESSAGE');


  let repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');

  let res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_bridge_02'/>";

  let oneB = new board();

  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  console.log(sessionAttributes);
  let userIsFirst = true;//ユーザが先攻か後攻か
  if(sessionAttributes && "userIsFirst" in sessionAttributes){
    userIsFirst = sessionAttributes.userIsFirst;
    console.log("userIsFirst val = " +userIsFirst);
    if(!userIsFirst){
      oneB.calcStatus();
      let compPos = oneB.advicePos(true);
      //let compPos = oneB.getRandomPosAdvice();
      let compPosStr = innnerNumToPosStr(handlerInput, compPos);
      speechOutput += `こんどは私から。${compPosStr} に置きます。\n`;
      let compRes = oneB.doSet(true, compPos);
    }
  }
  speechOutput += requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  let cardOutputText = speechOutput;
  if( res_sound ){
    speechOutput = "<speak>" + res_sound + speechOutput + "</speak>";
  }
  let currentBoardStr = oneB.toString();

  Object.assign(sessionAttributes, {
    // speechOutput: repromptText,
    // repromptText,
    currentBoardStr,
    userIsFirst,
    questionMode: QUESTION_POS,
    // currentScore,
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
  createBoardImages(handlerInput, oneB, sessionAttributes, repromptText);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), cardOutputText)
    .getResponse();
}

function createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText) {
  if (! supportsApl(handlerInput)) {
    return;
  }
  // ディスプレイ有り（APL対応）の場合  
  let datasource = require('./data.json');
  const PLAYER_A_image = {
    // "url": "https://d2o906d8ln7ui1.cloudfront.net/images/sm_gouda.png",
    "url": (非公開),
    "size": "small",
    "widthPixels": 0,
    "heightPixels": 0
  }
  const PLAYER_B_image = {
    // "url": "https://d2o906d8ln7ui1.cloudfront.net/images/sm_blue.png",
    "url": (非公開),
    "size": "small",
    "widthPixels": 0,
    "heightPixels": 0
  }
  const PLAYER_EMPTY_image = {
    // "url": "https://d2o906d8ln7ui1.cloudfront.net/images/sm_cheddar.png",
    "url": (非公開),
    "size": "small",
    "widthPixels": 0,
    "heightPixels": 0
  }

  datasource.bodyTemplate7Data.subtitle =  sessionAttributes.userIsFirst ? "あなた：先手" : "あなた：後手";
  datasource.bodyTemplate7Data.playerImage.source = sessionAttributes.userIsFirst ? PLAYER_A_image : PLAYER_B_image;
  datasource.bodyTemplate7Data.hintText = repromptText;
  //datasource.bodyTemplate1Data.textContent.secondaryText.text = curBoard.toReadbleString();
  for(let i=0;i<9;i++){
      const item = curBoard.getBoardItem(i);
      switch(item){
      case board.PLAYER_A:
        datasource.bodyTemplate7Data.image.sources[i] = PLAYER_A_image;
        break;
      case board.PLAYER_B:
        datasource.bodyTemplate7Data.image.sources[i] = PLAYER_B_image;
        break;
      default:
        datasource.bodyTemplate7Data.image.sources[i] = PLAYER_EMPTY_image;
      }
  }

  handlerInput.responseBuilder
    .addDirective({
      type : 'Alexa.Presentation.APL.RenderDocument',
      version: '1.0',
      document: require('./homepage.json'),
      datasources: datasource
    });
}

const USER_WIN_VOCE_ja =["あ〜あ","うわ〜","あちゃ","うわっ","あちゃあ","え〜と","あっ","おおー","あはっ",
  "おっ","あらあ","およよ","あらら","ぎゃあ","ありゃ","とほほ","あれれ","むっ"];
const COMP_WIN_VOCE_ja =["いゃ〜","にゃはは","うふ","ふふふ","うふふ","ほっ","うれしい","むふふ","わ〜い"];
const REACH_VOCE_ja =["うーんと","おー","うぅ","おっと","うひゃあ","じゃあ","えっとお","それでは","ようし","んーと","んも〜"];


function continueGame(handlerInput, touchPos) {
  console.log("continueGame start*")
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  if (Object.keys(sessionAttributes).length === 0 
    || sessionAttributes.currentBoardStr == null ||  sessionAttributes.currentBoardStr.length == 0){
    //エラー。
    console.log("continueGame error of sessionAttributes.")
    let speechOutput = "内部エラーです";
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
      .getResponse();
  }
  //
  console.log("sessionAttributes********")
  console.dir(sessionAttributes)

  //
  let curBoard = new board();
  curBoard.fromString(sessionAttributes.currentBoardStr);
  
  const { request } = handlerInput.requestEnvelope;
  let userPos_innr = -1;
  let userPos_org = "";

  if(touchPos){
    userPos_innr = parseInt(touchPos);
    userPos_org = innnerNumToPosStr(userPos_innr);
  }else{
    const { slots } = request.intent;
    if( ! slots.posFromName
      || ! slots.posFromName.resolutions
      || ! slots.posFromName.resolutions.resolutionsPerAuthority
      || !("values" in slots.posFromName.resolutions.resolutionsPerAuthority[0])){
      console.log("continueGame error of sessionAttributes.")
      let speechOutput = "場所が聞き取れませんでした。\n" + requestAttributes.t('HELP_POS_GUIDE');
      let repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');
      speechOutput += repromptText;
      createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptText)
        .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
        .getResponse();
    }
    if(slots.posFromName && slots.posFromName.value){
      console.log(slots.posFromName.value)
      const nameID = slots.posFromName.resolutions.resolutionsPerAuthority[0].values[0].value.id;
      console.log(slots.posFromName.resolutions.resolutionsPerAuthority[0].values[0].value);
      userPos_org = slots.posFromName.resolutions.resolutionsPerAuthority[0].values[0].value.name;
      userPos_innr = nameID -1;
    }
  }

  if( ! curBoard.canSet(userPos_innr) ){
    let res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01'/>";
    let speechOutput = userPos_org + "は空いていません。別の場所を指定してください。";
    speechOutput += requestAttributes.t('PLEASE_ENTER_YOUR_POS');
    let cardOutputText = speechOutput;
    if( res_sound ){
      speechOutput = "<speak>" + res_sound + speechOutput + "</speak>";
    }
    let repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');
    createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptText)
      .withSimpleCard(requestAttributes.t('GAME_NAME'), cardOutputText)
      .getResponse();
  }
  //user
  let player = sessionAttributes.userIsFirst;
  let res = curBoard.doSet(player, userPos_innr);
  let canContinue = true;
  let res_str = "";
  let res_str2 = "";
  let res_str3 = "";
  let res_sound = "";
  let cardOutputText = "";
  switch(res){
  case board.SETPOSRES_GAMEEND_DRAW:
      canContinue = false;
      res_str = "引き分けです";
      cardOutputText = res_str;
      res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_03'/>";
      break;
  case board.SETPOSRES_GAMEEND_WIN:
      {
        let randPos = Math.floor(Math.random() *  USER_WIN_VOCE_ja.length);
        res_str = "<say-as interpret-as=\"interjection\">" + USER_WIN_VOCE_ja[randPos] +"</say-as>\n";      
        res_str += "おめでとうございます！あなたの勝ちです！";
        cardOutputText = USER_WIN_VOCE_ja[randPos] + " \nおめでとうございます！あなたの勝ちです！";
      }
      res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01'/>";
      canContinue = false;
      break;
  case board.SETPOSRES_REACH:
      // console.log(" リーチ！");
      {
        let randPos = Math.floor(Math.random() *  REACH_VOCE_ja.length);
        res_str = "<say-as interpret-as=\"interjection\">" + REACH_VOCE_ja[randPos] +"</say-as>\n";
        cardOutputText = REACH_VOCE_ja[randPos];
      }
      break;
  case board.SETPOSRES_SUCCESS:
      default:
  }
  if(canContinue){
      //computer  
    let compPos = curBoard.advicePos(!player);
    let compPosStr = innnerNumToPosStr(handlerInput, compPos);
    res_str2 = res_str ? res_str : "では、";
    res_str2 += `${compPosStr} に置きます。\n`;
    cardOutputText = cardOutputText ? cardOutputText : "では、";
    cardOutputText +=  `${compPosStr} に置きます。\n`;
    console.log(res_str2);
    let compRes = curBoard.doSet(!player, compPos);
    switch(compRes){
    case board.SETPOSRES_FAILURE:
      // console.log(pos + " には置けません");
      break;
    case board.SETPOSRES_GAMEEND_DRAW:
      res_str3 += "引き分けになりました。";
      cardOutputText +=  "引き分けになりました。";
      res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_03'/>";
      canContinue = false;
      break;
    case board.SETPOSRES_GAMEEND_WIN:
      {
        let randPos = Math.floor(Math.random() *  COMP_WIN_VOCE_ja.length);
        res_str3 += "<say-as interpret-as=\"interjection\">" + COMP_WIN_VOCE_ja[randPos] +"</say-as>\n";      
        cardOutputText +=  COMP_WIN_VOCE_ja[randPos] ;
      }
      res_str3 += "私の勝ちです。";
      cardOutputText += "私の勝ちです。";
      // res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01'/>";
      res_sound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02'/>";
      canContinue = false;
      break;
    case board.SETPOSRES_REACH:
        break;
    case board.SETPOSRES_SUCCESS:
        default:
    }
  }
  if(!canContinue){
    //結果に応じた音声
    let speechOutput = res_str2 ? res_str2 + res_str3  : res_str;
    let repromptText = "もう一度勝負しますか？";
    if( res_sound ){
      if(res_str2){
        speechOutput = "<speak>" + res_str2 + res_sound + res_str3 + repromptText + "</speak>";
      }else{
        speechOutput = "<speak>" + res_sound + res_str + repromptText + "</speak>";
      }
    }

    let userIsFirst_new = !sessionAttributes.userIsFirst;//ユーザが先攻か後攻か
    let currentScore_new = "(未実装)";
    Object.assign(sessionAttributes, {
      currentBoardStr: null,
      userIsFirst: userIsFirst_new,
      currentScore: currentScore_new,
      questionMode: QUESTION_START_NEWGAME,
    });
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptText)
      .withSimpleCard(requestAttributes.t('GAME_NAME'), cardOutputText)
      .getResponse();
  }

  let speechOutput = res_str2;
  speechOutput += requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  let repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  cardOutputText += requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  let currentBoardStr = curBoard.toString();

  Object.assign(sessionAttributes, {
    currentBoardStr,
    questionMode: QUESTION_POS,
    // currentScore,
    // questions: gameQuestions,
    // score: 0,
    // correctAnswerText: translatedQuestion[Object.keys(translatedQuestion)[0]][0]
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), cardOutputText)
    .getResponse();
}

function showBoard(handlerInput) {
  console.log("showBoard start*")
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  if (Object.keys(sessionAttributes).length === 0 
    || sessionAttributes.currentBoardStr == null ||  sessionAttributes.currentBoardStr.length == 0){
    //エラー。
    let speechOutput = "ゲームは終了しています、または開始していません。";
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
      .getResponse();
  }
  let curBoard = new board();
  curBoard.fromString(sessionAttributes.currentBoardStr);
  console.log(curBoard.toString())

  
  let speechOutput = "あなたは";
  speechOutput += sessionAttributes.userIsFirst ? "先手のマルです。\n" : "後手のバツです。\n";
  let cardOutputText = speechOutput;
  // speechOutput += "上の段から下の段へ、格段を左から右へと読み上げます。\n";
  //datasource.bodyTemplate1Data.textContent.secondaryText.text = curBoard.toReadbleString();
  for(let i=0;i<9;i++){
    if(i == 0){
      speechOutput += "上の段、左から。\n";
      cardOutputText += "上の段、左から。\n";
    }else if(i == 3){
      speechOutput += "\n中の段、左から。\n";      
      cardOutputText += "\n中の段、左から。\n";      
    }else if(i == 6){
      speechOutput += "\n下の段、左から。\n";
      cardOutputText += "\n下の段、左から。\n";
    }
    const item = curBoard.getBoardItem(i);
    switch(item){
    case board.PLAYER_A:
      speechOutput += "マル <break time=\"200ms\" />";
      cardOutputText += "マル ";
      break;
    case board.PLAYER_B:
      speechOutput += "バツ <break time=\"200ms\" />";      
      cardOutputText += "バツ ";
      break;
    default:
      speechOutput += "アキ <break time=\"200ms\" />";
      cardOutputText += "アキ ";
    }
  }
  speechOutput += "以上です。\n" + requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  cardOutputText += "以上です。\n" +  requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  let repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');

  createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), cardOutputText)
    .getResponse();
}

function helpTheUser(handlerInput) {
  console.log("helpTheUser start")
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  let curBoard = new board();
  let isOnGame = true;
  if (Object.keys(sessionAttributes).length === 0 
    || sessionAttributes.currentBoardStr == null ||  sessionAttributes.currentBoardStr.length == 0){
      isOnGame = false;
  }else{
    curBoard.fromString(sessionAttributes.currentBoardStr);
    if(curBoard.isEmpty()){
      isOnGame = false;
    }
  }

  let askMessage = isOnGame
    ? requestAttributes.t('ASK_MESSAGE_START')
    : requestAttributes.t('HELP_MESSAGE_TAIL_CONTINUE_GAME');
  askMessage += requestAttributes.t('PLEASE_ENTER_YOUR_POS');
  const speechOutput = requestAttributes.t('HELP_MESSAGE') + requestAttributes.t('HELP_POS_GUIDE') + askMessage;
  const repromptText = requestAttributes.t('PLEASE_ENTER_YOUR_POS');

  createBoardImages(handlerInput, curBoard, sessionAttributes, repromptText);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
    .getResponse();
}

/* jshint -W101 */
const languageString = {
  ja: {
    translation: {
      SKILL_NAME: '楽しいねマルバツゲーム',
      GAME_NAME: '楽しいねマルバツゲーム',
      HELP_MESSAGE: 'マルバツゲーム、あるいは三目並べとも呼ばれるゲームです。たて・よこ・ななめのどれか１列を先にとったほうが勝ちです。',
      HELP_POS_GUIDE:'場所は左上・左・真ん中・右・右下のように上下左右で指定してください。',
      HELP_MESSAGE_NOAPL: 'なお、「盤面」と言えば、現在の盤面を読み上げます',
      HELP_MESSAGE_TAIL_CONTINUE_GAME: 'それでは、続けましょう。',
      ASK_MESSAGE_START: 'それでは、始めましょう.',
      CANCEL_MESSAGE: 'ゲームを終了します。また遊んでね！',
      WELCOME_GAME_MESSAGE: 'ようこそ %s へ. ',
      START_GAME_MESSAGE: 'それでは、始めましょう. ',
      PLEASE_ENTER_YOUR_POS: 'どこに置きますか？',
      ERROR_MESSAGE: '申し訳ありませんが、エラーが発生しました。\nもう一度お願いします。',
      NEXTPREV_MESSAGE: '前／次には対応していません。\nもう一度お願いします。',
    },
  },
};


const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageString,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

const LaunchRequest = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.StartOverIntent');
  },
  handle(handlerInput) {
    console.log("LaunchRequest start");
    return startGame(true, handlerInput);
  },
};

const newGameIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    if (request.type === 'IntentRequest'
        && request.intent.name === 'newGameIntent'){
      return true;
    }
    return false;
  },
  handle(handlerInput) {
    console.log("newGameIntent start");
    return startGame(false, handlerInput);
  },
};

const showBoardIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    if (request.type === 'IntentRequest'
        && request.intent.name === 'showBoardIntent'){
        return true;
    }
    return false;
  },
  handle(handlerInput) {
    return showBoard(handlerInput);
  },
};


function isOnGame(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  if (Object.keys(sessionAttributes).length === 0 
    || sessionAttributes.currentBoardStr == null
    ||  sessionAttributes.currentBoardStr.length == 0){
      console.log("IntentRequest sessionAttributes not match.")
      return false;
    }

    if (sessionAttributes.questionMode && sessionAttributes.questionMode != QUESTION_POS){
      console.log("sessionAttributes.questionMode not match. mode = " + sessionAttributes.questionMode);
      return false;
  }
  return true;
}

const gameContinueIntent = {
  canHandle(handlerInput) {
    console.log("gameContinueIntent canHandle start")
    const { request } = handlerInput.requestEnvelope;

    if (request.type === 'IntentRequest'
        && request.intent.name === 'gameContinueIntent'){

    }else{
      console.log("IntentRequest type and name not match. return false")
      return false;
    }
    return isOnGame(handlerInput);
  },
  handle(handlerInput) {
    console.log("gameContinueIntent handle start")
    const { request } = handlerInput.requestEnvelope;
    console.log(request);
    return continueGame(handlerInput, null);
  },
};

// 画面タッチ処理
// シミュレーターではonPressが反応し、実機ではPressが反応するため2つ書いておく
const TouchEventHandler = {
  canHandle(handlerInput) {
    console.log("TouchEventHandler canHandle called");
    return ((handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent' &&
        (handlerInput.requestEnvelope.request.source.handler === 'Press' || 
        handlerInput.requestEnvelope.request.source.handler === 'onPress')));
  },
  handle(handlerInput) {
    console.log("TouchEventHandler start");
      // TcouhWrapperのargumentsで指定したパラメータを取得する
      const touchPos = handlerInput.requestEnvelope.request.arguments[0];

      if(isOnGame(handlerInput)) {
        return continueGame(handlerInput, touchPos);
      }

      // const speechText = `${touchPos}をタップしました。`;
      // return handlerInput.responseBuilder
      //     .speak(speechText)
      //     .getResponse();            

      let speechOutput = "タッチ操作はゲーム中だけ有効です。はい・いいえでお答えください。もう一度勝負しますか？";
      let reprompt = "もう一度勝負しますか？はい・いいえでお答えください。";  
      return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .getResponse();
  }
};

const HelpIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    // const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // const newGame = !(sessionAttributes.questions);
    return helpTheUser(handlerInput);
  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    let speechOutput = "";
    let reprompt = "";
    if (Object.keys(sessionAttributes).length != 0
      && sessionAttributes.questionMode){
      if(sessionAttributes.questionMode == QUESTION_START_NEWGAME){
        speechOutput = "もう一度勝負しますか？";
        reprompt = "はい・いいえでお答えください。";  
      }else{
        speechOutput = "場所が聞き取れませんでした。" + requestAttributes.t('HELP_POS_GUIDE');
        reprompt = requestAttributes.t('PLEASE_ENTER_YOUR_POS');            
      }
    }else{
      speechOutput = "場所が聞き取れませんでした。" + requestAttributes.t('HELP_POS_GUIDE');
      reprompt = requestAttributes.t('PLEASE_ENTER_YOUR_POS');
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const USER_INPUT_YES = 1;
const USER_INPUT_NO = 10;
const USER_INPUT_FORCE_END = 50;
const USER_INPUT_NOT_YESNO = 100;
function getYesNoAnswerOnWrongSlot(handlerInput){
  console.log("getYesNoAnswerOnWrongSlot start")
  const { request } = handlerInput.requestEnvelope;
  if(!request){
    return false;
  }
  const { slots } = request.intent;
  let retval = USER_INPUT_NOT_YESNO;
  console.log(slots)
  if(slots && slots.posFromName && slots.posFromName.value){
    console.log(slots.posFromName.value)
    switch (slots.posFromName.value){
      case "いいえ":
      case "終わります":
      case "終わり":
        retval = USER_INPUT_NO;
        break;
      case "ストップ":
      case "キャンセル":
      case "終了":
        retval = USER_INPUT_FORCE_END;
        break;
      case "はい":
      case "イエス":
      case "続けます":
      case "次":
        retval = USER_INPUT_YES;
        break;
    }
  }
  return retval;
}
const YesIntent = {
  canHandle(handlerInput) {
      if( handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'){
        return true;
      };
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      if (Object.keys(sessionAttributes).length != 0
        && sessionAttributes.questionMode
        && sessionAttributes.questionMode == QUESTION_START_NEWGAME){
          //gameContinueIntentにYes/Noが落ちてくるケースへの救済策
          if(USER_INPUT_YES == getYesNoAnswerOnWrongSlot(handlerInput)){
            return true;
          }
      }
      return false;
    },
  handle(handlerInput) {
    console.log("YesIntent handle start")
    return startGame(false, handlerInput);
  },
};
const NoIntent = {
  canHandle(handlerInput) {
    if( handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'){
      return true;
    };
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (Object.keys(sessionAttributes).length != 0
      && sessionAttributes.questionMode ){
        let slotCheck = getYesNoAnswerOnWrongSlot(handlerInput);
        if(USER_INPUT_NO === slotCheck
          && sessionAttributes.questionMode === QUESTION_START_NEWGAME){
            return true;
        }else if(USER_INPUT_FORCE_END === slotCheck){
          return true;
        }
    }
    return false;
  },
  handle(handlerInput) {
    console.log("NoIntent handle start")
    return endGame(handlerInput);
  }
};

const StopIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    console.log("StopIntent handle start")
    return endGame(handlerInput);
  },
};

const CancelIntent = {
  canHandle(handlerInput) {
    console.log("CancelIntent canHandle")

    if( handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'){
      return true;
    };
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (Object.keys(sessionAttributes).length != 0
      && sessionAttributes.questionMode ){
        let slotCheck = getYesNoAnswerOnWrongSlot(handlerInput);
        if(USER_INPUT_FORCE_END === slotCheck){
          return true;
        }
    }  
    return false;
  },
  handle(handlerInput) {
    return endGame(handlerInput);
  },
};
const PrevNextHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && ( request.intent.name === 'AMAZON.NextIntent'
        || request.intent.name === 'AMAZON.PreviousIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('NEXTPREV_MESSAGE'))
      .reprompt(requestAttributes.t('REPROMPT_MESSAGE'))
      .withShouldEndSession(false)
      .getResponse();
  },
};


const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error}`);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    let speechOutput = requestAttributes.t ? requestAttributes.t('ERROR_MESSAGE') : 'Sorry, I can\'t understand the command. Please say again.';
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    HelpIntent,
    TouchEventHandler,
    // AnswerIntent,
    // RepeatIntent,
    YesIntent,
    StopIntent,
    CancelIntent,
    NoIntent,
    showBoardIntent,
    newGameIntent,
    gameContinueIntent,
    SessionEndedRequest,
    PrevNextHandler,
    UnhandledIntent
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
