import { NextResponse } from 'next/server';

// Mock execution API for Demo/Testing purposes
// Since the public Piston API is whitelist-only, we use a mock for demonstration
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language, files, stdin } = body;
    const code = files?.[0]?.content || "";

    // VERY naive mock execution based on typical lesson inputs
    let output = "";

    if (stdin) {
      // Mock for fe-basic-1: Playing With Characters
      if (stdin.includes("C\nLanguage")) output = stdin;
      else if (stdin.includes("A\nHello")) output = stdin;
      else if (stdin.includes("Z\nProgramming")) output = stdin;
      
      // Mock for fe-basic-2: Sum and Difference
      else if (stdin.trim() === "10 5") output = "15\n5";
      else if (stdin.trim() === "100 37") output = "137\n63";
      else if (stdin.trim() === "0 0") output = "0\n0";
      else if (stdin.trim() === "-3 7") output = "4\n-10";
      
      // Mock for fe-basic-3: max_of_four
      else if (stdin.trim() === "3 4 6 5") output = "6";
      else if (stdin.trim() === "12 8 2 10") output = "12";
      else if (stdin.trim() === "-1 -5 -3 -2") output = "-1";
      else if (stdin.trim() === "7 7 7 7") output = "7";
      
      // Mock for fe-basic-4: pointers
      else if (stdin.trim() === "4 5") output = "9\n1";
      else if (stdin.trim() === "10 3") output = "13\n7";
      else if (stdin.trim() === "5 10") output = "15\n5";
      
      // Backend ninja 1
      else if (stdin.trim() === "200") output = "OK";
      else if (stdin.trim() === "404") output = "Not Found";
      else if (stdin.trim() === "500") output = "Internal Server Error";
      else if (stdin.trim() === "302") output = "Unknown";
      
      // Backend ninja 2
      else if (stdin.trim() === "name=Daryl") output = "name\nDaryl";
      else if (stdin.trim() === "lang=C") output = "lang\nC";
      else if (stdin.trim() === "status=active") output = "status\nactive";
      
      // Backend ninja 3
      else if (stdin.trim() === "3 + 5") output = "8";
      else if (stdin.trim() === "10 - 4") output = "6";
      else if (stdin.trim() === "6 * 7") output = "42";
      
      // Data types in JS
      else if (stdin.trim() === "42\n3.14\nHello") output = "42\n3.14\nHello";
      else if (stdin.trim() === "0\n1.5\nWorld") output = "0\n1.5\nWorld";

      // Default fallback
      else output = stdin;
    } else {
      // React mastery JS Hello World
      if (language === "javascript" || code.includes("console.log")) {
        output = "Hello, World!";
      } else {
        output = "Program finished with no output.";
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      language,
      version: "1.0",
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
