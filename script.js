// =========================================================================
// 1. KONFIGURASI FIREBASE
// =========================================================================
// ⚠️ PASTE CONFIG DARI FIREBASE CONSOLE DI SINI ⚠️
  const firebaseConfig = {
    apiKey: "AIzaSyCaKysh19aYKF0bWNsiKAQfqOdD8rM5uBk",
    authDomain: "greenup-cf79a.firebaseapp.com",
    projectId: "greenup-cf79a",
    storageBucket: "greenup-cf79a.firebasestorage.app",
    messagingSenderId: "129433737198",
    appId: "1:129433737198:web:06fa3cf791c6f7714820ff"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// =========================================================================
// 2. SYSTEM AUTHENTICATION (Cek Status Login Realtime)
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    
    // Listener Ajaib: Otomatis tau kalo user login/logout
    auth.onAuthStateChanged(async (user) => {
        const navContainer = document.getElementById('navRightAction');
        const currentPath = window.location.pathname;
        
        if (user) {
            // --- USER SEDANG LOGIN ---
            console.log("User Login:", user.email);
            
            // Update Navbar
            if (navContainer) {
                const activeClass = currentPath.includes('profile.html') ? 'active' : '';
                // Tampilkan foto profil Google (atau default)
                const photoURL = user.photoURL || "Assets/Icon GreenUp.png";
                
                navContainer.innerHTML = `
                    <li class="nav-item">
                        <a class="nav-link profile-icon ${activeClass}" href="profile.html">
                            <img src="${photoURL}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 50%; border: 2px solid #5a8f4c;">
                        </a>
                    </li>`;
            }

            // Khusus Halaman Profile: Load Data
            if (document.querySelector('.profile-card')) {
                loadProfileData(user);
            }

        } else {
            // --- USER BELUM LOGIN ---
            console.log("User Guest");
            
            if (navContainer) {
                navContainer.innerHTML = `
                    <li class="nav-item d-flex gap-2 align-items-center ms-lg-3">
                        <a href="login.html" class="btn btn-outline-success btn-sm rounded-pill px-4 fw-bold">Sign In</a>
                        <a href="signup.html" class="btn btn-custom btn-sm rounded-pill px-4 fw-bold">Sign Up</a>
                    </li>`;
            }

            // Proteksi Halaman (Tendang ke login)
            if (currentPath.includes('donation.html') || currentPath.includes('tracking.html') || currentPath.includes('profile.html') || currentPath.includes('reward.html') || currentPath.includes('history.html')) {
                Swal.fire({ icon: 'warning', title: 'Akses Ditolak', text: 'Silakan Login dulu!', confirmButtonColor: '#5a8f4c' })
                .then(() => window.location.href = 'login.html');
            }
        }
    });
});


// =========================================================================
// 3. LOGIKA LOGIN & SIGNUP (GOOGLE & EMAIL)
// =========================================================================

// --- A. LOGIN DENGAN GOOGLE (FITUR UTAMA) ---
const googleBtn = document.getElementById('googleLoginBtn');
if (googleBtn) {
    googleBtn.addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then(async (result) => {
                const user = result.user;
                
                // Cek apakah user ini baru pertama kali login?
                // Kita cek di Database Firestore
                const userRef = db.collection('users').doc(user.uid);
                const doc = await userRef.get();

                if (!doc.exists) {
                    // Kalau belum ada, buat data baru (Start 0 Poin)
                    await userRef.set({
                        name: user.displayName,
                        email: user.email,
                        phone: "-",
                        points: 0,
                        totalWeight: 0,
                        photo: user.photoURL
                    });
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil!',
                    text: `Halo, ${user.displayName}`,
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => window.location.href = 'index.html');
            })
            .catch((error) => {
                console.error(error);
                Swal.fire('Error', error.message, 'error');
            });
    });
}

