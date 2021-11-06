# convert-published-gdocs-to-web

핀란핀란 서바이벌 Google Docs 에서 배포되는 웹페이지들을 적당히 수정 후 https://life.finko.dev 로 재배포 합니다.

* 구글독: https://finlan.finko.dev
* 결과물: https://life.finko.dev

## 재배포 방법
세 가지 방법으로 Cloudflare Pages 의 빌드를 트리거 할 수 있습니다.
1. GitHub push : 이 리포지터리의 main 브랜치에 push 가 발생하면 자동으로 빌드/배포 합니다.
2. Manual build in Cloudflare Pages : Cloudflare Pages 대시보드에서 수동으로 빌드/배포할 수 있습니다.
3. Cloudflare Pages 빌드 API: Deploy hooks을 사용하여 빌드/배포 트리거가 가능합니다.
* PR 을 만들면 자동으로 프리뷰가 생성됩니다. 궁금하시면 PR을!
 
## `build.js` 기능
1. 각 페이지의 Google Docs 웹배포 링크들을 조사해서 자동으로 url mapping / 수정
2. `page-list.yaml` 에 수동 매핑을 등록할 수 있습니다.
3. 모든 링크에 적용되는 구글 링크 wrapper 를 모두 제거합니다.
4. 구글의 자바스크립트를 모두 제거합니다.

## 빌드스크립트 사용
`page-list.yaml` 에 최소 한 개의 시작점(메인페이지)를 등록한후
```
npm install
npm run build
```
`./dist` 디렉토리에 재빌드된 페이지들이 저장됩니다.

## [WIP] Fallback 플랜
Google Docs 의 Web Publish 에 변경이 생겨 차후 빌드 스크립트(`build.js`) 가 실패한 가능성이 있습니다.
스크립트 수정이 어려울 경우 Fallback 플랜은 수동으로 작성한 URL Mapping 파일을 이용해서 모든 페이지들을 해당 Gooogle Docs Published Web 페이지로 302 리다이렉트를 합니다.

## Contribute
코드를 새벽에 대충 짜서 지저분합니다. 마음껏 PR 해 주세요. 아래 TODO 들도..

## TODO
1. 이미지 재배포
2. css 분리
3. css 마사지들
4. sidebar/navi/header
5. Fallback 플랜
