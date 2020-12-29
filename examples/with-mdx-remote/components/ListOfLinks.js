import Link from 'next/link'

export function connectListOfLinks(data) {
  return function ListOfLinks({ links }) {
    return (
      <ul>
        {links.map((link) => {
          const { title, url } = link
          const href = url || link
          const name = title || data[link]?.data?.title || href

          return (
            <li key={href}>
              <Link href={`/${href}`}>
                <a>{name}</a>
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }
}
