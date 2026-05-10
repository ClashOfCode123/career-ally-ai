/**
 * TO BE IMPLEMENTED DOCKER ENGINE
 */
export const executeCode = async (code, language, testCases, timeLimit) => {
  //  replace this with Docker logic
  // For testing, we return a mock success after 2 seconds
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "Accepted",
        executionTimeMs: Math.floor(Math.random() * 200),
        memoryUsedKb: 2048,
        outputLogs: "All test cases passed locally."
      });
    }, 2000);
  });
};