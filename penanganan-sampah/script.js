// KONFIGURASI JURUSAN & GOOGLE SHEETS
const configJurusan = {
    "ti": {
        nama: "Teknik Informatika",
        docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q",
        gid: "1830015926"
    },
    "industri": {
        nama: "Teknik Industri",
        docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q",
        gid: "182526279"
    },
    "dkv": {
        nama: "Desain Komunikasi Visual",
        docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q",
        gid: "579296543"
    },
    "bisnis": {
        nama: "Bisnis Digital",
        docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q",
        gid: "561588801"
    },
    "ritel": {
        nama: "Manajemen Ritel",
        docId: "2PACX-1vQPZ3h6A5G8eWckoF0I91SLwMqXKbjZ7lF6bm2S_wxLjG_rO9zC2FSzdkC17N7bt3A0Opm5hzcfDI8Q",
        gid: "1764936433"
    }
};

function getCsvUrl(kodeJurusan) {
    const data = configJurusan[kodeJurusan];
    return `https://docs.google.com/spreadsheets/d/e/${data.docId}/pub?gid=${data.gid}&single=true&output=csv`;
}

function handleEnter(event) {
    if (event.key === "Enter") cariData();
}

function cariData() {
    const selectedRadio = document.querySelector('input[name="jurusan"]:checked');
    const inputNIM = document.getElementById('nim').value.trim();
    const resultSection = document.getElementById('result-section');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    resultSection.style.display = 'none';
    errorMessage.style.display = 'none';

    if (!selectedRadio) return showError("Silakan pilih jurusan terlebih dahulu.");
    if (!inputNIM) return showError("Silakan masukkan NIM mahasiswa.");

    const kodeJurusan = selectedRadio.value;
    const urlCSV = getCsvUrl(kodeJurusan);
    const namaJurusanLengkap = configJurusan[kodeJurusan].nama;

    loading.style.display = 'block';

    Papa.parse(urlCSV, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            loading.style.display = 'none';
            const data = results.data;
            const student = data.find(row => row['NIM'] === inputNIM || row['NIM'] === inputNIM + ".0");

            if (student) tampilkanHasil(student, namaJurusanLengkap);
            else showError(`NIM ${inputNIM} tidak ditemukan di program studi ${namaJurusanLengkap}.`);
        },
        error: function() {
            loading.style.display = 'none';
            showError("Gagal mengambil data. Pastikan ID/GID Spreadsheet sudah benar dan sudah di-publish.");
        }
    });
}

function tampilkanHasil(studentData, namaJurusanLengkap) {
    document.getElementById('res-nama').innerText = studentData['NAMA MAHASISWA'] || "Nama Tidak Diketahui";
    document.getElementById('res-nim').innerText = studentData['NIM'];
    document.getElementById('res-jurusan').innerText = namaJurusanLengkap;

    const container = document.getElementById('attendance-container');
    container.innerHTML = ''; // Kosongkan wadah utama

    const keys = Object.keys(studentData);
    const dataPerBulan = {};
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    // Kelompokkan data berdasarkan Bulan dan Tahun
    keys.forEach(key => {
        if (key !== 'No' && key !== 'NIM' && key !== 'NAMA MAHASISWA') {
            const bagianTanggal = key.split('/');
            if (bagianTanggal.length === 3) {
                const bulanIndex = parseInt(bagianTanggal[1], 10) - 1;
                const tahun = bagianTanggal[2];
                const namaBulanTahun = `${namaBulan[bulanIndex]} ${tahun}`;

                if (!dataPerBulan[namaBulanTahun]) dataPerBulan[namaBulanTahun] = [];
                
                dataPerBulan[namaBulanTahun].push({
                    tanggal: key,
                    status: studentData[key] ? studentData[key].trim() : ""
                });
            }
        }
    });

    // Buat elemen Sekat (Divider) dan Grid menyatu ke bawah
    for (const [bulan, daftarKehadiran] of Object.entries(dataPerBulan)) {
        
        // 1. Buat Sekat Garis Bulan
        const divider = document.createElement('div');
        divider.className = 'month-divider';
        divider.innerText = bulan; // Contoh: "Juli 2026"
        container.appendChild(divider);

        // 2. Buat Grid Kartu Kehadiran di bawah sekat tersebut
        const gridDiv = document.createElement('div');
        gridDiv.className = 'attendance-grid';

        daftarKehadiran.forEach(item => {
            const card = document.createElement('div');
            card.className = 'date-card';

            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-title';
            dateDiv.innerText = item.tanggal; // Tanggal Full DD/MM/YYYY

            const statusDiv = document.createElement('div');
            statusDiv.className = 'status-badge';
            
            const statusLower = item.status.toLowerCase();
            if (statusLower === 'hadir') {
                card.classList.add('status-hadir');
                statusDiv.innerText = "Hadir";
            } else if (statusLower === 'sakit') {
                card.classList.add('status-sakit');
                statusDiv.innerText = "Sakit";
            } else if (statusLower === 'izin') {
                card.classList.add('status-izin');
                statusDiv.innerText = "Izin";
            } else {
                card.classList.add('status-kosong');
                statusDiv.innerText = "-"; 
            }

            card.appendChild(dateDiv);
            card.appendChild(statusDiv);
            gridDiv.appendChild(card);
        });

        container.appendChild(gridDiv);
    }

    const resultSection = document.getElementById('result-section');
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';
}