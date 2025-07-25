import express from "express";
import db from "../../modules/db";
import multer from "multer";
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Here you would typically save the file information to the database
        // For example:
        const fileData = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        };

        // Save fileData to the database
        db.insert(filesTable).values(fileData).then(() => {
            res.status(201).json({ message: "File uploaded successfully", file: fileData });
        }).catch((error) => {
            console.error(error);
            res.status(500).json({ error: "An unexpected error occurred" });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An unexpected error occurred" });
    }
});

router.delete("/delete/:id", (req, res) => {
    const { id } = req.params;
});

export default router;