# Chzzk Cheese History (Firefox Fork)

Firefox용 Chzzk Cheese History 확장 프로그램 포크입니다.

- Upstream: https://github.com/alsrbxo0428/ChzzkCheeseHistory
- Fork: https://github.com/Honsal/ChzzkCheeseHistory
- 기능: 치지직 치즈 후원 및 구독 선물 내역을 연도별/월별 통계로 표시
- 배포 방식: Firefox self-distribution / unlisted signing 대상

## Firefox packaging

```bash
npx web-ext lint --source-dir . --self-hosted
npx web-ext build --source-dir . --artifacts-dir dist --overwrite-dest
WEB_EXT_API_KEY=... WEB_EXT_API_SECRET=... \
  npx web-ext sign --source-dir . --artifacts-dir dist --channel unlisted
```

Manifest V3 Firefox 요구사항 때문에 `browser_specific_settings.gecko.id`,
`browser_specific_settings.gecko.data_collection_permissions`, 그리고
`background.scripts` fallback을 포함합니다.

※ 본 확장 프로그램은 NAVER 또는 치지직의 공식 서비스가 아닙니다.
