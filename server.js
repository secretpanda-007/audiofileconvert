const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Create directories if they don’t exist
['uploads', 'outputs'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

app.use(express.static('public'));

app.post('/convert', upload.single('audioFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = path.basename(req.file.originalname, path.extname(req.file.originalname)) + '_mono' + path.extname(req.file.originalname);
    const outputPath = path.join(__dirname, 'outputs', outputFileName);

    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ac 1 "${outputPath}"`;

    exec(ffmpegCommand, (error) => {
        if (error) {
            console.error(`FFmpeg Error: ${error.message}`);
            return res.status(500).json({ error: 'Conversion failed: ' + error.message });
        }

        fs.unlink(inputPath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });

        res.json({ url: '/download/' + outputFileName });
    });
});

app.get('/download/:file', (req, res) => {
    const filePath = path.join(__dirname, 'outputs', req.params.file);
    res.download(filePath, (err) => {
        if (!err) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete output file:', err);
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
