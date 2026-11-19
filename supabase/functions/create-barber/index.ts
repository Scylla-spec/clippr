import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

interface CreateBarberPayload {
  email?: string
  password?: string
  fullName?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || ''
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }

  // If ALLOWED_ORIGINS is empty (dev) or origin matches the allowlist, reflect it
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing required environment keys in create-barber function')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Verify caller identity and admin role using their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await userClient.auth.getUser()

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Invalid or expired caller token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify admin role in profiles table
    const { data: callerProfile, error: profileCheckError } = await userClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', callerUser.id)
      .single()

    if (
      profileCheckError ||
      !callerProfile ||
      callerProfile.role !== 'admin' ||
      !callerProfile.is_active
    ) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: caller must be an active administrator' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 2. Parse and validate body
    let body: CreateBarberPayload
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, fullName } = body

    if (
      !email ||
      typeof email !== 'string' ||
      !EMAIL_REGEX.test(email.trim()) ||
      email.trim().length > 255
    ) {
      return new Response(
        JSON.stringify({ error: 'A valid email address under 255 characters is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (
      !fullName ||
      typeof fullName !== 'string' ||
      fullName.trim().length < 1 ||
      fullName.trim().length > 100
    ) {
      return new Response(
        JSON.stringify({ error: 'Full name must be between 1 and 100 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return new Response(
        JSON.stringify({ error: 'Password must be between 8 and 72 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedFullName = fullName.trim()

    // 3. Use admin service role client to create barber auth user
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: createdAuth, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedFullName,
        role: 'barber',
      },
    })

    if (createError || !createdAuth.user) {
      const errMsg = createError?.message ?? ''
      if (
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('registered') ||
        errMsg.toLowerCase().includes('exists')
      ) {
        return new Response(
          JSON.stringify({ error: 'A user with this email address already exists' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      console.error('Failed to create auth user:', createError)
      return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Ensure profile row exists with barber role and active status
    const { data: profile, error: upsertError } = await adminClient
      .from('profiles')
      .upsert({
        id: createdAuth.user.id,
        full_name: trimmedFullName,
        role: 'barber',
        is_active: true,
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Failed to upsert barber profile:', upsertError)
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(createdAuth.user.id)
      if (cleanupError) {
        console.error('Failed to clean up auth user after profile creation failed:', cleanupError)
      }
      return new Response(JSON.stringify({ error: 'Failed to create barber profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Barber created successfully',
        barber: profile,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Unhandled server error in create-barber:', err)
    return new Response(JSON.stringify({ error: 'An unexpected internal error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
