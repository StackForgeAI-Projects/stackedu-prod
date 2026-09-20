(function () {
  const GUIDES = [
    { id: 'home', file: 'README.md', title: 'User guides', nav: 'Home' },
    { id: 'applicant', file: 'applicant-guide.md', title: 'Applicant guide', nav: 'Applicant' },
    { id: 'student', file: 'student-guide.md', title: 'Student guide', nav: 'Student' },
    { id: 'lecturer', file: 'lecturer-guide.md', title: 'Lecturer guide', nav: 'Lecturer' },
    { id: 'academic-admin', file: 'academic-admin-guide.md', title: 'Academic Admin guide', nav: 'Academic Admin' },
    { id: 'bursar', file: 'bursar-guide.md', title: 'Bursar guide', nav: 'Bursar' },
    { id: 'librarian', file: 'librarian-guide.md', title: 'Librarian guide', nav: 'Librarian' },
    { id: 'ict', file: 'ict-guide.md', title: 'ICT Manager guide', nav: 'ICT Manager' },
  ]

  const FILE_TO_ID = Object.fromEntries(GUIDES.map((guide) => [guide.file, guide.id]))
  const ALERTS = {
    NOTE: { className: 'callout callout-note', label: 'Note' },
    TIP: { className: 'callout callout-tip', label: 'Tip' },
    IMPORTANT: { className: 'callout callout-important', label: 'Important' },
    WARNING: { className: 'callout callout-warning', label: 'Watch' },
    CAUTION: { className: 'callout callout-warning', label: 'Watch' },
  }

  const article = document.getElementById('guide')
  const navEl = document.getElementById('guide-nav')
  const menuBtn = document.getElementById('menu-btn')
  const sidenav = document.getElementById('sidenav')
  const backdrop = document.getElementById('nav-backdrop')

  function currentId() {
    const id = new URLSearchParams(window.location.search).get('g') || 'home'
    return GUIDES.some((guide) => guide.id === id) ? id : 'home'
  }

  function guideUrl(id) {
    return id === 'home' ? './' : './?g=' + encodeURIComponent(id)
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function rewriteHref(href) {
    const trimmed = href.trim()
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('mailto:')) return trimmed
    const file = trimmed.replace(/^\.\//, '').split('#')[0]
    const hash = trimmed.includes('#') ? '#' + trimmed.split('#').slice(1).join('#') : ''
    if (FILE_TO_ID[file]) return guideUrl(FILE_TO_ID[file]) + hash
    return trimmed
  }

  function inline(text) {
    let html = escapeHtml(text)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
      const next = rewriteHref(href)
      const external = /^https?:\/\//i.test(next)
      return (
        '<a href="' +
        next +
        '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        '>' +
        label +
        '</a>'
      )
    })
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    return html
  }

  function splitRow(line) {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
  }

  function isFence(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
  }

  function renderMarkdown(source) {
    const lines = source.replace(/\r\n/g, '\n').split('\n')
    const out = []
    let i = 0

    function flushParagraph(buffer) {
      if (!buffer.length) return
      out.push('<p>' + inline(buffer.join(' ')) + '</p>')
      buffer.length = 0
    }

    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        i += 1
        continue
      }

      const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i)
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase()
        const meta = ALERTS[type]
        const body = []
        i += 1
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          body.push(lines[i].replace(/^\s*>\s?/, ''))
          i += 1
        }
        out.push(
          '<aside class="' +
            meta.className +
            '"><span class="callout-label">' +
            meta.label +
            '</span><p>' +
            inline(body.join(' ').trim()) +
            '</p></aside>',
        )
        continue
      }

      if (/^---+$/.test(trimmed)) {
        out.push('<hr />')
        i += 1
        continue
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
      if (heading) {
        const level = heading[1].length
        const text = heading[2].trim()
        out.push('<h' + level + ' id="' + slugify(text) + '">' + inline(text) + '</h' + level + '>')
        i += 1
        continue
      }

      if (trimmed.includes('|') && i + 1 < lines.length && isFence(lines[i + 1].trim())) {
        const headers = splitRow(trimmed)
        i += 2
        const rows = []
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
          rows.push(splitRow(lines[i]))
          i += 1
        }
        out.push('<div class="table-wrap"><table><thead><tr>')
        headers.forEach((cell) => out.push('<th>' + inline(cell) + '</th>'))
        out.push('</tr></thead><tbody>')
        rows.forEach((row) => {
          out.push('<tr>')
          row.forEach((cell) => out.push('<td>' + inline(cell) + '</td>'))
          out.push('</tr>')
        })
        out.push('</tbody></table></div>')
        continue
      }

      if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const ordered = /^\d+\.\s+/.test(trimmed)
        out.push(ordered ? '<ol>' : '<ul>')
        while (i < lines.length) {
          const item = lines[i]
          const itemTrim = item.trim()
          const match = itemTrim.match(/^([-*]|\d+\.)\s+(.+)$/)
          if (!match) break
          i += 1
          const nested = []
          while (i < lines.length && /^\s{2,}[-*]\s+/.test(lines[i])) {
            nested.push(lines[i].trim().replace(/^[-*]\s+/, ''))
            i += 1
          }
          let html = '<li>' + inline(match[2])
          if (nested.length) {
            html += '<ul>' + nested.map((entry) => '<li>' + inline(entry) + '</li>').join('') + '</ul>'
          }
          html += '</li>'
          out.push(html)
        }
        out.push(ordered ? '</ol>' : '</ul>')
        continue
      }

      const para = [trimmed]
      i += 1
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('>') &&
        !/^[-*]\s+/.test(lines[i].trim()) &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !/^---+$/.test(lines[i].trim())
      ) {
        para.push(lines[i].trim())
        i += 1
      }
      flushParagraph(para)
    }

    return out.join('\n')
  }

  function closeMenu() {
    sidenav.classList.remove('is-open')
    backdrop.hidden = true
    menuBtn.setAttribute('aria-expanded', 'false')
    menuBtn.textContent = 'Menu'
  }

  function openMenu() {
    sidenav.classList.add('is-open')
    backdrop.hidden = false
    menuBtn.setAttribute('aria-expanded', 'true')
    menuBtn.textContent = 'Close'
  }

  function renderNav(activeId) {
    navEl.innerHTML = GUIDES.map(function (guide) {
      const current = guide.id === activeId ? ' aria-current="page"' : ''
      return '<a href="' + guideUrl(guide.id) + '"' + current + '>' + guide.nav + '</a>'
    }).join('')
  }

  async function loadGuide() {
    const id = currentId()
    const guide = GUIDES.find((entry) => entry.id === id) || GUIDES[0]
    renderNav(guide.id)
    document.title = guide.title + ' · StackEDU'
    article.innerHTML = '<p class="loading">Loading guide…</p>'

    try {
      const response = await fetch('./' + guide.file, { cache: 'no-cache' })
      if (!response.ok) throw new Error('Could not load this guide.')
      const markdown = await response.text()
      article.innerHTML = renderMarkdown(markdown)
      if (window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        if (target) target.scrollIntoView()
      } else {
        window.scrollTo(0, 0)
      }
    } catch (error) {
      article.innerHTML = '<p class="error">This guide could not be opened. Refresh the page or pick another guide from the menu.</p>'
    }
  }

  menuBtn.addEventListener('click', function () {
    if (sidenav.classList.contains('is-open')) closeMenu()
    else openMenu()
  })
  backdrop.addEventListener('click', closeMenu)
  navEl.addEventListener('click', function () {
    if (window.matchMedia('(max-width: 767px)').matches) closeMenu()
  })
  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu()
  })
  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 768px)').matches) closeMenu()
  })

  loadGuide()
})()
