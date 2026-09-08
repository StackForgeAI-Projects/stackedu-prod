import { describe, expect, it } from 'vitest'
import { migrationsFolder } from '../src/db/migration-paths'
import { existsSync } from 'node:fs'
import path from 'node:path'

describe('migration paths', () => {
  it('resolves institution migration folder for the API package layout', () => {
    const folder = migrationsFolder('institution')
    expect(existsSync(folder)).toBe(true)
    expect(existsSync(path.join(folder, '0004_fee_item_due_date.sql'))).toBe(true)
  })
})
