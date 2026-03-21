# implementation plan

## goal
- 도착 정보 표시와 상태 판단에 `barvlDt`, `arvlMsg2`, `arvlCd`를 역할별로 함께 사용한다.
- 가까운 상태는 `arvlCd`로 더 안정적으로 판별하고, 시간 계산은 `barvlDt`, 사용자 문구는 `arvlMsg2`를 사용한다.
- 앱 화면과 알림패널이 같은 상태 판단 기준을 쓰도록 맞춘다.

## scope
- `workers/src/index.ts`
- `app/src/types/arrival.ts`
- `app/src/lib/arrivals.ts`
- `app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelService.kt`

## work steps
- [x] 1. Worker가 서울 API의 `arvlCd`를 파싱해서 앱과 패널에 그대로 내려주도록 응답 타입을 확장한다.
- [x] 2. 앱 공통 타입에 `arvlCd`를 추가한다.
- [x] 3. 앱 표시 로직은 `arvlCd=0`이면 진입, `arvlCd=1`이면 도착 상태를 우선 반영하고, 그 외는 기존 `barvlDt`/`arvlMsg2` 규칙을 유지한다.
- [x] 4. 안드로이드 패널도 같은 기준으로 상태 판단을 통일한다.
- [x] 5. 현재 패널 스냅샷 저장 구조와 충돌하지 않는지 확인하고, 60초 이하 문구 규칙과 함께 검증한다.

## verification criteria
- Worker 응답에 `arvlCd`가 포함된다.
- 앱과 패널 모두 `arvlCd=0`일 때 진입, `arvlCd=1`일 때 도착 상태를 우선 표시한다.
- `arvlCd`가 일반 상태일 때는 기존 시간/문구 표시가 유지된다.
- 타입체크가 통과한다.

## completion condition
- `barvlDt`는 시간 계산, `arvlMsg2`는 사용자 문구, `arvlCd`는 상태 판단 역할로 분리된다.
- 앱과 패널의 상태 표시 기준이 동일해진다.
