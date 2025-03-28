import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

function copyFolder(source: string, target: string) {
  if (!fs.existsSync(source)) {
    console.error(`Source folder does not exist: ${source}`);
    return;
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolder(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

const templateFolder = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'templates', 'routes');
const targetFolder = path.resolve('.', 'app', 'routes');

copyFolder(templateFolder, targetFolder);
console.info(`Template copy completed: ${targetFolder}`);
