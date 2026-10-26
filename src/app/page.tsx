'use client';
import {useEffect, useMemo, useState} from 'react';
import {
    ArrowRight,
    Check,
    ChevronDown,
    ClipboardList,
    Instagram,
    Lock,
    LogOut,
    Menu,
    Minus,
    Package,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Trash2,
    Upload,
    UserRound,
    X
} from 'lucide-react';
import type {User} from '@supabase/supabase-js';
import {configured, supabase} from '../lib/supabase';
import {fabrics, gsmOptions, Product, Selection, starterProducts} from '../lib/data';

const currency = (n: number | null) => n === null ? 'Price on request' : 'From ₹' + Number(n).toLocaleString('en-IN');
const makeKey = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
export default function Home() {
    const [products, setProducts] = useState<Product[]>(starterProducts), [category, setCategory] = useState('All'), [search, setSearch] = useState(''), [cart, setCart] = useState<Selection[]>([]), [selected, setSelected] = useState<Product | null>(null), [drawer, setDrawer] = useState(false), [authOpen, setAuthOpen] = useState(false), [authMode, setAuthMode] = useState<'login' | 'signup'>('login'), [email, setEmail] = useState(''), [authTab, setAuthTab] = useState<'email' | 'phone'>('email'), [otpPhone, setOtpPhone] = useState(''), [otpCode, setOtpCode] = useState(''), [otpSent, setOtpSent] = useState(false), [password, setPassword] = useState(''), [user, setUser] = useState<User | null>(null), [admin, setAdmin] = useState(false), [adminOpen, setAdminOpen] = useState(false), [loading, setLoading] = useState(false), [notice, setNotice] = useState(''), [submitted, setSubmitted] = useState(false), [mobile, setMobile] = useState(false);
    const [fabric, setFabric] = useState(fabrics[0]), [gsm, setGsm] = useState(180), [color, setColor] = useState('Navy Blue'), [size, setSize] = useState('Mixed sizes'), [quantity, setQuantity] = useState(50), [printing, setPrinting] = useState('Front chest logo'), [notes, setNotes] = useState('');
    const [organization, setOrganization] = useState(''), [contactName, setContactName] = useState(''), [phone, setPhone] = useState(''), [deliveryLocation, setDeliveryLocation] = useState(''), [inquiryNotes, setInquiryNotes] = useState(''), [artwork, setArtwork] = useState<File | null>(null);
    const [inquiries, setInquiries] = useState<any[]>([]), [myOrders, setMyOrders] = useState<any[]>([]), [ordersOpen, setOrdersOpen] = useState(false), [ordersLoading, setOrdersLoading] = useState(false), [editProduct, setEditProduct] = useState<Partial<Product>>({}), [upload, setUpload] = useState<File | null>(null), [editing, setEditing] = useState(false);
    const total = cart.reduce((sum, x) => sum + x.quantity, 0);
    const filtered = useMemo(() => products.filter(p => p.active && (category === 'All' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
    const alertUser = (message: string) => {
        setNotice(message);
        window.setTimeout(() => setNotice(''), 5500)
    };

    async function loadProducts() {
        if (!supabase) return;
        const {data, error} = await supabase.from('products').select('*').order('created_at', {ascending: true});
        if (!error && data) setProducts(data as Product[])
    }

    async function loadAdmin(u: User | null) {
        if (!supabase || !u) {
            setAdmin(false);
            return;
        }
        const {data} = await supabase.from('profiles').select('role').eq('id', u.id).single();
        setAdmin(data?.role === 'admin')
    }

    useEffect(() => {
        try {
            const saved = localStorage.getItem('mark-fashion-cart');
            if (saved) setCart(JSON.parse(saved))
        } catch {
        }
        ;
        if (!supabase) return;
        loadProducts();
        supabase.auth.getUser().then(({data}) => {
            setUser(data.user);
            loadAdmin(data.user)
        });
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            loadAdmin(session?.user || null)
        });
        return () => subscription.unsubscribe()
    }, []);
    useEffect(() => {
        localStorage.setItem('mark-fashion-cart', JSON.stringify(cart))
    }, [cart]);

    async function openMyOrders() {
        if (!user || !supabase) {
            setAuthOpen(true);
            return;
        }
        setOrdersOpen(true);
        setOrdersLoading(true);
        const {
            data,
            error
        } = await supabase.from('inquiries').select('id,created_at,status,items,contact_name,organization,delivery_location,notes').eq('user_id', user.id).order('created_at', {ascending: false});
        setOrdersLoading(false);
        if (error) {
            alertUser('Unable to load your inquiries: ' + error.message);
            return;
        }
        setMyOrders(data || [])
    }

    function openCustomize(p: Product) {
        setSelected(p);
        setFabric(fabrics[0]);
        setGsm(180);
        setColor('Navy Blue');
        setSize('Mixed sizes');
        setQuantity(50);
        setPrinting('Front chest logo');
        setNotes('')
    }

    function addToCart() {
        if (!selected || quantity < 1) {
            alertUser('Enter a valid quantity.');
            return;
        }
        setCart(prev => [...prev, {
            key: makeKey(),
            product: selected,
            fabric,
            gsm,
            color,
            size,
            quantity,
            printing,
            notes
        }]);
        setSelected(null);
        setDrawer(true);
        alertUser('Added to your inquiry cart')
    }

    async function signIn(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase) {
            alertUser('Authentication is not configured yet. Connect Supabase to enable customer and admin login.');
            return;
        }
        setLoading(true);
        const result = authMode === 'signup' ? await supabase.auth.signUp({
            email,
            password
        }) : await supabase.auth.signInWithPassword({email, password});
        setLoading(false);
        if (result.error) {
            alertUser(result.error.message);
            return;
        }
        if (authMode === 'signup' && !result.data.session) {
            alertUser('Check your email to confirm your account before logging in.');
            return;
        }
        setAuthOpen(false);
        alertUser('You are signed in. You can now submit inquiries.')
    }

    async function googleLogin() {
        if (!supabase) {
            alertUser('Configure Supabase first.');
            return;
        }
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {redirectTo: window.location.origin}
        });
        if (error) alertUser(error.message)
    }

    async function submitInquiry() {
        if (!supabase) {
            alertUser('Live inquiry submission requires Supabase configuration.');
            return;
        }
        if (!user) {
            setDrawer(false);
            setAuthOpen(true);
            alertUser('Please log in to contact the manufacturer.');
            return;
        }
        if (!cart.length) return;
        if (!contactName.trim() || !phone.trim()) {
            alertUser('Enter your contact name and phone number.');
            return;
        }
        setLoading(true);
        let artworkUrl: string | null = null;
        if (artwork) {
            const safe = artwork.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${user.id}/${makeKey()}-${safe}`;
            const {error} = await supabase.storage.from('artwork').upload(path, artwork, {upsert: false});
            if (error) {
                setLoading(false);
                alertUser('Artwork upload failed: ' + error.message);
                return;
            }
            artworkUrl = path
        }
        const payload = {
            user_id: user.id,
            contact_name: contactName,
            phone,
            organization,
            delivery_location: deliveryLocation,
            notes: inquiryNotes,
            artwork_path: artworkUrl,
            items: cart.map(x => ({
                product_id: x.product.id,
                product_name: x.product.name,
                fabric: x.fabric,
                gsm: x.gsm,
                color: x.color,
                size: x.size,
                quantity: x.quantity,
                printing: x.printing,
                notes: x.notes,
                quoted_price_at_request: x.product.price_from
            }))
        };
        const {error} = await supabase.from('inquiries').insert(payload);
        setLoading(false);
        if (error) {
            alertUser('Could not send inquiry: ' + error.message);
            return;
        }
        setCart([]);
        setDrawer(false);
        setArtwork(null);
        setInquiryNotes('');
        setSubmitted(true);
        setMyOrders([])
    }

    async function openAdmin() {
        if (!admin) {
            alertUser('Admin access is restricted.');
            return;
        }
        setAdminOpen(true);
        await refreshInquiries()
    }

    async function refreshInquiries() {
        if (!supabase) return;
        const {data, error} = await supabase.from('inquiries').select('*').order('created_at', {ascending: false});
        if (error) alertUser(error.message); else setInquiries(data || [])
    }

    async function saveProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase || !admin) return;
        setLoading(true);
        let image_url = editProduct.image_url || '/products/corporate.webp';
        if (upload) {
            const path = `products/${makeKey()}-${upload.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const {error} = await supabase.storage.from('product-images').upload(path, upload);
            if (error) {
                setLoading(false);
                alertUser(error.message);
                return;
            }
            image_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
        }
        const payload = {
            name: editProduct.name || '',
            category: editProduct.category || 'T-Shirts',
            description: editProduct.description || '',
            price_from: editProduct.price_from ?? null,
            active: editProduct.active ?? true,
            image_url
        };
        const result = editing && editProduct.id ? await supabase.from('products').update(payload).eq('id', editProduct.id) : await supabase.from('products').insert(payload);
        setLoading(false);
        if (result.error) {
            alertUser(result.error.message);
            return;
        }
        setEditProduct({});
        setUpload(null);
        setEditing(false);
        await loadProducts();
        alertUser('Product saved')
    }

    async function deleteProduct(id: string) {
        if (!supabase || !admin || !confirm('Remove this product from the catalogue?')) return;
        const {error} = await supabase.from('products').delete().eq('id', id);
        if (error) alertUser(error.message); else await loadProducts()
    }

    async function updateStatus(id: string, status: string) {
        if (!supabase || !admin) return;
        const {error} = await supabase.from('inquiries').update({status}).eq('id', id);
        if (error) alertUser(error.message); else await refreshInquiries()
    }

    return <>
        <header className="site-header">
            <div className="shell nav"><a href="#home" className="brand"><span className="brand-mark">M<span
                className="brand-slash">✓</span></span><span><strong>MARK FASHION</strong><small>CONTIGO EM TODO LADO</small></span></a>
                <nav className={mobile ? 'links show' : 'links'}><a onClick={() => setMobile(false)}
                                                                    href="#collection">Collection</a><a
                    onClick={() => setMobile(false)} href="#custom">Custom Orders</a><a onClick={() => setMobile(false)}
                                                                                        href="#fabrics">Fabric
                    Library</a><a onClick={() => setMobile(false)} href="#about">About Us</a></nav>
                <div className="nav-actions">{user &&
                    <button className="login-link orders-nav" onClick={openMyOrders}><ClipboardList size={17}/> My
                        Orders</button>}{admin &&
                    <button className="icon-btn" title="Admin dashboard" onClick={openAdmin}><Settings size={20}/>
                    </button>}
                    <button className="login-link"
                            onClick={() => user ? supabase?.auth.signOut() : setAuthOpen(true)}>{user ? <><LogOut
                        size={17}/> Sign out</> : <><UserRound size={17}/> Login</>}</button>
                    <button className="cart-btn" onClick={() => setDrawer(true)} aria-label="Open inquiry cart">
                        <ShoppingBag size={20}/><span>{cart.length}</span></button>
                    <button className="icon-btn mobile-menu" onClick={() => setMobile(!mobile)}><Menu/></button>
                </div>
            </div>
        </header>
        <main>
            <section className="hero" id="home">
                <div className="shell hero-grid">
                    <div className="hero-copy"><span className="eyebrow gold">CUSTOM APPAREL MANUFACTURING</span>
                        <h1>Made for your <em>identity.</em></h1><p>From everyday essentials to teamwear that stands
                            out. Premium T-shirts, polos and jerseys, crafted around your vision.</p>
                        <div className="hero-buttons"><a className="btn gold-btn" href="#collection">Explore
                            Collection <ArrowRight size={18}/></a><a className="btn outline-light" href="#custom">Customize
                            Your Order</a></div>
                        <div className="hero-bottom">
                            <div><strong>06</strong><span>Fabric references</span></div>
                            <div><strong>05</strong><span>GSM options</span></div>
                            <div><strong>100%</strong><span>Made to your spec</span></div>
                        </div>
                    </div>
                    <div className="hero-art"><img src="/products/hero.png"
                                                   alt="Blue custom MARK FASHION sports polo on mannequin"/>
                        <div className="hero-sticker"><span>YOUR DESIGN</span><strong>OUR CRAFT</strong></div>
                    </div>
                </div>
            </section>
            <section className="feature-bar">
                <div className="shell feature-grid"><span><Package
                    size={20}/> Custom Manufacturing</span><span><ClipboardList
                    size={20}/> Bulk Order Inquiries</span><span><ShieldCheck
                    size={20}/> Fabric & GSM Selection</span><span><Check size={20}/> Printing & Finishing</span></div>
            </section>
            <section className="section shell" id="collection">
                <div className="section-heading">
                    <div><span className="eyebrow">THE COLLECTION</span><h2>Find your perfect fit.</h2><p>Explore our
                        manufacturing styles and create an inquiry with your specifications.</p></div>
                    <div className="search-box"><Search size={17}/><input value={search}
                                                                          onChange={e => setSearch(e.target.value)}
                                                                          placeholder="Search products"
                                                                          aria-label="Search products"/></div>
                </div>
                <div className="tabs">{['All', 'T-Shirts', 'Polos', 'Jerseys', 'Custom Printing'].map(x => <button
                    key={x} className={category === x ? 'active' : ''}
                    onClick={() => setCategory(x)}>{x}</button>)}</div>
                <div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}>
                    <div className="product-image"><img src={p.image_url} alt={p.name}/><span
                        className="product-tag">{p.category}</span></div>
                    <div className="product-info"><h3>{p.name}</h3><p>{p.description}</p>
                        <div className="product-bottom"><span>{currency(p.price_from)}</span>
                            <button onClick={() => openCustomize(p)}>Customize <ArrowRight size={16}/></button>
                        </div>
                    </div>
                </article>)}</div>
                {filtered.length === 0 && <p className="empty">No products match your search.</p>}</section>
            <section className="custom-section" id="custom">
                <div className="shell custom-grid">
                    <div><span className="eyebrow gold">FOR COLLEGES, CLUBS & BUSINESSES</span><h2>Your vision.<br/><em>Made
                        wearable.</em></h2><p>Planning a college fest, corporate uniform, club jersey or team
                        collection? Choose a style, select your fabric and GSM, and send us the details for a
                        personalized quotation.</p>
                        <div className="steps"><span><b>01</b> Choose your garment</span><span><b>02</b> Select fabric, GSM & artwork</span><span><b>03</b> Add to inquiry cart</span><span><b>04</b> Sign in & request quotation</span>
                        </div>
                        <a href="#collection" className="btn gold-btn">Start Customizing <ArrowRight size={17}/></a>
                    </div>
                    <div className="custom-image"><img src="/products/branded-polo.webp"
                                                       alt="Custom branded polo shirt"/>
                        <div className="floating-note">BUILT AROUND<br/><strong>YOUR SPECIFICATION</strong></div>
                    </div>
                </div>
            </section>
            <section className="section shell" id="fabrics">
                <div className="section-heading">
                    <div><span className="eyebrow">FABRIC LIBRARY</span><h2>The fabric makes the difference.</h2>
                        <p>Choose from six fabric references, with garment weights of 160, 180, 200, 210 and 220
                            GSM.</p></div>
                </div>
                <div className="fabric-grid">{fabrics.map((f, i) => <div className="fabric-tile" key={f}><span
                    className="fabric-num">0{i + 1}</span><img className="fabric-swatch fabric-photo"
                                                               src={`/fabrics/fabric-${i + 1}.png`}
                                                               alt={`${f} fabric sample from MARK FASHION catalogue`}/><strong>{f}</strong><small>Fabric
                    reference</small></div>)}</div>
                <p className="fineprint">Fabric composition, construction, GSM and finishing must be confirmed against
                    an approved production sample.</p></section>
            <section className="about-section" id="about">
                <div className="shell about-grid">
                    <div><span className="eyebrow">ABOUT MARK FASHION</span><h2>A manufacturing partner built around
                        your specification.</h2></div>
                    <div><p>MARK FASHION manufactures and prints custom T-shirts and jerseys for businesses, teams,
                        events, campaigns and organizations. Our process brings together fabric selection, GSM choice,
                        garment construction, artwork, printing and finishing.</p><a href="#collection"
                                                                                     className="text-link">Discover our
                        collection <ArrowRight size={17}/></a></div>
                </div>
            </section>
        </main>
        <footer>
            <div className="shell footer-grid">
                <div><strong className="footer-logo">MARK FASHION</strong><p>Custom T-shirts • Jerseys • Printing</p>
                    <small>CONTIGO EM TODO LADO</small><a className="contact-phone" href="tel:+919790590980">Call: +91
                        97905 90980</a><a href="mailto:markfashionglobal@gmail.com">Email:
                        markfashionglobal@gmail.com</a><a href="https://wa.me/919790590980" target="_blank"
                                                          rel="noopener noreferrer">WhatsApp: +91 97905 90980</a></div>
                <div><strong>Explore</strong><a href="#collection">Collection</a><a href="#custom">Bulk Orders</a><a
                    href="#fabrics">Fabric Library</a>{user &&
                    <button className="footer-order-link" onClick={openMyOrders}>My Orders</button>}</div>
                <div><strong>Inquiries</strong><p>Choose products, add your specifications to the cart and sign in to
                    send a quotation request.</p></div>
            </div>
            <div className="shell footer-bottom">© {new Date().getFullYear()} MARK FASHION. All rights reserved. <span>Custom apparel manufacturing</span>
            </div>
        </footer>
        {notice && <div className="toast" role="status">{notice}</div>}
        {selected && <div className="overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) setSelected(null)
        }}>
            <div className="modal customize-modal">
                <div className="modal-head">
                    <div><span className="eyebrow">CUSTOMIZE PRODUCT</span><h2>{selected.name}</h2></div>
                    <button className="icon-btn" onClick={() => setSelected(null)}><X/></button>
                </div>
                <div className="config-grid"><img className="config-photo" src={selected.image_url}
                                                  alt={selected.name}/>
                    <div className="form-grid"><label>Fabric<select value={fabric}
                                                                    onChange={e => setFabric(e.target.value)}>{fabrics.map(x =>
                        <option key={x}>{x}</option>)}</select></label><label>Fabric weight (GSM)<select value={gsm}
                                                                                                         onChange={e => setGsm(Number(e.target.value))}>{gsmOptions.map(x =>
                        <option key={x} value={x}>{x} GSM</option>)}</select></label><label>Colour<input value={color}
                                                                                                         onChange={e => setColor(e.target.value)}
                                                                                                         placeholder="e.g. Navy blue"/></label><label>Size
                        / size mix<select value={size}
                                          onChange={e => setSize(e.target.value)}>{['Mixed sizes', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom breakdown in notes'].map(x =>
                            <option key={x}>{x}</option>)}</select></label><label>Quantity<input type="number" min="1"
                                                                                                 value={quantity}
                                                                                                 onChange={e => setQuantity(Number(e.target.value))}/></label><label>Printing<select
                        value={printing}
                        onChange={e => setPrinting(e.target.value)}>{['Front chest logo', 'Front and back printing', 'Full custom graphic', 'No printing', 'Custom placement'].map(x =>
                        <option key={x}>{x}</option>)}</select></label><label className="full">Special
                        instructions<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                              placeholder="Collar style, logo colours, size breakdown, trims..."/></label>
                    </div>
                </div>
                <div className="modal-actions"><span>Final price confirmed by manufacturer</span>
                    <button className="btn dark-btn" onClick={addToCart}>Add to Inquiry Cart <ShoppingBag size={17}/>
                    </button>
                </div>
            </div>
        </div>}
        {drawer && <div className="overlay drawer-overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) setDrawer(false)
        }}>
            <aside className="drawer">
                <div className="drawer-head">
                    <div><span className="eyebrow">YOUR SELECTIONS</span><h2>Inquiry Cart <small>({cart.length})</small>
                    </h2></div>
                    <button className="icon-btn" onClick={() => setDrawer(false)}><X/></button>
                </div>
                <div className="drawer-body">{!cart.length ?
                    <div className="empty-cart"><ShoppingBag size={44}/><h3>Your cart is empty</h3><p>Browse the
                        collection and customize products to get started.</p>
                        <button className="btn dark-btn" onClick={() => setDrawer(false)}>Browse Collection</button>
                    </div> : <>
                        <div className="cart-list">{cart.map(item => <div className="cart-item" key={item.key}><img
                            src={item.product.image_url} alt=""/>
                            <div><h4>{item.product.name}</h4>
                                <p>{item.fabric} · {item.gsm} GSM<br/>{item.color} · {item.size}<br/>{item.printing}</p>
                                <div className="quantity">
                                    <button onClick={() => setCart(prev => prev.map(x => x.key === item.key ? {
                                        ...x,
                                        quantity: Math.max(1, x.quantity - 1)
                                    } : x))}><Minus size={13}/></button>
                                    {item.quantity}
                                    <button onClick={() => setCart(prev => prev.map(x => x.key === item.key ? {
                                        ...x,
                                        quantity: x.quantity + 1
                                    } : x))}><Plus size={13}/></button>
                                    <button className="remove"
                                            onClick={() => setCart(prev => prev.filter(x => x.key !== item.key))}>
                                        <Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>)}</div>
                        <div className="cart-total"><span>Total requested quantity</span><strong>{total} pieces</strong>
                        </div>
                        <div className="inquiry-form"><h3>Contact the manufacturer</h3>{!user &&
                            <div className="login-warning"><Lock size={18}/> Sign in to submit your inquiry. You can
                                complete the details below first.</div>}<label>Contact name *<input value={contactName}
                                                                                                    onChange={e => setContactName(e.target.value)}
                                                                                                    placeholder="Your full name"/></label><label>Phone
                            number *<input value={phone} onChange={e => setPhone(e.target.value)}
                                           placeholder="Phone / WhatsApp"/></label><label>Organization / college /
                            club<input value={organization} onChange={e => setOrganization(e.target.value)}
                                       placeholder="Organization name"/></label><label>Delivery location<input
                            value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)}
                            placeholder="City, state"/></label><label>Artwork / logo (optional)<input type="file"
                                                                                                      accept="image/png,image/jpeg,image/webp,application/pdf,image/svg+xml"
                                                                                                      onChange={e => setArtwork(e.target.files?.[0] || null)}/></label><label>Additional
                            requirements<textarea rows={3} value={inquiryNotes}
                                                  onChange={e => setInquiryNotes(e.target.value)}
                                                  placeholder="Deadline, size breakdown, artwork details..."/></label>
                            <button className="btn dark-btn full-btn" disabled={loading}
                                    onClick={submitInquiry}>{loading ? 'Sending...' : user ? 'Send Inquiry to MARK FASHION' : 'Log in & Request Quote'}
                                <ArrowRight size={17}/></button>
                            <p className="fineprint">Need help? Call <a href="tel:+919790590980">+91 97905 90980</a> or
                                email <a href="mailto:markfashionglobal@gmail.com">markfashionglobal@gmail.com</a>.</p>
                            <p className="fineprint">No online payment. The manufacturer will review and confirm
                                pricing, availability and lead time.</p></div>
                    </>}</div>
            </aside>
        </div>}
        {authOpen && <div className="overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) setAuthOpen(false)
        }}>
            <div className="modal auth-modal">
                <div className="modal-head">
                    <div><span className="eyebrow">CUSTOMER ACCOUNT</span>
                        <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2></div>
                    <button className="icon-btn" onClick={() => setAuthOpen(false)}><X/></button>
                </div>
                <p>Sign in to submit quotation inquiries and contact MARK FASHION.</p>
                <form onSubmit={signIn} className="auth-form"><label>Email address<input type="email" required
                                                                                         value={email}
                                                                                         onChange={e => setEmail(e.target.value)}
                                                                                         placeholder="you@example.com"/></label><label>Password<input
                    type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"/></label>
                    <button disabled={loading} className="btn dark-btn full-btn"
                            type="submit">{loading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
                        <ArrowRight size={17}/></button>
                </form>
                <button className="btn full-btn google-auth" onClick={googleLogin} disabled={loading}>Continue with
                    Google
                </button>
                {<button className="switch-auth"
                         onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}</button>}{!configured &&
                <p className="setup-note">Preview mode: connect Supabase to enable authentication and inquiries.</p>}
            </div>
        </div>}
        {submitted && <div className="overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) setSubmitted(false)
        }}>
            <div className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-success-title">
                <div className="modal-head">
                    <div><span className="eyebrow">INQUIRY RECEIVED</span><h2 id="inquiry-success-title">Inquiry
                        submitted successfully!</h2></div>
                    <button className="icon-btn" aria-label="Close" onClick={() => setSubmitted(false)}><X/></button>
                </div>
                <p>Thank you! MARK FASHION has received your inquiry. For questions or follow-up, contact us at:</p><p>
                <strong><a href="tel:+919790590980">+91 97905 90980</a></strong></p><p><a
                href="mailto:markfashionglobal@gmail.com">markfashionglobal@gmail.com</a></p><p><a
                href="https://wa.me/919790590980" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>
                <button className="btn dark-btn full-btn" onClick={() => setSubmitted(false)}>Done</button>
            </div>
        </div>}
        {ordersOpen && <div className="overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) setOrdersOpen(false)
        }}>
            <div className="modal orders-modal" role="dialog" aria-modal="true" aria-labelledby="orders-title">
                <div className="modal-head">
                    <div><span className="eyebrow">CUSTOMER ACCOUNT</span><h2 id="orders-title">My Orders &
                        Inquiries</h2></div>
                    <button className="icon-btn" aria-label="Close order history" onClick={() => setOrdersOpen(false)}>
                        <X/></button>
                </div>
                <p>Track your quotation requests and their latest status. An inquiry is not a confirmed order until MARK
                    FASHION agrees to the details.</p>{ordersLoading ?
                <p>Loading your inquiries...</p> : myOrders.length === 0 ?
                    <p className="empty">No previous inquiries found for this account.</p> :
                    <div className="order-history">{myOrders.map(order => <article className="order-history-card"
                                                                                   key={order.id}>
                        <div className="order-history-top">
                            <div><strong>Inquiry
                                #{String(order.id).slice(0, 8).toUpperCase()}</strong><small>{new Date(order.created_at).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}</small></div>
                            <span
                                className="order-status">{String(order.status).replace(/^./, (c: string) => c.toUpperCase())}</span>
                        </div>
                        <ul>{(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => <li key={i}>
                            <strong>{item.product_name || 'Custom apparel'}</strong> — {item.quantity} pcs
                            · {item.fabric} · {item.gsm} GSM · {item.color} · {item.size} · {item.printing}</li>)}</ul>
                        {order.delivery_location && <p>Delivery location: {order.delivery_location}</p>}{order.notes &&
                        <p>Notes: {order.notes}</p>}</article>)}</div>}
                <div className="orders-footer"><a href="tel:+919790590980">Questions? Call +91 97905 90980</a>
                    <button className="btn dark-btn" onClick={openMyOrders} disabled={ordersLoading}>Refresh</button>
                </div>
            </div>
        </div>}
        {adminOpen && admin && <div className="overlay admin-overlay">
            <div className="admin-panel">
                <div className="admin-top">
                    <div><span className="eyebrow gold">MANUFACTURER ACCESS</span><h2>Admin Dashboard</h2></div>
                    <button className="icon-btn light-icon" onClick={() => setAdminOpen(false)}><X/></button>
                </div>
                <div className="admin-content">
                    <div className="admin-stats">
                        <div><small>Products</small><strong>{products.length}</strong></div>
                        <div><small>Inquiries</small><strong>{inquiries.length}</strong></div>
                        <div><small>Pending
                            quotes</small><strong>{inquiries.filter(x => x.status === 'new').length}</strong></div>
                    </div>
                    <div className="admin-columns">
                        <section className="admin-box">
                            <div className="admin-box-title"><h3>Manage Products</h3>
                                <button className="small-action" onClick={() => {
                                    setEditing(false);
                                    setEditProduct({active: true});
                                    setUpload(null)
                                }}>+ New Product
                                </button>
                            </div>
                            <div className="admin-products">{products.map(p => <div key={p.id}><img src={p.image_url}
                                                                                                    alt=""/><span><strong>{p.name}</strong><small>{currency(p.price_from)} · {p.active ? 'Visible' : 'Hidden'}</small></span>
                                <button onClick={() => {
                                    setEditing(true);
                                    setEditProduct(p);
                                    setUpload(null)
                                }}>Edit
                                </button>
                                <button title="Delete" onClick={() => deleteProduct(p.id)}><Trash2 size={16}/></button>
                            </div>)}</div>
                            <form className="admin-form" onSubmit={saveProduct}>
                                <h4>{editing ? 'Edit product' : 'Add a product'}</h4><label>Name<input required
                                                                                                       value={editProduct.name || ''}
                                                                                                       onChange={e => setEditProduct({
                                                                                                           ...editProduct,
                                                                                                           name: e.target.value
                                                                                                       })}/></label><label>Category<select
                                value={editProduct.category || 'T-Shirts'} onChange={e => setEditProduct({
                                ...editProduct,
                                category: e.target.value
                            })}>{['T-Shirts', 'Polos', 'Jerseys', 'Custom Printing'].map(x => <option
                                key={x}>{x}</option>)}</select></label><label>Description<textarea rows={2}
                                                                                                   value={editProduct.description || ''}
                                                                                                   onChange={e => setEditProduct({
                                                                                                       ...editProduct,
                                                                                                       description: e.target.value
                                                                                                   })}/></label><label>Indicative
                                price (₹, optional)<input type="number" min="0" value={editProduct.price_from ?? ''}
                                                          onChange={e => setEditProduct({
                                                              ...editProduct,
                                                              price_from: e.target.value === '' ? null : Number(e.target.value)
                                                          })}/></label><label>Product photo<input type="file"
                                                                                                  accept="image/*"
                                                                                                  onChange={e => setUpload(e.target.files?.[0] || null)}/></label><label
                                className="checkbox-line"><input type="checkbox" checked={editProduct.active ?? true}
                                                                 onChange={e => setEditProduct({
                                                                     ...editProduct,
                                                                     active: e.target.checked
                                                                 })}/> Show in catalogue</label>
                                <button className="btn dark-btn" disabled={loading}
                                        type="submit">{loading ? 'Saving...' : 'Save Product'}</button>
                            </form>
                        </section>
                        <section className="admin-box">
                            <div className="admin-box-title"><h3>Customer Inquiries</h3>
                                <button className="small-action" onClick={refreshInquiries}>Refresh</button>
                            </div>
                            {!inquiries.length ? <p className="empty">No inquiries yet.</p> : inquiries.map(x => <div
                                className="inquiry-record" key={x.id}>
                                <div>
                                    <strong>{x.contact_name}</strong><span>{new Date(x.created_at).toLocaleString()}</span>
                                </div>
                                <p>{x.organization || 'Individual'} · {x.phone} · {x.delivery_location || 'Location not provided'}</p>
                                <p><b>Email:</b> {x.customer_email || x.user_id}</p>
                                <ul>{(x.items || []).map((item: any, i: number) => <li
                                    key={i}>{item.quantity} × {item.product_name} — {item.fabric}, {item.gsm} GSM, {item.color}, {item.size}, {item.printing}{item.notes ? ' — ' + item.notes : ''}</li>)}</ul>
                                {x.notes && <p>Notes: {x.notes}</p>}{x.artwork_path &&
                                <ArtworkLink path={x.artwork_path}/>}<label>Status<select value={x.status}
                                                                                          onChange={e => updateStatus(x.id, e.target.value)}>{['new', 'reviewing', 'quoted', 'completed', 'cancelled'].map(s =>
                                <option key={s} value={s}>{s}</option>)}</select></label></div>)}</section>
                    </div>
                </div>
            </div>
        </div>}
    </>
}

function ArtworkLink({path}: { path: string }) {
    const [url, setUrl] = useState('');
    useEffect(() => {
        supabase?.storage.from('artwork').createSignedUrl(path, 120).then(({data}) => setUrl(data?.signedUrl || ''))
    }, [path]);
    return url ? <a href={url} target="_blank" rel="noreferrer">View attached artwork ↗</a> :
        <span>Artwork attached</span>
}
