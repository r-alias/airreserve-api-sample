const fs = require('fs').promises
const readline = require('readline')
const {google} = require('googleapis')

class GoogleCalendarApi {
  constructor(isReadOnly, tokenPath, credentialsPath) {
    this.scopes = ['https://www.googleapis.com/auth/calendar']
    this.token_path = tokenPath
    this.credentialsPath = credentialsPath
  }

  async getClient() {
    if( this.auth == null){
      this.auth = await this.authorize(JSON.parse(await fs.readFile(this.credentialsPath)))
    }
    return this.auth
  }

  async insertEvent(event) {
    let auth = await this.getClient()
    return await new Promise((resolve, reject)=>{
      const calendar = google.calendar({ version: 'v3', auth })
      calendar.events.insert({
          auth: auth,
          calendarId: 'primary',
          resource: event
        }, (err, event) => {
          if (err) {
            console.log('There was an error contacting the Calendar service: ' + err)
            reject(err)
            return
          }
          console.log('Event created: %s', event.data.htmlLink)
          resolve()
        }
      )
    })
  }

  async deleteEvent(eventId) {
    let auth = await this.getClient()
    return await new Promise((resolve, reject) => {
      const calendar = google.calendar({version: 'v3', auth})
      calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      }, (err, _res) => {
        if (err) { 
          console.log('The API returned an error: ' + err)
          reject(err)
          return
        }
        console.log('Delete event id: ' + err)
        resolve()
      })
    })
  }

  async fetchEvents(fromDate, toDate) {
    let auth = await this.getClient()
    return await new Promise((resolve, reject) => {
      const calendar = google.calendar({version: 'v3', auth})
      calendar.events.list({
        calendarId: 'primary',
        timeMin: fromDate.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err) { 
          console.log('The API returned an error: ' + err)
          reject(err)
          return
        }
        resolve(res.data.items)
      })
    })
  }
  
  async authorize(credentials) {
    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0])
  
    // Check if we have previously stored a token.
    try {
      let token = await fs.readFile(this.token_path)
      oAuth2Client.setCredentials(JSON.parse(token))
    } catch (err) {
      let res = await this.getAccessToken(oAuth2Client)
      return res
    }
    return oAuth2Client
  }

  getAccessToken(oAuth2Client, callback) {
    return new Promise((resolve, reject)=>{
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.scopes,
      })
      console.log('Authorize this app by visiting this url:', authUrl)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close()
        oAuth2Client.getToken(code, (err, token) => {
          if (err){
            console.error('Error retrieving access token', err)
            reject()
            return
          }
          oAuth2Client.setCredentials(token)
          // Store the token to disk for later program executions
          fs.writeFile(this.token_path, JSON.stringify(token)).then((_)=>{
            console.log('Token stored to', this.token_path)
            resolve(oAuth2Client)
          }).catch((err)=>{
            console.error(err)
            resolve(oAuth2Client)
          })
        })
      })
    })
  }
}

module.exports.default = GoogleCalendarApi
module.exports = GoogleCalendarApi