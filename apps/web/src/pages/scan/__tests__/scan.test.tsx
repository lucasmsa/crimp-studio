import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ScanPage } from '../index'

function renderScanPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/scan']}>
        <ScanPage />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe('ScanPage', () => {
  it('renders the poster title and tagline', () => {
    renderScanPage()

    expect(screen.getByTestId('scan-title')).toBeInTheDocument()
    expect(screen.getByTestId('scan-tagline')).toBeInTheDocument()
    expect(screen.getByTestId('scan-badge')).toBeInTheDocument()
  })

  it('renders all three flow steps from config', () => {
    renderScanPage()

    expect(screen.getByTestId('scan-step-shoot')).toBeInTheDocument()
    expect(screen.getByTestId('scan-step-detect')).toBeInTheDocument()
    expect(screen.getByTestId('scan-step-beta')).toBeInTheDocument()
  })

  it('links back to the editor', () => {
    renderScanPage()

    expect(screen.getByTestId('scan-back-link')).toHaveAttribute('href', '/editor')
  })

  it('renders the ticker with the marquee phrase duplicated for a seamless loop', () => {
    renderScanPage()

    const ticker = screen.getByTestId('scan-ticker')
    expect(ticker.textContent!.length).toBeGreaterThan(0)
    expect(ticker.querySelectorAll('span').length).toBeGreaterThan(8)
  })
})
