import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const maxImageSize = 5 * 1024 * 1024

function matchesImageSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/png') return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (type === 'image/gif') return new TextDecoder().decode(bytes.subarray(0, 6)).match(/^GIF8[79]a$/) !== null
  if (type === 'image/webp') return new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP'
  return false
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Sign in to upload article images.' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file to upload.' }, { status: 400 })
    if (!imageTypes.has(file.type)) return NextResponse.json({ error: 'Use a PNG, JPEG, WebP, or GIF image.' }, { status: 415 })
    if (file.size === 0 || file.size > maxImageSize) return NextResponse.json({ error: 'Images must be smaller than 5 MB.' }, { status: 413 })

    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    if (!matchesImageSignature(file.type, bytes)) return NextResponse.json({ error: 'The file content does not match a supported image format.' }, { status: 415 })

    const extension = file.type.split('/')[1].replace('jpeg', 'jpg')
    const blob = await put(`article-images/${user.id}/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 })
  }
}
