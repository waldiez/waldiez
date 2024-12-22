import { exec } from "child_process";
import fs from "fs";
import { lookpath } from "lookpath";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
    const ffmpeg = await lookpath("ffmpeg");
    if (!ffmpeg) {
        console.log("ffmpeg not found in PATH");
        process.exit(0);
    }
    const videosDir = path.resolve(__dirname, "..", "e2e", "videos");
    if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
        process.exit(0);
    }
    const videoFiles = await fs.promises.readdir(videosDir);
    const videoFile = videoFiles.find(file => file.endsWith(".webm"));
    if (!videoFile) {
        process.exit(0);
    }
    const videoPath = path.resolve(videosDir, videoFile);
    await fs.promises.copyFile(videoPath, path.resolve(videosDir, "demo.webm"));
    console.info("Video file copied to demo.webm");
    videoFiles.forEach(async file => {
        await fs.promises.unlink(path.resolve(videosDir, file));
    });
    const srcFile = "demo.webm";
    const dotLocal = path.resolve(__dirname, "..", ".local");
    await fs.promises.mkdir(dotLocal, { recursive: true });
    const dstFile = path.resolve(dotLocal, "demo.webm");
    await fs.promises.copyFile(path.resolve(videosDir, srcFile), dstFile);
    console.info("Video file copied to .local/demo.webm");
    await fs.promises.rm(videosDir, { recursive: true });
    if (ffmpeg) {
        const src = "demo.webm";
        const dst = "demo.mp4";
        const cmd = `${ffmpeg} -y -hide_banner -loglevel error -i ${src} ${dst}`;
        console.info("Converting video to mp4...");
        console.info(`Running: ${cmd}`);
        exec(cmd, { cwd: dotLocal }, (error, stdout, stderr) => {
            if (error) {
                console.error("Error converting video to mp4");
                console.error(error);
                process.exit(1);
            }
            if (stderr) {
                console.error("Error converting video to mp4, stderr:");
                console.error(stderr);
                process.exit(1);
            }
            console.info(stdout);
        });
    }
};

main().catch(console.error);
