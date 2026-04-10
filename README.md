# Subway

서울 지하철 도착정보를 확인하고 즐겨찾기 역을 관리하는 React Native 앱입니다.  
Android에서는 즐겨찾기 상태를 네이티브 알림 서비스와 동기화해 패널에서 바로 확인할 수 있도록 구성되어 있습니다.

## 핵심 기능

- 역 검색
- 노선/방향 기준 즐겨찾기 추가
- 즐겨찾기 삭제 및 순서 변경
- 실시간 도착정보 조회
- Android 알림 패널 연동

## 현재 구현 기준 설명

- 앱은 Expo + React Native로 작성되어 있습니다.
- 즐겨찾기와 현재 선택 상태는 AsyncStorage에 저장됩니다.
- 도착정보는 Cloudflare Workers API를 통해 조회합니다.
- Worker는 서울시 지하철 실시간 도착정보 API를 호출해 응답을 정리합니다.
- Android 네이티브 서비스에는 이전, 새로고침, 다음 액션이 포함되어 있습니다.

## 기술 스택

- Expo
- React Native
- TypeScript
- AsyncStorage
- Cloudflare Workers

## 프로젝트 구조

```text
app/      모바일 앱
shared/   앱/워커 공용 규칙
workers/  도착정보 조회용 Worker
```

## 실행 방법

### 앱

```bash
cd app
npm install
npm start
```

Android 실행:

```bash
cd app
npm run android
```

iOS 스크립트:

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

배포 또는 실제 호출에는 `SEOUL_SUBWAY_API_KEY` 설정이 필요합니다.

## API 예시

```http
GET /health
GET /api/arrivals?station=강남
GET /api/arrivals?station=강남&line=2호선
GET /api/arrivals?station=강남&line=2호선&direction=내선
```

## 참고

- Android 알림 패널 연동 코드는 [app/src/lib/nativePanel.ts](/C:/Users/im100/Desktop/project/subway/app/src/lib/nativePanel.ts) 와 [SubwayPanelService.kt](/C:/Users/im100/Desktop/project/subway/app/android/app/src/main/java/com/gyeongmin100/subway/SubwayPanelService.kt) 에 있습니다.
- Worker 도착정보 처리 코드는 [workers/src/arrivals.ts](/C:/Users/im100/Desktop/project/subway/workers/src/arrivals.ts) 에 있습니다.
