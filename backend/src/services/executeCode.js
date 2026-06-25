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
      python: { ext: 'py', image: 'python:3.10-slim', runCmd: 'python solution.py' },
      javascript: { ext: 'js', image: 'node:18-slim', runCmd: 'node solution.js' },
      cpp: { ext: 'cpp', image: 'gcc:latest', compileCmd: 'g++ solution.cpp -o /tmp/solution', runCmd: '/tmp/solution' }
    };

    const { ext, image, compileCmd, runCmd } = config[language];
    
    await fs.writeFile(path.join(jobPath, `solution.${ext}`), code);

    const mountPath = path.resolve(jobPath).replace(/\\/g, '/');

    for (let i = 0; i < testCases.length; i++) {
      const cleanInput = testCases[i].input.replace(/\r/g, '');
      await fs.writeFile(path.join(jobPath, `in_${i}.txt`), cleanInput);
    }

    const timeLimitSeconds = Math.max(1, Math.ceil(timeLimitMs / 1000));
    
    let sh = `#!/bin/sh\n`;
    
    if (compileCmd) {
      sh += `${compileCmd} > comp_out.txt 2> comp_err.txt\n`;
      sh += `comp_status=$?\n`;
      sh += `echo $comp_status > comp_status.txt\n`;
      sh += `if [ $comp_status -ne 0 ]; then exit 2; fi\n`;
    }
    
    for (let i = 0; i < testCases.length; i++) {
      sh += `start=$(date +%s%3N)\n`;
      sh += `timeout ${timeLimitSeconds} ${runCmd} < in_${i}.txt > out_${i}.txt 2> err_${i}.txt\n`;
      sh += `exit_code=$?\n`;
      sh += `end=$(date +%s%3N)\n`;
      sh += `echo $((end-start)) > time_${i}.txt\n`;
      sh += `echo $exit_code > code_${i}.txt\n`;
    }
    
    await fs.writeFile(path.join(jobPath, 'run.sh'), sh);

    const dockerCmd = `docker run --rm --network none --memory 256m -v "${mountPath}:/app" -w /app ${image} sh run.sh`;
    
    try {
      await execPromise(dockerCmd, { timeout: 20000 });
    } catch (err) {}

    if (compileCmd) {
      try {
        const compStatus = await fs.readFile(path.join(jobPath, 'comp_status.txt'), 'utf-8');
        if (parseInt(compStatus.trim()) !== 0) {
          const compErr = await fs.readFile(path.join(jobPath, 'comp_err.txt'), 'utf-8');
          return { status: "Compilation Error", outputLogs: compErr.trim(), executionTimeMs: 0, memoryUsedKb: 0 };
        }
      } catch (e) {
        return { status: "Compilation Error", outputLogs: "Docker engine failed to mount or initialize.", executionTimeMs: 0, memoryUsedKb: 0 };
      }
    }

    let totalExecutionTime = 0;

    for (let i = 0; i < testCases.length; i++) {
      let exitCodeStr = "1", outStr = "", errStr = "", timeStr = "0";
      
      try {
        exitCodeStr = await fs.readFile(path.join(jobPath, `code_${i}.txt`), 'utf-8');
        outStr = await fs.readFile(path.join(jobPath, `out_${i}.txt`), 'utf-8');
        errStr = await fs.readFile(path.join(jobPath, `err_${i}.txt`), 'utf-8');
        timeStr = await fs.readFile(path.join(jobPath, `time_${i}.txt`), 'utf-8');
      } catch (e) {
        return { status: "Runtime Error", outputLogs: "Process crashed unexpectedly.", executionTimeMs: totalExecutionTime, memoryUsedKb: 0 };
      }

      const exitCode = parseInt(exitCodeStr.trim());
      const execTime = parseInt(timeStr.trim()) || 0;
      totalExecutionTime += execTime;

      if (exitCode === 124 || execTime > timeLimitMs) {
        return { status: "Time Limit Exceeded", outputLogs: `Execution took ${execTime}ms, exceeding the ${timeLimitMs}ms limit.`, executionTimeMs: timeLimitMs, memoryUsedKb: 2048 };
      }

      if (exitCode === 137) {
        return { status: "Memory Limit Exceeded", outputLogs: "Code exceeded the 256MB memory limit.", executionTimeMs: totalExecutionTime, memoryUsedKb: 262144 };
      }

      if (exitCode !== 0 || errStr.trim() !== "") {
        return { status: "Runtime Error", outputLogs: errStr.trim() || `Process exited with code ${exitCode}`, executionTimeMs: totalExecutionTime, memoryUsedKb: 2048 };
      }

      const actualOutput = outStr.trim().replace(/\r\n/g, '\n');
      const expectedOutput = testCases[i].expectedOutput.trim().replace(/\r\n/g, '\n');

      if (actualOutput !== expectedOutput) {
        return { 
          status: "Wrong Answer", 
          outputLogs: `Test Case ${i + 1} Failed.\n\nInput:\n${testCases[i].input}\n\nExpected:\n${expectedOutput}\n\nActual:\n${actualOutput}`, 
          executionTimeMs: totalExecutionTime, 
          memoryUsedKb: 2048 
        };
      }
    }

    return {
      status: "Accepted",
      outputLogs: `All test cases passed! 🚀`,
      executionTimeMs: totalExecutionTime,
      memoryUsedKb: 2048
    };

  } finally {
    await fs.rm(jobPath, { recursive: true, force: true }).catch(() => {});
  }
};