// Code editor service for syntax highlighting and language detection
export interface EditorFile {
  id: string
  name: string
  content: string
  language: string
  isDirty: boolean
  path: string
}

export interface EditorState {
  openFiles: EditorFile[]
  activeFileId: string | null
  theme: "light" | "dark"
}

export class CodeEditorService {
  private static instance: CodeEditorService

  static getInstance(): CodeEditorService {
    if (!CodeEditorService.instance) {
      CodeEditorService.instance = new CodeEditorService()
    }
    return CodeEditorService.instance
  }

  detectLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()

    switch (ext) {
      case "js":
      case "jsx":
        return "javascript"
      case "ts":
      case "tsx":
        return "typescript"
      case "py":
        return "python"
      case "java":
        return "java"
      case "cpp":
      case "cc":
      case "cxx":
        return "cpp"
      case "c":
        return "c"
      case "cs":
        return "csharp"
      case "php":
        return "php"
      case "rb":
        return "ruby"
      case "go":
        return "go"
      case "rs":
        return "rust"
      case "html":
        return "html"
      case "css":
        return "css"
      case "scss":
      case "sass":
        return "scss"
      case "json":
        return "json"
      case "xml":
        return "xml"
      case "yaml":
      case "yml":
        return "yaml"
      case "md":
        return "markdown"
      case "sql":
        return "sql"
      case "sh":
      case "bash":
        return "bash"
      case "dockerfile":
        return "dockerfile"
      default:
        return "plaintext"
    }
  }

  getLanguageIcon(language: string): string {
    switch (language) {
      case "javascript":
        return "🟨"
      case "typescript":
        return "🔷"
      case "python":
        return "🐍"
      case "java":
        return "☕"
      case "cpp":
      case "c":
        return "⚙️"
      case "csharp":
        return "🔵"
      case "php":
        return "🐘"
      case "ruby":
        return "💎"
      case "go":
        return "🐹"
      case "rust":
        return "🦀"
      case "html":
        return "🌐"
      case "css":
      case "scss":
        return "🎨"
      case "json":
        return "📋"
      case "markdown":
        return "📝"
      case "sql":
        return "🗃️"
      case "bash":
        return "💻"
      default:
        return "📄"
    }
  }

  // Basic syntax highlighting patterns
  getSyntaxHighlightRules(language: string) {
    const rules = {
      javascript: [
        {
          pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default)\b/g,
          className: "keyword",
        },
        { pattern: /\b(true|false|null|undefined)\b/g, className: "boolean" },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "number" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "string" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "string" },
        { pattern: /`([^`\\]|\\.)*`/g, className: "string" },
        { pattern: /\/\/.*$/gm, className: "comment" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "comment" },
      ],
      typescript: [
        {
          pattern:
            /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|interface|type|enum)\b/g,
          className: "keyword",
        },
        { pattern: /\b(string|number|boolean|any|void|never|unknown)\b/g, className: "type" },
        { pattern: /\b(true|false|null|undefined)\b/g, className: "boolean" },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "number" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "string" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "string" },
        { pattern: /`([^`\\]|\\.)*`/g, className: "string" },
        { pattern: /\/\/.*$/gm, className: "comment" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "comment" },
      ],
      python: [
        {
          pattern:
            /\b(def|class|if|elif|else|for|while|import|from|return|try|except|finally|with|as|pass|break|continue)\b/g,
          className: "keyword",
        },
        { pattern: /\b(True|False|None)\b/g, className: "boolean" },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "number" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "string" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "string" },
        { pattern: /#.*$/gm, className: "comment" },
      ],
      sql: [
        {
          pattern:
            /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|INDEX|ALTER|DROP|JOIN|INNER|LEFT|RIGHT|ON|GROUP|BY|ORDER|HAVING|UNION|ALL|DISTINCT)\b/gi,
          className: "keyword",
        },
        {
          pattern: /\b(VARCHAR|INT|INTEGER|BIGINT|DECIMAL|FLOAT|DOUBLE|BOOLEAN|DATE|DATETIME|TIMESTAMP|TEXT|BLOB)\b/gi,
          className: "type",
        },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "number" },
        { pattern: /'([^'\\]|\\.)*'/g, className: "string" },
        { pattern: /--.*$/gm, className: "comment" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "comment" },
      ],
      json: [
        { pattern: /"([^"\\]|\\.)*"(?=\s*:)/g, className: "property" },
        { pattern: /"([^"\\]|\\.)*"/g, className: "string" },
        { pattern: /\b(true|false|null)\b/g, className: "boolean" },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "number" },
      ],
    }

    return rules[language as keyof typeof rules] || []
  }

  highlightSyntax(code: string, language: string): string {
    const rules = this.getSyntaxHighlightRules(language)
    let highlightedCode = code

    // Apply syntax highlighting rules
    rules.forEach((rule) => {
      highlightedCode = highlightedCode.replace(rule.pattern, (match) => {
        return `<span class="syntax-${rule.className}">${match}</span>`
      })
    })

    return highlightedCode
  }

  formatCode(code: string, language: string): string {
    // Basic code formatting - in a real implementation, use a proper formatter
    let formatted = code

    if (language === "json") {
      try {
        const parsed = JSON.parse(code)
        formatted = JSON.stringify(parsed, null, 2)
      } catch (e) {
        // If parsing fails, return original
      }
    }

    return formatted
  }
}
