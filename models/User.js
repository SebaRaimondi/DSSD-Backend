const apis = require('../apis.js');
const fetch = require("node-fetch");
const { URLSearchParams } = require('url');

class User {
    static rawLogin(email, pass) {
        let params = new URLSearchParams();
        params.append('email', email);
        params.append('pass', pass);

        return fetch(apis.users + '/login', { method: 'POST', body: params })
            .then(res => res.json())
    }
}

module.exports = User