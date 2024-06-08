require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const dns = require("dns");
const { execPath } = require('process');

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

//middleware to accept post request
app.use(express.urlencoded({ extended: true }));

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  url: { type: String, required: true },
  short: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;



app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello APi' });
});

app.post('/api/shorturl', function (req, res) {
  (async () => {
    try {
      const count = await Url.countDocuments();
      const urlObject = new URL(req.body.url)

      dns.lookup(urlObject.hostname, (err, address, family) => {
        if (err) {
          res.send({ error: 'invalid url' });
        } else {
          const newUrl = new Url({ url: req.body.url, short: count + 1 });
          newUrl.save();
          res.send({ original_url: req.body.url, short_url: count + 1 });
        }
      });

    } catch (err) {
      console.log(err);
    }
  })();
});

app.get('/api/shorturl/:urlID', function (req, res) {
  const urlID = parseInt(req.params.urlID);
  Url.findOne({ short: urlID }).exec()
    .then(doc => {
      if (doc) {
        res.redirect(doc.url);
      } else {
        res.send({ error: 'invalid  url' });
      }
    })
    .catch(err => {
      res.send({ error: 'invalid  url' });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
