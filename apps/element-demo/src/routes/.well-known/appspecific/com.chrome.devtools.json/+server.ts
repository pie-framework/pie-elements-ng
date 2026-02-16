import { json } from '@sveltejs/kit';

export async function GET() {
  return json({
    version: 1,
    app_info: {
      name: 'PIE Element Demo',
      framework: 'SvelteKit',
    },
  });
}
