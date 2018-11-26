const fetch = require("node-fetch");
const { URLSearchParams } = require('url');
const bonita = 'http://localhost:8080/bonita'

const getCookies = (res) => res.headers.get('set-cookie').split(', ')
const getCoookieValue = (cookie) => cookie.split('; ')[0].split('=')[1]
const getToken = (cookies) => getCoookieValue(cookies[2])
const getSession = (cookies) => getCoookieValue(cookies[1])
const getTenant = (cookies) => getCoookieValue(cookies[0])

class Bonita {
    constructor(res) {
        let cookies = getCookies(res)
        this.tenant = getTenant(cookies)
        this.token = getToken(cookies)
        this.session = getSession(cookies)
        this.process = false
    }

    get cookies() {
        return 'bonita.tenant=' + this.tenant + '; BOS_Locale=es; JSESSIONID=' + this.session + '; X-Bonita-API-Token=' + this.token
    }

    get headers() {
        return { Cookie: this.cookies, 'Content-Type': 'application/json', 'X-Bonita-API-Token': this.token }
    }

    static get user() {
        return 'walter.bates'
    }

    static get pass() {
        return 'bpm'
    }
    
    static login() {
        let params = new URLSearchParams()
        params.append('username', Bonita.user)
        params.append('password', Bonita.pass)
        params.append('redirect', false)

        return fetch(bonita + '/loginservice', { method: 'POST', body: params })
            .then(res => new Bonita(res))
    }

    getProcess() {
        return fetch(bonita + '/API/bpm/process?c=10&p=0', { headers: this.headers })
            .then(res => res.json())
            .then(json => json.find(p => p.name == 'Pool Grupo 1'))
    }

    async setProcess() {
        this.process = (await this.getProcess()).id
    }

    getVariables(params) {
    }

    postCase(params) {
        return fetch(bonita + '/API/bpm/case', { headers: this.headers, method: 'POST', body: JSON.stringify({ processDefinitionId: this.process, variables: params }) })
            .then(res => res.json())
    }

    async newCase(params = []) {
        this.case = (await this.postCase(params)).id
    }

    getContext() {
        return fetch(bonita + '/API/bpm/case/' + this.case + '/context', { headers: this.headers })
            .then(res => res.json())
    }

    // no mirar
    async getProducts() {
        let products
        let res
        while (!products) {
            await new Promise(resolve => setTimeout(() => resolve(), 100))
            res = await fetch('http://localhost:8080/bonita/API/bpm/caseVariable/' + this.case + '/products', { headers: this.headers }).then(res => res.json())
            if (res.value != 'null') products = res.value
        }
        return products
    }

    // if params.token, price will change if token owner is an employee
    // if params.productid, will return an array of only one product
    static async completeGetProducts(params = {}) {
        let variables = []

        let bonita = await Bonita.login()

        await bonita.setProcess()

        if (params.token) variables.push({ name: 'token', value: params.token})
        if (params.productid) variables.push({ name: 'productid', value: params.productid})

        await bonita.newCase(variables)
        let json = await bonita.getProducts()
        return JSON.parse(json)
    }
}


module.exports = Bonita