# 지하철 퀵체크

자주 타는 지하철 도착 정보를 앱을 열지 않고도 확인할 수 있는 Android 알림 패널 기반 지하철 앱입니다.

현재 앱 버전은 `1.0.6` 기준입니다.

<p>
  <img src="app/assets/icon.png" alt="지하철 퀵체크 앱 아이콘" width="96" />
</p>

![지하철 퀵체크 앱 화면](app/assets/ChatGPT%20Image%202026년%204월%2023일%20오후%2004_42_24.png)

## 왜 만들었나요?

지하철 도착 시간을 확인할 때마다 앱을 열고, 역을 검색하고, 노선과 방향을 다시 고르는 과정은 반복적입니다. 특히 매일 같은 역과 같은 방향을 확인하는 사람에게는 정보 자체보다 확인 과정이 더 번거롭습니다.

지하철 퀵체크는 이 반복을 줄이는 데 집중했습니다. 자주 타는 역, 노선, 방향을 즐겨찾기로 저장해두고, 앱 화면 또는 Android 알림 패널에서 바로 확인할 수 있게 만들었습니다.

## 어떻게 해결하나요?

앱에서는 역 이름을 검색해 원하는 노선과 방향을 즐겨찾기에 추가합니다. 이후에는 즐겨찾기 목록에서 현재 기준으로 볼 항목을 선택할 수 있습니다.

Android에서는 선택된 즐겨찾기의 도착 정보가 알림 패널에 표시됩니다. 패널 안에서 `이전`, `새로고침`, `다음` 버튼을 눌러 앱을 다시 열지 않고도 자주 보는 경로를 전환할 수 있습니다.

알림이 닫히거나 기기가 재부팅되거나 앱이 업데이트된 뒤에도 저장된 즐겨찾기가 있으면 패널을 다시 복원하도록 구성했습니다.

## 핵심 기능

- 역, 노선, 방향 단위 즐겨찾기 저장
- 현재 기준 즐겨찾기 선택 및 순서 변경
- 서울시 실시간 도착 정보 기반 열차 도착 시간 확인
- Android 알림 패널에서 도착 정보 확인
- 알림 패널 내 이전, 새로고침, 다음 액션
- 재부팅, 앱 업데이트, 알림 닫힘 이후 패널 복원
- 급행, ITX, 특급, 막차, 당역 진입/도착 상태 표시
- API 관측 시각을 반영한 남은 시간 보정

## 기술적으로 신경 쓴 부분

### 앱과 Android 패널 상태 동기화

React Native 앱에서 저장한 즐겨찾기와 현재 선택 항목을 Android 네이티브 패널에도 전달합니다. 앱 화면과 알림 패널이 같은 기준을 바라보게 만들어, 사용자가 어디에서 확인하든 같은 즐겨찾기 상태를 유지합니다.

### Foreground Service 기반 알림 패널

Android 알림 패널은 Kotlin 기반 Foreground Service로 동작합니다. 패널의 버튼 액션은 BroadcastReceiver가 받아 처리하고, 현재 선택된 즐겨찾기를 기준으로 이전/다음 경로 이동과 새로고침을 수행합니다.

### 패널 복원 흐름

알림이 닫힌 경우 일정 시간 뒤 저장된 즐겨찾기를 확인해 패널을 복원합니다. 기기 재부팅이나 앱 업데이트 이후에도 저장 상태를 기준으로 알림 패널을 다시 구성합니다.

### Worker를 통한 도착 정보 정리

도착 정보는 Cloudflare Worker를 거쳐 조회합니다. Worker는 서울시 실시간 도착 정보 API 응답을 앱과 Android 서비스가 쓰기 쉬운 형태로 정리하고, 앱은 이 결과를 바탕으로 노선과 방향에 맞는 열차만 보여줍니다.

## 기술 스택

- Expo, React Native, TypeScript
- Kotlin Android Foreground Service, BroadcastReceiver, Notification
- AsyncStorage
- Cloudflare Workers
- 서울시 지하철 실시간 도착정보 API

## 개발자 참고

앱 실행:

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

Worker 실행:

```bash
cd workers
npm install
npm run dev
```

Worker 배포 또는 실제 API 호출에는 Cloudflare Worker secret으로 `SEOUL_SUBWAY_API_KEY`가 필요합니다.

```text
app/      Expo 기반 모바일 앱과 Android 네이티브 패널 코드
shared/   앱과 Worker가 함께 쓰는 지하철 규칙
workers/  실시간 도착 정보 조회용 Cloudflare Worker
```
