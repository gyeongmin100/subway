# Android Foreground Service Strategy

## 현재 결론
- `expo-notifications`만으로는 요구사항을 만족할 수 없다.
- 이유:
  - 앱 JS가 살아 있을 때만 갱신 루프가 돈다.
  - 알림 액션을 누를 때 앱을 열지 않고 처리하기 어렵다.
  - 패널 내부에서 초가 계속 줄어드는 구조가 아니다.
  - 단일 ongoing notification을 포그라운드 서비스처럼 유지하는 구조가 아니다.

## 요구사항과 맞는 기술 조건
- Android foreground service notification
- ongoing notification 1개 유지
- 앱을 열지 않는 액션 처리
- 백그라운드 상태에서도 주기 갱신
- 서비스 단에서 현재 즐겨찾기, 이전/다음, 새로고침 상태 관리

## 선택 가능한 구현 경로

### 1안. Expo prebuild + 네이티브 모듈 도입
- 방향:
  - Expo 프로젝트를 유지하되 Android 네이티브 레이어를 연다.
  - foreground service 가능한 라이브러리 또는 직접 Kotlin 서비스 구현을 붙인다.
- 장점:
  - 현재 Expo 앱 구조를 크게 버리지 않는다.
  - 기존 JS 화면과 저장 구조를 계속 활용할 수 있다.
- 단점:
  - 더 이상 순수 managed 흐름이 아니다.
  - Android 네이티브 수정이 필요하다.
  - 빌드/유지보수 난도가 올라간다.

### 2안. Android 전용 네이티브 구현으로 분리
- 방향:
  - 패널 기능을 Android 네이티브 앱 또는 React Native bare workflow 중심으로 구현한다.
- 장점:
  - 요구사항을 가장 직접적으로 만족시키기 쉽다.
  - 포그라운드 서비스, 브로드캐스트 리시버, 알림 액션 제어가 명확하다.
- 단점:
  - 현재 Expo 중심 구조와 거리가 멀어진다.
  - 구현 범위가 더 커진다.

## 추천
- 현재 프로젝트 기준 추천은 `1안`이다.
- 즉:
  - Expo 앱은 유지
  - Android는 prebuild 후 네이티브 레이어 추가
  - foreground service notification을 Kotlin 쪽에서 구현

## 다음 구현 단위
1. `expo prebuild`로 Android 프로젝트 생성
2. Android foreground service 설계
3. 액션 버튼 브로드캐스트 처리
4. JS 저장 상태와 네이티브 서비스 상태 동기화 방식 정의
5. 실제 ongoing notification 1개 유지 구현
