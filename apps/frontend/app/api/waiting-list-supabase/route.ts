import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10 // seconds
const RATE_LIMIT_MAX_REQUESTS = 2

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

// Simple in-memory rate limiting (for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW * 1000

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetTime < windowStart) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW * 1000 }
    rateLimitStore.set(identifier, entry)
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    success: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    reset: entry.resetTime
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    const rateLimit = await checkRateLimit(ip)
    
    if (!rateLimit.success) {
      const resetSeconds = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetIn: resetSeconds
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': resetSeconds.toString(),
          }
        }
      )
    }

    const supabase = createClient()
    const timestamp = new Date().toISOString()

    console.log('📝 Adding email to waiting list:', email.toLowerCase().trim())

    const { data: existingEmail, error: checkError } = await supabase
      .from('waiting_list')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingEmail) {
      console.log('⚠️ Email already exists in waiting list')
      return NextResponse.json(
        { 
          success: false,
          message: 'Email already in waiting list'
        },
        { status: 200 }
      )
    }

    const { data, error } = await supabase
      .from('waiting_list')
      .insert({
        email: email.toLowerCase().trim(),
        created_at: timestamp
      })
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to add email to waiting list. Please try again later.' },
        { status: 500 }
      )
    }

    console.log('✅ Email added successfully:', email.toLowerCase().trim())

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully added to waiting list'
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
