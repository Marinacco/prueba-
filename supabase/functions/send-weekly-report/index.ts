import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get email settings
    const { data: emailSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'weekly_report_email')
      .single()

    const { data: enabledSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'weekly_report_enabled')
      .single()

    const email = emailSetting?.value
    const enabled = enabledSetting?.value === 'true'

    if (!enabled || !email) {
      return new Response(JSON.stringify({ message: 'Weekly report disabled or no email configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get cases with case_lawyers
    const { data: cases } = await supabase
      .from('cases')
      .select('*, case_lawyers(*, lawyer:lawyers(name))')

    const lawyerMap = new Map<string, { name: string; contracted: number; commissions: number; commissionsPaid: number; cases: number; cobrado: number }>()

    for (const c of (cases || [])) {
      for (const cl of (c.case_lawyers || [])) {
        const lid = cl.lawyer_id
        const lname = cl.lawyer?.name || '—'
        const prev = lawyerMap.get(lid) || { name: lname, contracted: 0, commissions: 0, commissionsPaid: 0, cases: 0, cobrado: 0 }
        prev.contracted += Number(c.total_amount || 0)
        prev.commissions += Number(cl.commission_amount || 0)
        if (cl.commission_paid) prev.commissionsPaid += Number(cl.commission_amount || 0)
        prev.cases += 1
        prev.cobrado += Number(c.total_amount || 0) - Number(cl.commission_amount || 0)
        lawyerMap.set(lid, prev)
      }
    }

    const ranking = Array.from(lawyerMap.values()).sort((a, b) => b.contracted - a.contracted)
    const fmt = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(v)

    const totals = ranking.reduce((acc, l) => ({
      contracted: acc.contracted + l.contracted,
      commissions: acc.commissions + l.commissions,
      commissionsPaid: acc.commissionsPaid + l.commissionsPaid,
      cases: acc.cases + l.cases,
      cobrado: acc.cobrado + l.cobrado,
    }), { contracted: 0, commissions: 0, commissionsPaid: 0, cases: 0, cobrado: 0 })

    // Build HTML table
    const rows = ranking.map((l, i) => `
      <tr style="border-bottom:1px solid #e5e5e5;">
        <td style="padding:8px;text-align:center;">${i + 1}</td>
        <td style="padding:8px;">${l.name}</td>
        <td style="padding:8px;text-align:center;">${l.cases}</td>
        <td style="padding:8px;text-align:right;">${fmt(l.contracted)}</td>
        <td style="padding:8px;text-align:right;">${fmt(l.commissions)}</td>
        <td style="padding:8px;text-align:right;">${fmt(l.commissionsPaid)}</td>
        <td style="padding:8px;text-align:right;">${fmt(l.cobrado)}</td>
      </tr>
    `).join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
        <h2 style="color:#292524;">Reporte Semanal de Rendimiento</h2>
        <p style="color:#78716c;font-size:14px;">Generado: ${new Date().toLocaleDateString('es-MX')}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#292524;color:#fff;">
              <th style="padding:10px;">#</th>
              <th style="padding:10px;text-align:left;">Profesional</th>
              <th style="padding:10px;">Casos</th>
              <th style="padding:10px;text-align:right;">Contratado</th>
              <th style="padding:10px;text-align:right;">Comisiones</th>
              <th style="padding:10px;text-align:right;">Com. Pagadas</th>
              <th style="padding:10px;text-align:right;">Cobrado Neto</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f5f5f4;font-weight:bold;">
              <td style="padding:10px;" colspan="2">TOTALES</td>
              <td style="padding:10px;text-align:center;">${totals.cases}</td>
              <td style="padding:10px;text-align:right;">${fmt(totals.contracted)}</td>
              <td style="padding:10px;text-align:right;">${fmt(totals.commissions)}</td>
              <td style="padding:10px;text-align:right;">${fmt(totals.commissionsPaid)}</td>
              <td style="padding:10px;text-align:right;">${fmt(totals.cobrado)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LexPro <onboarding@resend.dev>',
        to: [email],
        subject: `Reporte Semanal de Rendimiento — ${new Date().toLocaleDateString('es-MX')}`,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(`Resend error: ${JSON.stringify(result)}`)
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending weekly report:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
