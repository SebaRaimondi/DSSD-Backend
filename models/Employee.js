const apis = require('../apis.js');
const fetch = require("node-fetch");

class Employee {
    static buildOne(json) {
        return Object.assign(new Employee, json)
    }

    static isEmployee(email) {
        if (!email) return false
        
        return fetch(apis.staff + '/isEmployee/' + email)
            .then(res => res.json())
            .then(json => json.data.isEmployee)
    }
}

module.exports = Employee