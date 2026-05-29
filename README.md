# dhwoo · calendar

ChatGPT Codex 풍의 정제된 무드를 가진 캘린더 앱. Google Calendar와 양방향 동기화.

## 스택

- **Next.js 15** App Router + React 19 + TypeScript
- **Tailwind CSS** + 자체 디자인 토큰 (light/dark)
- **next-themes** 라이트/다크 토글
- **Auth.js (NextAuth v4)** + Google OAuth
- **Prisma + SQLite** (dev). production 시 datasource만 `postgresql`로 변경
- **googleapis** Calendar v3 SDK
- **SWR** 클라이언트 상태
- **Geist Sans / Mono** 타이포그래피
- shadcn/ui 컨벤션을 따르는 자체 작성 UI primitives (Button / Dialog / Input)

## 폴더 구조

```
dhwoo_calendar/
├─ prisma/
│  └─ schema.prisma            # User · Account · Session · Event
├─ src/
│  ├─ app/
│  │  ├─ (auth)/sign-in/       # 로그인 화면
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/  # NextAuth 핸들러
│  │  │  └─ calendar/
│  │  │     ├─ events/         # GET / POST
│  │  │     ├─ events/[id]/    # PATCH / DELETE
│  │  │     └─ sync/           # Google → local pull
│  │  ├─ calendar/             # 메인 캘린더 페이지
│  │  ├─ layout.tsx · globals.css · page.tsx
│  ├─ components/
│  │  ├─ ui/                   # button, dialog, input, theme-toggle
│  │  ├─ layout/               # TopBar, Sidebar
│  │  ├─ calendar/             # CalendarView, MonthView, WeekView, Toolbar, EventModal
│  │  └─ Providers.tsx
│  ├─ hooks/                   # useEvents (SWR + CRUD client)
│  ├─ lib/                     # auth, db, google-calendar, sync, date, utils
│  └─ types/                   # calendar, next-auth augmentation
└─ ...config 파일
```

## 디자인 노트

- **그라데이션 텍스트**: `.text-gradient` 유틸리티가 warm sand → off-white → cool gray 의 3-stop 그라데이션 + 12s `gradient-pan` 애니메이션을 입힌다. Codex 랜딩 헤딩과 비슷한 결.
- **표면**: `bg`, `bg-subtle`, `bg-muted` / `fg`, `fg-muted`, `fg-subtle` 토큰만 사용. ad-hoc 색상 금지.
- **그레인**: `body::before`에 SVG 노이즈 오버레이를 깔아 평면감 제거.
- **하이라인**: 단순 border 대신 `.hairline` (`box-shadow inset`) 으로 더 또렷한 1px 경계.
- **타이포**: 본문 Geist Sans, 메타/시간/배지는 Geist Mono — uppercase + 0.18em tracking.
- **테마 토글**: TopBar 우측. 시스템 prefers-color-scheme를 기본으로 따르되 즉시 전환 가능.

## 환경 변수

`.env.local`을 직접 만들어 다음 값을 채우세요. (`.env.example`은 보안 훅 때문에 자동 생성 차단됨)

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Google Cloud Console → APIs & Services → Credentials에서 OAuth 2.0 클라이언트를 만들고:

- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Scopes (consent screen): `.../auth/calendar`, `.../auth/calendar.events`, `email`, `profile`, `openid`

## 부트스트랩

```bash
pnpm install        # 또는 npm install / yarn

# Prisma
pnpm db:generate
pnpm db:push        # SQLite 파일 생성 + 스키마 적용

pnpm dev            # http://localhost:3000
```

## 데이터 흐름

```
[Client]                                 [Server]
EventModal ── POST /api/calendar/events ──▶ Prisma.create
                                            └─▶ sync.pushCreate ──▶ Google
SWR useEvents ── GET /api/calendar/events ─▶ Prisma.findMany
"동기화" 버튼 ── POST /api/calendar/sync ──▶ sync.pullFromGoogle → upsert
```

- 로컬이 source-of-truth는 아니지만, 오프라인/Google 장애에도 동작하는 캐시 역할.
- 생성/수정/삭제 시 Google push는 best-effort. 실패해도 로컬 변경은 유지되고 다음 동기화 때 재시도.

## 다음에 할만한 것

- 드래그 / 리사이즈로 이벤트 시간 조정
- 시점 알림 (web push)
- 여러 캘린더 지원 (calendarId 선택 UI)
- Postgres + Vercel 배포
- 이벤트 색상/태그 / 검색
