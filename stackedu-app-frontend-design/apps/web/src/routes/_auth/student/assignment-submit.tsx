import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  ChevronRight, Upload, X, CheckCircle2, AlertTriangle, FileText,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/assignment-submit')({
  component: AssignmentSubmitPage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Mock assignment ───────────────────────────────────────────────────────────

const ASSIGNMENT = {
  title:      'Assignment 3 — Algorithm Design',
  course:     'Introduction to Computer Science (CSC 101)',
  dueDate:    '01 Nov 2024',
  dueIsSoon:  false,  // set true to show the 24-hour warning
  description: `Design and implement a solution for the following problems:

1. Write a pseudocode algorithm to find the largest element in an unsorted array of n integers. Analyse the time complexity of your algorithm.

2. Trace through a binary search algorithm step-by-step for the target value 47 in the sorted array: [3, 9, 15, 22, 31, 40, 47, 58, 72, 88].

3. Compare the time complexities of linear search vs binary search. Under what circumstances would you choose one over the other?

Submit your solutions as a single PDF or Word document. Clearly label each question. Show all working.`,
}

// ─────────────────────────────────────────────────────────────────────────────

function AssignmentSubmitPage() {
  const [file, setFile]           = useState<File | null>(null)
  const [notes, setNotes]         = useState('')
  const [dragging, setDragging]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip']
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|zip)$/i)) return
    if (f.size > 10 * 1024 * 1024) return   // 10 MB cap
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file || loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Submit Assignment"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 animate-fade-up">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 t-caption" style={{ color: 'var(--muted-foreground)' }}>
          <Link to="/student/courses" className="hover:underline" style={{ color: 'var(--muted-foreground)' }}>
            My Courses
          </Link>
          <ChevronRight style={{ width: 12, height: 12 }} />
          <span style={{ color: 'var(--foreground)' }}>Submit Assignment</span>
        </nav>

        {/* Section header */}
        <div className="mb-8">
          <h1
            className="t-h1 mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
          >
            {ASSIGNMENT.title}
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {ASSIGNMENT.course} · Due {ASSIGNMENT.dueDate}
          </p>
        </div>

        {/* Centred card */}
        <div
          className="mx-auto"
          style={{
            maxWidth: 680,
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            padding: 32,
          }}
        >
          {/* Success state */}
          {submitted ? (
            <SuccessState />
          ) : (
            <>
              {/* Assignment description */}
              <div className="mb-6">
                <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>ASSIGNMENT BRIEF</p>
                <div
                  className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-line"
                  style={{
                    backgroundColor: 'var(--muted)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    lineHeight: 1.7,
                  }}
                >
                  {ASSIGNMENT.description}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'var(--border)', marginBottom: 24 }} />

              {/* 24-hour deadline warning */}
              {ASSIGNMENT.dueIsSoon && (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm mb-5"
                  style={{
                    backgroundColor: 'var(--warning-bg)',
                    border: '1px solid var(--warning)',
                    color: 'var(--warning)',
                  }}
                  role="alert"
                >
                  <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>
                    <strong>Due in less than 24 hours.</strong> Submit before {ASSIGNMENT.dueDate} to avoid a late penalty.
                  </span>
                </div>
              )}

              {/* File upload */}
              <div className="mb-6">
                <Label className="mb-2 block">
                  Submission file <span style={{ color: 'var(--error)' }}>*</span>
                </Label>
                <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Accepted: PDF, DOC, DOCX, ZIP — max 10 MB
                </p>

                {file ? (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ border: '1px solid var(--success)', backgroundColor: 'var(--success-bg)' }}
                  >
                    <FileText style={{ width: 18, height: 18, color: 'var(--success)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--success)' }}>{file.name}</p>
                      <p className="t-caption" style={{ color: 'var(--success)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="flex-shrink-0 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--success)' }}
                      aria-label="Remove file"
                    >
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-10 px-6 rounded-lg cursor-pointer transition-colors duration-150"
                    style={{
                      border: `2px dashed ${dragging ? 'var(--brand)' : 'var(--border)'}`,
                      backgroundColor: dragging ? 'rgba(32,244,78,0.04)' : 'rgba(32,244,78,0.01)',
                    }}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragging(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) handleFile(f)
                    }}
                  >
                    <Upload style={{ width: 24, height: 24, color: 'var(--muted-foreground)', marginBottom: 10 }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                      Click to upload or drag and drop
                    </p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                      PDF, DOC, DOCX, ZIP — max 10 MB
                    </p>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              {/* Notes to lecturer */}
              <div className="mb-8">
                <Label htmlFor="notes" className="mb-2 block">
                  Notes to lecturer <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments for your lecturer…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting…
                    </span>
                  ) : (
                    'Submit Assignment'
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={loading}
                  className="font-semibold"
                >
                  Save draft
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Success state
// ─────────────────────────────────────────────────────────────────────────────

function SuccessState() {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div
        className="flex items-center justify-center rounded-2xl mb-5"
        style={{ width: 64, height: 64, backgroundColor: 'var(--success-bg)' }}
      >
        <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--success)' }} />
      </div>
      <h2
        className="t-h2 mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
      >
        Submitted successfully
      </h2>
      <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 400 }}>
        Your assignment has been submitted to Dr. Emmanuel Nkurunziza. You will receive feedback once it has been graded.
      </p>
      <div
        className="flex items-start gap-3 w-full px-4 py-3 rounded-lg text-sm mb-6"
        style={{
          backgroundColor: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: 'var(--success)',
          textAlign: 'left',
        }}
        role="alert"
      >
        <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
        Assignment submitted successfully — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="flex gap-3">
        <Link to="/student/courses">
          <Button variant="outline">Back to My Courses</Button>
        </Link>
        <Link to="/student/courses">
          <Button>My Courses</Button>
        </Link>
      </div>
    </div>
  )
}


