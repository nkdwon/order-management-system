const API_URL = '/api'

let demoMode = window.location.protocol === 'file:'
const state = {
  view: 'dashboard',
  pedidoAtualId: null
}

const demoStore = {
  pedidos: [{ id: 1, data: '2026-04-06', valorTotal: 0 }],
  produtos: [
    { id: 1, nome: 'Notebook', preco: 4999.9, estoque: 5, voltagem: 220 },
    {
      id: 2,
      nome: 'Iogurte',
      preco: 8.5,
      estoque: 20,
      dataValidade: '2026-04-20'
    },
    { id: 3, nome: 'Caderno', preco: 24.9, estoque: 12 }
  ],
  itens: [],
  nextPedidoId: 2,
  nextProdutoId: 4,
  nextItemId: 1
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function productTypeLabel(produto) {
  if (produto.voltagem !== undefined && produto.voltagem !== null)
    return 'Eletrônico'
  if (produto.dataValidade) return 'Perecível'
  return 'Comum'
}

function productTypeKey(produto) {
  if (produto.voltagem !== undefined && produto.voltagem !== null)
    return 'eletronico'
  if (produto.dataValidade) return 'perecivel'
  return 'comum'
}

function parseCurrencyPtBr(value) {
  if (value === null || value === undefined) return NaN
  if (typeof value === 'number') return value

  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.')
  return Number(normalized)
}

function formatCurrencyInput(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric)
}

function applyInputMasks() {
  document.querySelectorAll('[data-mask="currency"]').forEach(input => {
    input.addEventListener('input', () => {
      const raw = input.value.replace(/[^\d,]/g, '')
      const parts = raw.split(',')
      const integerPart = parts[0].replace(/^0+(?=\d)/, '')
      const decimalPart = (parts[1] || '').slice(0, 2)

      let masked = integerPart
      if (masked) {
        masked = Number(masked).toLocaleString('pt-BR')
      }
      if (raw.includes(',')) {
        masked = `${masked || '0'},${decimalPart}`
      }

      input.value = masked
    })

    input.addEventListener('blur', () => {
      const value = parseCurrencyPtBr(input.value)
      if (Number.isFinite(value)) {
        input.value = formatCurrencyInput(value)
      }
    })
  })

  document.querySelectorAll('[data-mask="integer"]').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '')
    })
  })
}

function getProdutoPayload(formData) {
  const nome = String(formData.get('nome') || '').trim()
  const preco = parseCurrencyPtBr(formData.get('preco'))
  const estoque = Number(formData.get('estoque'))

  if (!nome) {
    throw new Error('Nome do produto é obrigatório.')
  }
  if (!Number.isFinite(preco) || preco <= 0) {
    throw new Error('Preço inválido. Use valor maior que zero.')
  }
  if (!Number.isInteger(estoque) || estoque < 0) {
    throw new Error(
      'Estoque inválido. Use um número inteiro maior ou igual a zero.'
    )
  }

  return { nome, preco, estoque }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.style.background = isError ? '#7f1d1d' : '#141510'
  toast.classList.add('show')
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show')
  }, 2400)
}

function parseApiPath(url) {
  const parsed = new URL(url, window.location.origin)
  return parsed.pathname.replace(/\/+$/, '')
}

function recalculatePedidoTotalDemo(pedidoId) {
  const pedido = demoStore.pedidos.find(p => p.id === pedidoId)
  if (!pedido) return
  pedido.valorTotal = Number(
    demoStore.itens
      .filter(i => i.pedidoId === pedidoId)
      .reduce((sum, i) => sum + i.quantidade * i.valorItem, 0)
      .toFixed(2)
  )
}

