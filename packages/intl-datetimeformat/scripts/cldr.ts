import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
}
function main(args: Args) {
  const {cldrFile: cldrFiles, outDir} = args
  cldrFiles.sort()
  cldrFiles.forEach(cldrFile => {
    const locale = basename(cldrFile, '.json')
    // Dist all locale files to locale-data (JS)
    const data = readFileSync(cldrFile)
    outputFileSync(
      join(outDir, locale + '.js'),
      `/* @generated */	
// prettier-ignore
if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.__addLocaleData === 'function') {
  Intl.DateTimeFormat.__addLocaleData(${data})
}
`
    )
    outputFileSync(join(outDir, locale + '.d.ts'), 'export {}')
  })
}
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
