# MDX Remote Example + In-Memory Caching

This attempts to bring in-memory cache to Next.js on the server for performance reasons when building static websites. **It currently doesn't work.**

In this experiment, we want to use data from pages on other pages. For example, in [`posts/example-post.mdx`][example-post], we use a component [`ListOfLinks`][list-of-links] which lets technical writers reference internal links, like this:

```jsx
<ListOfLinks links={['posts/hello-world', 'posts/example-post']} />
```

And have it rendered like this, without copy/pasting the title and description:

```html
<ul>
  <li>
    <a href="/posts/hello-world">Hello World</a>
  </li>
  <li>
    <a href="/posts/example-post">Example Post</a>
    <p>This frontmatter description will appear below the title</p>
  </li>
</ul>
```

For this to work, we need components that are aware of all the project's available pages. The [`ListOfLinks`][list-of-links] receives a hash of all MDX files in the `/posts` directory via a higher-order component.

As a result, in [pages/posts/[slug].js][posts-slug], **we have to fetch all posts twice**: once in `getStaticPaths` to fetch all possible pages under the `/posts` route, and once in `getStaticProps` to provide all pages to [`ListOfLinks`][list-of-links]. This means that if we have 100 pages, we'll do 200 filesystem calls instead of reusing the already fetched pages.

> Note that switching the `withData` helper implementation for more procedural code wouldn't change anything, as [Next.js processes `getStaticPaths` and `getStaticProps` in two different workers][github:nextjs:10933:598297975], thus re-importing and re-executing the whole script each time.

We ran some benchmarks and ended up with significant differences.

## Benchmark

### Methodology

We duplicated the [`posts/example-post.mdx`][example-post] file to simulate a project with a growing number of pages. We ran a build on `master` (Vercel code, no double fetching) and `feat/in-memory-sitemap` (our code, double fetching) for each set of pages (4, 100, 1000, and 5000).

The script used to duplicate pages is the following:

```sh
# change `100` for the desired number of pages
for i in {1..100}; do cp example-post.mdx "example-post$i.mdx"; done
```

Then, we run `yarn build`.

### Results

#### On `master`

- 4 pages: 9.07s
- ~100 pages: 10.00s
- ~1000 pages: 34.43s
- ~5000 pages: 133.26s (~2m)

#### On `feat/in-memory-sitemap`

- 4 pages: 12.68s
- ~100 pages: 9.59s
- ~1000 pages: 60.73s
- ~5000 pages: 539.88s (~9m)

> Test run on a MacBook Pro 2017 model
> 3.1 GHz Intel Core i5 dual-core processor
> 16 GB of RAM

Unsurprisingly, fetching from the filesystem twice results in significant slowdowns. It can be a concern for scaling to thousands of pages.

## Contemplated solution

This fork's initial goal was to explore how we could add in-memory caching to Next.js **so that we'd fetch each page only once and serve them from the cache after that.** The idea would be to build the entire cache when starting the server, keep it up to date using some watcher ([chokidar][chokidar] or similar) when changing the source files, and only read the from the cache in pages. This approach (instead of building the cache incrementally) would work better with Next's parallel build process without introducing the need for locks.

> Note that this solution is different from caching in some in-memory store like Redis since it would still require network calls.

Unfortunately, right now, it doesn't seem possible. [Next.js processes `getStaticPaths` and `getStaticProps` in two different workers][github:nextjs:10933:598297975], so we can't get them to share code. As far as I know, there's no API to "hook" into the `build` process to execute code to share across all threads. From the look of it, Next.js is designed to have a stateless build process (at least, from a consumer's perspective), which makes in-memory caching between pages impossible.

[list-of-links]: https://github.com/sarahdayan/next.js/blob/feat/in-memory-sitemap/examples/with-mdx-remote/components/ListOfLinks.js
[posts-slug]: https://github.com/sarahdayan/next.js/blob/feat/in-memory-sitemap/examples/with-mdx-remote/pages/posts/%5Bslug%5D.js
[example-post]: https://github.com/sarahdayan/next.js/blob/feat/in-memory-sitemap/examples/with-mdx-remote/posts/example-post.mdx
[chokidar]: https://github.com/paulmillr/chokidar
[github:nextjs:10933:598297975]: https://github.com/vercel/next.js/issues/10933#issuecomment-598297975
