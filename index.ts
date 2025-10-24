import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Resend } from "npm:resend@1.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const { email, verification_link, user_name } = await req.json()
    
    const { data, error } = await resend.emails.send({
      from: 'Zo2y <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your Zo2y Account 🍔',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; padding: 20px; }
            .container { max-width: 500px; background: white; border-radius: 12px; padding: 30px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .logo { color: #FF6F00; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
            .button { background: #FF6F00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🍔 Zo2y</div>
            <h2>Welcome to Zo2y, ${user_name}! 👋</h2>
            <p>Thanks for signing up! Click the button below to verify your email address and start exploring amazing restaurants.</p>
            
            <div style="text-align: center;">
              <a href="${verification_link}" class="button">Verify My Email</a>
            </div>
            
            <p>Or copy this link:</p>
            <p style="word-break: break-all; color: #666;">${verification_link}</p>
            
            <div class="footer">
              <p>Happy eating! 🍕</p>
              <p>The Zo2y Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true, data }), { 
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})