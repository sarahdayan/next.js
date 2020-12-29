import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import { cache } from './cache'

function getFilePathsFromSlug(slug) {
  if (!cache.get(slug)) {
    const filePath = path.join(process.cwd(), slug)
    const allPaths = fs
      .readdirSync(filePath)
      .filter((fileName) => /\.mdx?$/.test(fileName))
      .map((fileName) => path.join(slug, fileName))

    cache.set(slug, allPaths)
  }

  return cache.get(slug)
}

function getDataFromFilePath(filePath) {
  if (!cache.get(filePath)) {
    const source = fs.readFileSync(filePath)
    const { content, data } = matter(source)

    cache.set(filePath, { content, data })
  }

  return cache.get(filePath)
}

export function withData(getProps, slugs) {
  const filePaths = slugs.flatMap((slug) => getFilePathsFromSlug(slug))
  const data = filePaths.reduce((acc, filePath) => {
    const [route] = filePath.split('.')

    return {
      ...acc,
      [route]: getDataFromFilePath(filePath),
    }
  }, {})

  return (props) => getProps({ data })(props)
}
