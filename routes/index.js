var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");
const { URLSearchParams } = require('url');

const apis = require('../apis.js');

const Coupon = require('../models/Coupon.js');
const Token = require('../models/Token.js');
const User = require('../models/User.js');
const Employee = require('../models/Employee.js');

function getTypeIds(products) {
  let set = new Set(products.map(prod => { return prod.producttype }))
  return [...set]
}

async function getTypes(products) {
  let typeids = getTypeIds(products);
  let promise = await Promise.all(typeids.map(async typeid => {
    return fetch(apis.stock + '/productTypes/' + typeid)
  }))
  let jsons = await Promise.all(promise.map(async prom => {
    return prom.json()
  }))
  let types = []
  let pretypes = jsons.map(res => {
    return res.data
  });
  pretypes.forEach(type => {
    types[type.id] = type
  });
  return types
}

function setEmployeePrice(prod) {
    prod.price = prod.costprice.toFixed(2)
}

function calcPrice(prod) {
  let margin = prod.saleprice - prod.costprice
  if (prod.type.description == 'electro') return prod.price = (prod.costprice + margin/2).toFixed(2)
  let costplusten = prod.costprice * 1.1
  if (costplusten < prod.saleprice) return prod.price = (costplusten + (prod.saleprice - costplusten) * 0.2).toFixed(2)
  return prod.price = prod.saleprice
}

function removePrices(prod) {
  delete prod.costprice
  delete prod.saleprice
}

function setPrices(products, isEmployee) {
  let setPrice = isEmployee ? setEmployeePrice : calcPrice
  products.forEach(prod => {
    setPrice(prod)
    removePrices(prod)
  });
}

async function populateTypes(products) {
  let types = await getTypes(products)
  return products.forEach(prod => {
    prod.type = types[prod.producttype]
    delete prod.producttype
  })
}

async function handleProducts(products, isEmployee) {
  await populateTypes(products)
  setPrices(products, isEmployee)
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

// GET all products
router.get('/products/all', async (req, res, next) => {
  let token = await Token.verify(req.body.token)
  let employee = await Employee.isEmployee(token.email)

  let response = await fetch(`${apis.stock}/products`);
  let data = await response.json();
  let products = data.data

  await handleProducts(products, employee)

  res.json(data);
});

// GET products with filter, sort or pagination
router.get('/products', async (req, res, next) => {
  let token = await Token.verify(req.body.token)
  let employee = await Employee.isEmployee(token.email)

  let url = `${apis.stock}/products?`;

  let sort = req.query.sort || ''
  let filter = req.query.filter || ''
  let pagination = req.query.pagination || ''

  url += 'sort=' + sort
  url += '&filter=' + filter
  url += '&pagination=' + pagination

  let response = await fetch(url);
  let data = await response.json();

  let products = data.data
  await handleProducts(products, employee)

  res.json(data);
});

// Get product by id
router.get('/products/:id', async (req, res, next) => {
  let token = await Token.verify(req.body.token)
  let employee = await Employee.isEmployee(token.email)

  let id = req.params.id;
  let url = apis.stock + '/products/' + id;
  let response = await fetch(url);
  let data = await response.json();

  let product = data.data
  await handleProducts([product], employee)

  res.json(data);
});

// Post new purchase. Required params idProd and quantity integers.
router.post('/buy', async (req, res) => {
  let token = await Token.verify(req.body.token)
  let employee = await Employee.isEmployee(token.email)

  let idprod = parseInt(req.body.productid);
  let quantity = parseInt(req.body.quantity);
  let coupnum = parseInt(req.body.coupon);

  if (!idprod) return res.status(400).json({ 'message':'No product received, check request' })
  if (!quantity) return res.status(400).json({ 'message':'No quantity received, check request' })

  let prodprom = fetch(apis.stock + '/products/' + idprod)
  let coupprom = fetch(apis.coupons + '/coupons/number/' + coupnum)

  let [prodres, coupres] = await Promise.all([prodprom, coupprom])
  let [proddata, coupdata] = await Promise.all([prodres.json(), coupres.json()])
  let product = proddata.data
  let coupon = await Coupon.getByNumber(coupnum)

  if (!product.id) return res.status(404).json({ 'message':'Product not found' });

  if (coupnum) {
    if (!coupon) return res.status(404).json({ 'message':'Coupon not found' });
    if (coupon.isUsed()) return res.status(500).json({ message:'Coupon has already been used', success: false })
    coupon.use()
  }

  let prodparams = new URLSearchParams();
  prodparams.append('name', product.name);
  prodparams.append('costPrice', product.costprice);
  prodparams.append('salePrice', product.saleprice);
  prodparams.append('productType', product.producttype);
  prodparams.append('stock', product.stock - quantity);

  let prodputres = await fetch(apis.stock + '/products/' + product.id, { method: 'PUT', body: prodparams });
  let prodputdata = await prodputres.json();

  await handleProducts([product], employee)

  let price = !employee && coupnum ? product.price - product.price * coupon.discount_percentage / 100 : product.price 

  let saleparams = new URLSearchParams();
  saleparams.append('productid', product.id);
  saleparams.append('quantity', quantity);
  saleparams.append('date', new Date());
  saleparams.append('price', price);

  if (!(prodputdata.status == 'success')) return res.status(500).json({ 'message':'Not enough stock' })

  let response = await fetch(apis.sales + '/sale/', { method: 'POST', body: saleparams });
  let data = await response.json();
  res.json(data);
})

router.post('/login', async (req, res, next) => {
  let email = req.body.email
  let pass = req.body.pass

  if (!email || !pass) return res.status(500).json({ message: 'Check request', success: false })

  res.json(await User.rawLogin(email, pass))
});

router.get('/coupon/:number', async (req, res, next) => {
  let number = parseInt(req.params.number)

  if (!number) return res.status(500).json({ message: 'Invalid request', success: false })

  res.json(await Coupon.rawGetByNumber(number))
})

module.exports = router;
