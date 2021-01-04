import fs from 'fs'
import matter from 'gray-matter'
import glob from 'glob'

function getFilePathsFromSlug(globList) {
  const files = globList.flatMap((path) => glob.sync(path))

  return files
}

function getDataFromFilePath(filePath) {
  const source = fs.readFileSync(filePath)
  const { content, data } = matter(source)

  return { content, data }
}

export function withData(getProps, globs) {
  const filePaths = getFilePathsFromSlug(globs)
  const data = filePaths.reduce((acc, filePath) => {
    const [route] = filePath.split('.')

    return {
      ...acc,
      [route]: getDataFromFilePath(filePath),
    }
  }, {})

  return (props) => getProps({ data })(props)
}
