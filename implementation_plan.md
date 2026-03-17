# implementation_plan

## goal
- Cloudflare Worker에서 서울시 지하철 실시간 도착정보 API를 호출하는 백엔드 로직을 구현한다.
- 앱이 바로 쓸 수 있는 단순한 JSON 응답 형태로 도착정보를 가공한다.

## scope
- `workers/src/index.ts`에 서울시 API 연동 로직 추가
- Worker 환경변수로 서울시 API 키 사용
- `/api/arrivals?station=...` 엔드포인트 구현
- XML 응답에서 필요한 필드만 추출해 JSON으로 반환
- 이번 범위는 도착정보 조회 1개 엔드포인트 구현까지 포함

## work steps
- [ ] 1. 서울시 도착정보 API 요청 형식과 필요한 응답 필드를 확정한다.
- [ ] 2. Worker 환경변수 이름과 오류 처리 규칙을 정의한다.
- [ ] 3. `/api/arrivals?station=...` 엔드포인트를 구현한다.
- [ ] 4. XML 응답을 파싱해 `barvlDt`, `arvlMsg2`, `trainLineNm` 등 필요한 값만 JSON으로 변환한다.
- [ ] 5. 로컬 검증 기준과 Cloudflare 비밀값 설정 절차를 정리한다.

## verification criteria
- `/api/arrivals?station=강남` 요청이 성공 시 JSON을 반환한다.
- 응답에 최소한 `stationName`, `updatedAt`, `trains[].barvlDt`, `trains[].arvlMsg2`가 포함된다.
- API 키가 없거나 외부 API 호출이 실패하면 명확한 오류 응답을 준다.

## completion condition
- Worker가 서울시 도착정보를 실제로 가져와 앱이 바로 쓸 수 있는 JSON으로 반환한다.
- Cloudflare에 API 키만 넣으면 도착정보 조회 엔드포인트를 배포할 수 있다.
