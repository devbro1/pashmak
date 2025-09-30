{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */
    "composite": false /* Enable constraints that allow a TypeScript project to be used with project references. */,
    "target": "ESNext" /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */,
    "experimentalDecorators": true /* Enable experimental support for legacy experimental decorators. */,
    "emitDecoratorMetadata": true /* Emit design-type metadata for decorated declarations in source files. */,
    "module": "esnext" /* Specify what module code is generated. */,
    "rootDir": "./src" /* Specify the root folder within your source files. */,
    "moduleResolution": "bundler" /* Specify how TypeScript looks up a file from a given module specifier. */,
    "allowImportingTsExtensions": true,
    "allowJs": true /* Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. */,
    "emitDeclarationOnly": true /* Only output d.ts files and not JavaScript files. */,
    "declaration": true,
    "outDir": "./dist" /* Specify an output folder for all emitted files. */,
    "esModuleInterop": true /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */,
    "forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,
    "strict": true /* Enable all strict type-checking options. */,
    "skipLibCheck": true,
    "baseUrl": "./src",
    "paths": {
      "app/*": ["./app/*"],
      "@/*": ["./*"]
    }
  }
}
