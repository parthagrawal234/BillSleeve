'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginLocalUser(formData: FormData) {
    const username = formData.get('username') as string

    // Default to 'local_user' if nothing is entered, for pure offline ease
    const finalUserId = username ? username.trim().toLowerCase().replace(/\s+/g, '_') : 'local_user'

    // Set a persistent cookie for 1 year
    const cookieStore = await cookies()
    cookieStore.set('user_id', finalUserId, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
    })

    redirect('/dashboard')
}

export async function logoutLocalUser() {
    const cookieStore = await cookies()
    cookieStore.delete('user_id')
    redirect('/')
}
