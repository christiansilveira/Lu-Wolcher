import { useMemo, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../state/Store'
import { BarChart, Button, Card, Field, Segmented, Stat } from '../../components/ui'
import { MONTHS, money, round2, sum, today } from '../../lib/utils'

const CATS = ['Aluguel', 'Energia', 'Água', 'Internet', 'Produtos', 'Marketing', 'Limpeza', 'Manutenção', 'Impostos', 'Outros']
const monthLabel = (m) => `${MONTHS[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`
const shift = (m, n) => { const d = new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }

export function monthFinance(data, m) {
  const sales = data.sales.filter((s) => s.date.startsWith(m))
  const services = round2(sum(sales.flatMap((s) => s.items).filter((i) => i.type === 'service' || i.type === 'extra'), (i) => i.price * i.qty))
  const products = round2(sum(sales.flatMap((s) => s.items).filter((i) => i.type === 'product'), (i) => i.price * i.qty))
  const discounts = round2(sum(sales, (s) => s.discount))
  const salesTotal = round2(sum(sales, (s) => (s.payment === 'saldo' ? 0 : s.total)))
  const club = round2(sum(data.subscriptions.filter((x) => (x.paidMonths || []).includes(m)), (x) => data.plans.find((p) => p.id === x.planId)?.price))
  const revenue = round2(salesTotal + club)
  const commissions = round2(sum(sales, (s) => s.commissionTotal))
  const expenses = data.expenses.filter((e) => e.month === m)
  const expTotal = round2(sum(expenses, (e) => e.amount))
  const profit = round2(revenue - commissions - expTotal)
  return { m, services, products, discounts, salesTotal, club, revenue, commissions, expenses, expTotal, profit, margin: revenue ? profit / revenue : 0 }
}

export default function Financeiro() {
  const { data, actions } = useStore()
  const cur = today().slice(0, 7)
  const months = Array.from({ length: 4 }, (_, i) => shift(cur, i - 3))
  const [m, setM] = useState(cur)
  const [f, setF] = useState({ category: 'Aluguel', description: '', amount: '', paidWith: '', dueDate: '', paid: true })
  const fin = useMemo(() => monthFinance(data, m), [data, m])
  const trend = months.map((x) => { const r = monthFinance(data, x); return { label: monthLabel(x), value: Math.max(0, r.profit), hint: `Lucro ${monthLabel(x)}: ${money(r.profit)}` } })

  const byCat = [...new Set([...CATS, ...fin.expenses.map((e) => e.category)])].map((c) => ({ c, v: sum(fin.expenses.filter((e) => e.category === c), (e) => e.amount) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v)
  const add = async () => {
    const amount = Number(String(f.amount).replace(',', '.'))
    if (!amount) return
    await actions.upsert('expenses', { month: f.dueDate ? f.dueDate.slice(0, 7) : m, category: f.category, description: f.description || f.category, amount, paidWith: f.paidWith, dueDate: f.dueDate || null, paid: f.paid }, 'Despesa lançada')
    setF({ ...f, description: '', amount: '' })
  }
  const copyPrev = async () => {
    const prev = data.expenses.filter((e) => e.month === shift(m, -1))
    for (const e of prev) await actions.upsert('expenses', { month: m, category: e.category, description: e.description, amount: e.amount, paidWith: e.paidWith || '' }, null)
    actions.notify(`${prev.length} despesas copiadas do mês anterior`)
  }
  const pct = (v) => (fin.revenue ? `${Math.round((v / fin.revenue) * 100)}%` : '—')

  return (
    <div>
      <div className="page-head">
        <div><p className="eyebrow">O que sobra de verdade</p><h1 className="page-title">Lucro real</h1></div>
        <Segmented value={m} onChange={setM} options={months.slice(-4).map((x) => ({ value: x, label: monthLabel(x) }))} />
      </div>

      <div className="stats">
        <Stat label="Receita total" value={money(fin.revenue)} sub={`Vendas ${money(fin.salesTotal)} · Clube ${money(fin.club)}`} />
        <Stat label="Comissões" value={money(fin.commissions)} sub={`${pct(fin.commissions)} da receita`} />
        <Stat label="Despesas" value={money(fin.expTotal)} sub={`${fin.expenses.length} lançamentos`} />
        <Stat accent label="Lucro líquido" value={money(fin.profit)} sub={`Margem ${Math.round(fin.margin * 100)}%`} />
      </div>

      {(() => {
        const hoje = new Date().toISOString().slice(0, 10)
        const bol = data.expenses.filter((e) => e.paid === false).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
        const dias = (d) => Math.round((new Date(d + 'T12:00:00') - new Date(hoje + 'T12:00:00')) / 864e5)
        return (
          <Card title={`Boletos a pagar · ${bol.length} · ${money(sum(bol, (e) => e.amount))}`} className="mt">
            {!bol.length && <p className="muted small">Nenhum boleto em aberto. Lance a despesa com Situação "A pagar".</p>}
            {bol.map((e) => { const d = e.dueDate ? dias(e.dueDate) : null; const cor = d === null ? '' : d < 0 ? '#b42318' : d <= 3 ? '#b54708' : ''; return (
              <div key={e.id} className="appt-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--v-line, #eee)' }}>
                <span style={{ flex: 1 }}><b>{e.description}</b><br /><small className="muted">{e.category}{e.paidWith ? ` · ${e.paidWith}` : ''}</small></span>
                <span style={{ color: cor, fontWeight: 700, minWidth: 120, textAlign: 'right' }}>{e.dueDate ? e.dueDate.split('-').reverse().join('/') : 'sem data'}{d !== null && <small style={{ display: 'block', fontWeight: 400 }}>{d < 0 ? `vencido há ${-d} dia(s)` : d === 0 ? 'vence hoje' : `em ${d} dia(s)`}</small>}</span>
                <b style={{ minWidth: 90, textAlign: 'right' }}>{money(e.amount)}</b>
                <Button size="sm" variant="ghost" onClick={() => actions.upsert('expenses', { ...e, paid: true }, 'Boleto pago')}>Pago</Button>
              </div>) })}
          </Card>
        )
      })()}
      <Card title="Para onde vai cada R$ 100" className="mt">
        <div className="split-bar" role="img" aria-label="Divisão da receita">
          {[['Comissões', fin.commissions, 'c1'], ['Despesas', fin.expTotal, 'c2'], ['Lucro', Math.max(0, fin.profit), 'c3']].map(([l, v, k]) => (
            fin.revenue > 0 && v > 0 ? <div key={l} className={`split ${k}`} style={{ flex: v }}><b>{l}</b><span>R$ {Math.round((v / fin.revenue) * 100)}</span></div> : null
          ))}
        </div>
        <p className="muted small mt-sm">Descontos concedidos no mês: {money(fin.discounts)} (Clube, fidelidade, aniversário e promoções).</p>
      </Card>

      <div className="grid-2">
        <Card title={`Despesas · ${monthLabel(m)}`} action={<Button variant="ghost" size="sm" icon={Copy} onClick={copyPrev}>Copiar do mês anterior</Button>}>
          <div className="exp-form">
            <Field label="Categoria"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Descrição"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex.: conta de luz" /></Field>
            <Field label="Valor (R$)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Pago com / conta"><input list="pagocom" value={f.paidWith} onChange={(e) => setF({ ...f, paidWith: e.target.value })} placeholder="Ex.: Cartão Caixa" /><datalist id="pagocom">{[...new Set([...data.expenses.map((x) => x.paidWith).filter(Boolean), 'Pix', 'Dinheiro', 'Boleto', 'Cartão Caixa', 'Conta Caixa'])].map((o) => <option key={o} value={o} />)}</datalist></Field>
            <Field label="Vencimento"><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
            <Field label="Situação"><select value={f.paid ? 'pago' : 'apagar'} onChange={(e) => setF({ ...f, paid: e.target.value === 'pago' })}><option value="pago">Pago</option><option value="apagar">A pagar (boleto)</option></select></Field>
            <Button icon={Plus} onClick={add}>Lançar</Button>
          </div>
          <div className="list compact mt">
            {fin.expenses.map((e) => (
              <div key={e.id} className="sale-row">
                <span className="appt-info"><b>{e.description}</b><small>{e.category}{e.paidWith ? ` · ${e.paidWith}` : ''}{e.dueDate ? ` · vence ${e.dueDate.split('-').reverse().join('/')}` : ''}</small></span>
                <b>{money(e.amount)}</b>
                <button className="icon-btn sm" onClick={() => actions.remove('expenses', e.id, 'Despesa removida')} aria-label="Remover"><Trash2 size={15} /></button>
              </div>
            ))}
            {!fin.expenses.length && <p className="muted small">Nenhuma despesa lançada neste mês.</p>}
          </div>
        </Card>
        <div className="stack">
          <Card title="Lucro dos últimos meses"><BarChart data={trend} height={180} /></Card>
          <Card title="Despesas por categoria">
            {byCat.map((x) => (
              <div key={x.c} className="rank"><div className="rank-top"><span>{x.c}</span><b>{money(x.v)} · {fin.expTotal ? Math.round((x.v / fin.expTotal) * 100) : 0}%</b></div><div className="rank-track"><div className="rank-fill" style={{ width: `${(x.v / (byCat[0]?.v || 1)) * 100}%` }} /></div></div>
            ))}
            {!byCat.length && <p className="muted small">Sem despesas.</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
