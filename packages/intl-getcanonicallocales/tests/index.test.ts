import {getCanonicalLocales} from '../'
import {describe, expect, it} from 'vitest'
describe('Intl.getCanonicalLocales', () => {
  it('regular', function () {
    expect(
      getCanonicalLocales('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual(['en-u-bar-foo-ca-buddhist-kk-nu-thai'])
  })
  it('und-x-private', function () {
    expect(getCanonicalLocales('und-x-private')).toEqual(['und-x-private'])
  })
  it('should canonicalize casing for zh-hANs-sG', function () {
    expect(getCanonicalLocales('zh-hANs-sG')).toEqual(['zh-Hans-SG'])
  })
  it('should handle twi', function () {
    expect(getCanonicalLocales('twi')).toEqual(['ak'])
  })
  it('should handle ug-Arab-CN ', function () {
    expect(getCanonicalLocales('ug-Arab-CN')).toEqual(['ug-Arab-CN'])
  })
  it('canonicalizes twice', function () {
    expect(getCanonicalLocales('und-Armn-SU')).toEqual(['und-Armn-AM'])
  })
})
