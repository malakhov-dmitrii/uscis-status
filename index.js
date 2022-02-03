const fastify = require('fastify')({ logger: true });
const puppeteer = require('puppeteer-core');
const { Telegraf } = require('telegraf');

const NUMBER = 'WAC2208151046';
const TELEGRAM_BOT_TOKEN = '1717140057:AAEsfxVO9GRl-yGc_uZdX0-QIIX9yWXG8hc';
const TELEGRAM_CHAT_ID = '264414372';

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const main = async () => {
  const browser = await puppeteer.launch(
    process.env.NODE_ENV === 'production'
      ? {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless,
        }
      : {}
  );

  const page = await browser.newPage();
  await page.goto('https://egov.uscis.gov/casestatus/landing.do');

  // find the form input by id "receipt_number"
  await page.type('#receipt_number', NUMBER);

  // find  the input with type 'submit'
  await page.click('input[type="submit"]');

  // wait for the page to load
  await page.waitForNavigation();

  // find the value of h1
  const text = await page.$eval('h1', el => el.innerText);
  await browser.close();

  return text;
};

// Declare a route
fastify.get('/', async (request, reply) => {
  const text = await main();
  bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text);

  return { status: text };
});
// Declare a route
fastify.get('/api/check', async (request, reply) => {
  const text = await main();
  bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text);

  return { status: text };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
