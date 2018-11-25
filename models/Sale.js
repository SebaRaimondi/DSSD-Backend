const apis = require('../apis.js');
const fetch = require("node-fetch");
const { URLSearchParams } = require('url');

class Sale {
    constructor(id, prod, quantity, date, price) {
        this.id = id
        this.prod = prod
        this.quantity = quantity
        this.date = date
        this.price = price
    }

    static generate(product, quantity) {
        let params = new URLSearchParams();
        params.append('productid', product.id);
        params.append('quantity', quantity);
        params.append('date', new Date());
        params.append('price', product.price);
      
        return fetch(apis.sales + '/sale/', { method: 'POST', body: params })
            .then(res => res.json())
            .then(json => new Sale(json.id, product, json.quantity, json.date, json.price))
    }
}

module.exports = Sale