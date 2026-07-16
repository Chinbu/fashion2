const IMGBB_API_1 = "d5b5d8ca4f3a3c0a1e2248d121111692";
const IMGBB_API_2 = "122af555b20f19576ccc38e1719a0e4f";

let editingProductId = null;
let currentImageUrl = null;
let linkCounter = 1;
let folderProducts = [];
let editingFolderProductIndex = -1;
let isEditingFolderProduct = false;

// Platform detection function
function detectPlatform(input) {
    const url = input.value.toLowerCase();
    const badge = input.parentElement.querySelector('.platform-badge');
    
    const platformColors = {
        'amazon': { color: '#ff9900', icon: '🛒', name: 'Amazon' },
        'flipkart': { color: '#2874f0', icon: '🛍️', name: 'Flipkart' },
        'meesho': { color: '#e91e63', icon: '✨', name: 'Meesho' },
        'myntra': { color: '#e62e4a', icon: '👗', name: 'Myntra' },
        'shopsy': { color: '#ff6b35', icon: '🛍️', name: 'Shopsy' },
        'ajio': { color: '#ff9900', icon: '👕', name: 'Ajio' },
        'nykaa': { color: '#f15a6c', icon: '💄', name: 'Nykaa' },
        'tatacliq': { color: '#4a8bff', icon: '🛒', name: 'Tata Cliq' }
    };
    
    let detected = '🏷️ Auto-Detect';
    let bgColor = '#666';
    
    for (const [key, value] of Object.entries(platformColors)) {
        if (url.includes(key)) {
            detected = `${value.icon} ${value.name}`;
            bgColor = value.color;
            break;
        }
    }
    
    badge.textContent = detected;
    badge.style.background = bgColor;
    badge.style.color = 'white';
    badge.style.padding = '4px 12px';
    badge.style.borderRadius = '20px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '600';
    badge.style.whiteSpace = 'nowrap';
}

function detectPlatformFromUrl(url) {
    const platforms = {
        'amazon': 'Amazon',
        'flipkart': 'Flipkart',
        'meesho': 'Meesho',
        'myntra': 'Myntra',
        'shopsy': 'Shopsy',
        'ajio': 'Ajio',
        'nykaa': 'Nykaa',
        'tatacliq': 'Tata Cliq'
    };
    
    url = url.toLowerCase();
    for (const [key, value] of Object.entries(platforms)) {
        if (url.includes(key)) {
            return value;
        }
    }
    return 'Other';
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

async function upload(file, key) {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body: form
    });

    const data = await res.json();
    if (!data.success) throw new Error("fail");
    return data.data.url;
}

async function uploadImage(file) {
    try {
        return await upload(file, IMGBB_API_1);
    } catch {
        return await upload(file, IMGBB_API_2);
    }
}

