// Domain types for an MBTI result, independent of how it was estimated.

export type MbtiType = `${"E" | "I"}${"S" | "N"}${"T" | "F"}${"J" | "P"}`;

export const AXES = ["ei", "sn", "tf", "jp"] as const;
export type Axis = (typeof AXES)[number];

/** First letter is the pole a positive score leans to. */
export const AXIS_POLES: Record<Axis, readonly [string, string]> = {
  ei: ["E", "I"],
  sn: ["S", "N"],
  tf: ["T", "F"],
  jp: ["J", "P"],
};

/** Integer in [-100, 100]; positive leans to the axis's first letter. The DB checks the range. */
export type AxisScores = Record<Axis, number>;

/** Adding the face method means adding a member here and to the SQL check. */
export type Method = "questionnaire";

export type Estimate = { method: Method; methodVersion: string; scores: AxisScores };

/** A saved estimate. `type` is derived by the database (generated column), never computed in TS. */
export type MbtiResult = Estimate & { id: string; type: MbtiType; createdAt: Date };
