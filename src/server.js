import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import dotenv from 'dotenv';
import botkit from 'botkit';
import yelp from 'yelp-fusion';

dotenv.config({ silent: true });

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
// app.listen(port);
//
// console.log(`listening on: ${port}`);

// User added code

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM((err) => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// example hello response
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}! Please message me: "food ..." where ... is some food you want near Hanover`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

// const yelpClient = yelp.client(process.env.YELP_API_KEY);

const yelpClient = yelp.client(process.env.YELP_API_KEY);

// bye response
controller.hears(['bye'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  console.log('here');

  bot.api.users.info({ user: message.user }, (err, res) => {
    console.log(message);
    if (res) {
      bot.reply(message, 'Goodbye!');


      // yelpClient.search({
      //   term: 'Sushi',
      //   location: 'hanover, nh',
      // }).then((response) => {
      //   bot.reply(message, `Go here: ${response.jsonBody.businesses[0].name}!`);
      // }).catch((e) => {
      //   bot.reply(message, 'Nothing found!');
      //   console.log(e);
      // });
    } else {
      bot.reply(message, 'Goodbye!');
    }
  });
});

controller.hears(['food'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  console.log('here');

  bot.api.users.info({ user: message.user }, (err, res) => {
    console.log(message);
    if (res) {
      // bot.reply(message, 'Goodbye!');
      if (message.text.split(' ', 2)[1] !== undefined && message.text.split(' ', 2)[1] !== null) {
        yelpClient.search({
          term: message.text.split(' ', 2)[1],
          location: 'hanover, nh',
        }).then((response) => {
          bot.reply(message, `Go here to this restaurant near Hanover: ${response.jsonBody.businesses[0].name}!`);
        }).catch((e) => {
          bot.reply(message, 'Nothing found!');
          console.log(e);
        });
      } else {
        bot.reply(message, 'Please message me: "food ..." where ... is some food you want near Hanover');
      }
    } else {
      bot.reply(message, 'Goodbye!');
    }
  });
});
