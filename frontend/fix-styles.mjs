import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Generic replacements matching HTML-like attributes separated by potential whitespace/newlines
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*color:\s*['"`]var\(--text-main\)['"`]\s*\}\}/gs, '$1 className="$2 text-main"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*borderColor:\s*['"`]var\(--border-light\)['"`]\s*\}\}/gs, '$1 className="$2 border-light"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--bg-app\)['"`]\s*\}\}/gs, '$1 className="$2 bg-app"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--bg-surface\)['"`]\s*\}\}/gs, '$1 className="$2 bg-surface"$3');
  
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*borderColor:\s*['"`]var\(--border-light\)['"`],\s*backgroundColor:\s*['"`]var\(--bg-app\)['"`]\s*\}\}/gs, '$1 className="$2 border-light bg-app"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--bg-app\)['"`],\s*borderColor:\s*['"`]var\(--border-light\)['"`]\s*\}\}/gs, '$1 className="$2 bg-app border-light"$3');
  
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--color-primary-light\)['"`],\s*color:\s*['"`]var\(--color-primary\)['"`]\s*\}\}/gs, '$1 className="$2 bg-primary-light text-primary"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--color-primary\)['"`]\s*\}\}/gs, '$1 className="$2 bg-primary"$3');
  content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+style=\{\{\s*backgroundColor:\s*['"`]var\(--color-accent\)['"`]\s*\}\}/gs, '$1 className="$2 bg-accent"$3');

  // Any left over style={{ ... }} where there is NO className. We just replace the style block with a new className
  content = content.replace(/style=\{\{\s*color:\s*['"`]var\(--text-main\)['"`]\s*\}\}/g, 'className="text-main"');
  content = content.replace(/style=\{\{\s*borderColor:\s*['"`]var\(--border-light\)['"`]\s*\}\}/g, 'className="border-light"');


  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      // Recurse into a subdirectory
      results = results.concat(walkDir(file));
    } else { 
      // Is a file
      if (file.endsWith('.tsx')) {
         results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir(SRC_DIR);
files.forEach(file => processFile(file));
