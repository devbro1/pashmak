{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": false
  },
  "files": {
    "includes": ["**", "!!**/dist", "!!**/node_modules", "!!**/coverage"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off",
        "noTsIgnore": "off"
      },
      "correctness": {
        "noUnusedVariables": "off",
        "noUnusedImports": "off",
        "noUnusedFunctionParameters": "off"
      },
      "style": {
        "noCommonJs": "off",
        "useImportType": "off",
        "noNonNullAssertion": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    },
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "off"
      }
    }
  }
}
