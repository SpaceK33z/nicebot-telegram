const TelegramBot = require('node-telegram-bot-api');
const uuid = require('uuid');
const responses = require('./responses.json');

require('dotenv').config();

function rollResponse(words) {
  return words[Math.floor(Math.random() * words.length)];
}

function rollEnding() {
  const endings = ['', '', '', '.', '!', '?!']; // 3 times nothing on purpose, most of the times we want no ending
  return endings[Math.floor(Math.random() * endings.length)];
}

// appends the last character of the word max 3 times so you can fake having emotions
function uniquefy(word) {
  const lastChar = word.slice(-1);
  // there are thousand ways to do this better but I don't care this was meant to be bad code
  const variations = ['', '', '', '', lastChar, lastChar.repeat(2)];
  return `${word}${variations[Math.floor(Math.random() * variations.length)]}`;
}

function generateMessage(words) {
  return `${uniquefy(rollResponse(words))}${rollEnding()}`;
}

const token = process.env.NICEBOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true,
});

function mapResult(title, text) {
  return {
    id: uuid(),
    type: 'article',
    title,
    input_message_content: {
      message_text: text,
    },
  };
}

bot.on('inline_query', query => {
  const results = [];
  Object.entries(responses).forEach(([responseType, responseWords]) => {
    const result = mapResult(responseType, generateMessage(responseWords));
    results.push(result);
  });

  bot.answerInlineQuery(query.id, results, { cache_time: 0 }).catch(err => {
    console.log(`Something failed (sender: ${query.from.username})`, err);
  });
});

bot.on('message', message => {
  const text = message.text;
  const chatId = message.chat.id;

  if (text.startsWith('/')) {
    const helpText =
      'Simply send some text to use this bot! You can also use this service in other conversations by typing `@goedbot ` for example.';
    bot.sendMessage(chatId, helpText, {
      parse_mode: 'Markdown',
    });
    return;
  }

  bot.sendMessage(chatId, generateMessage());
});

module.exports = () => ({
  message: 'You have reached the nice-telegram API. There is no REST API yet.',
});
