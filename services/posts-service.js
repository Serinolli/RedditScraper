const https = require("https");
const config = require("../config/request-settings.json");

function savePosts(posts) {
  const options = { ...config, method: "POST", path: "/posts", data: posts };

  https
    .request(options, (resp) => {
      // log the data
      resp.on("data", (d) => {
        console.log(d);
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

module.exports = {
  savePosts,
};
