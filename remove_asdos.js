const fs = require('fs');

const path = 'c:/Ngoding/ITSDojo/app/(auth)/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/'mahasiswa' \| 'asdos' \| 'dosen'/g, "'mahasiswa' | 'dosen'");

content = content.replace(/\} else if \(selectedRole === 'asdos'\) \{\s*router\.push\('\/asdos'\);\s*/, '');

const asdosButtonRegex = /<button\s*onClick=\{\(\) => handleRoleSelect\('asdos'\)\}[\s\S]*?<\/button>\s*/;
content = content.replace(asdosButtonRegex, '');

content = content.replace(/selectedRole === 'asdos' \? 'bg-green-50 border-green-200 dark:bg-green-950\/30 dark:border-green-800 text-green-800 dark:text-green-300' :\s*/, '');

content = content.replace(/selectedRole === 'asdos' \? 'text-green-600' :\s*/, '');

content = content.replace(/selectedRole === 'asdos' \? '👨‍🏫 Asisten Dosen' : /g, '');

content = content.replace(/selectedRole === 'asdos' \? 'text-green-600 focus:ring-green-500' :\s*/, '');

content = content.replace(/selectedRole === 'asdos' \? 'bg-green-600 hover:bg-green-700' :\s*/, '');

content = content.replace(/transitioningRole === 'asdos' \? 'bg-green-600' :\s*/, '');

fs.writeFileSync(path, content);
