const { MongoClient } = require("mongodb");
require("dotenv").config({ path: __dirname + "/.env" });

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(
      process.env.MONGODB_CONNECT_URL
    )
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        console.log(err);
        return cb(err);
      });
  },
  getDb: () => dbConnection,
};
