const apis = require('../apis.js');
const fetch = require("node-fetch");
const ProductType = require('./ProductType.js');

class Product {
    saleprice;
    costprice;

    get margin() {
        return this.saleprice - this.costprice
    }

    get isElectro() {
        return this.type.description === 'electro'
    }

    get costplusten() {
        return this.costprice * 1.1
    }

    get finalPrice() {
        if (this.isElectro) return this.costprice + this.margin / 2;
        if (this.costplusten < this.saleprice) return this.costplusten + (this.saleprice - this.costplusten) * 0.2;
        return this.saleprice
    }

    static buildOne(json) {
        return Object.assign(new Product, json)
    }

    static buildOneWithPrices(json, isEmployee) {
        let prod = Product.buildOne(json);
        return ProductType.getById(prod.producttype)
            .then(t => prod.populateType(t))
            .then(p => p.updatePrice(isEmployee))
    }

    static buildMany(json) {
        let prods = json.map(p => this.buildOne(p));
        let typeids = [...new Set(prods.map(p => p.producttype))];
        return ProductType.getManyById(typeids)
            .then(types => prods.map(p => p.addType(types[p.producttype])))
    }

    static buildManyWithPrices(json, isEmployee) {
        return Product.buildMany(json)
            .then(prods => prods.map(p => p.updatePrice(isEmployee)))
    }

    static rawGetAll() {
        return fetch(`${apis.stock}/products`)
            .then(res => res.json())
    }

    static rawGetCustom(sort, filter, pagination) {
        let url = `${apis.stock}/products?sort=${sort}&filter=${filter}&pagination=${pagination}`;
        return fetch(url)
            .then(res => res.json())
    }

    static getAll() {
        return Product.rawGetAll()
            .then(json => json.data ? this.buildMany(json.data) : false)
    }

    static getCustom(sort, filter, pagination) {
        return Product.rawGetCustom(sort, filter, pagination)
            .then(json => json.data ? this.buildMany(json.data) : false)
    }

    static rawGetOne(id) {
        return fetch(`${apis.stock}/products/${id}`)
            .then(res => res.json())
    }

    static getOne(id, isEmployee) {
        return Product.rawGetOne(id)
            .then(json => json.data.id ? this.buildOneWithPrices(json.data, isEmployee) : false)
    }

    addType(type) {
        this.type = type;
        delete this.producttype;
        return this
    }

    setEmployeePrice() {
        this.price = this.costprice
    }

    setElectroType() {
        this.price = this.margin
    }

    updatePrice(isEmployee) {
        this.price = isEmployee ? this.costprice.toFixed(2) : this.finalPrice.toFixed(2);
        delete this.costprice;
        delete this.saleprice;
        return this
    }

    populateType() {
        return ProductType.getById(this.producttype)
            .then(t => this.addType(t))
    }

    applyDiscount(discount) {
        this.price = (this.price - this.price * discount / 100).toFixed(2)
    }

    decreaseStockBy(quantity) {
        return fetch(apis.stock + '/products/' + this.id + '/reduceStock/' + quantity, {method: 'PUT'})
            .then(res => res.json())
    }
}

module.exports = Product;