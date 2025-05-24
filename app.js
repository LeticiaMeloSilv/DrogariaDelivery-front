// app.js - Funções centralizadas para a aplicação Minha Farmácia

// Variáveis globais
let currentUser = null;
let cartItems = [];


    // Verificar se há usuário logado no localStorage
    checkLoggedUser();
    
    // Inicializar carrinho do localStorage
    loadCart();
    
    // Atualizar elementos da interface baseados no estado atual
    updateUIState();

// Funções de carregamento de dados
async function loadBackendData() {
    try {
        // Tentar carregar o JSON via fetch (funciona apenas em servidor HTTP)
        try {
            const response = await fetch('back_falso.json');
            if (response.ok) {
                backendData = await response.json();
                console.log('Dados do backend carregados com sucesso via fetch');
                return backendData;
            }
        } catch (fetchError) {
            console.warn('Não foi possível carregar via fetch, usando dados de fallback:', fetchError);
        }
        
        // Se fetch falhar, usar dados de fallback
        if (!backendData) {
            console.log('Usando dados de fallback');
            backendData = fallbackData;
        }
        
        return backendData;
    } catch (error) {
        console.error('Erro ao carregar dados do backend:', error);
        // Garantir que sempre temos dados, mesmo em caso de erro
        backendData = fallbackData;
        return backendData;
    }
}

// Funções de autenticação
async function login(email, senha) {
                const backendData= await loadBackendData();

    if (!backendData) {
        console.error('Dados do backend não carregados');
        return { success: false, message: 'Erro ao conectar com o servidor' };
    }

    const cliente = backendData.tbl_clientes.find(c => c.email === email);
    
    if (!cliente) {
        return { success: false, message: 'Email não encontrado' };
    }
    
    // Em um sistema real, verificaríamos a senha com hash
    // Aqui simulamos uma verificação simples
    if (cliente.senha !== `hash_senha_${email.split('@')[0].slice(-3)}`) {
        // Para facilitar testes, aceitar qualquer senha
        //return { success: false, message: 'Senha incorreta' };
    }
    
    // Login bem-sucedido
    currentUser = {
        id: cliente.id_cliente,
        nome: cliente.nome,
        email: cliente.email,
        cpf: cliente.cpf,
        rg: cliente.rg,
        data_nascimento: cliente.data_nascimento
    };
    
    // Salvar no localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return { success: true, user: currentUser };
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // Redirecionar para a página inicial
    window.location.href = 'index.html';
}

async function cadastrar(nome, dataNascimento, email, senha, cpf, rg) {
                const backendData= await loadBackendData();

    if (!backendData) {
        console.error('Dados do backend não carregados');
        return { success: false, message: 'Erro ao conectar com o servidor' };
    }
    
    // Verificar se email já existe
    const emailExiste = backendData.tbl_clientes.some(c => c.email === email);
    if (emailExiste) {
        return { success: false, message: 'Este email já está cadastrado' };
    }
    
    // Verificar se CPF já existe
    const cpfExiste = backendData.tbl_clientes.some(c => c.cpf === cpf);
    if (cpfExiste) {
        return { success: false, message: 'Este CPF já está cadastrado' };
    }
    
    // Criar novo cliente (simulado)
    const novoId = backendData.tbl_clientes.length + 1;
    const novoCliente = {
        id_cliente: novoId,
        nome: nome,
        data_nascimento: dataNascimento,
        data_cadastro: new Date().toISOString().replace('T', ' ').substring(0, 19),
        email: email,
        senha: `hash_senha_${email.split('@')[0].slice(-3)}`, // Simulação de hash
        cpf: cpf,
        rg: rg
    };
    
    // Adicionar ao "banco de dados" (simulado)
    backendData.tbl_clientes.push(novoCliente);
    
    // Login automático após cadastro
    currentUser = {
        id: novoCliente.id_cliente,
        nome: novoCliente.nome,
        email: novoCliente.email,
        cpf: novoCliente.cpf,
        rg: novoCliente.rg,
        data_nascimento: novoCliente.data_nascimento
    };
    
    // Salvar no localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return { success: true, user: currentUser };
}

function checkLoggedUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// Funções de carrinho
async function addToCart(productId, quantity = 1) {
                const backendData= await loadBackendData();

    if (!backendData) {
        console.error('Dados do backend não carregados');
        return { success: false, message: 'Erro ao conectar com o servidor' };
    }
    
    const produto = backendData.tbl_produtos.find(p => p.id_produto === productId);
    if (!produto) {
        return { success: false, message: 'Produto não encontrado' };
    }
    
    // Verificar se o produto já está no carrinho
    const existingItem = cartItems.find(item => item.id_produto === productId);
    
    if (existingItem) {
        // Atualizar quantidade
        existingItem.quantidade += quantity;
    } else {
        // Adicionar novo item
        cartItems.push({
            id_produto: produto.id_produto,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: quantity,
            foto: produto.foto,
            prescricao: produto.prescricao
        });
    }
    
    // Salvar no localStorage
    saveCart();
    
    return { success: true, cart: cartItems };
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id_produto !== productId);
    saveCart();
    return { success: true, cart: cartItems };
}

function updateCartItemQuantity(productId, quantity) {
    const item = cartItems.find(item => item.id_produto === productId);
    if (item) {
        item.quantidade = quantity;
        saveCart();
        return { success: true, cart: cartItems };
    }
    return { success: false, message: 'Item não encontrado no carrinho' };
}

function getCartTotal() {
    return cartItems.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function clearCart() {
    cartItems = [];
    saveCart();
}

function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function loadCart() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
}

// Funções de busca e consulta
async function getProdutos(categoria = null, termo = null) {
                const backendData= await loadBackendData();
if (!backendData) return [];
    
    let produtos = backendData.tbl_produtos;
    
    // Filtrar por categoria (simulado, já que não temos categorias no backend)
    if (categoria) {
        // Simulação de categorias baseada em nomes de produtos
        switch(categoria.toLowerCase()) {
            case 'vitaminas':
                produtos = produtos.filter(p => p.nome.toLowerCase().includes('vitamina'));
                break;
            case 'dor e febre':
                produtos = produtos.filter(p => 
                    p.nome.toLowerCase().includes('paracetamol') || 
                    p.nome.toLowerCase().includes('dipirona') ||
                    p.descricao.toLowerCase().includes('dor') ||
                    p.descricao.toLowerCase().includes('febre')
                );
                break;
            case 'beleza':
                produtos = produtos.filter(p => 
                    p.nome.toLowerCase().includes('creme') || 
                    p.nome.toLowerCase().includes('protetor') ||
                    p.descricao.toLowerCase().includes('pele')
                );
                break;
            case 'infantil':
                produtos = produtos.filter(p => 
                    p.descricao.toLowerCase().includes('infantil') || 
                    p.descricao.toLowerCase().includes('criança')
                );
                break;
        }
    }
    
    // Filtrar por termo de busca
    if (termo) {
        const termoBusca = termo.toLowerCase();
        produtos = produtos.filter(p => 
            p.nome.toLowerCase().includes(termoBusca) || 
            p.descricao.toLowerCase().includes(termoBusca)
        );
    }
    
    return produtos;
}

async function getProdutoById(id) {
                const backendData= await loadBackendData();

    if (!backendData) return null;
    return backendData.tbl_produtos.find(p => p.id_produto === id);
}

async function getPedidosCliente(clienteId) {
                const backendData= await loadBackendData();

    if (!backendData || !clienteId) return [];
    
    return backendData.tbl_pedidos
        .filter(p => p.id_cliente === clienteId)
        .map(pedido => {
            // Buscar informações de pagamento
            const pagamento = backendData.tbl_pagamentos.find(
                pag => pag.id_pagamento === pedido.id_pagamento
            );
            
            // Buscar informações de laudo, se existir
            let laudo = null;
            if (pedido.id_laudo) {
                laudo = backendData.tbl_laudos.find(
                    l => l.id_laudo === pedido.id_laudo
                );
            }
            
            // Retornar pedido com informações completas
            return {
                ...pedido,
                pagamento: pagamento || {},
                laudo: laudo
            };
        });
}

async function getPedidoById(id) {
                const backendData= await loadBackendData();

    if (!backendData) return null;
    
    const pedido = backendData.tbl_pedidos.find(p => p.id_pedido === id);
    if (!pedido) return null;
    
    // Buscar informações de pagamento
    const pagamento = backendData.tbl_pagamentos.find(
        pag => pag.id_pagamento === pedido.id_pagamento
    );
    
    // Buscar informações de laudo, se existir
    let laudo = null;
    if (pedido.id_laudo) {
        laudo = backendData.tbl_laudos.find(
            l => l.id_laudo === pedido.id_laudo
        );
    }
    
    // Retornar pedido com informações completas
    return {
        ...pedido,
        pagamento: pagamento || {},
        laudo: laudo
    };
}

