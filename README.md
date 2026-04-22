# 링코 (Linkko)

나만의 링크 메모 아카이브 — Next.js 14 + Supabase

---

## 기술 스택

| 역할 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend / Auth / DB | Supabase |
| Styling | Tailwind CSS |
| 배포 | Vercel |

---

## 로컬 개발

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase 값을 입력하세요. (아래 Supabase 설정 참고)

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속

---

## Supabase 설정

### 프로젝트 생성

1. [supabase.com](https://supabase.com) → New project 생성
2. Dashboard → **Settings** → **API** 에서 다음 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 노출 금지)

### DB 스키마 적용

Dashboard → **SQL Editor** → `supabase/schema.sql` 전체 내용 붙여넣기 후 실행

### 구글 OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) → API & Services → Credentials → **OAuth 2.0 Client ID** 생성
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://<your-project-id>.supabase.co/auth/v1/callback
     ```
2. Supabase Dashboard → **Authentication** → **Providers** → **Google** 활성화
   - Client ID, Client Secret 입력 후 저장

3. Supabase Dashboard → **Authentication** → **URL Configuration**
   - **Site URL**: `http://localhost:3000` (로컬) / 배포 후 Vercel URL로 변경
   - **Redirect URLs** 추가:
     ```
     http://localhost:3000/**
     https://<your-vercel-domain>.vercel.app/**
     ```

---

## Vercel 배포

### 방법 1: GitHub 연동 (권장)

```bash
# 1. GitHub 저장소 생성 후 푸시
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<username>/linkko.git
git push -u origin main
```

2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 저장소 선택
3. **Environment Variables** 설정 (아래 표 참고)
4. **Deploy** 클릭

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경변수 (Vercel Dashboard에서 설정)

| 변수 | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | 공개 가능 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | **절대 노출 금지** |

> Vercel Dashboard → 프로젝트 선택 → **Settings** → **Environment Variables**

### 배포 후 Supabase 설정 업데이트

배포 URL (`https://your-app.vercel.app`)을 확인한 후:

1. Supabase → **Authentication** → **URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**` 추가

2. Google Cloud Console → OAuth 2.0 클라이언트 → Authorized redirect URIs 확인
   - `https://<your-project-id>.supabase.co/auth/v1/callback` (이미 있으면 OK)

---

## 빌드 & 타입 체크

```bash
# 타입 체크
npm run lint

# 프로덕션 빌드 테스트 (로컬)
npm run build
npm run start
```

---

## 프로젝트 구조

```
linkko/
├── app/
│   ├── (auth)/
│   │   ├── login/          # 로그인 페이지
│   │   └── signup/         # 회원가입 페이지
│   ├── (main)/
│   │   ├── dashboard/      # 홈 대시보드
│   │   ├── links/          # 링크 전체 목록
│   │   ├── search/         # 검색
│   │   └── me/             # 프로필
│   ├── api/
│   │   └── preview/        # OG 미리보기 API
│   └── auth/callback/      # OAuth 콜백
├── components/
│   ├── auth/               # LoginForm, SignupForm
│   ├── dashboard/          # DashboardClient, FolderGrid, RecentLinks, NewLinkBanner
│   ├── folder/             # FolderList, FolderManager
│   ├── link/               # LinkCard, AddLinkModal, EditLinkModal
│   ├── links/              # LinksClient (링크 전체 목록)
│   ├── me/                 # MeClient
│   ├── search/             # SearchClient, SearchResultCard, Highlight
│   ├── layout/             # Header, BottomNav
│   └── ui/                 # Button, Modal, Toast, ConfirmModal, ErrorBanner, Spinner
├── hooks/
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── useFolders.ts
│   ├── useLinks.ts
│   └── useToast.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # 브라우저용 클라이언트
│   │   ├── server.ts       # 서버 컴포넌트용
│   │   └── middleware.ts   # 미들웨어용
│   └── utils/
│       ├── cn.ts           # 클래스 병합
│       ├── time.ts         # 상대 시간 포맷
│       └── url.ts          # URL 유틸
├── types/
│   └── index.ts            # 공통 TypeScript 타입
└── supabase/
    └── schema.sql          # DB 스키마 (RLS 포함)
```

---

## DB 설계

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `profiles` | id, email, created_at | auth.users 연동, 트리거로 자동 생성 |
| `folders` | id, user_id, name, sort_order | RLS 적용 |
| `links` | id, user_id, folder_id(nullable), url, custom_title, memo, preview_* | folder_id: ON DELETE SET NULL |

- 폴더 삭제 시 → links.folder_id = NULL (미분류 처리, 링크 보존)
- 모든 테이블에 RLS 적용 → 본인 데이터만 접근 가능

---

## 2단계 계획 (Android APK)

- React Native + Expo
- 동일한 Supabase 프로젝트 공유 (`lib/supabase/` 구조 재활용)
- 인스타그램 공유 시트 연동 목표
