const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure directories exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('outputs')) {
    fs.mkdirSync('outputs');
}

// Serve static files (e.g., index.html)
app.use(express.static('public'));

// Handle file upload and conversion
app.post('/convert', upload.single('audioFile'), (req, res) => {
    if (!req.file) {
        return res.json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'outputs', path.basename(req.file.originalname, path.extname(req.file.originalname)) + '_mono' + path.extname(req.file.originalname));

    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ac 1 "${outputPath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.json({ error: 'FFmpeg error: ' + error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.json({ error: 'FFmpeg stderr: ' + stderr });
        }
        // Send the file for download
        res.json({ url: '/download/' + path.basename(outputPath) });
    });
});

// Serve the converted file
app.get('/download/:file', (req, res) => {
    const filePath = path.join(__dirname, 'outputs', req.params.file);
    res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
