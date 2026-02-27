import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  // Get request path
  const pathname = request.nextUrl.pathname

  // Protected routes: all routes under /(main)/*
  // Note: Route group (main) doesn't appear in URL, so actual paths are /home, /create/*, /manager/*, etc.
  const protectedPaths = [
    '/home',
    '/create',
    '/manager',
    // Add more protected routes as needed
  ]

  // Check if it's a protected path or activate page
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  const isActivatePage = pathname === '/activate'

  // If not a protected path or activate page, allow access
  if (!isProtectedPath && !isActivatePage) {
    return NextResponse.next()
  }

  // Create Supabase client (for Edge Runtime)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    // If environment variables are missing, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Create response object for setting cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set cookie in middleware
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove cookie in middleware
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to home
  if (!session) {
    const redirectUrl = new URL('/', request.url)
    // Can add redirect parameter to jump back after login
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in, check profile status
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', session.user.id)
    .single()

  type ProfileStatus = Database['public']['Tables']['profiles']['Row']['status']
  const isPending = (profile as { status: ProfileStatus } | null)?.status === 'pending'

  // 1. If status is Pending and not on activate page -> redirect to activate page
  if (isPending && !isActivatePage && isProtectedPath) {
    return NextResponse.redirect(new URL('/activate', request.url))
  }

  // 2. If status is Active (not pending) and trying to access activate page -> redirect to home
  if (!isPending && isActivatePage) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Allow access
  return response
}

// Configure middleware matching routes
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (files in public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

