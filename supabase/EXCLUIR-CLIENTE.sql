-- Excluir cliente (somente a gestão)
-- Rode uma vez no Supabase: SQL Editor → New query → cole este arquivo → Run.
--
-- O que acontece ao excluir:
--   • horários futuros ou em aberto da cliente são apagados;
--   • assinaturas do clube são apagadas;
--   • vendas, atendimentos antigos e fotos continuam nos relatórios (com o nome
--     gravado neles), apenas deixam de apontar para a ficha excluída;
--   • a ficha da cliente (e a dívida/crédito dela) é apagada.
create or replace function delete_client(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Somente a gestão pode excluir clientes'; end if;
  -- horários que ainda não aconteceram e não têm venda
  delete from photos where appointment_id in (
    select id from appointments where client_id = p_id and sale_id is null and status in ('agendado','confirmado','cancelado'));
  update sales set appointment_id = null where appointment_id in (
    select id from appointments where client_id = p_id and sale_id is null and status in ('agendado','confirmado','cancelado'));
  delete from appointments where client_id = p_id and sale_id is null and status in ('agendado','confirmado','cancelado');
  -- histórico fica, sem vínculo com a ficha
  update appointments set client_id = null where client_id = p_id;
  update sales set client_id = null where client_id = p_id;
  update photos set client_id = null where client_id = p_id;
  delete from subscriptions where client_id = p_id;
  delete from clients where id = p_id;
end $$;
grant execute on function delete_client(text) to authenticated;
