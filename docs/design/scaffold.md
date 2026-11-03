# new-mbti 스캐폴드 설계

## 문제

로그인이 필요한 Next.js 16 + Supabase 앱이다. Google/Apple OAuth로 로그인하고, MBTI 질문에 답하면 4글자 유형을 계산해 저장하고 결과 화면을 보여준다. 나중에 얼굴 사진으로 MBTI를 예측하는 기능이 붙는데, 그때 기존 구조를 뜯어고치지 않아야 한다.

지켜야 할 제약:
- Next 16에서 middleware는 `src/proxy.ts`(Proxy)로 이름이 바뀌었고, 공식 문서는 Proxy를 "낙관적 리다이렉트"용으로만 쓰라고 한다. 진짜 인증 검사는 데이터 바로 옆(`server-only` + `cache()`로 메모한 DAL)에서 한다.
- `cookies()`, `params`는 async다.
- 기존 `src/lib/supabase/{client,server,proxy}.ts`는 인프라로 유지한다.
- 서버에서는 `getSession()`을 믿지 않고 `getClaims()`를 쓴다.

## 사용 예 (호출하는 쪽)

feature는 3개이고, 각 feature는 `index.ts`로만 import한다(ESLint로 강제).

```ts
import { requireUser, SignInButtons, SignOutButton, handleOAuthCallback } from "@/features/auth";
import { saveResult, getResult, getLatestResult, ResultView, type Estimate } from "@/features/personality";
import { QuestionnaireForm } from "@/features/questionnaire";
```

결과 페이지 (인증 검사는 `getResult` 안에 있음):

```tsx
export default async function ResultPage({ params }: PageProps<"/results/[id]">) {
  const result = await getResult((await params).id);
  if (!result) notFound();
  return <ResultView result={result} />;
}
```

설문 제출 Server Action (producer의 계약 전체 = `Estimate`를 만들어 `saveResult` 호출):

```ts
const parsed = parseSubmission(form);
if (!parsed) return { error: "모든 문항에 답해 주세요." };
const result = await saveResult(parsed.submissionId, {
  method: "questionnaire", methodVersion: QUESTIONNAIRE_VERSION, scores: scoreAnswers(parsed.answers),
});
redirect(`/results/${result.id}`);
```

나중에 얼굴 예측 (지금은 만들지 않음, 이음새만 보여줌):

```ts
const scores = await predictFromPhoto(file);              // features/face-prediction/predict.ts
const result = await saveResult(submissionId, { method: "face", methodVersion: "model-1", scores });
redirect(`/results/${result.id}`);                        // 같은 ResultView, 같은 테이블
```

라우트: `/login`(공개), `/auth/callback`(공개), 나머지는 `app/(app)/` 아래 `/`, `/test`, `/results/[id]`.

## 구조

**데이터 먼저.** 테이블은 `mbti_results` 하나다. 한 행 = 한 번의 추정 결과이고 수정하지 않는다.
- `method`(questionnaire, 나중에 face), `method_version`, 네 축 점수 `ei sn tf jp`(-100~100 정수).
- `type`(예: `INFP`)은 **DB generated column**이 점수에서 계산한다. 점수→글자 규칙이 SQL 한 곳에만 있어서, 설문이든 얼굴이든 어떤 producer도 글자를 따로 계산하지 않는다.
- `submission_id` + `unique (user_id, submission_id)`로 중복 제출을 막는다. 같은 제출을 두 번 보내도(더블클릭, 재시도) 행은 하나만 생긴다. 다른 사용자의 id와 부딪힐 일도 없다.

**소유권.**
- `features/auth`: 세션(`requireUser`), OAuth 시작/로그아웃 action, 콜백 처리, 경로 헬퍼(`safeNextPath`로 외부 사이트 리다이렉트 차단).
- `features/personality`: `mbti_results`를 읽고 쓰는 유일한 모듈. 도메인 타입과 `ResultView`. export하는 함수마다 안에서 `requireUser()`를 호출하므로, 로그인 없이는 결과 데이터에 닿을 수 없다.
- `features/questionnaire`: 문항, 순수 점수 계산, 폼, 제출 action. 테이블은 모른다.

의존 방향은 한쪽뿐이다: `questionnaire → personality → auth`. `app/`은 라우팅만 한다.

**검사는 두 겹.** `src/proxy.ts`는 로그인 안 된 요청을 `/login?next=…`로 보내는 UX용 리다이렉트만 한다. 진짜 검사는 `(app)` layout과 모든 데이터 함수 안의 `requireUser()`다.

**경계 강제.** ESLint `no-restricted-imports`가 `@/features/*/*` 깊은 import를 막는다. 예외는 `@/features/auth/edge` 하나다. Proxy는 `server-only` 코드를 불러올 수 없어서, 순수 경로 헬퍼만 담은 `edge.ts`를 공개 진입점으로 둔다.

**흐름 추적은 3파일 이내:** `QuestionnaireForm.tsx` → `questionnaire/actions.ts` → `personality/results.ts`.

**일부러 하지 않는 것:** `profiles` 테이블, 원본 답변 저장, estimator 인터페이스/레지스트리, 클라이언트에서 Supabase 직접 호출, 얼굴 관련 코드.

