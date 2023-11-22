const playwright = require("playwright");
const logger = require("./logger");

async function getPagePosts(page) {
    logger.info("getting posts from actual page...");
    let posts = [];

    for(const element of (await page.$$('.thing'))) {
        const id = await element.getAttribute("data-fullname");
        const subReddit = await element.getAttribute("data-subreddit-prefixed");

        const time = await element.$('time');
        if(time == null) {
            continue;
        }

        const timeStamp = Date.parse(await time.getAttribute('datetime'));
        const author = await element.$eval('.author', (a) => a.innerText);
        const url = await element.$eval('a.comments', (a) => {
            a.getAttribute('href')
        })

        posts.push({id, subReddit, timeStamp, author, url})
    }
    return posts;
}

async function main() {
    logger.info("launching...");
    const broswer = await playwright.chromium.launch({
        headless: false
    })
    const page = await (await broswer.newContext()).newPage();
    await page.goto("https://old.reddit.com/r/programming/new/");
    logger.info("connected!");

    let hour = 1000 * 60 * 60;
    let minDate = Date.now() - (24 * hour);
    let earliest = new Date();

    let allPosts = [];

    while (minDate < earliest) {
        let pagePosts = await getPagePosts(page);
        if(pagePosts.length == 0) {
            break;
        }
        allPosts = allPosts.concat(pagePosts);
        let earliestPost = allPosts[allPosts.length - 1];
        earliest = earliestPost.timestamp;

        if(earliestPost.timestamp < minDate) {
            break;
        }
        let nextPageHREF = await page.$eval('.next-button a', (a) => a.href);
        await page.goto(nextPageHREF)
    }
    logger.info(`found ${allPosts.length} posts`)
    await broswer.close();
}

if(require.main === module) {
    main();
}