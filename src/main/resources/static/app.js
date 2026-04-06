const API_URL = 'http://localhost:8080/api'

// Front-only demo mode:
// - Enabled automatically when opening index.html directly (file://)
// - Also enabled as fallback if API requests fail at runtime
let demoMode = window.location.protocol === 'file:'

const demoStore = {
  pedidos: [{ id: 1, data: '2026-04-05', valorTotal: 0 }],
  produtos: [
    { id: 1, nome: 'Notebook', preco: 4999.9, estoque: 5 },
    { id: 2, nome: 'Mouse', preco: 89.9, estoque: 20 },
    { id: 3, nome: 'Teclado', preco: 159.9, estoque: 12 }
  ],
  itens: [],
  nextPedidoId: 2,
  nextProdutoId: 4,
  nextItemId: 1
}

function parseApiPath(url) {
  const parsed = new URL(url, window.location.origin)
  return parsed.pathname.replace(/\/+$/, '')
}

function recalculatePedidoTotal(pedidoId) {
  const pedido = demoStore.pedidos.find(p => p.id === pedidoId)
  if (!pedido) return

  const total = demoStore.itens
    .filter(i => i.pedidoId === pedidoId)
    .reduce((sum, i) => sum + i.quantidade * i.valorItem, 0)

  pedido.valorTotal = Number(total.toFixed(2))
}

function toItemResponse(item) {
  const pedido = demoStore.pedidos.find(p => p.id === item.pedidoId)
  const produto = demoStore.produtos.find(p => p.id === item.produtoId)
  return {
    id: item.id,
    quantidade: item.quantidade,
    valorItem: item.valorItem,
    pedido,
    produto
  }
}

function jsonResponse(data, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

function emptyResponse(status = 204) {
  return Promise.resolve(new Response(null, { status }))
}

function handleDemoRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const path = parseApiPath(url)
  const body = options.body ? JSON.parse(options.body) : null

  if (path === '/api/pedidos' && method === 'GET') {
    return jsonResponse(demoStore.pedidos)
  }

  if (path === '/api/pedidos' && method === 'POST') {
    const novoPedido = {
      id: demoStore.nextPedidoId++,
      data: body?.data || new Date().toISOString().slice(0, 10),
      valorTotal: 0
    }
    demoStore.pedidos.push(novoPedido)
    return jsonResponse(novoPedido, 201)
  }

  if (/^\/api\/pedidos\/\d+$/.test(path) && method === 'GET') {
    const id = Number(path.split('/').pop())
    const pedido = demoStore.pedidos.find(p => p.id === id)
    return pedido ? jsonResponse(pedido) : jsonResponse({ error: 'Not found' }, 404)
  }

  if (/^\/api\/pedidos\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    demoStore.pedidos = demoStore.pedidos.filter(p => p.id !== id)
    demoStore.itens = demoStore.itens.filter(i => i.pedidoId !== id)
    return emptyResponse()
  }

  if (path === '/api/produtos' && method === 'GET') {
    return jsonResponse(demoStore.produtos)
  }

  if (path === '/api/produtos' && method === 'POST') {
    const novoProduto = {
      id: demoStore.nextProdutoId++,
      nome: body?.nome || 'Novo Produto',
      preco: Number(body?.preco || 0),
      estoque: Number(body?.estoque || 0)
    }
    demoStore.produtos.push(novoProduto)
    return jsonResponse(novoProduto, 201)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'GET') {
    const id = Number(path.split('/').pop())
    const produto = demoStore.produtos.find(p => p.id === id)
    return produto
      ? jsonResponse(produto)
      : jsonResponse({ error: 'Not found' }, 404)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'PUT') {
    const id = Number(path.split('/').pop())
    const produto = demoStore.produtos.find(p => p.id === id)
    if (!produto) return jsonResponse({ error: 'Not found' }, 404)

    produto.nome = body?.nome ?? produto.nome
    produto.preco = Number(body?.preco ?? produto.preco)
    produto.estoque = Number(body?.estoque ?? produto.estoque)

    return jsonResponse(produto)
  }

  if (/^\/api\/produtos\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    demoStore.produtos = demoStore.produtos.filter(p => p.id !== id)
    demoStore.itens = demoStore.itens.filter(i => i.produtoId !== id)
    demoStore.pedidos.forEach(p => recalculatePedidoTotal(p.id))
    return emptyResponse()
  }

  if (path === '/api/itens' && method === 'GET') {
    return jsonResponse(demoStore.itens.map(toItemResponse))
  }

  if (path === '/api/itens' && method === 'POST') {
    const pedidoId = Number(body?.pedido?.id)
    const produtoId = Number(body?.produto?.id)
    const pedido = demoStore.pedidos.find(p => p.id === pedidoId)
    const produto = demoStore.produtos.find(p => p.id === produtoId)
    if (!pedido || !produto) return jsonResponse({ error: 'Invalid relation' }, 400)

    const novoItem = {
      id: demoStore.nextItemId++,
      quantidade: Number(body?.quantidade || 1),
      valorItem: Number(body?.valorItem || produto.preco),
      pedidoId,
      produtoId
    }

    demoStore.itens.push(novoItem)
    recalculatePedidoTotal(pedidoId)

    return jsonResponse(toItemResponse(novoItem), 201)
  }

  if (/^\/api\/itens\/\d+$/.test(path) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    const item = demoStore.itens.find(i => i.id === id)
    demoStore.itens = demoStore.itens.filter(i => i.id !== id)
    if (item) recalculatePedidoTotal(item.pedidoId)
    return emptyResponse()
  }

  return jsonResponse({ error: 'Unsupported demo route' }, 404)
}

