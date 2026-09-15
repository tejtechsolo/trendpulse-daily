import { createAdminClient } from '@/lib/supabase/admin';

export async function startAutomationRun(jobName: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('automation_runs').insert({ job_name: jobName, status: 'running' }).select('id,started_at').single();
  if (error) throw error;
  return { id: data.id as string, startedAt: new Date(data.started_at).getTime() };
}

export async function finishAutomationRun(
  id: string,
  startedAt: number,
  result: { success: boolean; processed?: number; succeeded?: number; failed?: number; error?: string; metadata?: Record<string, unknown> },
) {
  const supabase = createAdminClient();
  const finishedAt = new Date();
  await supabase.from('automation_runs').update({
    status: result.success ? 'success' : 'failed',
    finished_at: finishedAt.toISOString(),
    duration_ms: Math.max(0, finishedAt.getTime() - startedAt),
    processed_count: result.processed ?? 0,
    success_count: result.succeeded ?? 0,
    failed_count: result.failed ?? 0,
    error_message: result.error ?? null,
    metadata: result.metadata ?? {},
  }).eq('id', id);
}
