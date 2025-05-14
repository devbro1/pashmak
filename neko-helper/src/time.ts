//exports a wait method for X milliseconds
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