async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Add link field
function addLinkField() {
    linkCounter++;
    const container = document.getElementById('linksContainer');
    const group = document.createElement('div');
    group.className = 'link-group';
    group.id = `linkGroup${linkCounter}`;
    group.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; margin: 10px 0;">
            <input type="url" class="admin-input link-input" placeholder="🔗 Product Link *" style="flex: 1;" oninput="detectPlatform(this)">
            <span class="platform-badge" id="platformBadge${linkCounter}" style="background: #666; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">🏷️ Auto-Detect</span>
            <button type="button" class="remove-link-btn" onclick="removeLink(this)">✕</button>
        </div>
    `;
    container.appendChild(group);
}

// Remove link field
function removeLink(btn) {
    const group = btn.closest('.link-group');
    if (document.querySelectorAll('.link-group').length > 1) {
        group.remove();
    } else {
        alert('At least one link is required!');
    }
}

// Toggle folder fields
function toggleFolderFields() {
    const type = document.getElementById('productType').value;
    const container = document.getElementById('folderProductsContainer');
    const titleField = document.getElementById('title');
    
    if (type === 'folder') {
        container.style.display = 'block';
        titleField.placeholder = '📁 Folder Name *';
        document.getElementById('formTitle').textContent = '📁 Create New Folder';
    } else {
        container.style.display = 'none';
        titleField.placeholder = 'Product Name *';
        document.getElementById('formTitle').textContent = '📝 Add New Product';
    }
}

// Add product to folder with image support
function addFolderProduct() {
    const title = prompt('Enter product title:');
    if (!title) return;
    
    // Image upload for folder product
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        let imageUrl = '';
        
        if (file) {
            try {
                imageUrl = await uploadImage(file);
            } catch(error) {
                alert('Error uploading image: ' + error.message);
                return;
            }
        }
        
        const links = [];
        let addMore = true;
        while (addMore) {
            const link = prompt('Enter product link (or type "done" to finish):');
            if (!link || link.toLowerCase() === 'done') {
                addMore = false;
            } else {
                const platform = detectPlatformFromUrl(link);
                links.push({ url: link, platform: platform });
            }
        }
        
        folderProducts.push({
            title: title,
            image: imageUrl,
            links: links
        });
        
        renderFolderProducts();
        fileInput.remove();
    };
    
    fileInput.click();
}

// Edit folder product with image support
function editFolderProduct(index) {
    const product = folderProducts[index];
    
    const newTitle = prompt('Edit title:', product.title);
    if (newTitle !== null) {
        product.title = newTitle;
    }
    
    // Option to change image
    const changeImage = confirm('Do you want to change the image?');
    if (changeImage) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    product.image = await uploadImage(file);
                } catch(error) {
                    alert('Error uploading image: ' + error.message);
                }
            }
            fileInput.remove();
            renderFolderProducts();
        };
        fileInput.click();
    }
    
    // Edit links
    let newLinks = [];
    let addMore = true;
    while (addMore) {
        const link = prompt('Add/Edit link (type "done" to finish, "skip" to keep existing):');
        if (!link || link.toLowerCase() === 'done') {
            addMore = false;
        } else if (link.toLowerCase() !== 'skip') {
            const platform = detectPlatformFromUrl(link);
            newLinks.push({ url: link, platform: platform });
        }
    }
    
    if (newLinks.length > 0) {
        product.links = newLinks;
    }
    
    renderFolderProducts();
}

function deleteFolderProduct(index) {
    if (confirm('Delete this product from folder?')) {
        folderProducts.splice(index, 1);
        renderFolderProducts();
    }
}

function renderFolderProducts() {
    const list = document.getElementById('folderProductsList');
    if (folderProducts.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No products in this folder yet.</p>';
        return;
    }
    
    list.innerHTML = '';
    folderProducts.forEach((product, index) => {
        const div = document.createElement('div');
        div.className = 'folder-product-item';
        
        const linkBadges = product.links.map(l => 
            `<span style="background: ${getPlatformColor(l.platform)}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; margin: 2px;">${getPlatformIcon(l.platform)} ${l.platform}</span>`
        ).join(' ');
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    ${product.image ? `<img src="${product.image}" class="folder-product-image" alt="${product.title}">` : '<div style="width:60px;height:60px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;">📷</div>'}
                    <div>
                        <strong>${product.title}</strong>
                        <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 3px;">${linkBadges}</div>
                    </div>
                </div>
                <div>
                    <button onclick="editFolderProduct(${index})" style="background: #667eea; color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; margin-right: 5px;">✏️</button>
                    <button onclick="deleteFolderProduct(${index})" style="background: #ff4757; color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer;">🗑️</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

async function addProduct() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const file = document.getElementById("imageFile").files[0];
    const productType = document.getElementById("productType").value;

    if(!title || !category) {
        alert("Please fill Title and Category (required)");
        return;
    }

    let imageUrl = currentImageUrl;
    
    if(file) {
        try {
            document.getElementById("publishBtn").disabled = true;
            document.getElementById("publishBtn").textContent = "Uploading Image...";
            imageUrl = await uploadImage(file);
        } catch(error) {
            alert("Error uploading image: " + error.message);
            document.getElementById("publishBtn").disabled = false;
            document.getElementById("publishBtn").textContent = editingProductId ? "Update Product" : "Publish Product";
            return;
        }
    } else if(!editingProductId && productType === 'single') {
        alert("Please select an image for new product");
        document.getElementById("publishBtn").disabled = false;
        return;
    }

    try {
        document.getElementById("publishBtn").disabled = true;
        document.getElementById("publishBtn").textContent = editingProductId ? "Updating..." : "Publishing...";
        
        // Get all links
        const linkInputs = document.querySelectorAll('.link-input');
        const links = [];
        linkInputs.forEach(input => {
            if (input.value.trim()) {
                const platform = detectPlatformFromUrl(input.value);
                links.push({ url: input.value.trim(), platform: platform });
            }
        });
        
        // Prepare product data based on type
        let productData = {
            title,
            category,
            thumbnail: imageUrl,
            product_type: productType,
            links: links,
            clicks: 0
        };
        
        // Add platform-specific fields for backward compatibility
        links.forEach(link => {
            const key = link.platform.toLowerCase() + '_link';
            productData[key] = link.url;
        });
        
        // If folder type, include folder products data with images
        if (productType === 'folder') {
            productData.folder_products = folderProducts;
        }
        
        if(editingProductId) {
            await supabaseClient.from("products").update(productData).eq("id", editingProductId);
            alert("✅ Product Updated Successfully!");
        } else {
            await supabaseClient.from("products").insert([productData]);
            alert("✅ Product Published Successfully!");
        }
        
        resetForm();
        loadProductsList();
    } catch(error) {
        alert("Error: " + error.message);
    } finally {
        document.getElementById("publishBtn").disabled = false;
        document.getElementById("publishBtn").textContent = editingProductId ? "Update Product" : "Publish Product";
    }
}

function resetForm() {
    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("imageFile").value = "";
    document.getElementById("productType").value = "single";
    document.getElementById("folderProductsContainer").style.display = "none";
    
    // Reset links
    const container = document.getElementById('linksContainer');
    container.innerHTML = `
        <div class="link-group" id="linkGroup1">
            <div style="display: flex; gap: 10px; align-items: center; margin: 10px 0;">
                <input type="url" class="admin-input link-input" placeholder="🔗 Product Link *" style="flex: 1;" oninput="detectPlatform(this)">
                <span class="platform-badge" id="platformBadge1" style="background: #666; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">🏷️ Auto-Detect</span>
                <button type="button" class="remove-link-btn" onclick="removeLink(this)" style="display:none;">✕</button>
            </div>
        </div>
    `;
    linkCounter = 1;
    folderProducts = [];
    renderFolderProducts();
    
    const preview = document.getElementById("imagePreview");
    if(preview) preview.remove();
    
    document.getElementById("imageFile").required = true;
    editingProductId = null;
    currentImageUrl = null;
    document.getElementById("publishBtn").textContent = "🚀 Publish Product";
    document.getElementById("formTitle").textContent = "📝 Add New Product";
}

async function loadProductsList() {
    const { data: products, error } = await supabaseClient.from("products").select("*").order('created_at', { ascending: false });
    
    if(error) {
        console.error(error);
        return;
    }
    
    const listDiv = document.getElementById("productsList");
    if(!products || products.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; padding:20px;">No products yet. Create your first product above! 🚀</p>';
        return;
    }
    
    listDiv.innerHTML = '<h3 style="margin-top:30px;">📦 Your Products</h3>';
    
    products.forEach(product => {
        const totalClicks = product.clicks || 0;
        const productType = product.product_type || 'single';
        const isFolder = productType === 'folder';
        const folderCount = product.folder_products ? product.folder_products.length : 0;
        
        // Get platform links for display
        let platformBadges = '';
        if (product.links) {
            product.links.forEach(link => {
                platformBadges += `<span style="background: ${getPlatformColor(link.platform)}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; margin: 2px;">${getPlatformIcon(link.platform)} ${link.platform}</span>`;
            });
        }
        
        listDiv.innerHTML += `
            <div class="product-item">
                <img src="${product.thumbnail}" alt="${product.title}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
                <div class="product-info">
                    <h4 style="margin:0;">${escapeHtml(product.title)} ${isFolder ? '📁' : '📄'}</h4>
                    ${isFolder ? `<p style="font-size:12px; color:#667eea; margin:2px 0;">📂 ${folderCount} products in folder</p>` : ''}
                    <p style="font-size:12px; color:#667eea; margin:5px 0 0;">
                        📊 Total Views: <strong>${totalClicks}</strong>
                    </p>
                    <div style="display:flex; gap:5px; margin-top:5px; flex-wrap:wrap; font-size:11px;">
                        ${platformBadges}
                    </div>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
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

async function editProduct(id) {
    const { data: product, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
    
    if(error) {
        alert("Error loading product");
        return;
    }
    
    editingProductId = id;
    currentImageUrl = product.thumbnail;
    
    document.getElementById("title").value = product.title;
    document.getElementById("category").value = product.category;
    document.getElementById("productType").value = product.product_type || 'single';
    
    // Load links
    if (product.links && product.links.length > 0) {
        const container = document.getElementById('linksContainer');
        container.innerHTML = '';
        linkCounter = 0;
        product.links.forEach((link, index) => {
            linkCounter++;
            const group = document.createElement('div');
            group.className = 'link-group';
            group.id = `linkGroup${linkCounter}`;
            const showRemove = product.links.length > 1 ? 'inline-block' : 'none';
            group.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; margin: 10px 0;">
                    <input type="url" class="admin-input link-input" placeholder="🔗 Product Link *" style="flex: 1;" value="${escapeHtml(link.url)}" oninput="detectPlatform(this)">
                    <span class="platform-badge" id="platformBadge${linkCounter}" style="background: ${getPlatformColor(link.platform)}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">${getPlatformIcon(link.platform)} ${link.platform}</span>
                    <button type="button" class="remove-link-btn" onclick="removeLink(this)" style="display:${showRemove};">✕</button>
                </div>
            `;
            container.appendChild(group);
        });
    }
    
    // Load folder products if folder type
    if (product.product_type === 'folder' && product.folder_products) {
        folderProducts = product.folder_products;
        renderFolderProducts();
        document.getElementById('folderProductsContainer').style.display = 'block';
        document.getElementById('title').placeholder = '📁 Folder Name *';
        document.getElementById('formTitle').textContent = '📁 Edit Folder';
    } else {
        document.getElementById('folderProductsContainer').style.display = 'none';
        document.getElementById('title').placeholder = 'Product Name *';
        document.getElementById('formTitle').textContent = '✏️ Edit Product';
    }
    
    document.getElementById("publishBtn").textContent = "✏️ Update Product";
    
    showImagePreview(product.thumbnail);
    document.getElementById("imageFile").required = false;
    document.getElementById("imageFile").value = "";
    
    document.querySelector(".admin-container").scrollIntoView({ behavior: 'smooth' });
}

function showImagePreview(imageUrl) {
    const existingPreview = document.getElementById("imagePreview");
    if(existingPreview) existingPreview.remove();
    
    const container = document.createElement("div");
    container.id = "imagePreview";
    container.style.cssText = `
        margin: 10px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 10px;
        text-align: center;
        position: relative;
    `;
    
    if(document.body.classList.contains('dark')) {
        container.style.background = '#2a2a35';
    }
    
    container.innerHTML = `
        <p style="font-size:14px; margin-bottom:10px; color:#666;">📸 Current Image</p>
        <img src="${imageUrl}" alt="Current product image" 
             style="max-width:200px; max-height:200px; border-radius:10px; border:2px solid #667eea;">
        <p style="font-size:12px; margin-top:10px; color:#999;">
            💡 Upload a new image to replace this one (optional)
        </p>
    `;
    
    const fileInput = document.getElementById("imageFile");
    fileInput.parentNode.insertBefore(container, fileInput);
}

async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product? This action cannot be undone!")) {
        return;
    }
    
    const { error } = await supabaseClient.from("products").delete().eq("id", id);
    
    if(error) {
        alert("Error deleting product: " + error.message);
    } else {
        alert("✅ Product deleted successfully!");
        loadProductsList();
        
        if(editingProductId === id) {
            resetForm();
        }
    }
}

// Theme toggle functions
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
    
    const preview = document.getElementById("imagePreview");
    if(preview) {
        if(isDark) {
            preview.style.background = '#2a2a35';
        } else {
            preview.style.background = '#f8f9fa';
        }
    }
}

// Initialize
checkAuth();
loadProductsList();
initTheme();