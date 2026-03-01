import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // If no user_id cookie is present, redirect to the login page
    const userId = request.cookies.get('user_id')?.value

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!userId) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*'],
}
