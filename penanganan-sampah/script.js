const configJurusan = {
    "ti": { nama: "Teknik Informatika", docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q", gid: "1830015926" },
    "industri": { nama: "Teknik Industri", docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q", gid: "182526279" },
    "dkv": { nama: "Desain Komunikasi Visual", docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q", gid: "579296543" },
    "bisnis": { nama: "Bisnis Digital", docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q", gid: "561588801" },
    "ritel": { nama: "Manajemen Ritel", docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q", gid: "1764936433" }
};

const urlDataRW = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q/pub?gid=0&single=true&output=csv";

// Variabel untuk menyimpan data master
let globalMasterData = [];

// Fungsi PENGAMBILAN DATA BARU: Jauh lebih stabil dan kebal cache nyangkut
async function fetchCSV(url) {
    try {
        // Cache buster: memaksa browser mendownload data terbaru tanpa cache
        const urlWithCacheBuster = url + "&t=" + new Date().getTime();
        const response = await fetch(urlWithCacheBuster, { cache: "no-store" });
        
        if (!response.ok) {
            throw new Error(`Gagal akses server Google Sheets (Status: ${response.status})`);
        }
        
        const csvText = await response.text();
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: resolve,
                error: reject
            });
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
    }
}

// Inisialisasi awal saat web dibuka
document.addEventListener('DOMContentLoaded', async () => {
    const rwSelect = document.getElementById('rw-select');
    rwSelect.innerHTML = '<option value="" disabled selected>Memuat daftar wilayah dari sistem...</option>';

    try {
        const masterRes = await fetchCSV(urlDataRW);
        globalMasterData = masterRes.data;
        const wilayahSet = new Set();
        
        globalMasterData.forEach(row => {
            let kel = row['KELURAHAN'] ? row['KELURAHAN'].trim().replace(/^Kelurahan\s+/i, '') : '';
            let rw = row['RW'] ? row['RW'].trim() : '';
            if(kel && rw) {
                wilayahSet.add(`${kel} - ${rw}`);
            }
        });

        const wilayahArray = Array.from(wilayahSet).sort();
        rwSelect.innerHTML = '<option value="" disabled selected>-- Silakan Pilih Kelurahan & RW --</option>';
        wilayahArray.forEach(wilayah => {
            let option = document.createElement('option');
            option.value = wilayah; option.text = wilayah;
            rwSelect.appendChild(option);
        });
    } catch (error) {
        rwSelect.innerHTML = '<option value="" disabled>Gagal memuat daftar wilayah. Cek koneksi / ID G-Sheet.</option>';
    }
});

function getCsvUrl(kodeJurusan) {
    return `https://docs.google.com/spreadsheets/d/e/${configJurusan[kodeJurusan].docId}/pub?gid=${configJurusan[kodeJurusan].gid}&single=true&output=csv`;
}

function switchMode(mode) {
    const formNim = document.getElementById('form-nim');
    const formRw = document.getElementById('form-rw');
    const btnNim = document.getElementById('btn-mode-nim');
    const btnRw = document.getElementById('btn-mode-rw');
    
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('result-rw-section').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';

    if (mode === 'nim') {
        formNim.style.display = 'block'; formRw.style.display = 'none';
        btnNim.classList.add('active'); btnRw.classList.remove('active');
    } else {
        formNim.style.display = 'none'; formRw.style.display = 'block';
        btnNim.classList.remove('active'); btnRw.classList.add('active');
    }
}

function handleEnter(event) {
    if (event.key === "Enter") cariDataNIM();
}

// === PENCARIAN BERDASARKAN NIM ===
async function cariDataNIM() {
    const selectedJurusan = document.getElementById('jurusan').value;
    const inputNIM = document.getElementById('nim').value.trim();
    const resultSection = document.getElementById('result-section');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    document.getElementById('result-rw-section').style.display = 'none';
    resultSection.style.display = 'none'; errorMessage.style.display = 'none';

    if (!selectedJurusan) return showError("Silakan pilih jurusan terlebih dahulu.");
    if (!inputNIM) return showError("Silakan masukkan NIM mahasiswa.");

    const urlCSV = getCsvUrl(selectedJurusan);
    const namaJurusanLengkap = configJurusan[selectedJurusan].nama;

    loading.innerText = "Mencari data mahasiswa...";
    loading.style.display = 'block';

    try {
        const results = await fetchCSV(urlCSV);
        loading.style.display = 'none';
        
        const student = results.data.find(row => row['NIM'] === inputNIM || row['NIM'] === inputNIM + ".0");
        if (student) tampilkanHasilNIM(student, namaJurusanLengkap);
        else showError(`NIM ${inputNIM} tidak ditemukan di program studi ${namaJurusanLengkap}.`);
    } catch (error) {
        loading.style.display = 'none'; 
        showError("Gagal mengambil data. Pastikan status Google Sheet masih 'Published to the web'.");
    }
}

function tampilkanHasilNIM(studentData, namaJurusanLengkap) {
    document.getElementById('res-nama').innerText = studentData['NAMA MAHASISWA'] || "Nama Tidak Diketahui";
    document.getElementById('res-nim').innerText = studentData['NIM'];
    document.getElementById('res-jurusan').innerText = namaJurusanLengkap;

    const container = document.getElementById('attendance-container'); container.innerHTML = ''; 
    const dataPerBulan = {};
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const kolomAbaikan = ['No', 'NIM', 'NAMA MAHASISWA', 'DEPARTEMEN', 'STATUS', 'ANGKATAN', 'KELURAHAN', 'RW', 'KONTAK', 'REGULER/KIP', 'KEANGGOTAAN', 'Hadir', 'Kordinasi', 'Izin', 'Sakit', 'Belum ditandai'];

    Object.keys(studentData).forEach(key => {
        if (!kolomAbaikan.includes(key) && key.includes('/')) {
            const bagianTanggal = key.split('/');
            if (bagianTanggal.length >= 2) {
                const bln = parseInt(bagianTanggal[1], 10) - 1;
                const thn = bagianTanggal[2] || new Date().getFullYear();
                const namaBulanTahun = `${namaBulan[bln]} ${thn}`;
                if (!dataPerBulan[namaBulanTahun]) dataPerBulan[namaBulanTahun] = [];
                dataPerBulan[namaBulanTahun].push({ tanggal: key, status: studentData[key] ? studentData[key].trim() : "" });
            }
        }
    });

    for (const [bulan, daftarKehadiran] of Object.entries(dataPerBulan)) {
        const divider = document.createElement('div'); divider.className = 'month-divider'; divider.innerText = bulan; container.appendChild(divider);
        const gridDiv = document.createElement('div'); gridDiv.className = 'attendance-grid';

        daftarKehadiran.forEach(item => {
            const card = document.createElement('div'); card.className = 'date-card';
            const dateDiv = document.createElement('div'); dateDiv.className = 'date-title'; dateDiv.innerText = item.tanggal;
            const statusDiv = document.createElement('div'); statusDiv.className = 'status-badge';

            const st = item.status.toLowerCase();
            if (st === 'hadir') { card.classList.add('status-hadir'); statusDiv.innerText = "Hadir"; } 
            else if (st === 'sakit') { card.classList.add('status-sakit'); statusDiv.innerText = "Sakit"; } 
            else if (st === 'izin') { card.classList.add('status-izin'); statusDiv.innerText = "Izin"; } 
            else if (st === 'kordinasi online' || st === 'kordinasi') { card.classList.add('status-kordinasi'); statusDiv.innerText = "Kordinasi"; } 
            else { card.classList.add('status-kosong'); statusDiv.innerText = "-"; }

            card.appendChild(dateDiv); card.appendChild(statusDiv); gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);
    }

    const summaryContainer = document.getElementById('summary-container'); summaryContainer.innerHTML = ''; 
    const dataRingkasan = [
        { judul: "Hadir", nilai: studentData['Hadir'] || "0", classWarna: "status-hadir" },
        { judul: "Kordinasi", nilai: studentData['Kordinasi'] || "0", classWarna: "status-kordinasi" },
        { judul: "Izin", nilai: studentData['Izin'] || "0", classWarna: "status-izin" },
        { judul: "Sakit", nilai: studentData['Sakit'] || "0", classWarna: "status-sakit" },
        { judul: "Kosong", nilai: studentData['Belum ditandai'] || "0", classWarna: "status-kosong" }
    ];

    dataRingkasan.forEach(item => {
        const box = document.createElement('div'); box.className = `summary-card ${item.classWarna}`;
        box.innerHTML = `<div class="summary-value">${item.nilai}</div><div class="summary-label">${item.judul}</div>`;
        summaryContainer.appendChild(box);
    });

    const resultSection = document.getElementById('result-section');
    resultSection.style.display = 'block'; resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === PENCARIAN BERDASARKAN KELURAHAN & RW ===
function getJurusanKey(departemenStr) {
    if (!departemenStr) return null;
    const str = departemenStr.toLowerCase();
    if (str.includes("informatika")) return "ti";
    if (str.includes("industri")) return "industri";
    if (str.includes("komunikasi") || str.includes("dkv")) return "dkv";
    if (str.includes("bisnis")) return "bisnis";
    if (str.includes("ritel")) return "ritel";
    return null;
}

async function cariDataRW() {
    const selectedValue = document.getElementById('rw-select').value;
    const resultRwSection = document.getElementById('result-rw-section');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');

    document.getElementById('result-section').style.display = 'none';
    resultRwSection.style.display = 'none';
    errorMessage.style.display = 'none';

    if (!selectedValue) return showError("Silakan pilih Kelurahan & RW terlebih dahulu.");

    loading.innerText = "Menarik seluruh data presensi untuk wilayah ini...";
    loading.style.display = 'block';

    try {
        if(globalMasterData.length === 0) throw new Error("Data master belum termuat. Silakan refresh (F5) halaman Anda.");
        
        const [targetKelurahan, targetRW] = selectedValue.split(' - ');
        
        const rwStudents = globalMasterData.filter(row => {
            let kel = (row['KELURAHAN'] || '').replace(/^Kelurahan\s+/i, '').trim();
            let rw = (row['RW'] || '').trim();
            return kel.toUpperCase() === targetKelurahan.toUpperCase() && rw.toUpperCase() === targetRW.toUpperCase();
        });

        if (rwStudents.length === 0) throw new Error(`Tidak ada data mahasiswa di wilayah ${selectedValue}.`);

        const neededJurusan = [...new Set(rwStudents.map(s => getJurusanKey(s['DEPARTEMEN'])).filter(Boolean))];

        const attendancePromises = neededJurusan.map(jurusanKey => {
            return fetchCSV(getCsvUrl(jurusanKey)).then(res => ({ data: res.data }));
        });
        
        const attendanceResults = await Promise.all(attendancePromises);
        
        const attendanceByNIM = {};
        let allDates = new Set();
        const kolomAbaikan = ['No', 'NIM', 'NAMA MAHASISWA', 'DEPARTEMEN', 'STATUS', 'ANGKATAN', 'KELURAHAN', 'RW', 'KONTAK', 'REGULER/KIP', 'KEANGGOTAAN', 'Hadir', 'Kordinasi', 'Izin', 'Sakit', 'Belum ditandai'];

        attendanceResults.forEach(result => {
            result.data.forEach(row => {
                const nim = row['NIM'] ? String(row['NIM']).replace('.0', '').trim() : null;
                if(nim) {
                    attendanceByNIM[nim] = row;
                    Object.keys(row).forEach(key => {
                        if(!kolomAbaikan.includes(key) && key.includes('/')) allDates.add(key.trim());
                    });
                }
            });
        });

        const sortedDates = Array.from(allDates).sort((a, b) => {
            const partsA = a.split('/'); const partsB = b.split('/');
            if(partsA.length >= 3 && partsB.length >= 3) {
                return new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`) - new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`);
            }
            return 0;
        });

        loading.style.display = 'none';
        tampilkanTabelRW(rwStudents, attendanceByNIM, sortedDates, selectedValue);

    } catch (error) {
        loading.style.display = 'none';
        showError(error.message || "Proses penyinkronan data gagal. Periksa koneksi internet.");
    }
}

function tampilkanTabelRW(rwStudents, attendanceByNIM, sortedDates, wilayahName) {
    const container = document.getElementById('rw-table-container');
    document.getElementById('rw-title').innerText = `Monitoring Dosen - Wilayah ${wilayahName}`;
    
    let tableHTML = `
        <div class="table-wrapper">
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th class="text-center">No</th>
                        <th class="text-left">NIM</th>
                        <th class="text-left" style="min-width: 200px;">NAMA MAHASISWA</th>
                        <th class="text-center" style="min-width: 130px;">JURUSAN</th>`;
    
    sortedDates.forEach(tgl => tableHTML += `<th class="text-center">${tgl}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    rwStudents.forEach((student, index) => {
        const nim = student['NIM'] ? String(student['NIM']).replace('.0', '').trim() : '';
        const nama = student['NAMA MAHASISWA'] || '-';
        const jurusan = student['DEPARTEMEN'] || '-';
        const attendanceRow = attendanceByNIM[nim] || {};

        tableHTML += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-left">${nim}</td>
                <td class="text-left"><strong>${nama}</strong></td>
                <td class="text-center" style="font-size: 11px;">${jurusan}</td>`;
        
        sortedDates.forEach(tgl => {
            let statusLower = (attendanceRow[tgl] || '').trim().toLowerCase();
            let bgClass = ''; let displayText = '-';
            
            if (statusLower === 'hadir') { bgClass = 'bg-hadir'; displayText = 'Hadir'; }
            else if (statusLower === 'sakit') { bgClass = 'bg-sakit'; displayText = 'Sakit'; }
            else if (statusLower === 'izin') { bgClass = 'bg-izin'; displayText = 'Izin'; }
            else if (statusLower === 'kordinasi online' || statusLower === 'kordinasi') { bgClass = 'bg-kordinasi'; displayText = 'Kordinasi'; }
            
            tableHTML += `<td class="text-center ${bgClass}">${displayText}</td>`;
        });

        tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;

    const resultRwSection = document.getElementById('result-rw-section');
    resultRwSection.style.display = 'block';
    resultRwSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message; errorMessage.style.display = 'block';
}