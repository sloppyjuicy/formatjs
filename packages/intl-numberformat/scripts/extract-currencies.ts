/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict'
import * as CurrenciesData from 'cldr-numbers-full/main/en/currencies.json'
import * as supplementalCurrencyData from 'cldr-core/supplemental/currencyData.json'
import {sync as globSync} from 'fast-glob'
import {resolve, dirname} from 'path'
import {CurrencyData, LDMLPluralRuleMap} from '@formatjs/ecma402-abstract'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json'
import {collapseSingleValuePluralRule, PLURAL_RULES} from './utils'

export type Currencies =
  (typeof CurrenciesData)['main']['en']['numbers']['currencies']

function extractCurrencyPattern(d: Currencies['USD']) {
  if (!d['displayName-count-other']) {
    return
  }
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce(
      (all: LDMLPluralRuleMap<string>, ldml) => {
        if (d[`displayName-count-${ldml}` as 'displayName-count-one']) {
          all[ldml] = d[`displayName-count-${ldml}` as 'displayName-count-one']
        }
        return all
      },
      {other: d['displayName-count-other']}
    )
  )
}

export function getAllLocales(): string[] {
  return globSync('*/units.json', {
    cwd: resolve(
      dirname(require.resolve('cldr-units-full/package.json')),
      './main'
    ),
  }).map(dirname)
}

async function loadCurrencies(
  locale: string
): Promise<Record<string, CurrencyData>> {
  const currencies = (
    (await import(
      `cldr-numbers-full/main/${locale}/currencies.json`
    )) as typeof CurrenciesData
  ).main[locale as 'en'].numbers.currencies
  return (Object.keys(currencies) as Array<keyof typeof currencies>).reduce(
    (all: Record<string, CurrencyData>, isoCode) => {
      const d = currencies[isoCode] as Currencies['USD']
      const displayName = extractCurrencyPattern(d) || {other: d.displayName}
      all[isoCode] = {
        displayName,
        symbol: d.symbol || isoCode,
        narrow: d['symbol-alt-narrow'] || d.symbol || isoCode,
      }
      return all
    },
    {}
  )
}

export async function generateDataForLocales(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, Record<string, CurrencyData>>> {
  const data = await Promise.all(locales.map(loadCurrencies))
  return data.reduce(
    (all: Record<string, Record<string, CurrencyData>>, d, i) => {
      all[locales[i]] = d
      return all
    },
    {}
  )
}

export function extractCurrencyDigits(): Record<string, number> {
  const data = supplementalCurrencyData.supplemental.currencyData.fractions
  return (Object.keys(data) as Array<keyof typeof data>).reduce(
    (all: Record<string, number>, code) => {
      all[code] = +data[code]._digits
      return all
    },
    {}
  )
}
