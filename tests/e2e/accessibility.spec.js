import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility & WCAG Compliance Suite', () => {
  test('homepage has no critical accessibility violations', async ({ page }) => {
    await page.goto('/#/')
    await page.waitForSelector('.ll-global-loader-overlay', { state: 'hidden' })
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('emergency board has no critical accessibility violations', async ({ page }) => {
    await page.goto('/#/emergency-board')
    await page.waitForSelector('.ll-global-loader-overlay', { state: 'hidden' })
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/#/login')
    await page.waitForSelector('.ll-global-loader-overlay', { state: 'hidden' })
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
