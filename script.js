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
// 2. SYSTEM AUTHENTICATION & GLOBAL DATA LOADER
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    
    // Listener Otomatis: Jalan setiap kali status login berubah atau halaman direfresh
    auth.onAuthStateChanged(async (user) => {
        const navContainer = document.getElementById('navRightAction');
        const currentPath = window.location.pathname;
        
        if (user) {
            // --- USER SEDANG LOGIN ---
            console.log("User Logged In:", user.email);
            
            // A. Update Navbar
            if (navContainer) {
                const activeClass = currentPath.includes('profile.html') ? 'active' : '';
                const photoURL = user.photoURL || "Assets/Icon GreenUp.png";
                navContainer.innerHTML = `
                    <li class="nav-item">
                        <a class="nav-link profile-icon ${activeClass}" href="profile.html">
                            <img src="${photoURL}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 50%; border: 2px solid #5a8f4c;">
                        </a>
                    </li>`;
            }

            // B. AMBIL DATA USER DARI FIRESTORE (PENTING!)
            // Kita ambil data di sini biar bisa dipake di Halaman Profile DAN Halaman Reward
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const userData = doc.data();

                    // 1. Kalo lagi di Halaman PROFILE: Isi Data
                    if (document.querySelector('.profile-card')) {
                        fillProfilePage(user, userData);
                    }

                    // 2. Kalo lagi di Halaman REWARD: Isi Poin (FIX MASALAH POIN 0)
                    if (document.getElementById('rewardPagePoints')) {
                        document.getElementById('rewardPagePoints').innerText = userData.points.toLocaleString();
                    }
                }
            } catch (error) {
                console.error("Gagal ambil data user:", error);
            }

        } else {
            // --- USER BELUM LOGIN ---
            if (navContainer) {
                navContainer.innerHTML = `
                    <li class="nav-item d-flex gap-2 align-items-center ms-lg-3">
                        <a href="login.html" class="btn btn-outline-success btn-sm rounded-pill px-4 fw-bold">Sign In</a>
                        <a href="signup.html" class="btn btn-custom btn-sm rounded-pill px-4 fw-bold">Sign Up</a>
                    </li>`;
            }

            // Proteksi Halaman
            if (currentPath.includes('donation.html') || currentPath.includes('tracking.html') || currentPath.includes('profile.html') || currentPath.includes('reward.html') || currentPath.includes('history.html')) {
                window.location.href = 'login.html';
            }
        }
    });
});


// =========================================================================
// 3. LOGIKA LOGIN & SIGNUP
// =========================================================================

// --- A. LOGIN GOOGLE ---
const googleBtn = document.getElementById('googleLoginBtn');
if (googleBtn) {
    googleBtn.addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(async (result) => {
                const user = result.user;
                const userRef = db.collection('users').doc(user.uid);
                const doc = await userRef.get();
                
                if (!doc.exists) {
                    await userRef.set({
                        name: user.displayName, email: user.email, phone: "-", 
                        points: 0, totalWeight: 0, photo: user.photoURL
                    });
                }
                Swal.fire({ icon: 'success', title: 'Login Berhasil!', showConfirmButton: false, timer: 1500 }).then(() => window.location.href = 'index.html');
            })
            .catch((error) => Swal.fire('Error', error.message, 'error'));
    });
}

// --- B. SIGN UP EMAIL ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(async (userCredential) => {
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name, email: email, phone: "-", points: 0, totalWeight: 0, photo: ""
                });
                Swal.fire('Berhasil', 'Akun dibuat!', 'success').then(() => window.location.href = 'index.html');
            })
            .catch((error) => Swal.fire('Gagal', error.message, 'error'));
    });
}

// --- C. LOGIN EMAIL ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                Swal.fire({ icon: 'success', title: 'Login Berhasil', showConfirmButton: false, timer: 1500 }).then(() => window.location.href = 'index.html');
            })
            .catch(() => Swal.fire('Gagal', 'Email/Password Salah', 'error'));
    });
}


// =========================================================================
// 4. FUNGSI HELPER PROFILE (Dipanggil di Section 2)
// =========================================================================
function fillProfilePage(user, data) {
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
    const imgUrl = data.photo || user.photoURL;
    if (imgUrl && document.getElementById('profilePic')) {
        document.getElementById('profilePic').innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
    }

    // Progress Bar
    const hasDetail = (data.phone !== "-" && data.phone !== "");
    const hasPhoto = (imgUrl !== "" && imgUrl !== undefined);
    calculateProgressSafe(hasPhoto, hasDetail);
}

// Tombol Save & Edit di Profile
const saveBtn = document.getElementById('saveProfileBtn');
const editBtn = document.getElementById('editProfileBtn');

