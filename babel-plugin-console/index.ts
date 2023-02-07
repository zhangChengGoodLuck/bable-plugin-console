import { NodePath } from '@babel/traverse'

const isProduction = process.env.NODE_ENV === 'production'

const isArray = (args: any) => Object.prototype.toString.call(args) == '[object Array]'
const isFunction = (args: any) => Object.prototype.toString.call(args) === "[object Function]";

const hasLeadingComments = (node) => {  //判断是否存在前缀注释
  const leadingComments = node.leadingComments
  return leadingComments && leadingComments.length
}

const hasTrailingComments = (node) => {  //判断是否存在后缀注释
  const trailingComments = node.trailingComments
  return trailingComments && trailingComments.length
}

const isReserveComment = (node, commonWords) => {
  if (isFunction(commonWords)) {
    return commonWords(node.value)
  }
  return ['CommentLine'].includes(node.type) &&
    (isArray(commonWords) ? commonWords.includes(node.value) : /(no[t]? remove\b)|(reserve\b)/.test(node.value))
}

const visitor = {
  CallExpression(path: NodePath, { opts }) {
    const callee = path.get('callee')

    const { env, exclude, commonWords } = opts
    if (isArray(exclude) && exclude.length && (env === 'production' || isProduction)) {
      removeConsoleExpression(path, callee, exclude, commonWords)
    }
  }
}

const removeConsoleExpression = (path: NodePath, callee, exclude: Array<string>, commentWords) => {

  //获取父级path
  const parentPath = path.parentPath
  const parentNode = parentPath.node

  //是否存在前缀注释
  let isLeadingReserve = false
  //是否存在后缀注释
  let isTrailReserve = false

  if (hasLeadingComments(parentNode)) {
    parentNode.leadingComments.forEach(comment => {
      if (isReserveComment(comment, commentWords)) {
        isLeadingReserve = true
      }
    })
  }

  if (hasTrailingComments(parentNode)) {
    const { start: { line: currentLine } } = parentNode.loc
    parentNode.trailingComments.forEach(comment => {
      const { start: { line: currentCommentLine } } = comment.loc
      if (isReserveComment(comment, commentWords) && (currentLine === currentCommentLine)) {
        isTrailReserve = true
      }
    })
  }

  const hasTarget = exclude.some((patter) => {
    return callee.matchesPattern('console.' + patter)
  })

  if (hasTarget || isLeadingReserve || isTrailReserve) return
  isArray(path.node.arguments) && path.node.arguments.forEach(item => console.log(item.value))

  path.remove()
}

export default () => {
  return {
    name: '@zhanglibeiye/babel-plugin-console',
    visitor,
  }
} 