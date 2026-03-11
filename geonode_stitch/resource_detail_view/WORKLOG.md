# Resource Detail View Notes

## Escopo desta pasta

Esta pasta concentra os protótipos Stitch usados como referência para:

- listagem de recursos do catálogo
- possíveis variações de tela ligadas a detalhe/listagem

## Protótipos analisados

### Lista de catálogo

- `catalog_list_zalf_light/code.html`
- `catalog_list_zalf_dark/code.html`

### Referência complementar

- `code.html`

## Leitura feita sobre o protótipo `catalog_list_zalf_light`

Características visuais relevantes:

- barra superior clara, leve e limpa
- sidebar fixa à esquerda com filtros e categorias
- grid de cards com cantos arredondados
- thumbnails grandes
- badges de tipo de recurso no topo da imagem
- cards com metadados mínimos: título, resumo curto, autor e data
- paginação discreta no rodapé da listagem
- footer institucional simples

## Mapeamento com o projeto real

### Tela real correspondente

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`

### Componentes reais ligados ao catálogo

- `geonode_mapstore_client/client/js/components/ResourceCard/ResourceCard.jsx`
- `geonode_mapstore_client/client/js/components/FiltersMenu/FiltersMenu.jsx`
- `geonode_mapstore_client/client/js/components/FiltersForm/FiltersForm.jsx`
- `geonode_mapstore_client/client/js/components/CardGrid/CardGrid.jsx`

### Estilos reais ligados ao catálogo

- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`
- `geonode_mapstore_client/client/themes/geonode/less/_card-grid.less`
- `geonode_mapstore_client/client/themes/geonode/less/_resource-card.less`
- `geonode_mapstore_client/client/themes/geonode/less/_filter-form.less`
- `geonode_mapstore_client/client/themes/geonode/less/_menu.less`

## Implementação já feita

### Etapa atual

Primeira versão do catálogo no novo estilo já aplicada.

Resumo do que foi implementado:

- layout com sidebar fixa no desktop
- introdução textual do catálogo acima da grade
- cards modernizados
- filtros e ordenação com aparência mais contemporânea

### Atualização seguinte

Primeira versão da tela de detalhe do recurso também aplicada na base real.

Resumo do que foi implementado:

- preview principal com mais destaque
- painel lateral de metadata reorganizado
- ações principais abaixo do preview
- tabs e blocos de informação com linguagem visual mais próxima do protótipo

Arquivos reais alterados nesta etapa:

- `geonode_mapstore_client/client/js/components/DetailsPanel/DetailsPanel.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_details-panel.less`

### Correção adicional no catálogo

Foi aplicada uma correção de integração com o embed do GeoNode/Django:

- o catálogo novo estava aparecendo comprimido na região central da tela
- o ajuste removeu restrições de largura do layout moderno

Arquivo real alterado:

- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

### Mudança de direção aplicada

O catálogo agora passa a abrir o detalhe como página completa dentro do fluxo principal, em vez de overlay lateral.

Arquivos reais alterados:

- `geonode_mapstore_client/client/js/plugins/ResourcesGrid.jsx`
- `geonode_mapstore_client/client/themes/geonode/less/_resources-grid.less`

Motivo:

- alinhar a experiência real com o protótipo Stitch de catálogo + detail
- evitar o comportamento comprimido típico de painel lateral em embed Django

### Refinamento responsivo

Foi aplicado um ajuste para telas grandes:

- catálogo e detalhe agora usam largura máxima centralizada
- o layout deixa de ocupar toda a largura do monitor em resoluções muito amplas
- a adaptação para telas menores foi mantida

### Cards e Topics

Nova atualização aplicada no catálogo:

- cards sem botão `View`
- card continua clicável e passa a ser a ação principal
- sidebar ganhou seção `Topics` baseada no menu real do Django
- tópicos receberam ícones para aproximar o visual do Stitch

### Grid fixo

O catálogo agora está fixado em layout de grid:

- sem opção de trocar para lista
- cards pensados para 3 colunas no desktop

### Correção do grid

Foi ajustado o breakpoint do grid para evitar queda prematura para 2 colunas quando a sidebar está presente.

### Ajuste de tipografia e ritmo visual

Nova atualização aplicada no catálogo:

- tipografia do cabeçalho interno reduzida para a escala do Stitch
- cards com paddings e margens mais próximos do protótipo
- título e resumo com clamp em duas linhas
- data do card refinada para o padrão visual do Stitch
- badge de tipo reposicionada e simplificada

### Hover, datas e barra de ações

Nova atualização aplicada no catálogo:

- card com data de publicação e data de atualização quando disponível
- hover do card com zoom na imagem e realce do título
- espaçamento do autor refinado em relação ao texto e à linha divisória
- bloco `gn-filters-menu` com mais respiro abaixo para separar melhor do grid

### Topics e data principal do card

Nova atualização aplicada no catálogo:

- `Topics` agora começa com `All Data`
- o item `All Data` remove o filtro de tópico e exibe o catálogo completo
- o card voltou a ter uma única data principal, como no protótipo Stitch
- a data principal prioriza `created`, com fallback para `date`

### Ajuste do botão Add Resource

Nova atualização aplicada no catálogo:

- `gn-content-responsive` passou a alinhar texto e ícone na horizontal
- o ícone do botão `Add Resource` não quebra mais para baixo

### Barra de ações e data do card

Nova atualização aplicada no catálogo:

- barra superior reorganizada em dois grupos visuais
- `Add Resource` e ordenação reposicionados e com mais respiro
- data do card com fallback também para `create_date` e `last_updated`

### Verde do Stitch e publication date

Nova atualização aplicada no catálogo:

- borda do card alinhada ao verde do Stitch
- data visível do card fixada na `publication date`

### Resource detail mais próximo do Stitch

Nova atualização aplicada no fluxo de detalhe:

- remoção do `Back to catalog`
- remoção do botão `X` no detail em modo página
- nova faixa superior de ações com download, editar metadata e share
- CTA principal do preview renomeado para `Explore on Map`

### Detail page alinhado ao template Stitch

Nova atualização aplicada no fluxo de detalhe:

- breadcrumbs posicionados acima do mapa
- ações principais posicionadas abaixo do preview
- `aside` de metadata reconstruído no padrão do protótipo `resource_detail_zalf_dark`
- assets, regiões e estatísticas renderizados no card lateral quando o recurso fornece dados

### Quebra de título longo

Nova atualização aplicada no detail:

- títulos longos do bloco lateral agora quebram linha sem overflow

## Pendências

1. Refinar visual após revisão manual no navegador.
2. Garantir consistência entre visual do catálogo e visual do detalhe do recurso.
3. Avaliar se footer/header globais também devem seguir o mesmo sistema visual.

## Regra de manutenção

Atualizar este arquivo a cada iteração que mexer no catálogo ou em protótipos desta pasta, registrando:

- protótipo usado
- tela real correspondente
- arquivos alterados
- resultado obtido
- próximos ajustes
