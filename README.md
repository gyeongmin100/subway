# 지하철 퀵체크

서울 지하철 도착 정보를 빠르게 확인하는 모바일 앱입니다. 자주 타는 역, 노선, 방향을 즐겨찾기로 저장해두고 앱 안에서 바로 선택하거나, Android 알림 패널에서 다음 열차 정보를 확인할 수 있습니다.

현재 앱 버전은 `1.0.6` 기준입니다.

<p>
  <img src="app/assets/icon.png" alt="지하철 퀵체크 앱 아이콘" width="96" />
</p>

![지하철 퀵체크 앱 화면](app/assets/ChatGPT%20Image%202026년%204월%2023일%20오후%2004_42_24.png)

## 어떤 서비스인가요?

지하철 퀵체크는 "지금 내가 자주 타는 열차가 언제 오는지"를 짧은 동선으로 확인하는 앱입니다. 역 이름을 검색하고, 노선과 방향을 골라 즐겨찾기에 추가하면 이후에는 저장된 항목만 빠르게 오갈 수 있습니다.

앱을 계속 열어두지 않아도 Android에서는 알림 패널에 현재 선택한 즐겨찾기의 도착 정보가 표시됩니다. 패널에서 이전, 새로고침, 다음 버튼을 눌러 즐겨찾기 사이를 이동하거나 최신 도착 정보를 다시 가져올 수 있습니다.

## 주요 기능

- 역 이름 검색: 2글자 이상 입력하면 지원 노선의 역과 방향 후보를 보여줍니다.
- 즐겨찾기 추가: 역, 노선, 방향 단위로 자주 확인하는 경로를 저장합니다.
- 현재 기준 선택: 여러 즐겨찾기 중 알림 패널과 앱이 기준으로 삼을 항목을 선택합니다.
- 즐겨찾기 관리: 저장한 항목을 삭제하거나 순서를 위아래로 바꿀 수 있습니다.
- 실시간 도착 정보 조회: Cloudflare Workers 백엔드를 통해 서울시 실시간 도착 정보를 가져옵니다.
- Android 알림 패널: 현재 즐겨찾기의 도착 정보를 표시하고, 이전/새로고침/다음 액션을 제공합니다.
- 패널 복원: Android에서 알림이 닫히거나 기기가 재부팅되거나 앱이 업데이트된 뒤에도 저장된 즐겨찾기가 있으면 패널 상태를 복원합니다.
- 도착 정보 보정: API 관측 시각을 기준으로 남은 시간을 계산하고, 급행/ITX/특급/막차 표시를 함께 보여줍니다.

## 사용 흐름

1. 앱을 열고 역 이름을 검색합니다.
2. 원하는 역, 노선, 방향을 선택해 즐겨찾기에 추가합니다.
3. 즐겨찾기 목록에서 현재 기준으로 볼 항목을 선택합니다.
4. Android에서는 알림 권한 허용 후 알림 패널에서 도착 정보를 확인합니다.
5. 패널의 `이전`, `새로고침`, `다음` 버튼으로 앱을 열지 않고도 주요 경로를 전환합니다.

## 지원 범위

- 수도권 주요 지하철 노선을 검색 대상으로 사용합니다.
- 도착 정보는 서울시 지하철 실시간 도착정보 API 응답을 기반으로 합니다.
- 실시간 도착 정보는 공공 API 상태, 열차 운행 상황, 네트워크 상태에 따라 실제와 다를 수 있습니다.
- Android 알림 패널 기능은 네이티브 모듈이 포함된 Android 빌드에서 동작합니다.

## 기술 구성

- 모바일 앱: Expo, React Native, TypeScript
- 로컬 저장소: AsyncStorage
- Android 네이티브 연동: Kotlin Foreground Service, BroadcastReceiver, Notification
- 백엔드: Cloudflare Workers
- 외부 데이터: 서울시 지하철 실시간 도착정보 API

## 프로젝트 구조

```text
app/      Expo 기반 모바일 앱과 Android 네이티브 패널 코드
shared/   앱과 Worker가 함께 쓰는 지하철 규칙
workers/  실시간 도착 정보 조회용 Cloudflare Worker
```

## 실행 방법

### 앱

```bash
cd app
npm install
npm start
```

Android 네이티브 빌드:

```bash
cd app
npm run android
```

iOS 실행:

```bash
cd app
npm run ios
```

### Worker

```bash
cd workers
npm install
npm run dev
```

검사:

```bash
cd workers
npm run check
```

배포 또는 실제 API 호출에는 Cloudflare Worker secret으로 `SEOUL_SUBWAY_API_KEY`가 필요합니다.

## API 예시

```http
GET /health
GET /api/arrivals?station=강남
GET /api/arrivals?station=강남&line=2호선
GET /api/arrivals?station=강남&line=2호선&direction=내선
```

## 주요 코드 위치

- 모바일 진입점: [`app/App.tsx`](app/App.tsx)
- 역 검색: [`app/src/lib/search.ts`](app/src/lib/search.ts)
- 즐겨찾기 저장: [`app/src/lib/storage.ts`](app/src/lib/storage.ts)
- Android 패널 동기화: [`app/src/lib/nativePanel.ts`](app/src/lib/nativePanel.ts)
- Android 알림 서비스: [`app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelService.kt`](app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelService.kt)
- Android 패널 액션/복원: [`app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelActionReceiver.kt`](app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelActionReceiver.kt)
- Worker 도착 정보 처리: [`workers/src/arrivals.ts`](workers/src/arrivals.ts)
