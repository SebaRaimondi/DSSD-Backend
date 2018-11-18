var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");

const apis = require('../apis.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

// GET all products
router.get('/products/all', async (req, res, next) => {
  let response = await fetch(`${apis.stock}/products`);
  let data = await response.json();
  res.json(data);
});

// GET products with filter, sort or pagination
router.get('/products', async (req, res, next) => {
  let url = `${apis.stock}/products?`;

  let sort = req.query.sort || ''
  let filter = req.query.filter || ''
  let pagination = req.query.pagination || ''

  url += 'sort=' + sort
  url += '&filter=' + filter
  url += '&pagination=' + pagination

  let response = await fetch(url);
  let data = await response.json();
  res.json(data);
});

router.get('/products/:id', async (req, res, next) => {
  let id = req.params.id;
  let url = apis.stock + '/products/' + id;
  let response = await fetch(url);
  let data = await response.json();
  res.json(data);
});

module.exports = router;