## 모듈 지도

```
supabase/
  config.toml                               (supabase init)
  migrations/20261103000000_mbti_results.sql
src/
  proxy.ts                                  낙관적 리다이렉트
  lib/supabase/
    client.ts, server.ts                    그대로
    proxy.ts                                updateSession -> { response, signedIn }
  features/
    auth/
      index.ts                              requireUser, SessionUser, handleOAuthCallback, SignInButtons, SignOutButton
      edge.ts           순수               isPublicPath, loginPath, safeNextPath (Proxy도 import)
      session.ts        server-only         requireUser = cache(getClaims -> SessionUser | redirect)
      actions.ts        'use server'        signIn(provider, next), signOut()
      callback.ts       server-only         handleOAuthCallback(request)
      components/SignInButtons.tsx, SignOutButton.tsx
    personality/
      index.ts
      model.ts          순수 타입           MbtiType, Axis, AxisScores, Method, Estimate, MbtiResult
      results.ts        server-only         saveResult, getResult, getLatestResult
      components/ResultView.tsx
    questionnaire/
      index.ts                              QuestionnaireForm
      questions.ts                          QUESTIONS, QUESTIONNAIRE_VERSION
      score.ts          순수               parseSubmission(form), scoreAnswers(answers)
      actions.ts        'use server'        submitQuestionnaire
      components/QuestionnaireForm.tsx  'use client'
  app/
    login/page.tsx
    auth/callback/route.ts                  export const GET = handleOAuthCallback
    (app)/layout.tsx                        requireUser + 헤더/로그아웃
    (app)/page.tsx                          최근 결과 또는 "테스트 시작"
    (app)/test/page.tsx                     submissionId를 서버에서 만들어 폼에 전달
    (app)/results/[id]/page.tsx
```

얼굴 기능이 붙을 때 추가되는 것: `features/face-prediction/` 폴더, `app/(app)/face/page.tsx`, `Method`에 `"face"`, `method` check를 바꾸는 마이그레이션 1개, 사진을 보관한다면 private Storage 버킷. 기존 파일은 옮기지 않는다.

## SQL 마이그레이션

```sql
create table public.mbti_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  submission_id  uuid not null,
  method         text not null check (method in ('questionnaire')),
  method_version text not null,
  ei smallint not null check (ei between -100 and 100),   -- 양수 = E
  sn smallint not null check (sn between -100 and 100),   -- 양수 = S
  tf smallint not null check (tf between -100 and 100),   -- 양수 = T
  jp smallint not null check (jp between -100 and 100),   -- 양수 = J
  type text generated always as (
    (case when ei >= 0 then 'E' else 'I' end) ||
    (case when sn >= 0 then 'S' else 'N' end) ||
    (case when tf >= 0 then 'T' else 'F' end) ||
    (case when jp >= 0 then 'J' else 'P' end)
  ) stored,
  created_at timestamptz not null default now(),
  unique (user_id, submission_id)
);

create index mbti_results_user_created_idx on public.mbti_results (user_id, created_at desc);

alter table public.mbti_results enable row level security;

create policy "read own results" on public.mbti_results for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own results" on public.mbti_results for insert to authenticated
  with check ((select auth.uid()) = user_id);
-- update/delete 정책 없음: 결과는 수정하지 않는 기록.

revoke all on public.mbti_results from anon;
grant select, insert on public.mbti_results to authenticated;
```

## 합성 결정

후보 4개를 병렬로 설계했다(opus, fable, sonnet, haiku). fable은 사용량 한도로 중간에 빠져서 3개를 비교했다. 별도 심사 모델(sonnet)도 같은 후보를 기반으로 골랐다.

- **기반: 후보 1 (opus).** 얼굴 이음새가 가장 깔끔하다(`Estimate` + `saveResult`가 producer 계약 전부). 점수→유형 규칙이 SQL 한 곳에 있다. 호출 경로가 가장 짧다.
- **후보 3 (sonnet)에서 가져온 것:** Proxy용 `auth/edge.ts` 공개 진입점. ESLint 예외를 없앤다. 그리고 `submissionId`를 클라이언트 렌더가 아니라 서버 컴포넌트에서 만든다(hydration 불일치 방지).
- **후보 4 (haiku)에서 가져온 것:** `unique (user_id, submission_id)`로 중복 제출 방지. 클라이언트가 PK를 정하지 않으니 다른 사용자 id와 충돌할 수 없다. `revoke from anon` / `grant`를 명시한다. OAuth `redirectTo`를 Origin 헤더 대신 `NEXT_PUBLIC_SITE_URL`에서 만든다.
- **고친 버그:** Proxy가 로그인 페이지로 리다이렉트할 때 갱신된 세션 쿠키를 버리던 문제. 리다이렉트 응답에 쿠키를 복사한다.
- **버린 것:** 후보 3의 `detail jsonb`(원본 답변 저장)는 지금 필요 없는 범위라 뺐다(아래 질문 참고). 후보 3의 delete 정책은 "수정 불가 기록"과 맞지 않는다. 후보 4의 단일 `mbti` feature는 설문과 결과가 한 폴더에 섞여 얼굴 기능이 붙을 때 경계가 흐려진다.

