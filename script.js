// ===== UniPass - Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {

  // ===== STATE =====
  let currentUser = null;
  let uploadedImages = []; // base64 strings
  let universitiesCache = []; // Cache fetched universities
  let selectedHeaderSchool = ''; // Currently selected school for filtering

  // ===== API ENDPOINTS =====
  const API_UNIVERSITIES = 'https://universities.hipolabs.com/search?country=Vietnam';

  // ===== DOM REFS =====
  const $ = id => document.getElementById(id);
  const avatar = $('user-avatar');
  const userMenu = $('user-menu');
  const modalAuth = $('modal-auth');
  const modalSell = $('modal-sell');
  const modalSettings = $('modal-settings');
  const productGrid = $('product-grid');
  const emptyProducts = $('empty-products');
  const emptyPosts = $('empty-posts');
  const myPostsGrid = $('my-posts-grid');
  const toastContainer = $('toast-container');

  // ===== TOAST =====
  function showToast(message, type = 'success') {
    const icons = {
      success: '<i class="fas fa-check-circle toast-success-icon"></i>',
      error: '<i class="fas fa-exclamation-circle toast-error-icon"></i>',
      info: '<i class="fas fa-info-circle toast-info-icon"></i>'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== HELPERS =====
  function showModal(m) { m.classList.remove('hidden'); }
  function hideModal(m) { m.classList.add('hidden'); }
  function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
  function hideError(el) { el.classList.add('hidden'); }

  function formatPrice(num) {
    return Number(num).toLocaleString('vi-VN') + 'đ';
  }

  function formatNumberInput(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('vi-VN');
  }

  // ===== CONDITION LABELS =====
  const conditionLabels = {
    'new': 'Mới 100%',
    'like-new': 'Như mới',
    'good': 'Còn tốt',
    'used': 'Đã qua SD',
    'need-repair': 'Cần sửa chữa'
  };

  // ===================================================================
  // ===== FALLBACK DATA (used when APIs are blocked e.g. file://) =====
  // ===================================================================
  const FALLBACK_UNIVERSITIES = [
    { name: 'An Giang University', 'state-province': 'An Giang', domains: ['agu.edu.vn'] },
    { name: 'Banking Academy', 'state-province': 'Hanoi', domains: ['hvnh.edu.vn'] },
    { name: 'Can Tho University', 'state-province': 'Can Tho', domains: ['ctu.edu.vn'] },
    { name: 'Da Nang University of Science and Technology', 'state-province': 'Da Nang', domains: ['dut.udn.vn'] },
    { name: 'Duy Tan University', 'state-province': 'Da Nang', domains: ['duytan.edu.vn'] },
    { name: 'FPT University', 'state-province': 'Hanoi', domains: ['fpt.edu.vn'] },
    { name: 'Foreign Trade University', 'state-province': 'Hanoi', domains: ['ftu.edu.vn'] },
    { name: 'Hanoi Medical University', 'state-province': 'Hanoi', domains: ['hmu.edu.vn'] },
    { name: 'Hanoi National University of Education', 'state-province': 'Hanoi', domains: ['hnue.edu.vn'] },
    { name: 'Hanoi University', 'state-province': 'Hanoi', domains: ['hanu.edu.vn'] },
    { name: 'Hanoi University of Industry', 'state-province': 'Hanoi', domains: ['haui.edu.vn'] },
    { name: 'Hanoi University of Mining and Geology', 'state-province': 'Hanoi', domains: ['humg.edu.vn'] },
    { name: 'Hanoi University of Science and Technology', 'state-province': 'Hanoi', domains: ['hust.edu.vn'] },
    { name: 'Ho Chi Minh City Open University', 'state-province': 'Ho Chi Minh City', domains: ['ou.edu.vn'] },
    { name: 'Ho Chi Minh City University of Agriculture and Forestry', 'state-province': 'Ho Chi Minh City', domains: ['hcmuaf.edu.vn'] },
    { name: 'Ho Chi Minh City University of Technology (HUTECH)', 'state-province': 'Ho Chi Minh City', domains: ['hutech.edu.vn'] },
    { name: 'Ho Chi Minh City University of Technology and Education', 'state-province': 'Ho Chi Minh City', domains: ['hcmute.edu.vn'] },
    { name: 'Hoa Sen University', 'state-province': 'Ho Chi Minh City', domains: ['hoasen.edu.vn'] },
    { name: 'Hue University', 'state-province': 'Hue', domains: ['hueuni.edu.vn'] },
    { name: 'Industrial University of Ho Chi Minh City', 'state-province': 'Ho Chi Minh City', domains: ['iuh.edu.vn'] },
    { name: 'International University - VNU HCMC', 'state-province': 'Ho Chi Minh City', domains: ['hcmiu.edu.vn'] },
    { name: 'Lac Hong University', 'state-province': 'Dong Nai', domains: ['lhu.edu.vn'] },
    { name: 'National Economics University', 'state-province': 'Hanoi', domains: ['neu.edu.vn'] },
    { name: 'Nha Trang University', 'state-province': 'Khanh Hoa', domains: ['ntu.edu.vn'] },
    { name: 'Phan Chau Trinh University', 'state-province': null, domains: ['pctu.edu.vn'] },
    { name: 'Posts and Telecommunications Institute of Technology', 'state-province': 'Hanoi', domains: ['ptit.edu.vn'] },
    { name: 'Quy Nhon University', 'state-province': 'Binh Dinh', domains: ['qnu.edu.vn'] },
    { name: 'RMIT University Vietnam', 'state-province': 'Ho Chi Minh City', domains: ['rmit.edu.vn'] },
    { name: 'Saigon University', 'state-province': 'Ho Chi Minh City', domains: ['sgu.edu.vn'] },
    { name: 'Thai Nguyen University', 'state-province': 'Thai Nguyen', domains: ['tnu.edu.vn'] },
    { name: 'Thu Dau Mot University', 'state-province': 'Binh Duong', domains: ['tdmu.edu.vn'] },
    { name: 'Ton Duc Thang University', 'state-province': 'Ho Chi Minh City', domains: ['tdtu.edu.vn'] },
    { name: 'University of Da Nang', 'state-province': 'Da Nang', domains: ['udn.vn'] },
    { name: 'University of Economics Ho Chi Minh City', 'state-province': 'Ho Chi Minh City', domains: ['ueh.edu.vn'] },
    { name: 'University of Information Technology - VNU HCMC', 'state-province': 'Ho Chi Minh City', domains: ['uit.edu.vn'] },
    { name: 'University of Law Ho Chi Minh City', 'state-province': 'Ho Chi Minh City', domains: ['hcmulaw.edu.vn'] },
    { name: 'University of Medicine and Pharmacy at Ho Chi Minh City', 'state-province': 'Ho Chi Minh City', domains: ['ump.edu.vn'] },
    { name: 'University of Science - VNU HCMC', 'state-province': 'Ho Chi Minh City', domains: ['hcmus.edu.vn'] },
    { name: 'University of Social Sciences and Humanities - VNU HCMC', 'state-province': 'Ho Chi Minh City', domains: ['hcmussh.edu.vn'] },
    { name: 'University of Technology - VNU HCMC', 'state-province': 'Ho Chi Minh City', domains: ['hcmut.edu.vn'] },
    { name: 'University of Transport and Communications', 'state-province': 'Hanoi', domains: ['utc.edu.vn'] },
    { name: 'Van Lang University', 'state-province': 'Ho Chi Minh City', domains: ['vlu.edu.vn'] },
    { name: 'Vietnam Maritime University', 'state-province': 'Hai Phong', domains: ['vimaru.edu.vn'] },
    { name: 'Vietnam National University Hanoi', 'state-province': 'Hanoi', domains: ['vnu.edu.vn'] },
    { name: 'Vinh University', 'state-province': 'Nghe An', domains: ['vinhuni.edu.vn'] },
    { name: 'VinUniversity', 'state-province': 'Hanoi', domains: ['vinuni.edu.vn'] },
  ];

  // ===================================================================
  // ===== API: FETCH UNIVERSITIES (with fallback) =====
  // ===================================================================
  async function fetchUniversities() {
    if (universitiesCache.length > 0) return universitiesCache;
    try {
      const res = await fetch(API_UNIVERSITIES);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      universitiesCache = data.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`✅ Loaded ${universitiesCache.length} universities from API`);
      return universitiesCache;
    } catch (err) {
      console.warn('⚠️ API failed, using fallback university data:', err.message);
      universitiesCache = FALLBACK_UNIVERSITIES;
      return universitiesCache;
    }
  }

  // ===================================================================
  // ===== REUSABLE: University Autocomplete Component =====
  // ===================================================================
  function setupUniversityAutocomplete(inputEl, listEl, wrapperEl, onSelect) {
    let debounce;
    inputEl.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const query = inputEl.value.toLowerCase().trim();
        if (query.length < 1) {
          listEl.classList.add('hidden');
          return;
        }
        const unis = await fetchUniversities();
        const filtered = unis.filter(u =>
          u.name.toLowerCase().includes(query) ||
          (u['state-province'] && u['state-province'].toLowerCase().includes(query)) ||
          (u.domains && u.domains.some(d => d.toLowerCase().includes(query)))
        ).slice(0, 12);

        if (filtered.length === 0) {
          listEl.innerHTML = '<div class="loc-no-result">Không tìm thấy trường</div>';
          listEl.classList.remove('hidden');
          return;
        }

        listEl.innerHTML = '';
        filtered.forEach(u => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          const province = u['state-province'] ? `<span class="uni-domain">${u['state-province']}</span>` : '';
          div.innerHTML = `<i class="fas fa-university"></i> ${u.name} ${province}`;
          div.addEventListener('click', () => {
            inputEl.value = u.name;
            listEl.classList.add('hidden');
            if (onSelect) onSelect(u);
          });
          listEl.appendChild(div);
        });
        listEl.classList.remove('hidden');
      }, 200);
    });

    inputEl.addEventListener('focus', () => {
      if (inputEl.value.trim().length >= 1) {
        inputEl.dispatchEvent(new Event('input'));
      }
    });

    document.addEventListener('click', e => {
      if (wrapperEl && !wrapperEl.contains(e.target)) {
        listEl.classList.add('hidden');
      }
    });
  }

  // ===================================================================
  // ===== 1. HEADER LOCATION DROPDOWN (Universities) =====
  // ===================================================================
  const locSelector = $('location-selector');
  const locDropdown = $('location-dropdown');
  const locText = $('location-text');
  const locList = $('loc-list');
  const locSearch = $('loc-search');

  async function populateLocationDropdown() {
    const unis = await fetchUniversities();
    if (unis.length === 0) {
      locList.innerHTML = '<div class="loc-no-result"><i class="fas fa-exclamation-triangle"></i> Không tải được dữ liệu</div>';
      return;
    }
    renderLocOptions(unis);
  }

  function renderLocOptions(unis) {
    locList.innerHTML = '';
    if (unis.length === 0) {
      locList.innerHTML = '<div class="loc-no-result">Không tìm thấy trường nào</div>';
      return;
    }
    unis.forEach(u => {
      const div = document.createElement('div');
      div.className = 'loc-option';
      div.dataset.value = u.name;
      if (selectedHeaderSchool === u.name) div.classList.add('active');
      const province = u['state-province'] ? ` <span style="color:var(--text-muted);font-size:11px;">(${u['state-province']})</span>` : '';
      div.innerHTML = u.name + province;
      div.addEventListener('click', () => {
        document.querySelectorAll('.loc-option').forEach(o => o.classList.remove('active'));
        div.classList.add('active');
        selectedHeaderSchool = u.name;
        locText.textContent = u.name.length > 18 ? u.name.substring(0, 18) + '…' : u.name;
        locText.title = u.name;
        locDropdown.classList.add('hidden');
        locSearch.value = '';
        // Trigger filter with new school
        applyFilters();
        updateProductsTitle();
      });
      locList.appendChild(div);
    });
  }

  function updateProductsTitle() {
    const title = document.querySelector('.products-title');
    if (title) {
      title.textContent = selectedHeaderSchool
        ? `Sản phẩm tại ${selectedHeaderSchool.length > 30 ? selectedHeaderSchool.substring(0, 30) + '…' : selectedHeaderSchool}`
        : 'Sản phẩm gần bạn';
    }
  }

  // "Tất cả" option click handler
  const allOption = locDropdown.querySelector('.loc-option[data-value="Tất cả"]');
  if (allOption) {
    allOption.addEventListener('click', () => {
      document.querySelectorAll('.loc-option').forEach(o => o.classList.remove('active'));
      allOption.classList.add('active');
      selectedHeaderSchool = '';
      locText.textContent = 'Chọn trường';
      locText.title = '';
      locDropdown.classList.add('hidden');
      locSearch.value = '';
      applyFilters();
      updateProductsTitle();
    });
  }

  if (locSearch) {
    locSearch.addEventListener('input', () => {
      const query = locSearch.value.toLowerCase().trim();
      if (!query) {
        renderLocOptions(universitiesCache);
        return;
      }
      const filtered = universitiesCache.filter(u =>
        u.name.toLowerCase().includes(query) ||
        (u['state-province'] && u['state-province'].toLowerCase().includes(query)) ||
        (u.domains && u.domains.some(d => d.toLowerCase().includes(query)))
      );
      renderLocOptions(filtered);
    });
    locSearch.addEventListener('click', e => e.stopPropagation());
  }

  if (locSelector) {
    locSelector.addEventListener('click', e => {
      e.stopPropagation();
      locDropdown.classList.toggle('hidden');
      if (!locDropdown.classList.contains('hidden')) {
        setTimeout(() => locSearch?.focus(), 100);
        if (universitiesCache.length === 0) {
          populateLocationDropdown();
        }
      }
    });
  }

  // ===== AVATAR / AUTH =====
  avatar.addEventListener('click', e => {
    e.stopPropagation();
    if (!currentUser) {
      openAuthModal('login');
    } else {
      userMenu.classList.toggle('hidden');
    }
  });

  document.addEventListener('click', e => {
    if (!userMenu.contains(e.target) && e.target !== avatar) {
      userMenu.classList.add('hidden');
    }
    const locWrapper = document.querySelector('.location-wrapper');
    if (locWrapper && !locWrapper.contains(e.target)) {
      locDropdown.classList.add('hidden');
    }
  });

  // ===== 3. AUTH MODAL =====
  function openAuthModal(mode) {
    showModal(modalAuth);
    if (mode === 'register') {
      $('form-login').classList.add('hidden');
      $('form-register').classList.remove('hidden');
    } else {
      $('form-login').classList.remove('hidden');
      $('form-register').classList.add('hidden');
    }
    hideError($('login-error'));
    hideError($('reg-error'));
  }

  $('modal-auth-close').addEventListener('click', () => hideModal(modalAuth));
  modalAuth.addEventListener('click', e => { if (e.target === modalAuth) hideModal(modalAuth); });
  $('switch-to-register').addEventListener('click', e => { e.preventDefault(); openAuthModal('register'); });
  $('switch-to-login').addEventListener('click', e => { e.preventDefault(); openAuthModal('login'); });

  // LOGIN
  $('btn-do-login').addEventListener('click', () => {
    const email = $('login-email').value.trim();
    const password = $('login-password').value.trim();
    const err = $('login-error');

    if (!email) { showError(err, 'Vui lòng nhập email.'); return; }
    if (!email.includes('@')) { showError(err, 'Email không hợp lệ.'); return; }
    if (!password) { showError(err, 'Vui lòng nhập mật khẩu.'); return; }
    if (password.length < 6) { showError(err, 'Mật khẩu tối thiểu 6 ký tự.'); return; }

    const stored = JSON.parse(localStorage.getItem('unipass_users') || '[]');
    const user = stored.find(u => u.email === email);

    if (!user) { showError(err, 'Tài khoản không tồn tại. Hãy đăng ký.'); return; }
    if (user.password !== password) { showError(err, 'Sai mật khẩu.'); return; }

    loginAs(user);
    hideModal(modalAuth);
    showToast(`Chào mừng ${currentUser.name}! 👋`);
    $('login-email').value = '';
    $('login-password').value = '';
  });

  // REGISTER
  $('btn-do-register').addEventListener('click', () => {
    const name = $('reg-name').value.trim();
    const email = $('reg-email').value.trim();
    const password = $('reg-password').value.trim();
    const err = $('reg-error');

    if (!name) { showError(err, 'Vui lòng nhập họ tên.'); return; }
    if (!email || !email.includes('@')) { showError(err, 'Email không hợp lệ.'); return; }
    if (!password || password.length < 6) { showError(err, 'Mật khẩu tối thiểu 6 ký tự.'); return; }

    const stored = JSON.parse(localStorage.getItem('unipass_users') || '[]');
    if (stored.find(u => u.email === email)) { showError(err, 'Email đã được đăng ký.'); return; }

    const newUser = { name, email, password, phone: '', school: '' };
    stored.push(newUser);
    localStorage.setItem('unipass_users', JSON.stringify(stored));
    loginAs(newUser);
    hideModal(modalAuth);
    showToast(`Đăng ký thành công! Chào ${currentUser.name} 🎉`);
    $('reg-name').value = '';
    $('reg-email').value = '';
    $('reg-password').value = '';
  });

  function loginAs(user) {
    currentUser = { name: user.name, email: user.email, phone: user.phone || '', school: user.school || '' };
    localStorage.setItem('unipass_current', JSON.stringify(currentUser));
    avatar.classList.add('logged-in');
    avatar.innerHTML = currentUser.name.charAt(0).toUpperCase();
    avatar.title = currentUser.name;
    $('menu-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    $('menu-name').textContent = currentUser.name;
    $('menu-email').textContent = currentUser.email;
    loadProducts();
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('unipass_current');
    avatar.classList.remove('logged-in');
    avatar.innerHTML = '<i class="fas fa-user"></i>';
    avatar.title = 'Đăng nhập';
    userMenu.classList.add('hidden');
    showToast('Đã đăng xuất.', 'info');
    loadProducts();
  }

  $('btn-logout').addEventListener('click', logout);

  // ===== 4. USER MENU NAV =====
  document.querySelectorAll('.user-menu-item[data-tab]').forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
      userMenu.classList.add('hidden');
    });
  });

  // ===================================================================
  // ===== 5. SETTINGS (with University Autocomplete) =====
  // ===================================================================
  const settingsSchoolInput = $('settings-school');
  const schoolAutocompleteList = $('school-autocomplete-list');

  $('menu-settings').addEventListener('click', () => {
    userMenu.classList.add('hidden');
    if (!currentUser) return;
    $('settings-name').value = currentUser.name;
    $('settings-email').value = currentUser.email;
    $('settings-phone').value = currentUser.phone || '';
    settingsSchoolInput.value = currentUser.school || '';
    hideError($('settings-error'));
    showModal(modalSettings);
    if (universitiesCache.length === 0) fetchUniversities();
  });

  // Settings school autocomplete
  if (settingsSchoolInput) {
    setupUniversityAutocomplete(
      settingsSchoolInput,
      schoolAutocompleteList,
      $('school-autocomplete'),
      null // no special callback needed
    );
  }

  $('modal-settings-close').addEventListener('click', () => hideModal(modalSettings));
  modalSettings.addEventListener('click', e => { if (e.target === modalSettings) hideModal(modalSettings); });

  $('btn-save-settings').addEventListener('click', () => {
    const name = $('settings-name').value.trim();
    const phone = $('settings-phone').value.trim();
    const school = settingsSchoolInput.value.trim();
    if (!name) { showError($('settings-error'), 'Họ tên không được để trống.'); return; }

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.school = school;
    localStorage.setItem('unipass_current', JSON.stringify(currentUser));

    const stored = JSON.parse(localStorage.getItem('unipass_users') || '[]');
    const idx = stored.findIndex(u => u.email === currentUser.email);
    if (idx >= 0) { Object.assign(stored[idx], { name, phone, school }); localStorage.setItem('unipass_users', JSON.stringify(stored)); }

    avatar.innerHTML = name.charAt(0).toUpperCase();
    avatar.title = name;
    $('menu-avatar').textContent = name.charAt(0).toUpperCase();
    $('menu-name').textContent = name;
    hideModal(modalSettings);
    showToast('Đã lưu thay đổi! ✅');
  });

  // ===================================================================
  // ===== 6. SELL FLOW (with University Autocomplete) =====
  // ===================================================================
  function requireLogin() {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập trước.', 'info');
      openAuthModal('login');
      return false;
    }
    return true;
  }

  ['btn-sell', 'btn-hero-sell', 'btn-empty-sell', 'btn-empty-post'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('click', () => { if (requireLogin()) openSellModal(); });
  });

  // Sell school autocomplete
  const sellSchoolInput = $('sell-school');
  const sellSchoolList = $('sell-school-list');
  if (sellSchoolInput) {
    setupUniversityAutocomplete(
      sellSchoolInput,
      sellSchoolList,
      $('sell-school-autocomplete'),
      null
    );
  }

  function openSellModal() {
    $('sell-name').value = '';
    $('sell-price').value = '';
    $('sell-condition').value = 'good';
    $('sell-condition-custom').classList.add('hidden');
    $('sell-condition-custom').value = '';
    $('sell-category').value = 'Giáo trình, Tài liệu';
    sellSchoolInput.value = '';
    $('sell-address').value = '';
    $('sell-desc').value = '';
    uploadedImages = [];
    $('image-preview-list').innerHTML = '';
    $('upload-placeholder').classList.remove('hidden');
    hideError($('sell-error'));
    showModal(modalSell);
  }

  $('modal-sell-close').addEventListener('click', () => hideModal(modalSell));
  modalSell.addEventListener('click', e => { if (e.target === modalSell) hideModal(modalSell); });

  // ===== SELL: Price auto-format =====
  const sellPriceInput = $('sell-price');
  if (sellPriceInput) {
    sellPriceInput.addEventListener('input', () => {
      const cursor = sellPriceInput.selectionStart;
      const oldLen = sellPriceInput.value.length;
      sellPriceInput.value = formatNumberInput(sellPriceInput.value);
      const newLen = sellPriceInput.value.length;
      sellPriceInput.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));
    });
  }

  // ===== SELL: Condition "custom" toggle =====
  const sellCondition = $('sell-condition');
  const sellCondCustom = $('sell-condition-custom');
  if (sellCondition) {
    sellCondition.addEventListener('change', () => {
      if (sellCondition.value === 'custom') {
        sellCondCustom.classList.remove('hidden');
        sellCondCustom.focus();
      } else {
        sellCondCustom.classList.add('hidden');
      }
    });
  }

  // ===== SELL: Image Upload =====
  const uploadArea = $('image-upload-area');
  const fileInput = $('sell-images');
  const previewList = $('image-preview-list');
  const uploadPlaceholder = $('upload-placeholder');

  if (uploadArea) {
    uploadArea.addEventListener('click', e => {
      if (e.target.closest('.image-preview-remove')) return;
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
      handleFiles(fileInput.files);
      fileInput.value = '';
    });
  }

  function handleFiles(files) {
    const remaining = 5 - uploadedImages.length;
    if (remaining <= 0) { showToast('Tối đa 5 ảnh.', 'error'); return; }

    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { showToast(`${file.name} quá lớn (>5MB).`, 'error'); return; }

      const reader = new FileReader();
      reader.onload = e => {
        const base64 = e.target.result;
        uploadedImages.push(base64);
        renderImagePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImagePreview() {
    previewList.innerHTML = '';
    if (uploadedImages.length > 0) {
      uploadPlaceholder.classList.add('hidden');
    } else {
      uploadPlaceholder.classList.remove('hidden');
    }

    uploadedImages.forEach((img, idx) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${img}" alt="Preview ${idx + 1}">
        <button class="image-preview-remove" data-idx="${idx}" title="Xóa"><i class="fas fa-times"></i></button>
      `;
      div.querySelector('.image-preview-remove').addEventListener('click', e => {
        e.stopPropagation();
        uploadedImages.splice(idx, 1);
        renderImagePreview();
      });
      previewList.appendChild(div);
    });
  }

  // ===== SELL: Post product =====
  $('btn-do-sell').addEventListener('click', () => {
    const name = $('sell-name').value.trim();
    const priceRaw = $('sell-price').value.replace(/\D/g, '');
    let condition = $('sell-condition').value;
    const category = $('sell-category').value;
    const school = sellSchoolInput.value.trim();
    const address = $('sell-address').value.trim();
    const desc = $('sell-desc').value.trim();
    const err = $('sell-error');

    // Build location display text
    const location = address ? `${address}, ${school}` : school;

    if (!name) { showError(err, 'Vui lòng nhập tên sản phẩm.'); return; }
    if (!priceRaw || Number(priceRaw) <= 0) { showError(err, 'Vui lòng nhập giá hợp lệ.'); return; }
    if (!school) { showError(err, 'Vui lòng chọn trường.'); return; }

    // Custom condition
    if (condition === 'custom') {
      const customVal = $('sell-condition-custom').value.trim();
      if (!customVal) { showError(err, 'Vui lòng nhập tình trạng sản phẩm.'); return; }
      condition = customVal;
    }

    const product = {
      id: Date.now(),
      name,
      price: Number(priceRaw),
      condition,
      category,
      school,      // university name — used for filtering
      location,    // display string (address + school)
      desc,
      images: [...uploadedImages],
      seller: currentUser.name,
      email: currentUser.email,
      timestamp: new Date().toISOString()
    };

    const all = JSON.parse(localStorage.getItem('unipass_products') || '[]');
    all.unshift(product);
    localStorage.setItem('unipass_products', JSON.stringify(all));

    hideModal(modalSell);
    showToast('Đăng bán thành công! 🎉');
    loadProducts();
  });

  // ===== 7. LOAD & RENDER =====
  function loadProducts() {
    const all = JSON.parse(localStorage.getItem('unipass_products') || '[]');

    renderProductGrid(productGrid, all, emptyProducts);
    // Apply current filters after rendering
    applyFilters();

    if (currentUser) {
      const mine = all.filter(p => p.email === currentUser.email);
      renderProductGrid(myPostsGrid, mine, emptyPosts);
    } else {
      if (myPostsGrid) myPostsGrid.innerHTML = '';
      if (emptyPosts) emptyPosts.classList.remove('hidden');
    }
  }

  const gradients = [
    'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
    'linear-gradient(135deg,#c7d2fe,#818cf8)',
    'linear-gradient(135deg,#a7f3d0,#6ee7b7)',
    'linear-gradient(135deg,#fde68a,#fbbf24)',
    'linear-gradient(135deg,#fbcfe8,#f9a8d4)',
    'linear-gradient(135deg,#bfdbfe,#93c5fd)',
    'linear-gradient(135deg,#d9f99d,#a3e635)',
    'linear-gradient(135deg,#fecaca,#fca5a5)'
  ];

  const categoryIcons = {
    'Giáo trình, Tài liệu': 'fa-book',
    'Đồ dùng học tập': 'fa-pencil-alt',
    'Bàn ghế, Đèn học': 'fa-chair',
    'Đồ điện tử': 'fa-laptop',
    'Xe cộ': 'fa-motorcycle',
    'Đồ dùng ký túc xá': 'fa-bed',
    'Đồ dùng cá nhân': 'fa-user-tie',
    'Khác': 'fa-box'
  };

  function getConditionBadge(condition) {
    const presets = {
      'new': { cls: 'badge-new', text: 'Mới 100%' },
      'like-new': { cls: 'badge-new', text: 'Như mới' },
      'good': { cls: 'badge-good', text: 'Còn tốt' },
      'used': { cls: 'badge-used', text: 'Đã qua SD' },
      'need-repair': { cls: 'badge-repair', text: 'Cần sửa chữa' }
    };
    if (presets[condition]) return presets[condition];
    return { cls: 'badge-custom', text: condition };
  }

  function renderProductGrid(container, items, emptyEl) {
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    items.forEach((p, i) => {
      const gradient = gradients[i % gradients.length];
      const icon = categoryIcons[p.category] || 'fa-box';
      const badge = getConditionBadge(p.condition);
      const hasImage = p.images && p.images.length > 0;

      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.price = p.price;
      card.dataset.condition = p.condition;
      card.dataset.category = p.category || '';
      card.dataset.school = p.school || p.location || ''; // for school-based filtering
      card.style.animationDelay = `${i * 0.05}s`;

      const imageContent = hasImage
        ? `<img src="${p.images[0]}" alt="${p.name}">`
        : `<i class="fas ${icon} product-image-placeholder"></i>`;

      // Show school tag on card
      const schoolTag = p.school
        ? `<div class="product-school"><i class="fas fa-university"></i> ${p.school}</div>`
        : '';

      card.innerHTML = `
        <div class="product-image" style="background:${gradient};">
          ${imageContent}
          <button class="wishlist-btn" title="Yêu thích"><i class="far fa-heart"></i></button>
        </div>
        <div class="product-info">
          <span class="product-badge ${badge.cls}">${badge.text}</span>
          <h3 class="product-name">${p.name}</h3>
          <div class="product-price">${formatPrice(p.price)}</div>
          ${schoolTag}
          <div class="product-meta">
            <div class="seller-info">
              <div class="seller-avatar"></div>
              <span class="seller-name">${p.seller}</span>
            </div>
            <div class="product-location">
              <i class="fas fa-map-marker-alt"></i> ${p.location}
            </div>
          </div>
        </div>
      `;

      const wishBtn = card.querySelector('.wishlist-btn');
      wishBtn.addEventListener('click', e => {
        e.stopPropagation();
        const ic = wishBtn.querySelector('i');
        ic.classList.toggle('far');
        ic.classList.toggle('fas');
        wishBtn.classList.toggle('liked');
        wishBtn.style.transform = 'scale(1.3)';
        setTimeout(() => wishBtn.style.transform = '', 200);
      });

      container.appendChild(card);
    });
  }

  // ===== 8. TAB SWITCHING =====
  const subNavLinks = document.querySelectorAll('.sub-nav a');
  const tabPages = document.querySelectorAll('.tab-page');

  function switchTab(tabId) {
    subNavLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
    tabPages.forEach(p => p.classList.toggle('active', p.id === tabId));
  }

  subNavLinks.forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchTab(link.dataset.tab); });
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.goto));
  });

  // ===== 9. FILTER TABS =====
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyFilters();
    });
  });

  // ===== 10. SEARCH =====
  const searchInput = $('search-input');
  if (searchInput) searchInput.addEventListener('input', () => applyFilters());

  // ===== 11. SIDEBAR FILTERS =====
  const priceFrom = $('price-from');
  const priceTo = $('price-to');
  const condFilters = document.querySelectorAll('.cond-filter');
  const customCondition = $('custom-condition');

  [priceFrom, priceTo].forEach(el => { if (el) el.addEventListener('input', () => applyFilters()); });
  condFilters.forEach(el => el.addEventListener('change', () => applyFilters()));
  if (customCondition) customCondition.addEventListener('input', () => applyFilters());

  // ===================================================================
  // ===== UNIFIED FILTER ENGINE =====
  // All filters (search, category, price, condition, school, tabs) go here
  // ===================================================================
  function applyFilters() {
    const cards = productGrid.querySelectorAll('.product-card');
    const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
    const query = searchInput?.value.toLowerCase().trim() || '';
    const from = parseInt(priceFrom?.value.replace(/\D/g, '')) || 0;
    const to = parseInt(priceTo?.value.replace(/\D/g, '')) || Infinity;

    const checkedConds = Array.from(condFilters).filter(c => c.checked).map(c => c.value);
    const customCond = customCondition?.value.toLowerCase().trim() || '';

    // Active category from category bar
    const activeCat = document.querySelector('.category-item.active');
    const categoryFilter = activeCat ? activeCat.dataset.category : '';

    let visibleCount = 0;

    cards.forEach(card => {
      const price = parseInt(card.dataset.price) || 0;
      const condition = card.dataset.condition || '';
      const category = card.dataset.category || '';
      const school = card.dataset.school || '';
      const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';

      let show = true;

      // Filter tab: cheap
      if (activeFilter === 'cheap' && price >= 200000) show = false;

      // Filter tab: near school (only show products at the selected school)
      if (activeFilter === 'near' && selectedHeaderSchool) {
        if (!school.toLowerCase().includes(selectedHeaderSchool.toLowerCase())) show = false;
      } else if (activeFilter === 'near' && !selectedHeaderSchool) {
        // "Gần trường" clicked but no school selected — show all (or prompt)
        // We'll still show all but the title hint will say "Chọn trường trước"
      }

      // Header school filter (applies to all tabs)
      if (selectedHeaderSchool && activeFilter !== 'near') {
        // In non-"near" tabs, school filter from header is a soft filter — still applies
        if (!school.toLowerCase().includes(selectedHeaderSchool.toLowerCase())) show = false;
      }

      // Search query
      if (query && !name.includes(query)) show = false;

      // Price range
      if (price < from || price > to) show = false;

      // Condition checkboxes
      if (checkedConds.length > 0 && !checkedConds.includes(condition)) show = false;
      if (customCond && !condition.toLowerCase().includes(customCond)) show = false;

      // Category bar
      if (categoryFilter && category !== categoryFilter) show = false;

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Show/hide empty state based on visible cards
    if (cards.length > 0) {
      if (visibleCount === 0) {
        emptyProducts.classList.remove('hidden');
        emptyProducts.querySelector('h3').textContent = 'Không tìm thấy sản phẩm';
        emptyProducts.querySelector('p').textContent = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.';
      } else {
        emptyProducts.classList.add('hidden');
      }
    }
  }

  // ===== 12. CATEGORY BAR — now triggers real filtering =====
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
      applyFilters();
    });
  });

  // ===== 13. SORT — now actually sorts products =====
  const sortBtn = $('btn-sort');
  const sortOpts = ['Mới nhất', 'Giá thấp → cao', 'Giá cao → thấp'];
  let sortIdx = 0;
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortIdx = (sortIdx + 1) % sortOpts.length;
      sortBtn.innerHTML = `<i class="fas fa-sort-amount-down"></i> ${sortOpts[sortIdx]} <i class="fas fa-chevron-down" style="font-size:10px;"></i>`;

      // Actually sort the products
      const all = JSON.parse(localStorage.getItem('unipass_products') || '[]');
      if (sortIdx === 1) {
        all.sort((a, b) => a.price - b.price);
      } else if (sortIdx === 2) {
        all.sort((a, b) => b.price - a.price);
      } else {
        all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      renderProductGrid(productGrid, all, emptyProducts);
      applyFilters();
    });
  }

  // ===== 14. HERO EXPLORE =====
  const heroExplore = $('btn-hero-explore');
  if (heroExplore) {
    heroExplore.addEventListener('click', () => {
      document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ===== 15. RESTORE SESSION =====
  const saved = JSON.parse(localStorage.getItem('unipass_current'));
  if (saved) loginAs(saved);
  else loadProducts();

  // ===== 16. PRE-FETCH universities =====
  fetchUniversities();

});
