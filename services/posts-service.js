const axios = require('axios');
const config = require("../config/request-settings.json");
const logger = require("../logger")

async function savePosts(posts) {
  const options = { ...config, method: "POST", path: "/posts" };
  const url = `${options.host}${options.port}${options.path}`;

  await axios.post(url, posts)
  .then(response => {
    logger.info("Success! " + response)
  })
  .catch(error => {
    logger.info("Error! " + error)
  });
}

module.exports = {
  savePosts,
};
