const express = require('express');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const expressSession = require('express-session');

var fileStream = require('fs');

const server = express();

server.engine('mustache', mustacheExpress());

server.set('views', './views');
server.set('view engine', 'mustache');

var word = [];
var wordsUnknown = [];
const words = fileStream.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

var random = Math.floor((Math.random() * (words.length - 1)));
var hangWord = words[random];


var unknownFields = {}; 
var hangWordHidden = new Array(hangWord.length); 

for (var i = 0; i < hangWordHidden.length; i++) {
    hangWordHidden[i] = "$ ";
}
unknownFields.unknownWord = hangWordHidden;
unknownFields.lettersGuessed = [];

server.use(express.static('public'));

server.use(express.static('/usr/share/dict/words'));
server.use(bodyParser.urlencoded({
  extended: true
}));
server.use(expressSession({
  secret: "secret code",
  resave: false,
  saveUninitialized: true,
}))
server.use(expressValidator());


server.get('/', (request, response) => {
  request.session.hangWord = hangWord;
  request.session.unknownWord = hangWordHidden;
  request.session.lettersGuessed = [];
  request.session.trials = 8;

  var model = {
    unknownWord: request.session.unknownWord,
    lettersGuessed: request.session.lettersGuessed,
    trials: request.session.trials,

  }

  response.render('index', model);
});

server.post('/', (request, response) => {

  var letter = request.body.letter; 
  letter = letter.toLowerCase();

  var hit = false;

  for (var i = 0; i < hangWord.length; i++) {
    if (hangWord[i] === letter) {
      request.session.unknownWord[i] = letter;
      hit = true;
    }
  }
  if (hit == false) {
    request.session.lettersGuessed.push(letter);
    request.session.trials -= 1;
  }
  var model = {
    unknownWord: request.session.unknownWord,
    lettersGuessed: request.session.lettersGuessed,
    trials: request.session.trials,
  }
  var winner = true;
  for (var i = 0; i < request.session.unknownWord.length; i++) {
    if (request.session.unknownWord[i] === "$ ") {
      winner = false;
    }
  }
  if (winner) {
    var model = {
      unknownWord: request.session.unknownWord,
      lettersGuessed: request.session.lettersGuessed,
      trials: request.session.trials,
    }
    response.render('index', model);
  }
  if (request.session.trials === 0) {
    var model = {
      unknownWord: request.session.unknownWord,
      lettersGuessed: request.session.lettersGuessed,
	  answer: 'The word was '+ hangWord,
      trials: request.session.trials,
    }
    response.render('index', model);
  }
  response.render('index', model);
});
server.listen(3000, function () {
    console.log('lets get hanging');
});