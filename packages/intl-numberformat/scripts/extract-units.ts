/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {fromPairs} from 'lodash'
import {
  invariant,
  LDMLPluralRuleMap,
  UnitDataTable,
  removeUnitNamespace,
  IsWellFormedUnitIdentifier,
  UnitData,
} from '@formatjs/ecma402-abstract'
import * as UnitsData from 'cldr-units-full/main/en/units.json'
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json'
import {collapseSingleValuePluralRule, PLURAL_RULES} from './utils'

export type Units = (typeof UnitsData)['main']['en']['units']

function extractUnitPattern(d: Units['long']['volume-gallon']) {
  return collapseSingleValuePluralRule(
    PLURAL_RULES.reduce((all: LDMLPluralRuleMap<string>, ldml) => {
      if (d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']) {
        all[ldml] = d[`unitPattern-count-${ldml}` as 'unitPattern-count-one']
      }
      return all
    }, {} as any)
  )
}

async function loadUnits(locale: string): Promise<UnitDataTable> {
  const units = (
    (await import(
      `cldr-units-full/main/${locale}/units.json`
    )) as typeof UnitsData
  ).main[locale as 'en'].units

  invariant(
    !!(
      units.long.per.compoundUnitPattern &&
      units.short.per.compoundUnitPattern &&
      units.narrow.per.compoundUnitPattern
    ),
    `Missing "per" compound pattern in locale ${locale}`
  )

  const validUnits = Object.keys(units.long).filter(unit => {
    return IsWellFormedUnitIdentifier(removeUnitNamespace(unit))
  })

  const simpleUnitEntries: [string, UnitData][] = validUnits.map(unit => {
    if (!units.long[unit as 'digital-bit']) {
      throw new Error(`${unit} does not have any data`)
    }
    return [
      removeUnitNamespace(unit),
      {
        // displayName: units.long[unit as 'digital-bit'].displayName,
        long: extractUnitPattern(units.long[unit as 'volume-gallon']),
        short: extractUnitPattern(units.short[unit as 'volume-gallon']),
        narrow: extractUnitPattern(units.narrow[unit as 'volume-gallon']),
        perUnit: {
          long: units.long[unit as 'volume-gallon'].perUnitPattern,
          short: units.short[unit as 'volume-gallon'].perUnitPattern,
          narrow: units.narrow[unit as 'volume-gallon'].perUnitPattern,
        },
      },
    ]
  })

  const compoundUnits = {
    per: {
      long: units.long.per.compoundUnitPattern,
      short: units.short.per.compoundUnitPattern,
      narrow: units.narrow.per.compoundUnitPattern,
    },
  }

  return {simple: fromPairs(simpleUnitEntries), compound: compoundUnits}
}

export async function generateDataForLocales(
  locales: string[] = AVAILABLE_LOCALES.availableLocales.full
): Promise<Record<string, UnitDataTable>> {
  const data = await Promise.all(locales.map(loadUnits))
  return data.reduce((all: Record<string, UnitDataTable>, d, i) => {
    all[locales[i]] = d
    return all
  }, {})
}
