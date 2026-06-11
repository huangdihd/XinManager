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

function copyFiles() {
    const copyConfig = {
        recursive: true,
        verbatimSymlinks: false
    }

    // Nuxt/Nitro 构建产物（server/index.mjs + public/ + nitro.json）
    if (!fs.existsSync('.output/server')) {
        throw new Error(".output/server not found — run `pnpm build` first");
    }
    fs.cpSync('.output/', './package_temp/', copyConfig);

    // 构建机生成的 prisma client 含本机平台的引擎二进制，
    // 删掉让目标机器上 `prisma generate` 生成的版本（根 node_modules）生效。
    for (const bundled of [
        './package_temp/server/node_modules/@prisma',
        './package_temp/server/node_modules/.prisma'
    ]) {
        if (fs.existsSync(bundled)) {
            fs.rmSync(bundled, { recursive: true, force: true });
        }
    }

    if (!fs.existsSync('prisma/schema.prisma')) {
        throw new Error("prisma/schema.prisma not found");
    }
    fs.cpSync('prisma/schema.prisma', './package_temp/prisma/schema.prisma', copyConfig);

    // 安装包内的运行时 package.json：只带 prisma 相关依赖，
    // 目标机器 pnpm install 后执行 prisma generate / db push。
    const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const runtimePkg = {
        name: rootPkg.name,
        version: rootPkg.version,
        private: true,
        type: 'module',
        scripts: {
            'start:installed': 'node server/index.mjs'
        },
        dependencies: {
            '@prisma/client': rootPkg.dependencies['@prisma/client'],
            'prisma': rootPkg.devDependencies['prisma']
        },
        packageManager: rootPkg.packageManager
    };
    fs.writeFileSync('./package_temp/package.json', JSON.stringify(runtimePkg, null, 2));
}

async function compression() {
    const output = fs.createWriteStream(`.release/${version}/xinManager.zip`);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(output);
    archive.directory('./package_temp/', false);
    await archive.finalize();
}


const version = process.env.CUSTOM_VERSION || process.argv[2];

console.log(`Version: ${version}`);

console.log(`Output: ./.release/${version}`);

if (fs.existsSync('./package_temp/')) {
    fs.rmSync('./package_temp/', { recursive: true, force: true });
}

fs.mkdirSync('./package_temp/');

console.log(`Create package_temp`);

fs.mkdirSync(`./.release/${version}`, { recursive: true });

console.log(`Create .release/${version} directory`);

copyFiles();

console.log(`Copy files to package_temp`);

(async () => {
    await compression()
})();

console.log(`Compression done`);
