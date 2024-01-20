const axios = require('axios');
const config = require("../config/request-settings.json");
const logger = require("../logger")

async function savePosts(posts) {
  const options = { ...config, method: "POST", path: "/posts" };
  const url = `${options.host}${options.port}${options.path}`;

  await axios.post(url, posts)
  .then(() => {
    logger.info("Page posts analyzed successfully...")
  })
  .catch(() => {
    logger.info("Error while trying to analyze page posts ")
  });
}

module.exports = {
  savePosts,
};
