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

  return text;
};

main().then(text => {
  console.log({ text });
  bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text);
});
