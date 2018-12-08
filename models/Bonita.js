const fetch = require("@types/node-fetch");
const {URLSearchParams} = require('url');
const bonita = 'http://localhost:8080/bonita';

const getCookies = (res) => res.headers.get('set-cookie').split(', ');
const getCoookieValue = (cookie) => cookie.split('; ')[0].split('=')[1];
const getToken = (cookies) => getCoookieValue(cookies[2]);
const getSession = (cookies) => getCoookieValue(cookies[1]);
const getTenant = (cookies) => getCoookieValue(cookies[0]);

class Bonita {
    constructor(res) {
        let cookies = getCookies(res);
        this.tenant = getTenant(cookies);
        this.token = getToken(cookies);
        this.session = getSession(cookies);
        this.process = false
    }

    static get user() {
        return 'walter.bates'
    }

    static get pass() {
        return 'bpm'
    }

    get cookies() {
        return `bonita.tenant=${this.tenant}; BOS_Locale=es; JSESSIONID=${this.session}; X-Bonita-API-Token=${this.token}`
    }

    get headers() {
        return {Cookie: this.cookies, 'Content-Type': 'application/json', 'X-Bonita-API-Token': this.token}
    }

    static login() {
        let params = new URLSearchParams();
        params.append('username', Bonita.user);
        params.append('password', Bonita.pass);
        params.append('redirect', false);

        return fetch(`${bonita}/loginservice`, {method: 'POST', body: params}).then(res => new Bonita(res))
    }

    // if params.productid, will return an array of only one product
    // if params.token, price will change if token owner is an employee
    static async completeGetProducts(params = {}) {
        let variables = [];

        let bonita = await Bonita.login();

        await bonita.setProcess('Productos');

        if (params.token) variables.push({name: 'token', value: params.token});

        await bonita.newCase(variables);

        return bonita
    }

    static async completeSell(params = {}) {
        let variables = [];

        let bonita = await Bonita.login();

        await bonita.setProcess('Venta3');

        if (!params.productid || !params.quantity || !params.caseid) return false;

        variables.push({name: 'productid', value: params.productid});
        variables.push({name: 'quantity', value: params.quantity});
        variables.push({name: 'caseid', value: params.caseid});

        if (params.token) variables.push({name: 'token', value: params.token});
        if (params.coupon) variables.push({name: 'couponnum', value: params.coupon});

        await bonita.newCase(variables);

        return bonita
    }

    getProcesses() {
        return fetch(bonita + '/API/bpm/process?c=10&p=0', {headers: this.headers}).then(res => res.json())
    }

    getProcess(name) {
        return this.getProcesses().then(processes => processes.find(p => p.name === name))
    }

    async setProcess(name) {
        this.process = (await this.getProcess(name)).id
    }

    postCase(params) {
        return fetch(bonita + '/API/bpm/case', {
            headers: this.headers,
            method: 'POST',
            body: JSON.stringify({processDefinitionId: this.process, variables: params})
        }).then(res => res.json())
    }

    async newCase(params = []) {
        this.case = (await this.postCase(params)).id
    }
}


module.exports = Bonita;