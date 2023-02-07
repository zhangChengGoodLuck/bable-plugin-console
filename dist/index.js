"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isProduction = process.env.NODE_ENV === 'production';
const isArray = (args) => Object.prototype.toString.call(args) == '[object Array]';
const isFunction = (args) => Object.prototype.toString.call(args) === "[object Function]";
const hasLeadingComments = (node) => {
    const leadingComments = node.leadingComments;
    return leadingComments && leadingComments.length;
};
const hasTrailingComments = (node) => {
    const trailingComments = node.trailingComments;
    return trailingComments && trailingComments.length;
};
const isReserveComment = (node, commonWords) => {
    if (isFunction(commonWords)) {
        return commonWords(node.value);
    }
    return ['CommentLine'].includes(node.type) &&
        (isArray(commonWords) ? commonWords.includes(node.value) : /(no[t]? remove\b)|(reserve\b)/.test(node.value));
};
const visitor = {
    CallExpression(path, { opts }) {
        const callee = path.get('callee');
        const { env, exclude, commonWords } = opts;
        if (isArray(exclude) && exclude.length && (env === 'production' || isProduction)) {
            removeConsoleExpression(path, callee, exclude, commonWords);
        }
    }
};
const removeConsoleExpression = (path, callee, exclude, commentWords) => {
    //获取父级path
    const parentPath = path.parentPath;
    const parentNode = parentPath.node;
    //是否存在前缀注释
    let isLeadingReserve = false;
    //是否存在后缀注释
    let isTrailReserve = false;

    if (hasTrailingComments(parentNode)) {
        const { start: { line: currentLine } } = parentNode.loc;
        parentNode.trailingComments.forEach(comment => {
            const { start: { line: currentCommentLine } } = comment.loc;
            if (currentLine === currentCommentLine) {
              comment.belongCurrentLine = true
            }
            if (isReserveComment(comment, commentWords) && comment.belongCurrentLine) {
                isTrailReserve = true;
            }
        });
    }

    if (hasLeadingComments(parentNode)) {
      parentNode.leadingComments.forEach(comment => {
          if (isReserveComment(comment, commentWords) && !comment.belongCurrentLine) {
              isLeadingReserve = true;
            }
        });
    }

    const hasTarget = exclude.some((patter) => {
        return callee.matchesPattern('console.' + patter);
    });
    if (hasTarget || isLeadingReserve || isTrailReserve)
        return;
    path.remove();
};
exports.default = () => {
    return {
        name: '@zhangbeiyeli/babel-plugin-console',
        visitor,
    };
};
//# sourceMappingURL=index.js.map