import type { ThemeConfig } from 'antd'
import { cores, comOpacidade, fontes } from './cores'

export const sombraCard = '0 1px 2px rgba(23, 40, 57, 0.04), 0 1px 3px rgba(23, 40, 57, 0.03)'

export const tema: ThemeConfig = {
  token: {
    colorPrimary: cores.primaria,
    colorInfo: cores.primaria,
    colorLink: cores.primaria,
    colorSuccess: cores.sucesso,
    colorWarning: cores.aviso,
    colorError: cores.erro,

    colorBgLayout: cores.fundo,
    colorBgContainer: cores.card,
    colorText: cores.texto,
    colorTextHeading: cores.texto,
    colorTextSecondary: cores.textoSecundario,
    colorBorder: cores.borda,
    colorBorderSecondary: cores.borda,

    borderRadius: 12,
    borderRadiusLG: 20,
    fontFamily: fontes.corpo,
  },
  components: {
    Layout: {
      bodyBg: cores.fundo,
      siderBg: cores.card,
      lightSiderBg: cores.card,
      headerBg: 'transparent',
    },
    Menu: {
      itemBg: 'transparent',
      itemHeight: 44,
      itemBorderRadius: 16,
      itemMarginInline: 0,
      itemMarginBlock: 4,
      itemColor: cores.textoSecundario,
      itemHoverColor: cores.texto,
      itemHoverBg: cores.fundoSuave,
      itemActiveBg: comOpacidade(cores.teal, 0.15),
      itemSelectedBg: comOpacidade(cores.teal, 0.15),
      itemSelectedColor: cores.teal,
      activeBarBorderWidth: 0,
    },
    Card: {
      colorBorderSecondary: cores.borda,
      borderRadiusLG: 20,
    },
  },
}
