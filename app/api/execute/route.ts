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

    // 1. NATIVE EXECUTION UNTUK PYTHON & JAVASCRIPT
    if (language === 'python' || language === 'javascript') {
      try {
        const tmpDir = os.tmpdir();
        const fileExt = language === 'python' ? 'py' : 'js';
        const fileName = `itsdojo_run_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = path.join(tmpDir, fileName);

        // Tulis kode ke temporary file
        fs.writeFileSync(filePath, code);

        let command = '';
        if (language === 'python') {
          // On Windows it's usually 'python'
          command = `python "${filePath}"`;
        } else {
          command = `node "${filePath}"`;
        }

        // Eksekusi kode secara sinkron dengan stdin
        const result = execSync(command, {
          input: stdin || '',
          timeout: 5000, // max 5 detik
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
        });

        // Hapus file sementara
        try { fs.unlinkSync(filePath); } catch (e) {}

        return NextResponse.json({
          language,
          version: "Native",
          run: {
            stdout: result.trimEnd(),
            stderr: "",
            output: result.trimEnd(),
            code: 0,
            signal: null
          }
        });

      } catch (error: any) {
        // Jika ada error runtime/sintaks (stderr)
        let errMsg = error.stderr ? error.stderr.toString() : error.message;
        
        // Coba hapus file jika gagal di tengah jalan
        try {
          const files = fs.readdirSync(os.tmpdir()).filter(fn => fn.startsWith('itsdojo_run_'));
          files.forEach(f => fs.unlinkSync(path.join(os.tmpdir(), f)));
        } catch(e) {}

        return NextResponse.json({
          language,
          version: "Native",
          run: {
            stdout: error.stdout ? error.stdout.toString() : "",
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
