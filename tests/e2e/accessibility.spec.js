import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility & WCAG Compliance Suite', () => {
  test('homepage has no critical accessibility violations', async ({ page }) => {
    await page.goto('/')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('emergency board has no critical accessibility violations', async ({ page }) => {
    await page.goto('/emergency')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/login')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
