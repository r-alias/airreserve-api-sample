const axios_ = require('axios').default
const cheerio = require('cheerio')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
const moment = require('moment')

const login_url = 'https://airreserve.net/reserve/calendar/'

class AirReserveApp {

  constructor(username, password) {
    this.username = username
    this.password = password
    this.apiToken = ''
    this.apiSid = ''
    this.apiCsrf = ''
    this.axios = axios_.create({withCredentials: true})
    axiosCookieJarSupport(this.axios)
    this.axios.defaults.jar = new tough.CookieJar()
  }

  async searchCalendar(dateFrom, dateTo) {
    try {
      let dateFromStr = moment(dateFrom).format('YYYYMMDDHHmmss')
      let dateToStr = moment(dateTo).format('YYYYMMDDHHmmss')

      let payload = {
        'bookingFromDt':dateFromStr,
        'bookingToDt':dateToStr
      }

      let res = await this.authPost('https://airreserve.net/stateful/booking/lesson/search/calendar', payload)
      return res.data.dto.lessonBookingRstMap
    } catch (error) {
      console.error(error)
    }
  }

  async lessonSumamry(slotId) {
    try {
      let res = await this.authGet('https://airreserve.net/stateful/booking/lesson/summary',
      {params: {slotId: slotId}})
      return res.data.dto
    } catch (error) {
      console.error(error)
    }
  }
  
  async svcInfo(schdlId) {
    try {
      let res = await this.authGet('https://airreserve.net/stateful/schdl/lesson/svc/info',
      {params: {schdlId: schdlId}})
      return res.data.dto
    } catch (error) {
      console.error(error)
    }
  }
  
  async slotInfo(schdlId) {
    try {
      let res = await this.authGet('https://airreserve.net/stateful/schdl/lesson/slot/info',
      {params: {schdlId: schdlId}})
      return res.data.dto.tsLessonSchdlSlotDto
    } catch (error) {
      console.error(error)
    }
  }

  async registDetail(slotId) {
    try {
      payload = {
        slotId: slotId,
        schdlKbn: 'KeyLESSON_SCHDL_SLOT',
        version: '1'
      }
      let res = await this.authPost('https://airreserve.net/stateful/booking/lesson/regist/detail', payload)
      return res.data.dto
    } catch (error) {
      console.error(error)
    }
  }
  
  async slotDelete(schdlId) {
    try {
      let payload = {
        schdlId: schdlId,
        version: '1'
      }
      let res = await this.authPost('https://airreserve.net/stateful/schdl/lesson/slot/delete/complete', payload)
      return res.data.dto
    } catch (error) {
      console.error(error)
    }
  }
  
  async slotEdit(payload) {
    try {
      payload.apiAuthDto = {
        _csrf: this.apiCsrf,
        sid: this.apiSid,
        token: this.apiToken
      }
      let res = await this.authPost('https://airreserve.net/stateful/schdl/lesson/slot/edit/complete', payload)
      return res.data.dto
    } catch (error) {
      console.error(error)
    }
  }  
  
  async login(username, password) {
    try {
      this.username = username || this.username
      this.password = password || this.password

      let response_get = await this.axios.get(login_url)
      let $ = cheerio.load(response_get.data)
      const form = $('form#command')
      let resUrl = new URL(response_get.config.url)
      const path = resUrl.origin + form.attr('action')

      let params = this.getFormParams($, form)
      params.set('username', username)
      params.set('password', password)

      const response_post = await this.axios.post(path, params)

      $ = cheerio.load(response_post.data)

      this.apiToken = $('#api-token').attr('value')
      this.apiSid = $('#api-sid').attr('value')
      this.apiCsrf = $('input[name="_csrf"]').attr('value')
      console.log('api-token:' + this.apiToken)
      console.log('api-sid:' + this.apiSid)
      console.log('_csrf:' + this.apiCsrf)
      if( this.apiToken == null || this.apiSid == null || this.apiCsrf == null ) {
        // error
        let errorMsg = $('.errorMessage').text()
        if( errorMsg != "" ) throw(errorMsg)
        else throw('some login error.')
      }
      await this.setTimeoutAsync(0.5)
    } catch (error) {
      console.error(error)
      throw(error)
    }
  }

  setTimeoutAsync(waitSeconds, func = undefined) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (func === undefined) resolve()
        else resolve(func())
      }, waitSeconds * 1000)
    })
  }

  getFormParams($, form) {
    const params = new URLSearchParams()
    let inputs = form.find('input')
  
    inputs.each( (_idx, elm) => {
      const input = $(elm)
      let name = input.attr('name')
      let value = input.attr('value')
      let type  = input.attr('type')

      if(type !== 'submit') {
        params.append(name, value)
      }
    })
    return params
  }

  async authGet(url, config = {}) {
    if (this.apiToken == '') await this.login(this.username, this.password)
    config['headers'] = {'X-CSRF-TOKEN': this.apiToken}
    let res = await this.axios.get(url, config)
    return res
  }

  async authPost(url, data = {}, config = {}) {
    if (this.apiToken == '') await this.login(this.username, this.password)
    config['headers'] = {'X-CSRF-TOKEN': this.apiToken}
    let res = await this.axios.post(url, data, config)
    return res
  }
}

module.exports.default = AirReserveApp
module.exports = AirReserveApp
