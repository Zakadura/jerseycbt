import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  // Match the page templates: drafts have no page, so listing them in the
  // feed would advertise a URL that 404s.
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const sorted = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'jerseycbt — Articles',
    description: 'Notes on CBT, CAT, and the things that get in the way.',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/articles/${post.slug}/`,
    })),
  });
}
