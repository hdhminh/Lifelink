import https from 'https'
import fs from 'fs'
import path from 'url'
import fsPath from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fsPath.dirname(__filename)

const rssUrl = 'https://vnexpress.net/rss/suc-khoe.rss'

function cleanHtml(html) {
  // Removes tags like <a href...><img ... /></a> and strips extra whitespaces
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function parsePubDate(pubDateStr) {
  // Convert "Thu, 25 Jun 2026 10:00:00 +0700" to "YYYY-MM-DD"
  try {
    const d = new Date(pubDateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (err) {
    return '2026-06-25'
  }
}

https.get(rssUrl, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  res.on('end', () => {
    try {
      const items = []
      // Match all <item> ... </item> blocks
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      let id = 1

      while ((match = itemRegex.exec(data)) !== null) {
        const itemContent = match[1]

        const titleMatch = itemContent.match(/<title><\!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/)
        const descMatch = itemContent.match(/<description><\!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/)
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/)
        const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)

        if (titleMatch) {
          const title = titleMatch[1].trim()
          const description = descMatch ? cleanHtml(descMatch[1]) : ''
          const link = linkMatch ? linkMatch[1].trim() : ''
          const pubDate = pubDateMatch ? parsePubDate(pubDateMatch[1].trim()) : '2026-06-25'

          // Categorize based on keywords in title
          let category = 'Tips'
          const lowerTitle = title.toLowerCase()
          if (lowerTitle.includes('hiến máu') || lowerTitle.includes('truyền máu')) {
            category = 'Campaign'
          } else if (lowerTitle.includes('quy định') || lowerTitle.includes('chính sách') || lowerTitle.includes('bộ y tế')) {
            category = 'Policy'
          } else if (lowerTitle.includes('bệnh') || lowerTitle.includes('khẩn cấp') || lowerTitle.includes('dịch')) {
            category = 'Emergency'
          } else if (lowerTitle.includes('nghiên cứu') || lowerTitle.includes('khoa học') || lowerTitle.includes('điều trị')) {
            category = 'Research'
          }

          items.push({
            id: id++,
            date: pubDate,
            title: title,
            content: description,
            link: link,
            category: category
          })
        }
      }

      if (items.length > 0) {
        const output = { news: items }
        const targetPath = fsPath.resolve(__dirname, '../src/data/news.json')
        fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf-8')
        console.log(`Successfully fetched and pre-seeded ${items.length} real articles from VnExpress.`)
      } else {
        console.error('Failed to parse any items from RSS feed.')
      }
    } catch (err) {
      console.error('Error parsing VnExpress RSS:', err)
    }
  })
}).on('error', (err) => {
  console.error('Error fetching VnExpress RSS:', err)
})
