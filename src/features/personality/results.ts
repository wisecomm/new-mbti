import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth";
import type { Estimate, MbtiResult, MbtiType, Method } from "./model";

// Sole owner of the mbti_results table. Every function authenticates itself,
// so no caller can reach result data without a session.

const COLUMNS = "id, method, method_version, ei, sn, tf, jp, type, created_at";

type Row = {
  id: string;
  method: string;
  method_version: string;
  ei: number;
  sn: number;
  tf: number;
  jp: number;
  type: string;
  created_at: string;
};

/** Idempotent per submission: saving the same submissionId twice returns the first row. */
export async function saveResult(submissionId: string, estimate: Estimate): Promise<MbtiResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("mbti_results").upsert(
    {
      user_id: user.id,
      submission_id: submissionId,
      method: estimate.method,
      method_version: estimate.methodVersion,
      ...estimate.scores,
    },
    { onConflict: "user_id,submission_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(`saveResult failed: ${error.message}`);

  const { data, error: readError } = await supabase
    .from("mbti_results")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .eq("submission_id", submissionId)
    .single<Row>();
  if (readError) throw new Error(`saveResult read-back failed: ${readError.message}`);
  return parseRow(data);
}

/** Null when the id is unknown, malformed, or belongs to someone else (RLS hides it). */
export async function getResult(id: string): Promise<MbtiResult | null> {
  await requireUser();
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mbti_results")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw new Error(`getResult failed: ${error.message}`);
  return data ? parseRow(data) : null;
}

export async function getLatestResult(): Promise<MbtiResult | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mbti_results")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Row>();
  if (error) throw new Error(`getLatestResult failed: ${error.message}`);
  return data ? parseRow(data) : null;
}

/** The caller's results, newest first. */
export async function listResults(): Promise<MbtiResult[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mbti_results")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw new Error(`listResults failed: ${error.message}`);
  return data.map(parseRow);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MBTI_TYPE = /^[EI][SN][TF][JP]$/;
const METHODS: readonly Method[] = ["questionnaire"];

function parseRow(row: Row): MbtiResult {
  if (!MBTI_TYPE.test(row.type)) throw new Error(`Unexpected MBTI type from DB: ${row.type}`);
  if (!METHODS.includes(row.method as Method)) throw new Error(`Unexpected method from DB: ${row.method}`);
  return {
    id: row.id,
    method: row.method as Method,
    methodVersion: row.method_version,
    scores: { ei: row.ei, sn: row.sn, tf: row.tf, jp: row.jp },
    type: row.type as MbtiType,
    createdAt: new Date(row.created_at),
  };
}
