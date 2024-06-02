
const express = require('express');
const ytdl = require('ytdl-core');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors())

app.get('/audio', async (req, res) => {
  const { videoUrl } = req.query;

  try {
    if (!ytdl.validateURL(videoUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(videoUrl);
    const audioFormat = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });

    if (!audioFormat) {
      throw new Error('No audio format found');
    }

    res.json({ audioUrl: audioFormat.url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/playlist', async (req, res) => {
  const { playlistUrl } = req.query;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(playlistUrl);

    const songUrls = await page.evaluate(() => {
      const videoElements = document.querySelectorAll('a.ytd-playlist-video-renderer');
      const urls = [];
      videoElements.forEach(element => {
        urls.push(element.getAttribute('href'));
      });
      return urls;
    });

    await browser.close();

    const formattedUrls = songUrls.map(url => 'https://youtube.com' + url);
    res.json({ songUrls: formattedUrls });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
