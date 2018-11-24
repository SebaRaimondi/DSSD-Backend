const apis = require('../apis.js');
const fetch = require("node-fetch");

class ProductType {
    static buildOne(json) {
        return Object.assign(new ProductType, json)
    }

    static getById(id) {
        return fetch(apis.stock + '/productTypes/' + id)
            .then(res => res.json())
            .then(json => json.data ? this.buildOne(json.data) : false)
    }

    static getManyById(ids) {
        return Promise.all(ids.map(id => ProductType.getById(id)))
            .then(types => {
                let arr = []
                types.map(t => arr[t.id] = t)
                return arr
            })
    }
}

module.exports = ProductType