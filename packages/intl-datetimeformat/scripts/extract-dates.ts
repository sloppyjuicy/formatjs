/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'

import * as DateFields from 'cldr-dates-full/main/en/ca-gregorian.json'
import * as NumberFields from 'cldr-numbers-full/main/en/numbers.json'
import {sync as globSync} from 'fast-glob'
import {resolve, dirname} from 'path'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json'
import {RawDateTimeLocaleInternalData, TimeZoneNameData} from '../src/types'
import * as rawTimeData from 'cldr-core/supplemental/timeData.json'
import * as rawCalendarPreferenceData from 'cldr-core/supplemental/calendarPreferenceData.json'
import * as TimeZoneNames from 'cldr-dates-full/main/en/timeZoneNames.json'
import * as metaZones from 'cldr-core/supplemental/metaZones.json'
import IntlLocale from '@formatjs/intl-locale'
import {Formats} from '@formatjs/ecma402-abstract'
import {parseDateTimeSkeleton} from '../src/abstract/skeleton'
const {timeData} = rawTimeData.supplemental
const processedTimeData = Object.keys(timeData).reduce(
  (all: Record<string, string[]>, k) => {
    all[k.replace('_', '-')] =
      timeData[k as keyof typeof timeData]._allowed.split(' ')
    return all
  },
  {}
)

function isDateFormatOnly(opts: Intl.DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'hour' ||
      k === 'minute' ||
      k === 'second' ||
      k === 'timeZoneName' ||
      k === 'hour12'
  )
}

function isTimeFormatOnly(opts: Intl.DateTimeFormatOptions) {
  return !Object.keys(opts).find(
    k =>
      k === 'year' ||
      k === 'era' ||
      k === 'month' ||
      k === 'day' ||
      k === 'weekday' ||
      k === 'quarter'
  )
}

export function getAllLocales(): string[] {
  return globSync('*/ca-gregorian.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-dates-full/package.json')),
      './main'
    ),
  })
    .map(dirname)
    .filter(l => {
      try {
        return (Intl as any).getCanonicalLocales(l).length
      } catch (e) {
        console.warn(`Invalid locale ${l}`)
        return false
      }
    })
}

function resolveDateTimeSymbolTable(token: string): string {
  switch (token) {
    case 'h':
      return 'h12'
    case 'H':
      return 'h23'
    case 'K':
      return 'h11'
    case 'k':
      return 'h24'
  }
  return ''
}

function filterKeys<T>(
  data: Record<string, T>,
  filterFn: Parameters<Array<keyof typeof data>['filter']>[0]
): Record<string, T> {
  return (Object.keys(data) as Array<keyof typeof data>)
    .filter(filterFn)
    .reduce((all: Record<string, T>, k) => {
      all[k] = data[k]
      return all
    }, {})
}

function hasAltVariant(k: string): boolean {
  return !k.endsWith('alt-variant')
}

const {calendarPreferenceData} = rawCalendarPreferenceData.supplemental

/**
 * TODO: There's a bug here bc a timezone can link to multiple metazone
 * since a place can change zone during course of history which is dumb
 */
const tzToMetaZoneMap = metaZones.supplemental.metaZones.metazones.reduce(
  (all: Record<string, string>, z) => {
    all[z.mapZone._type] = z.mapZone._other
    return all
  },
  {}
)

