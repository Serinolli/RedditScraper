const playwright = require("playwright");
const logger = require("./logger");

async function getPagePosts(page) {

}

async function main() {
    logger.info("launching...");
    const broswer = await playwright.chromium.launch({
        headless: false
    })
    const page = await (await broswer.newContext()).newPage();
    await page.goto("https://old.reddit.com/r/programming/new/")
    await broswer.close();
}

if(require.main === module) {
    main();
}