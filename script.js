document.addEventListener('DOMContentLoaded', () => {
    // LINK DA SUA API DO SHEETDB
    const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/ps17atz8lag09';

    const BUSINESS_PHONE = '5588992458834';

    // Funções de utilidade (getCart, saveCart, etc.)
    const getCart = () => JSON.parse(localStorage.getItem('ranchoDaFeCart')) || [];
    const saveCart = (cart) => localStorage.setItem('ranchoDaFeCart', JSON.stringify(cart));

    const updateCartCount = () => {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const cart = getCart();
            cartCountElement.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    };

    const showToast = (message) => {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = "show";
            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
        }
    };
    
    const addToCart = (productName, productPrice) => {
        let cart = getCart();
        const existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ name: productName, price: productPrice, quantity: 1 });
        }
        saveCart(cart);
        updateCartCount();
        showToast(`"${productName}" foi adicionado ao carrinho!`);
    };

    // Lógica da Página de Login
    if (document.getElementById('login-form')) {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const whatsapp = document.getElementById('whatsapp').value.trim();
            if (nome && whatsapp) {
                localStorage.setItem('clienteNome', nome);
                localStorage.setItem('clienteWhatsApp', whatsapp);
                window.location.href = 'menu.html';
            }
        });
    }

    // Lógica da Página do Cardápio
    if (document.querySelector('.menu-grid')) {
        document.querySelectorAll('.btn-add.simple').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                const price = parseFloat(e.target.dataset.price);
                addToCart(name, price);
            });
        });
        document.querySelectorAll('.product-card.options').forEach(card => {
            const sizeRadios = card.querySelectorAll('input[type="radio"]');
            const priceDisplay = card.querySelector('.price');
            const addButton = card.querySelector('.btn-add.complex');
            const baseName = card.querySelector('h3').textContent;
            sizeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const newPrice = parseFloat(e.target.dataset.price);
                    priceDisplay.textContent = `R$ ${newPrice.toFixed(2)}`;
                });
            });
            addButton.addEventListener('click', () => {
                const selectedRadio = card.querySelector('input[type="radio"]:checked');
                const price = parseFloat(selectedRadio.dataset.price);
                const nameSuffix = selectedRadio.dataset.nameSuffix;
                const finalName = baseName + " " + nameSuffix;
                addToCart(finalName, price);
            });
        });
    }

    // Lógica da Página do Carrinho
    if (document.getElementById('cart-items-container')) {
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');
        const btnCheckout = document.getElementById('btn-checkout');
        const renderCart = () => {
            container.innerHTML = '';
            const cart = getCart();
            if (cart.length === 0) {
                container.innerHTML = '<div class="cart-empty"><p>Seu carrinho está vazio.</p></div>';
                if(btnCheckout) btnCheckout.style.display = 'none';
            } else {
                 if(btnCheckout) btnCheckout.style.display = 'flex';
            }
            let subtotal = 0;
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
                container.innerHTML += `<div class="cart-item"><div class="item-info"><h3>${item.name}</h3><p>R$ ${item.price.toFixed(2)}</p></div><div class="item-controls"><button class="btn-quantity" data-name="${item.name}" data-change="-1">-</button><span>${item.quantity}</span><button class="btn-quantity" data-name="${item.name}" data-change="1">+</button><button class="btn-remove" data-name="${item.name}"><i class="fas fa-trash-alt"></i></button></div></div>`;
            });
            const total = subtotal;
            subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
            totalEl.textContent = `R$ ${total.toFixed(2)}`;
        };
        container.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');
            if (!targetButton) return;
            let cart = getCart();
            const itemName = targetButton.dataset.name;
            if (targetButton.classList.contains('btn-quantity')) {
                const change = parseInt(targetButton.dataset.change);
                const item = cart.find(i => i.name === itemName);
                if (item) {
                    item.quantity += change;
                    if (item.quantity === 0) {
                        cart = cart.filter(i => i.name !== itemName);
                    }
                }
            }
            if (targetButton.classList.contains('btn-remove')) {
                cart = cart.filter(i => i.name !== itemName);
            }
            saveCart(cart);
            renderCart();
            updateCartCount();
        });
        renderCart();
    }
    
    // Lógica do Checkout
    if (document.getElementById('checkout-form')) {
        document.getElementById('checkout-form').addEventListener('submit', e => {
            e.preventDefault();
            const address = {
                cep: document.getElementById('cep').value,
                rua: document.getElementById('rua').value,
                numero: document.getElementById('numero').value,
                bairro: document.getElementById('bairro').value,
                complemento: document.getElementById('complemento').value
            };
            const paymentMethod = document.querySelector('input[name="pagamento"]:checked').value;
            localStorage.setItem('deliveryAddress', JSON.stringify(address));
            localStorage.setItem('paymentMethod', paymentMethod);
            window.location.href = 'confirmacao.html';
        });
    }

    // Lógica da Confirmação e Registro
    if (document.getElementById('order-summary')) {
        const nome = localStorage.getItem('clienteNome');
        const whatsapp = localStorage.getItem('clienteWhatsApp');
        const cart = getCart();
        const address = JSON.parse(localStorage.getItem('deliveryAddress'));
        const paymentMethod = localStorage.getItem('paymentMethod');
        let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let total = subtotal;
        const now = new Date();
        const orderDate = now.toLocaleDateString('pt-BR');
        const orderTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const orderId = `RF-${now.getDate().toString().padStart(2, '0')}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getFullYear().toString().slice(-2)}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        let itemsTextForSheet = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
        let itemsTextForWpp = cart.map(item => `  - ${item.quantity}x ${item.name} = *R$ ${(item.quantity * item.price).toFixed(2)}*`).join('\n');
        
        let summaryHtml = `<h3>Resumo do Pedido</h3><p><strong>Cliente:</strong> ${nome}</p><p><strong>Endereço:</strong> ${address.rua}, ${address.numero}, ${address.bairro}</p><hr><h4>Itens:</h4>${cart.map(item => `<p>${item.quantity}x ${item.name}</p>`).join('')}<hr><p><strong>TOTAL: R$ ${total.toFixed(2)}</strong></p><hr><p><strong>Pagamento:</strong> ${paymentMethod}</p>`;
        document.getElementById('order-summary').innerHTML = summaryHtml;
        
        document.getElementById('btn-send-whatsapp').addEventListener('click', async (e) => {
            e.preventDefault();
            
            e.target.disabled = true;
            e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

            const orderData = {
                id_pedido: orderId,
                data: orderDate,
                hora: orderTime,
                cliente_nome: nome,
                cliente_whatsapp: whatsapp,
                endereco: `${address.rua}, nº${address.numero}, ${address.bairro}`,
                itens: itemsTextForSheet,
                total: total.toFixed(2),
                pagamento: paymentMethod
            };

            try {
                await fetch(SHEETDB_API_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: [orderData] })
                });

                const whatsappMessage = `
- - - - - - - - - - - - - - - -
🇧🇷 *NOVO PEDIDO | RANCHO DA FÉ* 🇧🇷
- - - - - - - - - - - - - - - -
🆔 *Cód. do Pedido:* ${orderId}
🗓️ *Data:* ${orderDate}
⏰ *Hora:* ${orderTime}
👤 *DADOS DO CLIENTE*
*Nome:* ${nome}
*WhatsApp:* ${whatsapp}
📍 *ENDEREÇO DE ENTREGA*
${address.rua}, nº ${address.numero}
*Bairro:* ${address.bairro}
*Complemento:* ${address.complemento || 'Nenhum'}
🛒 *ITENS DO PEDIDO*
${itemsTextForWpp}
- - - - - - - - - - - - - - - -
💰 *RESUMO FINANCEIRO*
*Subtotal dos Itens:* R$ ${subtotal.toFixed(2)}
*TOTAL A PAGAR:*
🎉 *R$ ${total.toFixed(2)}* 🎉
💳 *Forma de Pagamento:*
${paymentMethod}
- - - - - - - - - - - - - - - -`;
                
                const encodedMessage = encodeURIComponent(whatsappMessage.trim());
                window.open(`https://wa.me/${BUSINESS_PHONE}?text=${encodedMessage}`, '_blank');
                saveCart([]);
            } catch (error) {
                console.error('Erro ao registrar pedido:', error);
                alert('Houve um erro ao registrar seu pedido. Por favor, tente novamente.');
            } finally {
                e.target.disabled = false;
                e.target.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar Pedido';
            }
        });
    }

    updateCartCount();
});