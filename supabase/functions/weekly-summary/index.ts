// Weekly Summary Email Edge Function
// Sends weekly progress emails to users

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WeeklySummaryPayload {
  user_id?: string // If provided, send to specific user. Otherwise, send to all users.
}

serve(async (req) => {
  try {
    const payload: WeeklySummaryPayload = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get users to send summaries to
    let usersQuery = supabase
      .from('profiles')
      .select('id, display_name')
      .limit(100)

    if (payload.user_id) {
      usersQuery = usersQuery.eq('id', payload.user_id)
    }

    const { data: profiles, error: profilesError } = await usersQuery

    if (profilesError) throw profilesError

    const results = []

    for (const profile of profiles) {
      // Get user's auth data for email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id)
      if (userError || !user) continue

      // Get workout stats for the week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { count: workoutCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('completed', true)
        .gte('completed_at', oneWeekAgo.toISOString())

      // Get weekly rewards
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const currentWeek = Math.ceil(new Date().getDate() / 7)

      const { data: rewards } = await supabase
        .from('weekly_rewards')
        .select('amount')
        .eq('user_id', profile.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('week_number', currentWeek)

      const weeklyEarning = rewards && rewards.length > 0 ? rewards[0].amount : 0

      // Get total earnings
      const { data: allRewards } = await supabase
        .from('weekly_rewards')
        .select('amount')
        .eq('user_id', profile.id)

      const totalEarned = allRewards?.reduce((sum, r) => sum + r.amount, 0) || 0

      // Send email
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'WalkToGive <noreply@walktogive.com>',
          to: [user.email],
          subject: `📊 Your Weekly Progress - ${workoutCount}/7 Days!`,
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
                  background: #f4f4f4;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                  background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%);
                  color: white;
                  padding: 40px 20px;
                  text-align: center;
                }
                .content {
                  padding: 30px;
                }
                .stat-box {
                  background: #f8f9fa;
                  border-left: 4px solid #06D6A0;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 8px;
                }
                .stat-number {
                  font-size: 48px;
                  font-weight: bold;
                  color: #FF6B35;
                  margin: 0;
                }
                .stat-label {
                  font-size: 18px;
                  color: #666;
                  margin: 5px 0 0 0;
                }
                .progress-bar {
                  background: #e0e0e0;
                  height: 30px;
                  border-radius: 15px;
                  overflow: hidden;
                  margin: 20px 0;
                }
                .progress-fill {
                  background: linear-gradient(90deg, #06D6A0, #00B894);
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
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
                  padding: 20px;
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Your Weekly Summary</h1>
                  <p style="margin: 10px 0 0 0;">Keep up the amazing work, ${profile.display_name}!</p>
                </div>
                <div class="content">
                  <h2>This Week's Progress</h2>

                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(workoutCount || 0) / 7 * 100}%">
                      ${workoutCount || 0}/7 Days
                    </div>
                  </div>

                  ${weeklyEarning > 0 ? `
                    <div class="stat-box">
                      <p class="stat-number">$${weeklyEarning}</p>
                      <p class="stat-label">🎉 Earned This Week!</p>
                    </div>
                  ` : `
                    <p style="font-size: 16px; color: #666;">
                      Complete ${7 - (workoutCount || 0)} more ${7 - (workoutCount || 0) === 1 ? 'day' : 'days'} this week to earn your reward!
                    </p>
                  `}

                  <div class="stat-box">
                    <p class="stat-number">$${totalEarned}</p>
                    <p class="stat-label">Total Earned for Charity</p>
                  </div>

                  <p style="font-size: 16px;">
                    ${workoutCount === 7 ?
                      "🌟 Incredible! You completed every single workout this week!" :
                      workoutCount && workoutCount >= 4 ?
                      "💪 You're doing great! Keep pushing to complete the week!" :
                      "🏃‍♀️ You've got this! Every workout counts - let's finish strong!"
                    }
                  </p>

                  <a href="${Deno.env.get('APP_URL') || 'https://walktogive.com'}" class="cta-button">
                    View Full Progress
                  </a>
                </div>
                <div class="footer">
                  <p>WalkToGive - Movement Meets Purpose</p>
                  <p>© 2026 WalkToGive. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        }),
      })

      const emailData = await emailRes.json()
      results.push({ user_id: profile.id, email: user.email, result: emailData })
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
