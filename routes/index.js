var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");
const { URLSearchParams } = require('url');

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

// Get product by id
router.get('/products/:id', async (req, res, next) => {
  let id = req.params.id;
  let url = apis.stock + '/products/' + id;
  let response = await fetch(url);
  let data = await response.json();
  res.json(data);
});

// Post new purchase. Required params idProd and quantity integers.
router.post('/buy', async (req, res) => {
  let idprod = parseInt(req.body.productid);
  let quantity = parseInt(req.body.quantity);

  let prodres = await fetch(apis.stock + '/products/' + idprod);
  let product = await prodres.json();
  product = product.data

  if (!product.id) {
    res.status(404).json({ 'message':'Product not found' });
    return
  }

  if (product.stock < quantity) {
    res.status(500).json({ 'message':'Not enough stock to complete purchase' });
    return
  }

  let saleparams = new URLSearchParams();
  saleparams.append('productid', product.id);
  saleparams.append('quantity', quantity);
  saleparams.append('date', new Date());
  saleparams.append('price', product.saleprice);


  let prodparams = new URLSearchParams();
  prodparams.append('name', product.name);
  prodparams.append('costPrice', product.costprice);
  prodparams.append('salePrice', product.saleprice);
  prodparams.append('productType', product.producttype);
  prodparams.append('stock', product.stock - quantity);

  
  let prodputres = await fetch(apis.stock + '/products/' + product.id, { method: 'PUT', body: prodparams });
  let prodputdata = await prodputres.json();
  console.log(prodputdata);

  let response = await fetch(apis.sales + '/sale/', { method: 'POST', body: saleparams });
  let data = await response.json();
  res.json(data);
})

module.exports = router;
