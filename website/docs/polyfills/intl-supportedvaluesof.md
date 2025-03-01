---
id: intl-supportedvaluesof
title: Intl.supportedValuesOf
---

A spec-compliant polyfill/ponyfill for `Intl.supportedValuesOf`.

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-enumerator.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-enumerator)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-enumerator)

## Installation

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i @formatjs/intl-enumerator
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-enumerator
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator)
- [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) or [polyfill](intl-datetimeformat.md)
- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) or [polyfill](intl-numberformat.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-enumerator/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-enumerator/should-polyfill'
async function polyfill() {
  // This platform already supports Intl.supportedValuesOf
  if (shouldPolyfill()) {
    await import('@formatjs/intl-enumerator/polyfill')
  }
  // Alternatively, force the polyfill regardless of support
  await import('@formatjs/intl-enumerator/polyfill-force')
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Intl/supportedValuesOf)-compliant.
