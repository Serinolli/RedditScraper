const playwright = require("playwright");
const logger = require("./logger");
const postService = require("./services/posts-service");

async function getPagePosts(page) {
    logger.info("getting posts from actual page...");
    let posts = [];

    for(const element of (await page.$$('.thing'))) {
        const isPromoted = await element.evaluate(b => {
            return b.classList.contains('promoted');
        });
        if(isPromoted) continue;
        
        const id = await element.getAttribute("data-fullname");
        const subReddit = await element.getAttribute("data-subreddit-prefixed");
        const title = await (await element.$$(".entry > .top-matter > .title > a"))[0].evaluate(a => {
            return a.innerText;
        });

        //Reddit hides upvotes from recent posts to mitigate the bandwagon effect 
        //In this case, setting temporarily upvotes as 0
        const upvotes = await (await (element.$$("div.midcol > .unvoted")))[0].getAttribute("title") || 0;

        const time = await element.$('time');
        if(time == null) {
            continue;
        }

        const timeStamp = Date.parse(await time.getAttribute('datetime'));
        const author = await element.$eval('.author', (a) => a.innerText);
        const url = await element.getAttribute("data-url");

        const post = {id, subReddit, timeStamp, author, url, title, upvotes}
        logger.info(JSON.stringify(post));
        posts.push(post)
    }
    return posts;
}

async function getPostData(url) {
    //TODO: Implement a way to summarize the content of the post url
    return "";
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
        let lastPost = allPosts[allPosts.length - 1];
        earliest = lastPost.timeStamp;

        //The line below sends a save posts request to the API, commented out to avoid breaking the app while the API is being built.
        //await postService.savePosts(pagePosts);

        if(lastPost.timestamp < minDate) {
            break;
        }

        let nextPageHREF = await page.$eval('.next-button a', (a) => a.href);
        await page.goto(nextPageHREF)
    }

    logger.info("started getting posts informations...");
    for (let i = 0; i < allPosts.length; i++) {
        allPosts[i].content = await getPostData(allPosts[i].url);
    }
    logger.info("The posts from yesterday to this moment have been analyzed")
    await broswer.close();
}

if(require.main === module) {
    main();
}