const originalFetch = window.fetch.bind(window)
window.fetch = async function (url, options = {}) {
  const isApiRequest = String(url).includes('/api')

  if (demoMode && isApiRequest) {
    return handleDemoRequest(url, options)
  }

  try {
    return await originalFetch(url, options)
  } catch (error) {
    if (isApiRequest) {
      demoMode = true
      console.warn('API indisponivel. Front-end em modo demo local.', error)
      return handleDemoRequest(url, options)
    }
    throw error
  }
}

// ========== ESTADO GLOBAL ==========
let pedidoAberto = null

// ========== HELPER FUNCTIONS ==========

function renderTemplate(templateId) {
  const template = document.getElementById(templateId)
  return template.content.cloneNode(true)
}

// ========== DASHBOARD ==========

async function mostrarDashboard() {
  try {
    const pedidos = await fetch(`${API_URL}/pedidos`).then(r => r.json())
    const produtos = await fetch(`${API_URL}/produtos`).then(r => r.json())
    const itens = await fetch(`${API_URL}/itens`).then(r => r.json())

    const content = document.getElementById('content')
    content.innerHTML = ''

    const dashboard = renderTemplate('dashboard-template')
    dashboard.querySelector('[data-stat="pedidos"]').textContent =
      pedidos.length
    dashboard.querySelector('[data-stat="produtos"]').textContent =
      produtos.length
    dashboard.querySelector('[data-stat="itens"]').textContent = itens.length

    content.appendChild(dashboard)
    pedidoAberto = null
  } catch (error) {
    console.error('Erro:', error)
    document.getElementById('content').innerHTML =
      '<p>Erro ao carregar dashboard</p>'
  }
}

// ========== PEDIDOS ==========

async function mostrarPedidos() {
  try {
    const pedidos = await fetch(`${API_URL}/pedidos`).then(r => r.json())
    const content = document.getElementById('content')
    content.innerHTML = ''

    const listTemplate = renderTemplate('pedidos-list-template')
    const tbody = listTemplate.querySelector('#pedidos-tbody')

    if (pedidos.length === 0) {
      const tr = document.createElement('tr')
      tr.innerHTML =
        '<td colspan="4" class="empty-message">Nenhum pedido encontrado.</td>'
      tbody.appendChild(tr)
    } else {
      pedidos.forEach(pedido => {
        const row = renderTemplate('pedido-row-template')

        row.querySelector('[data-field="id"]').textContent = pedido.id
        row.querySelector('[data-field="data"]').textContent = pedido.data
        row.querySelector('[data-field="valorTotal"]').textContent =
          `R$ ${Number(pedido.valorTotal).toFixed(2)}`

        // Adicionar dataset.id aos botões
        const buttons = row.querySelectorAll('button')
        buttons.forEach(btn => {
          btn.dataset.id = pedido.id
        })

        tbody.appendChild(row)
      })
    }

    content.appendChild(listTemplate)
    pedidoAberto = null
  } catch (error) {
    console.error('Erro:', error)
    document.getElementById('content').innerHTML =
      '<p>Erro ao carregar pedidos</p>'
  }
}

function mostrarFormPedido() {
  const content = document.getElementById('content')
  content.innerHTML = ''
  const form = renderTemplate('pedido-form-template')
  content.appendChild(form)
}

async function criarPedido() {
  const data = document.getElementById('pedidoData').value
  if (!data) {
    alert('Por favor, preencha a data')
    return
  }

  try {
    await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    })
    mostrarPedidos()
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao criar pedido')
  }
}

async function deletarPedido(button) {
  const id = button.dataset.id
  if (
    confirm(
      'Tem certeza que deseja deletar este pedido? Todos os itens serão removidos.'
    )
  ) {
    try {
      await fetch(`${API_URL}/pedidos/${id}`, { method: 'DELETE' })
      mostrarPedidos()
    } catch (error) {
      console.error('Erro:', error)
    }
  }
}

