// ==========================================
// PENGOLAH DATA (pengganti src/main.py)
// Mengambil Excel dari Google Spreadsheet langsung di browser,
// lalu membentuk tabel Kehadiran, Kegiatan, dan Kendala.
// ==========================================

// 1. KONFIGURASI URL
// Spreadsheet harus dibagikan "Siapa saja yang memiliki link" (Viewer)
const SPREADSHEET_ID = '1ajv3xM27_gBGh7tULi2vTvvKkZw7xFe3C7GwILJxTkU';
const URL_EXCEL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;

const SHEET_FORM = 'Form Responses 4';
const SHEET_MAHASISWA = 'Data Mahasiswa';
const SHEET_TIMELINE = 'Time Line';

const NAME_COLS = ['Nama - NIM', 'Nama - NIM 2', 'Nama - NIM 3', 'Nama - NIM 4', 'Nama - NIM 5'];
const INDEX_COLS = ['NIM', 'NAMA MAHASISWA', 'DEPARTEMEN', 'KELURAHAN', 'RW', 'REGULER/KIP'];

// Ambil file Excel dari Google Spreadsheet (ArrayBuffer)
async function ambilExcelDariSpreadsheet() {
    const response = await fetch(URL_EXCEL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Spreadsheet tidak bisa diakses (HTTP ${response.status})`);
    return await response.arrayBuffer();
}

// Ubah isi sel menjadi teks rapi (angka bulat seperti NIM tidak jadi "2.3E+10")
function keTeks(nilai) {
    if (nilai === null || nilai === undefined) return '';
    if (typeof nilai === 'number' && Number.isInteger(nilai)) return String(nilai);
    return String(nilai).trim();
}

// Ubah isi sel tanggal menjadi "DD/MM/YYYY", atau null jika tidak valid
function keTanggalStr(nilai) {
    if (nilai === null || nilai === undefined || nilai === '') return null;
    let d, m, y;

    if (typeof nilai === 'number') {
        // Sel tanggal di Excel tersimpan sebagai nomor seri
        const kode = XLSX.SSF.parse_date_code(nilai);
        if (!kode) return null;
        d = kode.d; m = kode.m; y = kode.y;
    } else {
        const teks = String(nilai).trim();
        let cocok = teks.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); // DD/MM/YYYY
        if (cocok) {
            d = +cocok[1]; m = +cocok[2]; y = +cocok[3];
        } else if ((cocok = teks.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { // YYYY-MM-DD
            y = +cocok[1]; m = +cocok[2]; d = +cocok[3];
        } else {
            return null;
        }
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function bacaSheet(workbook, nama) {
    const sheet = workbook.Sheets[nama];
    if (!sheet) throw new Error(`Sheet "${nama}" tidak ditemukan di spreadsheet`);
    return XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
}

function ekstrakNim(teks) {
    const cocok = String(teks).match(/\d+/);
    return cocok ? cocok[0] : null;
}

// Olah workbook menjadi { kehadiran, kegiatan, kendala }
function olahWorkbook(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const dfForm = bacaSheet(workbook, SHEET_FORM);
    const dfMhs = bacaSheet(workbook, SHEET_MAHASISWA);
    const dfTimeline = bacaSheet(workbook, SHEET_TIMELINE);

    // -- SIAPKAN TIME LINE --
    // Daftar semua tanggal sebagai patokan kolom
    const masterTanggal = dfTimeline
        .map(baris => keTanggalStr(baris['TANGGAL']))
        .filter(Boolean);

    // -- BASIS DAFTAR MAHASISWA (hanya STATUS 'Aktif') --
    // Mahasiswa yang belum pernah isi form tetap muncul
    const nimSudahAda = new Set();
    const mhsBase = [];
    dfMhs.forEach(baris => {
        const nim = keTeks(baris['NIM']);
        const status = keTeks(baris['STATUS']).toLowerCase();
        if (status !== 'aktif' || nimSudahAda.has(nim)) return;
        nimSudahAda.add(nim);

        const identitas = {};
        INDEX_COLS.forEach(k => { identitas[k] = keTeks(baris[k]); });
        identitas['NIM'] = nim;
        mhsBase.push(identitas);
    });

    // -- TRANSFORMASI DATA FORM (melt kolom Nama - NIM 1..5) --
    // Urutan sama seperti pandas.melt: semua baris kolom 1, lalu kolom 2, dst.
    const dataMelt = [];
    NAME_COLS.forEach(kolom => {
        dfForm.forEach(baris => {
            const raw = baris[kolom];
            if (raw === null || raw === undefined || raw === '') return;

            const nim = ekstrakNim(raw);
            const tanggal = keTanggalStr(baris['Tanggal Kegiatan']);
            if (!nim || !tanggal) return;

            dataMelt.push({
                nim,
                tanggal,
                'Kehadiran': baris['Kehadiran'],
                'Kegiatan yang dilakukan': baris['Kegiatan yang dilakukan'],
                'Hambatan / Kendala': baris['Hambatan / Kendala']
            });
        });
    });

    // -- PEMBUAT TABEL REKAP (pivot NIM x Tanggal, ambil nilai pertama yang terisi) --
    function buatTabelRekap(kolomNilai) {
        const pivot = {}; // pivot[nim][tanggal] = nilai
        dataMelt.forEach(item => {
            const nilai = item[kolomNilai];
            if (nilai === null || nilai === undefined || nilai === '') return;
            if (!pivot[item.nim]) pivot[item.nim] = {};
            if (!(item.tanggal in pivot[item.nim])) pivot[item.nim][item.tanggal] = keTeks(nilai);
        });

        return mhsBase.map((mhs, i) => {
            const baris = { 'No': i + 1 };
            INDEX_COLS.forEach(k => { baris[k] = mhs[k] || '-'; });
            masterTanggal.forEach(tgl => {
                const nilai = pivot[mhs['NIM']] && pivot[mhs['NIM']][tgl];
                baris[tgl] = nilai || '-';
            });
            return baris;
        });
    }

    return {
        kehadiran: buatTabelRekap('Kehadiran'),
        kegiatan: buatTabelRekap('Kegiatan yang dilakukan'),
        kendala: buatTabelRekap('Hambatan / Kendala')
    };
}