async function getLaudosCliente(clienteId) {
                const backendData= await loadBackendData();

    if (!backendData || !clienteId) return [];
    
    // Buscar pedidos do cliente
    const pedidosCliente = backendData.tbl_pedidos.filter(p => p.id_cliente === clienteId);
    
    // Extrair IDs de laudos dos pedidos
    const laudosIds = pedidosCliente
        .filter(p => p.id_laudo)
        .map(p => p.id_laudo);
    
    // Buscar laudos correspondentes
    return backendData.tbl_laudos.filter(l => laudosIds.includes(l.id_laudo));
}

// Funções de simulação de checkout e pedidos
async function criarPedido(clienteId, produtos, metodoPagamento, enderecoEntrega, precisaLaudo = false, laudoId = null) {
                const backendData= await loadBackendData();
if (!backendData || !clienteId || !produtos || produtos.length === 0) {
        return { success: false, message: 'Dados insuficientes para criar pedido' };
    }
    
    // Calcular valores
    const subtotal = produtos.reduce((total, p) => total + (p.preco * p.quantidade), 0);
    const frete = 10.00; // Valor fixo simulado
    const total = subtotal + frete;
    
    // Criar pagamento
    const novoPagamentoId = backendData.tbl_pagamentos.length + 1;
    const novoPagamento = {
        id_pagamento: novoPagamentoId,
        metodo_pagamento: metodoPagamento,
        status_pagamento: "Pendente",
        total: total,
        frete: frete,
        data_pagamento: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    // Adicionar pagamento ao "banco de dados"
    backendData.tbl_pagamentos.push(novoPagamento);
    
    // Criar pedido
    const novoPedidoId = backendData.tbl_pedidos.length + 1;
    const novoPedido = {
        id_pedido: novoPedidoId,
        id_cliente: clienteId,
        status_pedido: "Pedido recebido",
        data_pedido: new Date().toISOString().replace('T', ' ').substring(0, 19),
        id_entregador: Math.floor(Math.random() * 3) + 1, // Entregador aleatório
        produtos: produtos.map(p => ({
            id_produto: p.id_produto,
            nome: p.nome,
            quantidade: p.quantidade,
            preco_unitario: p.preco,
            subtotal: p.preco * p.quantidade
        })),
        id_laudo: laudoId,
        id_pagamento: novoPagamentoId,
        total: total,
        frete: frete
    };
    
    // Adicionar pedido ao "banco de dados"
    backendData.tbl_pedidos.push(novoPedido);
    
    return { success: true, pedido: novoPedido };
}

async function uploadLaudo(clienteId, descricao, fotoUrl) {
                const backendData= await loadBackendData();

    if (!backendData || !clienteId) {
        return { success: false, message: 'Dados insuficientes para upload de laudo' };
    }
    
    // Criar novo laudo
    const novoLaudoId = backendData.tbl_laudos.length + 1;
    const novoLaudo = {
        id_laudo: novoLaudoId,
        descricao: descricao,
        foto_laudo: fotoUrl || `uploads/laudos/laudo_${novoLaudoId}.jpg`, // URL simulada
        data_laudo: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    // Adicionar laudo ao "banco de dados"
    backendData.tbl_laudos.push(novoLaudo);
    
    return { success: true, laudo: novoLaudo };
}

// Funções de atualização da interface
function updateUIState() {
    // Atualizar elementos da interface baseados no estado atual
    updateHeaderState();
    updateCartBadge();
}

function updateHeaderState() {
    // Atualizar elementos do cabeçalho baseados no login
    const perfilLink = document.querySelector('.menu a[href="profile.html"]');
    if (perfilLink) {
        if (currentUser) {
            perfilLink.textContent = `Olá, ${currentUser.nome.split(' ')[0]}`;
        } else {
            perfilLink.textContent = 'Perfil';
        }
    }
}

function updateCartBadge() {
    // Atualizar badge do carrinho com quantidade de itens
    const cartLink = document.querySelector('.menu a[href="cart.html"]');
    if (cartLink && cartItems.length > 0) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);
        
        // Verificar se já existe um badge
        let badge = cartLink.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartLink.appendChild(badge);
        }
        
        badge.textContent = totalItems;
    }
}

// Funções de busca
function buscarProdutos(termo) {
    return getProdutos(null, termo);
}

// Exportar funções para uso global
window.appFunctions = {
    login,
    logout,
    cadastrar,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartTotal,
    clearCart,
    getProdutos,
    getProdutoById,
    getPedidosCliente,
    getPedidoById,
    getLaudosCliente,
    criarPedido,
    uploadLaudo,
    buscarProdutos,
    isLoggedIn: () => !!currentUser,
    getCurrentUser: () => currentUser,
    getCart: () => cartItems
};
