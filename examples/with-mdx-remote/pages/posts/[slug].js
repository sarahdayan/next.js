import path from 'path'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'

import CustomLink from '../../components/CustomLink'
import Layout from '../../components/Layout'
import { connectListOfLinks } from '../../components/ListOfLinks'
import { withData } from '../../utils/withData'

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: CustomLink,
  // It also works with dynamically-imported components, which is especially
  // useful for conditionally loading components for certain routes.
  // See the notes in README.md for more details.
  TestComponent: dynamic(() => import('../../components/TestComponent')),
  Head,
}

export default function PostPage({ source, frontMatter, allPosts }) {
  const ListOfLinks = connectListOfLinks(allPosts)
  const content = hydrate(source, {
    components: { ...components, ListOfLinks },
  })

  return (
    <Layout>
      <header>
        <nav>
          <Link href="/">
            <a>👈 Go back home</a>
          </Link>
        </nav>
      </header>
      <div className="post-header">
        <h1>{frontMatter.title}</h1>
        {frontMatter.description && (
          <p className="description">{frontMatter.description}</p>
        )}
      </div>
      <main>{content}</main>

      <style jsx>{`
        .post-header h1 {
          margin-bottom: 0;
        }

        .post-header {
          margin-bottom: 2rem;
        }
        .description {
          opacity: 0.6;
        }
      `}</style>
    </Layout>
  )
}

const postsSlug = 'posts'

export const getStaticProps = withData(
  ({ data: allPosts }) => async ({ params }) => {
    const ListOfLinks = connectListOfLinks(allPosts)
    const currentPath = path.join(postsSlug, params.slug)
    const { content, data } = allPosts[currentPath]

    const mdxSource = await renderToString(content, {
      components: { ...components, ListOfLinks },
      // Optionally pass remark/rehype plugins
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
      scope: data,
    })

    return {
      props: {
        allPosts,
        source: mdxSource,
        frontMatter: data,
      },
    }
  },
  [postsSlug]
)

export const getStaticPaths = withData(
  ({ data }) => async () => {
    const paths = Object.keys(data).map((slug) => ({
      params: { slug: slug.split('/').pop() },
    }))

    return {
      paths,
      fallback: false,
    }
  },
  [postsSlug]
)
