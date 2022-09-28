let axios = require("axios");
/* Importing the connectToDb and getDb functions from the db.js file. */
const { connectToDb, getDb } = require("./db");
var colors = require('colors');
const easyTunnel = require("@namecheap/easy-tunnel");
let express = require("express");
let app = express();
require("dotenv").config({ path: __dirname + "/.env" });
let cors = require("cors");
let allowedOrigins = [`${process.env.SERVER1}`, `${process.env.SERVER2}`];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 6342;

const dateObj = new Date();
const month = dateObj.getUTCMonth() + 1; //months from 1-12
const day = dateObj.getUTCDate();
const year = dateObj.getUTCFullYear();
const newdate = year + "/" + month + "/" + day;
const details = [];


let db;

/* Connecting to the MongoDB database. */
connectToDb((err) => {
  if (!err) {
    console.log("Connected to MongoDb succesfully".green);
    db = getDb();
  } else {
    console.log('Error connecting to MongoDb'.underline.red);
  }
});

app.get("/", (req, res) => {
  res.set("Content-Type", "application/json");
  //   set api key on the header
  const key = process.env.SERVER_API_KEY;
  const apiKey = req.headers.apikey;
  if (apiKey === key) {
    res.status(200).send({ message: "SUCCESS API_KEY is Valid" });
  } else {
    res.status(401).send({ message: "API_KEY is incorrect" });
  }
});

app.get("/app", (req, res) => {
  res.set("Content-Type", "application/json");
  //   set api key on the header
  const key = process.env.SERVER_API_KEY;
  const apiKey = req.headers.apikey;

  if (apiKey === key) {
    res.status(200).send(details);
  } else {
    res.status(401).send({ message: "API_KEY is incorrect" });
  }
});

app.post("/send", function (req, res) {
  res.set("Content-Type", "application/json");
  const findID = details.find((findID) => findID.appid === req.body.appid);
  const randomID = Math.floor(Math.random() * 234560) + 123456;
  req.body.releasedDate = newdate;
  const data = req.body;
  //   set api key on the header
  const key = process.env.SERVER_API_KEY;
  const apiKey = req.headers.apikey;

  /**
   * If the id is existing, send a message saying that the id is already in use. If the id is not found,
   * send a message saying that the id is invalid. If the id is found and the id is less than "6", send a
   * message saying that the id is valid.
   */
  const Validate = () => {
    if (findID) {
      res.status(300).send({ message: "That app is already in use" });
    } else {
      req.body.appid = randomID;
      req.body.status = 'OK';
      (async () => {
        const aPort = req.body.Port;

        const tunnel = await easyTunnel({ port: aPort });

        // the assigned public url for your tunnel
        // i.e. https://abcdefgjhij.localtunnel.me
        let requestedPort = details[details.length - 1].Port;
        tunnel.url; /**
        * Returns the URL of the page that the filter is applied to.
        * @returns {string} The URL of the page that the filter is applied to.
        */
        console.log(tunnel.url);
        requestedPort = tunnel.url;
        console.log(requestedPort);
        req.body.domainURL = requestedPort;
        tunnel.on("close", () => {
          console.log("tunnel closed");
        });
      })();
      details.push(data);
      res.status(200).send(data);
      /**
       * Inserts the given data into the database.       
       * @param {object} data - the data to insert into the database.       
       * @returns None       
       */
      db.collection('users').insertOne(data).then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err)
      })
    }
  };

  if (apiKey === key) {
    Validate();
  } else {
    res.status(401).send({ message: "API_KEY is incorrect" });
  }
});

app.put("/change/status", (req, res) => {
  res.set("Content-Type", "application/json");
  const newstatus = details.find(
    (newstatus) => newstatus.appid === req.body.appid
  );
  const key = process.env.SERVER_API_KEY;
  const apiKey = req.headers.apikey;

  const ValidateAppID = () => {
    /* Checking if the application id is valid. If the application id is valid, it will change the
    status of the application. If the application id is not valid, it will send a message saying
    that the application id is invalid. */
    if (!newstatus) {
      res.status(401).send({ message: "Invalid Application ID" });
    } else {
      /* Changing the status of the application. */
      newstatus.status = req.body.status;
      res.status(200).send(newstatus);
    }
  };

  /* Checking if the api key is valid. If the api key is valid, it will execute the function. If the
  api key is not valid, it will send a message saying that the api key is incorrect. */
  if (apiKey === key) {
    ValidateAppID();
  } else {
    res.status(401).send({ message: "API_KEY is incorrect" });
  }
});
/* This is a function that is used to find an app information via it's id. */
app.get("/track/:id", function (req, res) {
  const trackId = details.find(
    (trackId) => trackId.appid === parseInt(req.params.id)
  );
  /**
   * A function that takes in a track ID and returns a response with the track ID.           
   * @param {string} trackId - the track ID to return           
   * @returns None           
   */
  if (!trackId) {
    res.status(404).send({ message: "Invalid app ID*" });
  } else {
    res.status(200).send(trackId);
  }
});

/* Deleting the application via id. */
app.delete("/delete/:id", function (req, res) {
  const config = details.find(
    (config) => config.appid === parseInt(req.params.id)
  );
  if (!config) {
    res.status(404).send({ message: "Your app does not exist" });
  } else {
    // delete the app
    const index = details.indexOf(config);
    details.splice(index, 1);
    res.status(200).send({ message: "Your app has been deleted" });
  }
});

app
  .listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  })
  .on("error", function (err) {
    console.log(err);
  });
