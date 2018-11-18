var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");

const apis = require('../apis.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

router.get('/products', async function(req, res, next) {
  let response = await fetch(apis.stock + 'products');
  res.json(await response.json());
});

module.exports = router;
