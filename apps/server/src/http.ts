import type { Context } from 'hono';
import type { z, ZodTypeAny } from 'zod';

type ParseResult<S extends ZodTypeAny> =
  | { ok: true; data: z.infer<S> }
  | { ok: false; res: Response };

/** Validate a JSON request body against a Zod schema; 400 with issues on fail. */
export async function parseBody<S extends ZodTypeAny>(c: Context, schema: S): Promise<ParseResult<S>> {
  let raw: unknown = {};
  try {
    raw = await c.req.json();
  } catch {
    raw = {};
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      res: c.json({ error: 'ValidationError', issues: result.error.flatten() }, 400),
    };
  }
  return { ok: true, data: result.data };
}

export const notFound = (c: Context) => c.json({ error: 'NotFound' }, 404);
