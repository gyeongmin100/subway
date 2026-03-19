# implementation_plan

## active plan: display-only station/search data quality cleanup

### goal
- API 요청용 역명과 질의 후보는 유지한다.
- 사용자에게 보이는 검색 라벨, 즐겨찾기 라벨, 검색 토큰의 품질 이슈를 정리한다.
- `역역` 중복, 노선명 표기 혼재, 괄호/기호 검색 누락을 줄인다.

### scope
- `app/src/lib/search.ts`
- `app/src/lib/stationNames.ts`
- `app/src/data/searchMaster.json`
- `search_master_final.csv`
- 필요 시 `app/src/types/search.ts`

### work steps
- [ ] 1. 표시 전용 수정 대상과 API 요청용 유지 대상을 분리한다.
- [ ] 2. `역역` 중복 3건을 검색 라벨과 토큰에서 정리한다.
- [ ] 3. 검색용 노선명 표시 체계를 현재 앱 표시 기준에 맞게 정리한다.
- [ ] 4. 점(`.`), 가운데점(`·`), 괄호 생략 입력을 더 잘 받도록 검색 정규화 또는 토큰 보강을 한다.
- [ ] 5. 타입 체크와 검색 회귀를 확인한다.

### verification criteria
- `서울역역`, `하남검단산역역`이 더 이상 표시/토큰에 남지 않는다.
- API 요청용 역명 후보 로직은 변경되지 않는다.
- `전대.에버랜드`, `전대·에버랜드` 같이 기호가 달라도 검색이 가능하다.
- 앱 타입 체크가 통과한다.

### completion condition
- 사용자에게 보이는 검색/즐겨찾기 이름 품질 문제가 정리된다.
- 실시간 API 요청 성공 여부에 영향을 주는 역명 질의 로직은 유지된다.

## active plan: parenthetical station-name dedup by api query canonical

### goal
- 괄호 부제 유무로 중복된 역명을 하나의 기준명으로 통일한다.
- 기준명은 `실제 API 요청에 쓰는 이름`으로 잡는다.
- 표시/검색 데이터는 기준명에 맞추고, 필요한 별칭만 검색 보조로 유지한다.

### scope
- `app/src/data/stationMaster.json`
- `app/src/lib/stationNames.ts`
- 필요 시 `app/src/lib/search.ts`
- 검증용 `workers/src/stationNames.ts` 참고

### work steps
- [ ] 1. 괄호 부제 중복 10쌍 각각에 대해 API 요청 기준명을 확인한다.
- [ ] 2. 기준명과 별칭 유지 대상을 결정한다.
- [ ] 3. `stationMaster.json`을 기준명으로 통일한다.
- [ ] 4. 검색에서 필요한 별칭이 있다면 `stationNames.ts` 또는 검색 정규화로 흡수한다.
- [ ] 5. 타입 체크와 대표 역 검색/실시간 회귀를 확인한다.

### verification criteria
- 같은 역이 괄호 유무로 두 벌 존재하지 않는다.
- API 요청 성공에 쓰이는 역명은 유지된다.
- 괄호 부제 이름으로 검색해도 필요한 경우 기준명 역을 찾을 수 있다.

### completion condition
- 괄호 부제 중복 10쌍이 기준명 하나로 정리된다.
- API 요청용 이름과 표시/검색용 기준명이 다시 어긋나지 않는다.

## active plan: api-aligned line and station naming normalization

### goal
- 서울 실시간 도착 API에서 내려오는 노선명/역명 체계와 앱 검색·즐겨찾기 체계를 일치시킨다.
- `station=...&line=...` 필터가 API 실제 값과 같은 기준으로 동작하게 만든다.
- 기존 즐겨찾기와 검색 경험이 깨지지 않도록 표시명과 내부 비교 기준을 분리한다.

### scope
- `workers/src/index.ts`
- `app/src/lib/arrivals.ts`
- `app/src/lib/search.ts`
- `app/src/data/stationMaster.json`
- `search_master_final.csv`
- `search_master_correction_table.csv`
- 필요 시 `workers/src/stationNames.ts`, `app/src/lib/stationNames.ts`

### work steps
- [ ] 1. API 실측 기준 노선명/역명과 앱 마스터 데이터의 불일치 목록을 확정한다.
- [ ] 2. Worker의 `subwayId -> lineName` 매핑을 API와 검색 체계에 맞는 단일 기준으로 정리한다.
- [ ] 3. 앱의 `subwayId -> lineName` 매핑과 즐겨찾기 비교 로직을 Worker 기준과 동일하게 맞춘다.
- [ ] 4. 검색/즐겨찾기 원천 데이터의 노선명 및 역명 표기를 API 기준과 충돌하지 않도록 정리한다.
- [ ] 5. 기존 즐겨찾기 데이터가 새 이름 체계에서도 정상 매칭되는지 확인하고 필요 시 정규화 보정 로직을 추가한다.
- [ ] 6. 대표 역(`강남`, `구로`, `신도림`, `강동`)에서 전체 조회와 line 필터 조회를 비교 검증한다.

