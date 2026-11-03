import type { Axis } from "@/features/personality";

/** Bump when questions or scoring change; stored as method_version on each result. */
export const QUESTIONNAIRE_VERSION = "v1";

/** pole: +1 if agreeing leans to the axis's first letter (E/S/T/J), -1 otherwise. */
export type Question = { id: string; axis: Axis; pole: 1 | -1; text: string };

export const QUESTIONS: readonly Question[] = [
  { id: "ei-1", axis: "ei", pole: 1, text: "사람들과 어울리고 나면 에너지가 충전된다." },
  { id: "ei-2", axis: "ei", pole: -1, text: "혼자 보내는 시간이 있어야 마음이 편하다." },
  { id: "ei-3", axis: "ei", pole: 1, text: "처음 만난 사람에게도 먼저 말을 거는 편이다." },
  { id: "ei-4", axis: "ei", pole: -1, text: "말하기 전에 생각을 충분히 정리하는 편이다." },
  { id: "ei-5", axis: "ei", pole: 1, text: "주말에는 집보다 밖에서 사람을 만나고 싶다." },

  { id: "sn-1", axis: "sn", pole: 1, text: "막연한 가능성보다 지금 확인된 사실이 더 중요하다." },
  { id: "sn-2", axis: "sn", pole: -1, text: "엉뚱한 상상이나 미래 시나리오를 떠올리는 게 즐겁다." },
  { id: "sn-3", axis: "sn", pole: 1, text: "설명서를 보며 순서대로 따라 하는 게 편하다." },
  { id: "sn-4", axis: "sn", pole: -1, text: "세부 내용보다 전체적인 그림과 의미에 먼저 눈이 간다." },
  { id: "sn-5", axis: "sn", pole: 1, text: "경험해 본 검증된 방법을 선호한다." },

  { id: "tf-1", axis: "tf", pole: 1, text: "결정할 때는 감정보다 논리와 근거가 우선이다." },
  { id: "tf-2", axis: "tf", pole: -1, text: "친구가 고민을 말하면 해결책보다 공감이 먼저다." },
  { id: "tf-3", axis: "tf", pole: 1, text: "불편하더라도 사실은 솔직하게 말하는 게 낫다." },
  { id: "tf-4", axis: "tf", pole: -1, text: "내 결정이 다른 사람의 기분에 어떤 영향을 줄지 많이 신경 쓴다." },
  { id: "tf-5", axis: "tf", pole: 1, text: "토론에서 이기는 것보다 옳은 결론이 중요하다." },

  { id: "jp-1", axis: "jp", pole: 1, text: "여행 가기 전에 일정을 미리 꼼꼼히 짜 둔다." },
  { id: "jp-2", axis: "jp", pole: -1, text: "계획이 바뀌어도 크게 스트레스받지 않는다." },
  { id: "jp-3", axis: "jp", pole: 1, text: "할 일은 마감보다 여유 있게 끝내 두는 편이다." },
  { id: "jp-4", axis: "jp", pole: -1, text: "그때그때 끌리는 대로 하는 게 더 재미있다." },
  { id: "jp-5", axis: "jp", pole: 1, text: "책상이나 방이 정리되어 있어야 집중이 잘 된다." },
];

export const ANSWER_LABELS = ["전혀 아니다", "아니다", "보통", "그렇다", "매우 그렇다"] as const;

/** Likert 1..5, 3 = neutral. */
export type Answer = 1 | 2 | 3 | 4 | 5;
export type Answers = Record<Question["id"], Answer>;
