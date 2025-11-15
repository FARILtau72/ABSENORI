document.addEventListener('DOMContentLoaded', () => {
    
    // Variabel global untuk menyimpan data foto
    let fotoBase64 = null;

    // --- LOGIKA HALAMAN ABSENSI (index.html) ---
    if (document.getElementById('absenForm')) {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const snapButton = document.getElementById('snapButton');
        const submitButton = document.getElementById('submitButton');
        const fotoPreview = document.getElementById('fotoPreview');
        const absenForm = document.getElementById('absenForm');
        const namaInput = document.getElementById('nama');
        const kelasInput = document.getElementById('kelas');

        // 1. Memulai Kamera
        async function startCamera() {
            try {
                // Minta izin akses kamera depan (user-facing)
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user' },
                    audio: false 
                });
                video.srcObject = stream;
            } catch (err) {
                console.error("Error mengakses kamera: ", err);
                alert("Tidak bisa mengakses kamera. Pastikan izin telah diberikan.");
            }
        }

        // 2. Mengambil Foto
        snapButton.addEventListener('click', () => {
            // Atur ukuran canvas sesuai video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Gambar frame video saat ini ke canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Ubah gambar canvas menjadi string Base64
            fotoBase64 = canvas.toDataURL('image/jpeg');
            
            // Tampilkan pratinjau foto
            fotoPreview.src = fotoBase64;
            fotoPreview.style.display = 'block';
            
            // Sembunyikan video setelah foto diambil
            video.style.display = 'none';
            
            // Aktifkan tombol submit
            submitButton.disabled = false;
        });

        // 3. Submit Absensi
        absenForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Mencegah form reload halaman
            
            const nama = namaInput.value;
            const kelas = kelasInput.value;

            // Validasi
            if (!nama || !kelas || !fotoBase64) {
                alert("Harap isi semua data dan ambil foto.");
                return;
            }

            // Buat objek data baru
            const newEntry = {
                nama: nama,
                kelas: kelas,
                foto_base64: fotoBase64,
                waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            };

            // Ambil data lama dari Local Storage (jika ada)
            let data = JSON.parse(localStorage.getItem('ABSENSI_FOTO_DATA')) || [];
            
            // Tambahkan data baru
            data.push(newEntry);
            
            // Simpan kembali ke Local Storage
            localStorage.setItem('ABSENSI_FOTO_DATA', JSON.stringify(data));

            // Beri notifikasi dan reset
            alert("Absensi berhasil disimpan!");
            window.location.reload(); // Reload halaman untuk absensi berikutnya
        });

        // Panggil fungsi untuk memulai kamera saat halaman dimuat
        startCamera();
    }

    // --- LOGIKA HALAMAN DATA (data.html) ---
    if (document.getElementById('dataTable')) {
        const dataBody = document.getElementById('dataBody');
        const exportButton = document.getElementById('exportButton');
        const deleteButton = document.getElementById('deleteButton');

        // 1. Memuat Data ke Tabel
        function loadData() {
            const data = JSON.parse(localStorage.getItem('ABSENSI_FOTO_DATA')) || [];
            dataBody.innerHTML = ''; // Kosongkan tabel dulu

            if (data.length === 0) {
                dataBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Tidak ada data absensi.</td></tr>';
                return;
            }

            // Tampilkan data terbaru di atas
            data.reverse().forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.waktu}</td>
                    <td>${item.nama}</td>
                    <td>${item.kelas}</td>
                    <td><img src="${item.foto_base64}" alt="Foto ${item.nama}"></td>
                `;
                dataBody.appendChild(row);
            });
        }

        // 2. Fungsionalitas Ekspor ke CSV
        exportButton.addEventListener('click', () => {
            const data = JSON.parse(localStorage.getItem('ABSENSI_FOTO_DATA')) || [];
            if (data.length === 0) {
                alert("Tidak ada data untuk diekspor!");
                return;
            }

            // Tentukan header CSV
            // Catatan: Kita tidak mengekspor string Base64 karena terlalu besar untuk CSV
            // dan tidak praktis. Kita hanya ekspor data teksnya.
            let csvContent = "Waktu Absen,Nama,Kelas/Divisi\n";

            data.forEach(item => {
                // Pastikan data yang mengandung koma dibungkus tanda kutip
                const nama = `"${item.nama}"`;
                const kelas = `"${item.kelas}"`;
                const waktu = `"${item.waktu}"`;
                
                const row = [waktu, nama, kelas].join(',');
                csvContent += row + "\n";
            });

            // Buat Blob (Binary Large Object)
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            // Buat link download palsu
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Buat nama file dinamis berdasarkan tanggal
            const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
            link.setAttribute('download', `Ekspor_Absensi_${tgl}.csv`);
            
            // Klik link secara otomatis
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // 3. Fungsionalitas Hapus Data
        deleteButton.addEventListener('click', () => {
            if (confirm("Anda yakin ingin menghapus SEMUA data absensi? Data tidak dapat dikembalikan.")) {
                localStorage.removeItem('ABSENSI_FOTO_DATA');
                loadData(); // Muat ulang tabel (akan jadi kosong)
                alert("Semua data telah dihapus.");
            }
        });

        // Panggil fungsi untuk memuat data saat halaman data dibuka
        loadData();
    }
});
