export type JsonRecord = Record<string, unknown>;

export function jsonOk(data: JsonRecord, status = 200): Response {
  return Response.json(data, { status });
}

export function jsonError(message: string, status = 500): Response {
  return Response.json({ status, message }, { status });
}
