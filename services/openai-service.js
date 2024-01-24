const config = require('../config/request-settings.json').OpenAI;
const axios = require('axios');
const logger = require("../logger")

async function getPageContent(content) {
  const requestData = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: content }],
    temperature: 0.3,
  };

  await axios.post("https://api.openai.com/v1/chat/completions", requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.KEY}`,
      },
    })
    .then((response) => {
      console.log("Response:", response.data);
    })
    .catch((error) => {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    });
}

module.exports = {
    getPageContent
}
    