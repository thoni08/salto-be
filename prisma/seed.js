import prisma from './client.js'
import bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seeder...');

  // Check if data already exists
  const existingUserCount = await prisma.user.count();
  const existingTagCount = await prisma.tag.count();
  const existingThreadCount = await prisma.thread.count();

  if (existingUserCount > 0 || existingTagCount > 0 || existingThreadCount > 0) {
    console.log('✓ Data already seeded. Skipping...');
    console.log(`  - ${existingUserCount} users exist`);
    console.log(`  - ${existingTagCount} tags exist`);
    console.log(`  - ${existingThreadCount} threads exist`);
    return;
  }

  const users = [];
  let userCounter = 1;

  const studentNames = ['Budi Santoso', 'Siti Aminah', 'Andi Wijaya', 'Ayu Lestari', 'Agus Pratama', 'Rina Wati', 'Joko Susanto', 'Dwi Saputra', 'Sri Wahyuni', 'Hendra Gunawan', 'Indah Permatasari', 'Kevin Ardiansyah', 'Putri Ramadhani', 'Rizky Maulana', 'Diana Fitriani', 'Muhammad Iqbal', 'Nadia Salsabila', 'Fajar Nugroho', 'Aulia Rahman', 'Bayu Setiawan'];
  const alumniNames = ['Reza Pahlevi', 'Kartika Sari', 'Irfan Hakim', 'Anisa Rahma', 'Dimas Anggara', 'Maya Kusuma', 'Surya Saputra', 'Reni Astuti', 'Eko Purnomo', 'Yulia Citra'];
  const mentorNames = ['Ahmad Fauzi', 'Bagus Prasetyo', 'Citra Kirana', 'Daniel Saputra', 'Eka Putra', 'Fauziah Rahman', 'Gilang Ramadhan', 'Hana Maharani', 'Ivan Gunawan', 'Julia Mutiara'];
  const itFields = [
    'Backend Development',
    'Frontend Development',
    'Full-Stack Web',
    'Cloud Computing',
    'DevOps & Infrastructure',
    'Data Engineering',
    'Cybersecurity',
    'Game Development',
    'Mobile App Development',
    'UI/UX Design',
    'Product Management',
    'System Architecture'
  ];
  const techCompanies = [
    'Gojek',
    'Tokopedia',
    'Traveloka',
    'Shopee',
    'Bukalapak',
    'Telkom Indonesia',
    'Bank Mandiri',
    'BCA',
    'Ruangguru',
    'Agate Studio',
    'Toge Productions',
    'AWS Indonesia',
    'Google Cloud',
    'Microsoft Indonesia',
    'eFishery',
    'Halodoc',
    'Tiket.com',
    'KoinWorks',
    'Ajaib',
    'Xendit'
  ];

  // Create 20 Students
  console.log('Creating 20 students...');
  for (let i = 0; i < 20; i++) {
    const fullName = studentNames[i];
    const userName = fullName.toLowerCase().replace(/\s+/g, '');
    const password = await bcrypt.hash(`password123`, 10);
    const user = await prisma.user.create({
      data: {
        userName,
        fullName,
        email: `${userName}@salto.local`,
        password,
        role: 'Student',
        field: itFields[i % itFields.length],
        schools: {
          create: {
            nim: `NIM${String(i).padStart(6, '0')}`,
            campusName: 'Politeknik Elektronika Negeri Surabaya',
            major: `Teknik Informatika`,
            degree: 'D4',
            intakeDate: new Date(`2022-08-01`),
          },
        },
      },
      include: { schools: true },
    });
    users.push(user);
    userCounter++;
  }

  // Create 10 Alumni
  console.log('Creating 10 alumni...');
  for (let i = 0; i < 10; i++) {
    const fullName = alumniNames[i];
    const userName = fullName.toLowerCase().replace(/\s+/g, '');
    const password = await bcrypt.hash(`password${userCounter}`, 10);
    const intakeYear = 2020 - i;
    const user = await prisma.user.create({
      data: {
        userName,
        fullName,
        email: `${userName}@salto.local`,
        password,
        role: 'Alumni',
        field: itFields[(i + 3) % itFields.length],
        schools: {
          create: {
            nim: `NIM${String(10000 + i).padStart(6, '0')}`,
            campusName: 'Politeknik Elektronika Negeri Surabaya',
            major: `Teknik Informatika`,
            degree: 'D4',
            intakeDate: new Date(`${intakeYear}-08-01`),
            graduateDate: intakeYear + 4,
          },
        },
        works: {
          create: {
            workPlace: techCompanies[i % techCompanies.length],
            isMentor: false,
            isPhd: false,
            fromYear: intakeYear + 4,
            toYear: new Date().getFullYear(),
          },
        },
      },
      include: { schools: true, works: true },
    });
    users.push(user);
    userCounter++;
  }

  // Create 10 Mentor Alumni
  console.log('Creating 10 mentor alumni...');
  for (let i = 0; i < 10; i++) {
    const fullName = mentorNames[i];
    const userName = fullName.toLowerCase().replace(/\s+/g, '');
    const password = await bcrypt.hash(`password${userCounter}`, 10);
    const intakeYear = 2018 - i;
    const user = await prisma.user.create({
      data: {
        userName,
        fullName,
        email: `${userName}@salto.local`,
        password,
        role: 'AlumniMentor',
        field: itFields[(i + 6) % itFields.length],
        schools: {
          create: {
            nim: `NIM${String(20000 + i).padStart(6, '0')}`,
            campusName: 'Politeknik Elektronika Negeri Surabaya',
            major: `Teknik Informatika`,
            degree: 'S1',
            intakeDate: new Date(`${intakeYear}-08-01`),
            graduateDate: intakeYear + 4,
          },
        },
        works: {
          create: {
            workPlace: techCompanies[(i + 10) % techCompanies.length],
            isMentor: true,
            isPhd: false,
            fromYear: intakeYear + 4,
            toYear: null,
          },
        },
      },
      include: { schools: true, works: true },
    });
    users.push(user);
    userCounter++;
  }

  console.log(`✓ Created ${users.length} users`);

  // Create Follows
  console.log('Creating follow relationships...');
  let followCount = 0;
  for (let i = 0; i < users.length; i++) {
    const follower = users[i];
    // Each user follows 3-6 random other users
    const numFollows = Math.floor(Math.random() * 4) + 3;
    
    // Pick unique users to follow, excluding themselves
    const potentialFollows = users.filter((u) => u.id !== follower.id);
    const shuffled = potentialFollows.sort(() => 0.5 - Math.random());
    const selectedFollows = shuffled.slice(0, numFollows);

    for (const followedUser of selectedFollows) {
      await prisma.follows.create({
        data: {
          followerId: follower.id,
          followingId: followedUser.id,
        },
      });
      followCount++;
    }
  }
  console.log(`✓ Created ${followCount} follow relationships`);

  // Create Tags
  console.log('Creating tags...');
  const tagNames = [
    'career-growth', 'frontend', 'tutorial', 'docker', 'backend', 'portfolio', 
    'career-advice', 'tech-stack', 'enterprise', 'startup', 'web-development',
    'devops', 'infrastructure', 'resume', 'self-hosting', 'ci-cd',
    'cybersecurity', 'ctf', 'learning-path', 'industry-standards',
    'internship', 'negotiation', 'soft-skills', 'game-development', 'godot',
    'interview', 'cloud-computing', 'system-design', 'tips',
    'data-engineering', 'database', 'architecture', 'linux', 'productivity',
    'discussion', 'os', 'project-management', 'agile', 'collaboration',
    'full-stack', 'networking', 'community', 'technical-writing', 'data-warehouse'
  ];
  
  const tags = [];
  for (const tagName of tagNames) {
    const tag = await prisma.tag.create({
      data: { name: tagName },
    });
    tags.push(tag);
  }
  console.log(`✓ Created ${tags.length} tags`);

  function getRandomDateInPastDays(days) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * days));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return date;
  }

  console.log('Creating 20 structured threads and interactions...');
  const topicData = [
    {
      title: "Tech Stack Enterprise vs Startup: Fresh grad mending fokus ke mana?",
      tags: ["career-advice", "tech-stack", "enterprise", "startup", "web-development"],
      content: "Halo semuanya! Aku mahasiswa tingkat akhir yang lagi siap-siap nyari magang dan kerja full-time. Selama di kampus dan ikut beberapa *bootcamp*, seringnya diajarin MERN stack (Mongo, Express, React, Node) karena katanya banyak dicari startup. \n\nTapi belakangan ini denger-denger kalau mau masuk perusahaan *corporate/enterprise* atau BUMN, mereka lebih pake *tech stack* yang berat kayak Java (Spring Boot) atau .NET. Kira-kira buat *fresh grad* mending fokus matengin MERN biar cepet dapet kerja di startup, atau mulai belajar *stack enterprise* dari sekarang ya? Minta pencerahannya dong Kakak-kakak Alumni 🙏",
      bestAnswer: "Kalau targetmu perusahaan *enterprise* yang stabil, sangat disarankan belajar *stack* seperti .NET 8, Spring Boot (Java), dan Vue atau Angular untuk *frontend*. \n\nDi kantorku sekarang, hampir semua *internal tools* pakai Vue 3 dan .NET 8 karena arsitekturnya lebih ketat dan aman untuk dikerjakan tim besar berpuluh-puluh orang. Beda dengan ekosistem JavaScript murni yang kadang terlalu bebas dan rawan *spaghetti code* kalau *engineer*-nya belum *senior*. Belajar konsep OOP (*Object-Oriented Programming*) yang kuat dari C# atau Java bakal bikin fondasi kamu jauh lebih kokoh buat karir jangka panjang.",
      studentRepliesToBest: [
        "Wah makasih banyak *insight*-nya Kak! Tapi jujur agak takut belajar .NET karena keliatannya susah banget buat pemula dan setup Visual Studio-nya berat. Apakah ada saran *roadmap* belajarnya?",
        "Jangan takut, justru dokumentasi Microsoft (C# dan .NET) itu salah satu yang paling rapi di dunia. Mulai aja dari bikin REST API sederhana pakai ASP.NET Core Web API, lalu coba konekin ke database SQL Server pakai Entity Framework Core. Gak usah langsung bikin *microservices*, pahamin konsep MVC dan *Dependency Injection* dulu aja.",
        "Izin nyimak Kak. Aku juga ngerasa ekosistem JS/MERN cepet banget berubah trend-nya tiap tahun, capek belajarnya 😅. Bakal coba nyicil belajar .NET deh mumpung masih semester 6."
      ],
      altAnswers: [
        "Sebenernya dua-duanya punya plus minus. Di startup (pakai MERN), kamu dituntut untuk *deliver* fitur secepat mungkin untuk ngejar target pasar. Kalau di *enterprise* (pakai Java/.NET), *stability and security* adalah raja. \n\nSaran saya sebagai mentor: **jangan terlalu fanatik sama bahasa pemrogramannya**. Kuasai aja satu bahasa sampai benar-benar paham konsep *System Design*, *Design Pattern*, dan struktur *Database Relasional* (SQL). Kalau fondasi logikanya udah dapet, pindah bahasa dari JavaScript ke C# itu cuma masalah adaptasi sintaks 1-2 minggu aja kok. Perusahaan bagus lebih menghargai *engineer* yang paham \"kenapa\" kode itu ditulis, bukan cuma bisa nulisnya.",
        "Setuju sama komen-komen Kakak Alumni di atas. Nambahin dikit ya, coba cek lowongan kerja di LinkedIn atau Kalibrr khusus untuk daerah kamu tinggal. Kalau di kotamu banyak kantor pusat perbankan, BUMN, atau manufaktur besar, udah pasti Java/.NET yang menang telak. Tapi kalau kamu targetin kerja *remote* di *tech agency* atau *startup* daerah Jakarta/Bali, React/Node JS masih rajanya. Sesuaikan sama target lokasimu aja!"
      ],
      isTutorial: false
    },
    {
      title: "Cara strukturisasi logika game 2D di Godot: Animasi item jatuh ke kuali?",
      tags: ["godot", "game-development", "tutorial"],
      content: "Halo Kakak-kakak! Aku lagi bikin *game* 2D pakai Godot Engine. Sekarang lagi mentok di mekanik *drag/click and drop*. \n\nSkenarionya begini: ada beberapa item di sebuah rak. Kalau *player* ngeklik salah satu item di rak itu, aku pengen itemnya punya animasi terlempar jatuh (*dropping animation*) dari tengah rak masuk ke dalam sebuah kuali (cauldron). \n\nKira-kira arsitektur *node*-nya gimana ya biar rapi? Dan pakai fungsi apa biar animasinya kelihatan mulus jatuhnya?",
      bestAnswer: "Untuk animasi yang terprogram (programmatic animation) seperti ini, kamu jangan pakai *AnimationPlayer*, tapi gunakan **`Tween`** (atau fungsi `create_tween()` kalau kamu pakai Godot 4).\n\nLogikanya, kamu tinggal mengambil posisi awal item di rak, lalu menyuruh *engine* memindahkan koordinatnya ke posisi kuali secara bertahap. Berikut contoh *script* sederhana yang bisa ditaruh di dalam *script* item kamu saat diklik:\n\n```gdscript\nfunc _on_item_clicked():\n    # Ambil referensi node kuali (sesuaikan dengan path di scene kamu)\n    var cauldron = get_node(\"/root/MainScene/Cauldron\")\n    \n    # Buat tween baru\n    var tween = create_tween()\n    \n    # Animasikan pergerakan dari posisi sekarang ke posisi kuali selama 0.6 detik\n    tween.tween_property(self, \"global_position\", cauldron.global_position, 0.6) \\n         .set_trans(Tween.TRANS_QUAD) \\n         .set_ease(Tween.EASE_IN)\n```\nDengan memakai `TRANS_QUAD` dan `EASE_IN`, gerakannya akan dimulai perlahan lalu meluncur cepat di akhir, mensimulasikan efek gravitasi jatuh.",
      studentRepliesToBest: [
        "Wah, baru tau ada fitur create_tween() Kak! Dulu biasanya aku manual pakai fungsi _process(delta) dan ngitung koordinat sendiri pakai matematika dasar. Kalau gerakannya pengen dibikin melengkung (seperti dilempar/parabola) bukan garis lurus, bisa nggak ya?",
        "Sangat bisa! Triknya adalah memecah tween sumbu X dan Y. Biarkan sumbu X bergerak secara linear (lurus), tapi berikan tween terpisah untuk sumbu Y. Buat sumbu Y naik sedikit (ease-out) lalu turun tajam (ease-in). Kalau mau lebih presisi, kamu juga bisa merancang kurva jalurnya menggunakan node Path2D dan menyuruh itemnya mengikuti jalur itu pakai PathFollow2D.",
        "Oh dipecah ya X sama Y-nya! Logis banget, jadi keliatan kayak dilempar beneran nanti. Siap Kak, aku bakal langsung coba implementasiin kodenya ke project-ku. Makasih banyak pencerahannya!"
      ],
      altAnswers: [
        "Sedikit tambahan untuk arsitektur Node-nya. Kesalahan pemula yang paling sering terjadi adalah menjadikan Item tersebut sebagai Child Node dari si Rak. Kalau item itu kamu pindahkan posisinya ke kuali, koordinat lokalnya akan jadi berantakan. Saat item diklik dan mulai animasi jatuh, biasakan untuk melakukan Reparenting. Pindahkan kepemilikan item itu dari RackNode menjadi child langsung dari MainScene (atau node utama yang menampung environment). Gunakan koordinat global_position agar pergerakannya konsisten dan tidak terpengaruh oleh posisi rak.",
        "Jangan lupa untuk mengoptimalkan performa menggunakan sistem Signals. Jangan membuat kuali (cauldron) terus-terusan mengecek (polling via _process) apakah ada item yang berhasil masuk atau tidak. Alih-alih begitu, cukup tambahkan satu baris signal di akhir tween kamu. Ketika animasi tween selesai berjalan, pancarkan signal (misal: item_dropped) dari item tersebut. Kuali hanya perlu connect signal tersebut untuk kemudian memicu efek cipratan air atau menambahkan skor. Ini akan membuat game 2D kamu tetap ringan walau ada ratusan item di layar."
      ],
      isTutorial: false
    },
    {
      title: "Pilih React atau Vue kalau target kerjanya di perusahaan Enterprise (Corporate)?",
      tags: ["frontend", "web-development", "enterprise", "tech-stack"],
      content: "Halo Kakak-kakak Alumni! Saat ini aku lagi fokus mendalami *frontend development*. Targetku setelah lulus pengen masuk ke perusahaan *corporate* besar, BUMN, atau *enterprise*. \n\nAku lagi bingung mending perdalam React (karena katanya komunitasnya paling besar dan lowongannya banyak), atau Vue (karena denger-denger lebih disukai sama tim *corporate* buat disandingkan dengan Java/.NET)? Mohon sarannya mending invest waktu belajar ke mana ya!",
      bestAnswer: "Di lingkungan *enterprise*, Vue sering banget jadi pilihan utama, terutama kalau *backend*-nya pakai .NET, Laravel, atau Java. Alasannya karena Vue (khususnya dengan *Options API* atau struktur dasar *Composition API*) punya arsitektur yang lebih *opinionated* atau baku.\n\nDi perusahaan besar, tim *developer* sering gonta-ganti. Struktur Vue yang baku bikin kode lebih seragam dan gampang di-*maintain* oleh *developer* baru. React itu sifatnya lebih bebas, yang kadang malah bikin *engineer* nulis kode dengan *style* yang beda-beda kalau *linter* atau aturan timnya nggak ketat. Jadi untuk aplikasi *internal dashboard* yang stabil, Vue sering jadi juaranya.",
      studentRepliesToBest: [
        "Oh pantesan waktu aku magang di instansi pemerintah, mereka mayoritas pakenya Vue! Kalau gitu mending langsung belajar *framework* Nuxt juga atau fokus di Vue dasarnya aja dulu Kak?",
        "Fokus kuasai Vue dasarnya dulu aja, terutama *Composition API* dan *state management* pakai Pinia. Nuxt bisa nyusul nanti kalau kamu udah bener-bener paham konsep *lifecycle* dan reaktivitas di Vue."
      ],
      altAnswers: [
        "Walaupun Vue sangat populer di *corporate* tertentu, kamu nggak bisa nutup mata kalau React tetap punya *market share* paling masif, bahkan di skala *enterprise*. Banyak bank digital besar dan perusahaan telko sekarang bikin ekosistem *micro-frontend* pakai React. \n\nEkosistem *library* React itu super lengkap, mulai dari *table grid* sampai *charting* tingkat lanjut. Jadi kalau kamu mau jaring peluang kerja yang paling luas dan aman, React tetap pilihan yang sangat solid.",
        "Sedikit tambahan dari perspektif manajerial: perusahaan *corporate* biasanya nggak memilih *framework* berdasarkan tren terbaru, tapi berdasarkan apa yang sudah dikuasai oleh tim *existing* mereka atau *tech stack* yang dipakai oleh vendor IT sebelumnya. \n\nDaripada pusing milih, pilih satu yang paling nyaman buat kamu pelajari, lalu pahami konsep *Component-Based Architecture* secara mendalam. Kalau fondasi JavaScript kamu kuat dan kamu udah jago React, disuruh *onboarding* pindah ke Vue pas hari pertama kerja juga paling cuma butuh waktu adaptasi seminggu. *Tools* bisa ganti, tapi fundamental itu permanen."
      ],
      isTutorial: false
    },
    {
      title: "Apakah pengalaman self-hosting server sendiri dinilai bagus di CV?",
      tags: ["devops", "infrastructure", "resume", "self-hosting", "ci-cd"],
      content: "Halo Kakak-kakak Alumni! Belakangan ini aku lagi suka ngoprek *self-hosting*. Aku pakai laptop bekas (Lenovo Thinkpad) yang di-install Linux server buat jalanin Gitea, database PostgreSQL, sampai SonarQube pakai Docker. \n\nPertanyaannya, apakah *project* \"Home Lab\" kayak gini dinilai bagus kalau dimasukin ke CV buat ngelamar posisi Backend Developer atau Junior DevOps? Atau malah dianggap main-main doang sama HRD/Tech Lead karena cuma jalan di laptop bekas dan bukan di *cloud* beneran (kayak AWS/GCP)?",
      bestAnswer: "Sangat dinilai bagus! Malah menurutku, ini nilai plus yang bikin CV kamu langsung *stand out* dibanding *fresh graduate* lain. \n\n*Tech lead* nggak peduli kamu *hosting* di AWS atau di laptop bekas. Yang mereka lihat adalah inisiatif dan pemahaman kamu soal Linux, *networking*, *port binding*, dan *containerization* (Docker). Banyak *developer* junior yang jago *coding*, tapi kebingungan waktu disuruh *deploy* aplikasinya sendiri. Pengalaman *self-hosting* ini bukti nyata kalau kamu ngerti *lifecycle* aplikasi dari hulu ke hilir.",
      studentRepliesToBest: [
        "Wah, lega dengernya! Tapi bingung cara nulis di CV-nya Kak. Masa ditulis \"Mainan server pakai laptop bekas\"? 😂 Ada saran bahasanya nggak biar kelihatan profesional?",
        "Jangan tulis gitu haha. Tulis di bagian *Projects* atau *Experience* dengan judul: **\"Home Lab Infrastructure & CI/CD Management\"**. Terus di- *bullet points*-nya tulis: *\"Architected and deployed a self-hosted development environment using Docker, featuring Gitea for version control and SonarQube for continuous code quality inspection.\"*",
        "Keren banget bahasanya Kak! Siap, langsung aku catat buat *update* resume nanti. Makasih banyak pencerahannya!"
      ],
      altAnswers: [
        "Sedikit nambahin konteks: ini akan sangat *powerful* kalau kamu ngelamar role Backend, SysAdmin, atau DevOps. Tapi kalau kamu ngelamar jadi Frontend Developer, ini jatuhnya cuma \"*nice to have*\". Walaupun begitu, punya *home lab* tetep nunjukin kalau kamu punya *passion* yang tinggi di dunia IT, dan itu adalah *soft skill* yang sangat disukai sama *engineering manager*.",
        "Jangan lupa, pembuktiannya harus jelas. Bikin satu *repository* publik di GitHub kamu, kasih nama misalnya \`my-homelab-config\`. Terus *upload* semua file \`docker-compose.yml\`, *script bash*, atau konfigurasi Nginx/Reverse Proxy yang kamu pakai buat nge- *serve* aplikasi-aplikasi itu. \\n\\nWaktu wawancara teknis, kamu bisa buka repo itu dan jelasin arsitektur jaringan lokalmu. *Interviewer* teknis pasti bakal seneng banget diskusiin hal ginian."
      ],
      isTutorial: false
    },
    {
      title: "Tutorial setup CI/CD pipeline pakai GitHub Actions dan Docker untuk pemula",
      tags: ["ci-cd", "devops", "tutorial", "docker"],
      content: "Halo Kakak-kakak Alumni! Di kampus lagi ada tugas besar dan dosen minta aplikasi kelompok kami di-*deploy* menggunakan CI/CD *pipeline*. \n\nAku udah berhasil nge-*dockerize* aplikasinya (bisa jalan mulus secara lokal pakai Docker Compose), tapi jujur masih *blank* gimana cara otomatisasi *build* & *deploy*-nya pakai GitHub Actions setiap kali ada kode yang di-*push* ke *branch* `main`. Apakah ada yang punya referensi atau *mini tutorial step-by-step* cara bikin *script* `.yml`-nya buat pemula? Makasih sebelumnya! 🙏",
      bestAnswer: "Konsep dasarnya simpel: GitHub Actions itu ibarat komputer virtual yang dikasih tugas buat ngejalanin perintah terminal setiap kali ada *trigger* (seperti `push`). \n\nBikin folder `.github/workflows` di dalam repo kamu, lalu buat file `main.yml`. Ini *template* standar yang biasa dipakai di industri untuk nge-*build* Docker *image* dan nge-*push* ke Docker Hub:\n\n```yaml\nname: CI/CD Pipeline\non:\n  push:\n    branches: [ \"main\" ]\njobs:\n  build-and-push:\n    runs-on: ubuntu-latest\n    steps:\n    - name: Check out repo\n      uses: actions/checkout@v3\n      \n    - name: Login to Docker Hub\n      uses: docker/login-action@v2\n      with:\n        username: ${{ secrets.DOCKER_USERNAME }}\n        password: ${{ secrets.DOCKER_PASSWORD }}\n        \n    - name: Build and push\n      uses: docker/build-push-action@v4\n      with:\n        context: .\n        push: true\n        tags: ${{ secrets.DOCKER_USERNAME }}/my-app:latest\n```\nJangan lupa masukin *username* dan *password* Docker Hub kamu di menu **Settings > Secrets and variables > Actions** di repositori GitHub kamu biar aman.",
      studentRepliesToBest: [
        "Wah *template*-nya rapi banget Kak, gampang dipahamin! Tapi pas aku coba *run actions*-nya, gagal di step *build* nih. Ada tulisan *error* `permission denied while trying to connect to the Docker daemon socket`. Itu kenapa ya Kak?",
        "Oh, *error* itu biasanya muncul kalau kamu pakai *self-hosted runner* (server sendiri) dan *user*-nya nggak punya akses *root* ke *service* Docker. Coba jalankan perintah ini di server tempat *runner*-mu berada: `sudo usermod -aG docker $USER`. Setelah itu *restart* servernya. Kalau kamu pakai `runs-on: ubuntu-latest` bawaan GitHub, *error* ini harusnya nggak muncul.",
        "Ah iyak bener tebakan Kakak! Aku kebetulan pakenya *self-hosted runner* nembeng di server lab kampus hehe. Udah aku masukin ke *group docker* sesuai perintah Kakak, dan sekarang *pipeline*-nya udah ijo (sukses). Makasih banyak Kak!"
      ],
      altAnswers: [
        "Sekadar nambahin *best practice* dari dunia kerja. Kalau *pipeline*-nya udah berhasil jalan, coba pelajari konsep **Multi-stage builds** di dalam `Dockerfile` kamu.\n\nTujuannya biar *image* yang dihasilkan jauh lebih kecil. Pas *build* di GitHub Actions, proses instalasi *node_modules* atau kompilasi kode itu lumayan makan waktu dan memori. Dengan *multi-stage*, hasil akhirnya nanti cuma berisi kode yang udah di-*compile* tanpa *tools* sisa bawaannya. Ini bikin proses CD (*Continuous Deployment*) ke server tujuan jauh lebih cepet.",
        "Jangan lupa sisipkan *step* untuk **Unit Testing** dan **Linting** (misalnya kalau pakai SonarQube) tepat SEBELUM *step* *build* Docker di file `.yml` tersebut.\n\nDi *corporate*, kita nggak mau nge-*build* dan nge-*deploy* kode yang ternyata nge-*break* sistem atau ada *bug* kritikal. Dengan naruh *testing* di awal, kalau *test*-nya gagal, CI/CD bakal langsung membatalkan proses *build* Docker-nya secara otomatis."
      ],
      isTutorial: false
    },
    {
      title: "Seberapa relevan ikut lomba CTF buat dapet kerjaan di bidang Cybersecurity?",
      tags: ["cybersecurity", "ctf", "learning-path", "career-advice"],
      content: "Halo Kakak-kakak Alumni! Belakangan ini aku lagi aktif banget ikut lomba *Capture The Flag* (CTF) bareng tim kampus dan lumayan sering pegang kategori *Cryptography* (seperti mecahin algoritma enkripsi RSA, AES, sampai *Playfair ciphers*). \n\nTapi aku mulai kepikiran, apakah *skill* mecahin soal-soal CTF kayak gini beneran *applicable* dan relevan buat nyari kerjaan asli di industri *Cybersecurity* nanti? Atau realita di dunia kerjanya malah beda banget sama *environment* lomba? Mohon pencerahannya Kak!",
      bestAnswer: "CTF itu tempat latihan yang luar biasa bagus untuk mengasah insting dan *problem-solving*. TAPI, di dunia kerja profesional, berhasil nemuin celah keamanan (atau dapet *flag*) itu baru 20% dari total pekerjaan kamu.\n\n80% sisanya adalah komunikasi. Kamu harus bisa nulis *Vulnerability Assessment Report* yang profesional untuk klien, ngasih rekomendasi mitigasi/perbaikan, dan sering *meeting* bareng tim *developer* perusahaan untuk ngejelasin *impact* dari celah tersebut dengan bahasa yang mudah mereka pahami. Lomba CTF jarang banget ngajarin *skill reporting* dan *compliance* (seperti standar ISO 27001), padahal itu yang paling dicari perusahaan.",
      studentRepliesToBest: [
        "Berarti kalau mau bikin portofolio di CV, nggak cukup ya Kak kalau cuma nulis \"Juara 1 CTF\"? Harus digabung sama *skill reporting* gitu? Gimana cara ngebuktiinnya ke HRD?",
        "Betul. Cara paling ampuh ngebuktiinnya adalah dengan rajin nulis *write-up* (cara kamu nge-*solve* soal CTF) di blog medium pribadi atau GitHub. Tapi, format *write-up*-nya jangan cuma kasih *script exploit*-nya doang. Bikin format *report* profesional yang isinya ada: *Executive Summary*, *Steps to Reproduce*, dan *Remediation/Patching*. Kalau HRD atau *Tech Lead* baca itu, mereka bakal langsung yakin sama *skill* kamu.",
        "Wah, masuk akal banget. Pantesan waktu ikut *mock interview* kemaren aku malah ditanyain cara *patching* celahnya, bukan cuma cara nge-*hack*-nya. Makasih banyak *insight*-nya Kak!"
      ],
      altAnswers: [
        "Nambahin spesifik untuk kategori *Cryptography* yang kamu pegang: di industri umum, keahlian ini sangat *niche* (spesifik) dan jarang dipakai langsung kecuali kamu kerja di divisi R&D yang bikin algoritma enkripsi baru.\n\nTapi jangan salah, *mindset* analitis dari mecahin *cipher* itu sangat berharga kalau kamu ngelamar di posisi *Incident Response* atau *Malware Analysis*. Di peran tersebut, *skill* kriptografi kamu bakal sering kepakai buat nge-*reverse engineer* kode *malware* atau *ransomware* yang udah diobfuskasi (disandikan) sama peretasnya. Jadi *skill* kamu sama sekali nggak sia-sia.",
        "Tambahan sedikit dari sisi *demand* pasar Indonesia: lowongan pekerjaan untuk tim *Blue Team* (bertahan) seperti SOC *Analyst*, *Security Engineer*, atau IT *Auditor* itu jauh lebih banyak dan gampang dicari dibanding posisi *Red Team* (menyerang/*Penetration Tester*).\n\nLomba CTF biasanya sangat berat di sisi *Red Team*. Jadi saran saya, seimbangkan ilmu CTF kamu dengan belajar sisi bertahannya. Mulai belajar baca *log* server, nyoba pakai *tools* SIEM (kayak Splunk atau Wazuh), dan belajar konfigurasi *firewall* jaringan."
      ],
      isTutorial: false
    },
    {
      title: "Langkah awal belajar Web Exploitation untuk kompetisi CTF",
      tags: ["ctf", "cybersecurity", "web-development", "tutorial"],
      content: "Halo Kakak-kakak! Aku lagi mentok ngerjain *challenge Web Exploitation* di sebuah kompetisi CTF. Kasusnya tentang *Server-Side Request Forgery* (SSRF). \n\nAku udah nemu parameter URL yang rentan, tapi bingung *payload*-nya harus diarahkan ke mana buat masuk ke direktori internal spesifik biar dapet *flag*-nya. Apakah ada *hint* atau metodologi yang pas untuk melakukan eksplorasi/eksplotasi lanjutan kalau kita udah nemu celah SSRF kayak gini?",
      bestAnswer: "Kalau udah nemu parameter SSRF-nya, langkah paling umum adalah melakukan *internal port scanning*. Biasanya, *flag* disembunyikan di *service* internal (seperti *database* atau panel admin) yang cuma bisa diakses dari *localhost* (127.0.0.1).\n\nKamu bisa pakai Burp Suite buat otomatisasi proses ini. Tangkap *request*-nya, kirim ke tab Burp Intruder, lalu ganti parameter URL-nya jadi http://127.0.0.1:§port§/. Set *payload*-nya ke mode *Numbers* dari port 1 sampai 65535. Jalankan Intruder dan perhatikan kolom *response length*. Kalau ada *length* yang ukurannya beda jauh dari yang lain, besar kemungkinan itu *port* internal yang terbuka dan di situlah direktori tempat *flag* berada.",
      studentRepliesToBest: [
        "Wah, baru kepikiran pakai mode Intruder buat *port scanning*! Tapi Kak, kalau servernya punya filter yang nge-blokir IP 127.0.0.1, ada trik *bypass*-nya nggak?",
        "Banyak triknya. Kamu bisa pakai representasi desimal dari *localhost* seperti http://2130706433/, atau pakai format IPv6 seperti http://[::]:80/. Bisa juga pakai layanan DNS resolution publik kayak localtest.me yang otomatis akan me-resolve dan mengarahkan trafiknya balik ke IP 127.0.0.1.",
        "Keren banget trik DNS-nya! Tadi aku langsung coba injeksi pakai localtest.me dan *firewall*-nya langsung tembus. *Flag*-nya ternyata ngumpet di *port* 8080. Makasih banyak Kak hint-nya!"
      ],
      altAnswers: [
        "Selain nyari *port* internal, pastikan kamu juga selalu mencoba mengakses *Cloud Metadata Endpoint*. Kalau challenge CTF-nya di-host di layanan cloud seperti AWS, GCP, atau Azure, celah SSRF ini jadi sangat mematikan.\n\nCoba arahkan payload SSRF kamu ke alamat http://169.254.169.254/latest/meta-data/. Kalau berhasil dapat response, kamu bisa menarik kredensial IAM dari server tersebut. Di beberapa CTF tingkat lanjut, flag-nya justru ditaruh di dalam konfigurasi cloud environment ini, bukan di dalam folder aplikasi web lokal.",
        "Jangan lupa untuk memverifikasi apakah celah tersebut adalah *Blind SSRF*. Kadang aplikasinya memang rentan, tapi tidak memunculkan response balikan apa-apa ke layar komputermu, jadi kelihatannya seperti gagal.\n\nUntuk ngetesnya, coba arahkan payload ke URL yang kamu kontrol sendiri (misalnya pakai layanan gratis seperti webhook.site atau Burp Collaborator). Kalau di log webhook kamu muncul request HTTP yang asalnya dari IP server CTF tersebut, berarti SSRF-nya valid. Dari situ, kamu bisa mulai bikin script Python khusus untuk mengekstrak datanya pelan-pelan secara out-of-band.",
      ],
      isTutorial: false
    },
    {
      title: "Realita transisi dari Anak Magang (Intern) jadi Full-Time/Vendor: Apa aja yang berubah?",
      tags: ["career-advice", "internship", "negotiation", "soft-skills"],
      content: "Halo Kakak-kakak Alumni! Waktu magang kemaren, aku kebetulan berhasil bikin fondasi (*base code*) untuk aplikasi *internal contract management* di perusahaanku. Sekarang masa magangku udah habis, tapi perusahaan malah nawarin aku buat ngelanjutin *project* itu sampai selesai dengan status sebagai *vendor* kontrak. \n\nJujur aku masih agak bingung apa aja yang harus disiapin, karena posisinya sekarang udah bukan \"anak magang yang dibimbing\" lagi, tapi profesional yang dituntut untuk *deliver* produk. Apa aja sih *mindset* atau cara kerja yang harus dirubah dari masa magang ke masa *vendor/full-time* ini?",
      bestAnswer: "Perubahan terbesarnya ada di perlindungan waktu kerjamu dari *scope creep* (fitur yang tiba-tiba nambah di luar rencana). Waktu magang, wajar kalau kamu disuruh ngerjain apa aja buat bahan belajar. Tapi sebagai *vendor*, waktu adalah uang. Kalau aplikasinya nggak kelar-kelar karena *request* fitur nambah terus, kamu yang rugi.\n\nKamu wajib menyusun rancangan *roadmap* berbasis *sprint* yang sangat spesifik sebelum tanda tangan kontrak. Pisahkan pekerjaannya dengan jelas. Misalnya, bikin *timeline*: **Sprint 1 — Foundation & Repository** (fokus di arsitektur dan database), lalu masuk ke **Sprint 2 — Contract Request Flow** (fokus ke fitur utama bisnisnya). Jangan pernah mau mengerjakan fitur tambahan di Sprint 2 kalau tugas di Sprint 1 belum diuji dan di-*sign off* (disetujui selesai) oleh atasanmu.",
      studentRepliesToBest: [
        "Wah masuk akal banget Kak! Kemaren pas magang emang sering banget tiba-tiba *user* minta ganti desain tombol atau nambah form di tengah jalan yang bikin kodinganku berantakan. Kalau pake *sprint roadmap* gini jadi ada landasan buat nolak ya?",
        "Betul! Tapi bahasanya bukan 'menolak'. Sebagai profesional, kamu bisa jawab: 'Bisa ditambahkan Pak/Bu, tapi fitur ini di luar kesepakatan awal kita, jadi akan saya masukkan ke rencana Sprint 3 dengan tambahan biaya ya.' Itu membedakan mental *vendor* sejati dengan mental anak magang.",
        "Keren banget kalimat negosiasinya Kak! Siap, nanti aku bakal susun dokumen pembagian *sprint* dan *flow*-nya serapi mungkin buat di-*review* sama perusahaan. Makasih banyak *insight*-nya!"
      ],
      altAnswers: [
        "Tambahan dari sisi harga (pricing). Karena kamu udah nggak berstatus intern dan beralih ke vendor, jangan pernah pasang tarif berdasarkan hitungan gaji UMR bulanan biasa.\n\nSebagai vendor, kamu nggak dapet asuransi kesehatan, BPJS, cuti berbayar, atau fasilitas laptop kantor. Hitung tarifmu berdasarkan nilai (value) aplikasi contract management itu ke perusahaan. Kasih harga paket project (lump sum) yang sepadan dengan beban tech stack kelas enterprise yang kamu pakai untuk membangun sistem tersebut.",
        "Jangan lupakan biaya Maintenance! Kesalahan paling umum developer pemula saat jadi vendor adalah bikin aplikasi, serah terima, dapet bayaran, lalu ditinggal.\n\nPastikan di dalam kontrak kerja tersebut kamu menambahkan klausul retensi atau biaya pemeliharaan bulanan (biasanya 10-20% dari total nilai proyek) untuk berjaga-jaga kalau ada bug fixing atau butuh server maintenance setelah aplikasinya benar-benar dipakai secara live oleh user."
      ],
      isTutorial: false
    },
    {
      title: "Gimana cara negosiasi gaji atau nilai kontrak buat posisi Junior Backend pertama kali?",
      tags: ["negotiation", "career-advice", "backend", "soft-skills"],
      content: "Halo Kakak-kakak! Nyambung dari pembahasanku sebelumnya soal transisi jadi *vendor* buat nerusin *project backend internal* perusahaan. Sekarang aku lagi bener-bener bingung soal *pricing*-nya. \n\nKarena ini pengalaman pertamaku pasang tarif profesional (bukan uang saku magang), gimana ya cara negosiasinya biar nggak di-*lowball* (ditawar murah banget)? Apakah sebaiknya aku hitung tarif per jam kerjaku, per bulan, atau langsung tembak borongan satu *project* penuh? Jujur lagi kena *imposter syndrome* nih, takut dibilang kemahalan karena aku itungannya masih *fresh graduate*. 😂 Mohon sarannya Kak!",
      bestAnswer: "Kesalahan terbesar *fresh graduate* adalah memasang tarif berdasarkan 'waktu yang dihabiskan' (dibayar per jam atau per bulan). Ingat hukum ini: **Semakin kamu jago, kamu akan mengerjakan tugas semakin cepat.** Kalau kamu dibayar per jam, pendapatanmu malah turun padahal *skill*-mu naik.\n\nGunakan metode **Value-Based Pricing**. Ajukan harga borongan (*lump sum*) berdasarkan nilai aplikasi itu untuk perusahaan. Jangan hitung murah karena kamu *fresh grad*, tapi hitunglah berdasarkan *tech stack* kelas *enterprise* yang kamu pakai (misalnya database SQL Server dan keamanan API-nya).\n\nGunakan *script* ini saat nego: *\"Berdasarkan kompleksitas arsitektur backend dan target penyelesaian dalam 2 sprint, investasi untuk pengembangan sistem ini adalah Rp [X]. Angka ini sudah mencakup implementasi best-practice keamanan data sesuai standar perusahaan.\"*",
      studentRepliesToBest: [
        "Masuk akal banget Kak, *script*-nya juga kelihatan profesional banget! Tapi kalau manajernya tetep nanya, 'Kok mahal banget ya? Kan kamu baru aja lulus kuliah,' aku harus *counter* pakai alasan apa Kak biar nggak mati kutu?",
        "Jangan defensif. Bawa obrolannya ke ROI (Return on Investment). Jawab seperti ini: 'Betul Pak/Bu, saya mengerti. Tapi sistem otomatisasi kontrak ini nantinya akan menghemat waktu tim operasional hingga puluhan jam setiap bulannya dan mencegah human error. Harga ini bukan membayar status kelulusan saya, tapi menjamin sistem tersebut dibangun dengan fondasi yang solid dan tidak mudah down saat dipakai.'",
        "Wah *mindblowing*! Mengubah fokus dari 'siapa yang ngerjain' jadi 'apa manfaat aplikasinya' ya Kak. Siap, *imposter syndrome*-ku agak mendingan nih sekarang. Makasih banyak Kak!"
      ],
      altAnswers: [
        "Mau menambahkan sedikit dari sisi psikologi negosiasi. Saat kamu sudah menyebutkan angkamu di meja meeting atau di email, diamlah. Jangan buru-buru menambahkan kalimat diskon seperti, '...tapi kalau kemahalan bisa dikurangi kok Pak.' Itu langsung membunuh nilai tawarmu. Sebutkan angkanya dengan percaya diri, jelaskan *value*-nya, lalu biarkan mereka yang merespons. Sering kali, rasa canggung (awkward silence) itulah yang membuat pihak perusahaan akhirnya menyetujui anggaran tersebut.",
        "Kalau mereka benar-benar punya budget yang mentok, jangan langsung menurunkan harga begitu saja. Gunakan teknik memotong ruang lingkup (scope). Kalau mereka minta diskon 20%, katakan: 'Bisa kita sesuaikan dengan budget Bapak/Ibu, namun untuk fitur notifikasi email otomatis dan dashboard reporting akan kita keluarkan dari kontrak saat ini, dan mungkin bisa dikerjakan di kuartal berikutnya.' Dengan begitu, kamu tetap mempertahankan rate profesionalmu."
      ],
      isTutorial: false
    },
    {
      title: "Tips lolos Technical Interview untuk posisi Backend dan Cloud Computing",
      tags: ["interview", "cloud-computing", "backend", "system-design"],
      content: "Halo Kakak-kakak Alumni! Sebentar lagi aku akan ada interview teknis untuk masuk tim R&D Web Development dan Cloud Computing.\n\nIni pengalaman pertamaku untuk posisi yang lumayan berat di sisi *backend* dan infrastruktur. Kira-kira apa aja ya materi yang biasanya paling sering ditanyain sama *interviewer*? Apakah mereka bakal nyuruh *live coding* algoritma rumit (kayak di LeetCode) secara langsung, atau lebih fokus ke pertanyaan *System Design*? Mohon tipsnya Kak biar nggak *blank* pas ditanya!",
      bestAnswer: "Untuk posisi spesifik di R&D dan Cloud Computing, *interviewer* biasanya jauh lebih peduli tentang bagaimana caramu menskalakan aplikasi (*scaling*) daripada seberapa cepat kamu menghafal algoritma *sorting*.\n\nPertanyaan yang hampir pasti keluar adalah tentang arsitektur. Misalnya: *\"Aplikasi kita tiba-tiba diakses oleh 1 juta user bersamaan saat flash sale, apa yang akan kamu lakukan agar server tidak down?\"*\nDi sini kamu harus bisa menjelaskan konsep dasar *Load Balancing*, *Horizontal Scaling* (menambah jumlah server, bukan sekadar memperbesar RAM), dan pemisahan antara *database server* dengan *application server*. Jangan pusing ngoding algoritmanya dulu, kuasai konsep \"bagaimana komponen-komponen infrastruktur ini saling ngobrol\".",
      studentRepliesToBest: [
        "Wah bener banget, kemaren aku malah terlalu fokus ngapalin cara bikin *reverse linked list* 😅. Berarti kalau disuruh jelasin *Load Balancer*, aku harus bahas sampai ke level *networking* kayak Layer 4 vs Layer 7 gitu nggak Kak?",
        "Tergantung seberapa *senior* posisi yang kamu lamar. Untuk level junior atau *fresh grad*, cukup jelaskan konsep *Layer 7 (HTTP Load Balancing)* aja udah sangat bagus. Jelasin gimana *Load Balancer* (seperti Nginx atau AWS ALB) bisa nge-*routing* trafik ke server A atau B berdasarkan algoritma *round-robin*. Itu udah cukup membuktikan kalau kamu paham konsep dasar arsitektur *cloud*.",
        "Noted Kak! Wah ini ngebantu banget buat ngarahin fokus belajarku beberapa hari ke depan. Siap baca-baca lagi soal *round-robin* dan *horizontal scaling*. Makasih banyak Kak!"
      ],
      altAnswers: [
        "Selain arsitektur infrastruktur, poin kritis lainnya ada di pemilihan *Database*.\n\nKamu pasti akan ditanya studi kasus: *\"Kapan kita harus pakai SQL (Relational) dan kapan harus pakai NoSQL (Document-based seperti MongoDB)?\"*\nKunci jawabannya ada di struktur data dan relasinya. Jelaskan bahwa SQL bagus untuk data yang transaksional dan butuh integritas tinggi (seperti sistem pembayaran/keuangan), sedangkan NoSQL bagus untuk data yang strukturnya dinamis dan butuh proses *read/write* sangat cepat (seperti *log* aktivitas *user* atau keranjang belanja).",
        "Tips non-teknis yang sering dilupakan kandidat: **Berpikirlah secara lantang (Think Out Loud)**.\n\nSaat dikasih studi kasus arsitektur, jangan diam aja sambil mikir di dalam hati selama 5 menit. Coret-coret di papan tulis atau *digital whiteboard*, dan sebutkan apa yang ada di kepalamu. *\"Hmm, kalau kita simpan file gambar langsung di database, query-nya bakal lambat dan memori penuh. Sebaiknya gambarnya ditaruh di Object Storage (S3), lalu URL-nya saja yang disimpan di database.\"*\n*Interviewer* ingin melihat *thought process* (alur berpikir) kamu saat memecahkan masalah, bukan sekadar jawaban akhir yang sempurna."
      ],
      isTutorial: false
    },
    {
      title: "Scaling Data Warehouse: Teori di kampus vs Realita berantakan di Enterprise",
      tags: ["data-engineering", "database", "architecture", "enterprise"],
      content: "Halo Kakak-kakak! Di kampus aku sering banget diajarin cara bikin skema tabel yang rapi (seperti *Star Schema* atau *Snowflake Schema*) untuk sistem *Data Warehouse*. Katanya, ini adalah kerangka standar untuk mendorong pertumbuhan bisnis, dari skala *startup* sampai *enterprise*.\n\nTapi aku penasaran, apakah realita implementasi *Data Warehouse* di perusahaan besar (terutama *corporate*) itu bener-bener serapi teori di kampus? Apakah data yang masuk selalu bersih dan terstruktur sesuai desain arsitektur yang kita buat di awal?",
      bestAnswer: "Hahaha, selamat datang di dunia nyata! Lupakan skema sempurna kalau kamu baru pertama kali melihat arsitektur data di *enterprise*. Realitanya, data di perusahaan besar itu sangat berantakan. Ada yang ditarik dari *legacy system* SQL lama, ada yang dari API pihak ketiga, dan parahnya, masih banyak divisi bisnis yang masukin data pakai file Excel manual.\n\nTantangan terbesarnya justru bukan mendesain *Data Warehouse*-nya, tapi pada proses **ETL (Extract, Transform, Load)**. Di dunia kerja, kamu akan menghabiskan 80% waktumu hanya untuk membersihkan *dirty data* (data kotor/tidak standar) di fase *Transform* sebelum data tersebut akhirnya layak dimasukkan ke dalam *warehouse*.",
      studentRepliesToBest: [
        "Wah pantesan pas diajarin dosen fokusnya lebih ke desain tabel *fact* dan *dimension*-nya aja 😂. Berarti kalau mau karir di *Data Engineering*, mending aku perbanyak belajar bikin *ETL pipeline* ya Kak dibanding cuma ngerancang skema?",
        "Tepat sekali. Kuasai *tools* orkestrasi data modern seperti Apache Airflow, dbt (*data build tool*), atau minimal jago menulis *script* Python menggunakan Pandas untuk *data wrangling*. Kalau kamu bisa membuat *pipeline* ETL yang tangguh, stabil, dan otomatis mendeteksi anomali data, kamu bakal sangat dicari oleh perusahaan.",
        "Mantap! Baru denger soal Apache Airflow dan dbt, langsung aku masukin ke *to-do list* belajarku buat *project* akhir. Makasih banyak Kak *reality check*-nya!"
      ],
      altAnswers: [
        "Sedikit tambahan, di kampus biasanya kalian disodorkan *dataset* CSV dari Kaggle yang sudah rapi dan bersih. Di *enterprise*, kamu akan berhadapan dengan masalah *real-world* seperti: format penulisan tanggal yang berbeda-beda tiap cabang perusahaan, nama kota yang salah ketik (*typo*), atau data pelanggan yang duplikat.\n\nItulah kenapa ilmu *Data Cleansing* dan penerapan kebijakan *Data Governance* itu bayarannya sangat mahal di industri. Skema sebaik apa pun akan hancur kalau data yang dimasukkan adalah \"sampah\" (*Garbage in, Garbage out*).",
        "Jangan kaget juga kalau di *enterprise* berskala raksasa, kamu tidak akan langsung mengelola *Data Warehouse* (seperti Google BigQuery atau Amazon Redshift) di hari pertamamu bekerja.\n\nBiasanya *fresh grad* akan disuruh berurusan dengan **Data Lake** terlebih dahulu. *Data Lake* itu ibarat tempat pembuangan besar di mana semua data mentah (*raw data*) disimpan tanpa struktur yang jelas. Dari *Data Lake* itulah, *Data Engineer* harus memancing, memfilter, dan memproses data yang relevan untuk dimasukkan ke dalam *Data Warehouse*."
      ],
      isTutorial: false
    },
    {
      title: "Best practice desain arsitektur database PostgreSQL untuk aplikasi skala besar",
      tags: ["database", "architecture", "backend", "tech-stack"],
      content: "Halo Kakak-kakak! Saat ini aku lagi merancang skema *database* PostgreSQL untuk *backend* sebuah aplikasi yang targetnya punya data yang masif.\n\nAku masih bingung soal *best practice* di skala produksi. Terutama perdebatan soal *Primary Key*: mending pakai *auto-increment Integer* biasa atau *UUID*? Terus, apakah ada tips khusus buat merancang struktur tabel biar nggak gampang lemot pas datanya udah jutaan? Aku kebetulan pakai ORM Prisma buat *query*-nya.",
      bestAnswer: "Kunci utama *database* skala besar itu bukan sekadar milih tipe ID, tapi **Indexing** dan cara *query* di level ORM.\n\nPastikan kamu menambahkan *Index* pada kolom-kolom yang sering dipakai untuk *filter* (klausa `WHERE`) atau relasi (*Foreign Key*). Selain itu, karena kamu pakai Prisma, hati-hati dengan masalah **N+1 Query Problem**. Prisma itu sangat nyaman, tapi kalau kamu nge-*fetch* data relasi di dalam *looping* tanpa menggunakan sintaks `include` di awal, aplikasimu akan membombardir PostgreSQL dengan ribuan *query* kecil secara beruntun. Itulah penyebab utama *backend* jadi lambat saat datanya mulai banyak.",
      studentRepliesToBest: [
        "Wah, aku sering banget naruh *query database* di dalam *looping array* kalau lagi nge-*process* data 😭. Contoh spesifik N+1 Query di Prisma itu gimana ya Kak biar aku bisa hindarin?",
        "Contohnya: kamu narik daftar 100 *User*, lalu di aplikasi kamu nge-*loop* 100 *user* itu, dan di tiap putaran *loop* kamu nge-*query* lagi buat nyari *Posts* milik *user* tersebut. Harusnya cukup 1 *query* (`N=1`), tapi ini jadi 101 *query* (`N+1`). Solusinya di Prisma, langsung gabung dari awal: `prisma.user.findMany({ include: { posts: true } })`.",
        "Ya ampun, sesimpel nambahin `include` ternyata bisa ngurangin ratusan *query* 🤦‍♂️. Siap Kak, makasih banyak ilmunya! Aku bakal *refactor* ulang kode *backend*-ku biar nggak kena N+1 lagi."
      ],
      altAnswers: [
        "Menjawab pertanyaanmu soal *Primary Key*: perdebatan UUID vs *Integer* itu panjang.\n\n*Auto-increment Integer* itu jauh lebih cepat untuk *indexing* dan memakan *storage* yang sangat kecil. TAPI, kekurangannya adalah ID-mu bisa ditebak. Orang bisa tahu berapa jumlah *user* atau transaksimu cuma dengan melihat URL (`/user/500` berarti *user* ke-500). Kalau butuh keamanan dan aplikasinya terdistribusi, pakai UUID. Saran terbaik saat ini: gunakan **UUIDv7**. Dia acak seperti UUID biasa, tapi punya elemen '*timestamp*' sehingga tetap berurutan secara kronologis, bikin *indexing*-nya hampir secepat *Integer*.",
        "Sedikit tambahan soal arsitektur: jangan pasrahkan semua validasi datamu ke kode *backend* (aplikasi).\n\nManfaatkan fitur **Database Constraints** milik PostgreSQL secara maksimal. Pasang aturan `UNIQUE`, `NOT NULL`, dan `CHECK constraint` langsung di level tabel. Kenapa? Karena kode *backend* itu rawan *bug* dan sering diubah-ubah. Kalau validasinya ada di level tabel, data kamu akan tetap bersih dan aman dari anomali meskipun kode aplikasinya lagi *error*."
      ],
      isTutorial: false
    },
    {
      title: "Cara ngatasin konflik IP jaringan waktu setting local server di Linux",
      tags: ["linux", "networking", "self-hosting", "infrastructure"],
      content: "Halo Kakak-kakak! Aku kebetulan pakai Arch Linux dan lagi dapet tugas buat nyoba nge-*host* layanan Gitea lokal milik perusahaan di laptopku.\n\nMasalahnya, Gitea-nya bisa dibuka lancar kalau aku akses pakai `localhost`, tapi pas aku coba akses pakai IP lokal laptop (misal `192.168.1.x`) dari HP atau laptop lain di jaringan WiFi yang sama, koneksinya malah *refused* atau *timeout*.\n\nKira-kira apa aja ya potensi masalah jaringan atau konflik IP di Linux yang bikin akses dari luar ini keblokir?",
      bestAnswer: "Masalah umum banget nih kalau lagi nyoba *self-hosting*. Coba cek 3 poin *troubleshooting* ini secara berurutan:\n\n1. **Binding Address:** Cek konfigurasi Gitea atau `docker-compose`-mu. Apakah *port*-nya di-*bind* ke `127.0.0.1:3000`? Kalau iya, itu artinya *service* tersebut mengisolasi diri dan cuma mau menerima koneksi dari internal laptop itu sendiri. Ubah *binding*-nya menjadi `0.0.0.0:3000` supaya layanannya bisa menerima koneksi dari semua *network interface*.\n2. **Firewall Rules:** Di Arch Linux biasanya menggunakan `ufw` atau `iptables`. Pastikan *port* yang dipakai Gitea (misal 3000, 80, atau 443) sudah di-*allow* dari luar. Coba cek dengan mengetik `sudo ufw status`.\n3. **Konflik IP Docker Bridge:** Kalau kamu nge-*deploy* pakai Docker, kadang subnet bawaan Docker (seperti `172.17.x.x`) bentrok dengan *routing table* jaringan lokal kantormu. Coba kirim *output* perintah `ip a` dan `ip route` di sini biar kita bisa bantu mastiin nggak ada subnet yang tabrakan.",
      studentRepliesToBest: [
        "Wah pencerahan banget Kak! Poin nomor 1 bener banget, ternyata di `docker-compose.yml` aku nulis *ports*-nya `127.0.0.1:3000:3000`. Kalau aku ubah jadi `0.0.0.0:3000:3000` aman dari sisi *security* nggak ya buat jaringan lokal?",
        "Aman kok, selama jaringan WiFi/LAN kantormu memang khusus internal dan tidak terekspos langsung ke internet publik via *router*. Kalau mau lebih presisi dan aman lagi, *binding*-nya arahkan spesifik ke IP LAN laptopmu, misal `192.168.1.10:3000:3000`.",
        "Ya ampun, langsung bisa diakses dari HP dong sekarang! Pantesan seharian ngoprek *firewall* Arch Linux nggak ngaruh apa-apa, ternyata salah di *binding* Docker-nya. Makasih banyak Kak *checklist* *troubleshooting*-nya!"
      ],
      altAnswers: [
        "Sekadar menambahkan dari sisi infrastruktur perangkat keras jaringannya: periksa juga *settingan* di *router* WiFi yang kamu pakai.\n\nBeberapa *router* kantoran, kos-kosan, atau WiFi publik punya fitur yang namanya **AP Isolation** atau **Client Isolation**. Kalau fitur ini aktif dari sananya, perangkat yang nyambung di WiFi yang sama memang dilarang keras untuk saling nge-*ping* atau berkomunikasi satu sama lain demi alasan keamanan. Kalau kamu udah ngecek *binding* dan *firewall* di OS Linux-mu tapi perangkat lain tetep nggak bisa masuk, kemungkinan besar masalahnya justru diblokir oleh *router* ini.",
        "Hati-hati kalau kamu mengaktifkan `ufw` (Uncomplicated Firewall) bersamaan dengan Docker di Linux.\n\nDocker secara *default* akan memanipulasi aturan *iptables* sistem operasi secara langsung untuk melakukan *port forwarding*. Celakanya, proses ini sering kali mengabaikan (melakukan *bypass*) terhadap aturan `ufw` yang udah kamu capek-capek buat. Jadi kadang kelihatannya di `ufw` *port* tersebut udah kamu blokir, eh tapi aplikasinya tetep bisa diakses lewat *port* Docker-nya. Pastikan kamu membaca dokumentasi resmi Docker mengenai integrasi sistem keamanan dengan `ufw` agar tidak meninggalkan celah keamanan saat *deployment* nanti."
      ],
      isTutorial: false
    },
    {
      title: "Manajemen Tugas Kelompok: Cara bagi tugas full-stack yang adil buat 4 orang",
      tags: ["project-management", "agile", "collaboration", "full-stack"],
      content: "Halo Kakak-kakak! Aku sekelompok berempat dapet tugas akhir untuk bikin aplikasi *full-stack* sekaligus *self-hosting server*-nya. Tugasnya lumayan banyak, mulai dari *setup* Gitea, Install PostgreSQL pakai Docker, bikin API *backend*, sampai nge-desain *frontend* UI.\n\nMasalah yang sering terjadi di kampus itu selalu \"satu orang ngerjain semuanya, yang lain numpang nama\" 😂. Atau masalah lain: anak *frontend* gabut nungguin anak *backend* kelar bikin API. Kira-kira gimana ya matriks pembagian tugas yang adil dan bisa paralel untuk 4 orang?",
      bestAnswer: "Ini masalah klasik dunia perkuliahan! Kunci agar kerjanya bisa paralel (barengan) adalah dengan menyepakati **API Contract** di hari pertama. Jangan biarkan anak *frontend* nunggu *backend* kelar.\n\nBerikut saran matriks pembagian tugas untuk 4 orang:\n1. **Person A (DevOps & Infra):** Fokus *setup* Docker, *deploy* Gitea, *install* PostgreSQL, dan nyiapin *pipeline* CI/CD.\n2. **Person B (Backend API):** Fokus bikin *routing*, logika bisnis, dan koneksi ke *database*.\n3. **Person C (Frontend UI/UX):** Fokus integrasi desain ke kode, bikin komponen, dan *state management*.\n4. **Person D (QA & Documentation):** Fokus nulis *testing* (Postman/Jest), bikin dokumen *ReadMe*, presentasi, dan ngebantu integrasi akhir.\n\nSupaya Person C bisa langsung kerja, Person B dan C harus rapat di awal buat nentuin bentuk data JSON-nya (API Contract). Setelah itu, Person C bisa pakai data JSON palsu (*Mock API*) di lokalnya sendiri sampai API aslinya jadi.",
      studentRepliesToBest: [
        "Wah masuk akal banget Kak! Tapi untuk bikin *Mock API* itu biasanya pake *tools* apa ya biar gampang buat anak *frontend*-nya?",
        "Paling gampang pakai **Postman Mock Server** atau **Mockoon**. Kamu cukup masukin respon JSON yang disepakati, nanti *tools* itu bakal ngasih URL *endpoint* palsu yang bisa langsung di-*hit* sama aplikasi *frontend*-mu. Atau kalau mau lebih *simple*, simpan aja file `data.json` di dalam folder *project frontend* lalu di-*import* langsung.",
        "Mantap! Berarti nggak ada lagi alesan anak *frontend* gabut di minggu pertama ya Kak haha. Siap, nanti aku ajuin matriks tugas dan sistem *Mock API* ini ke temen-temen sekelompokku. Makasih Kak!"
      ],
      altAnswers: [
        "Menambahkan dari sisi *Project Management*: karena kalian udah pakai Gitea (alternatif GitHub), biasakan pakai fitur **Kanban Board** (seperti Trello) yang ada di dalamnya.\n\nBikin kolom: *To Do*, *In Progress*, *Review*, dan *Done*. Pecah pekerjaan besar (misal: \"Bikin Fitur Login\") menjadi tiket tugas kecil-kecil yang bisa diselesaikan dalam 1-2 hari (misal: \"Bikin UI Form Login\", \"Bikin Endpoint POST /login\", \"Setup JWT token\"). Aturannya: setiap orang wajib mengambil satu tiket dari kolom *To Do* setiap harinya. Ini bikin kontribusi semua anggota transparan dan ketahuan siapa yang *free-rider* (numpang nama).",
        "Satu poin yang krusial saat bekerja tim: **Git Workflow**. Jangan sampai kerjaan paralel kalian hancur gara-gara *Merge Conflict* yang parah di akhir minggu.\n\nJangan ada yang nge-*push* kode langsung ke *branch* `main`. Wajibkan setiap anggota bikin *branch* baru sesuai fitur yang dikerjakan (misal: `feature/setup-docker` atau `feature/login-ui`). Setelah selesai, suruh mereka bikin *Pull Request* (PR), dan tunjuk satu orang (biasanya yang paling paham *system architecture*) untuk me-*review* dan menggabungkan kodenya. Ini melatih standar industri banget!"
      ],
      isTutorial: false
    },
    {
      title: "Realita Agile Scrum di dunia kerja: Apakah seketat teori di kampus?",
      tags: ["agile", "project-management", "soft-skills", "career-advice"],
      content: "Halo Kakak-kakak! Waktu ngerjain *project* kampus, dosen sering banget nyuruh kita pakai metodologi *Agile Scrum*. Tapi ujung-ujungnya tetep aja ngerjainnya sistem SKS (Sistem Ngebut Semalam) dan *Daily Standup*-nya cuma formalitas aja di grup chat 😅.\n\nBuat persiapan nyari kerja *full-time*, aku mau nanya gimana sih realita penerapan *Agile Scrum* di *tech company* atau *startup*? Apakah beneran seketat itu (*Sprint Planning*, *Daily Standup*, *Retrospective*)? Terus sebagai *Junior Developer*, apa aja *soft skill* yang harus disiapin biar bisa *survive* di *environment* yang *Agile*-nya jalan beneran?",
      bestAnswer: "Hahaha, realita di industri itu seringnya disebut **\"Scrum-fall\"** (ngakunya *Agile*, tapi *mindset* manajemennya masih *Waterfall* yang kaku). Nggak semua perusahaan *Agile*-nya ideal.\n\nTapi, ritual yang hampir pasti selalu ada dan ketat adalah **Daily Standup**. Kesalahan terbesar *Junior Developer* saat *standup* adalah ngasih laporan ke bos/PM (*Project Manager*). Padahal *standup* itu fungsinya buat sinkronisasi sesama tim *developer*.\nFormat standar yang harus kamu biasain: *\"Kemarin saya ngerjain A, hari ini rencana ngerjain B, dan blocker (hambatan) saya saat ini adalah C.\"* Kalau kamu mentok di satu *bug* lebih dari setengah hari, wajib sebutin sebagai *blocker* pas *standup* besok paginya biar bisa dicarikan solusi bareng (*Pair Programming*).",
      studentRepliesToBest: [
        "Wah, jujur aku sering banget gengsi kalau harus ngomong ada *blocker*, takut dikira nggak jago ngoding Kak 😭. Berarti justru di industri kita dituntut buat transparan ya kalau lagi mentok?",
        "Banget! Di *Agile*, dosa terbesar itu bukan \"nggak bisa ngoding\", tapi \"ngilang tanpa kabar dan bikin *sprint* gagal\". Kalau kamu stuck 3 hari dan pas *standup* cuma bilang \"masih *on progress*\", satu tim bakal kena imbasnya. Minta tolong ke *senior* itu hal yang sangat wajar buat *junior*.",
        "Masuk akal banget Kak. Mengubah *mindset* dari kompetisi (takut keliatan bodoh) jadi kolaborasi ya. Siap, makasih banyak pencerahannya Kak, ngebantu banget buat ngurangin *anxiety* sebelum kerja!"
      ],
      altAnswers: [
        "Satu hal penting yang membedakan mental mahasiswa dan profesional di *Agile* adalah pemahaman soal **Story Points** (estimasi beban tugas).\n\nJangan pernah menyamakan *Story Point* murni dengan waktu (misal: 1 poin = 1 hari). *Story Point* itu mengukur **kompleksitas** dan **risiko**. Kalau kamu disuruh bikin fitur yang teknologinya baru pertama kali kamu pakai, berikan estimasi poin yang lebih tinggi sebagai *buffer* waktu belajarmu. Kalau di awal *Sprint Planning* kamu merasa beban tugasmu terlalu berat, belajarlah untuk negosiasi atau berani menolak (*push back*) secara profesional sebelum *Sprint*-nya dimulai.",
        "*Soft skill* paling diremehkan tapi paling disayang oleh PM: **Disiplin update tiket Jira/Trello!**\n\nDi dunia kerja, kalau kamu udah selesai ngoding dan kode kamu udah di-*merge*, tapi tiket di *board* belum kamu geser ke kolom \"Done\" atau \"QA Ready\", maka kamu dianggap belum bekerja. Biasakan menulis *progress* atau catatan kecil di tiket tersebut (misal: *\"Fitur X sudah di-deploy ke environment Staging, menunggu review QA\"*). Komunikasi asinkron lewat tiket ini sangat krusial, apalagi kalau perusahaanmu menerapkan sistem WFA (*Work From Anywhere*)."
      ],
      isTutorial: false
    },
    {
      title: "Worth it nggak sih ikut Core Team komunitas developer kampus buat karir?",
      tags: ["community", "networking", "career-growth", "portfolio"],
      content: "Halo Kakak-kakak! Sebentar lagi aku akan ada *interview* untuk join *core team* komunitas *developer* global di kampus, kebetulan aku ngincer masuk divisi R&D Web Development / Cloud Computing.\n\nJujur aku masih agak ragu soal manajemen waktunya. Apakah aktif ngurusin komunitas dan ngadain *event* IT di kampus itu beneran *impactful* buat karir atau *networking* pas lulus nanti? Atau mending waktuku dipake full buat fokus *ngoding project* pribadi dan nulis buku aja di kosan? Mohon masukannya Kak!",
      bestAnswer: "Sangat *worth it*, asalkan kamu strategis milih divisinya! Karena kamu masuk divisi R&D (bukan divisi acara atau humas), tugas komunitasmu itu bisa langsung disulap jadi portofolio teknis.\n\nKeuntungan terbesar ikut komunitas *developer* global (seperti GDG atau AWS User Group) adalah akses ke *Hidden Job Market* (lowongan kerja jalur dalam). Waktu lulus nanti, kamu nggak perlu lagi berdarah-darah sebar CV ke portal lowongan kerja. Sering kali, *speaker* tamu atau mentor yang kamu undang ke acaramu itu adalah *Tech Lead* atau *Engineering Manager* di perusahaan besar. Kalau mereka lihat kerjamu bagus saat nge-*lead* divisi R&D, mereka nggak akan ragu buat nawarin kamu posisi magang atau *full-time* lewat jalur *referral*.",
      studentRepliesToBest: [
        "Bener juga ya Kak, akses ke pembicara tamu itu *networking* tingkat dewa banget. Tapi kalau nanti jadinya sibuk ngurusin administrasi *event* dan malah jarang ngoding gimana Kak cara ngakalinnya?",
        "Sebagai anak R&D, kamu yang harus proaktif menciptakan *project* teknis untuk komunitasmu. Misalnya, alih-alih cuma bikin acara *workshop*, ajak tim R&D-mu bikin *platform* absensi otomatis atau sistem *ticketing* sendiri pakai *stack cloud computing* yang lagi kalian pelajari. Itu jadi bukti nyata (*use case*) kalau kamu bisa bikin produk yang beneran dipakai orang.",
        "Wah *mindblown*! Bikin produk internal buat dipakai komunitas sendiri ya. Ini ide yang brilian banget Kak buat ngegabungin *organizational skill* sama *technical skill*. Siap, aku bakal bawa ide ini pas *interview* *core team* besok. Makasih banyak Kak!"
      ],
      altAnswers: [
        "Di industri, apalagi kalau targetmu masuk perusahaan *enterprise* yang stabil, HRD mencari kandidat yang punya rekam jejak bagus dalam **kepemimpinan dan kolaborasi**.\n\nPunya *project* pribadi yang banyak itu bagus banget untuk ngebuktiin *hardskill*. Tapi, *project* pribadi tidak bisa membuktikan apakah kamu orang yang egois atau bisa kerja bareng tim. Berada di *core team* komunitas membuktikan bahwa kamu punya *soft power*: bisa menghadapi teman yang malas, bisa negosiasi, dan bisa menjelaskan hal teknis ke divisi non-teknis. Kombinasi *project* pribadi dan pengalaman komunitas adalah paket CV yang sempurna.",
        "Jangan meremehkan kekuatan saling *endorse* antar sesama *core team* di LinkedIn.\n\nTeman-teman sesama pengurus komunitasmu hari ini adalah para *Senior Engineer*, *Product Manager*, atau bahkan *Founder startup* di 5 tahun ke depan. Membangun kepercayaan (*trust*) dengan mereka sejak di kampus adalah investasi jangka panjang terbaik. Aku sendiri dapet *project vendor* pertamaku justru dari lemparan *project* teman satu divisi komunitas jaman kuliah dulu."
      ],
      isTutorial: false
    },
    {
      title: "Nulis dan nerbitin buku teknikal IT buat portofolio, apakah worth it di mata HRD?",
      tags: ["technical-writing", "portfolio", "career-growth", "data-warehouse"],
      content: "Halo Kakak-kakak Alumni! Selain bikin *project ngoding*, belakangan ini aku lagi punya target pribadi buat nulis buku teknikal. Rencananya mau nulis tentang arsitektur *Data Warehouse* skala *enterprise* dan mungkin ke depannya nulis soal integrasi Sistem Informasi Geografis (SIG) buat ranah kesehatan.\n\nPertanyaannya, apakah punya portofolio berupa \"penulis buku IT\" itu beneran dilirik dan punya *value* tinggi di mata HRD atau *Tech Lead* pas ngelamar kerja nanti? Atau di industri IT mah yang penting jago *coding* aja, nulis-nulis begini malah dianggap buang waktu dan mending fokus perbanyak *commit* di GitHub?",
      bestAnswer: "Menulis buku teknikal adalah *ultimate flex* (pembuktian tertinggi) untuk seorang *fresh graduate*. Serius.\n\n99% pelamar kerja cuma ngirim *link* GitHub berisi *project To-Do List* atau *CRUD* biasa. Kalau kamu melampirkan buku teknikal yang kamu tulis sendiri, CV kamu otomatis ada di tumpukan paling atas. Kenapa? Karena *Tech Lead* sadar betul bahwa untuk bisa menjelaskan arsitektur kompleks (seperti *Data Warehouse* atau SIG) ke dalam tulisan yang terstruktur, itu butuh pemahaman fundamental yang sangat dalam (Feynman Technique). Selain itu, ini membuktikan *skill* komunikasi tertulismu sangat luar biasa, yang mana ini adalah *soft skill* paling mahal di era kerja *remote* atau *hybrid*.",
      studentRepliesToBest: [
        "Wah lega banget dengernya Kak! Kebetulan aku udah nyusun kerangkanya. Rencananya tiap bab bakal ada sub-bab materi, bagian 'rangkuman', dan 'uji pemahaman' biar kerasa kayak buku pegangan industri. Apakah format gitu udah pas?",
        "Format itu udah *perfect* banget, persis kayak buku pegangan sertifikasi profesional! Karena topikmu lumayan berat (*enterprise-grade*), pastikan *study case* di bagian 'uji pemahaman'-nya itu relevan sama dunia nyata ya. Jangan cuma nanya teori, tapi kasih studi kasus *troubleshooting*.",
        "Siap Kak! Nanti aku banyakin studi kasus tentang integrasi data dan penyelesaian anomali di bagian latihannya. Makasih banyak Kak *support*-nya, jadi makin semangat namatin draf bukunya!"
      ],
      altAnswers: [
        "Sedikit nambahin dari sisi manajerial. Di perusahaan skala *Enterprise* atau BUMN, dokumentasi itu sama pentingnya dengan kode itu sendiri.\n\nBanyak *programmer* jago yang kodenya kayak sihir, tapi pas disuruh nulis *System Requirement Specification* (SRS) atau dokumen arsitektur, mereka kebingungan. Kalau kamu masuk *interview* bawa portofolio buku teknikal, *Engineering Manager* bakal langsung mikir: *\"Wah, anak ini pasti bisa diandalkan buat nulis dokumentasi sistem internal kita yang lagi berantakan.\"* Itu nilai jual yang sangat langka!",
        "Tips buat *publishing*-nya: jangan terlalu pusing ngejar penerbit mayor (tradisional) kalau prosesnya dirasa terlalu lama.\n\nKamu bisa rilis versi digitalnya (*e-book*) secara mandiri lewat platform seperti Leanpub, Gumroad, atau bahkan Google Play Books. Alternatif lain yang sangat disukai komunitas: jadikan buku tersebut sebagai repositori *Open Source* di GitHub (menggunakan *tools* seperti GitBook atau Docusaurus). Dengan begitu, *Tech Lead* yang meng-*interview* kamu bisa langsung melihat kualitas tulisanmu, dan *developer* lain bisa ngasih *star* atau berkontribusi."
      ],
      isTutorial: false
    },
    {
      title: "Apakah pake Linux (kaya Arch) buat daily-driver beneran ngebantu skill programming?",
      tags: ["linux", "os", "productivity", "discussion"],
      content: "Halo Kakak-kakak! Aku penasaran, apakah pakai distro Linux yang lumayan rumit (kayak Arch Linux) sebagai OS utama (*daily driver*) itu beneran ngebantu *skill programming* kita di dunia kerja nanti? \n\nCeritanya kemaren aku iseng ngoprek *boot partition*, eh malah nggak sengaja kehapus file `vmlinuz-linux`-nya. Terus pas nyoba perbaikin dan jalanin `pacstrap`, proses `mkinitcpio`-nya malah gagal. Alhasil laptopku nyangkut balik ke *rootfs* terus dan nggak bisa *booting*. 😅 Seharian abis waktu cuma buat nyari cara nge-*rescue* sistemnya pakai *chroot*. \n\nApakah *troubleshooting* OS yang bikin stres kayak gini beneran *worth it* buat karir, atau malah buang-buang waktu yang mending dipake buat ngoding aja?",
      bestAnswer: "Percayalah, momen laptop nyangkut di *rootfs* itu adalah \"masa ospek\" terbaik buat calon *DevOps Engineer* atau *SysAdmin*. Mengajarkan *syntax coding* ke seseorang itu gampang, tapi mengajarkan insting tentang bagaimana sebuah mesin hidup dari nol itu susah.\n\nWaktu kamu berdarah-darah ngebenerin partisi *boot*, ngatur *bootloader*, dan paham fungsi `mkinitcpio` untuk membuat *initramfs*, kamu secara nggak sadar lagi belajar persis tentang bagaimana cara server-server *cloud* (seperti AWS EC2 atau GCP) itu melakukan *booting* di belakang layar. Di dunia kerja, kalau server produksi tiba-tiba mengalami *kernel panic*, *developer* biasa bakal angkat tangan, tapi orang yang terbiasa menyelamatkan Arch Linux pasti tahu cara melakukan *chroot* dan menyelamatkan datanya. Sangat *worth it*!",
      studentRepliesToBest: [
        "Wah, perspektifnya keren banget Kak! Aku sempet nyesel kemaren ngabisin waktu seharian baca dokumentasi Arch Wiki, tapi denger penjelasan Kakak jadi semangat lagi. Berarti *skill rescue system* pakai *chroot* gitu emang beneran relevan dipake di server kerjaan ya?",
        "Kepake banget. Apalagi kalau nanti kamu mainan *Docker* atau meracik *custom OS image* untuk perangkat IoT. Sadar nggak? Konsep dasar isolasi *environment* yang ada di dalam *Docker* itu akarnya ya dari perintah `chroot` yang kamu pakai buat nyelamatin Arch kamu kemaren.",
        "Bener juga ya Kak! Pantesan pas kemaren berhasil masuk ke mode *chroot*, *feeling*-nya mirip-mirip kayak lagi masuk ke dalem *container Docker*. Makasih banyak Kak motivasinya, jadi nggak kapok pake Arch haha."
      ],
      altAnswers: [
        "Sedikit pandangan berbeda: ini sangat tergantung pada *role* apa yang mau kamu ambil setelah lulus nanti. \n\nKalau targetmu murni menjadi *Frontend Developer* atau *UI/UX Engineer*, jujur saja, memakai Arch Linux mungkin akan sedikit menguras produktivitasmu. Kamu butuh OS seperti MacOS atau Ubuntu yang tinggal pakai, sehingga waktumu 100% bisa digunakan untuk eksplorasi *framework* JavaScript atau mendesain di Figma. TAPI, kalau targetmu adalah *Backend*, *DevOps*, atau *Cybersecurity*, jam terbang ngoprek Linux sampai ke level *kernel* itu harganya sangat mahal di mata HRD.",
        "Hahaha jadi ingat masa muda. Jangan menyerah hanya gara-gara `vmlinuz` hilang! Ingat aturan emas pengguna Linux: *\"If it ain't broke, tweak it till it breaks, then learn how to fix it.\"* \n\nPengalaman stres mencari solusi di forum diskusi sambil baca *log* *error* merah panjang itu akan melatih mental *problem-solving* kamu menjadi sekeras baja. Nanti di dunia kerja sungguhan, *bug* aplikasi yang kamu temui akan jauh lebih ajaib daripada sekadar gagal *build initcpio* image."
      ],
      isTutorial: false
    },
    {
      title: "Pertanyaan System Design yang paling sering keluar buat Fresh Graduate",
      tags: ["system-design", "interview", "career-advice", "architecture"],
      content: "Halo Kakak-kakak! Melanjutkan bahasan soal *Technical Interview* sebelumnya, aku mau nanya lebih spesifik tentang tahapan *System Design*.\n\nSebagai *fresh graduate* yang belum punya pengalaman menangani *traffic* jutaan *user* di dunia nyata, ekspektasi *interviewer* itu sejauh apa sih? Apa aja daftar pertanyaan *System Design* yang paling sering ditanyain ke level junior, dan konsep apa yang wajib banget dikuasai biar bisa jawab dengan lancar?",
      bestAnswer: "Ekspektasi untuk *fresh grad* itu bukan bikin desain yang sempurna, tapi melihat apakah kamu paham *trade-off* (kelebihan dan kekurangan) dari sebuah teknologi. \n\nBerikut adalah pertanyaan yang paling sering keluar:\n1. Desain sistem *URL Shortener* (seperti Bitly).\n2. Desain fitur *News Feed* (seperti Twitter/Instagram).\n\nUntuk menjawabnya, kamu **tidak perlu** menguasai algoritma *database sharding* yang rumit. Kamu hanya dituntut paham dua konsep utama: **Scaling** (perbedaan *Vertical Scaling* vs *Horizontal Scaling*) dan **Caching strategy** tingkat dasar (kapan harus pakai Redis untuk menyimpan data yang sering diakses agar *database* utama tidak *down*).",
      studentRepliesToBest: [
        "Wah, makasih banyak Kak daftarnya! Tapi soal *database sharding* itu, apakah kita bener-bener nggak usah nyentuh sama sekali? Kemaren aku sempet baca-baca soal *Consistent Hashing* dan jujur pusing banget 😅.",
        "Nggak perlu sampai *Consistent Hashing*, itu biasanya pertanyaan untuk level *Mid* ke *Senior*. Untuk junior, cukup tahu definisinya saja (memecah satu *database* besar menjadi beberapa *database* kecil berdasarkan rentang ID tertentu). Daripada pusing belajar *sharding*, mending kamu fokus belajar konsep **Master-Slave Replication** (satu *database* untuk *write*, beberapa *database* untuk *read*). Itu jauh lebih sering ditanyakan.",
        "Masuk akal Kak! Berarti ekspektasinya lebih ke fondasi pemisahan *read* dan *write* ya. Lega banget dengernya, aku bakal fokus pelajarin *Replication* sama Redis dulu. Makasih Kak!"
      ],
      altAnswers: [
        "Tambahan poin penting saat ditanya desain *URL Shortener*: *interviewer* ingin melihat apakah kamu sadar bahwa sistem tersebut adalah **Read-Heavy System**.\n\nArtinya, jumlah orang yang mengklik/membaca *link* pendek itu akan jauh lebih banyak (mungkin rasionya 100:1) dibandingkan orang yang membuat *link* baru. Kalau kamu sudah tahu sistemnya *read-heavy*, maka argumenmu untuk menggunakan *Distributed Cache* (seperti Redis atau Memcached) di depan *database* akan terdengar sangat logis dan terstruktur di mata *interviewer*.",
        "Jangan lupa sediakan kerangka berpikir sebelum mulai menggambar arsitektur di papan tulis. Gunakan urutan ini:\n\n1. **Clarify Requirements:** Tanya balik ke *interviewer* (misal: \"Berapa target *Daily Active Users*-nya Pak? Apakah aplikasinya butuh *real-time*?\").\n2. **High-Level Design:** Gambar kotak-kotak besar (Client -> Load Balancer -> Web Servers -> Database).\n3. **Identify Bottlenecks:** Tunjuk bagian mana yang kira-kira akan *crash* duluan kalau *user*-nya membludak, lalu tawarkan solusi (misal: tambah *Message Queue* seperti RabbitMQ).\n\nKalau kamu pakai urutan ini, *interviewer* akan sangat terkesan dengan cara berpikirmu yang sistematis."
      ],
      isTutorial: false
    },
    {
      title: "Karir Game Dev: Apakah engine Godot udah banyak dipakai di industri game Indonesia?",
      tags: ["game-development", "godot", "career-advice", "tech-stack"],
      content: "Halo Kakak-kakak Alumni! Kemarin aku baru aja ikut *Game Jam* yang temanya tentang *\"strange places\"* dan aku memutuskan buat bikin *game* 2D pakai Godot Engine. Jujur aku ngerasa nyaman banget pakai *engine* ini dibanding yang lain.\n\nTapi aku mulai mikir panjang buat karir ke depan. Apakah Godot udah cukup *viable* dan banyak dipakai sama studio *game* lokal di Indonesia? Atau kalau mau aman nyari kerja (bisa cepet dapet loker) mending aku langsung banting setir belajar Unity/Unreal aja dari sekarang?",
      bestAnswer: "Kalau bahas industri *game* lokal, saat ini kita sedang ada di fase transisi yang sangat menarik. Memang benar Unity masih memegang tahta tertinggi untuk lowongan kerja, terutama di studio pembuat *game mobile* atau *hyper-casual*. \n\nTAPI, untuk studio *indie* Indonesia yang fokus bikin *game* PC/Konsol (premium) di Steam, Godot perkembangannya sangat pesat! Semenjak ada kontroversi soal lisensi dan *pricing* Unity tahun lalu, banyak banget studio lokal di Bandung, Surabaya, dan Jakarta yang mulai *shifting* pakai Godot untuk *project* 2D mereka. Jadi kalau *passion* kamu memang di *game* 2D naratif atau *platformer* ala studio *indie*, *skill* Godot kamu bakal sangat berharga dan punya nilai jual tinggi di mata mereka.",
      studentRepliesToBest: [
        "Wah lega banget dengernya Kak! Berarti *project* *Game Jam* kemarin nggak sia-sia. Kalau untuk bahasanya, mending aku tetep pakai GDScript bawaan Godot atau *setup* C# ya Kak biar lebih dilirik studio?",
        "Untuk 2D, GDScript sudah sangat memadai dan lebih dioptimasi oleh *engine*-nya. Studio *indie* biasanya nggak terlalu peduli kamu pakai bahasa apa, yang penting *game*-nya jalan lancar dan nggak banyak *bug*. Fokus aja ngepoles *game* hasil *Game Jam* kamu itu buat dijadiin portofolio utama.",
        "Siap Kak! Nanti *game* tentang *strange places* itu bakal aku tambahin level dan benerin *UI*-nya biar layak dipajang di CV. Makasih banyak pencerahannya!"
      ],
      altAnswers: [
        "Sedikit perspektif tambahan: di dunia *Game Development*, *engine* itu hanyalah alat. Yang perusahaan cari adalah fundamental logikamu.\n\nGodot itu melatih kamu terbiasa dengan arsitektur berbasis *Node* dan *Scene*. Pemahaman tentang hierarki *object*, sistem *physics*, *state machine*, dan *UI scaling* itu ilmunya bisa ditransfer ke *engine* mana pun. Kalau kamu udah jago bikin *game loop* yang efisien di Godot, suatu saat kamu disuruh kerja pakai Unity pun adaptasinya bakal sangat cepat. Jadi lanjutkan saja eksperimenmu dengan Godot.",
        "Ingat juga soal segmentasi pasar. Kalau target utamamu setelah lulus adalah langsung masuk ke perusahaan besar (*corporate*) yang bikin *gamification* untuk aplikasi perbankan atau *e-commerce*, mereka 99% masih menggunakan Unity.\n\nTapi, kalau kamu ngincer masuk ke komunitas developer *indie* yang lebih *passionate* merilis *game* PC, Godot adalah pilihan yang brilian saat ini. Jangan lupa sering-sering ikut *showcase* lokal biar namamu mulai dikenal di *circle* studio lokal."
      ],
      isTutorial: false
    },
  ];

  const students = users.filter(u => u.role === 'Student');
  const alumniUsers = users.filter(u => u.role === 'Alumni' || u.role === 'AlumniMentor');

  function getRandom(arr, excludeId = null) {
    const pool = arr.filter(u => u.id !== excludeId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  for (const tData of topicData) {
    // Determine Thread Author
    let threadAuthor = tData.isTutorial === true 
      ? getRandom(alumniUsers) 
      : (tData.isTutorial === false ? getRandom(students) : getRandom(users));
    
    const threadDate = getRandomDateInPastDays(30);

    // Create Thread
    const thread = await prisma.thread.create({
      data: {
        title: tData.title,
        content: tData.content,
        authorId: threadAuthor.id,
        createdAt: threadDate, // Override default(now())
        updatedAt: threadDate, // Override updated timestamp
        tags: {
          create: tData.tags.map(tagName => {
            const tId = tags.find(tag => tag.name === tagName)?.id;
            return { tag: { connect: { id: tId } } };
          })
        }
      }
    });

    // We must have 3 Answers (top-level) by Alumni/AlumniMentor
    // 1st answer -> bestAnswer (if any)
    // 2nd, 3rd -> altAnswers
    let altAnswerContents = tData.altAnswers || [];
    while(altAnswerContents.length < 2) {
      altAnswerContents.push("Ini jawaban alternatif aja tapi bermanfaat buat tambah wawasan.");
    }
    
    const answerQueue = [
      { content: tData.bestAnswer || "Sangat setuju kak, makasih referensinya.", isBest: true, isTargetReply: true },
      { content: altAnswerContents[0], isBest: false, isTargetReply: false },
      { content: altAnswerContents[1], isBest: false, isTargetReply: false }
    ];

    for (const ansData of answerQueue) {
      // Must be Alumni for answers
      let ansAuthor = getRandom(alumniUsers);

      const answerDate = new Date(threadDate.getTime() + (Math.random() * 86400000));
      
      const answer = await prisma.threadComment.create({
        data: {
          threadId: thread.id,
          content: ansData.content,
          isBestAnswer: ansData.isBest,
          authorId: ansAuthor.id,
          createdAt: answerDate, // Apply the offset date
          updatedAt: answerDate
        }
      });

      // Now create 3 replies for each answer
      const repliesCount = 3;
      for (let i = 0; i < repliesCount; i++) {
        let repAuthor = getRandom(users);
        let repContent = "Makasih kak referensi dan infonya. Ngebantu banget buat kita.";
        
        if (ansData.isTargetReply && tData.studentRepliesToBest && tData.studentRepliesToBest[i]) {
          repContent = tData.studentRepliesToBest[i];
        } else {
           const genericReplies = ["Setuju dengan statement ini kak.", "Menarik pembahasannya, saya setuju.", "Bagus kak insight tambahannya."];
           repContent = genericReplies[i % genericReplies.length];
        }

        const replyDate = new Date(answerDate.getTime() + (Math.random() * 43200000));

        await prisma.threadComment.create({
          data: {
            threadId: thread.id,
            content: repContent,
            authorId: repAuthor.id,
            parentId: answer.id,
            createdAt: replyDate, // Apply the offset date
            updatedAt: replyDate
          }
        });
      }
    }
  }

  console.log('✓ Created 20 threads with their answers and replies');
  // Ensure every user has some thread actions and comment likes
  console.log('Seeding thread actions and comment likes for all users...');

  const allThreads = await prisma.thread.findMany({ where: { deletedAt: null }, select: { id: true } });
  const allComments = await prisma.threadComment.findMany({ where: { deletedAt: null }, select: { id: true } });

  let createdActionCount = 0;
  let createdLikeCount = 0;

  for (const u of users) {
    // Thread actions: create 3-6 actions if the user has none
    const existingActions = await prisma.threadAction.count({ where: { userId: u.id } });
    if (existingActions === 0 && allThreads.length > 0) {
      const numActions = Math.min(allThreads.length, Math.floor(Math.random() * 4) + 3);
      const shuffledThreads = allThreads.slice().sort(() => 0.5 - Math.random());
      for (let i = 0; i < numActions; i++) {
        const actionType = Math.random() < 0.2 ? 'SAVE' : 'VIEW';
        await prisma.threadAction.create({
          data: {
            threadId: shuffledThreads[i].id,
            userId: u.id,
            action: actionType,
            createdAt: getRandomDateInPastDays(30)
          }
        });
        createdActionCount++;
      }
    }

    // Comment likes: ensure at least 1 like per user
    if (allComments.length > 0) {
      const existingLikes = await prisma.commentLike.count({ where: { userId: u.id } });
      if (existingLikes === 0) {
        const numLikes = Math.min(allComments.length, Math.floor(Math.random() * 3) + 1);
        const shuffledComments = allComments.slice().sort(() => 0.5 - Math.random());
        for (let j = 0; j < numLikes; j++) {
          try {
            await prisma.commentLike.create({
              data: {
                commentId: shuffledComments[j].id,
                userId: u.id,
                createdAt: getRandomDateInPastDays(30)
              }
            });
            createdLikeCount++;
          } catch (e) {
            // ignore unique constraint or other create errors
          }
        }
      }
    }
  }

  console.log(`✓ Created ${createdActionCount} thread actions and ${createdLikeCount} comment likes`);

  console.log('Seeder completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
