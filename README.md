# CA6 Fantasy Art Lab

Standalone art-direction comparison: 10 fantasy actors/items, one representative motion each, and four biome backgrounds in three production groups.

- A: independent PixelLab Pro masters + PixelLab animation.
- B: PixelLab Pro, detailed prompts, shared palette and a style-reference master + PixelLab animation.
- C: built-in image generation for painted masters + PixelLab animation, packaged with consistent scale and root.

The comparison does not reproduce proprietary CodeMonkey source artwork. It compares equivalent gameplay roles in an original fantasy theme. It does not claim to include every action required by the final game.

Open `index.html` through any static HTTP host. No API keys, Docker, execution service, build step or generation calls are required to view the page. Votes and notes stay in the browser and can be exported as JSON. `provenance.json` records the actual production routes and image hashes; `qa.json` records frame checks and warnings.


## Claude Code 통합 비교

A/B/C는 기존 Codex 제작, D/E/F/G는 Claude Code 별도 실험실 결과를 가져왔다. 7개 버전 × 10종 × 8프레임, 4개 지역씩의 배경 구성(총28구성, G는 D의 4배경을 재사용). 비교할 버전을 체크해 같은 시계·크기·각도로 볼 수 있다. 파일 출처/해시는 claude-import.json. 가져오기 중 생성 API나 결제는 사용하지 않았다.

게임 요구는 모든 캐릭터가 수직 정수리 뷰다. B의 주인공은 위에서 내려다보지만 여러 몬스터가 측면이므로 이 기준에 미달한다. 파일 해시를 대조하여 실제 게임이 동일 B를 사용함을 확인했다. 통합 비교 페이지는 시점 차이를 명시하며 이 문제를 수정 완료로 표시하지 않는다.


## H · 실제 3D 복셀 비교 (추가)

`voxel.js`의 실제 인스턴스 복셀 메시, 직교 카메라와 파츠 리그를 WebGL로 렌더링한다. 10종×8포즈와 초원·설원·사막·늪지 4종 복셀 지형을 코드로 제작했다. H는 PNG 동작 프레임을 새로 생성한 버전이 아니다. 기존 7개 버전의 560 이미지/SVG 프레임과 별도로 10개 실시간 3D 리그가 추가됐다. 기본 카메라 기울임0도가 수직 정수리 뷰이며 0~55도 기울임은 비교용이다. WebGL을 사용할 수 없으면 오류를 표시한다. Three.js0.180.0(MIT)은 vendor/three에 라이선스와 함께 보관한다. 추가 생성/API/결제 없음.

`?compare=styled,claude-pl-repaint,voxel#stage`로 B/G/H를 우선 나란히 볼 수 있고 체크박스로 다른 버전을 포함할 수 있다. H 크기는 모델 원래 정수리 투영 경계에서 한 번만 맞추며, 포즈마다 크기를 바꾸지 않는다.
