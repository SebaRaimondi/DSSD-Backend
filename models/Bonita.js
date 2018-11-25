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
            .then(json => json[2])
    }

    async setProcess() {
        this.process = (await this.getProcess()).id
    }

    getVariables(params) {
        console.log(params)
    }

    postCase(params) {
        return fetch(bonita + '/API/bpm/case', { headers: this.headers, method: 'POST', body: JSON.stringify({ processDefinitionId: this.process, variables: this.getVariables(params) }) })
            .then(res => res.json())
    }

    async newCase(params = [] ) {
        this.case = (await this.postCase(params)).id
    }

}

module.exports = Bonita