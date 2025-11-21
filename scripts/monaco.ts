/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import crypto from "crypto";
import fs from "fs-extra";
import https from "https";
import path from "path";
import tar from "tar-stream";
import url from "url";
import zlib from "zlib";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_BASE_URL = "https://registry.npmjs.org";
const PACKAGE_NAME = "monaco-editor";
const PUBLIC_PATH = path.resolve(__dirname, "..", "public");
const MONACO_JSON = path.join(PUBLIC_PATH, "monaco.json");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FORCE = process.argv.includes("--force");
// 0.53.0 does not seem to play well with @monaco-editor/react
// let's check periodically and make it undefined when we are good.
const PINNED_VERSION: string | undefined = "0.54.0";

interface IPackageDetails {
    version: string;
    url: string;
    shaSum: string;
    last_check: string;
}

const readMonacoDetails = (): IPackageDetails | null => {
    try {
        if (!fs.existsSync(MONACO_JSON)) {
            return null;
        }
        const data = JSON.parse(fs.readFileSync(MONACO_JSON, "utf-8"));
        const lastCheck = new Date(data.last_check);
        if (Date.now() - lastCheck.getTime() >= ONE_DAY_MS) {
            return null;
        }
        const details = data as IPackageDetails;
        if (PINNED_VERSION && details.version !== PINNED_VERSION) {
            return null;
        }
        return details;
    } catch {
        return null;
    }
};

const fetchPackageDetails = async (): Promise<IPackageDetails> => {
    return new Promise((resolve, reject) => {
        https
            .get(`${REGISTRY_BASE_URL}/${PACKAGE_NAME}`, res => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch package details: ${res.statusCode}`));
                    return;
                }

                let data = "";
                res.on("data", chunk => (data += chunk));
                res.on("end", () => {
                    try {
                        const json = JSON.parse(data);
                        let version = json["dist-tags"].latest;
                        if (PINNED_VERSION && version !== PINNED_VERSION && PINNED_VERSION in json.versions) {
                            version = PINNED_VERSION;
                        }
                        const dist = json.versions[version].dist;

                        if (!version || !dist.tarball || !dist.shasum) {
                            reject(new Error("Incomplete package data."));
                            return;
                        }

                        const details: IPackageDetails = {
                            version,
                            url: dist.tarball,
                            shaSum: dist.shasum,
                            last_check: new Date().toISOString(),
                        };

                        fs.writeFileSync(MONACO_JSON, JSON.stringify(details, null, 2));
                        resolve(details);
                    } catch (err) {
                        console.error("Failed to parse package metadata:", err);
                        reject(new Error("Failed to parse package metadata."));
                    }
                });
            })
            .on("error", reject);
    });
};

const downloadFile = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https
            .get(url, res => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download file: ${res.statusCode}`));
                    return;
                }
                res.pipe(file);
                res.on("end", () => {
                    file.close();
                    resolve();
                });
            })
            .on("error", reject);
    });
};

const validateChecksum = (filePath: string, expectedSha: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha1");
        const stream = fs.createReadStream(filePath);
        stream.on("data", chunk => hash.update(chunk));
        stream.on("end", () => {
            const actualSha = hash.digest("hex");
            if (actualSha !== expectedSha) {
                reject(new Error("SHA-1 checksum mismatch."));
            } else {
                resolve();
            }
        });
        stream.on("error", reject);
    });
};

const extractTarFile = async (file: string, dest: string): Promise<void> => {
    console.info("Extracting tar file...");
    return new Promise((resolve, reject) => {
        const extract = tar.extract();
        extract.on("entry", (header, stream, next) => {
            const filePath = path.join(dest, header.name);
            if (header.type === "file") {
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                stream.pipe(fs.createWriteStream(filePath));
            } else {
                fs.mkdirSync(filePath, { recursive: true });
            }
            stream.on("end", next);
            stream.resume();
        });
        extract.on("finish", resolve);
        extract.on("error", reject);

        fs.createReadStream(file).pipe(zlib.createGunzip()).pipe(extract);
    });
};

const ensureMonacoFiles = async (): Promise<void> => {
    await fs.ensureDir(PUBLIC_PATH);

    const cached = readMonacoDetails();
    const details = cached || (await fetchPackageDetails());

    const loaderExists = fs.existsSync(path.join(PUBLIC_PATH, "vs", "loader.js"));

    if (!FORCE && cached && loaderExists) {
        console.info("Monaco Editor files are up-to-date.");
        return;
    }

    console.info("Downloading Monaco Editor tarball...");
    const tarballPath = path.join(PUBLIC_PATH, "monaco.tar.gz");

    try {
        await downloadFile(details.url, tarballPath);
        await validateChecksum(tarballPath, details.shaSum);
        await extractTarFile(tarballPath, PUBLIC_PATH);

        const monacoRoot = path.join(PUBLIC_PATH, "package");
        const vsSrc = path.join(monacoRoot, "min", "vs");
        const vsDst = path.join(PUBLIC_PATH, "vs");

        if (!fs.existsSync(vsSrc)) {
            throw new Error("vs/ directory not found after extraction.");
        }

        await fs.rm(vsDst, { recursive: true, force: true });
        await fs.rename(vsSrc, vsDst);

        const minMapsSrc = path.join(monacoRoot, "min-maps");
        const minMapsDst = path.join(PUBLIC_PATH, "min-maps");
        if (fs.existsSync(minMapsSrc)) {
            await fs.rm(minMapsDst, { recursive: true, force: true });
            await fs.rename(minMapsSrc, minMapsDst);
        }
        await fs.rm(monacoRoot, { recursive: true, force: true });

        console.info("Monaco Editor files updated.");
    } finally {
        if (fs.existsSync(tarballPath)) {
            await fs.rm(tarballPath);
        }
    }
};

(async () => {
    try {
        await ensureMonacoFiles();
    } catch (err) {
        console.error("Failed to ensure Monaco Editor files:", err);
        process.exit(1);
    }
})();
