let semuaData = null; // { kehadiran, kegiatan, kendala } hasil olahWorkbook()
let dataMentah = [];
let dataTerfilter = [];
let menuAktif = 'kehadiran';

// Pengaturan Pagination
let halamanSaatIni = 1;
const barisPerHalaman = 50;

const regexTanggal = /^\d{2}\/\d{2}\/\d{4}$/;

$(document).ready(function() {
    $('.select2-filter').select2({
        width: '100%',
        allowClear: true
    });

    // Menangkap event change dari Select2 untuk memicu filter
    $('.select2-filter').on('change', function() {
        halamanSaatIni = 1; // Kembali ke halaman 1 tiap kali filter diganti
        terapkanFilter();
    });

    segarkanData();
});

// Cegah teks dari form merusak tampilan HTML
function escapeHtml(teks) {
    return String(teks)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tampilkanStatus(pesan, isError = false) {
    const el = document.getElementById('statusData');
    el.innerText = pesan;
    el.classList.toggle('error', isError);
}

function waktuSekarang() {
    return new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Tampilkan ulang menu yang sedang aktif setelah data baru masuk
function tampilkanMenuAktif() {
    if (menuAktif === 'dashboard') loadDashboardData();
    else loadData(menuAktif);
}

// Fitur Sidebar Mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if(sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// Pindah Menu
function gantiMenu(jenis, elemenLi) {
    menuAktif = jenis;
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    elemenLi.classList.add('active');
    
    // Tutup menu sidebar otomatis jika diakses dari Mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    
    // Logika buka/tutup komponen berdasarkan menu
    if (jenis === 'dashboard') {
        document.getElementById('judulTabel').innerText = `Dashboard Analisis Kehadiran`;
        document.querySelector('.filter-container').style.display = 'none';
        document.getElementById('tabelContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        
        // Panggil fungsi pembuat grafik
        loadDashboardData();
    } else {
        let judul = jenis.charAt(0).toUpperCase() + jenis.slice(1);
        document.getElementById('judulTabel').innerText = `Monitoring ${judul} Penanganan Sampah`;
        
        document.querySelector('.filter-container').style.display = 'flex';
        document.getElementById('tabelContainer').style.display = 'flex';
        document.getElementById('dashboardContainer').style.display = 'none';
        
        resetFilterVisual();
        halamanSaatIni = 1;
        loadData(jenis);
    }
}

// Tombol Segarkan: ambil ulang data terbaru dari Google Spreadsheet
async function segarkanData() {
    halamanSaatIni = 1;
    tampilkanStatus('Memuat data dari spreadsheet...');
    try {
        const excel = await ambilExcelDariSpreadsheet();
        semuaData = olahWorkbook(excel);
        tampilkanStatus(`Data spreadsheet dimuat: ${waktuSekarang()}`);
        tampilkanMenuAktif();
    } catch (error) {
        console.error('Gagal mengambil spreadsheet:', error);
        tampilkanStatus('Gagal mengambil data dari Google Spreadsheet. Pastikan spreadsheet dibagikan "Siapa saja yang memiliki link", atau pakai tombol "Buka Excel".', true);
        if (!semuaData) {
            document.getElementById('tableBody').innerHTML = '<tr><td colspan="10" style="text-align:center;">Gagal mengambil data.</td></tr>';
        }
    }
}

// Tombol Buka Excel: olah file .xlsx yang diunduh manual dari spreadsheet
async function bukaFileExcel(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        semuaData = olahWorkbook(await file.arrayBuffer());
        halamanSaatIni = 1;
        tampilkanStatus(`Data dari file "${file.name}" dimuat: ${waktuSekarang()}`);
        tampilkanMenuAktif();
    } catch (error) {
        console.error('Gagal membaca file Excel:', error);
        tampilkanStatus(`Gagal membaca file Excel: ${error.message}`, true);
    }
    input.value = '';
}

// Menampilkan tabel dari data yang sudah diolah
function loadData(jenis) {
    if (!semuaData) return;
    try {
        let data = semuaData[jenis].map(baris => ({ ...baris }));

        if (jenis === 'kehadiran') {
            data = hitungRekapKehadiran(data);
        }

        dataMentah = data;
        
        // Generate ulang nomor agar berurutan 1,2,3 dst
        dataTerfilter = dataMentah.map((baris, index) => {
            return { ...baris, 'No': index + 1 };
        });
        
        isiOpsiFilter();
        renderTabel();
    } catch (error) {
        console.error("Gagal load data:", error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="10" style="text-align:center;">Gagal menampilkan data.</td></tr>';
    }
}

function hitungRekapKehadiran(data) {
    return data.map(baris => {
        let hadir = 0, kordinasi = 0, izin = 0, sakit = 0, belumDitandai = 0;
        
        Object.keys(baris).forEach(key => {
            if (regexTanggal.test(key)) {
                let isi = (baris[key] || '').toString().trim().toLowerCase();
                if (isi === 'hadir') hadir++;
                else if (isi.includes('kordinasi')) kordinasi++;
                else if (isi === 'izin') izin++;
                else if (isi === 'sakit') sakit++;
                else if (isi === '-' || isi === '') belumDitandai++;
            }
        });

        baris['TOTAL HADIR'] = hadir;
        baris['TOTAL KORDINASI'] = kordinasi;
        baris['TOTAL IZIN'] = izin;
        baris['TOTAL SAKIT'] = sakit;
        baris['BELUM DITANDAI'] = belumDitandai;

        return baris;
    });
}

function isiOpsiFilter() {
    const filters = {
        'NIM': '#filterNim',
        'NAMA MAHASISWA': '#filterNama',
        'DEPARTEMEN': '#filterDept',
        'KELURAHAN': '#filterKelurahan',
        'RW': '#filterRw',
        'REGULER/KIP': '#filterRegulerKip'
    };

    Object.keys(filters).forEach(key => {
        const setUnik = new Set(dataMentah.map(item => item[key]));
        
        // UBAH BARIS INI: Agar teks filter langsung menunjukkan nama kolomnya
        let html = `<option value="">${key}...</option>`; 
        
        Array.from(setUnik).sort().forEach(val => {
            if(val && val !== '-') html += `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`;
        });
        
        $(filters[key]).html(html).trigger('change.select2');
    });
}

function terapkanFilter() {
    const fNim = $('#filterNim').val();
    const fNama = $('#filterNama').val();
    const fDept = $('#filterDept').val();
    const fKel = $('#filterKelurahan').val();
    const fRw = $('#filterRw').val();
    const fRegulerKip = $('#filterRegulerKip').val();

    dataTerfilter = dataMentah.filter(baris => {
        return (!fNim || baris['NIM'] == fNim) &&
               (!fNama || baris['NAMA MAHASISWA'] == fNama) &&
               (!fDept || baris['DEPARTEMEN'] == fDept) &&
               (!fKel || baris['KELURAHAN'] == fKel) &&
               (!fRw || baris['RW'] == fRw) &&
               (!fRegulerKip || baris['REGULER/KIP'] == fRegulerKip);
    }).map((baris, index) => {
        return { ...baris, 'No': index + 1 };
    });

    renderTabel();
}

function resetFilterVisual() {
    $('#filterNim').val('').trigger('change.select2');
    $('#filterNama').val('').trigger('change.select2');
    $('#filterDept').val('').trigger('change.select2');
    $('#filterKelurahan').val('').trigger('change.select2');
    $('#filterRw').val('').trigger('change.select2');
    $('#filterRegulerKip').val('').trigger('change.select2');
}

function resetFilter() {
    resetFilterVisual();
    halamanSaatIni = 1;
    dataTerfilter = dataMentah.map((baris, index) => {
        return { ...baris, 'No': index + 1 };
    });
    renderTabel();
}

function renderTabel() {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    
    if (dataTerfilter.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Data tidak ditemukan</td></tr>';
        renderPagination(0);
        return;
    }

    const kolomKeys = Object.keys(dataTerfilter[0]);
    let htmlHead = '<tr>';
    kolomKeys.forEach(k => { htmlHead += `<th>${escapeHtml(k)}</th>`; });
    htmlHead += '</tr>';
    thead.innerHTML = htmlHead;

    const indexAwal = (halamanSaatIni - 1) * barisPerHalaman;
    const indexAkhir = indexAwal + barisPerHalaman;
    const dataHalamanIni = dataTerfilter.slice(indexAwal, indexAkhir);

    let htmlBody = '';
    dataHalamanIni.forEach(baris => {
        htmlBody += '<tr>';
        kolomKeys.forEach(k => {
            let isiTeks = baris[k] !== null ? baris[k] : '';
            let tdClass = '';
            
            let isKolomTanggal = regexTanggal.test(k);
            if ((menuAktif === 'kegiatan' || menuAktif === 'kendala') && isKolomTanggal) {
                tdClass += 'wrap-text ';
            }

            if (menuAktif === 'kehadiran' && isKolomTanggal) {
                let status = (isiTeks || '').toString().toLowerCase();
                if (status === 'hadir') tdClass += 'status-hadir ';
                else if (status.includes('kordinasi')) tdClass += 'status-kordinasi ';
                else if (status === 'izin') tdClass += 'status-izin ';
                else if (status === 'sakit') tdClass += 'status-sakit ';
            }
            
            htmlBody += `<td class="${tdClass.trim()}">${escapeHtml(isiTeks)}</td>`;
        });
        htmlBody += '</tr>';
    });
    tbody.innerHTML = htmlBody;

    renderPagination(dataTerfilter.length);
}

function renderPagination(totalData) {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';
    
    if(totalData === 0) return;

    const totalHalaman = Math.ceil(totalData / barisPerHalaman);
    
    const info = document.createElement('span');
    info.style.marginRight = 'auto';
    info.style.fontSize = '0.85rem';
    info.style.color = '#5f6368';
    
    let awal = ((halamanSaatIni - 1) * barisPerHalaman) + 1;
    let akhir = Math.min(halamanSaatIni * barisPerHalaman, totalData);
    info.innerText = `Menampilkan ${awal} - ${akhir} dari ${totalData} data`;
    container.appendChild(info);

    for (let i = 1; i <= totalHalaman; i++) {
        if (i === 1 || i === totalHalaman || (i >= halamanSaatIni - 2 && i <= halamanSaatIni + 2)) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === halamanSaatIni ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                halamanSaatIni = i;
                renderTabel();
                document.querySelector('.table-responsive').scrollTop = 0;
            };
            container.appendChild(btn);
        } else if (i === halamanSaatIni - 3 || i === halamanSaatIni + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.innerText = '...';
            ellipsis.style.padding = '0 5px';
            container.appendChild(ellipsis);
        }
    }
}

function downloadCSV() {
    if(dataTerfilter.length === 0) return alert("Tidak ada data untuk didownload");

    const keys = Object.keys(dataTerfilter[0]);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += keys.map(k => `"${k}"`).join(";") + "\r\n";

    dataTerfilter.forEach(baris => {
        let barisArray = keys.map(k => {
            let cell = baris[k] !== null ? baris[k].toString() : '';
            return `"${cell.replace(/"/g, '""')}"`;
        });
        csvContent += barisArray.join(";") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_${menuAktif}_Terfilter.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// FITUR DASHBOARD GRAFIK (PER BULAN)
// ==========================================

Chart.register(ChartDataLabels);

let daftarChart = []; // Disimpan agar grafik lama bisa dihapus saat dashboard dimuat ulang

function loadDashboardData() {
    try {
        const dashboardContainer = document.getElementById('dashboardContainer');
        if (!semuaData) {
            dashboardContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Memuat data grafik...</p>';
            return;
        }

        renderGrafikDashboardPerBulan(semuaData.kehadiran);
    } catch (error) {
        console.error("Gagal load data dashboard:", error);
        document.getElementById('dashboardContainer').innerHTML = '<p style="color:red; text-align:center; margin-top:20px;">Gagal memuat data.</p>';
    }
}

function renderGrafikDashboardPerBulan(data) {
    const container = document.getElementById('dashboardContainer');
    daftarChart.forEach(chart => chart.destroy());
    daftarChart = [];
    container.innerHTML = '';

    const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    // 1. Agregasi Data: Kelurahan -> Bulan -> RW -> {hadir, kordinasi}
    let stats = {}; 

    data.forEach(baris => {
        let kel = baris['KELURAHAN'];
        let rw = baris['RW'];
        
        if (!kel || kel === '-' || !rw || rw === '-') return;

        if (!stats[kel]) stats[kel] = {};

        Object.keys(baris).forEach(key => {
            if (regexTanggal.test(key)) {
                let status = (baris[key] || '').toString().toLowerCase();
                
                let isHadir = (status === 'hadir');
                let isKordinasi = status.includes('kordinasi');

                if (isHadir || isKordinasi) {
                    let parts = key.split('/'); // Misal: 12/08/2026
                    let indeksBulan = parseInt(parts[1], 10) - 1;
                    let tahun = parts[2];
                    
                    // Format key sorting: YYYY-MM
                    let keyBulanSort = `${tahun}-${(indeksBulan + 1).toString().padStart(2, '0')}`;
                    let labelBulan = `${namaBulanArr[indeksBulan]} ${tahun}`;

                    if (!stats[kel][keyBulanSort]) {
                        stats[kel][keyBulanSort] = {
                            label: labelBulan,
                            rwData: {}
                        };
                    }

                    if (!stats[kel][keyBulanSort].rwData[rw]) {
                        stats[kel][keyBulanSort].rwData[rw] = { hadir: 0, kordinasi: 0 };
                    }
                    
                    if (isHadir) stats[kel][keyBulanSort].rwData[rw].hadir++;
                    if (isKordinasi) stats[kel][keyBulanSort].rwData[rw].kordinasi++;
                }
            }
        });
    });

    const kelurahanList = Object.keys(stats).sort();

    if (kelurahanList.length === 0) {
        container.innerHTML = '<p style="text-align:center; margin-top:20px;">Belum ada data kehadiran atau kordinasi untuk ditampilkan.</p>';
        return;
    }

    // Cari nilai Maksimum Global untuk menyamakan Skala Y
    let maxGlobalKehadiran = 0;
    kelurahanList.forEach(kel => {
        Object.keys(stats[kel]).forEach(keyBulanSort => {
            Object.values(stats[kel][keyBulanSort].rwData).forEach(jumlah => {
                let total = jumlah.hadir + jumlah.kordinasi;
                if (total > maxGlobalKehadiran) maxGlobalKehadiran = total;
            });
        });
    });
    
    // Tambah sedikit ruang kosong di puncak grafik
    let skalaYMax = Math.ceil((maxGlobalKehadiran + 5) / 5) * 5; 

    // 2. Render Card untuk tiap Kelurahan -> tiap Bulan (Berbaris ke Bawah)
    kelurahanList.forEach(kel => {
        
        // Judul Kelurahan (Dengan Efek Sticky)
        let headerKel = document.createElement('h2');
        headerKel.style.margin = '0 0 20px 0'; 
        headerKel.style.padding = '15px 0 10px 0'; // Memberi ruang agar teks tidak terlalu mepet
        headerKel.style.color = '#1c1e21';
        headerKel.style.borderBottom = '3px solid #0b57d0';
        
        // KUNCI EFEK STICKY 
        headerKel.style.position = 'sticky';     // Membuatnya menempel saat di-scroll
        headerKel.style.top = '0';               // Menempel di batas paling atas container
        headerKel.style.backgroundColor = '#f0f2f5'; // Menyesuaikan warna background body agar grafik di bawahnya tertutup
        headerKel.style.zIndex = '100';          // Menjaga judul selalu berada di atas (tidak tertumpuk grafik)

        // Hapus penambahan kata "Kelurahan" secara manual agar tidak dobel
        headerKel.innerText = `📍 ${kel}`; 
        container.appendChild(headerKel);

        // Grid ini sekarang hanya punya 1 kolom (1 grafik = full lebar kontainer)
        let gridBulan = document.createElement('div');
        gridBulan.style.display = 'grid';
        gridBulan.style.gridTemplateColumns = '1fr'; 
        gridBulan.style.gap = '25px';
        
        // Tambahkan margin bawah agar ada jarak ekstra sebelum masuk ke kelurahan selanjutnya
        gridBulan.style.marginBottom = '40px'; 
        container.appendChild(gridBulan);

        let listBulanSort = Object.keys(stats[kel]).sort(); 

        listBulanSort.forEach(keyBulanSort => {
            let labelBulan = stats[kel][keyBulanSort].label;
            let rwData = stats[kel][keyBulanSort].rwData;

            let card = document.createElement('div');
            card.className = 'chart-card';
            
            let rwLabels = Object.keys(rwData).sort();

            // Karena sekarang memakan 1 layar penuh ke samping, kita buang overflow-x (kecuali jika RW lebih dari 30)
            let lebarDinamis = rwLabels.length > 30 ? (rwLabels.length * 40) + 'px' : '100%';

            card.innerHTML = `
                <h3 style="font-size: 1.2rem; text-align: left; color: #444746; margin-bottom:10px;">🗓️ Bulan ${labelBulan}</h3>
                <div style="overflow-x: auto; width: 100%;">
                    <div class="chart-wrapper" style="width: ${lebarDinamis}; min-width: 100%; height: 350px;">
                        <canvas></canvas>
                    </div>
                </div>
            `;
            gridBulan.appendChild(card);

            // Persiapan Data Chart
            let dataHadir = [];
            let dataKordinasi = [];

            rwLabels.forEach(rw => {
                dataHadir.push(rwData[rw].hadir);
                dataKordinasi.push(rwData[rw].kordinasi);
            });

            let ctx = card.querySelector('canvas').getContext('2d');

            daftarChart.push(new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: rwLabels.map(rw => `${rw}`),
                    datasets: [
                        {
                            label: 'Hadir',
                            data: dataHadir,
                            backgroundColor: '#0b57d0', // Biru Google
                            borderWidth: 0,
                            borderRadius: 4
                        },
                        {
                            label: 'Kordinasi',
                            data: dataKordinasi,
                            backgroundColor: '#ffc107', // Kuning
                            borderWidth: 0,
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true },
                        y: { 
                            stacked: true,
                            min: 0,
                            max: skalaYMax, // Skala absolut tetap diterapkan
                            title: { display: true, text: 'Total Kehadiran & Kordinasi' }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', align: 'end' },
                        tooltip: { mode: 'index', intersect: false },
                        datalabels: {
                            color: '#fff',
                            font: { weight: 'bold', size: 11 },
                            formatter: function(value) {
                                return value > 0 ? value : ''; 
                            }
                        }
                    }
                }
            }));
        });
    });
}