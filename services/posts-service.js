const axios = require('axios');
const config = require("../config/request-settings.json");
const logger = require("../logger")

function savePosts(posts) {
  const options = { ...config, method: "POST", path: "/posts", data: posts };
  const url = `${options.host}${options.port}/posts`;

  axios.post(url, posts)
  .then(response => {
    logger.info("Teste" + response)
  })
  .catch(error => {
    logger.info("Teste" + error)
  });
}

module.exports = {
  savePosts,
};
