2026회계 업무 일정 스케쥴러 배포 구조

권장 경로:
  /work-scheduler/index.html
  /work-scheduler/work-scheduler-data.json
  /work-scheduler/work-scheduler-data.js

필수 공통 파일:
  /static/style.css
  /static/footer.js
  /static/global-loader.js
  /static/brand-config.js
  /static/brand-ui.js
  /static/favicon.ico

기본 동작:
  - index.html은 ./work-scheduler-data.json을 먼저 fetch합니다.
  - JSON을 못 불러오는 환경(file:// 등)에서는 ./work-scheduler-data.js의 window.WORK_SCHEDULER_DATA를 fallback으로 사용합니다.
  - 사용자가 추가/수정한 일정은 브라우저 localStorage에 저장됩니다.
  - PC나 브라우저를 바꾸기 전에는 페이지 안의 '일정 JSON 내보내기'로 백업하세요.

기간 변경:
  - work-scheduler-data.json의 fiscalYear.start / fiscalYear.end를 바꾸면 됩니다.
  - 현재는 2026회계: 2026-03-01 ~ 2027-02-28로 설정했습니다.

초기 일정 변경:
  - work-scheduler-data.json의 tasks 배열을 수정하세요.
  - 이미 localStorage에 저장된 일정이 있으면 페이지의 '기본 일정 다시 합치기' 버튼으로 새 프리셋을 병합할 수 있습니다.
