var express = require('express');
var router = express.Router();

const Coupon = require('../models/Coupon.js');
const Token = require('../models/Token.js');
const User = require('../models/User.js');
const Employee = require('../models/Employee.js');
const Product = require('../models/Product.js');
const Sale = require('../models/Sale.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

// GET all products
router.get('/products/all', async (req, res, next) => {
  let token = await Token.verify(req.header('token'))
  let isEmployee = await Employee.isEmployee(token.email)

  let response = await Product.rawGetAll()
  response.data = await Product.buildManyWithPrices(response.data, isEmployee)

  res.json(response);
});

// GET products with filter, sort or pagination
router.get('/products', async (req, res, next) => {
  let token = await Token.verify(req.header('token'))
  let isEmployee = await Employee.isEmployee(token.email)

  let sort = req.query.sort || ''
  let filter = req.query.filter || ''
  let pagination = req.query.pagination || ''

  let response = await Product.rawGetCustom(sort, filter, pagination)
  response.data = await Product.buildManyWithPrices(response.data, isEmployee)

  res.json(response);

});

// Get product by id
router.get('/products/:id', async (req, res, next) => {
  let token = await Token.verify(req.header('token'))
  let isEmployee = await Employee.isEmployee(token.email)

  let id = req.params.id;

  let response = await Product.rawGetOne(id)
  response.data = await Product.buildOneWithPrices(response.data, isEmployee)

  res.json(response);

});

// Post new purchase. Required params idProd and quantity integers.
router.post('/buy', async (req, res) => {
  let token = await Token.verify(req.header('token'))
  let isEmployee = await Employee.isEmployee(token.email)

  let idprod = parseInt(req.body.productid);
  let quantity = parseInt(req.body.quantity);
  let coupnum = parseInt(req.body.coupon);

  if (!idprod) return res.status(400).json({ 'message':'No product received, check request', success: false })
  if (!quantity) return res.status(400).json({ 'message':'No quantity received, check request', success: false })
  if (coupnum && isEmployee) return res.status(500).json({ message:'Employees cant use coupons', success: false })

  let [product, coupon] = await Promise.all([Product.getOne(idprod, isEmployee), Coupon.getByNumber(coupnum)])

  if (!product) return res.status(404).json({ 'message':'Product not found' });
  if (coupnum) {
    if (!coupon) return res.status(404).json({ 'message':'Coupon not found', success: false });
    if (coupon.isUsed) return res.status(500).json({ message:'Coupon has already been used', success: false })

    coupon.use()
    product.applyDiscount(coupon.discount_percentage)
  }

  let put = await product.decreaseStockBy(quantity)

  if (!put.status == 'success') {
    if (coupnum) coupon.unUse()
    return res.json(put)
  }

  let sale = await Sale.generate(product, quantity)
  res.status(200).json({ message:'Success', data: sale, success: true })
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

router.get('/isEmployee/', async (req, res, next) => {
  if (!req.header('token')) return res.status(500).json({ message: 'No token received', success: false })
  let token = await Token.verify(req.header('token'))
  if (!token) return res.status(500).json({ message: 'Invalid token', success: false })

  let isEmployee = await Employee.isEmployee(token.email)
  if (!isEmployee) return res.status(500).json({ email: token.email, message:'Token email is not an employee email', success: false })
  res.status(200).json({ email: token.email, message: 'Token email is an employee email', success: true })
})

router.get('/test', async (req, res, next) => {
  let Bonita = require('../models/Bonita.js')

  let employeetoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5wZXJlekBnbWFpbC5jb20iLCJpc0FkbWluIjpmYWxzZSwiaWF0IjoxNTQzMTg1ODM0fQ.We9eM72L5TlPZFRm-M-8jvYk7mgyhyFbsOSfBDBQuJ8"
  let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE1NDMxODg2Nzl9.RpfT0_TKgVy0XcV7djG-fyyvClZEWfx2QR8dVOcfnds"
  let prodid = 2

  let variables = [
    {
      name: "token",
      value: token,
    },
    {
      name: "productid",
      value: 1
    }
  ]

  /*
  let products = await Bonita.completeGetProducts({})
  res.status(200).json(products)
  */

  let bonita = await Bonita.completeSell({ token: employeetoken, productid: 3, quantity: 1 })
  console.log(bonita)
})

module.exports = router;
