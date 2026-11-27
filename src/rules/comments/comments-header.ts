import { defineRule } from '@oxlint/plugins'
import { optionsFirst, optionsGlob, optionsMessage, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CommentsHeaderOptions } from '../../types/comments.types.ts'

export const commentsHeader = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          comment: { type: 'string', minLength: 1 },
          imports: optionsPatternSchema,
          files: optionsPatternSchema,
          message: { type: 'string' },
        },
        required: ['comment'],
      },
    ],
    messages: {
      missing: "Start the file with a comment that matches '{{pattern}}'.{{message}}",
      misplaced: 'Move this comment to line 1; the header comes before anything else.{{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<CommentsHeaderOptions>(context)
        const filename = context.filename.replaceAll('\\', '/')
        const files = [options.files ?? []].flat()

        if (files.length > 0 && !files.some((glob) => optionsGlob(glob.startsWith('/') ? glob : `**/${glob}`).test(filename))) {
          return
        }

        const imports = optionsPatterns(options.imports)

        const sources = program.body.flatMap((statement) =>
          (statement.type === 'ImportDeclaration' || statement.type === 'ExportAllDeclaration' || statement.type === 'ExportNamedDeclaration') && statement.source
            ? [statement.source.value]
            : [],
        )

        if (imports.length > 0 && !sources.some((source) => optionsPatternsTest(imports, source))) {
          return
        }

        const pattern = new RegExp(options.comment)
        const message = optionsMessage(options.message)
        const { sourceCode } = context
        const header = sourceCode.getAllComments().find((comment) => optionsPatternsTest([pattern], sourceCode.getText(comment)))

        if (!header) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'missing',
            data: { pattern: options.comment, message },
          })
        } else if (header.range[0] !== 0) {
          context.report({
            node: header,
            messageId: 'misplaced',
            data: { message },
          })
        }
      },
    }
  },
})