async function loadDatesFields(
  locale: string
): Promise<RawDateTimeLocaleInternalData> {
  const [caGregorian, tzn, numbers] = await Promise.all([
    import(`cldr-dates-full/main/${locale}/ca-gregorian.json`),
    import(`cldr-dates-full/main/${locale}/timeZoneNames.json`),
    import(`cldr-numbers-full/main/${locale}/numbers.json`).catch(
      _ => undefined
    ),
  ])
  const gregorian = (caGregorian as typeof DateFields).main[locale as 'en']
    .dates.calendars.gregorian
  const timeZoneNames = (tzn as typeof TimeZoneNames).main[locale as 'en'].dates
    .timeZoneNames
  const nu = (numbers as typeof NumberFields | undefined)?.main[locale as 'en']
    .numbers.defaultNumberingSystem

  let hc: string[] = []
  let region: string | undefined
  try {
    if (locale !== 'root') {
      region = new IntlLocale(locale).maximize().region
    }
    // Reduce the date fields data down to allowlist of fields needed in the
    // FormatJS libs.
    hc = (
      processedTimeData[locale] ||
      processedTimeData[region || ''] ||
      processedTimeData[`${locale}-001`] ||
      processedTimeData['001']
    ).map(resolveDateTimeSymbolTable)
  } catch (e) {
    console.error(`Issue extracting hourCycle for ${locale}`)
    throw e
  }
  let timeZoneName: RawDateTimeLocaleInternalData['timeZoneName'] = {}
  try {
    timeZoneName = !timeZoneNames.metazone
      ? {}
      : Object.keys(tzToMetaZoneMap).reduce((all: TimeZoneNameData, tz) => {
          const metazone = tzToMetaZoneMap[tz]
          const metazoneInfo =
            timeZoneNames.metazone[
              metazone as keyof (typeof timeZoneNames)['metazone']
            ]
          if (metazoneInfo) {
            all[tz] = {}
            if (metazoneInfo.long) {
              all[tz].long = [
                metazoneInfo.long.standard,
                'daylight' in metazoneInfo.long
                  ? metazoneInfo.long.daylight
                  : metazoneInfo.long.standard,
              ]
            }
            if ('short' in metazoneInfo) {
              all[tz].short = [
                metazoneInfo.short.standard,
                'daylight' in metazoneInfo.short
                  ? metazoneInfo.short.daylight
                  : metazoneInfo.short.standard,
              ]
            }
          }

          return all
        }, {})
    const {long: utcLong, short: utcShort} = timeZoneNames.zone.Etc.UTC
    timeZoneName.UTC = {}
    if (utcLong) {
      timeZoneName.UTC.long = [utcLong.standard, utcLong.standard]
    }
    if (utcShort) {
      timeZoneName.UTC.short = [utcShort.standard, utcShort.standard]
    }
  } catch (e) {
    console.error(`Issue extracting timeZoneName for ${locale}`)
    throw e
  }

  const {short, full, medium, long} = gregorian.dateTimeFormats

  const {availableFormats} = gregorian.dateTimeFormats
  let rawIntervalFormats = gregorian.dateTimeFormats.intervalFormats
  const intervalFormats = Object.keys(rawIntervalFormats)
    .filter(hasAltVariant)
    .reduce((all: Record<string, string | Record<string, string>>, k) => {
      const v = rawIntervalFormats[k as 'Bhm']
      all[k] = typeof v === 'string' ? v : filterKeys(v, hasAltVariant)
      return all
    }, {})
  const parsedAvailableFormats: Array<[string, string, Formats]> = Object.keys(
    availableFormats
  )
    .filter(hasAltVariant)
    .map(skeleton => {
      const pattern = availableFormats[skeleton as 'Bh']
      try {
        return [
          skeleton,
          pattern,
          parseDateTimeSkeleton(skeleton, pattern),
        ] as [string, string, Formats]
      } catch (e) {
        // ignore
      }
    })
    .filter((f): f is [string, string, Formats] => !!f)
  const dateFormats = Object.values(gregorian.dateFormats).reduce(
    (all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      all[v] = typeof v === 'object' ? (v as {_value: string})._value : v
      return all
    },
    {}
  )
  const timeFormats = Object.values(gregorian.timeFormats).reduce(
    (all: Record<string, string>, v) => {
      // Locale haw got some weird structure https://github.com/unicode-cldr/cldr-dates-full/blob/master/main/haw/ca-gregorian.json
      all[v] = v
      return all
    },
    {}
  )
  const allFormats: Record<string, string> = {
    ...parsedAvailableFormats.reduce(
      (all: Record<string, string>, [skeleton, pattern]) => {
        all[skeleton] = pattern
        return all
      },
      {}
    ),
    ...dateFormats,
    ...timeFormats,
  }
  for (const [
    skeleton,
    pattern,
    availableFormatEntry,
  ] of parsedAvailableFormats) {
    if (isDateFormatOnly(availableFormatEntry)) {
      dateFormats[skeleton] = pattern
    } else if (isTimeFormatOnly(availableFormatEntry)) {
      timeFormats[skeleton] = pattern
    }
  }
  // Based on https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
  for (const [timeSkeleton, timePattern] of Object.entries(timeFormats)) {
    for (const [dateSkeleton, datePattern] of Object.entries(dateFormats)) {
      let rawPattern
      const entry = parseDateTimeSkeleton(dateSkeleton, datePattern)
      if (entry.month === 'long') {
        rawPattern = entry.weekday ? full : long
      } else if (entry.month === 'short') {
        rawPattern = medium
      } else {
        rawPattern = short
      }
      const pattern = rawPattern
        .replace('{0}', timePattern)
        .replace('{1}', datePattern)
      const skeleton = rawPattern
        .replace('{0}', timeSkeleton)
        .replace('{1}', dateSkeleton)
      allFormats[skeleton] = pattern
    }
  }
  return {
    am: gregorian.dayPeriods.format.abbreviated.am,
    pm: gregorian.dayPeriods.format.abbreviated.pm,
    weekday: {
      narrow: Object.values(gregorian.days.format.narrow),
      short: Object.values(gregorian.days.format.abbreviated),
      long: Object.values(gregorian.days.format.wide),
    },
    era: {
      narrow: {
        BC: gregorian.eras.eraNarrow[0],
        AD: gregorian.eras.eraNarrow[1],
      },
      short: {
        BC: gregorian.eras.eraAbbr[0],
        AD: gregorian.eras.eraAbbr[1],
      },
      long: {
        BC: gregorian.eras.eraNames[0],
        AD: gregorian.eras.eraNames[1],
      },
    },
    month: {
      narrow: Object.values(gregorian.months.format.narrow),
      short: Object.values(gregorian.months.format.abbreviated),
      long: Object.values(gregorian.months.format.wide),
    },
    timeZoneName,
    gmtFormat: timeZoneNames.gmtFormat,
    hourFormat: timeZoneNames.hourFormat,
    dateFormat: extractStyleFormatFields(gregorian.dateFormats),
    timeFormat: extractStyleFormatFields(gregorian.timeFormats),
    dateTimeFormat: extractStyleFormatFields(gregorian.dateTimeFormats),
    formats: {
      gregory: allFormats,
    },
    // @ts-ignore
    intervalFormats,
    hourCycle: hc[0],
    nu: nu ? [nu] : [],
    ca: (
      calendarPreferenceData[region as keyof typeof calendarPreferenceData] ||
      calendarPreferenceData['001']
    ).map(c => {
      //Resolve aliases per https://github.com/unicode-org/cldr/blob/master/common/bcp47/calendar.xml
      if (c === 'gregorian') {
        return 'gregory'
      }
      if (c === 'islamic-civil') {
        return 'islamicc'
      }
      if (c === 'ethiopic-amete-alem') {
        return 'ethioaa'
      }
      return c
    }),
    hc,
  }
}

export async function extractDatesFields(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, RawDateTimeLocaleInternalData>> {
  const data = await Promise.all(locales.map(loadDatesFields))
  return locales.reduce(
    (all: Record<string, RawDateTimeLocaleInternalData>, locale, i) => {
      all[locale] = data[i]
      return all
    },
    {}
  )
}

/**
 * The CLDR formatObject has several fields other than full, long, medium, short which
 * would increase the size of the saved payload if not ommitted.
 * @param formatObject
 */
function extractStyleFormatFields<
  T extends {full: string; long: string; medium: string; short: string},
>(
  formatObject: T
): {full: string; long: string; medium: string; short: string} {
  return {
    full: formatObject.full,
    long: formatObject.long,
    medium: formatObject.medium,
    short: formatObject.short,
  }
}
