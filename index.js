const XLSX = require('xlsx');
const { chromium } = require('playwright');
const userDataDir = 'C:\\Users\\jore_\\AppData\\Local\\Google\\Chrome\\User Data\\Default';

const url = 'https://twitter.com/i/flow/login';

(async () => {
  try {
    const browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto(url);

    const inputField = await page.waitForSelector('input[autocomplete="username"]');

    await inputField.type('correo');
    //Hacer enter
    await page.keyboard.press('Enter');
    const inputFieldPass = await page.waitForSelector('input[autocomplete="current-password"]');
    await inputFieldPass.type('password');
    await page.keyboard.press('Enter');

    const inputSearch = await page.waitForSelector('input[placeholder="Buscar"]');
    await inputSearch.type('M');
    await page.goto('https://twitter.com/2010MisterChip');
    await page.waitForSelector('article[data-testid="tweet"]');

    const extractTweets = async () => {
      const tweets = await page.$$eval('article', (articles) => {
        return articles.map((article) => {
          const tweetText = article.querySelector('[data-testid="tweetText"]')?.innerText;
          const tweetAuthor = article.querySelector('[data-testid="User-Name"]')?.innerText || '';
          console.log(tweetText); // Muestra el texto del tweet por consola
          return { usuario: tweetAuthor, contenido: tweetText };
        });
      });
      return tweets;
    };

    let tweets = [];
    let previousHeight = 0;

    // Bucle para hacer scroll hasta el final de la página
    while (true) {
      tweets = tweets.concat(await extractTweets());
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      //Tiempo de espera entre un segundo y 5 segundos
      const waitTime = Math.floor(Math.random() * 5000) + 1000;
      await page.waitForTimeout(waitTime); // Espera para que carguen los nuevos tweets

      // Comprueba si se ha alcanzado el final de la página
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) {
        break;
      }
      previousHeight = newHeight;
    }

    const csvData = tweets.map((tweet) => [tweet.usuario, tweet.contenido]);
    const csvHeader = ['Usuario', 'Contenido'];
    csvData.unshift(csvHeader);

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tweets');

    XLSX.writeFile(wb, 'mis_tweets.csv');

    await browser.close();
  } catch (err) {
    console.log(err);
  }
})();
