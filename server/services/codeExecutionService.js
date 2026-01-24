// services/codeExecutionService.js
const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class CodeExecutionService {
  constructor() {
    this.tempDir = path.join(__dirname, "../temp/executions");
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error("Error creating temp directory:", error);
    }
  }

  async executeCode(code, language, testCases, timeoutSeconds = 30) {
    const sessionId = crypto.randomUUID();
    const sessionDir = path.join(this.tempDir, sessionId);

    try {
      await fs.mkdir(sessionDir, { recursive: true });

      const results = {
        testCaseResults: [],
        totalTestCases: testCases.length,
        passedTestCases: 0,
        executionTime: 0,
        memoryUsage: 0,
        compilationError: null,
        runtimeError: null,
      };

      // Write code to file
      const { fileName, compiledFileName } = this.getFileNames(
        language,
        sessionDir
      );
      await fs.writeFile(fileName, code, "utf8");

      // Compile if needed
      const compileResult = await this.compileCode(
        language,
        fileName,
        compiledFileName,
        timeoutSeconds
      );
      if (!compileResult.success) {
        results.compilationError = compileResult.error;
        return results;
      }

      // Execute test cases
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await this.runTestCase(
          language,
          compiledFileName || fileName,
          testCase.input,
          testCase.expectedOutput,
          timeoutSeconds
        );

        result.testCaseId = testCase._id || i;
        results.testCaseResults.push(result);

        if (result.passed) {
          results.passedTestCases++;
        }

        results.executionTime += result.executionTime || 0;
        results.memoryUsage = Math.max(
          results.memoryUsage,
          result.memoryUsed || 0
        );
      }

      return results;
    } catch (error) {
      return {
        testCaseResults: [],
        totalTestCases: testCases.length,
        passedTestCases: 0,
        executionTime: 0,
        memoryUsage: 0,
        compilationError: null,
        runtimeError: error.message,
      };
    } finally {
      // Cleanup
      this.cleanup(sessionDir);
    }
  }

  getFileNames(language, sessionDir) {
    const baseName = "solution";
    let fileName, compiledFileName;

    switch (language) {
      case "python":
        fileName = path.join(sessionDir, `${baseName}.py`);
        break;
      case "java":
        fileName = path.join(sessionDir, `${baseName}.java`);
        compiledFileName = path.join(sessionDir, `${baseName}.class`);
        break;
      case "cpp":
        fileName = path.join(sessionDir, `${baseName}.cpp`);
        compiledFileName = path.join(sessionDir, `${baseName}.exe`);
        break;
      case "c":
        fileName = path.join(sessionDir, `${baseName}.c`);
        compiledFileName = path.join(sessionDir, `${baseName}.exe`);
        break;
      case "javascript":
        fileName = path.join(sessionDir, `${baseName}.js`);
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    return { fileName, compiledFileName };
  }

  async compileCode(language, fileName, compiledFileName, timeout) {
    const needsCompilation = ["java", "cpp", "c"];

    if (!needsCompilation.includes(language)) {
      return { success: true };
    }

    let compileCommand, compileArgs;

    switch (language) {
      case "java":
        compileCommand = "javac";
        compileArgs = [fileName];
        break;
      case "cpp":
        compileCommand = "g++";
        compileArgs = [fileName, "-o", compiledFileName];
        break;
      case "c":
        compileCommand = "gcc";
        compileArgs = [fileName, "-o", compiledFileName];
        break;
    }

    try {
      const result = await this.executeProcess(
        compileCommand,
        compileArgs,
        "",
        timeout * 1000
      );

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: result.stderr || result.stdout || "Compilation failed",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Compilation error: ${error.message}`,
      };
    }
  }

  async runTestCase(language, fileName, input, expectedOutput, timeout) {
    const startTime = Date.now();

    try {
      let command, args;

      switch (language) {
        case "python":
          command = "python3";
          args = [fileName];
          break;
        case "java": {
          const className = path.basename(fileName, ".class");
          const classDir = path.dirname(fileName);
          command = "java";
          args = ["-cp", classDir, className];
          break;
        }
        case "cpp":
        case "c":
          command = fileName;
          args = [];
          break;
        case "javascript":
          command = "node";
          args = [fileName];
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const result = await this.executeProcess(
        command,
        args,
        input,
        timeout * 1000
      );
      const executionTime = Date.now() - startTime;

      const actualOutput = result.stdout.trim();
      const expectedOutputTrim = expectedOutput.trim();
      const passed = actualOutput === expectedOutputTrim;

      return {
        passed,
        actualOutput,
        expectedOutput: expectedOutputTrim,
        executionTime,
        memoryUsed: result.memoryUsed || 0,
        errorMessage: result.stderr || null,
      };
    } catch (error) {
      return {
        passed: false,
        actualOutput: "",
        expectedOutput: expectedOutput.trim(),
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        errorMessage: error.message,
      };
    }
  }

  executeProcess(command, args, input, timeoutMs) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let memoryUsed = 0;

      const timeout = setTimeout(() => {
        process.kill("SIGKILL");
        reject(new Error("Execution timeout"));
      }, timeoutMs);

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (code) => {
        clearTimeout(timeout);
        resolve({
          exitCode: code,
          stdout,
          stderr,
          memoryUsed,
        });
      });

      process.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Send input to process
      if (input) {
        process.stdin.write(input);
      }
      process.stdin.end();
    });
  }

  async cleanup(sessionDir) {
    try {
      await fs.rmdir(sessionDir, { recursive: true });
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

const codeExecutionService = new CodeExecutionService();

// Export function for use in controllers
exports.executeCode = async (code, language, testCases, timeout) => {
  return await codeExecutionService.executeCode(
    code,
    language,
    testCases,
    timeout
  );
};
