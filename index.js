const moment = require('moment')
const AirReserveApi = require('./airreserve')
const GoogleCalendarApi = require('./google-calendar')
const fs = require('fs').promises

// airreserve API
const airreserve = new AirReserveApi()

// Google API
const TOKEN_PATH = 'token.json'
const CREDENTIAL_PATH = 'credentials.json'
const gCalendarApi = new GoogleCalendarApi(false, TOKEN_PATH, CREDENTIAL_PATH)

// setting
var setting = null

// main function
;(async function () {
  // load setting file.
  setting = JSON.parse(await fs.readFile('user.json'))
  // login airreserve
  await airreserve.login(setting.airreserve.username, setting.airreserve.password)

  // target date
  let startDate = moment()
  let endDate = moment().add(2, 'month')

  await updateCalendar(startDate, endDate)
})()


async function updateCalendar(startDate, endDate) {
  // fetch (Google) calendar Events
  let calendarEvents = await fetchCalender(startDate, endDate)
  console.log(calendarEvents)

  // fetch airreserve reserves.
  let reserveEvents = await fetchReserves(startDate, endDate)
  console.log(reserveEvents)

  // delete events that no longer exists from calender
  for( let cEvent of calendarEvents) {
    let cStart = moment(cEvent.start)
    let cEnd = moment(cEvent.end)
    let isExists = false
    let rDelEvents = []
    for( let rEvent of reserveEvents) {
      let rStart = moment(rEvent.start)
      let rEnd = moment(rEvent.end)
      if( cStart.isSame(rStart) && cEnd.isSame(rEnd)) {
        isExists = true
        // update calender event status.
        // store delete event
        rDelEvents.push(rEvent)
      }
    }
    // delete event from 'reserveEvents' Array.
    for( rEvent of rDelEvents) {
      reserveEvents.splice(reserveEvents.indexOf(rEvent), 1)
    }

    if(isExists == false) {
      // delete event from calendar.
      await gCalendarApi.deleteEvent(cEvent.id)
    }
  }

  // add events to calender
  for( let rEvent of reserveEvents) {
    let event = {
      summary: rEvent.slotName + ' (' + rEvent.slotUserCount + ')',
      start: {
        dateTime: rEvent.start.toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: rEvent.end.toISOString(),
        timeZone: 'Asia/Tokyo'
      }
    }
    await gCalendarApi.insertEvent(event)
  }
}

// fetch events from Google Calender
async function fetchCalender (startDate, endDate) {
  let gCalendarEvents = await gCalendarApi.fetchEvents(startDate, endDate)
  let events = []
  for( let event of gCalendarEvents ) {
    events.push({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime
    })
  }
  return events
}

// fetch events from airreserve
async function fetchReserves (startDate, endDate) {
  let slots = []

  const lessonDates = await airreserve.searchCalendar(startDate, endDate)
  for (let [date, lessons] of Object.entries(lessonDates)) {
    for (let lesson of lessons) {
      let entity = lesson.slotEntity
      // reduce no reserve members lesson
      if( entity.entryPaxCntTotal > 0 || entity.slotNm == setting.airreserve.includeSlotName ) {
        slots.push({
          date: date,
          slotId: lesson.slotId,
          start: moment(entity.fromDt, 'YYYYMMDDHHmmss').toISOString(),
          end: moment(entity.toDt, 'YYYYMMDDHHmmss').toISOString(),
          slotName: entity.slotNm,
          slotUserMax: entity.slotCapacityPaxCnt,
          slotUserCount: entity.entryPaxCntTotal
        })
      }
    }
  }
  return slots
}
