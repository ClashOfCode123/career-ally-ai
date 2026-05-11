import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = util.promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'temp');
fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {});

export const executeCode = async (code, language, testCases, timeLimitMs = 2000) => {
  const jobId = uuidv4();
  const jobPath = path.join(TEMP_DIR, jobId);
  
  try {
    await fs.mkdir(jobPath, { recursive: true });

    const config = {
      python: {
        ext: 'py',
        image: 'python:3.10-slim',
        runCmd: 'python solution.py'
      },
      javascript: {
        ext: 'js',
        image: 'node:18-slim',
        runCmd: 'node solution.js'
      },
      cpp: {
        ext: 'cpp',
        image: 'gcc:latest',
        compileCmd: 'g++ solution.cpp -o solution',
        runCmd: './solution'
      }
    };

    const { ext, image, compileCmd, runCmd } = config[language];
    const codeFilePath = path.join(jobPath, `solution.${ext}`);

    await fs.writeFile(codeFilePath, code);

    const mountPath = jobPath.replace(/\\/g, '/');
    let totalExecutionTime = 0;

    if (compileCmd) {
      const compileDockerCmd = `docker run --rm -v "${mountPath}:/app" -w /app ${image} ${compileCmd}`;
      try {
        await execPromise(compileDockerCmd, { timeout: 10000 });
      } catch (err) {
        return {
          status: "Compilation Error",
          outputLogs: err.stderr || err.message,
          executionTimeMs: 0,
          memoryUsedKb: 0
        };
      }
    }

    const timeLimitSeconds = Math.ceil(timeLimitMs / 1000);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const inputFilePath = path.join(jobPath, `input.txt`);
      
      await fs.writeFile(inputFilePath, tc.input);

      //Memory restriction
      const runDockerCmd = `docker run --rm --network none --memory 256m -v "${mountPath}:/app" -w /app ${image} sh -c "timeout ${timeLimitSeconds} ${runCmd} < input.txt"`;
      
      const startTime = Date.now();

      try {
        const { stdout, stderr } = await execPromise(runDockerCmd, { timeout: 10000 });
        const executionTime = Date.now() - startTime;
        totalExecutionTime += executionTime;

        if (stderr) {
          return {
            status: "Runtime Error",
            outputLogs: stderr.trim(),
            executionTimeMs: totalExecutionTime,
            memoryUsedKb: 2048 // Base memory for failing runs
          };
        }

        const actualOutput = stdout.trim();
        const expectedOutput = tc.expectedOutput.trim();

        if (actualOutput !== expectedOutput) {
          return {
            status: "Wrong Answer",
            outputLogs: `Test Case ${i + 1} Failed.\nInput: ${tc.input}\nExpected: ${expectedOutput}\nActual: ${actualOutput}`,
            executionTimeMs: totalExecutionTime,
            memoryUsedKb: 2048
          };
        }

      } catch (err) {
        
        //MLE
        if (err.code === 137) {
          return {
            status: "Memory Limit Exceeded",
            outputLogs: "Code exceeded the 256MB memory limit.",
            executionTimeMs: totalExecutionTime,
            memoryUsedKb: 262144 
          };
        }

   
        if (err.code === 124 || err.killed) {
          return {
            status: "Time Limit Exceeded",
            outputLogs: `Code exceeded the ${timeLimitMs}ms limit.`,
            executionTimeMs: timeLimitMs,
            memoryUsedKb: 2048
          };
        }
        
        
        return {
          status: "Runtime Error",
          outputLogs: err.stderr || err.message,
          executionTimeMs: totalExecutionTime,
          memoryUsedKb: 2048
        };
      }
    }

    return {
      status: "Accepted",
      outputLogs: "All test cases passed locally! 🚀",
      executionTimeMs: totalExecutionTime,
      memoryUsedKb: 2048
    };

  } finally {
    await fs.rm(jobPath, { recursive: true, force: true }).catch(() => {});
  }
};