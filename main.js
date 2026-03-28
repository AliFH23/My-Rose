

const Cart = {

  getItems() {
    return JSON.parse(localStorage.getItem('ffrose_cart')) || [];
  },

  save(items) {
    localStorage.setItem('ffrose_cart', JSON.stringify(items));
    this.updateNavCount();
  },

  addItem(product) {
    const items = this.getItems();
    const found = items.find(i => i.id === product.id);
    if (found) {
      found.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    this.save(items);
    showToast(`🌸 "${product.name}" added to cart!`);
  },

  removeItem(id) {
    this.save(this.getItems().filter(i => i.id !== id));
  },

  changeQty(id, delta) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { this.removeItem(id); return; }
    this.save(items);
  },

  clearCart() {
    localStorage.removeItem('ffrose_cart');
    this.updateNavCount();
  },

  getTotalCount() {
    return this.getItems().reduce((s, i) => s + i.qty, 0);
  },

  getTotalPrice() {
    return this.getItems().reduce((s, i) => s + i.price * i.qty, 0);
  },

  updateNavCount() {
    document.querySelectorAll('#cart-count').forEach(el => {
      el.textContent = this.getTotalCount();
    });
  }
};




const Auth = {

  getUsers() {
    return JSON.parse(localStorage.getItem('ffrose_users')) || [];
  },

  saveUsers(users) {
    localStorage.setItem('ffrose_users', JSON.stringify(users));
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('ffrose_current_user')) || null;
  },

  setCurrentUser(user) {
    localStorage.setItem('ffrose_current_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('ffrose_current_user');
    window.location.href = '/Home.html';
  },

  register(firstName, lastName, email, phone, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, msg: 'Email already registered!' };
    }
    const user = { id: Date.now(), firstName, lastName, email, phone, password };
    users.push(user);
    this.saveUsers(users);
    return { success: true };
  },

  login(email, password, remember) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, msg: 'Invalid email or password!' };
    this.setCurrentUser(user);
    if (remember) localStorage.setItem('ffrose_remember', email);
    return { success: true, user };
  }
};



function showToast(msg, type = 'dark') {
  document.getElementById('ffrose-toast')?.remove();

  if (!document.getElementById('ffrose-toast-style')) {
    const s = document.createElement('style');
    s.id = 'ffrose-toast-style';
    s.textContent = `
      #ffrose-toast {
        position: fixed; bottom: 28px; right: 28px;
        padding: 13px 22px; border-radius: 10px;
        font-size: 14px; z-index: 99999; color: #fff;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        animation: frt 3s ease forwards;
      }
      #ffrose-toast.dark   { background: #2d2d2d; }
      #ffrose-toast.success { background: #28a745; }
      #ffrose-toast.error  { background: #dc3545; }
      @keyframes frt {
        0%   { opacity:0; transform:translateY(12px); }
        12%  { opacity:1; transform:translateY(0); }
        80%  { opacity:1; }
        100% { opacity:0; transform:translateY(12px); }
      }
    `;
    document.head.appendChild(s);
  }

  const t = document.createElement('div');
  t.id = 'ffrose-toast';
  t.className = type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}




