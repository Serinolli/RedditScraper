const playwright = require("playwright");
const logger = require("./logger");

async function parseComment(e) {
    const things = await e.$$("> .sitetable > .thing");
    let comments = [];
    for (const thing of things) {
      const attributes = await getAttributes(thing);
  
      let thingClass = attributes["class"];
      let id = attributes["data-fullname"];
      let children = await parseComment(await thing.$(".child"));
  
      let isDeleted = thingClass.includes("deleted");
      let isCollapsed = thingClass.includes("collapsed");
      let author = isDeleted ? "" : attributes["data-author"];
      let time = await thing.$eval("time", (el) => el.getAttribute("datetime"));
      let comment =
        isDeleted || isCollapsed
          ? ""
          : await thing.$eval("div.md", (el) => el.innerText.trim());
      let pointsText =
        isDeleted || isCollapsed
          ? ""
          : await thing.$eval(
              "span.score",
              (el) => el.innerText.trim().split(" ")[0],
            );
  
      let points = parseInt(pointsText);
      points = isNaN(points) ? 0 : points;
  
      comments.push({
        id,
        author,
        time,
        comment,
        points,
        children,
        isDeleted,
        isCollapsed,
      });
    }
  
    return comments;
  }


async function getPagePosts(page) {
    logger.info("getting posts from actual page...");
    let posts = [];

    for(const element of (await page.$$('.thing'))) {
        const id = await element.getAttribute("data-fullname");
        const subReddit = await element.getAttribute("data-subreddit-prefixed");
        const upvotes = await getPostScore(await (element.$$("div.midcol > .unvoted")));

        const time = await element.$('time');
        if(time == null) {
            continue;
        }

        const timeStamp = Date.parse(await time.getAttribute('datetime'));
        const author = await element.$eval('.author', (a) => a.innerText);
        const url = await element.getAttribute("data-url");

        posts.push({id, subReddit, timeStamp, author, url})
    }
    return posts;
}

async function getPostScore(e) {
    return parseInt(await e[0].getAttribute("title")) || 0;
}

async function getPostData({page,post}) {
    //TODO: Implement a way to summarize the content of the post url
    return [];
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

        if(lastPost.timestamp < minDate) {
            break;
        }
        let nextPageHREF = await page.$eval('.next-button a', (a) => a.href);
        await page.goto(nextPageHREF)
    }
    allPosts = allPosts.filter((post) => post.timeStamp > minDate);

    let data = [];
    logger.info("started getting posts informations...");
    for (const post of allPosts) {
        let postData = await getPostData({post,page});
        data.push(postData);
    }
    await broswer.close();
}

if(require.main === module) {
    main();
}