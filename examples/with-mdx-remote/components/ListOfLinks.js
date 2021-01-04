import Link from 'next/link'

export function connectListOfLinks(data) {
  return function ListOfLinks({ links }) {
    return (
      <ul>
        {links.map((link) => {
          const { title, url, description } = link
          const href = url || link
          const name = title || data[link]?.data?.title || href
          const summary = description || data[link]?.data?.description || null

          return (
            <li key={href}>
              <Link href={`/${href}`}>
                <a>{name}</a>
              </Link>
              {summary && <p>{summary}</p>}
            </li>
          )
        })}
      </ul>
    )
  }
}
