import fs from "fs";

export async function logger() {
    process.stdout.pipe(fs.createWriteStream("logs/backend.log"));
}