const apis = require('../apis.js');
const fetch = require("node-fetch");
const {URLSearchParams} = require('url');

class Coupon {
    used;

    get isUsed() {
        return this.used === '1'
    }

    static buildOne(json) {
        return Object.assign(new Coupon, json)
    }

    static getByNumber(num) {
        return fetch(apis.coupons + '/coupons/number/' + num)
            .then(res => res.json())
            .then(json => json.data ? this.buildOne(json.data) : false)
    }

    static rawGetByNumber(num) {
        return fetch(apis.coupons + '/coupons/number/' + num)
            .then(res => res.json())
    }

    use() {
        let params = new URLSearchParams();
        params.append('number', this.number);
        params.append('used', '1');
        params.append('discount_percentage', this.discount_percentage);

        return fetch(apis.coupons + '/coupons/' + this.id, {method: 'PUT', body: params});
    }

    unUse() {
        let params = new URLSearchParams();
        params.append('number', this.number);
        params.append('used', '0');
        params.append('discount_percentage', this.discount_percentage);

        return fetch(apis.coupons + '/coupons/' + this.id, {method: 'PUT', body: params});
    }
}

module.exports = Coupon;