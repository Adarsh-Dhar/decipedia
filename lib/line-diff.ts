export type DiffLine = { kind: 'same' | 'added' | 'removed'; value: string }

export function diffLines(before: string, after: string): DiffLine[] {
  const left = before.split('\n')
  const right = after.split('\n')
  const rows = left.length + 1
  const columns = right.length + 1
  const lcs = Array.from({ length: rows }, () => new Uint32Array(columns))

  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      lcs[i][j] = left[i] === right[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      lines.push({ kind: 'same', value: left[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({ kind: 'removed', value: left[i++] })
    } else {
      lines.push({ kind: 'added', value: right[j++] })
    }
  }
  while (i < left.length) lines.push({ kind: 'removed', value: left[i++] })
  while (j < right.length) lines.push({ kind: 'added', value: right[j++] })
  return lines
}
