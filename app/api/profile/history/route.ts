import { historyPage } from '@/lib/letterboxd-pages';
import { FeedError } from '@/lib/rss';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = {'Cache-Control': 'private, no-store'};
  try {
    const result = await historyPage(new URL(request.url).searchParams, request.signal);
    return Response.json(result, {headers});
  } catch (error) {
    if (error instanceof FeedError) {
      return Response.json({error: error.message, code: error.code}, {status: error.status, headers});
    }
    return Response.json({error: 'L’historique public est temporairement indisponible.', code: 'network'}, {status: 502, headers});
  }
}