if(saveBtn) {
    saveBtn.addEventListener('click', function() {
        const user = auth.currentUser;
        if(user) {
            const newName = document.getElementById('inputName').value;
            const newPhone = document.getElementById('inputPhone').value;
            
            db.collection('users').doc(user.uid).update({
                name: newName, phone: newPhone
            }).then(() => {
                // Update UI Langsung biar gak perlu reload
                document.getElementById('headerProfileName').innerText = newName;
                document.querySelector('h3.fw-bold').innerText = newName;
                
                // Balikin tombol
                const inputs = [document.getElementById('inputName'), document.getElementById('inputPhone')];
                inputs.forEach(inp => {
                    inp.setAttribute('readonly', true);
                    inp.classList.add('form-control-plaintext');
                    inp.classList.remove('form-control', 'custom-input');
                });
                saveBtn.classList.add('d-none');
                editBtn.classList.remove('d-none');
                
                Swal.fire('Sukses', 'Profil berhasil disimpan!', 'success');
            });
        }
    });
}

if(editBtn) {
    editBtn.addEventListener('click', function() {
        const inpName = document.getElementById('inputName');
        const inpPhone = document.getElementById('inputPhone');
        [inpName, inpPhone].forEach(inp => {
            inp.removeAttribute('readonly');
            inp.classList.remove('form-control-plaintext');
            inp.classList.add('form-control', 'custom-input');
        });
        editBtn.classList.add('d-none'); saveBtn.classList.remove('d-none');
    });
}

