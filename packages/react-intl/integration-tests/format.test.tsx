import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  FormattedRelativeTime,
  FormattedTime,
  IntlProvider,
} from 'react-intl'

import {render, screen} from '@testing-library/react'
import React from 'react'

describe('format', () => {
  const renderWithIntlProvider = (
    Element: React.JSX.Element,
    providerProps = {}
  ) =>
    render(
      <IntlProvider locale="en" {...providerProps}>
        {Element}
      </IntlProvider>
    )

  it('formats dates', () => {
    const date = new Date()
    const el = (
      <span data-testid="test">
        <FormattedDate value={date} month="numeric" />
      </span>
    )

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent(
      String(date.getMonth() + 1)
    )
  })

  it('formats times', () => {
    const date = new Date()
    const el = (
      <span data-testid="test">
        <FormattedTime value={date} />
      </span>
    )

    const hours = date.getHours()
    const minutes = date.getMinutes()

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent(
      `${hours > 12 ? hours % 12 : hours || '12'}:` +
        `${minutes < 10 ? `0${minutes}` : minutes} ` +
        `${hours < 12 ? 'AM' : 'PM'}`
    )
  })

  it('formats relative time', () => {
    const el = (
      <span data-testid="test">
        <FormattedRelativeTime value={-1} />
      </span>
    )

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent('1 second ago')
  })

  it('formats numbers with thousands separators', () => {
    const el = (
      <span data-testid="test">
        <FormattedNumber value={1000} />
      </span>
    )

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent('1,000')
  })

  it('formats numbers with decimal separators', () => {
    const el = (
      <span data-testid="test">
        <FormattedNumber value={0.1} minimumFractionDigits={2} />
      </span>
    )

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent('0.10')
  })

  it('pluralizes labels in strings', () => {
    const message = 'You have {emails, plural, one {# email} other {# emails}}.'
    const el = (
      <span data-testid="test">
        <FormattedMessage
          id="foo"
          defaultMessage={message}
          values={{
            emails: 1000,
          }}
        />
      </span>
    )

    renderWithIntlProvider(el)
    expect(screen.getByTestId('test')).toHaveTextContent(
      'You have 1,000 emails.'
    )
  })
})
