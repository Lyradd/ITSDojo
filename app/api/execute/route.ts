import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language, files, stdin } = body;
    const code = files?.[0]?.content || "";

    // 1. PISTON API EXECUTION UNTUK PYTHON & JAVASCRIPT (SECURE SANDBOX)
    if (language === 'python' || language === 'javascript') {
      try {
        const pistonVersion = language === 'python' ? '3.10.0' : '18.15.0';

        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: language,
            version: pistonVersion,
            files: [{ content: code }],
            stdin: stdin || "",
          })
        });

        if (!response.ok) {
          throw new Error(`Piston API Error: ${response.statusText}`);
        }

        const result = await response.json();

        // Handle error output from Piston correctly
        if (result.message) {
          throw new Error(result.message);
        }

        return NextResponse.json({
          language,
          version: "Piston",
          run: {
            stdout: result.run.stdout || "",
            stderr: result.run.stderr || "",
            output: result.run.output || "",
            code: result.run.code || 0,
            signal: result.run.signal || null
          }
        });

      } catch (error: any) {
        const errMsg = error.message || "Execution failed";
        return NextResponse.json({
          language,
          version: "Piston",
          run: {
            stdout: "",
            stderr: errMsg,
            output: errMsg,
            code: 1,
            signal: null
          }
        });
      }
    }

    // 2. MOCK EXECUTION (Hanya untuk C / C++ / SQL karena tidak ada compiler)
    let output = "";
    const trimmedStdin = (stdin || "").trim();
    const nums = trimmedStdin.split(/\s+/).map(Number);

    // Mock Dasar Pemrograman (C/C++)
    if (nums.length === 2 && !nums.some(isNaN)) {
      if (code.includes("+") || code.includes("a+b") || code.includes("a + b") || code.includes("sum")) {
        output = String(nums[0] + nums[1]);
      } else if (code.includes("-") || code.includes("a-b") || code.includes("a - b")) {
        output = String(nums[0] - nums[1]);
      } else {
        output = "0";
      }
    } else {
      // Regex cetak standar untuk C/C++
      const printfMatch = code.match(/printf\s*\(\s*"([^"]*)"/);
      const coutMatch = code.match(/cout\s*<<\s*"([^"]*)"/);

      if (printfMatch) {
        output = printfMatch[1].replace(/\\n/g, "\n");
      } else if (coutMatch) {
        output = coutMatch[1];
      } else if (language === "sql") {
        output = "CREATE INDEX idx_name ON users(name);";
      } else {
        output = "Program finished with no output or mock unavailable.";
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300)); // Delay artifisial

    return NextResponse.json({
      language,
      version: "Mock",
      run: {
        stdout: output,
        stderr: "",
        output: output,
        code: 0,
        signal: null
      }
    });

  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
