import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { google } from 'googleapis'

// Configure Google API timeout
const GOOGLE_API_TIMEOUT = 60000 // 60 seconds

// Initialize KV client
let kvClient: typeof kv | null = null
try {
  // Check if KV environment variables are set
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kvClient = kv
  } else {
    console.warn('Vercel KV environment variables not set, rate limiting will be disabled')
  }
} catch (error) {
  console.warn('Vercel KV not initialized:', error)
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10 // seconds
const RATE_LIMIT_MAX_REQUESTS = 2

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW * 1000

  try {
    // Check if KV is available
    if (!kvClient) {
      console.warn('Vercel KV not available, skipping rate limit')
      return {
        success: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - 1,
        reset: now + RATE_LIMIT_WINDOW * 1000
      }
    }

    // Get all requests for this identifier within the window
    // Using ZRANGE with byScore to get only requests in the current window
    // Note: zrange returns member values (strings), not scores
    const allRequests = await kvClient.zrange(key, windowStart, now, { byScore: true, rev: false })
    
    // Convert member values (strings) to numbers and filter within the window
    // Since we use byScore, the results are already filtered, but we convert to numbers for safety
    const validRequests = (allRequests as string[])
      .map((member: string) => parseInt(member, 10))
      .filter((timestamp: number) => !isNaN(timestamp) && timestamp >= windowStart)
    
    // Count requests in the window
    const count = validRequests.length

    if (count >= RATE_LIMIT_MAX_REQUESTS) {
      // Get the oldest request to calculate reset time
      const oldestRequest = validRequests[0]
      const reset = oldestRequest + RATE_LIMIT_WINDOW * 1000
      return {
        success: false,
        remaining: 0,
        reset
      }
    }

    // Add current request timestamp
    await kvClient.zadd(key, { score: now, member: now.toString() })
    
    // Clean up old requests (remove those outside the window)
    await kvClient.zremrangebyscore(key, 0, windowStart - 1)
    
    // Set expiration for the key (cleanup after window + buffer)
    await kvClient.expire(key, RATE_LIMIT_WINDOW + 60)

    return {
      success: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - count - 1,
      reset: now + RATE_LIMIT_WINDOW * 1000
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // If KV fails, allow the request (fail open)
    return {
      success: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: now + RATE_LIMIT_WINDOW * 1000
    }
  }
}

async function appendToGoogleSheets(email: string): Promise<void> {
  // Validate environment variables
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!serviceAccountEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured')
  }

  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY is not configured')
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID is not configured')
  }

  // Process private key - handle both escaped and unescaped newlines
  const processedPrivateKey = privateKey.replace(/\\n/g, '\n')

  // Validate private key format
  if (!processedPrivateKey.includes('BEGIN PRIVATE KEY') || !processedPrivateKey.includes('END PRIVATE KEY')) {
    throw new Error('GOOGLE_PRIVATE_KEY format is invalid. It should include BEGIN PRIVATE KEY and END PRIVATE KEY markers.')
  }

  try {
    console.log('🔍 Starting Google Sheets authentication...')
    console.log('📧 Service Account Email:', serviceAccountEmail)
    console.log('🔑 Private Key Length:', privateKey.length)
    console.log('📊 Spreadsheet ID:', spreadsheetId)
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: processedPrivateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    console.log('✅ Authentication created successfully')
    
    const sheets = google.sheets({ 
      version: 'v4', 
      auth,
      timeout: GOOGLE_API_TIMEOUT
    })
    const timestamp = new Date().toISOString()

    console.log('📝 Attempting to append data...')
    console.log('📧 Email:', email)
    console.log('⏰ Timestamp:', timestamp)

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'HereNow-Wait-List!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, timestamp]],
      },
    })
    
    console.log('✅ Data appended successfully')
  } catch (error: any) {
    console.error('❌ Google Sheets Error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    // Provide more detailed error information
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      throw new Error('Failed to connect to Google API. Please check your network connection.')
    }
    if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized_client')) {
      throw new Error('Google Service Account credentials are invalid. Please check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.')
    }
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('forbidden')) {
      throw new Error('Service account does not have permission to access the Google Sheet. Please share the sheet with the service account email.')
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client identifier (IP address or email)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // Parse request body
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check rate limit (using IP address as identifier)
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

    // Check if email already exists (optional: check in Google Sheets)
    // For simplicity, we'll rely on rate limiting and let Google Sheets handle duplicates

    // Append to Google Sheets
    try {
      await appendToGoogleSheets(email.toLowerCase().trim())
    } catch (error: any) {
      console.error('Google Sheets error:', error)
      
      // Provide more specific error messages
      const errorMessage = error?.message || 'Failed to add email to waiting list'
      
      console.error('❌ Google Sheets Error Details:')
      console.error('Error Message:', errorMessage)
      console.error('Error Code:', error?.code)
      console.error('Full Error:', error)
      
      // Check if it's a configuration error (should return 500, but with helpful message)
      if (errorMessage.includes('not configured') || errorMessage.includes('invalid') || errorMessage.includes('permission')) {
        return NextResponse.json(
          { 
            error: 'Server configuration error. Please contact the administrator.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to add email to waiting list. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully added to waiting list',
        rateLimit: {
          remaining: rateLimit.remaining,
          reset: rateLimit.reset
        }
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