// --- B. SIGN UP EMAIL MANUAL ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                
                // Simpan data tambahan ke Firestore
                await db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    phone: "-",
                    points: 0,
                    totalWeight: 0,
                    photo: ""
                });

                Swal.fire('Berhasil', 'Akun dibuat! Otomatis login.', 'success')
                .then(() => window.location.href = 'index.html');
            })
            .catch((error) => {
                Swal.fire('Gagal', error.message, 'error');
            });
    });
}

// --- C. LOGIN EMAIL MANUAL ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                Swal.fire({
                    icon: 'success', title: 'Login Berhasil', showConfirmButton: false, timer: 1500
                }).then(() => window.location.href = 'index.html');
            })
            .catch((error) => {
                Swal.fire('Gagal', 'Email atau Password Salah', 'error');
            });
    });
}


// =========================================================================
// 4. PROFILE PAGE (LOAD & UPDATE)
// =========================================================================
async function loadProfileData(user) {
    // Ambil data detail dari Firestore
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
        const data = doc.data();
        
        // Isi Teks
        if(document.querySelector('h3.fw-bold')) document.querySelector('h3.fw-bold').innerText = data.name;
        if(document.getElementById('headerProfileName')) document.getElementById('headerProfileName').innerText = data.name;
        if(document.getElementById('inputName')) document.getElementById('inputName').value = data.name;
        if(document.getElementById('inputEmail')) document.getElementById('inputEmail').value = data.email;
        if(document.getElementById('inputPhone')) document.getElementById('inputPhone').value = data.phone;

        // Isi Poin & Berat
        if(document.getElementById('totalPointsDisplay')) document.getElementById('totalPointsDisplay').innerText = data.points.toLocaleString();
        if(document.getElementById('totalTrashDisplay')) document.getElementById('totalTrashDisplay').innerText = data.totalWeight.toLocaleString();

        // Foto Profil
        const imgUrl = data.photo || user.photoURL; // Prioritas foto DB, kalau ga ada pake foto Google
        if (imgUrl && document.getElementById('profilePic')) {
            document.getElementById('profilePic').innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        }

        // Progress Bar
        const hasDetail = (data.phone !== "-" && data.phone !== "");
        const hasPhoto = (imgUrl !== "" && imgUrl !== undefined);
        calculateProgressSafe(hasPhoto, hasDetail);
    }
}

// Tombol Save Profile
const saveBtn = document.getElementById('saveProfileBtn');
const editBtn = document.getElementById('editProfileBtn');
if(saveBtn) {
    saveBtn.addEventListener('click', function() {
        const user = auth.currentUser;
        if(user) {
            const newName = document.getElementById('inputName').value;
            const newPhone = document.getElementById('inputPhone').value;
            
            db.collection('users').doc(user.uid).update({
                name: newName,
                phone: newPhone
            }).then(() => {
                Swal.fire('Sukses', 'Profil berhasil disimpan!', 'success').then(() => location.reload());
            });
        }
    });
}

// Tombol Edit UI
if(editBtn) {
    editBtn.addEventListener('click', function() {
        const inpName = document.getElementById('inputName');
        const inpPhone = document.getElementById('inputPhone');
        inpName.removeAttribute('readonly'); inpName.classList.remove('form-control-plaintext'); inpName.classList.add('form-control', 'custom-input');
        inpPhone.removeAttribute('readonly'); inpPhone.classList.remove('form-control-plaintext'); inpPhone.classList.add('form-control', 'custom-input');
        editBtn.classList.add('d-none'); saveBtn.classList.remove('d-none');
    });
}

// Tombol Logout
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        Swal.fire({
            title: 'Yakin Logout?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#5a8f4c', cancelButtonColor: '#d33', confirmButtonText: 'Ya'
        }).then((res) => {
            if (res.isConfirmed) {
                auth.signOut().then(() => window.location.href = 'login.html');
            }
        });
    });
}

// =========================================================================
// 7. HELPER FUNCTIONS (PROFILE LOGIC)
// =========================================================================

