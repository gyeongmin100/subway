# implementation_plan

## goal
- Cloudflare Workers가 배포할 수 있는 최소 실행 가능한 Worker 프로젝트를 저장소에 추가한다.
- 현재 저장소 루트가 아닌 `workers/` 폴더를 배포 대상으로 쓸 수 있게 구조를 만든다.

## scope
- `workers/` 폴더 생성
- Workers 설정 파일과 TypeScript 엔트리 파일 생성
- 최소 실행 가능한 응답용 API 엔드포인트 추가
- 로컬 검증에 필요한 `package.json`, `wrangler.jsonc`, `tsconfig.json` 추가
- 이번 범위는 Worker 골격 생성과 배포 준비까지 포함

## work steps
- [ ] 1. `workers/` 폴더 구조와 최소 배포 파일 구성을 정의한다.
- [ ] 2. `wrangler.jsonc`, `package.json`, `tsconfig.json`을 생성한다.
- [ ] 3. `src/index.ts`에 최소 실행 가능한 Worker 핸들러를 구현한다.
- [ ] 4. Cloudflare 배포 기준에 맞는 검증 명령과 배포 루트 기준을 정리한다.
- [ ] 5. 생성한 파일들의 정합성을 검토하고 Git 반영 준비를 한다.

## verification criteria
- `workers/wrangler.jsonc`에서 `main`이 Worker 엔트리 파일을 가리킨다.
- `workers/src/index.ts`가 `wrangler deploy` 가능한 기본 `fetch` 핸들러를 제공한다.
- Cloudflare에서 Root Directory를 `workers`로 지정하면 배포 가능한 구조다.

## completion condition
- 저장소 안에 Cloudflare Workers 프로젝트가 실제로 존재한다.
- Cloudflare에서 더 이상 "배포할 프로젝트를 찾을 수 없음" 오류가 나지 않는 구조가 된다.
