// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface BadgeUnlockedPayload {
  user_id: string
  badge_name: string
  badge_description: string
  badge_icon: string
  user_email: string
  user_name: string
}

serve(async (req) => {
  try {
    const payload: BadgeUnlockedPayload = await req.json()

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'WalkToGive <noreply@walktogive.com>',
        to: [payload.user_email],
        subject: `🎉 Badge Unlocked: ${payload.badge_name}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-radius: 12px 12px 0 0;
              }
              .badge-icon {
                font-size: 80px;
                margin-bottom: 20px;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .badge-title {
                font-size: 28px;
                font-weight: bold;
                margin: 0 0 10px 0;
              }
              .badge-desc {
                font-size: 18px;
                margin: 0 0 30px 0;
              }
              .cta-button {
                display: inline-block;
                background: #06D6A0;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="badge-icon">${payload.badge_icon}</div>
              <h1 style="margin: 0;">Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hey ${payload.user_name}!</p>

              <p style="font-size: 18px;">You've unlocked a new achievement:</p>

              <div class="badge-title">${payload.badge_name}</div>
              <div class="badge-desc">${payload.badge_description}</div>

              <p>Keep up the amazing work! Every workout brings you closer to your goals and helps make a difference for charity.</p>

              <p>Your dedication is inspiring. Stay consistent, keep moving, and continue making an impact! 💪❤️</p>

              <a href="${Deno.env.get('APP_URL') || 'https://walktogive.com'}" class="cta-button">
                View Your Progress
              </a>
            </div>
            <div class="footer">
              <p>WalkToGive - Movement Meets Purpose</p>
              <p>© 2026 WalkToGive. All rights reserved.</p>
            </div>
          </body>
          </html>
        `
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
