# 프로젝트 현황판

프로젝트가 어디서 멈췄는지 한 화면에서 본다. 자료는 한 단계 위 폴더의 `프로젝트목록.xlsx`(읽기만 함).
설계와 결정 사항은 `../개발계획서.md`.

## 처음 한 번

```bash
nvm use 22
npm install
```

이 맥은 Node 기본값이 v20이라 `nvm use 22`가 먼저 필요하다.

## 열기

```bash
npm run dev
```

기본 브라우저에 `http://localhost:5173`이 열린다. 끌 때는 터미널에서 Ctrl+C.

## 엑셀을 고친 뒤

```bash
npm run data
npm run verify:data
```

`data`는 엑셀을 읽어 `src/data/projects.json`을 다시 만들고, `verify:data`는 json과 엑셀을 칸마다 맞춰 본다.
엑셀 첫 줄 제목이 바뀌면 `data`가 멈추고 어느 칸이 다른지 알려 준다.

## 검사

| 명령 | 보는 것 |
|---|---|
| `npm test` | 2주 멈춤 · 마감 지남 계산, 한국 날짜, 거르기 |
| `npm run verify:data` | json = 엑셀 (10줄 × 7칸) |
| `npm run e2e` | 실브라우저(Chrome): 숫자 4개, 줄마다 표시, 엑셀 줄 대조, 거르기, 휴대폰 폭, 콘솔 오류 0, 바깥 주소 요청 0 |

`npm test`와 `npm run e2e`의 숫자 기대값(10 · 8 · 6 · 3 등)은 지금 엑셀 기준이다. 엑셀 내용이 바뀌면 함께 고친다.
`e2e`는 이 맥에 깔린 Google Chrome을 쓴다. Chrome이 없으면 `npx playwright install chromium` 후 `playwright.config.ts`의 `channel` 줄을 지운다.

## 화면 규칙

- 오늘 = 앱을 연 날의 한국 날짜
- 2주 멈춤 = 완료가 아니고, 마지막 업데이트 뒤 14일 넘게 지남(15일째부터) — 주황
- 마감 지남 = 완료가 아니고, 마감일이 오늘보다 앞섬(마감 당일은 아님) — 빨강
- 진행 중 = 상태 '진행'
- 빈칸이나 날짜가 아닌 값은 `[확인 필요]`로 보이고 판정에서 빠진다

## 폴더

```
scripts/sheet.mjs        엑셀 읽기 · 7칸만 꺼내기 · 날짜 맞추기
scripts/build-data.mjs   npm run data
scripts/verify-data.mjs  npm run verify:data
src/lib/status.ts        오늘 · 지난 날수 · 판정 · 숫자 4개
src/lib/filters.ts       거르기
src/lib/loadProjects.ts  데이터 읽는 곳(v2에서 API로 바꿀 자리)
src/components/          숫자 4개 · 거르기 · 표
e2e/board.spec.ts        실브라우저 검사
public/_headers          배포용 보안 헤더(Cloudflare Pages에서만 적용)
```

## 되돌리기

```bash
git log --oneline
git revert <커밋번호>
```

배포(Cloudflare Pages)와 로그인 문(Cloudflare Access)은 2단계. 순서는 `../개발계획서.md` §8.
