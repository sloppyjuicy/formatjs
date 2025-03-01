import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-pluralrules/locale-data/zh'
import '@formatjs/intl-pluralrules/polyfill'
import {NumberFormat} from '../src/core'
import * as zhHant from './locale-data/zh-Hant.json'
import * as zh from './locale-data/zh.json'
NumberFormat.__addLocaleData(zh as any, zhHant as any)

const tests: Array<
  [
    number,
    {
      short: Intl.NumberFormatPart[]
      narrow: Intl.NumberFormatPart[]
      long: Intl.NumberFormatPart[]
    },
  ]
> = [
  [
    -987,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    -0.001,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    -0,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    0,
    {
      short: [
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '0'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    0.001,
    {
      short: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    987,
    {
      short: [
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '987'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
]

describe('unit-zh-TW', function () {
  describe.each(tests)('%s', (number, expectedData) => {
    it.each(Object.entries(expectedData))('%s', (unitDisplay, expected) => {
      const nf = new NumberFormat('zh-TW', {
        style: 'unit',
        unit: 'meter',
        unitDisplay: unitDisplay as 'narrow',
      })
      expect(nf.formatToParts(number)).toEqual(expected)
    })
  })
})
