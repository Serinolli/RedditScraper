const config = require('../config/request-settings.json').OpenAI;
const axios = require('axios');
const logger = require("../logger")

async function getPageContent(content) {
  //Temporary... seeking ways to get page content
  return "";
}

module.exports = {
    getPageContent
}
    