## 받아들인 트레이드오프

- 유형 계산 규칙을 TS 단위 테스트가 닿지 않는 SQL에 두는 대신, 모든 producer가 같은 규칙을 공짜로 쓴다.
- 원본 답변을 저장하지 않는 대신 테이블 하나, insert 한 번으로 끝난다. 문항이 바뀌어도 `method_version`으로 어떤 채점으로 나온 결과인지 알 수 있다.
- `requireUser()`가 layout과 데이터 함수에서 중복 호출되지만, 호출자가 빠뜨릴 수 없다. `cache()` 덕분에 요청당 한 번만 실제로 실행된다.
- 설문은 한 페이지 폼이다. 클라이언트 단계 상태가 필요 없고, 나중에 페이지 나누기는 `QuestionnaireForm` 안에서 하면 된다.

## 검토한 대안

- **estimator 인터페이스 + 레지스트리:** 구현체가 하나뿐인 추상화이고 호출자가 레지스트리를 배워야 한다. `Estimate` 타입 + `saveResult`가 이미 그 이음새다.
- **설문 테이블과 얼굴 테이블 분리:** 지금은 단순하지만 "내 최근 유형"과 결과 화면이 여러 테이블을 합쳐야 하고, 얼굴 기능이 붙을 때 읽기 쪽을 다시 짜야 한다.
- **문항을 DB에 저장:** 테이블 2개, RLS, 시드가 늘어난다. 배포와 함께 바뀌는 내용이라 코드 + 버전이 더 작다.
- **유형 글자를 TS에서 계산해 일반 컬럼으로 저장:** 같은 규칙을 두 곳에서 쓰게 되고, 점수와 유형이 어긋날 수 있다.

## 구현 중 변경 기록

- **`(app)` layout의 `requireUser()`를 Suspense 안으로 옮김.** create-next-app이 `cacheComponents: true`를 켜 두었고, 이 모드에서는 `cookies()`나 `crypto.randomUUID()`를 `<Suspense>` 밖에서 쓰면 빌드 에러가 난다(Next 16 "Authentication with Cache Components" 가이드). 그래서 세션을 읽는 부분은 모두 각 페이지의 Suspense 안 async 컴포넌트로 옮겼다. layout은 헤더의 사용자 메뉴만 Suspense로 감싼다. 공유 계약은 그대로 유지된다. 진짜 검사는 원래부터 데이터 함수 안의 `requireUser()`였고, `/test`는 폼을 그리기 전에 직접 `requireUser()`를 호출한다. (구현 중 빌드 에러로 확인)
- **`saveResult`는 `user_id`를 명시적으로 넣음.** 컬럼 default `auth.uid()`에 기대지 않고 `requireUser()`의 id를 넣는다. 충돌 대상인 `(user_id, submission_id)`가 코드에서 바로 보이게 하려는 것이고, 계약은 변하지 않는다.
- **권한:** `revoke all ... from anon, authenticated` 다음 `grant select, insert ... to authenticated`. Supabase가 기본으로 주는 update/delete 권한까지 걷어낸다.
- **이메일 로그인/가입 추가.** `/login`에 이메일·비밀번호 폼(`EmailAuthForm`, mode `signin`)을, 새 `/signup`(공개 경로)에 가입 폼(mode `signup`)을 붙였다. OAuth 버튼은 그대로다. 서버 액션 `signInWithEmail`/`signUpWithEmail`이 `parseCredentials`(경계 파싱)와 `authErrorMessage`(Supabase 에러 코드 → 한국어 표)를 쓰고, 상태는 `EmailAuthState`(`idle | error | check-email`)다. 가입 후 세션이 있으면 `next`로 보내고, 없으면(이메일 확인이 켜진 호스팅 Supabase) `check-email` 안내를 보여 준다. 확인 링크는 기존 `/auth/callback`이 처리한다. 로컬 Supabase는 확인이 꺼져 있어 `check-email` 분기는 로컬에서 검증하지 못했다. 콜백 URL 생성은 OAuth와 가입이 하나의 헬퍼를 공유한다.

## 확인이 필요한 것

- 원본 답변을 저장할까요? 나중에 채점 방식을 바꿔 과거 결과를 다시 계산하거나 통계를 내려면 필요하다.
- 결과 히스토리를 보여줄까요, 최근 결과만 보여줄까요? 테이블은 둘 다 지원한다.
- 점수가 정확히 0이면 E/S/T/J로 정한다. 괜찮을까요?
- 결과 링크를 다른 사람과 공유할 수 있어야 할까요? 지금은 본인만 볼 수 있다.
- Apple 로그인은 Apple Developer 계정(유료)에서 Services ID와 키를 만들어 Supabase에 등록해야 한다. 계정이 준비되어 있나요?

## 다음 구현 단계

`supabase init`, 마이그레이션 작성, 그다음 `personality/results.ts`와 `questionnaire/score.ts`를 구현하고 점수 계산 테스트를 붙인다.
