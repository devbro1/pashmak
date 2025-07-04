module.exports = {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: ['.ts'],
  globals: {},
  transform: {
    "^.+\\.(ts|tsx)?$": ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.json' }],
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/src/$1',
  },
   testMatch: [
     "**/?(*.)+(spec).ts"
  ]
};