// Upload Foto Profile
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if(file.size > 100000) { Swal.fire('Kegedean', 'Max 100KB (Firestore Limit)', 'warning'); return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                const imgResult = ev.target.result;
                const user = auth.currentUser;
                if(user) {
                    db.collection('users').doc(user.uid).update({ photo: imgResult })
                    .then(() => {
                        document.getElementById('profilePic').innerHTML = `<img src="${imgResult}" style="width:100%; height:100%; object-fit:cover;">`;
                        location.reload();
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Logout
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

// Helper Progress Bar
function calculateProgressSafe(hasPhoto, hasDetails) {
    let score = 1; 
    const itemDetails = document.getElementById('itemDetails');
    const itemPhoto = document.getElementById('itemPhoto');

    if (hasDetails) { score++; changeChecklistStyle(itemDetails, true); } 
    else { changeChecklistStyle(itemDetails, false, "Profile details"); }

    if (hasPhoto) { score++; changeChecklistStyle(itemPhoto, true); } 
    else { changeChecklistStyle(itemPhoto, false, "Upload your photo"); }

    const percent = Math.round((score / 3) * 100);
    if(document.getElementById('progressText')) document.getElementById('progressText').innerText = percent + "%";
    if(document.getElementById('progressChart')) document.getElementById('progressChart').style.background = `conic-gradient(var(--green-primary) 0% ${percent}%, #e0e0e0 ${percent}% 100%)`;
}

function changeChecklistStyle(el, isDone, defaultText) {
    if (!el) return;
    if(isDone) {
        el.className = "d-flex align-items-center mb-2 text-green-primary fw-bold small";
        let txt = el.innerText.replace("Upload your photo", "Photo uploaded").replace("Profile details", "Profile details set");
        if(!txt.includes("set") && !txt.includes("uploaded")) txt += " set";
        el.innerHTML = `<i class="bi bi-check-lg me-2"></i> ${txt}`;
    } else {
        el.className = "d-flex align-items-center mb-2 text-muted small";
        el.innerHTML = `<i class="bi bi-x-circle me-2"></i> ${defaultText}`;
    }
}


// =========================================================================
// 5. DONATION & TRACKING 
// =========================================================================
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
    const activeDonation = JSON.parse(localStorage.getItem('activeDonation'));
    if (activeDonation) {
        if(document.getElementById('trackType')) document.getElementById('trackType').innerText = activeDonation.type;
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
            if(btn) btn.innerText = "▶ Simulasi Next Status (Klik Aku)";
        } else if (step === 2) {
            document.getElementById('statusTitle').innerText = "Trash Picked Up";
            document.getElementById('progressBar').style.width = "50%";
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            document.querySelector('#step2 small').innerText = "Baru Saja";
            if(btn) btn.innerText = "▶ Simulasi Next Status (Klik Aku)";
        } else if (step === 3) {
            document.getElementById('statusTitle').innerText = "Delivered!";
            document.getElementById('progressBar').style.width = "100%";
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            document.querySelector('#step3 small').innerText = "Baru Saja";
            if(btn) btn.innerText = "✅ Finish";
        }
    }

    window.nextStatus = function() {
        if (currentStep === 3) {
            // === FINISH: KIRIM KE FIRESTORE & LANGSUNG REDIRECT ===
            const btn = document.querySelector('button[onclick="nextStatus()"]');
            btn.innerText = "⏳ Menyimpan..."; btn.disabled = true;

            const user = auth.currentUser;
            const finalData = JSON.parse(localStorage.getItem('activeDonation'));
            finalData.status = "Done";
            finalData.userId = user.uid;
            finalData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

            // 1. Simpan Donasi
            db.collection('donations').add(finalData)
            .then(() => {
                // 2. Update Poin User
                const userRef = db.collection('users').doc(user.uid);
                return userRef.update({
                    points: firebase.firestore.FieldValue.increment(finalData.amount * 2),
                    totalWeight: firebase.firestore.FieldValue.increment(finalData.amount)
                });
            })
            .then(() => {
                // 3. Bersihkan & Redirect TANPA ALERT
                localStorage.removeItem('trackingStep');
                localStorage.removeItem('activeDonation');
                
                // LANGSUNG PINDAH KE HISTORY
                window.location.href = 'history.html';
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
// 6. HISTORY PAGE (Realtime Firestore)
// =========================================================================
const historyTableBody = document.getElementById('historyTableBody');
if (historyTableBody) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Ambil Data
            db.collection('donations')
              .where("userId", "==", user.uid)
              .get()
              .then((querySnapshot) => {
                  historyTableBody.innerHTML = "";
                  
                  // Cek On Progress Lokal
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

                  // Sortir manual (karena firestore butuh index buat orderby)
                  let docs = [];
                  querySnapshot.forEach(doc => docs.push(doc.data()));
                  
                  // Tampilkan
                  docs.forEach(data => {
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

// =========================================================================
// 7. REWARD PAGE (Claim with Firebase)
// =========================================================================
const rewardPointsDisplay = document.getElementById('rewardPagePoints');
if (rewardPointsDisplay && document.querySelector('.profile-card') === null) { // Pastikan bukan di profile page
    
    auth.onAuthStateChanged((user) => {
        if(user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if(doc.exists) {
                    const data = doc.data();
                    rewardPointsDisplay.innerText = data.points.toLocaleString();

                    // Fungsi Claim
                    window.claimReward = function(itemName, price) {
                        if (data.points >= price) {
                            const newPoints = data.points - price;
                            
                            db.collection('users').doc(user.uid).update({ points: newPoints })
                            .then(() => {
                                rewardPointsDisplay.innerText = newPoints.toLocaleString();
                                data.points = newPoints; // update lokal
                                
                                if(document.getElementById('successItemName')) {
                                    document.getElementById('successItemName').innerText = itemName;
                                    var successModal = new bootstrap.Modal(document.getElementById('successModal'));
                                    successModal.show();
                                } else {
                                    Swal.fire('Berhasil', 'Klaim sukses!', 'success');
                                }
                            });
                        } else {
                            if(document.getElementById('errorModal')) {
                                var errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
                                errorModal.show();
                            } else {
                                Swal.fire('Gagal', 'Poin tidak cukup!', 'error');
                            }
                        }
                    }
                }
            });
        }
    });
    
    window.openDetailModal = function(itemName, price, imgUrl) {
        let tempItem = {name: itemName, price: price};
        document.getElementById('detailItemName').innerText = itemName;
        document.getElementById('detailItemPrice').innerText = price;
        document.getElementById('detailItemImg').src = imgUrl;
        var detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
        detailModal.show();
        
        window.confirmClaim = function() {
            detailModal.hide();
            setTimeout(() => { window.claimReward(tempItem.name, tempItem.price); }, 300);
        }
    }
}

// --- Map Logic (Paste kode Map Leaflet di sini) ---
if (document.getElementById('map')) {
    // ... (KODE PETA LENGKAP DARI SEBELUMNYA TETAP SAMA) ...
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

    var map = L.map('map', { zoomControl: false }).setView([-6.1783, 106.6319], 12); 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '© OpenStreetMap & Carto' }).addTo(map);
    var greenIcon = L.icon({ iconUrl: 'Assets/Icon GreenUp.png', iconSize: [60, 60], iconAnchor: [30, 60], popupAnchor: [0, -50] });

    // Fungsi Render Marker (Biar bisa direfresh pas search)
    var markersLayer = L.layerGroup().addTo(map);

    function renderMarkers(dataList) {
        markersLayer.clearLayers();
        dataList.forEach(function(bank) {
            // Custom Icon
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

    // Search
    const searchInput = document.getElementById('searchBankInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const keyword = e.target.value.toLowerCase();
            const filteredBanks = wasteBanks.filter(bank => bank.name.toLowerCase().includes(keyword));
            renderMarkers(filteredBanks);
        });
    }

    // Find Me
    if(document.getElementById('findMeBtn')){
        document.getElementById('findMeBtn').addEventListener('click', function() {
            var btn = this; btn.innerText = "⏳ Mencari...";
            if (!navigator.geolocation) { btn.innerHTML = "❌ Error"; return; }
            navigator.geolocation.getCurrentPosition(function(pos) {
                if (window.userMarker) map.removeLayer(window.userMarker);
                window.userMarker = L.circleMarker([pos.coords.latitude, pos.coords.longitude], { radius: 10, fillColor: "#3388ff", color: "#fff", weight: 3, opacity: 1, fillOpacity: 0.8 }).addTo(map).bindPopup("Posisi Kamu");
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 14);
                btn.innerHTML = "📍 Lokasi Saya"; 
            });
        });
    }
}