function demoJson(data, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

function demoEmpty(status = 204) {
  return Promise.resolve(new Response(null, { status }))
}

function handleDemoRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const path = parseApiPath(url)
  const body = options.body ? JSON.parse(options.body) : null

  if (path === '/api/pedidos' && method === 'GET')
    return demoJson(demoStore.pedidos)

  if (path === '/api/pedidos' && method === 'POST') {
    const novo = {
      id: demoStore.nextPedidoId++,
      data: body?.data || new Date().toISOString().slice(0, 10),
      valorTotal: 0
    }
    demoStore.pedidos.push(novo)
    return demoJson(novo, 201)
  }

  if (/^\/api\/pedidos\/\d+$/.test(path) && method === 'GET') {
    const id = Number(path.split('/').pop())
    const pedido = demoStore.pedidos.find(p => p.id === id)
    return pedido
      ? demoJson({
          ...pedido,
          itens: demoStore.itens
            .filter(i => i.pedidoId === id)
            .map(i => ({
              id: i.id,
              quantidade: i.quantidade,
              valorItem: i.valorItem,
              produto: demoStore.produtos.find(p => p.id === i.produtoId)
            }))
        })
      : demoJson({ erro: 'Pedido não encontrado' }, 404)
  }

  if (/^\/api\/pedidos\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    demoStore.pedidos = demoStore.pedidos.filter(p => p.id !== id)
    demoStore.itens = demoStore.itens.filter(i => i.pedidoId !== id)
    return demoEmpty()
  }

  if (path === '/api/produtos' && method === 'GET')
    return demoJson(demoStore.produtos)

  if (
    (path === '/api/produtos' ||
      path === '/api/produtos/eletronicos' ||
      path === '/api/produtos/pereciveis') &&
    method === 'POST'
  ) {
    const novo = {
      id: demoStore.nextProdutoId++,
      nome: body?.nome || 'Produto',
      preco: Number(body?.preco || 0),
      estoque: Number(body?.estoque || 0)
    }
    if (path.endsWith('/eletronicos'))
      novo.voltagem = Number(body?.voltagem || 0)
    if (path.endsWith('/pereciveis'))
      novo.dataValidade = body?.dataValidade || null
    demoStore.produtos.push(novo)
    return demoJson(novo, 201)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'GET') {
    const id = Number(path.split('/').pop())
    const produto = demoStore.produtos.find(p => p.id === id)
    return produto
      ? demoJson(produto)
      : demoJson({ erro: 'Produto não encontrado' }, 404)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'PUT') {
    const id = Number(path.split('/').pop())
    const produto = demoStore.produtos.find(p => p.id === id)
    if (!produto) return demoJson({ erro: 'Produto não encontrado' }, 404)
    produto.nome = body?.nome ?? produto.nome
    produto.preco = Number(body?.preco ?? produto.preco)
    produto.estoque = Number(body?.estoque ?? produto.estoque)
    return demoJson(produto)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    const hasItem = demoStore.itens.some(i => i.produtoId === id)
    if (hasItem) {
      return demoJson(
        { erro: 'Não é possível excluir produto vinculado a itens de pedido' },
        400
      )
    }
    demoStore.produtos = demoStore.produtos.filter(p => p.id !== id)
    return demoEmpty()
  }

  if (path === '/api/itens' && method === 'GET') {
    return demoJson(
      demoStore.itens.map(item => ({
        id: item.id,
        quantidade: item.quantidade,
        valorItem: item.valorItem,
        pedido: demoStore.pedidos.find(p => p.id === item.pedidoId),
        produto: demoStore.produtos.find(p => p.id === item.produtoId)
      }))
    )
  }

  if (path === '/api/itens' && method === 'POST') {
    const pedidoId = Number(body?.pedido?.id)
    const produtoId = Number(body?.produto?.id)
    const quantidade = Number(body?.quantidade)
    const pedido = demoStore.pedidos.find(p => p.id === pedidoId)
    const produto = demoStore.produtos.find(p => p.id === produtoId)

    if (!pedido || !produto || quantidade < 1) {
      return demoJson({ erro: 'Dados inválidos para criar item' }, 400)
    }
    if (produto.estoque < quantidade) {
      return demoJson({ erro: 'Estoque insuficiente' }, 400)
    }

    produto.estoque -= quantidade
    const novo = {
      id: demoStore.nextItemId++,
      pedidoId,
      produtoId,
      quantidade,
      valorItem: produto.preco
    }
    demoStore.itens.push(novo)
    recalculatePedidoTotalDemo(pedidoId)

    return demoJson(
      {
        id: novo.id,
        quantidade: novo.quantidade,
        valorItem: novo.valorItem,
        pedido,
        produto
      },
      201
    )
  }

  if (/^\/api\/itens\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    const item = demoStore.itens.find(i => i.id === id)
    if (!item) return demoEmpty()

    const produto = demoStore.produtos.find(p => p.id === item.produtoId)
    if (produto) produto.estoque += item.quantidade

    demoStore.itens = demoStore.itens.filter(i => i.id !== id)
    recalculatePedidoTotalDemo(item.pedidoId)
    return demoEmpty()
  }

  return demoJson({ erro: 'Rota de demo não encontrada' }, 404)
}