function calculateProgressSafe(hasPhoto, hasDetails) {
    let score = 1; // Poin 1: Akun (Selalu Ada)
    const itemDetails = document.getElementById('itemDetails');
    const itemPhoto = document.getElementById('itemPhoto');

    // Poin 2: Detail Profil
    if (hasDetails) { 
        score++; 
        changeChecklistStyle(itemDetails, true); 
    } else { 
        changeChecklistStyle(itemDetails, false, "Profile details"); 
    }

    // Poin 3: Foto Profil
    if (hasPhoto) { 
        score++; 
        changeChecklistStyle(itemPhoto, true); 
    } else { 
        changeChecklistStyle(itemPhoto, false, "Upload your photo"); 
    }

    // Update UI Donut Chart
    const percent = Math.round((score / 3) * 100);
    if(document.getElementById('progressText')) 
        document.getElementById('progressText').innerText = percent + "%";
    
    if(document.getElementById('progressChart')) 
        document.getElementById('progressChart').style.background = `conic-gradient(var(--green-primary) 0% ${percent}%, #e0e0e0 ${percent}% 100%)`;
}

function changeChecklistStyle(el, isDone, defaultText) {
    if (!el) return;
    
    if(isDone) {
        el.className = "d-flex align-items-center mb-2 text-green-primary fw-bold small";
        
        // Logic biar teks gak numpuk "set set set" kalau dirender ulang
        let txt = el.innerText
            .replace("Upload your photo", "Photo uploaded")
            .replace("Profile details", "Profile details set");
            
        if(!txt.includes("set") && !txt.includes("uploaded") && !txt.includes("Setup")) {
             txt += " set";
        }
        
        el.innerHTML = `<i class="bi bi-check-lg me-2"></i> ${txt}`;
    } else {
        el.className = "d-flex align-items-center mb-2 text-muted small";
        el.innerHTML = `<i class="bi bi-x-circle me-2"></i> ${defaultText}`;
    }
}






// =========================================================================
// 5. DONATION & TRACKING 
// =========================================================================

