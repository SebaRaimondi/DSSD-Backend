var express = require('express');
var router = express.Router();

const Coupon = require('../models/Coupon.js');
const Token = require('../models/Token.js');
const User = require('../models/User.js');
const Employee = require('../models/Employee.js');
const Product = require('../models/Product.js');
const Sale = require('../models/Sale.js');
const Bonita = require('../models/Bonita.js')

const resolvers = {}

const setResolver = caseId => {
  return new Promise((resolve, reject) => {
    resolvers[caseId] = resolve
  })
}

const resolve = caseId => resolvers[caseId];

router.put('/resolve', function (req, res) {
  resolve(req.headers.case)(req.body.res);
  res.status(200).json({ message: 'ok' })
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Backend' });
});

// GET products
router.get('/products', async (req, res, next) => {
  let token = req.header('token')
  let params = {}
  if (token) params.token = token

  let bonita = await Bonita.completeGetProducts(params)
  const response = await setResolver(bonita.case);
  res.status(200).json(response)
});

// Post new purchase. Required params idProd and quantity integers.
router.post('/buy', async (req, res) => {
  if (!req.body.productid) return res.status(400).json({ success: false, message: 'No productid received' })
  if (!req.body.quantity) return res.status(400).json({ success: false, message: 'No quantity received' })
  if (!req.body.caseid) return res.status(400).json({ success: false, message: 'No caseid received' })

  let token = req.header('token')
  let idprod = Number(req.body.productid);
  let quantity = Number(req.body.quantity);
  let coupnum = Number(req.body.coupon);
  let listCaseId = Number(req.body.caseid);

  if (!idprod) return res.status(400).json({ success: false, message: 'productid must be an integer' })
  if (!quantity) return res.status(400).json({ success: false, message: 'quantity must be an integer' })
  if (!listCaseId) return res.status(400).json({ success: false, message: 'quantity must be an integer' })
  if (req.body.coupon && !coupnum) return res.status(400).json({ success: false, message: 'coupnum must be an integer or not present' })

  if (idprod < 1) return res.status(400).json({ success: false, message: 'productid must be 1 or higher' })
  if (quantity < 1) return res.status(400).json({ success: false, message: 'quantity must be 1 or higher' })

  let params = { productid: idprod, quantity: quantity, caseid: listCaseId }

  if (token) params.token = token
  if (coupnum) params.coupon = coupnum

  let bonita = await Bonita.completeSell(params)
  const response = await setResolver(bonita.case);
  res.status(200).json(response)
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

module.exports = router;
