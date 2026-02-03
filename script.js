/**
 * =====================================================================
 * YUFZIMI - PREMIUM WEBSITE CORE LOGIC
 * Features: Telegram Bot Integration, E-com Cart, Dark Mode, Animations
 * =====================================================================
 */
"use strict";

// CONFIGURATION
const CONFIG = {
    TELEGRAM_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
    CHAT_ID: 'YOUR_CHAT_ID',
    THEME_KEY: 'yufzimi_theme_pref',
    CART_KEY: 'yufzimi_cart_items'
};

// DOM ELEMENTS
const dom = {
    body: document.body,
    html: document.documentElement,
    preloader: document.getElementById('loader-wrapper'),
    themeBtn: document.getElementById('themeSwitcher'),
    moonIcon: document.getElementById('moonIcon'),
    sunIcon: document.getElementById('sunIcon'),
    mobileBtn: document.getElementById('mobileMenuBtn'),
    nav: document.querySelector('.main-nav'),
    header: document.querySelector('.main-header'),
    backToTop: document.getElementById('backToTop'),
    contactForm: document.getElementById('yufzimiContactForm'),
    cartBadge: document.querySelector('.badge'),
    addToCartBtns: document.querySelectorAll('.btn-add-cart'),
    productItems: document.querySelectorAll('.product-item'),
    cartTrigger: document.querySelector('.cart-trigger')
};

// PRELOADER & INIT
window.addEventListener('load', () => {
    if (dom.preloader) {
        setTimeout(() => {
            dom.preloader.style.opacity = '0';
            dom.preloader.style.visibility = 'hidden';
        }, 800);
    }
    initializeTheme();
    loadCart();
    setupAnimations();
    setupCartModal();
});

// THEME TOGGLE
function initializeTheme() {
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
    applyTheme(savedTheme);
    dom.themeBtn.addEventListener('click', () => {
        const currentTheme = dom.html.getAttribute('data-theme');
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}
function applyTheme(theme) {
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    if (theme === 'light') {
        dom.moonIcon.style.display = 'none';
        dom.sunIcon.style.display = 'block';
    } else {
        dom.moonIcon.style.display = 'block';
        dom.sunIcon.style.display = 'none';
    }
}

// TELEGRAM BOT
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
    const payload = { chat_id: CONFIG.CHAT_ID, text: message, parse_mode: 'HTML' };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Telegram Error:", error);
        return false;
    }
}

// CART SYSTEM
let cart = [];
function loadCart() {
    const savedCart = localStorage.getItem(CONFIG.CART_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}
function updateCartUI() {
    if (dom.cartBadge) {
        dom.cartBadge.textContent = cart.length;
        dom.cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

// ADD TO CART
dom.addToCartBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-item');
        const productName = productCard.querySelector('h3').innerText;
        const productPrice = productCard.querySelector('.price').innerText;
        const product = { id: Date.now() + index, name: productName, price: productPrice };
        cart.push(product);
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
        updateCartUI();
        alert(`${productName} added to cart!`);

        const orderMsg = `🛒 <b>New Item Added to Cart!</b>\n<b>Product:</b> ${productName}\n<b>Price:</b> ${productPrice}`;
        sendToTelegram(orderMsg);
    });
});

// CART MODAL
function setupCartModal() {
    dom.cartTrigger.addEventListener('click', showCartModal);
}
function showCartModal() {
    if (cart.length === 0) return alert('Your cart is empty!');

    const modal = document.createElement('div');
    modal.classList.add('cart-modal');
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: '10000'
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        background: 'var(--bg-card)', padding: '30px', maxWidth: '600px',
        width: '90%', borderRadius: '8px', boxShadow: 'var(--shadow)'
    });

    let totalPrice = 0;
    let itemsHtml = '<h2>Your Cart</h2><ul>';
    cart.forEach(item => {
        itemsHtml += `<li>${item.name} - ${item.price}</li>`;
        totalPrice += parseFloat(item.price.replace(/[^0-9.]/g, ''));
    });
    itemsHtml += `</ul><p><b>Total:</b> ₹${totalPrice.toFixed(2)}</p>`;

    itemsHtml += `
        <form id="checkoutForm">
            <input type="text" placeholder="Your Name" required>
            <input type="email" placeholder="Your Email" required>
            <input type="text" placeholder="WhatsApp Number" required>
            <textarea placeholder="Shipping Address" rows="3" required></textarea>
            <input type="text" placeholder="Payment Details (UPI/Bank)" required>
            <button type="submit" class="btn btn-primary">Place Order</button>
        </form>
    `;
    modalContent.innerHTML = itemsHtml;
    modal.appendChild(modalContent);
    dom.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modalContent.querySelector('#checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = modalContent.querySelectorAll('input');
        const name = inputs[0].value, email = inputs[1].value, whatsapp = inputs[2].value;
        const address = modalContent.querySelector('textarea').value;
        const payment = inputs[3].value;

        let orderDetails = `🛍️ <b>New Order Placed!</b>\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>WhatsApp:</b> ${whatsapp}\n<b>Address:</b> ${address}\n<b>Payment:</b> ${payment}\n<b>Items:</b>\n`;
        cart.forEach(item => orderDetails += `- ${item.name}: ${item.price}\n`);
        orderDetails += `\n<b>Total:</b> ₹${totalPrice.toFixed(2)}`;

        const success = await sendToTelegram(orderDetails);
        if (success) {
            alert('Order placed successfully!');
            cart = []; localStorage.removeItem(CONFIG.CART_KEY); updateCartUI(); modal.remove();
        } else alert('Error placing order. Try again.');
    });
}

// CONTACT FORM
if (dom.contactForm) {
    dom.contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = dom.contactForm.querySelectorAll('input');
        const name = inputs[0].value, email = inputs[1].value, whatsapp = inputs[2].value;
        const subject = inputs[3].value, message = dom.contactForm.querySelector('textarea').value;
        const btn = dom.contactForm.querySelector('button');
        const origText = btn.innerText;
        btn.innerText = "Sending..."; btn.disabled = true;

        const teleMsg = `📩 <b>New Contact Form Submission</b>\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>WhatsApp:</b> ${whatsapp}\n<b>Subject:</b> ${subject}\n<b>Message:</b> ${message}`;
        const success = await sendToTelegram(teleMsg);
        if (success) { alert("Message sent!"); dom.contactForm.reset(); } 
        else alert("Error sending message.");
        btn.innerText = origText; btn.disabled = false;
    });
}

// STICKY HEADER & BACK TO TOP
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) dom.header.classList.add('header-scrolled');
    else dom.header.classList.remove('header-scrolled');
});

// MOBILE MENU
dom.mobileBtn.addEventListener('click', () => {
    dom.nav.classList.toggle('active');
    dom.mobileBtn.classList.toggle('open');
});

// ANIMATIONS
function setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('reveal-active'); observer.unobserve(entry.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.service-feature-list, .product-item, .price-card, .portfolio-section').forEach(el => observer.observe(el));
}

// FILTERING PRODUCTS
document.querySelectorAll('.filter-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        dom.productItems.forEach(item => { item.style.display = (filter === 'all' || item.classList.contains(filter)) ? 'block' : 'none'; });
    });
});

console.log("YUFZIMI Core JS Loaded Successfully.");
