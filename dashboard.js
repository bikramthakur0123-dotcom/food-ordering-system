document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const dashboardLoader = $('#dashboardLoader');
  const profileButton = $('#profileButton');
  const profileDropdown = $('#profileDropdown');
  const profileName = $('#profileName');
  const dropdownUserName = $('#dropdownUserName');
  const dropdownUserEmail = $('#dropdownUserEmail');
  const cartSidebar = $('#cartSidebar');
  const cartOverlay = $('#cartOverlay');
  const cartButton = $('#cartButton');
  const closeCart = $('#closeCart');
  const cartItems = $('#cartItems');
  const cartCount = $('#cartCount');
  const cartSubtotal = $('#cartSubtotal');
  const cartDelivery = $('#cartDelivery');
  const cartTax = $('#cartTax');
  const cartTotal = $('#cartTotal');
  const deliveryProgressBar = $('#deliveryProgressBar');
  const deliveryProgressText = $('#deliveryProgressText');
  const menuResultCount = $('#menuResultCount');
  const checkoutButton = $('#checkoutButton');
  const startShopping = $('#startShopping');
  const foodModal = $('#foodModal');
  const foodModalClose = $('#foodModalClose');
  const checkoutModal = $('#checkoutModal');
  const checkoutClose = $('#checkoutClose');
  const checkoutForm = $('#checkoutForm');
  const successModal = $('#successModal');
  const successClose = $('#successClose');
  const trackingModal = $('#trackingModal');
  const trackingClose = $('#trackingClose');
  const trackingTitle = $('#trackingTitle');
  const trackingSummary = $('#trackingSummary');
  const trackingTimeline = $('#trackingTimeline');
  const dashboardToast = $('#dashboardToast');
  const dashboardToastIcon = $('#dashboardToastIcon');
  const dashboardToastTitle = $('#dashboardToastTitle');
  const dashboardToastMessage = $('#dashboardToastMessage');
  const dashboardToastClose = $('#dashboardToastClose');
  const surpriseButton = $('#surpriseButton');
  const surpriseReveal = $('#surpriseReveal');
  const surpriseRevealCard = $('#surpriseRevealCard');
  const surpriseStatus = $('#surpriseStatus');
  const surpriseImage = $('#surpriseImage');
  const surpriseId = $('#surpriseId');
  const surpriseCategory = $('#surpriseCategory');
  const surpriseAvailability = $('#surpriseAvailability');
  const surpriseName = $('#surpriseName');
  const surpriseRegion = $('#surpriseRegion');
  const surpriseDescription = $('#surpriseDescription');
  const surpriseHistory = $('#surpriseHistory');
  const surpriseStoryButton = $('#surpriseStoryButton');
  const tryAgainButton = $('#tryAgainButton');
  const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiBase = window.BITEORA_API_BASE || (isLocalFrontend && window.location.port !== '5000'
    ? 'http://127.0.0.1:5000'
    : '');

  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const isAdminUser = (userEmail || '').toLowerCase() === 'admin@biteora.com';
  let userName = localStorage.getItem('userName') || userEmail.split('@')[0] || 'Biteora User';
  const fallbackFoodImage = 'food-placeholder.png';

  document.querySelectorAll('.admin-only-link').forEach((element) => {
    if (!isAdminUser) {
      element.style.display = 'none';
    }
  });

  const safeFoodImage = (image) => image && image.trim() ? image : fallbackFoodImage;

  if ($('#checkoutName')) $('#checkoutName').value = userName;
  if ($('#checkoutEmail')) $('#checkoutEmail').value = userEmail;

  if (profileName) profileName.textContent = userName;
  if (dropdownUserName) dropdownUserName.textContent = userName;
  if (dropdownUserEmail) dropdownUserEmail.textContent = userEmail;

  let foodData = [];

  let cart = JSON.parse(localStorage.getItem('biteoraCart')) || [];
  let favorites = JSON.parse(localStorage.getItem('biteoraFavorites')) || [];
  let orders = JSON.parse(localStorage.getItem('biteoraOrders')) || [];
  let currentFood = null;
  let modalQuantity = 1;
  let previousSurpriseId = null;
  let surpriseBusy = false;
  let currentSurprise = null;

  setTimeout(() => dashboardLoader && dashboardLoader.classList.add('hidden'), 700);

  async function loadMenu() {
    const grid = $('#foodGrid');
    if (grid) grid.innerHTML = '<div class="menu-state">Loading field catalogue...</div>';
    try {
      const response = await fetch(`${apiBase}/api/menu?catalog_refresh=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Menu request failed.');
      const menu = await response.json();
      if (!Array.isArray(menu)) throw new Error('Menu response was invalid.');
      foodData = menu.map((food) => {
        let sourceReferences = [];
        if (Array.isArray(food.source_references)) {
          sourceReferences = food.source_references;
        } else if (typeof food.source_references === 'string' && food.source_references.trim()) {
          try {
            const parsedSources = JSON.parse(food.source_references);
            if (Array.isArray(parsedSources)) sourceReferences = parsedSources;
          } catch (error) {
            console.warn('Skipping malformed source references.', error);
          }
        }
        return {
          ...food,
          category: typeof food.category === 'string' ? food.category : 'uncategorized',
          region: food.region || 'Region not documented',
          source_references: sourceReferences,
          orderable: Boolean(Number(food.orderable))
        };
      });
      renderFoodCards();
      updateMenuResultCount(foodData.length);
      if (surpriseButton) surpriseButton.disabled = false;
    } catch (error) {
      if (grid) grid.innerHTML = '<div class="menu-state menu-state-error">The field catalogue could not be loaded. Try refreshing.</div>';
      if (surpriseStatus) surpriseStatus.textContent = 'The field catalogue could not be loaded. Try refreshing.';
      showToast('Catalogue unavailable', error.message, '!');
    }
  }

  function renderSurprise(food) {
    currentSurprise = food;
    surpriseReveal.hidden = false;
    surpriseReveal.setAttribute('aria-busy', 'false');
    surpriseRevealCard.classList.remove('is-revealing');
    void surpriseRevealCard.offsetWidth;
    surpriseRevealCard.classList.add('is-revealing');
    surpriseId.textContent = food.id;
    surpriseCategory.textContent = String(food.category || 'field note').replaceAll('-', ' ');
    surpriseAvailability.textContent = food.orderable ? 'ORDERABLE' : 'EDUCATIONAL ONLY';
    surpriseAvailability.classList.toggle('is-archive', !food.orderable);
    surpriseName.textContent = food.name;
    surpriseRegion.textContent = food.region || 'Region not documented';
    surpriseDescription.textContent = food.description || 'No description is available for this record.';
    surpriseHistory.textContent = food.cultural_history || 'No cultural history note is available.';
    surpriseImage.src = safeFoodImage(food.image);
    surpriseImage.alt = food.name;
    surpriseStoryButton.disabled = false;
    tryAgainButton.disabled = false;
    surpriseStatus.textContent = food.orderable
      ? 'A purchasable oddity has surfaced.'
      : 'An educational field note has surfaced — not available to order.';
    surpriseReveal.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }

  function revealSurprise() {
    if (surpriseBusy) return;
    const selection = window.BiteoraCatalog?.selectRandomRecord(foodData, previousSurpriseId);
    if (!selection) {
      surpriseReveal.hidden = false;
      surpriseStatus.textContent = foodData.length
        ? 'No valid field notes are available right now.'
        : 'The catalogue is still empty. Try refreshing and open the archive again.';
      return;
    }

    surpriseBusy = true;
    surpriseButton.disabled = true;
    surpriseReveal.setAttribute('aria-busy', 'true');
    previousSurpriseId = selection.id;
    renderSurprise(selection);
    window.setTimeout(() => {
      surpriseBusy = false;
      surpriseButton.disabled = false;
      surpriseReveal.setAttribute('aria-busy', 'false');
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
  }

  surpriseButton?.addEventListener('click', revealSurprise);
  tryAgainButton?.addEventListener('click', revealSurprise);
  surpriseStoryButton?.addEventListener('click', () => {
    if (currentSurprise) openFoodModal(currentSurprise.id);
  });

  function showToast(title = 'Success', message = '', icon = '✓') {
    if (!dashboardToast) return;
    if (dashboardToastTitle) dashboardToastTitle.textContent = title;
    if (dashboardToastMessage) dashboardToastMessage.textContent = message;
    if (dashboardToastIcon) dashboardToastIcon.textContent = icon;
    dashboardToast.classList.add('show');
    clearTimeout(window.biteoraToastTimer);
    window.biteoraToastTimer = setTimeout(() => dashboardToast.classList.remove('show'), 3000);
  }

  if (dashboardToastClose) {
    dashboardToastClose.addEventListener('click', () => dashboardToast.classList.remove('show'));
  }

  if (profileButton) {
    profileButton.addEventListener('click', (event) => {
      event.stopPropagation();
      profileDropdown?.classList.toggle('show');
    });
  }

  document.addEventListener('click', (event) => {
    if (profileDropdown && !profileDropdown.contains(event.target) && profileButton && !profileButton.contains(event.target)) {
      profileDropdown.classList.remove('show');
    }
  });

  const mobileMenuButton = $('#mobileMenuButton');
  const mobileNav = $('#mobileNav');

  mobileMenuButton?.addEventListener('click', () => mobileNav?.classList.toggle('show'));
  $$('.nav-link').forEach((link) => link.addEventListener('click', () => mobileNav?.classList.remove('show')));

  const searchToggle = $('#searchToggle');
  const searchContainer = $('#searchContainer');
  const closeSearch = $('#closeSearch');
  const foodSearch = $('#foodSearch');

  searchToggle?.addEventListener('click', () => {
    searchContainer?.classList.toggle('active');
    setTimeout(() => foodSearch?.focus(), 100);
  });

  closeSearch?.addEventListener('click', () => {
    searchContainer?.classList.remove('active');
    if (foodSearch) foodSearch.value = '';
    showAllFood();
  });

  if (foodSearch) {
    foodSearch.addEventListener('input', () => {
      const searchText = foodSearch.value.trim().toLowerCase();
      searchFood(searchText);
    });
  }

  function renderFoodCards() {
    const grid = $('#foodGrid');
    if (!grid) return;

    grid.innerHTML = foodData.map((food) => `
      <article class="food-card" data-id="${food.id}" data-category="${food.category}" data-type="${food.type}" data-name="${food.name}">
        <div class="food-card-image">
          <button class="favorite-food ${favorites.includes(food.id) ? 'active' : ''}" data-id="${food.id}" aria-label="Favorite">${favorites.includes(food.id) ? '♥' : '♡'}</button>
          <img src="${safeFoodImage(food.image)}" alt="${food.name}" onerror="this.onerror=null;this.src='food-placeholder.png';" />
        </div>
        <div class="food-card-content">
          <div class="food-card-kicker"><span>${food.category.replaceAll('-', ' ')}</span><span>${food.orderable ? 'ORDERABLE' : 'FIELD NOTE'}</span></div>
          <div class="food-top">
            <h3 class="food-name">${food.name}</h3>
            <span class="food-price">${food.orderable ? `₹${food.price}` : 'ARCHIVE'}</span>
          </div>
          <span class="restaurant-name">${food.region} · ${food.restaurant}</span>
          <div class="food-meta">
            <span class="rating">★ ${food.rating}</span>
            <button class="add-button" data-id="${food.id}" ${food.orderable ? '' : 'disabled'}>${food.orderable ? 'Add' : 'Read file'}</button>
          </div>
        </div>
      </article>
    `).join('');

    $$('.food-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.add-button') || event.target.closest('.favorite-food')) return;
        openFoodModal(Number(card.dataset.id));
      });
    });

    $$('.add-button').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        addToCart(Number(button.dataset.id), 1);
      });
    });

    $$('.favorite-food').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(Number(button.dataset.id), button);
      });
    });

  }

  function searchFood(searchText) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const name = card.dataset.name?.toLowerCase() || '';
      const category = card.dataset.category?.toLowerCase() || '';
      const restaurant = card.querySelector('.restaurant-name')?.textContent?.toLowerCase() || '';
      const match = name.includes(searchText) || category.includes(searchText) || restaurant.includes(searchText);
      card.style.display = match ? '' : 'none';
      if (match) found++;
    });

    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  function showAllFood() {
    $$('.food-card').forEach((card) => card.style.display = '');
    $('#noResults')?.classList.remove('show');
    $('#favoriteButton')?.classList.remove('active');
    updateMenuResultCount(foodData.length);
  }

  function updateMenuResultCount(count) {
    if (menuResultCount) menuResultCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  $$('.category-card').forEach((category) => {
    category.addEventListener('click', () => {
      const selectedCategory = category.dataset.category;
      filterFood(selectedCategory);
      document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  function filterFood(category) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const cardCategory = card.dataset.category;
      const isMatch = category === 'all' || category === cardCategory;
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) found++;
    });

    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    const matchingFilter = document.querySelector(`.filter-button[data-filter="${category}"]`);
    matchingFilter?.classList.add('active');
    $('#favoriteButton')?.classList.remove('active');
    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  $$('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      if (filter === 'all' || filter === 'veg' || filter === 'nonveg') {
        filterByType(filter);
      } else {
        filterFood(filter);
      }
    });
  });

  function filterByType(type) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const cardType = card.dataset.type;
      const isMatch = type === 'all' || cardType === type;
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) found++;
    });

    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    document.querySelector(`.filter-button[data-filter="${type}"]`)?.classList.add('active');
    $('#favoriteButton')?.classList.remove('active');
    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  function saveCart() {
    localStorage.setItem('biteoraCart', JSON.stringify(cart));
  }

  function updateCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <div style="font-size:50px;">🛒</div>
          <h3>Your cart is empty</h3>
          <p style="color:#777;margin-top:8px;">Add some delicious food to continue.</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = '';
      cart.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
          <div class="cart-item-image">
            <img src="${foodData.find((food) => food.id === item.id)?.image || ''}" alt="${item.name}" />
          </div>
          <div>
            <h4>${item.name}</h4>
            <div class="cart-item-price">₹${item.price}</div>
            <div class="quantity-controls">
              <button class="cart-minus" data-id="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button class="cart-plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="remove-cart-item" data-id="${item.id}">×</button>
        `;
        cartItems.appendChild(itemElement);
      });
    }

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const delivery = subtotal >= 500 ? 0 : subtotal > 0 ? 40 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + delivery + tax;

    if (cartCount) cartCount.textContent = totalQuantity;
    if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal}`;
    if (cartDelivery) cartDelivery.textContent = `₹${delivery}`;
    if (cartTax) cartTax.textContent = `₹${tax}`;
    if (cartTotal) cartTotal.textContent = `₹${total}`;

    const deliveryProgress = Math.min(100, Math.round((subtotal / 500) * 100));
    if (deliveryProgressBar) deliveryProgressBar.style.width = `${deliveryProgress}%`;
    if (deliveryProgressText) {
      deliveryProgressText.textContent = subtotal >= 500
        ? 'Free delivery unlocked.'
        : `Add ₹${500 - subtotal} more for free delivery.`;
    }

    bindCartButtons();
  }

  function bindCartButtons() {
    $$('.cart-minus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.id), -1)));
    $$('.cart-plus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.id), 1)));
    $$('.remove-cart-item').forEach((button) => button.addEventListener('click', () => removeFromCart(Number(button.dataset.id))));
  }

  function changeQuantity(id, amount) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
      cart = cart.filter((entry) => entry.id !== id);
    }

    saveCart();
    updateCart();
  }

  function removeFromCart(id) {
    const item = cart.find((entry) => entry.id === id);
    cart = cart.filter((entry) => entry.id !== id);
    saveCart();
    updateCart();
    if (item) showToast('Removed', `${item.name} removed from cart.`, '×');
  }

  function addToCart(id, quantity = 1) {
    const food = foodData.find((entry) => entry.id === id);
    if (!food || !food.orderable) {
      showToast('Catalogue entry only', 'This record is educational and is not available to order.', 'i');
      return;
    }

    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: food.id, name: food.name, price: food.price, image: food.image, quantity });
    }

    saveCart();
    updateCart();
    openCartSidebar();
    showToast('Added to cart', `${food.name} added to your cart.`, '✓');
  }

  function openCartSidebar() {
    cartSidebar?.classList.add('active');
    cartOverlay?.classList.add('active');
    updateCart();
  }

  cartButton?.addEventListener('click', openCartSidebar);

  function closeCartSidebar() {
    cartSidebar?.classList.remove('active');
    cartOverlay?.classList.remove('active');
  }

  closeCart?.addEventListener('click', closeCartSidebar);
  cartOverlay?.addEventListener('click', closeCartSidebar);
  startShopping?.addEventListener('click', closeCartSidebar);

  function openFoodModal(id) {
    const food = foodData.find((entry) => entry.id === id);
    if (!food || !foodModal) return;

    currentFood = food;
    modalQuantity = 1;
    const imageWrap = $('#modalFoodImage');
    imageWrap.innerHTML = `<img src="${safeFoodImage(food.image)}" alt="${food.name}" onerror="this.onerror=null;this.src='food-placeholder.png';" />`;
    $('#modalRestaurant').textContent = `${food.region} / ${food.restaurant}`;
    $('#modalFoodName').textContent = food.name;
    $('#modalRating').textContent = `★ ${food.rating}`;
    $('#modalFoodDescription').textContent = food.description;
    $('#modalFoodHistory').textContent = food.cultural_history || 'No cultural history note is available.';
    $('#modalFoodPreparation').textContent = food.traditional_preparation || 'No preparation note is available.';
    $('#modalFoodFlavor').textContent = food.flavor_profile || 'Not documented.';
    $('#modalFoodNutrition').textContent = food.nutrition_info || 'Not documented.';
    $('#modalFoodSafety').textContent = food.safety_risks || 'No safety note is available.';
    $('#modalFoodSources').innerHTML = (food.source_references || []).map((source) => {
      const safeSource = String(source);
      return `<a href="${safeSource}" target="_blank" rel="noopener noreferrer">${safeSource}</a>`;
    }).join('') || 'No source links are available.';
    $('#modalFoodPrice').textContent = food.orderable ? `₹${food.price}` : 'Catalogue only';
    $('#modalAddButton').disabled = !food.orderable;
    $('#modalAddButton').textContent = food.orderable ? 'Add to Cart' : 'Educational entry';
    $('#modalQuantity').textContent = modalQuantity;
    foodModal.classList.add('active');
  }

  function closeFoodModal() {
    foodModal?.classList.remove('active');
    currentFood = null;
  }

  foodModalClose?.addEventListener('click', closeFoodModal);

  $('#modalMinus')?.addEventListener('click', () => {
    if (modalQuantity > 1) {
      modalQuantity--;
      $('#modalQuantity').textContent = modalQuantity;
    }
  });

  $('#modalPlus')?.addEventListener('click', () => {
    modalQuantity++;
    $('#modalQuantity').textContent = modalQuantity;
  });

  $('#modalAddButton')?.addEventListener('click', () => {
    if (!currentFood) return;
    addToCart(currentFood.id, modalQuantity);
    closeFoodModal();
  });

  [foodModal, checkoutModal, successModal, trackingModal].forEach((modal) => {
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('active');
    });
  });

  function toggleFavorite(id, button) {
    if (favorites.includes(id)) {
      favorites = favorites.filter((item) => item !== id);
      button.classList.remove('active');
      button.innerHTML = '♡';
      showToast('Removed from favorites', 'Food removed from your favorites.', '♡');
    } else {
      favorites.push(id);
      button.classList.add('active');
      button.innerHTML = '♥';
      showToast('Added to favorites', 'Food saved to your favorites.', '♥');
    }
    localStorage.setItem('biteoraFavorites', JSON.stringify(favorites));
    if ($('#favoriteButton')?.classList.contains('active')) showFavorites();
  }

  $('#favoriteButton')?.addEventListener('click', () => {
    showFavorites();
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  $$('.offer-button').forEach((button) => {
    button.addEventListener('click', () => {
      const offer = button.dataset.offer;
      showToast('Offer Activated', offer ? `${offer} offer selected.` : 'Special offer selected.', '🎁');
      document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  checkoutButton?.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'Please add food before checkout.', '🛒');
      return;
    }
    closeCartSidebar();
    checkoutModal?.classList.add('active');
  });

  checkoutClose?.addEventListener('click', () => checkoutModal?.classList.remove('active'));

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (cart.length === 0) {
        showToast('Cart is empty', 'Please add food first.', '🛒');
        return;
      }

      const name = $('#checkoutName')?.value.trim();
      const email = $('#checkoutEmail')?.value.trim();
      const phone = $('#checkoutPhone')?.value.trim();
      const address = $('#checkoutAddress')?.value.trim();
      const city = $('#checkoutCity')?.value.trim();
      const pin = $('#checkoutPin')?.value.trim();
      const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';

      if (!name || !email || !phone || !address || !city || !pin) {
        showToast('Incomplete details', 'Please fill all contact details.', '!');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Invalid email', 'Please enter a valid email address.', '!');
        return;
      }
      if (phone.length < 10) {
        showToast('Invalid phone', 'Please enter a valid phone number.', '!');
        return;
      }
      if (pin.length < 4) {
        showToast('Invalid PIN', 'Please enter a valid postal code.', '!');
        return;
      }

      placeOrder({ name, email, phone, address, city, pin, payment });
    });
  }

  async function placeOrder(customer) {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const delivery = subtotal > 0 ? 40 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + delivery + tax;
    const orderId = 'BIT' + Date.now().toString().slice(-6);

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleString(),
      customer,
      items: [...cart],
      subtotal,
      delivery,
      tax,
      total,
      status: 'Preparing'
    };

    try {
      const response = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customer,
          items: [...cart],
          subtotal,
          delivery,
          tax,
          total
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Order failed.');
      }
    } catch (error) {
      showToast('Order saved locally', 'Your order was added locally because the backend is unavailable.', '✓');
    }

    orders.unshift(newOrder);
    localStorage.setItem('biteoraOrders', JSON.stringify(orders));
    cart = [];
    saveCart();
    updateCart();
    checkoutModal?.classList.remove('active');
    checkoutForm?.reset();
    $('#successOrderId').textContent = `Order ID: ${orderId}`;
    successModal?.classList.add('active');
    renderOrders();
    showToast('Order placed', 'Your food order has been successfully placed.', '✓');
  }

  successClose?.addEventListener('click', () => successModal?.classList.remove('active'));
  trackingClose?.addEventListener('click', () => trackingModal?.classList.remove('active'));

  function normalizeOrderRecord(order) {
    if (!order) return null;

    const items = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
        ? JSON.parse(order.items || '[]')
        : [];

    return {
      id: order.id || order.orderId || 'UNKNOWN',
      date: order.created_at || order.date || new Date().toLocaleString(),
      customer: {
        name: order.customer_name || order.customer?.name || '',
        email: order.email || order.customer?.email || '',
        phone: order.phone || order.customer?.phone || '',
        address: order.address || order.customer?.address || '',
        city: order.city || order.customer?.city || '',
        pin: order.pin || order.customer?.pin || '',
        payment: order.payment || order.customer?.payment || 'Cash on Delivery'
      },
      items,
      subtotal: Number(order.subtotal || 0),
      delivery: Number(order.delivery || 0),
      tax: Number(order.tax || 0),
      total: Number(order.total || 0),
      status: order.status || 'Preparing'
    };
  }

  async function loadUserOrders() {
    const email = (userEmail || '').trim().toLowerCase();
    if (!email) return;

    try {
      const response = await fetch(`${apiBase}/api/orders?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Fetch failed');

      const serverOrders = await response.json();
      const normalizedServerOrders = (Array.isArray(serverOrders) ? serverOrders : []).map(normalizeOrderRecord).filter(Boolean);
      const localOrders = JSON.parse(localStorage.getItem('biteoraOrders') || '[]').filter((order) => {
        const orderEmail = (order.customer?.email || order.email || '').toLowerCase();
        return orderEmail === email;
      });

      const mergedOrders = [...normalizedServerOrders, ...localOrders].filter((order, index, source) => {
        const firstIndex = source.findIndex((entry) => String(entry.id) === String(order.id));
        return firstIndex === index;
      });

      orders = mergedOrders;
      localStorage.setItem('biteoraOrders', JSON.stringify(orders));
      renderOrders();
    } catch (error) {
      const localOrders = JSON.parse(localStorage.getItem('biteoraOrders') || '[]').filter((order) => {
        const orderEmail = (order.customer?.email || order.email || '').toLowerCase();
        return orderEmail === email;
      });
      orders = localOrders;
      renderOrders();
    }
  }

  function renderOrders() {
    const ordersContainer = $('#ordersContainer');
    if (!ordersContainer) return;

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <div class="empty-orders-icon">🍽️</div>
          <h3>No orders yet</h3>
          <p>Your recent food orders will appear here.</p>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map((order) => `
      <div class="order-card">
        <div class="order-info">
          <div class="order-icon">🍱</div>
          <div>
            <h3>Order #${order.id}</h3>
            <p style="color:#777;font-size:12px;margin-top:3px;">${(order.items || []).map((item) => item.name || item.productName || 'Item').join(', ')}</p>
            <span class="order-status">${order.status}</span>
          </div>
        </div>
        <div class="order-card-actions">
          <div>
            <strong>₹${order.total}</strong>
            <p>${order.date}</p>
          </div>
          <button class="track-order-button" data-order-id="${order.id}">Track Order</button>
        </div>
      </div>
    `).join('');

    $$('.track-order-button').forEach((button) => {
      button.addEventListener('click', () => openTrackingModal(button.dataset.orderId));
    });
  }

  function openTrackingModal(orderId) {
    const order = orders.find((entry) => entry.id === orderId);
    if (!order || !trackingModal) return;

    const steps = [
      ['Order placed', 'Your order was received.', 'Placed'],
      ['Kitchen preparing', 'The restaurant is preparing your food.', 'Preparing'],
      ['Out for delivery', 'A delivery partner is bringing your order.', 'On the way'],
      ['Delivered', 'Enjoy your meal!', 'Delivered']
    ];
    const currentStep = Math.max(0, steps.findIndex((step) => step[2] === order.status));
    trackingTitle.textContent = `Order #${order.id}`;
    trackingSummary.textContent = `${order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ')} · ₹${order.total}`;
    trackingTimeline.innerHTML = steps.map((step, index) => `
      <div class="tracking-step ${index <= currentStep ? 'complete' : ''} ${index === currentStep ? 'current' : ''}">
        <span class="tracking-dot">${index < currentStep ? '✓' : index + 1}</span>
        <div><strong>${step[0]}</strong><p>${index <= currentStep ? step[1] : 'Coming up next.'}</p></div>
      </div>
    `).join('');
    trackingModal.classList.add('active');
  }

  $('#myOrdersButton')?.addEventListener('click', () => {
    profileDropdown?.classList.remove('show');
    document.querySelector('#orders')?.scrollIntoView({ behavior: 'smooth' });
  });

  $('#myFavoritesButton')?.addEventListener('click', () => {
    profileDropdown?.classList.remove('show');
    showFavorites();
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  function showFavorites() {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const id = Number(card.dataset.id);
      const match = favorites.includes(id);
      card.style.display = match ? '' : 'none';
      if (match) found++;
    });

    $('#noResults')?.classList.toggle('show', found === 0);
    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    $('#favoriteButton')?.classList.add('active');
    updateMenuResultCount(found);
    if (found === 0) showToast('No favorites', "You haven't added any favorite food yet.", '♡');
  }

  $('#accountButton')?.addEventListener('click', () => {
    const enteredName = window.prompt('Enter your name', userName);
    const updatedName = enteredName?.trim();
    if (!updatedName) return;

    userName = updatedName;
    localStorage.setItem('userName', userName);
    if (profileName) profileName.textContent = userName;
    if (dropdownUserName) dropdownUserName.textContent = userName;
    profileDropdown?.classList.remove('show');
    showToast('Profile updated', `Welcome, ${userName}.`, '✓');
  });

  function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
  }

  $('#logoutButton')?.addEventListener('click', logout);
  $('#mobileLogout')?.addEventListener('click', logout);

  $('#showcaseButton')?.addEventListener('click', () => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' }));

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        event.preventDefault();
        const target = document.querySelector(href);
        target?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const sections = $$('main section');
  window.addEventListener('scroll', () => {
    let currentSection = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) currentSection = section.id;
    });

    $$('.nav-link').forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) link.classList.add('active');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCartSidebar();
    foodModal?.classList.remove('active');
    checkoutModal?.classList.remove('active');
    successModal?.classList.remove('active');
    trackingModal?.classList.remove('active');
    profileDropdown?.classList.remove('show');
    searchContainer?.classList.remove('active');
  });

  loadMenu();
  renderOrders();
  loadUserOrders();
  updateCart();
  updateMenuResultCount(foodData.length);
});