function initNavbar() {
  Cart.updateNavCount();

  const user = Auth.getCurrentUser();
  const loginBtn = document.querySelector('.login-btn');

  if (user && loginBtn) {
    
    loginBtn.outerHTML = `
      <div class="d-flex align-items-center gap-2">
        <span class="text-muted small">Hi, ${user.firstName}!</span>
        <button class="btn btn-outline-danger btn-sm" id="logout-btn">Logout</button>
      </div>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Auth.logout();
    });
  }
}




function initHomePage() {
  document.querySelectorAll('.product-card').forEach(card => {
    const btn = card.querySelector('button');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const name  = card.querySelector('.card-title')?.textContent.trim();
      const price = parseFloat(card.querySelector('.card-text')?.textContent.replace(/[^\d.]/g, ''));
      const image = card.querySelector('img')?.src || '';
      const id    = name.toLowerCase().replace(/\s+/g, '-');
      Cart.addItem({ id, name, price, image });
    });
  });
}




function initProductsPage() {
  document.querySelectorAll('.card.product-card').forEach(card => {
    const btn = card.querySelector('.add-cart-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const name  = card.querySelector('h5')?.textContent.trim();
      const price = parseFloat(card.querySelector('p')?.textContent.replace(/[^\d.]/g, ''));
      const image = card.querySelector('img')?.src || '';
      const id    = name.toLowerCase().replace(/\s+/g, '-');
      Cart.addItem({ id, name, price, image });
    });
  });
}




function initCartPage() {
  const DELIVERY = 5;
  const container = document.querySelector('.col-lg-8');
  if (!container) return;

  function render() {
    const items = Cart.getItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div style="font-size:60px">🌸</div>
          <h4 class="text-muted mt-3">Your cart is empty</h4>
          <a href="/products.html" class="btn btn-outline-secondary mt-3">Browse Products</a>
        </div>
      `;
    } else {
      container.innerHTML = items.map(item => `
        <div class="cart-item d-flex flex-column flex-md-row align-items-center justify-content-between p-3 mb-4">
          <div class="d-flex align-items-center">
            <img src="${item.image}" alt="${item.name}"
              style="width:85px;height:85px;object-fit:cover;border-radius:10px;" class="me-3">
            <div>
              <h5 class="mb-1">${item.name}</h5>
              <p class="price mb-0">${item.price} JD</p>
            </div>
          </div>

          <div class="quantity-box my-3 my-md-0 d-flex align-items-center">
            <button class="btn btn-outline-secondary btn-minus" data-id="${item.id}">-</button>
            <span class="mx-3 fw-bold">${item.qty}</span>
            <button class="btn btn-outline-secondary btn-plus" data-id="${item.id}">+</button>
          </div>

          <div class="d-flex flex-column align-items-center gap-2">
            <span class="fw-bold">${(item.price * item.qty).toFixed(2)} JD</span>
            <button class="btn btn-danger btn-sm btn-remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `).join('');
    }

    
    const subtotal = Cart.getTotalPrice();
    const hasItems = items.length > 0;
    const delivery = hasItems ? DELIVERY : 0;
    const total    = subtotal + delivery;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('subtotal', subtotal.toFixed(2));
    set('delivery', delivery);
    set('discount',  '0');
    set('total',    total.toFixed(2));

    Cart.updateNavCount();

    
    container.querySelectorAll('.btn-minus').forEach(btn =>
      btn.addEventListener('click', () => { Cart.changeQty(btn.dataset.id, -1); render(); })
    );
    container.querySelectorAll('.btn-plus').forEach(btn =>
      btn.addEventListener('click', () => { Cart.changeQty(btn.dataset.id, +1); render(); })
    );
    container.querySelectorAll('.btn-remove').forEach(btn =>
      btn.addEventListener('click', () => { Cart.removeItem(btn.dataset.id); render(); })
    );
  }

  render();

  
  document.querySelector('.btn-primary')?.addEventListener('click', () => {
    if (Cart.getItems().length === 0) {
      showToast('Your cart is empty!', 'error');
      return;
    }
    showToast('✅ Order placed! Thank you 🌸', 'success');
    setTimeout(() => {
      Cart.clearCart();
      render();
    }, 1000);
  });
}




function initLoginPage() {
  const form = document.querySelector('form');
  if (!form) return;

  const remembered = localStorage.getItem('ffrose_remember');
  if (remembered) {
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput) emailInput.value = remembered;
    const rememberCheck = document.getElementById('rememberMe');
    if (rememberCheck) rememberCheck.checked = true;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const email    = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value.trim();
    const remember = document.getElementById('rememberMe')?.checked || false;

    if (!email || !password) {
      showToast('Please fill all fields!', 'error');
      return;
    }

    const result = Auth.login(email, password, remember);

    if (result.success) {
      showToast(`Welcome back, ${result.user.firstName}! 🌸`, 'success');
      setTimeout(() => { window.location.href = '/Home.html'; }, 1200);
    } else {
      showToast(result.msg, 'error');
    }
  });
}




function initRegisterPage() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const inputs    = form.querySelectorAll('input');
    const firstName = inputs[0].value.trim();
    const lastName  = inputs[1].value.trim();
    const email     = inputs[2].value.trim();
    const phone     = inputs[3].value.trim();
    const password  = inputs[4].value.trim();
    const confirm   = inputs[5].value.trim();

    if (!firstName || !lastName || !email || !phone || !password || !confirm) {
      showToast('Please fill all fields!', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters!', 'error');
      return;
    }

    const result = Auth.register(firstName, lastName, email, phone, password);

    if (result.success) {
      showToast('Account created! Redirecting to login... 🌸', 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    } else {
      showToast(result.msg, 'error');
    }
  });
}




function initContactPage() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const inputs  = form.querySelectorAll('input, textarea');
    const firstName = inputs[0].value.trim();
    const lastName  = inputs[1].value.trim();
    const email     = inputs[2].value.trim();
    const subject   = inputs[3].value.trim();
    const message   = inputs[4].value.trim();

    if (!firstName || !email || !subject || !message) {
      showToast('Please fill all required fields!', 'error');
      return;
    }

    
    const messages = JSON.parse(localStorage.getItem('ffrose_messages')) || [];
    messages.push({
      id: Date.now(),
      firstName, lastName, email, subject, message,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('ffrose_messages', JSON.stringify(messages));

    showToast('Message sent successfully! 🌸', 'success');
    form.reset();
  });
}




document.addEventListener('DOMContentLoaded', () => {

  initNavbar();

  const path = location.pathname.toLowerCase();

  if (path.includes('home')    || path === '/' || path.endsWith('index.html')) initHomePage();
  if (path.includes('product') && !path.includes('cart'))                      initProductsPage();
  if (path.includes('cart'))                                                    initCartPage();
  if (path.includes('login'))                                                   initLoginPage();
  if (path.includes('register'))                                                initRegisterPage();
  if (path.includes('contact'))                                                 initContactPage();

});