async function abrirPedido(button) {
  const id = button.dataset.id
  try {
    const pedido = await fetch(`${API_URL}/pedidos/${id}`).then(r => r.json())
    const itens = await fetch(`${API_URL}/itens`).then(r => r.json())
    const itensPedido = itens.filter(i => i.pedido.id == id)

    const content = document.getElementById('content')
    content.innerHTML = ''

    const detalhe = renderTemplate('pedido-detalhe-template')

    detalhe.querySelector('[data-field="id"]').textContent = pedido.id
    detalhe.querySelector('[data-field="data"]').textContent = pedido.data
    detalhe.querySelector('[data-field="valorTotal"]').textContent =
      `R$ ${Number(pedido.valorTotal).toFixed(2)}`

    const container = detalhe.querySelector('#itens-pedido-container')

    if (itensPedido.length === 0) {
      const empty = renderTemplate('empty-message-template')
      container.appendChild(empty)
    } else {
      itensPedido.forEach(item => {
        const row = renderTemplate('item-pedido-row-template')

        row.querySelector('[data-field="produto-nome"]').textContent =
          item.produto.nome

        const tipoProduto = item.produto.voltagem
          ? '⚡ Eletrônico'
          : item.produto.dataValidade
            ? '🍎 Perecível'
            : '📦 Comum'
        row.querySelector('[data-field="produto-tipo"]').textContent =
          tipoProduto

        row.querySelector('[data-field="quantidade"]').textContent =
          item.quantidade
        row.querySelector('[data-field="valorItem"]').textContent =
          `R$ ${Number(item.valorItem).toFixed(2)}`
        row.querySelector('[data-field="subtotal"]').textContent =
          `R$ ${(item.quantidade * item.valorItem).toFixed(2)}`

        const deleteBtn = row.querySelector('button')
        deleteBtn.dataset.id = item.id

        container.appendChild(row)
      })
    }

    content.appendChild(detalhe)
    pedidoAberto = pedido
  } catch (error) {
    console.error('Erro:', error)
  }
}

// ========== PRODUTOS ==========

async function mostrarProdutos() {
  try {
    const produtos = await fetch(`${API_URL}/produtos`).then(r => r.json())
    const content = document.getElementById('content')
    content.innerHTML = ''

    const listTemplate = renderTemplate('produtos-list-template')
    const container = listTemplate.querySelector('#produtos-container')

    if (produtos.length === 0) {
      const empty = renderTemplate('empty-message-template')
      container.appendChild(empty)
    } else {
      produtos.forEach(produto => {
        const card = renderTemplate('produto-card-template')

        card.querySelector('[data-field="nome"]').textContent = produto.nome
        card.querySelector('[data-field="preco"]').textContent =
          `R$ ${Number(produto.preco).toFixed(2)}`

        const stockEl = card.querySelector('[data-field="estoque"]')
        if (produto.estoque > 0) {
          stockEl.textContent = `${produto.estoque} unidades`
          stockEl.className = 'stock in-stock'
        } else {
          stockEl.textContent = 'Fora de estoque'
          stockEl.className = 'stock out-of-stock'
        }

        // Adicionar data-id aos botões
        const editBtn = card.querySelector('.btn-primary')
        editBtn.dataset.id = produto.id

        const delBtn = card.querySelector('.btn-danger')
        delBtn.dataset.id = produto.id

        container.appendChild(card)
      })
    }

    content.appendChild(listTemplate)
    pedidoAberto = null
  } catch (error) {
    console.error('Erro:', error)
  }
}

function mostrarFormProduto() {
  const content = document.getElementById('content')
  content.innerHTML = ''
  const form = renderTemplate('produto-form-template')
  content.appendChild(form)
}

async function criarProduto() {
  const nome = document.getElementById('nomeProduto').value
  const preco = parseFloat(document.getElementById('precoProduto').value)
  const estoque = parseInt(document.getElementById('estoqueProduto').value)

  try {
    await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, estoque })
    })
    mostrarProdutos()
  } catch (error) {
    console.error('Erro:', error)
  }
}

async function mostrarFormEditarProduto(id) {
  try {
    const produto = await fetch(`${API_URL}/produtos/${id}`).then(r => r.json())
    const content = document.getElementById('content')
    content.innerHTML = ''
    const form = renderTemplate('produto-edit-form-template')

    // Anexa o formulário antes de acessar seus elementos
    content.appendChild(form)

    // Buscar elementos dentro do conteúdo recém-inserido
    const produtoEditIdEl = content.querySelector('#produtoEditId')
    const nomeEditEl = content.querySelector('#nomeProdutoEdit')
    const precoEditEl = content.querySelector('#precoProdutoEdit')
    const estoqueEditEl = content.querySelector('#estoqueProdutoEdit')

    if (produtoEditIdEl) produtoEditIdEl.value = id
    if (nomeEditEl) nomeEditEl.value = produto.nome
    if (precoEditEl) precoEditEl.value = produto.preco
    if (estoqueEditEl) estoqueEditEl.value = produto.estoque
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao carregar produto')
  }
}