const originalFetch = window.fetch.bind(window)
window.fetch = async function patchedFetch(url, options = {}) {
  const isApiRequest = String(url).includes('/api')
  if (demoMode && isApiRequest) {
    return handleDemoRequest(url, options)
  }

  try {
    return await originalFetch(url, options)
  } catch (error) {
    if (isApiRequest) {
      demoMode = true
      showToast('API indisponível. Modo demo ativado.', true)
      return handleDemoRequest(url, options)
    }
    throw error
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    let message = `Erro ${response.status}`
    try {
      const body = await response.json()
      message = body?.erro || body?.message || message
    } catch (error) {
      void error
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

function render(html) {
  document.getElementById('content').innerHTML = html
  applyInputMasks()
}

function setActiveMenu(view) {
  document.querySelectorAll('.menu-link').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === view)
  })
}

function showEmpty(text) {
  return `<div class="empty">${text}</div>`
}

async function showDashboard() {
  state.view = 'dashboard'
  setActiveMenu('dashboard')
  const [pedidos, produtos, itens] = await Promise.all([
    request('/pedidos'),
    request('/produtos'),
    request('/itens')
  ])

  const faturamento = pedidos.reduce(
    (acc, p) => acc + Number(p.valorTotal || 0),
    0
  )

  render(`
    <section class="panel">
      <div class="panel-header">
        <h2>Visão Geral do Sistema</h2>
      </div>
      <div class="stats-grid">
        <article class="stat-card"><p class="stat-label">Pedidos</p><p class="stat-value">${pedidos.length}</p></article>
        <article class="stat-card"><p class="stat-label">Produtos</p><p class="stat-value">${produtos.length}</p></article>
        <article class="stat-card"><p class="stat-label">Itens</p><p class="stat-value">${itens.length}</p></article>
        <article class="stat-card"><p class="stat-label">Volume Financeiro</p><p class="stat-value">${formatMoney(faturamento)}</p></article>
      </div>
    </section>
  `)
}