if (document.getElementById('map')) {
    
    // 1. Data Bank Sampah (15 Lokasi Tangerang)
    const wasteBanks = [
        { id: 1, name: "Bank Sampah RW 05 Cipondoh", contact: "Pak Budi - 081288990011", address: "Jl. KH Hasyim Ashari No. 12, Cipondoh", coords: [-6.178306, 106.631889] },
        { id: 2, name: "Bank Sampah Berkah Cikokol", contact: "Ibu Siti - 085677776655", address: "Jl. Jend. Sudirman No. 45, Tangerang", coords: [-6.2125, 106.6183] },
        { id: 3, name: "Bank Sampah Induk Kota Tangerang", contact: "Admin - 0215576xxxx", address: "Jl. Iskandar Muda, Mekarsari", coords: [-6.1624, 106.6371] },
        { id: 4, name: "Green Point Karawaci", contact: "Mas Rio - 081344559988", address: "Jl. Imam Bonjol, Karawaci", coords: [-6.2297, 106.6111] },
        { id: 5, name: "Bank Sampah Cibodas Baru", contact: "Bu Wati - 081566778899", address: "Perumnas 2, Jl. Borobudur Raya", coords: [-6.2058, 106.6042] },
        { id: 6, name: "Bank Sampah Palem Semi", contact: "Pak RT 04 - 087899001122", address: "Komplek Palem Semi, Panunggangan Barat", coords: [-6.2234, 106.6157] },
        { id: 7, name: "Bank Sampah Poris Plawad", contact: "Pak Dedi - 081233445566", address: "Jl. Benteng Betawi, Poris", coords: [-6.1736, 106.6572] },
        { id: 8, name: "Bank Sampah Batuceper Permai", contact: "Bu Lilis - 089677889900", address: "Jl. Daan Mogot Km 21, Batuceper", coords: [-6.1542, 106.6683] },
        { id: 9, name: "Bank Sampah Ciledug Indah", contact: "Bang Jago - 085711223344", address: "Jl. KH Hasyim Ashari, Ciledug", coords: [-6.2339, 106.7064] },
        { id: 10, name: "Bank Sampah Pinang Griya", contact: "Ibu Ani - 081344556677", address: "Jl. Pinang Griya Permai", coords: [-6.2261, 106.6895] },
        { id: 11, name: "Bank Sampah Karang Tengah", contact: "Pak RW 03 - 081900112233", address: "Jl. Raden Saleh, Karang Tengah", coords: [-6.2156, 106.7158] },
        { id: 12, name: "Bank Sampah Larangan Selatan", contact: "Mas Eko - 087788990011", address: "Jl. Prof. Dr. Hamka, Larangan", coords: [-6.2421, 106.7312] },
        { id: 13, name: "Bank Sampah Periuk Jaya", contact: "Bu Rina - 081299887766", address: "Jl. Moh. Toha, Periuk", coords: [-6.1683, 106.5987] },
        { id: 14, name: "Bank Sampah Jatiuwung Mandiri", contact: "Pak Asep - 085611223344", address: "Jl. Gatot Subroto Km 5, Jatiuwung", coords: [-6.1894, 106.5742] },
        { id: 15, name: "Bank Sampah Neglasari Bersih", contact: "Bu Susi - 081322334455", address: "Jl. Marsekal Suryadarma, Neglasari", coords: [-6.1415, 106.6347] }
    ];

    // 2. Setup Map
    var map = L.map('map', { zoomControl: false }).setView([-6.1783, 106.6319], 11);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
        maxZoom: 19, 
        attribution: '© OpenStreetMap & Carto' 
    }).addTo(map);

    // Layer buat nampung marker
    var markersLayer = L.layerGroup().addTo(map);
    var greenIcon = L.icon({ iconUrl: 'Assets/Icon GreenUp.png', iconSize: [60, 60], iconAnchor: [30, 60], popupAnchor: [0, -50] });

    // 3. Fungsi Render Marker (Gambar + Label Nama)
    function renderMarkers(dataList) {
        markersLayer.clearLayers();
        
        dataList.forEach(function(bank) {
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div class="marker-label-container" style="display: flex; flex-direction: column; align-items: center; width: 100px; transform: translateX(-25px);">
                        <img src="Assets/Icon GreenUp.png" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">
                        <span style="background: rgba(255,255,255,0.9); padding: 2px 5px; border-radius: 5px; font-size: 10px; font-weight: bold; color: #31572c; margin-top: -5px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${bank.name}</span>
                    </div>
                `,
                iconSize: [50, 50],
                iconAnchor: [25, 40],
                popupAnchor: [0, -40]
            });

            var marker = L.marker(bank.coords, {icon: customIcon});
            
            marker.bindPopup(`<b>${bank.name}</b><br>${bank.address}`);
            marker.on('click', function() {
                document.getElementById('bankName').innerText = bank.name;
                document.getElementById('bankContact').innerText = bank.contact;
                document.getElementById('bankAddress').innerText = bank.address;
                map.flyTo(bank.coords, 15);
            });

            markersLayer.addLayer(marker);
        });
    }
    
    renderMarkers(wasteBanks);

    // 4. Fitur Search (Filter Marker)
    const searchInput = document.getElementById('searchBankInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const keyword = e.target.value.toLowerCase();
            const filteredBanks = wasteBanks.filter(bank => bank.name.toLowerCase().includes(keyword));
            renderMarkers(filteredBanks);
        });
    }

    // 5. Fitur Lokasi Saya + Cari Terdekat
    function getDistance(lat1, lon1, lat2, lon2) {
        var R = 6371; 
        var dLat = (lat2 - lat1) * (Math.PI / 180);
        var dLon = (lon2 - lon1) * (Math.PI / 180);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }

    if(document.getElementById('findMeBtn')){
        document.getElementById('findMeBtn').addEventListener('click', function() {
            var btn = this; 
            const originalText = btn.innerText;
            btn.innerText = "⏳ Mencari...";
            
            if (!navigator.geolocation) { btn.innerHTML = "❌ Error"; return; }

            navigator.geolocation.getCurrentPosition(function(pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;

                if (window.userMarker) map.removeLayer(window.userMarker);
                
                window.userMarker = L.circleMarker([lat, lng], { 
                    radius: 8, fillColor: "#3388ff", color: "#fff", weight: 3, opacity: 1, fillOpacity: 0.8 
                }).addTo(map).bindPopup("<b>Posisi Kamu</b>").openPopup();

                var closestBank = null;
                var minDistance = Infinity;

                wasteBanks.forEach(function(bank) {
                    var dist = getDistance(lat, lng, bank.coords[0], bank.coords[1]);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestBank = bank;
                    }
                });

                if (closestBank) {
                    document.getElementById('bankName').innerText = closestBank.name;
                    document.getElementById('bankContact').innerText = closestBank.contact;
                    document.getElementById('bankAddress').innerText = closestBank.address;
                    
                    var group = new L.featureGroup([
                        window.userMarker,
                        L.marker(closestBank.coords) 
                    ]);
                    map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });

                    Swal.fire({
                        title: 'Ketemu!',
                        text: `Terdekat: ${closestBank.name} (${minDistance.toFixed(2)} km)`,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                }
                
                btn.innerHTML = originalText; 
            }, function() { btn.innerHTML = "❌ Gagal"; });
        });
    }
}


const donationForm = document.getElementById('donationForm');
if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        const address = document.getElementById('pickupAddress').value;
        const amount = document.getElementById('totalAmount').value;
        const bankNameText = document.getElementById('bankName').innerText;

        if (bankNameText === "Pilih Lokasi di Peta" || bankNameText.trim() === "-") {
            Swal.fire('Lokasi Belum Dipilih', 'Klik peta dulu!', 'warning'); return;
        }

        if (address && amount) {
            const donationData = {
                type: document.getElementById('trashTypeInput').value,
                amount: parseInt(amount),
                address: address,
                notes: document.getElementById('notes').value,
                bankName: bankNameText,
                bankAddress: document.getElementById('bankAddress').innerText,
                date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                status: "On Progress"
            };
            localStorage.setItem('activeDonation', JSON.stringify(donationData));
            localStorage.setItem('trackingStep', 1);
            window.location.href = 'tracking.html'; 
        } else {
            Swal.fire('Lengkapi Form', 'Data belum lengkap.', 'warning');
        }
    });
}

// --- TRACKING PAGE ---
if (document.getElementById('statusTitle')) {
    // Load Data Sementara
    const activeDonation = JSON.parse(localStorage.getItem('activeDonation'));
    if (activeDonation) {
        if(document.getElementById('trackType')) document.getElementById('trackType').innerText = activeDonation.type;
        // ... (Load text lainnya sama seperti sebelumnya) ...
        if(document.getElementById('trackAmount')) document.getElementById('trackAmount').innerText = activeDonation.amount;
        if(document.getElementById('trackAddress')) document.getElementById('trackAddress').innerText = activeDonation.address;
        if(document.getElementById('trackNotes')) document.getElementById('trackNotes').innerText = activeDonation.notes;
        if(document.getElementById('trackBankName')) document.getElementById('trackBankName').innerText = activeDonation.bankName;
        if(document.getElementById('trackBankAddress')) document.getElementById('trackBankAddress').innerText = activeDonation.bankAddress;
    }

    let currentStep = parseInt(localStorage.getItem('trackingStep')) || 1;

    function updateUI(step) {
        localStorage.setItem('trackingStep', step);
        document.getElementById('step2').classList.remove('active', 'completed');
        document.getElementById('step3').classList.remove('active', 'completed');
        
        const btn = document.querySelector('button[onclick="nextStatus()"]');
        
        if (step === 1) {
            document.getElementById('statusTitle').innerText = "Donation Confirmed";
            document.getElementById('progressBar').style.width = "0%";
            document.getElementById('step1').classList.add('active'); 
            if(btn) btn.innerText = "▶ Simulasi Next Status";
        } else if (step === 2) {
            document.getElementById('statusTitle').innerText = "Trash Picked Up";
            document.getElementById('progressBar').style.width = "50%";
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            document.querySelector('#step2 small').innerText = "Baru Saja";
            if(btn) btn.innerText = "▶ Simulasi Next Status";
        } else if (step === 3) {
            document.getElementById('statusTitle').innerText = "Delivered!";
            document.getElementById('progressBar').style.width = "100%";
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            document.querySelector('#step3 small').innerText = "Baru Saja";
            if(btn) btn.innerText = "✅ Finish - Save to Cloud";
        }
    }

    window.nextStatus = function() {
        if (currentStep === 3) {
            // === FINISH: KIRIM KE FIRESTORE ===
            const user = auth.currentUser;
            if(!user) { Swal.fire('Error', 'Sesi habis', 'error'); return; }

            const btn = document.querySelector('button[onclick="nextStatus()"]');
            btn.innerText = "⏳ Menyimpan..."; btn.disabled = true;

            const finalData = JSON.parse(localStorage.getItem('activeDonation'));
            finalData.status = "Done";
            finalData.userId = user.uid; // Link ke user firebase
            finalData.createdAt = firebase.firestore.FieldValue.serverTimestamp(); // Timestamp asli server

            // 1. Simpan ke Collection 'donations'
            db.collection('donations').add(finalData)
            .then(() => {
                // 2. Update Poin User (Atomic Increment)
                const userRef = db.collection('users').doc(user.uid);
                
                // Menggunakan FieldValue.increment biar aman (gak perlu baca data lama dulu)
                return userRef.update({
                    points: firebase.firestore.FieldValue.increment(finalData.amount * 2),
                    totalWeight: firebase.firestore.FieldValue.increment(finalData.amount)
                });
            })
            .then(() => {
                localStorage.removeItem('trackingStep');
                localStorage.removeItem('activeDonation');
                Swal.fire('Selesai', 'Donasi tersimpan di Google Cloud!', 'success')
                .then(() => window.location.href = 'history.html');
            })
            .catch(err => {
                console.error(err);
                Swal.fire('Error', 'Gagal simpan: ' + err.message, 'error');
                btn.disabled = false;
            });
            return;
        }
        currentStep++;
        updateUI(currentStep);
    }
    updateUI(currentStep);
}


// =========================================================================
// 6. HISTORY PAGE (Realtime Listener dari Firestore)
// =========================================================================
const historyTableBody = document.getElementById('historyTableBody');
if (historyTableBody) {
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Ambil data donasi user ini
            // .orderBy('createdAt', 'desc') biar yang baru di atas
            db.collection('donations')
              .where("userId", "==", user.uid)
              // .orderBy("createdAt", "desc") // Perlu bikin index di firestore console (opsional)
              .get()
              .then((querySnapshot) => {
                  historyTableBody.innerHTML = "";
                  
                  // Cek donasi aktif lokal (On Progress)
                  const activeDonation = JSON.parse(localStorage.getItem('activeDonation'));
                  if(activeDonation) {
                      const rowProgress = `
                          <tr>
                              <td>${activeDonation.date}</td>
                              <td>${activeDonation.bankName}</td>
                              <td>${activeDonation.type}</td>
                              <td class="text-center">${activeDonation.amount} Kg</td>
                              <td class="text-end"><a href="tracking.html" class="text-decoration-none"><span class="badge badge-status status-progress">On Progress</span></a></td>
                          </tr>`;
                      historyTableBody.insertAdjacentHTML('beforeend', rowProgress);
                  }

                  if (querySnapshot.empty && !activeDonation) {
                      historyTableBody.innerHTML = "<tr><td colspan='5' class='text-center'>Belum ada riwayat.</td></tr>";
                  }

                  querySnapshot.forEach((doc) => {
                      const data = doc.data();
                      const row = `
                          <tr>
                              <td>${data.date}</td>
                              <td>${data.bankName}</td>
                              <td>${data.type}</td>
                              <td class="text-center">${data.amount} Kg</td>
                              <td class="text-end"><span class="badge badge-status status-done">Done</span></td>
                          </tr>`;
                      historyTableBody.insertAdjacentHTML('beforeend', row);
                  });
              });
        }
    });
}

