# GeoNode Stitch Worklog

## Objetivo

Modernizar a interface do GeoNode 4.4.3 baseado nos protótipos HTML gerados no Stitch, sem perder o comportamento existente da integração GeoNode + MapStore.

## Estrutura analisada inicialmente

### Frontend customizado do GeoNode

- `geonode_mapstore_client/client/js`
- `geonode_mapstore_client/client/themes/geonode`

### Entradas principais da aplicação

- `geonode_mapstore_client/client/js/apps/gn-catalogue.js`
- `geonode_mapstore_client/client/js/apps/gn-map.js`
- `geonode_mapstore_client/client/js/apps/gn-components.js`

### Rotas principais

- `geonode_mapstore_client/client/js/routes/Catalogue.jsx`
- `geonode_mapstore_client/client/js/routes/Viewer.jsx`
- `geonode_mapstore_client/client/js/routes/MapViewer.jsx`

### Componentes-base relevantes para redesign

- `geonode_mapstore_client/client/js/components/ViewerLayout/ViewerLayout.jsx`
- `geonode_mapstore_client/client/js/components/Menu/Menu.js`
- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`

### Tema e estilos principais

- `geonode_mapstore_client/client/themes/geonode/theme.less`
- `geonode_mapstore_client/client/themes/geonode/less/_variables.less`
- `geonode_mapstore_client/client/themes/geonode/less/geonode.less`
- `geonode_mapstore_client/client/themes/geonode/ui_zalf/zalf.less`

## Protótipos Stitch identificados

### Catálogo

- `geonode_stitch/resource_detail_view/catalog_list_zalf_light/code.html`
- `geonode_stitch/resource_detail_view/catalog_list_zalf_dark/code.html`
- `geonode_stitch/catalogue_home_zalf_light/code.html`

### Detalhe de recurso

- `geonode_stitch/resource_detail_zalf_light/code.html`
- `geonode_stitch/resource_detail_zalf_dark/code.html`
- `geonode_stitch/resource_detail_view/code.html`

## Estratégia definida

1. Não colar o HTML inteiro do Stitch.
2. Converter o visual para os componentes reais do projeto.
3. Preservar busca, filtros, paginação, permissões, favoritos e navegação atuais.
4. Fazer primeiro o catálogo e depois a tela de detalhe do recurso.

## Histórico de execução

### Etapa 1 - Mapeamento inicial

Status: concluída

Foi feito o levantamento da arquitetura da MapStore customizada do GeoNode, incluindo:

- apps de entrada
- rotas principais
- plugins usados no catálogo e viewer
- componentes-base de UI
- arquivos LESS responsáveis pela identidade visual

### Etapa 2 - Seleção dos protótipos Stitch

Status: concluída

Protótipos escolhidos como referência principal:

- catálogo: `geonode_stitch/resource_detail_view/catalog_list_zalf_light`
- detalhe de recurso: `geonode_stitch/resource_detail_zalf_light`

### Etapa 3 - Primeira implementação do catálogo

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/js/components/FiltersMenu/FiltersMenu.jsx`
- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`
- `geonode_mapstore_client/client/themes/geonode/less/_card-grid.less`
- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`
- `geonode_mapstore_client/client/themes/geonode/less/_filter-form.less`
- `geonode_mapstore_client/client/themes/geonode/less/_menu.less`

Principais mudanças:

- sidebar fixa de filtros no desktop
- cabeçalho interno do catálogo mais próximo do Stitch
- cards com visual mais arredondado e destacado
- menu de ordenação e contagem de resultados modernizado
- responsividade básica do novo layout

Validação executada:

- `eslint js/plugins/ResourcesGrid.jsx js/components/FiltersMenu/FiltersMenu.jsx js/components/ResourceCard/ResourceCard.jsx`

Resultado:

- sem erros de lint nos JSX alterados

### Etapa 4 - Primeira implementação da tela de detalhe do recurso

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Principais mudanças:

- composição da tela reorganizada para preview grande + card lateral de metadata
- ações principais posicionadas abaixo do preview
- card lateral com pills de contexto, owner, abstract e datas
- abas inferiores reestilizadas para se aproximar do layout Stitch
- blocos internos de informação convertidos para cartões visuais mais modernos

Validação executada:

- `eslint js/components/DetailsPanel/DetailsPanel.jsx`

Resultado:

- sem erros de lint no JSX alterado

### Etapa 5 - Correção de largura do catálogo no embed Django

Status: concluída

Arquivo alterado:

- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

Problema corrigido:

- o catálogo modernizado estava ficando comprimido no centro da tela quando renderizado dentro do layout Django/GeoNode

Ajuste aplicado:

- remoção de limites de largura no layout moderno do catálogo
- forçado uso de largura total útil do container embutido
- ajuste de `gn-grid-container` e `gn-card-grid-container` para ocupar 100% da área disponível

