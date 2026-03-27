import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  ArrowRight, 
  BookOpen, 
  Wallet, 
  BarChart3,
  School
} from 'lucide-react';

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">APSS Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/login"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Demo Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20 mb-6">
              SaaS Manajemen Pesantren Terpadu
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Modernisasi Tata Kelola <br /> 
              <span className="text-indigo-500">Pendidikan Pesantren</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
              Platform manajemen terpadu untuk efisiensi administrasi, transparansi keuangan, 
              dan pemantauan santri secara real-time dalam satu ekosistem SaaS yang aman.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95"
              >
                Coba Demo Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="https://github.com/ayebe51/saas-manajemen-pesantren" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-white/10 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { 
                icon: <ShieldCheck className="w-8 h-8 text-indigo-400" />, 
                title: "Data Terisolasi", 
                desc: "Arsitektur multi-tenant memastikan data antar pesantren tetap aman dan terpisah secara sistemik." 
              },
              { 
                icon: <LayoutDashboard className="w-8 h-8 text-blue-400" />, 
                title: "Dashboard Dashboard", 
                desc: "Visualisasi analytics cerdas untuk memantau kehadiran, grafik tabungan, dan statistik pelanggaran." 
              },
              { 
                icon: <Wallet className="w-8 h-8 text-emerald-400" />, 
                title: "E-Wallet Santri", 
                desc: "Sistem pembayaran cashless terintegrasi untuk jajan koperasidan keamanan uang saku santri." 
              },
              { 
                icon: <BookOpen className="w-8 h-8 text-purple-400" />, 
                title: "Akademik Digital", 
                desc: "Manajemen kurikulum, presensi otomatis, dan pelaporan nilai (Syahriah) yang transparan." 
              },
              { 
                icon: <Users className="w-8 h-8 text-orange-400" />, 
                title: "Portal Wali Murid", 
                desc: "Akses khusus bagi orang tua untuk memantau perkembangan anak secara langsung dari rumah." 
              },
              { 
                icon: <BarChart3 className="w-8 h-8 text-rose-400" />, 
                title: "Laporan Real-time", 
                desc: "Export data ke Excel/PDF dalam hitungan detik untuk kebutuhan audit dan evaluasi berkala." 
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="group p-8 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-indigo-500/30 hover:bg-slate-900 transition-all text-left"
              >
                <div className="mb-4 bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center text-slate-500 text-sm">
        <p>&copy; 2026 APSS Portal - SaaS Manajemen Pesantren Terpadu. Build for Excellence.</p>
      </footer>
    </div>
  );
}
