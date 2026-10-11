# Ksaju (윤슬당)

## 배포
- GitHub Pages가 아니라 **Cloudflare Workers**로 배포한다.
- GitHub 저장소: https://github.com/tldbs1229-sudo/Ksaju
- `main` 브랜치에 push하면 Cloudflare가 자동으로 빌드·배포한다. 별도 배포 명령은 필요 없다.
- 공식 주소: https://ksaju.yunseuldang.workers.dev
  - 2026-10-11에 서브도메인을 변경해 Cloudflare가 새 인증서를 발급하는 중이었음. 접속이 안 되면 인증서 발급 대기 가능성부터 의심할 것.
- GitHub Pages 설정을 안내하거나 github.io 주소를 확인하지 말 것.

## 로컬 환경
- Windows / PowerShell. Git은 PATH에 없을 수 있으므로 `C:\Program Files\Git\cmd\git.exe`를 직접 호출한다.
- push 인증은 Git Credential Manager에 저장되어 있다 (`git -c credential.helper=manager push`).
