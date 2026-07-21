import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imagesToDownload = [
  {
    // Blood donation / blood bag scene (used widely on blood donation websites)
    name: 'home-community.jpg',
    directUrl: 'https://suckhoedoisong.qltns.mediacdn.vn/zoom/600_315/Images/ngocanh/2021/05/25/co-the-hien-mau-sau-khi-tiem-vac-xin-covid-19-khong1621917290.jpg'
  },
  {
    // Medical clinician / healthcare professional setting (Haliburg Biomedical, nurses)
    name: 'about-donors.jpg',
    directUrl: 'https://vienhuyethoc.vn/wp-content/uploads/2022/10/75D8A6FC-288C-4CE3-82B7-EFCF9D8986A2.jpeg'
  },
  {
    // Hospital / medical clinic exterior / healthcare facility (used on hospital websites)
    name: 'about-hospital.jpg',
    directUrl: 'https://benhandientu.moh.gov.vn/storage/uploads/2025/09/benh-vien-truyen-mau-huyet-hoc-1-160fbe14e2-1758640359.png'
  },
  {
    // Blood bag close-up (blood donation scene)
    name: 'hero-blood-donation.jpg',
    directUrl: 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/5/6/z6553302146898181e1f70d3ff95078b8489446861653c-17465692224901846078957.jpg'
  }
]

const headers = {
  'User-Agent': 'LifeLinkVolunteerCoordinationVietnam/1.0 (https://lifelink.vn; contact@lifelink.vn) Node.js'
}

function download(url, dest, callback) {
  https.get(url, { headers }, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      let redirectUrl = response.headers.location
      const options = new URL(url)
      if (!redirectUrl.startsWith('http')) {
        redirectUrl = `${options.protocol}//${options.hostname}${redirectUrl}`
      }
      return download(redirectUrl, dest, callback)
    }

    if (response.statusCode !== 200) {
      return callback(new Error(`Failed to download ${url}: Status ${response.statusCode}`))
    }

    const file = fs.createWriteStream(dest)
    response.pipe(file)
    file.on('finish', () => {
      file.close(callback)
    })
  }).on('error', (err) => {
    fs.unlink(dest, () => {})
    callback(err)
  })
}

const targetDir = path.resolve(__dirname, '../public/images')
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

function downloadNext(index) {
  if (index >= imagesToDownload.length) {
    console.log('All real images downloaded successfully!')
    process.exit(0)
  }

  const img = imagesToDownload[index]
  const destPath = path.join(targetDir, img.name)

  console.log(`Downloading direct asset ${img.name} from: ${img.directUrl}...`)
  download(img.directUrl, destPath, (err) => {
    if (err) {
      console.error(`Error downloading ${img.name}:`, err)
      setTimeout(() => downloadNext(index + 1), 1500)
    } else {
      console.log(`Successfully saved ${img.name}.`)
      setTimeout(() => downloadNext(index + 1), 1500)
    }
  })
}

downloadNext(0)
