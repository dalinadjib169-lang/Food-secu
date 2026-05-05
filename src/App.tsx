import React, { useState, useEffect } from "react";
import { 
  LayoutGrid, 
  Map as MapIcon, 
  BarChart3, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  MapPin, 
  Leaf, 
  TrendingUp, 
  Bell, 
  User,
  ShoppingBag,
  Filter,
  ArrowLeftRight,
  ChevronRight,
  MoreVertical,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  Timestamp,
  doc,
  getDocFromServer 
} from "firebase/firestore";
import { db, auth, googleProvider } from "./lib/firebase";
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ImageUpload } from "./components/ImageUpload";
import { SupplyMap } from "./components/SupplyMap";
import { PriceTrackingChart } from "./components/PriceTrackingChart";
import { Product, PriceReport, AppView } from "./lib/types";
import { cn } from "./lib/utils";
import { handleFirestoreError, OperationType } from "./lib/firestoreErrorHandler";

export default function App() {
  const [view, setView] = useState<AppView>("marketplace");
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    const productsPath = "products";
    const q = query(collection(db, productsPath), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, productsPath);
    });

    const reportsPath = "reports";
    const reportQ = query(collection(db, reportsPath), orderBy("timestamp", "desc"));
    const unsubscribeReports = onSnapshot(reportQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceReport));
      setReports(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, reportsPath);
    });

    onAuthStateChanged(auth, (u) => setUser(u));

    return () => {
      unsubscribe();
      unsubscribeReports();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup.");
      } else {
        alert("فشل تسجيل الدخول: " + err.message);
        console.error("Login failed:", err);
      }
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const addProduct = async (formData: any) => {
    if (!formData.name || !formData.price || !formData.imageUrl) {
      alert("يرجى ملء الاسم، السعر، ورفع الصورة");
      return;
    }

    setIsPublishing(true);
    const path = "products";
    try {
      await addDoc(collection(db, path), {
        ...formData,
        price: Number(formData.price),
        farmerId: user?.uid || "guest",
        farmerName: user?.displayName || (user ? "فلاح مسجل" : "فلاح ضيف"),
        createdAt: Date.now(),
        available: true,
        location: { lat: 36.7538, lng: 3.0588 }, // Default Algiers for map visibility
      });
      setIsModalOpen(false);
      alert("✅ تم نشر عرضك بنجاح في السوق الرقمي!");
    } catch (err) {
      console.error(err);
      alert("❌ عذراً، فشل النشر. يرجى المحاولة مرة أخرى.");
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddButtonClick = () => {
    if (!user) {
      if (confirm("يجب تسجيل الدخول كفلاح لإضافة منتجات. هل تريد تسجيل الدخول الآن؟")) {
        login();
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.wilaya?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (

    <div className="min-h-screen bg-brand-bg text-[#e0e7e1] font-sans selection:bg-emerald-500/20" dir="rtl">

      {/* Top Banner / Ticker */}
      <div className="bg-brand-header border-b border-white/5 text-xs py-2 px-4 shadow-sm overflow-hidden whitespace-nowrap">
        <motion.div 
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center font-bold tracking-wider"
        >
          <span className="flex items-center gap-2 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            تنبیه: ولاية معسكر تبلغ عن نقص في مادة البطاطس
          </span>
          <span className="flex items-center gap-2 text-brand-success">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></span>
            استقرار في أسعار الطماطم في سوق الجملة (بوفاريك)
          </span>
          <span className="flex items-center gap-2 text-brand-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></span>
            موسم جني الزيتون يبدأ في منطقة القبائل
          </span>
        </motion.div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Header */}
        <header className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-success to-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 flex-shrink-0">
              <Leaf className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">FoodSecure <span className="text-brand-accent">DZ</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-success font-semibold">من الفلاح مباشرة إلى مائدتك</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl mx-4 w-full">
            <div className="relative w-full group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-brand-accent transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن منتج، فلاح، أو ولاية..." 
                className="w-full bg-white/5 border-2 border-white/10 h-12 pr-12 rounded-2xl focus:outline-none focus:border-brand-accent transition-all shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10 shadow-sm">
                <span className="text-xs font-bold text-white/80 hidden sm:block">{user.displayName}</span>
                <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-brand-accent/50" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <button 
                id="farmer-login-btn"
                onClick={login}
                className="bg-brand-accent text-brand-bg px-6 h-12 rounded-2xl font-black hover:bg-brand-accent/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-accent/30 active:scale-95"
              >
                <User size={20} /> دخول الفلاحين
              </button>
            )}
          </div>

        </header>

        {/* Content Navigation */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {[
            { id: "marketplace", label: "السوق الرقمي", icon: LayoutGrid },
            { id: "map", label: "خريطة التوفر", icon: MapIcon },
            { id: "tracking", label: "تتبع الأسعار", icon: BarChart3 },
            { id: "reports", label: "البلاغات", icon: AlertTriangle },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as AppView)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border-2",
                view === item.id 
                  ? "bg-brand-success/20 text-brand-success border-brand-success/30 shadow-lg shadow-emerald-900/10" 
                  : "bg-white/5 text-white/60 border-transparent hover:border-white/10"
              )}
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
          
          <button 
            onClick={handleAddButtonClick}
            className="mr-auto bg-brand-accent text-brand-bg px-6 py-3 rounded-2xl font-black hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20 flex items-center gap-2 text-sm active:scale-95 border-b-4 border-brand-accent/20"
          >
            <PlusCircle size={18} /> إضافة منتج
          </button>
        </div>

        {/* Main View Area */}
        <main>
          <AnimatePresence mode="wait">
            {view === "marketplace" && (
              <motion.div 
                key="marketplace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredProducts.length > 0 ? (filteredProducts as Product[]).map((product) => (
                  <ProductCard key={product.id} product={product} />
                )) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-xl">لا توجد منتجات حالياً في هذا التصنيف</p>
                  </div>
                )}
              </motion.div>
            )}

            {view === "map" && (
              <motion.div 
                key="map"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brand-sidebar p-6 rounded-[32px] shadow-2xl border border-white/5"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white italic">خريطة التوفر الجغرافي</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">تتبع مواقع الإنتاج المباشر</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-3 py-1 bg-brand-success/10 text-brand-success rounded-full border border-brand-success/20">خضروات</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full border border-brand-accent/20">فواكه</span>
                  </div>
                </div>
                <SupplyMap products={products} />
              </motion.div>
            )}

            {view === "tracking" && (
              <motion.div 
                key="tracking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-8">
                  <PriceTrackingChart />
                  <div className="bg-brand-card p-8 rounded-[32px] border border-white/5">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 italic">
                      <TrendingUp size={20} className="text-brand-success" /> توقعات الأسعار الموسمية
                    </h3>
                    <div className="space-y-4">
                      {[
                        { name: "البطاطس", change: "+5%", trend: "up", desc: "توقعات بارتفاع طفيف بسبب نقص الأمطار في منطقة الغرب" },
                        { name: "الطماطم", change: "-12%", trend: "down", desc: "وفرة في الإنتاج ببيوت البلاستيك (بسكرة)" },
                        { name: "القمح", change: "0%", trend: "stable", desc: "استقرار الأسعار بفضل الدعم الحكومي والاحتياطي الاستراتيجي" }
                      ].map((item, id) => (
                        <div key={id} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                            item.trend === 'up' ? "bg-rose-500/10 text-rose-400" : item.trend === 'down' ? "bg-emerald-500/10 text-brand-success" : "bg-white/5 text-white/40"
                          )}>
                            {item.trend === 'up' ? <TrendingUp size={20} /> : <TrendingUp size={20} className="rotate-90" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">{item.name}</span>
                              <span className={cn("text-xs font-black px-2 py-0.5 rounded-md", item.trend === 'up' ? "bg-rose-500/20 text-rose-400" : "bg-brand-success/20 text-brand-success")}>{item.change}</span>
                            </div>
                            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-brand-sidebar to-brand-bg p-8 rounded-[32px] border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-success/10 rounded-full blur-3xl"></div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">مؤشرات الأمن الغذائي</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">منتج نشط</p>
                        <p className="text-2xl font-black text-brand-accent mt-1">{products.length * 15 + 420}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">مستهلك</p>
                        <p className="text-2xl font-black text-white mt-1">1.2k</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 col-span-2">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">حجم التداول اليومي</p>
                        <p className="text-2xl font-black text-brand-success mt-1">850 Q</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-card p-8 rounded-[32px] border border-white/10">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">بورصة أسعار الجملة</h3>
                    <div className="space-y-3">
                      {['بطاطا: 65 دج', 'بصل: 40 دج', 'طماطم: 80 دج', 'فلفل: 110 دج'].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all cursor-pointer group">
                          <span className="font-bold text-white group-hover:text-brand-accent transition-colors">{p.split(':')[0]}</span>
                          <span className="font-mono text-brand-accent font-bold">{p.split(':')[1]}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-8 py-4 text-brand-success text-xs font-black uppercase tracking-widest border border-brand-success/30 rounded-2xl hover:bg-brand-success/10 transition-all">تحميل النشرة</button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === "reports" && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[32px] mb-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <h3 className="text-rose-400 font-black text-xl mb-3 flex items-center gap-3">
                    <AlertTriangle /> نظام الإنذار المبكر
                  </h3>
                  <p className="text-white/60 leading-relaxed font-medium text-sm">
                    ساهم في حماية السوق الوطني من المضاربات. البلاغات تساعد الجهات المختصة وفئات التجار النزلاء على موازنة العرض والطلب.
                  </p>
                </div>

                <div className="space-y-6">
                  {reports.length > 0 ? reports.map((report) => (
                    <div key={report.id} className="bg-brand-card p-6 rounded-[24px] border border-white/5 hover:border-white/20 transition-all flex items-start gap-6 relative group">
                      <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-lg">{report.productName} - {report.wilaya}</h4>
                          <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">منذ قليل</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-rose-400 font-mono font-bold">{report.price} دج</span>
                          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter", report.type === 'price_hike' ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-accent/20 text-brand-accent')}>
                            {report.type === 'price_hike' ? 'SPOKE: PRICE HIKE' : 'SPOKE: SHORTAGE'}
                          </span>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed font-medium italic">"رصد تذبذب في التموين وزيادة غير مبررة في السعر النهائي للمستهلك."</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-24 bg-white/5 rounded-[32px] border-2 border-dashed border-white/5">
                      <AlertTriangle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/20 font-bold uppercase tracking-widest text-xs">لا يوجد نشاط رصد حالياً</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-brand-sidebar w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-success via-brand-accent to-rose-500"></div>
              <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-widest italic leading-tight">إضافة منتج فلاحي جديد</h2>
              
              <ProductForm 
                onSubmit={addProduct} 
                onClose={() => setIsModalOpen(false)} 
                isPublishing={isPublishing}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-brand-sidebar/90 backdrop-blur-xl text-white h-16 rounded-full flex items-center justify-around px-6 shadow-2xl border border-white/10 sm:hidden z-40">
        <button onClick={() => setView('marketplace')} className={cn("p-2 transition-all", view === 'marketplace' && "text-brand-accent scale-125")}><LayoutGrid size={22} /></button>
        <button onClick={() => setView('map')} className={cn("p-2 transition-all", view === 'map' && "text-brand-accent scale-125")}><MapIcon size={22} /></button>
        <button 
          onClick={handleAddButtonClick} 
          className="bg-brand-accent text-brand-bg p-4 rounded-full -mt-12 border-4 border-brand-bg shadow-xl shadow-brand-accent/30 active:scale-90"
        >
          <PlusCircle size={28} />
        </button>
        <button onClick={() => setView('tracking')} className={cn("p-2 transition-all", view === 'tracking' && "text-brand-accent scale-125")}><BarChart3 size={22} /></button>
        <button onClick={() => setView('reports')} className={cn("p-2 transition-all", view === 'reports' && "text-brand-accent scale-125")}><AlertTriangle size={22} /></button>
      </div>
    </div>
  );
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-brand-card rounded-[28px] overflow-hidden shadow-2xl shadow-black/50 transition-all border border-white/5 flex flex-col group min-h-[420px]"
    >
      <div className="relative h-56 overflow-hidden bg-brand-sidebar shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-brand-accent text-brand-bg px-4 py-1.5 rounded-xl text-xs font-black shadow-lg z-20">
          {product.price} دج
        </div>
        <div className="absolute bottom-4 right-4 text-brand-success flex items-center gap-1.5 z-20">
          <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">متوفر الآن</span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1 relative">
        <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-white/30">
          <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{product.category}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {product.wilaya}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 leading-snug">{product.name}</h3>
        <p className="text-xs text-white/40 line-clamp-2 mb-4 leading-relaxed">هذا المنتج متوفر مباشرة من المزرعة بجودة عالية وسعر تنافسي في ولاية {product.wilaya}.</p>
        
        <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/5">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-brand-accent shrink-0 border border-white/5 group-hover:border-brand-accent/30 transition-colors">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white/80 truncate leading-none">{product.farmerName}</p>
            <p className="text-[9px] text-white/30 uppercase font-black mt-1.5 tracking-tighter">فلاح موثوق</p>
          </div>
          <button className="bg-white/5 hover:bg-brand-success text-white hover:text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all border border-white/10 hover:border-brand-success shadow-sm">
            طلب شراء
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProductForm({ onSubmit, onClose, isPublishing }: { onSubmit: (data: any) => void, onClose: () => void, isPublishing?: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    wilaya: "الجزائر",
    category: "خضروات",
    imageUrl: "",
    location: { lat: 36.7, lng: 3.0 }
  });

  return (
    <div className="space-y-6 max-h-[65vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-5 text-right">
        <div className="col-span-2">
          <label className="text-[11px] uppercase tracking-wider font-black text-white/30 mb-2 block">اسم المنتج الفلاحي <span className="text-rose-500">*</span></label>
          <input 
            type="text" 
            placeholder="مثال: بطاطس حمراء جبلية"
            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl focus:outline-none focus:border-brand-accent transition-all font-bold text-white shadow-inner text-right"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={isPublishing}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider font-black text-white/30 mb-2 block">السعر (دج/كغ) <span className="text-rose-500">*</span></label>
          <input 
            type="number" 
            placeholder="00"
            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl focus:outline-none focus:border-brand-accent transition-all font-bold text-white shadow-inner text-right"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            disabled={isPublishing}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider font-black text-white/30 mb-2 block">التصنيف</label>
          <select 
            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl focus:outline-none focus:border-brand-accent transition-all font-bold text-white appearance-none cursor-pointer shadow-inner text-right"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            disabled={isPublishing}
          >
            <option className="bg-[#0c110d]">خضروات</option>
            <option className="bg-[#0c110d]">فواكه</option>
            <option className="bg-[#0c110d]">بقوليات</option>
            <option className="bg-[#0c110d]">أخرى</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[11px] uppercase tracking-wider font-black text-white/30 mb-2 block">الولاية (مركز الإنتاج)</label>
          <input 
            type="text" 
            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl focus:outline-none focus:border-brand-accent transition-all font-bold text-white shadow-inner text-right"
            value={formData.wilaya}
            onChange={(e) => setFormData({...formData, wilaya: e.target.value})}
            disabled={isPublishing}
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wider font-black text-white/30 mb-3 block">رفع صورة المنتج (جودة عالية) <span className="text-rose-500">*</span></label>
        <ImageUpload 
          onUploadComplete={(url) => setFormData({...formData, imageUrl: url})} 
          className="bg-white/[0.02]"
        />
      </div>

      <div className="flex gap-4 pt-8 mt-4 border-t border-white/5">
        <button 
          onClick={onClose}
          disabled={isPublishing}
          className="flex-1 h-14 rounded-2xl font-black text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          إلغاء العملية
        </button>
        <button 
          onClick={() => onSubmit(formData)}
          disabled={isPublishing || !formData.imageUrl || !formData.name || !formData.price}
          className="flex-[2] bg-brand-success text-brand-bg h-14 rounded-2xl font-black shadow-xl shadow-brand-success/10 disabled:grayscale disabled:opacity-30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري النشر...
            </>
          ) : "نشر العرض الآن"}
        </button>
      </div>
    </div>
  );
}
