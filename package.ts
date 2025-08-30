/*
 *   Copyright (C) 2025 huangdihd
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import fs from 'node:fs';
import archiver from 'archiver';

function copyWebFiles (copyConfig: object) {
    if (!fs.existsSync('web/.output/')) {
        throw new Error("web/.output/ not found");
    }
    fs.cpSync('web/.output/', './package_temp/web', copyConfig);

    if (!fs.existsSync('web/package.json')) {
        throw new Error("web/package.json not found");
    }
    fs.cpSync('web/package.json', './package_temp/web/package.json', copyConfig);
}

function copyServerFiles (copyConfig: object) {
    if (!fs.existsSync('server/dist')) {
        throw new Error("server/dist not found");
    }
    fs.cpSync('server/dist', './package_temp/server/', copyConfig);

    if (!fs.existsSync('server/package.json')) {
        throw new Error("server/package.json not found");
    }
    fs.cpSync('server/package.json', './package_temp/server/package.json', copyConfig);

    if (!fs.existsSync('server/prisma/schema.prisma')) {
        throw new Error("server/prisma/schema.prisma not found");
    }
    fs.cpSync('server/prisma/schema.prisma', './package_temp/prisma/schema.prisma', copyConfig);
}

function copyFiles() {
    const copyConfig = {
        recursive: true,
        verbatimSymlinks: false
    }
    copyWebFiles(copyConfig);
    copyServerFiles(copyConfig);

    if (!fs.existsSync('package.json')) {
        throw new Error("package.json not found");
    }
    fs.cpSync('package.json', './package_temp/package.json', copyConfig);

}

async function compression() {
    const output = fs.createWriteStream(`.output/${version}/xinManager.zip`);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(output);
    archive.directory('./package_temp/', false);
    await archive.finalize();
}


const version = process.env.CUSTOM_VERSION || process.argv[2];

console.log(`Version: ${version}`);

console.log(`Output: ./.output/${version}`);

if (fs.existsSync('./package_temp/')) {
    fs.rmSync('./package_temp/', { recursive: true, force: true });
}

fs.mkdirSync('./package_temp/');

console.log(`Create package_temp`);

if (!fs.existsSync('./.output/')) {
    fs.mkdirSync('./.output/');
}

if (!fs.existsSync(`./.output/${version}`)) {
    fs.mkdirSync(`./.output/${version}`);
}

console.log(`Create .output/${version} directory`);

copyFiles();

console.log(`Copy files to package_temp`);

(async () => {
    await compression()
})();

console.log(`Compression done`);