function editarProdutoClick(button) {
  const id = button.dataset.id
  if (id) {
    mostrarFormEditarProduto(id)
  } else {
    console.error('ID do produto não encontrado')
    alert('Erro: ID do produto não encontrado')
  }
}

async function salvarProdutoEditado() {
  const id = document.getElementById('produtoEditId').value
  const nome = document.getElementById('nomeProdutoEdit').value
  const preco = parseFloat(document.getElementById('precoProdutoEdit').value)
  const estoque = parseInt(document.getElementById('estoqueProdutoEdit').value)

  try {
    await fetch(`${API_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, estoque })
    })
    mostrarProdutos()
  } catch (error) {
    console.error('Erro:', error)
  }
}

// ========== ITENS (Integrado com Pedidos) ==========

async function mostrarFormAdicionarItem(button) {
  if (!pedidoAberto) {
    alert('Nenhum pedido selecionado')
    return
  }

  try {
    const produtos = await fetch(`${API_URL}/produtos`).then(r => r.json())

    const content = document.getElementById('content')
    content.innerHTML = ''
    const form = renderTemplate('item-form-template')

    const itemPedidoIdInput = form.querySelector('#itemPedidoId')
    if (itemPedidoIdInput) itemPedidoIdInput.value = pedidoAberto.id

    const produtoSelect = form.querySelector('#itemProdutoSelect')

    produtos.forEach(p => {
      const option = document.createElement('option')
      option.value = p.id
      option.dataset.preco = p.preco
      const tipo = p.voltagem
        ? '⚡ Eletrônico'
        : p.dataValidade
          ? '🍎 Perecível'
          : '📦 Comum'
      option.textContent = `${p.nome} (${tipo}) - R$ ${Number(p.preco).toFixed(2)}`
      produtoSelect.appendChild(option)
    })

    // Atualizar valor quando mudar produto
    produtoSelect.addEventListener('change', function () {
      const selectedOption = this.options[this.selectedIndex]
      const preco = selectedOption.dataset.preco
      const itemValorInput = form.querySelector('#itemValor')
      if (itemValorInput) itemValorInput.value = preco
    })

    content.appendChild(form)

    // Setar valor padrão do primeiro produto
    if (produtos.length > 0) {
      const itemValorInput = form.querySelector('#itemValor')
      if (itemValorInput) itemValorInput.value = produtos[0].preco
    }
  } catch (error) {
    console.error('Erro:', error)
  }
}

async function criarItem() {
  const pedidoId = parseInt(document.getElementById('itemPedidoId').value)
  const produtoId = parseInt(document.getElementById('itemProdutoSelect').value)
  const quantidade = parseInt(document.getElementById('itemQuantidade').value)
  const valorItem = parseFloat(document.getElementById('itemValor').value)

  try {
    await fetch(`${API_URL}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantidade,
        valorItem,
        pedido: { id: pedidoId },
        produto: { id: produtoId }
      })
    })
    abrirPedido({ dataset: { id: pedidoId } })
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao criar item. Verifique console.')
  }
}

function voltarParaPedido(button) {
  // Se o botão forneceu um dataset.id, prioriza esse id (ex.: cancel em formulários).
  // Caso contrário, tenta usar o `pedidoAberto` em memória. Se nada existir, mostra a lista.
  const idFromButton = button && button.dataset && button.dataset.id
  const id = idFromButton || (pedidoAberto && pedidoAberto.id)

  if (id) {
    abrirPedido({ dataset: { id } })
  } else {
    mostrarPedidos()
  }
}

async function deletarItem(button) {
  const id = button.dataset.id
  if (confirm('Tem certeza que deseja remover este item?')) {
    try {
      await fetch(`${API_URL}/itens/${id}`, { method: 'DELETE' })
      if (pedidoAberto) {
        abrirPedido({ dataset: { id: pedidoAberto.id } })
      } else {
        mostrarPedidos()
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }
}

async function deletarProduto(button) {
  const id = button.dataset.id
  if (confirm('Tem certeza que deseja deletar este produto?')) {
    try {
      await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' })
      mostrarProdutos()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao deletar produto')
    }
  }
}

// Mostrar dashboard ao carregar
window.addEventListener('load', mostrarDashboard)
