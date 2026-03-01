'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function loginLocalUser(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        throw new Error("Username and password are required")
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })

        if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.detail || "Login failed")
        }

        const data = await res.json()

        // Next.js needs to set the cookie explicitly for the browser, 
        // since the FastAPI server's Set-Cookie header won't cross the Docker network 
        // boundary correctly to the user's browser in dev mode without a reverse proxy.
        const cookieStore = await cookies()
        cookieStore.set('access_token', `Bearer ${data.access_token}`, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })

    } catch (e: any) {
        console.error("Login Error:", e.message)
        throw e // Let the UI handle the display
    }

    redirect('/dashboard')
}

export async function registerLocalUser(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        throw new Error("Username and password are required")
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })

        if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.detail || "Registration failed")
        }

        const data = await res.json()

        // Auto-login after registration
        const cookieStore = await cookies()
        cookieStore.set('access_token', `Bearer ${data.access_token}`, {
            maxAge: 60 * 60 * 24 * 7,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })

    } catch (e: any) {
        console.error("Registration Error:", e.message)
        throw e
    }

    redirect('/dashboard')
}

export async function logoutLocalUser() {
    const cookieStore = await cookies()
    cookieStore.delete('access_token')
    redirect('/')
}
