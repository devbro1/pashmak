module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/src/$1',
  },
   testMatch: [
     "**/?(*.)+(spec).ts"
  ]
};