async function showPedidos() {
  state.view = 'pedidos'
  state.pedidoAtualId = null
  setActiveMenu('pedidos')
  const pedidos = await request('/pedidos')

  const rows = pedidos
    .map(
      p => `
      <tr>
        <td>#${p.id}</td>
        <td>${p.data || '-'}</td>
        <td>${formatMoney(p.valorTotal)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-muted" data-action="pedido-open" data-id="${p.id}">Detalhes</button>
            <button class="btn btn-danger" data-action="pedido-delete" data-id="${p.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('')

  render(`
    <section class="panel">
      <div class="panel-header">
        <h2>Pedidos</h2>
        <div class="toolbar">
          <button class="btn btn-primary" data-action="pedido-new">Novo Pedido</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Data</th><th>Valor Total</th><th>Ações</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4">${showEmpty('Nenhum pedido cadastrado.')}</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `)
}

function showPedidoForm() {
  render(`
    <section class="panel">
      <div class="panel-header"><h2>Novo Pedido</h2></div>
      <form id="pedido-form" class="form-grid">
        <div class="field field-full">
          <label for="pedido-data">Data</label>
          <input id="pedido-data" name="data" type="date" required />
        </div>
        <div class="panel-actions field-full">
          <button class="btn btn-primary" type="submit">Salvar</button>
          <button class="btn btn-muted" type="button" data-action="pedido-cancel">Cancelar</button>
        </div>
      </form>
    </section>
  `)
}

async function createPedido(formData) {
  await request('/pedidos', {
    method: 'POST',
    body: JSON.stringify({ data: formData.get('data') })
  })
  showToast('Pedido criado com sucesso.')
  await showPedidos()
}

async function openPedido(pedidoId) {
  state.pedidoAtualId = Number(pedidoId)

  const [pedido, produtos] = await Promise.all([
    request(`/pedidos/${pedidoId}`),
    request('/produtos')
  ])

  const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : []

  const itemRows = itensPedido
    .map(
      item => `
      <tr>
        <td>${item.produto?.nome || '-'}</td>
        <td>${productTypeLabel(item.produto || {})}</td>
        <td>${item.quantidade}</td>
        <td>${formatMoney(item.valorItem)}</td>
        <td>${formatMoney(Number(item.quantidade) * Number(item.valorItem))}</td>
        <td><button class="btn btn-danger" data-action="item-delete" data-id="${item.id}">Remover</button></td>
      </tr>
    `
    )
    .join('')

  const productOptions = produtos
    .map(
      p =>
        `<option value="${p.id}">${p.nome} - ${productTypeLabel(p)} - ${formatMoney(p.preco)} (Estoque: ${p.estoque})</option>`
    )
    .join('')

  render(`
    <section class="panel">
      <div class="panel-header">
        <h2>Pedido #${pedido.id}</h2>
        <div class="toolbar">
          <button class="btn btn-muted" data-action="pedido-back">Voltar</button>
        </div>
      </div>

      <div class="badge-row">
        <span class="badge">Data: ${pedido.data || '-'}</span>
        <span class="badge alt">Valor Total: ${formatMoney(pedido.valorTotal)}</span>
      </div>

      <div class="table-wrap" style="margin-top: 1rem">
        <table>
          <thead><tr><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Valor Unit.</th><th>Subtotal</th><th>Ações</th></tr></thead>
          <tbody>${itemRows || `<tr><td colspan="6">${showEmpty('Nenhum item neste pedido.')}</td></tr>`}</tbody>
        </table>
      </div>

      <hr style="border: 0; border-top: 1px solid var(--line); margin: 1rem 0" />

      <h3 style="margin: 0">Adicionar Item</h3>
      <form id="item-form" class="form-grid" style="margin-top: 0.8rem">
        <input type="hidden" name="pedidoId" value="${pedido.id}" />
        <div class="field field-full">
          <label for="item-produto">Produto</label>
          <select id="item-produto" name="produtoId" required>
            <option value="">Selecione...</option>
            ${productOptions}
          </select>
        </div>
        <div class="field">
          <label for="item-quantidade">Quantidade</label>
          <input id="item-quantidade" name="quantidade" type="text" inputmode="numeric" data-mask="integer" value="1" required />
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn btn-primary" type="submit">Adicionar Item</button>
        </div>
      </form>
    </section>
  `)
}

async function createItem(formData) {
  const pedidoId = Number(formData.get('pedidoId'))
  const produtoId = Number(formData.get('produtoId'))
  const quantidade = Number(formData.get('quantidade'))

  await request('/itens', {
    method: 'POST',
    body: JSON.stringify({
      quantidade,
      pedido: { id: pedidoId },
      produto: { id: produtoId }
    })
  })

  showToast('Item adicionado com sucesso.')
  await openPedido(pedidoId)
}

async function deleteItem(itemId) {
  await request(`/itens/${itemId}`, { method: 'DELETE' })
  showToast('Item removido com sucesso.')
  await openPedido(state.pedidoAtualId)
}

async function deletePedido(pedidoId) {
  await request(`/pedidos/${pedidoId}`, { method: 'DELETE' })
  showToast('Pedido excluído com sucesso.')
  await showPedidos()
}

async function showProdutos() {
  state.view = 'produtos'
  state.pedidoAtualId = null
  setActiveMenu('produtos')
  const produtos = await request('/produtos')

  const cards = produtos
    .map(
      p => `
      <article class="card">
        <h3>${p.nome}</h3>
        <p class="price">${formatMoney(p.preco)}</p>
        <div class="badge-row">
          <span class="badge alt">${productTypeLabel(p)}</span>
          <span class="badge ${Number(p.estoque) > 0 ? '' : 'warn'}">Estoque: ${p.estoque}</span>
          ${p.voltagem !== undefined && p.voltagem !== null ? `<span class="badge">${p.voltagem}V</span>` : ''}
          ${p.dataValidade ? `<span class="badge">Validade: ${p.dataValidade}</span>` : ''}
        </div>
        <div class="panel-actions">
          <button class="btn btn-muted" data-action="produto-edit" data-id="${p.id}">Editar</button>
          <button class="btn btn-danger" data-action="produto-delete" data-id="${p.id}">Excluir</button>
        </div>
      </article>
    `
    )
    .join('')

  render(`
    <section class="panel">
      <div class="panel-header">
        <h2>Produtos</h2>
        <div class="toolbar">
          <button class="btn btn-primary" data-action="produto-new">Novo Produto</button>
        </div>
      </div>
      <div class="card-grid">
        ${cards || showEmpty('Nenhum produto cadastrado.')}
      </div>
    </section>
  `)
}

function showProdutoForm(produto = null) {
  const isEdit = Boolean(produto)
  const type = produto ? productTypeKey(produto) : 'comum'

  render(`
    <section class="panel">
      <div class="panel-header">
        <h2>${isEdit ? `Editar Produto #${produto.id}` : 'Novo Produto'}</h2>
      </div>

      <form id="produto-form" class="form-grid">
        ${isEdit ? `<input type="hidden" name="id" value="${produto.id}" />` : ''}

        <div class="field field-full">
          <label for="produto-nome">Nome</label>
          <input id="produto-nome" name="nome" type="text" value="${produto?.nome || ''}" required />
        </div>

        <div class="field">
          <label for="produto-preco">Preço</label>
          <input id="produto-preco" name="preco" type="text" inputmode="decimal" data-mask="currency" value="${produto?.preco !== undefined ? formatCurrencyInput(produto.preco) : ''}" required />
        </div>

        <div class="field">
          <label for="produto-estoque">Estoque</label>
          <input id="produto-estoque" name="estoque" type="text" inputmode="numeric" data-mask="integer" value="${produto?.estoque ?? 0}" required />
        </div>

        <div class="field ${isEdit ? 'field-full' : ''}">
          <label for="produto-tipo">Tipo</label>
          <select id="produto-tipo" name="tipo" ${isEdit ? 'disabled' : ''}>
            <option value="comum" ${type === 'comum' ? 'selected' : ''}>Comum</option>
            <option value="eletronico" ${type === 'eletronico' ? 'selected' : ''}>Eletrônico</option>
            <option value="perecivel" ${type === 'perecivel' ? 'selected' : ''}>Perecível</option>
          </select>
          ${isEdit ? '<span class="help">Tipo do produto não é alterado na edição.</span>' : ''}
        </div>

        <div class="field" id="field-voltagem" style="display: ${type === 'eletronico' ? 'grid' : 'none'}">
          <label for="produto-voltagem">Voltagem</label>
          <input id="produto-voltagem" name="voltagem" type="number" min="1" value="${produto?.voltagem ?? ''}" />
        </div>

        <div class="field" id="field-validade" style="display: ${type === 'perecivel' ? 'grid' : 'none'}">
          <label for="produto-validade">Data de Validade</label>
          <input id="produto-validade" name="dataValidade" type="date" value="${produto?.dataValidade ?? ''}" />
        </div>

        <div class="panel-actions field-full">
          <button class="btn btn-primary" type="submit">${isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}</button>
          <button class="btn btn-muted" type="button" data-action="produto-cancel">Cancelar</button>
        </div>
      </form>
    </section>
  `)
}

function toggleProductTypeFields(selectValue) {
  const fieldVoltagem = document.getElementById('field-voltagem')
  const fieldValidade = document.getElementById('field-validade')
  if (!fieldVoltagem || !fieldValidade) return

  fieldVoltagem.style.display = selectValue === 'eletronico' ? 'grid' : 'none'
  fieldValidade.style.display = selectValue === 'perecivel' ? 'grid' : 'none'
}

async function createProduto(formData) {
  const tipo = formData.get('tipo')
  const payload = getProdutoPayload(formData)

  let endpoint = '/produtos'
  if (tipo === 'eletronico') {
    endpoint = '/produtos/eletronicos'
    payload.voltagem = Number(formData.get('voltagem'))
  }
  if (tipo === 'perecivel') {
    endpoint = '/produtos/pereciveis'
    payload.dataValidade = formData.get('dataValidade')
  }

  await request(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  showToast('Produto cadastrado com sucesso.')
  await showProdutos()
}

async function editProduto(formData) {
  const id = Number(formData.get('id'))
  const payload = getProdutoPayload(formData)

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID do produto inválido para edição.')
  }

  await request(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  showToast('Produto atualizado com sucesso.')
  await showProdutos()
}

async function deleteProduto(produtoId) {
  await request(`/produtos/${produtoId}`, { method: 'DELETE' })
  showToast('Produto excluído com sucesso.')
  await showProdutos()
}

document.querySelector('.menu').addEventListener('click', async event => {
  const button = event.target.closest('.menu-link')
  if (!button) return

  try {
    if (button.dataset.view === 'dashboard') await showDashboard()
    if (button.dataset.view === 'pedidos') await showPedidos()
    if (button.dataset.view === 'produtos') await showProdutos()
  } catch (error) {
    showToast(error.message, true)
  }
})

document.getElementById('content').addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]')
  if (!button) return

  const action = button.dataset.action
  const id = Number(button.dataset.id)

  try {
    if (action === 'pedido-new') return showPedidoForm()
    if (action === 'pedido-cancel') return showPedidos()
    if (action === 'pedido-open') return openPedido(id)
    if (action === 'pedido-back') return showPedidos()
    if (action === 'pedido-delete') {
      if (window.confirm('Deseja realmente excluir este pedido?'))
        await deletePedido(id)
      return
    }

    if (action === 'produto-new') return showProdutoForm()
    if (action === 'produto-cancel') return showProdutos()
    if (action === 'produto-delete') {
      if (window.confirm('Deseja realmente excluir este produto?'))
        await deleteProduto(id)
      return
    }
    if (action === 'produto-edit') {
      const produto = await request(`/produtos/${id}`)
      showProdutoForm(produto)
      return
    }

    if (action === 'item-delete') {
      if (window.confirm('Deseja remover este item do pedido?'))
        await deleteItem(id)
    }
  } catch (error) {
    showToast(error.message, true)
  }
})

document.getElementById('content').addEventListener('change', event => {
  if (event.target.id === 'produto-tipo') {
    toggleProductTypeFields(event.target.value)
  }
})

document.getElementById('content').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.target
  const data = new FormData(form)

  try {
    if (form.id === 'pedido-form') return createPedido(data)
    if (form.id === 'item-form') return createItem(data)
    if (form.id === 'produto-form') {
      if (data.get('id')) return editProduto(data)
      return createProduto(data)
    }
  } catch (error) {
    showToast(error.message, true)
  }
})

window.addEventListener('load', async () => {
  try {
    await showDashboard()
  } catch (error) {
    showToast(error.message, true)
  }
})
