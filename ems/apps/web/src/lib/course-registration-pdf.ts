import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { brandColorValue, parseHexColor } from '@/lib/brand-theme'

export interface CourseRegistrationPdfCourse {
  code: string
  name: string
  credits: number
  type: string
  lecturerName: string | null
}

export interface CourseRegistrationPdfInput {
  institutionName: string
  logoUrl: string | null
  studentName: string
  studentNumber: string
  email: string
  programmeName: string
  programmeCode: string
  departmentName: string | null
  facultyName: string | null
  yearOfStudy: number
  sessionName: string | null
  semesterName: string | null
  registeredCredits: number
  maxCredits: number
  courses: CourseRegistrationPdfCourse[]
}

export function courseRegistrationTotalsLabel(count: number, credits: number, maxCredits: number): string {
  return `${count} course${count === 1 ? '' : 's'} registered · ${credits} of ${maxCredits} credits`
}

function safeFileName(studentNumber: string, semesterName: string | null): string {
  const semester = (semesterName ?? 'semester').replace(/[\\/:*?"<>|]/g, '-').trim()
  const id = studentNumber.replace(/[\\/:*?"<>|]/g, '-').trim()
  return `Course-registration-${id}-${semester}`.slice(0, 120)
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function sniffImageFormat(blob: Blob): Promise<'PNG' | 'JPEG' | null> {
  const type = blob.type.toLowerCase()
  if (type.includes('jpeg') || type.includes('jpg')) return 'JPEG'
  if (type.includes('png')) return 'PNG'
  const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer())
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'PNG'
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'JPEG'
  return null
}

async function loadLogo(url: string | null): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const format = await sniffImageFormat(blob)
    if (!format) return null
    return { dataUrl: await blobToDataUrl(blob), format }
  } catch {
    return null
  }
}

export async function downloadCourseRegistrationPdf(input: CourseRegistrationPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const brand = parseHexColor(brandColorValue()) ?? { r: 15, g: 189, b: 59 }
  const printed = formatAppDateDdMmYyyy(new Date())
  const logo = await loadLogo(input.logoUrl)

  doc.setFillColor(brand.r, brand.g, brand.b)
  doc.rect(0, 0, pageWidth, 36, 'F')

  if (logo) {
    doc.addImage(logo.dataUrl, logo.format, 14, 8, 20, 20)
  }

  const titleX = logo ? 38 : 16
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(input.institutionName, titleX, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Course registration', titleX, 24)
  doc.setFontSize(9)
  doc.text(`Printed ${printed}`, pageWidth - 16, 16, { align: 'right' })

  doc.setTextColor(20, 20, 20)

  const details: Array<[string, string]> = [
    ['Student', input.studentName],
    ['Student ID', input.studentNumber],
    ['Email', input.email],
    ['Programme', `${input.programmeCode} · ${input.programmeName}`],
    ['Department', input.departmentName ?? '—'],
    ['Faculty', input.facultyName ?? '—'],
    ['Year of study', String(input.yearOfStudy)],
    ['Session', input.sessionName ?? '—'],
    ['Semester', input.semesterName ?? '—'],
  ]

  let y = 48
  doc.setFontSize(10)
  for (const [label, value] of details) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 16, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 52, y, { maxWidth: pageWidth - 68 })
    y += 7
  }

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(
    courseRegistrationTotalsLabel(input.courses.length, input.registeredCredits, input.maxCredits),
    16,
    y,
  )

  autoTable(doc, {
    startY: y + 6,
    head: [['Code', 'Course', 'Type', 'Credits', 'Lecturer']],
    body: input.courses.map((course) => [
      course.code,
      course.name,
      course.type,
      String(course.credits),
      course.lecturerName ?? '—',
    ]),
    foot: [['', 'Total', '', String(input.registeredCredits), '']],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [brand.r, brand.g, brand.b], textColor: 255 },
    footStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      3: { cellWidth: 22, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `${input.institutionName} · official course registration · page ${page} of ${pageCount}`,
      16,
      doc.internal.pageSize.getHeight() - 10,
    )
  }

  doc.save(`${safeFileName(input.studentNumber, input.semesterName)}.pdf`)
}
