/**
 * LU WOLCHER ESTÉTICA AVANÇADA — configuração white-label
 * ------------------------------------------------------------
 * Sistema Astrovia (agendamento + gestão). Logo em src/assets:
 * icon.jpg (redonda), mark.png (logo com fundo transparente),
 * mark-light.png (versão clara para o tema escuro) e banner.jpg.
 * Serviços, equipe, horários e mensagens são editados no painel.
 */
import logo from '../assets/icon.jpg'
import mark from '../assets/mark.png'
import markLight from '../assets/mark-light.png'
import banner from '../assets/banner.jpg'

export const BRAND = {
  appName: 'Lu Wolcher Estética Avançada',
  shopName: 'Lu Wolcher Estética Avançada',
  wordmark: 'Lu Wolcher',
  tagline: 'estética avançada',
  heroText: 'Cuidado, técnica e carinho em cada detalhe. Reserve seu horário em poucos toques.',
  logo,
  mark,
  markLight,
  banner,
  colors: {
    primary: '#1B2A63',      // azul-marinho da logo Lu Wolcher
    primaryDark: '#141F52',
    rose: '#DDB9B5',         // rosé suave
    paper: '#FBF7F6',        // pérola
  },
  // PIN da proprietária no modo demonstração (no Supabase o login é por e-mail/senha)
  demoAdminPin: '1234',
}

/** As cores da marca vêm do CSS (camada Lu Wolcher no fim de styles.css) */
export function applyBrandColors() {}
