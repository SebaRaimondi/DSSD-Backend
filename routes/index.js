var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");

const apis = require('../apis.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

router.get('/api/products', async (req, res, next) => {
  let url = `${apis.stock}/products?`;

  let sort = req.query.sort || ''
  let filter = req.query.filter || ''
  let pagination = req.query.pagination || ''

  url += 'sort=' + sort
  url += '&filter=' + filter
  url += '&pagination=' + pagination

  console.log(url)

  let response = await fetch(url);
  let data = await response.json();
  res.json(data);
});

module.exports = router;
