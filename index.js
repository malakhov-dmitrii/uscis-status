const { formatDistanceToNow, formatDistanceToNowStrict } = require('date-fns');
const cron = require('node-cron');
const fastify = require('fastify')({ logger: true });
const puppeteer = require('puppeteer-core');
const { Telegraf } = require('telegraf');
// const chrome = require('chrome-aws-lambda');

const NUMBER = 'WAC2208151046';
const TELEGRAM_BOT_TOKEN = '1717140057:AAEsfxVO9GRl-yGc_uZdX0-QIIX9yWXG8hc';
const TELEGRAM_CHAT_ID = '264414372';

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const main = async () => {
  const browser = await puppeteer.launch({
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
    headless: true,

    executablePath: '/usr/bin/chromium-browser',
  });

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

  const distance = formatDistanceToNowStrict(new Date(2022, 9, 3), { unit: 'day', roundingMethod: 'ceil' });

  return `${text}
  
*${distance}* days left`;
};

// Declare a route
fastify.get('/', async (request, reply) => {
  const text = await main();
  console.log({ text });
  bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text);

  return { status: text };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

cron.schedule('0 3,14 * * 1-5', function () {
  main().then(text => {
    console.log({ text });
    bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text);
  });
});
