let allProducts = [];
let currentCategory = 'all';

async function loadProducts() {
  const productsDiv = document.getElementById("products");
  productsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading products...</p></div>';
  
  let { data, error } = await supabaseClient.from("products").select("*").order('clicks', { ascending: false });
  
  if(error) {
    console.error(error);
    productsDiv.innerHTML = '<p>Error loading products</p>';
    return;
  }
  
  allProducts = data;
  display(allProducts);
}

function getPlatformColor(platform) {
  const colors = {
    'Amazon': '#ff9900',
    'Flipkart': '#2874f0',
    'Meesho': '#e91e63',
    'Myntra': '#e62e4a',
    'Shopsy': '#ff6b35',
    'Ajio': '#ff9900',
    'Nykaa': '#f15a6c',
    'Tata Cliq': '#4a8bff'
  };
  return colors[platform] || '#667eea';
}

function getPlatformIcon(platform) {
  const icons = {
    'Amazon': '🛒',
    'Flipkart': '🛍️',
    'Meesho': '✨',
    'Myntra': '👗',
    'Shopsy': '🛍️',
    'Ajio': '👕',
    'Nykaa': '💄',
    'Tata Cliq': '🛒'
  };
  return icons[platform] || '🔗';
}

function display(products) {
  let box = document.getElementById("products");
  
  if(!products || products.length === 0) {
    box.innerHTML = '<p style="text-align:center; padding:40px;">No products found 😢</p>';
    return;
  }
  
  box.innerHTML = "";
  
  products.forEach(p => {
    const isFolder = p.product_type === 'folder';
    const folderProducts = p.folder_products || [];
    
    if (isFolder) {
      // Display as folder card
      box.innerHTML += `
        <div class="card folder-card" onclick="openFolder('${p.id}')" style="cursor:pointer;">
          <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
          <h3>📁 ${escapeHtml(p.title)}</h3>
          <p style="color: #667eea; font-size: 13px; padding: 0 15px; margin: 5px 0;">📂 ${folderProducts.length} products inside</p>
          <div style="padding: 5px 15px 10px; display: flex; gap: 5px; flex-wrap: wrap;">
            ${p.links ? p.links.slice(0, 3).map(l => 
              `<span style="background: ${getPlatformColor(l.platform)}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 10px;">${getPlatformIcon(l.platform)} ${l.platform}</span>`
            ).join('') : ''}
            ${p.links && p.links.length > 3 ? `<span style="color: #999; font-size: 10px;">+${p.links.length - 3} more</span>` : ''}
          </div>
          <span class="views-badge">👁️ ${p.clicks || 0} views</span>
        </div>
      `;
    } else {
      // Display as single product card - Views hidden from public
      box.innerHTML += `
        <div class="card">
          <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
          <h3>${escapeHtml(p.title)}</h3>
          <div class="product-buttons">
            ${p.links ? p.links.map(link => 
              `<button onclick="trackClick('${p.id}', '${escapeHtml(link.url)}', '${link.platform.toLowerCase()}')" 
                       class="btn ${link.platform.toLowerCase()}" 
                       style="background: ${getPlatformColor(link.platform)};">
                ${getPlatformIcon(link.platform)} ${link.platform}
              </button>`
            ).join('') : ''}
          </div>
        </div>
      `;
    }
  });
}

function openFolder(folderId) {
  const folder = allProducts.find(p => p.id === folderId);
  if (!folder) return;
  
  const folderProducts = folder.folder_products || [];
  if (folderProducts.length === 0) {
    alert('This folder is empty!');
    return;
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'folder-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.className = 'folder-modal-content';
  content.style.cssText = `
    background: ${document.body.classList.contains('dark') ? '#1e1e2a' : 'white'};
    max-width: 800px;
    width: 100%;
    border-radius: 20px;
    padding: 30px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  `;
  
  let productsHTML = folderProducts.map(fp => `
    <div class="folder-product-card" style="background: ${document.body.classList.contains('dark') ? '#2a2a35' : '#f8f9fa'}; border-radius: 12px; padding: 15px; margin: 10px 0; display: flex; flex-direction: column; gap: 10px;">
      <div class="folder-product-header" style="display: flex; align-items: center; gap: 15px;">
        ${fp.image ? `<img src="${fp.image}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid #667eea;">` : '<div style="width:60px;height:60px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:30px;">📷</div>'}
        <strong style="flex:1;">${escapeHtml(fp.title)}</strong>
      </div>
      <div class="folder-product-links" style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${fp.links ? fp.links.map(l => 
          `<button onclick="window.open('${l.url}', '_blank')" 
                   style="background: ${getPlatformColor(l.platform)}; 
                          color: white; 
                          border: none; 
                          padding: 8px 16px; 
                          border-radius: 8px; 
                          cursor: pointer;
                          font-weight: 600;">
            ${getPlatformIcon(l.platform)} ${l.platform}
          </button>`
        ).join('') : ''}
      </div>
    </div>
  `).join('');
  
  content.innerHTML = `
    <button onclick="this.closest('.folder-modal').remove()" 
            class="folder-modal-close"
            style="position: sticky; top: 0; float: right; background: #ff4757; color: white; border: none; padding: 8px 16px; border-radius: 50%; cursor: pointer; font-size: 20px; z-index: 10;">✕</button>
    <h2 style="margin-bottom: 20px;">📁 ${escapeHtml(folder.title)}</h2>
    ${productsHTML}
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function escapeHtml(str) {
  if(!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if(m === '&') return '&amp;';
    if(m === '<') return '&lt;';
    if(m === '>') return '&gt;';
    return m;
  });
}

async function trackClick(id, link, platform) {
  try {
    // Increment total clicks
    await supabaseClient.rpc("increment_clicks", {
      product_id: id
    });
    
    // Update local data
    const product = allProducts.find(p => p.id === id);
    if(product) {
      product.clicks = (product.clicks || 0) + 1;
      display(currentCategory === 'all' ? allProducts : allProducts.filter(p => p.category === currentCategory));
    }
  } catch(e) {
    console.error("Error tracking click:", e);
  }
  
  window.open(link, "_blank");
}

document.getElementById("search")?.addEventListener("input", e => {
  let val = e.target.value.toLowerCase();
  let filtered = allProducts.filter(p => p.title.toLowerCase().includes(val));
  display(filtered);
});

function filterCat(cat) {
  currentCategory = cat;
  
  document.querySelectorAll('.cats button').forEach(btn => {
    btn.classList.remove('active');
    if(btn.textContent.toLowerCase() === cat || (cat === 'all' && btn.textContent === 'All')) {
      btn.classList.add('active');
    }
  });
  
  if(cat === "all") {
    display(allProducts);
  } else {
    display(allProducts.filter(p => p.category === cat));
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if(savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

loadProducts();
initTheme();