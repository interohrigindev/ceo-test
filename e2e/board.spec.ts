// 실브라우저 화면 검사. 시계를 2026-10-27 한국 시간으로 고정한다.
// 숫자 기대값은 지금 프로젝트목록.xlsx 기준(개발계획서 §4). 엑셀이 바뀌면 같이 고친다.
import { expect, test, type Page } from '@playwright/test'
import { readSheet } from 'read-excel-file/node'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const XLSX = fileURLToPath(new URL('../../프로젝트목록.xlsx', import.meta.url))
const HEADERS = fileURLToPath(new URL('../public/_headers', import.meta.url))
const ORIGIN = 'http://localhost:4173'
const OCT_27 = new Date('2026-10-27T10:00:00+09:00')

let errors: string[] = []
let foreign: string[] = []

test.beforeEach(({ page }) => {
  errors = []
  foreign = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    const url = r.url()
    if (!url.startsWith(ORIGIN) && !url.startsWith('data:')) foreign.push(url)
  })
})

test.afterEach(() => {
  expect(errors, '콘솔 오류 0건').toEqual([])
  expect(foreign, '바깥 주소 요청 0건').toEqual([])
})

async function open(page: Page, at: Date = OCT_27) {
  await page.clock.setFixedTime(at)
  await page.goto('/')
  await expect(page.getByTestId('count-total')).toBeVisible()
}

async function counts(page: Page) {
  return Promise.all(
    ['total', 'inProgress', 'stalled', 'overdue'].map((k) => page.getByTestId(`count-${k}`).textContent()),
  )
}

const rows = (page: Page) => page.locator('tbody tr[data-row]')
const rowNumbers = async (page: Page, badge: string) =>
  rows(page)
    .filter({ has: page.locator(badge) })
    .evaluateAll((trs) => trs.map((tr) => Number((tr as HTMLElement).dataset.row)))

test('숫자 4개: 10 · 8 · 6 · 3, 기준일 10/27(화)', async ({ page }) => {
  await open(page)
  expect(await counts(page)).toEqual(['10', '8', '6', '3'])
  await expect(page.getByTestId('as-of')).toHaveText('기준일 2026-10-27(화)')
})

test('2주 멈춤 · 마감 지남이 줄마다 보인다', async ({ page }) => {
  await open(page)
  expect(await rowNumbers(page, '.badge-stalled')).toEqual([2, 4, 5, 7, 8, 11])
  expect(await rowNumbers(page, '.badge-overdue')).toEqual([7, 8, 11])

  const boom = page.locator('tr[data-row="11"]')
  await expect(boom).toHaveClass('row-overdue')
  await expect(boom.locator('.badge')).toHaveText(['2주 멈춤', '마감 지남'])
  await expect(page.locator('tr[data-row="2"]')).toHaveClass('row-stalled')
  await expect(page.locator('tr[data-row="9"] .badge')).toHaveCount(0) // 완료
})

test('엑셀 줄마다 화면 7칸이 같다', async ({ page }) => {
  await open(page)
  const sheet = await readSheet(XLSX)
  const header = sheet[0].map(String)
  const columns = ['구분', '프로젝트', '담당(역할)', '마감', '상태', '마지막 업데이트', '다음 결정']
  const text = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '').trim())

  for (let i = 1; i < sheet.length; i++) {
    const excelRow = i + 1
    const expected = columns.map((c) => text(sheet[i][header.indexOf(c)]))
    const onScreen = await page.locator(`tr[data-row="${excelRow}"] td .cell-main`).allTextContents()
    expect(onScreen, `엑셀 ${excelRow}행`).toEqual(expected)
  }
})

test('구분 · 담당 · 상태로 거르기', async ({ page }) => {
  await open(page)
  const category = page.getByLabel('구분')
  const owner = page.getByLabel('담당')
  const status = page.getByLabel('상태')
  const result = page.getByTestId('result-count')

  await category.selectOption('경영관리')
  await expect(rows(page)).toHaveCount(5)
  await expect(result).toHaveText('5건 / 10건')

  await page.getByRole('button', { name: '모두 보기' }).click()
  await owner.selectOption('인사총무 리더')
  await expect(rows(page)).toHaveCount(2)

  await owner.selectOption('')
  await status.selectOption('완료')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toHaveAttribute('data-row', '9')

  await status.selectOption('')
  await category.selectOption('신사업')
  await owner.selectOption('마케팅 리더')
  await expect(rows(page)).toHaveCount(2)

  await category.selectOption('경영관리')
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('조건에 맞는 프로젝트가 없습니다.')).toBeVisible()

  // 숫자 4개는 거르기와 상관없이 전체 기준
  expect(await counts(page)).toEqual(['10', '8', '6', '3'])

  await page.getByRole('button', { name: '모두 보기' }).click()
  await expect(rows(page)).toHaveCount(10)
  await expect(result).toHaveText('10건 / 10건')
})

test('날짜가 바뀌면 숫자도 바뀐다 (10/28 · 10/29 · 11/01)', async ({ page }) => {
  await open(page, new Date('2026-10-28T09:00:00+09:00'))
  expect(await counts(page)).toEqual(['10', '8', '6', '3'])
  await open(page, new Date('2026-10-29T09:00:00+09:00'))
  expect(await counts(page)).toEqual(['10', '8', '7', '3'])
  await open(page, new Date('2026-11-01T09:00:00+09:00'))
  expect(await counts(page)).toEqual(['10', '8', '9', '4'])
})

test('배포용 보안 헤더(CSP)를 걸어도 화면이 뜬다', async ({ page }) => {
  // vite preview 는 _headers 를 쓰지 않으므로 같은 CSP를 직접 붙인다. 위반하면 콘솔 오류로 잡힌다.
  const csp = /Content-Security-Policy: (.+)/.exec(readFileSync(HEADERS, 'utf8'))![1]
  await page.route('**/*', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } })
  })
  await open(page)
  expect(await counts(page)).toEqual(['10', '8', '6', '3'])
})

test.describe('휴대폰 375 × 812', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

  test('옆으로 밀리지 않고, 글씨는 16px 이상, 줄은 카드', async ({ page }) => {
    await open(page)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

    const smallest = await page.evaluate(() => {
      const els = document.querySelectorAll('body, .stat dt, select, td .cell-main, td .cell-sub, .badge, .legend')
      return Math.min(...[...els].map((el) => parseFloat(getComputedStyle(el).fontSize)))
    })
    expect(smallest).toBeGreaterThanOrEqual(16)

    await expect(page.locator('thead')).not.toBeInViewport()
    const card = page.locator('tr[data-row="11"]')
    expect(await card.evaluate((el) => getComputedStyle(el).display)).toBe('flex')
    await expect(card.locator('.badge')).toHaveText(['2주 멈춤', '마감 지남'])
  })
})

test.describe('브라우저가 다른 시간대에 있어도', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })

  test('한국 날짜로 계산한다', async ({ page }) => {
    // 로스앤젤레스 10/26 08:30 = 한국 10/27 00:30
    await open(page, new Date('2026-10-26T15:30:00Z'))
    await expect(page.getByTestId('as-of')).toHaveText('기준일 2026-10-27(화)')
    expect(await counts(page)).toEqual(['10', '8', '6', '3'])
  })
})
