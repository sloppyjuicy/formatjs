import Decimal from 'decimal.js'
import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {invariant} from '../utils'
import {CollapseNumberRange} from './CollapseNumberRange'
import {FormatApproximately} from './FormatApproximately'
import {FormatNumeric} from './FormatNumeric'
import {PartitionNumberPattern} from './PartitionNumberPattern'

/**
 * https://tc39.es/ecma402/#sec-partitionnumberrangepattern
 */
export function PartitionNumberRangePattern(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  y: Decimal,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  // 1. Assert: x and y are both mathematical values.
  invariant(!x.isNaN() && !y.isNaN(), 'Input must be a number', RangeError)
  const internalSlots = getInternalSlots(numberFormat)

  // 3. Let xResult be ? PartitionNumberPattern(numberFormat, x).
  const xResult = PartitionNumberPattern(internalSlots, x)

  // 4. Let yResult be ? PartitionNumberPattern(numberFormat, y).
  const yResult = PartitionNumberPattern(internalSlots, y)

  if (FormatNumeric(internalSlots, x) === FormatNumeric(internalSlots, y)) {
    const appxResult = FormatApproximately(internalSlots, xResult)
    appxResult.forEach(el => {
      el.source = 'shared'
    })
    return appxResult
  }

  let result: NumberFormatPart[] = []
  xResult.forEach(el => {
    el.source = 'startRange'
    result.push(el)
  })

  // 9. Let symbols be internalSlots.[[dataLocaleData]].[[numbers]].[[symbols]][internalSlots.[[numberingSystem]]].
  const rangeSeparator =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]
      .rangeSign

  result.push({type: 'literal', value: rangeSeparator, source: 'shared'})
  yResult.forEach(el => {
    el.source = 'endRange'
    result.push(el)
  })

  // 13. Return ? CollapseNumberRange(numberFormat, result).
  return CollapseNumberRange(numberFormat, result, {getInternalSlots})
}
