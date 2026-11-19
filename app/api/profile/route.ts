import { FeedError, loadPublicProfile, profileName } from '@/lib/rss';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = {'Cache-Control': 'no-store'};
  try {
    const name = profileName(new URL(request.url).searchParams.get('username'));
    return Response.json(await loadPublicProfile(name), {headers});
  } catch (error) {
    if (error instanceof FeedError) {
      return Response.json({error:error.message, code:error.code}, {status:error.status, headers});
    }
    return Response.json({error:'Le journal est temporairement indisponible.', code:'network'}, {status:502, headers});
  }
}