### Etapa 6 - Mudança de arquitetura do detail no catálogo

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

Decisão tomada:

- o catálogo deixa de abrir o detalhe de recurso em overlay lateral
- quando um recurso é selecionado, o detalhe passa a ocupar a área principal como página completa dentro do fluxo do catálogo

Objetivo:

- aproximar o comportamento do layout Stitch para catálogo + detalhe
- permitir detalhe com mapa/embed em composição de página e não de painel comprimido

Validação executada:

- `eslint js/plugins/ResourcesGrid.jsx`

Resultado:

- sem erros de lint no JSX alterado

### Etapa 7 - Refino responsivo para telas grandes

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Problema corrigido:

- catálogo e detail estavam ocupando largura excessiva em monitores grandes

Ajuste aplicado:

- containers centrais com `max-width`
- detalhe com largura máxima controlada
- sidebar e área principal com proporções mais estáveis
- preservação da adaptação para telas menores

### Etapa 8 - Cards Stitch + sidebar Topics

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

Mudanças aplicadas:

- remoção do botão `View` dos cards
- manutenção do card clicável para abrir o detail no fluxo do catálogo
- sidebar com seção `Topics` baseada na mesma lista do menu Django
- inclusão de ícones para os tópicos
- refinamento visual da sidebar para ficar mais próxima do Stitch

Validação executada:

- `eslint js/plugins/ResourcesGrid.jsx js/components/ResourceCard/ResourceCard.jsx`

Resultado:

- sem erros de lint

### Etapa 9 - Grid fixo de 3 colunas

Status: concluída

Arquivo alterado:

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`

Mudança aplicada:

- catálogo travado em modo `grid`
- removida a alternância entre lista e colunas
- comportamento alinhado ao layout de cards do Stitch

Validação executada:

- `eslint js/plugins/ResourcesGrid.jsx`

Resultado:

- sem erros de lint

### Etapa 10 - Correção do breakpoint do grid

Status: concluída

Arquivo alterado:

- `geonode_mapstore_client/client/themes/geonode/less/_card-grid.less`

Problema corrigido:

- os cards ainda estavam caindo para 2 colunas em larguras onde o layout deveria permanecer em 3 colunas

Ajuste aplicado:

- redução do breakpoint que troca de 3 para 2 colunas

### Etapa 11 - Tipografia e espaçamento dos cards alinhados ao Stitch

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`
- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

Mudanças aplicadas:

- redução dos tamanhos tipográficos que estavam maiores que o protótipo
- ajuste do título interno do catálogo para a escala visual do Stitch
- cards com radius, sombra e espaçamento interno mais próximos do HTML de referência
- título e resumo dos cards com clamp em duas linhas
- refinamento visual da data, rodapé e badge de tipo

Validação executada:

- revisão do HTML de referência em `geonode_stitch/catalog_list_zalf_light/code.html`

Resultado:

- catálogo mais próximo do Stitch em hierarquia tipográfica e ritmo visual

### Etapa 12 - Hover, datas e respiro do bloco de ações

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`
- `geonode_mapstore_client/client/themes/geonode/less/_menu.less`
- `geonode_mapstore_client/client/themes/geonode/less/_base.less`

Mudanças aplicadas:

- inclusão explícita de data de publicação no card
- exibição adicional de data de atualização quando diferente da publicação
- animação de hover aproximada ao Stitch com zoom da thumbnail e destaque do título
- ajuste fino do espaçamento entre descrição, divisor e rodapé do autor
- aumento do espaço abaixo do bloco de contagem, ações e ordenação

### Etapa 13 - All Data em Topics e data principal do card

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`

Mudanças aplicadas:

- inclusão de `All Data` como primeiro item da navegação `Topics`
- `All Data` agora limpa o filtro textual e volta a mostrar todos os recursos
- card simplificado para mostrar uma única data principal no formato do Stitch
- priorização da data de criação no card, com fallback para a data de publicação

### Etapa 14 - Correção do alinhamento do botão Add Resource

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/_menu.less`

Mudanças aplicadas:

- `gn-content-responsive` convertido para layout horizontal
- prevenção de quebra de linha entre texto e ícone
- ícone do botão `Add Resource` mantido na lateral do texto

### Etapa 15 - Reorganização da barra de ações e fallback de data do card

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/FiltersMenu/FiltersMenu.jsx`
- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_menu.less`

Mudanças aplicadas:

- separação da barra em bloco de contagem e bloco de ações
- `Add Resource` e ordenação alinhados como grupo lateral
- mais padding horizontal no botão `Add Resource`
- fallback de data do card ampliado para `create_date` e `last_updated`

### Etapa 16 - Verde do Stitch e publication date no card

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`

Mudanças aplicadas:

