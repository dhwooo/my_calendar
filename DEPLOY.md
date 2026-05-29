# Vercel 배포 가이드

## 1. Neon Postgres (DB) — 5분, 무료

1. https://neon.tech 가입 (GitHub 로그인)
2. New Project → 이름/리전(asia-northeast Tokyo) 선택 → 생성
3. Dashboard → Connection string → **Pooled connection** 복사
   - 형식: `postgresql://user:pass@xxx-pooler.region.neon.tech/dbname?sslmode=require`
4. `.env` 의 `DATABASE_URL` 값을 그 문자열로 교체
5. 로컬에서 스키마 적용:
   ```
   PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx prisma db push
   ```

## 2. VAPID 키 생성 (푸시 알림)

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys(), null, 2))"
```

출력된 `publicKey`, `privateKey`를 `.env`에 추가:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your@email.com
```

## 3. 로컬에서 정상 작동 확인

```bash
PORT=3005 PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run dev
```

## 4. GitHub repo 만들기

```bash
cd /Users/dhwoo/Documents/dhwoo_calendar
git init
git add -A
git commit -m "initial commit"
# GitHub에서 repo 생성 후
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 5. Vercel 프로젝트 생성

1. https://vercel.com 로그인
2. Add New → Project → GitHub repo import
3. **Framework Preset**: Next.js (자동 감지)
4. **Environment Variables** 에 다음 등록:

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `NEXTAUTH_URL` | Vercel deployment URL (배포 후 알 수 있음, 일단 임시 입력 후 수정) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 출력 |
| `GOOGLE_CLIENT_ID` | Google Cloud Console 발급값 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console 발급값 |
| `VAPID_PUBLIC_KEY` | 2단계 생성값 |
| `VAPID_PRIVATE_KEY` | 2단계 생성값 |
| `VAPID_SUBJECT` | mailto:your@email.com |

5. Deploy 클릭 → 첫 빌드 ~2분

## 6. 배포 후 마무리

1. 배포된 URL 확인 (예: `https://dhwoo-calendar.vercel.app`)
2. Vercel Settings → Environment Variables → `NEXTAUTH_URL`을 그 URL로 수정
3. Google Cloud Console → OAuth client → Authorized redirect URIs 에 추가:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Vercel Settings → **Storage → Connect Vercel Blob** (사진 업로드용)
   - `BLOB_READ_WRITE_TOKEN` 환경변수 자동 추가됨
5. Deployments → Redeploy 한번 더 (env 변경 반영)

## 7. PWA 홈 화면 추가

iPhone Safari → 배포 URL 접속 → 공유 버튼 → **홈 화면에 추가**
프로필 페이지 → 알림 허용 → 진짜 푸시 알림 작동

## 비용

- Neon Free: 0.5GB 저장, 100시간 컴퓨트/월 — 충분
- Vercel Hobby: 100GB 대역폭/월, 무제한 배포 — 충분
- Vercel Blob: 1GB 무료
- Google OAuth + Calendar API: 무료
- **총 $0/월**
