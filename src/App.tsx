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
  User as UserIcon,
  ShoppingBag,
  Filter,
  ArrowLeftRight,
  ChevronRight,
  MoreVertical,
  Loader2,
  MessageCircle,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageUpload } from "./components/ImageUpload";
import { SupplyMap } from "./components/SupplyMap";
import { PriceTrackingChart } from "./components/PriceTrackingChart";
import { Product, PriceReport, AppView } from "./lib/types";
import { cn } from "./lib/utils";

export default function App() {
  const [view, setView] = useState<AppView>("marketplace");
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [localUser, setLocalUser] = useState<{ name: string; id: string } | null>(() => {
    const saved = localStorage.getItem("farmer_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const login = () => {
    const name = prompt("يرجى إدخال اسمك (كفلاح أو تاجر):");
    if (name && name.trim()) {
      const newUser = { name, id: "local_" + Date.now() };
      setLocalUser(newUser);
      localStorage.setItem("farmer_user", JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setLocalUser(null);
    localStorage.removeItem("farmer_user");
  };

  // Fetch Data from Local API
  const fetchData = async () => {
    try {
      const [productsRes, reportsRes] = await Promise.all([
        fetch("/api/products").catch(() => null),
        fetch("/api/reports").catch(() => null)
      ]);
      
      let productsData = [];
      let reportsData = [];

      if (productsRes && productsRes.ok) productsData = await productsRes.json();
      if (reportsRes && reportsRes.ok) reportsData = await reportsRes.json();
      
      // Fallback to localStorage if API is unavailable (e.g. on pure static hosts like Vercel)
      const localProducts = JSON.parse(localStorage.getItem("local_products") || "[]");
      const combinedProducts = [...productsData, ...localProducts];

      setProducts(combinedProducts.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setReports(reportsData.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Last resort fallback
      const localProducts = JSON.parse(localStorage.getItem("local_products") || "[]");
      setProducts(localProducts);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for updates
    return () => clearInterval(interval);
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleDownloadNewsletter = () => {
    // ... same as before
    const prices = [
      { name: 'بطاطا', price: 65 },
      { name: 'بصل', price: 40 },
      { name: 'طماطم', price: 80 },
      { name: 'فلفل', price: 110 }
    ];
    
    try {
      // Create CSV content with UTF-8 BOM for Excel Arabic support
      const csvContent = "\uFEFF" + "المنتج,السعر (دج)\n" + prices.map(e => `${e.name},${e.price}`).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute('download', `نشرة_أسعار_الغذاء_${new Date().toLocaleDateString('ar-DZ')}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Delay for mobile browsers
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }, 0);
      
      console.log("Download triggered successfully");
    } catch (err) {
      console.error("Failed to download newsletter:", err);
      alert("عذراً، فشل تحميل النشرة. يرجى المحاولة لاحقاً.");
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const addProduct = async (formData: any) => {
    if (!formData.name || !formData.price || (!formData.imageUrl && (!formData.images || formData.images.length === 0))) {
      alert("يرجى ملء الاسم، السعر، ورفع الصورة");
      return;
    }

    setIsPublishing(true);
    try {
      const newProduct = {
        ...formData,
        price: Number(formData.price),
        farmerId: localUser?.id || "guest_" + Math.random().toString(36).substr(2, 9),
        farmerName: localUser?.name || "فلاح مساهم",
        available: true,
        location: { lat: 36.7538, lng: 3.0588 },
        images: formData.images || [formData.imageUrl],
        comments: [],
        createdAt: Date.now()
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      }).catch(() => null);

      if (response && response.ok) {
        setIsModalOpen(false);
        fetchData();
        alert("✅ تم نشر عرضك بنجاح!");
      } else {
        // Fallback for Vercel/Static hosting
        const localProducts = JSON.parse(localStorage.getItem("local_products") || "[]");
        localStorage.setItem("local_products", JSON.stringify([newProduct, ...localProducts]));
        setIsModalOpen(false);
        fetchData();
        alert("✅ تم الحفظ بنجاح (وضع محلي)! ملاحظة: في Vercel المنشورات تظهر لك فقط.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ عذراً، فشل النشر.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddButtonClick = () => {
    setIsModalOpen(true);
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
            {localUser ? (
              <div className="flex items-center gap-3 bg-brand-success/10 p-1 pr-4 rounded-full border border-brand-success/20 shadow-sm group relative">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-brand-success leading-none">{localUser.name}</span>
                  <span className="text-[8px] text-brand-success font-black uppercase tracking-tighter mt-1">FARMER MODE</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-success/20 border-2 border-brand-success/50 flex items-center justify-center">
                  <UserIcon className="text-brand-success" size={20} />
                </div>
                <button 
                  onClick={logout}
                  className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-xl"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-brand-accent text-brand-bg px-5 h-10 rounded-xl font-black flex items-center gap-2 hover:bg-brand-accent/90 transition-all text-xs"
              >
                <UserIcon size={16} /> دخول الفلاحين
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
            className="mr-auto hidden sm:flex bg-brand-accent text-brand-bg px-6 py-3 rounded-2xl font-black hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20 items-center gap-2 text-sm active:scale-95 border-b-4 border-brand-accent/20"
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
                  <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
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
                    <button 
                      onClick={handleDownloadNewsletter}
                      className="w-full mt-8 py-4 text-brand-success text-xs font-black uppercase tracking-widest border border-brand-success/30 rounded-2xl hover:bg-brand-success/10 transition-all active:scale-95"
                    >
                      تحميل النشرة
                    </button>
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-brand-bg/90 backdrop-blur-md"
            />
            <ProductDetailModal 
              product={products.find(p => p.id === selectedProduct.id) || selectedProduct} 
              onClose={() => setSelectedProduct(null)}
              onUpdate={fetchData}
              localUser={localUser}
            />
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

const ProductCard: React.FC<{ product: Product, onClick?: () => void }> = ({ product, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "bg-brand-card rounded-[28px] overflow-hidden shadow-2xl shadow-black/50 transition-all border border-white/5 flex flex-col group min-h-[420px]",
        onClick && "cursor-pointer"
      )}
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
            <UserIcon size={18} />
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
    images: [] as string[],
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
          onUploadComplete={(urls) => setFormData({...formData, images: urls, imageUrl: urls[0]})} 
          className="bg-white/[0.02]"
          multiple={true}
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
          disabled={isPublishing || (!formData.imageUrl && (!formData.images || formData.images.length === 0)) || !formData.name || !formData.price}
          className="flex-[2] bg-brand-success text-brand-bg h-14 rounded-2xl font-black shadow-xl shadow-brand-success/10 disabled:grayscale disabled:opacity-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري النشر...
            </>
          ) : !formData.imageUrl && formData.name && formData.price ? (
            "يرجى رفع الصورة للمواصلة"
          ) : "نشر العرض الآن"}
        </button>
      </div>
    </div>
  );
}

const ProductDetailModal: React.FC<{ 
  product: Product, 
  onClose: () => void,
  onUpdate: () => void,
  localUser: { name: string; id: string } | null
}> = ({ product, onClose, onUpdate, localUser }) => {
  const [activeImage, setActiveImage] = useState(product.images?.[0] || product.imageUrl);
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  const images = product.images || [product.imageUrl];

  const handleSendComment = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch(`/api/products/${product.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localUser?.id || "guest_" + Math.random().toString(36).substr(2, 5),
          userName: localUser?.name || "مستخدم",
          text: text
        }),
      });
      if (response.ok) {
        setComment("");
        onUpdate();
      }
    } catch (err) {
      console.error("Error sending comment:", err);
      alert("فشل إرسال التعليق");
    } finally {
      setIsSending(false);
    }
  };

  const quickMessages = [
    "هل هذا المنتج متوفر؟",
    "كم السعر النهائي؟",
    "أين يمكنني الاستلام؟",
    "هل توفرون خدمة التوصيل؟"
  ];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="relative bg-brand-sidebar w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-30 p-2 bg-black/50 text-white rounded-full backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all font-bold"
      >
        <ChevronRight size={24} className="rotate-180" />
      </button>

      {/* Gallery Section */}
      <div className="md:w-1/2 h-[300px] md:h-auto bg-black relative flex flex-col">
        <img 
          src={activeImage} 
          className="w-full h-full object-cover" 
          alt={product.name}
          referrerPolicy="no-referrer"
        />
        
        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-2 scrollbar-none z-20">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(img)}
                className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                  activeImage === img ? "border-brand-accent scale-110" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="md:w-1/2 p-8 md:p-10 flex flex-col h-full overflow-y-auto bg-brand-sidebar text-right">
        <div className="flex items-center gap-3 mb-4 justify-start flex-row-reverse">
          <span className="px-3 py-1 bg-brand-success/10 text-brand-success text-[10px] font-black rounded-full border border-brand-success/20 uppercase tracking-widest">{product.category}</span>
          <span className="flex items-center gap-1 text-[10px] text-white/30 font-black uppercase tracking-widest"><MapPin size={12} /> {product.wilaya}</span>
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 leading-tight italic">{product.name}</h2>
        <div className="flex items-baseline gap-2 mb-8 justify-start flex-row-reverse">
          <span className="text-4xl font-black text-brand-accent">{product.price} دج</span>
          <span className="text-sm font-bold text-white/30 italic">/ كغ (جملة)</span>
        </div>

        <div className="space-y-8 flex flex-col flex-1">
          {/* Quick Messages */}
          <div>
            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">رسالة سريعة للبائع</h4>
            <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
              {quickMessages.map((msg, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendComment(msg)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/70 hover:bg-brand-success/10 hover:text-brand-success hover:border-brand-success/30 transition-all active:scale-95"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">التعليقات والمناقشات</h4>
            <div className="space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-[150px]">
              {(product.comments || []).length > 0 ? (
                product.comments?.map((c) => (
                  <div key={c.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                    <div className="flex justify-between items-center mb-1 flex-row-reverse">
                      <span className="text-[10px] font-black text-brand-accent">{c.userName}</span>
                      <span className="text-[8px] text-white/20">{new Date(c.createdAt).toLocaleTimeString('ar-DZ')}</span>
                    </div>
                    <p className="text-xs text-white/70 font-medium leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-white/10 text-xs italic font-bold">لا توجد تعليقات بعد، كن أول من يسأل</p>
              )}
            </div>

            <div className="relative mt-auto pt-4">
              <input 
                type="text" 
                placeholder="اكتب سؤالك هنا..." 
                className="w-full bg-white/5 border border-white/10 h-12 pr-5 pl-14 rounded-2xl focus:outline-none focus:border-brand-accent transition-all text-sm font-medium text-right"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment(comment)}
              />
              <button 
                onClick={() => handleSendComment(comment)}
                disabled={isSending || !comment.trim()}
                className="absolute left-1.5 top-1/2 translate-y-[2px] w-10 h-10 bg-brand-accent text-brand-bg rounded-xl flex items-center justify-center hover:bg-brand-accent/90 transition-all active:scale-90 disabled:opacity-30"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