### verification criteria
- `station=강남` 전체 조회에 포함된 노선이 `line=해당노선명` 필터 조회에서도 동일하게 나온다.
- `신분당`/`신분당선` 같은 불일치가 사라진다.
- 앱 검색 결과의 노선명과 실시간 도착 응답의 노선명이 직접 비교 가능하다.
- 분기역에서도 노선명 불일치 때문에 열차가 누락되거나 0건이 되는 사례가 재현되지 않는다.

### completion condition
- Worker, 앱 비교 로직, 검색 원천 데이터가 같은 노선명 체계를 사용한다.
- 대표 역 실측 검증에서 line 필터 0건 오동작이 사라진다.
- 역명/노선명 정규화 변경으로 기존 즐겨찾기 매칭이 깨지지 않는다.

## goal
- 현재 프로젝트의 지하철 도착정보가 실제와 어긋나는 원인을 줄이고, 표시 시간을 신뢰 가능한 기준으로 다시 맞춘다.
- 우선은 기존 `realtimeStationArrival` 응답을 올바르게 해석해 ETA 오차를 줄이고, 필요하면 그 다음 단계에서 `realtimePosition` 계열 연동을 검토한다.

## scope
- 1차 범위: 안드로이드 포그라운드 패널 서비스의 ETA 계산, 재동기화, 정렬/필터 로직.
- 1차 범위: Worker가 내려주는 도착 응답의 시각 기준 정리와 역명/노선명 매칭 안정화.
- 1차 범위: 현재 API만으로는 정확도가 부족한 구간을 식별하기 위한 로그/검증 포인트 정리.
- 2차 결정 포인트: 열차 위치 API 연동 여부. 이 단계는 별도 승인 후 진행한다.

영향 가능 파일:
- `app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelService.kt`
- `workers/src/index.ts`
- `workers/src/stationNames.ts`
- `app/src/lib/arrivals.ts`
- `app/src/lib/api.ts`

## work steps
- [ ] 1. 현재 ETA 계산 경로를 분해한다.
- [ ] 2. `barvlDt`를 무조건 줄이는 방식과 `minOf` 기반 안정화 로직을 제거하거나 완화한다.
- [ ] 3. `recptnDt`와 최신 응답 시각을 기준으로 재동기화 규칙을 정의한다.
- [ ] 4. 분기역/복합역에서 잘못된 열차가 섞이지 않도록 노선 및 방향 필터를 점검한다.
- [ ] 5. Worker의 역명 후보 탐색과 노선명 정규화를 실제 응답 패턴에 맞게 정리한다.
- [ ] 6. 대표 역 3종 이상에서 반복 요청을 통해 ETA 진행과 표시 결과를 비교한다.
- [ ] 7. 필요 시 `realtimePosition` 도입 여부를 결정할 수 있도록 추가 검증 결과를 정리한다.

## verification criteria
- 같은 역을 1초 간격으로 반복 조회했을 때, 화면 표시값이 API 응답과 모순되지 않는다.
- ETA가 실제보다 과도하게 짧게 고정되거나, 새 응답보다 이전 계산값을 더 강하게 신뢰하는 현상이 사라진다.
- 도착 상태 문구와 초 단위 표기가 상황에 맞게 전환된다.
- 분기역에서 다른 노선의 열차가 섞여 보이는 사례가 재현되지 않는다.
- 대표 역 `강남`, `서울역`, `구로` 같은 케이스에서 5분 이상 관찰해도 오차가 누적되지 않는다.

## completion condition
- 현재 구조에서 확인된 ETA 오차 원인이 수정되었고, 동일 조건 반복 테스트에서 표시가 안정적으로 유지된다.
- `realtimePosition` 연동이 필요하다는 결론이면, 그 필요성/효과/리스크가 정리된 상태로 다음 단계 승인만 남는다.

## risks and decision points
- `realtimeStationArrival`만으로는 초단위 정확도에 한계가 있을 수 있다.
- `minOf`를 제거하면 숫자가 다시 늘어나는 것처럼 보일 수 있으나, 이는 실제 운행 지연을 반영하는 정상 동작일 수 있다.
- 분기역은 상행/하행만으로 부족할 수 있어, 행선지 기준 필터가 추가로 필요할 수 있다.
- `realtimePosition`은 정확도를 높일 가능성이 있지만, 응답 구조/매칭 규칙/캐시 전략을 다시 설계해야 할 수 있다.
