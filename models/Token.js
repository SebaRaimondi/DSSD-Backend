const apis = require('../apis.js');
const fetch = require("node-fetch");
const {URLSearchParams} = require('url');

class Token {
    static buildOne(json) {
        return Object.assign(new Token, json)
    }

    static verify(token) {
        if (!token) return false;

        let params = new URLSearchParams();
        params.append('token', token);
        return fetch(`${apis.users}/verify/`, {method: 'POST', body: params})
            .then(res => res.json())
            .then(json => json.success ? Token.buildOne(json.decoded) : false)
    }
}

module.exports = Token;