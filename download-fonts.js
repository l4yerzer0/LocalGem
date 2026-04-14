const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'android/app/src/main/assets/fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve, reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
};

const fonts = [
  ['https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Regular.ttf', 'Inter-Regular.ttf'],
  ['https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Medium.ttf', 'Inter-Medium.ttf'],
  ['https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-SemiBold.ttf', 'Inter-SemiBold.ttf'],
  ['https://github.com/google/fonts/raw/main/ofl/lora/static/Lora-Regular.ttf', 'Lora-Regular.ttf'],
  ['https://github.com/google/fonts/raw/main/ofl/lora/static/Lora-Medium.ttf', 'Lora-Medium.ttf']
];

console.log('Downloading fonts...');
Promise.all(fonts.map(([url, name]) => download(url, path.join(fontsDir, name))))
  .then(() => console.log('Fonts downloaded successfully!'))
  .catch(err => console.error('Error downloading fonts:', err));
