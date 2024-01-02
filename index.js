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

async function getPostData({page,post}) {
    logger.info("getting posts from actual page...", {post: post});

    await page.goto(post.url);

    const sitetable = await page.$('div.sitetable');
    const thing = await sitetable.$('.thing');

    let id = post.id;
    let subreddit = post.subreddit;

    const attributes = await getAttributes(thing);
    let dataType = attributes["data-type"];
    let dataURL = attributes["data-url"];
    let isPromoted = attributes["data-promoted"] === "true";
    let isGallery = attributes["data-gallery"] === "true";
    let title = await page.$eval("a.title", (el) => el.innerText);
    let points = parseInt(await sitetable.$(".score.unvoted").innerText);
    let text = await sitetable.$("div.usertext-body").innerText;

    let comments = [];
    try {
        comments = await parseComment(await page.$("div.commentarea"));
    } catch (e) {
        logger.error("error parsing comments", { error: e });
    }

    return {
        id,
        subreddit,
        dataType,
        dataURL,
        isPromoted,
        isGallery,
        title,
        timestamp: post.dt,
        timestamp_millis: post.timestamp,
        author: post.author,
        url: post.url,
        points: isNaN(points) ? 0 : points,
        text,
        comments,
      };
}


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
        const url = await element.getAttribute("data-url");

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