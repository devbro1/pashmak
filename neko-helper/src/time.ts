//exports a wait method for X milliseconds
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