- borda base do card alinhada ao verde suave do Stitch
- data do card fixada em `publication date` (`date`)

### Etapa 17 - Reorganização do resource detail para o padrão Stitch

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Mudanças aplicadas:

- remoção do botão `Back to catalog` no fluxo de detail como página
- remoção do botão de fechar `X` no layout de página
- criação de uma faixa superior de ações com download, editar metadata quando permitido e share
- CTA principal renomeado para `Explore on Map` quando o recurso pode ser explorado no viewer

### Etapa 18 - Detail page alinhado ao template Stitch

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Mudanças aplicadas:

- breadcrumbs movidos para cima do mapa
- botões de download, edit metadata, share e `Explore on Map` posicionados abaixo do preview
- `aside` de metadata reconstruído com layout, hierarquia visual e espaçamento inspirados diretamente no Stitch
- inclusão de blocos de assets, regiões e estatísticas no rodapé do card lateral quando houver dados

### Etapa 19 - Quebra de título longo no aside do detail

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Mudanças aplicadas:

- quebra forçada de títulos longos no bloco lateral do detail
- prevenção de overflow horizontal em nomes técnicos extensos

### Etapa 20 - Rodapé de views/downloads e labels de assets no detail

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`

Mudanças aplicadas:

- rodapé do card lateral agora sempre exibe `Views` e `Downloads`
- fallback para `0` ou para a quantidade de downloads conhecidos quando o contador não vem explícito
- assets passam a usar títulos mais fiéis ao payload do recurso

### Etapa 21 - Ajuste do mapa preview para o padrão Stitch

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/static/mapstore/configs/localConfig.json`
- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Mudanças aplicadas:

- criação de `navigationBarPreview` para estilizar o toolbar do preview separadamente
- remoção do `MapFooter` nos previews de dataset e map
- ocultação da attribution container do preview
- controles do mapa reposicionados no canto superior esquerdo com visual cinza
- inclusão do botão `Open in MapStore` dentro do preview, apontando para o mesmo destino do `Explore on Map`

### Etapa 22 - Separação visual entre zoom controls e Open in MapStore

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

Mudanças aplicadas:

- toolbar do preview forçado para coluna estreita e independente
- `Open in MapStore` mantido como botão flutuante separado no canto inferior direito
- ajuste de `z-index`, largura e pointer events para evitar sobreposição visual

### Etapa 23 - Restauração dos controles do preview

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/static/mapstore/configs/localConfig.json`
- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- inclusão explícita do plugin `Locate` nos previews
- relaxamento do CSS do toolbar para não ocultar os botões
- manutenção do layout vertical dos controles no canto superior esquerdo

### Etapa 24 - Toolbar do preview alinhado com ZoomAll, ZoomIn e ZoomOut

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/static/mapstore/configs/localConfig.json`
- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- preview passou a usar `MapLoading`, `ZoomAll`, `ZoomIn` e `ZoomOut` sempre visíveis
- `ZoomAll` assume o papel de recenter semelhante ao Stitch
- CSS do toolbar foi ajustado para renderizar todos os grupos e botões da pilha vertical

### Etapa 25 - Correção de corte visual dos controles do preview

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- aumento da caixa dos botões do preview
- `overflow` relaxado para evitar clipping dos controles
- ajuste fino de line-height e tamanho dos ícones

### Etapa 26 - Reposicionamento vertical do toolbar do preview

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- toolbar do preview movido alguns pixels para baixo para evitar corte na borda superior do mapa

### Etapa 27 - Posicionamento aplicado no seletor visível do toolbar

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- posicionamento do preview movido do seletor `-container` para `#navigationBarPreview`
- ajuste aplicado diretamente no nó visível do toolbar

### Etapa 28 - Máscara do toolbar e tooltip do preview

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- a “caixa branca” do controle passou a ser o próprio `#navigationBarPreview`
- largura e overflow do toolbar foram corrigidos para evitar corte de botões
- tooltip visualmente deslocado para a direita no contexto do preview

### Etapa 29 - Tooltip dos controles do preview à direita

Status: concluída

Arquivos alterados:

- `geonode_mapstore_client/client/themes/geonode/less/ms-theme.less`

Mudanças aplicadas:

- tooltip dos controles do preview reposicionado para abrir à direita dos botões
- ajuste restrito ao contexto de `#navigationBarPreview`

## Próximos passos previstos

1. Revisar visualmente catálogo e detalhe no navegador e ajustar refinamentos.
2. Corrigir eventuais inconsistências entre overlay de detalhe, viewer e catálogo.
3. Se necessário, consolidar tokens visuais no tema ZALF para reduzir CSS espalhado.

## Regra de continuidade

Sempre que uma nova etapa for concluída, atualizar este arquivo com:

- objetivo da etapa
- arquivos alterados
- decisões tomadas
- pendências
- validações executadas
