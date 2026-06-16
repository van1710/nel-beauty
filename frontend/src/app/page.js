"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "./dictionaries/get-dictionary";
import Footer from "./components/Footer";

export default function Home() {
  const [coiffures, setCoiffures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // --- ÉTATS POUR LES FILTRES ---
  const [categorieFiltre, setCategorieFiltre] = useState("TOUT");
  const [triPrix, setTriPrix] = useState("DEFAUT");

  // --- AJOUT AVIS : ÉTATS POUR LES POP-UPS ---
  const [coiffurePourLireAvis, setCoiffurePourLireAvis] = useState(null);
  const [coiffurePourLaisserAvis, setCoiffurePourLaisserAvis] = useState(null);

  // --- AJOUT I18N : ÉTATS POUR LA LANGUE PERSISTANTE ---
  const [langue, setLangue] = useState("fr"); // État initial temporaire avant hydratation client
  const [t, setT] = useState(null); 

  // --- MAPPAGE DES IMAGES ---
  const imageMap = {
    "Knotless (Tresses sans noeuds)": "/coiffure/knotless_braids.jpeg",
    "Knotless Braids Medium": "/coiffure/knotless_braids.jpeg",
    "Bantu Knots": "/coiffure/bantu_knots.jpeg",
    "Crochet Braids": "/coiffure/crochet_braids.jpeg",
    "Boho Knotless Braids": "/coiffure/boho_kontless.jpeg",
    "Flat Twists (Vanilles Couchées)": "/coiffure/flat_twist.jpeg",
    "Lemonade Braids": "/coiffure/lemonade_braids.jpeg",
    "Senegalese Twists (Vannilles)": "/coiffure/senegalese_braids.jpeg",
    "Soft Locs Mi-longues": "/coiffure/soft_locs.jpeg",
    "Stitch Braids": "/coiffure/stitch_braids.jpeg",
    "Tissage Ouvert (Leave-out)": "/coiffure/tissage_ouvert.jpeg",
    "Afro Puff Silk Press": "/coiffure/bantu_knots.jpeg",
    "Tissage Fermé \"Body Wave\"": "/coiffure/tissage_ouvert.jpeg",
    "Finger Coils": "/coiffure/flat_twist.jpeg",
    "Updo Afro Chic": "/coiffure/bantu_knots.jpeg",
    "Sleek Ponytail avec Extensions": "/coiffure/lemonade_braids.jpeg",
    "Crochet Braids (Water Wave)": "/coiffure/crochet_braids.jpeg",
  };

  // --- DICTIONNAIRE DE TRADUCTION DES COIFFURES ---
  const translationMap = {
    "Knotless (Tresses sans noeuds)": {
      en: { nom: "Knotless Braids", desc: "Beautiful knotless braids, lightweight and protective for your hair." },
      fr: { nom: "Knotless (Tresses sans noeuds)", desc: "De magnifiques tresses sans nœuds, légères et protectrices pour vos cheveux." }
    },
    "Bantu Knots": {
      en: { nom: "Bantu Knots", desc: "Traditional and stylish Bantu Knots for a bold natural look." },
      fr: { nom: "Bantu Knots", desc: "Bantu Knots traditionnels et élégants pour un look naturel affirmé." }
    },
    "Crochet Braids (Water Wave)": {
      en: { nom: "Crochet Braids (Water Wave)", desc: "Quick and gorgeous protective style with water wave texture." },
      fr: { nom: "Crochet Braids (Water Wave)", desc: "Style protecteur rapide et magnifique avec une texture ondulée." }
    },
    "Senegalese Twists (Vannilles)": {
      en: { nom: "Senegalese Twists", desc: "Classic Senegalese twists, elegant and long-lasting." },
      fr: { nom: "Senegalese Twists (Vannilles)", desc: "Vanilles sénégalaises classiques, élégantes et durables." }
    },
    "Flat Twists (Vanilles Couchées)": {
      en: { nom: "Flat Twists", desc: "Perfect protective flat twists for natural hair care." },
      fr: { nom: "Flat Twists (Vanilles Couchées)", desc: "Vanilles couchées protectrices parfaites pour prendre soin des cheveux naturels." }
    },
    "Boho Knotless Braids": {
      en: { nom: "Boho Knotless Braids", desc: "Trendy knotless braids with curly bohemian wavy ends." },
      fr: { nom: "Boho Knotless Braids", desc: "Tresses sans nœuds tendances avec des mèches bouclées style bohème." }
    },
    "Tissage Ouvert (Leave-out)": {
      en: { nom: "Partial Weave (Leave-out)", desc: "Natural looking partial weave blending with your own hair." },
      fr: { nom: "Tissage Ouvert (Leave-out)", desc: "Tissage partiel au rendu très naturel qui se mélange avec vos propres cheveux." }
    },
    "Stitch Braids": {
      en: { nom: "Stitch Braids", desc: "Sharp and clean lines stitch braids for a perfect look." },
      fr: { nom: "Stitch Braids", desc: "Tresses plaquées aux lignes nettes et précises pour un look impeccable." }
    },
    "Soft Locs Mi-longues": {
      en: { nom: "Mid-Length Soft Locs", desc: "Lightweight, natural-looking soft locs with a beautiful texture." },
      fr: { nom: "Soft Locs Mi-longues", desc: "Fausses locks légères et ultra-naturelles avec une magnifique texture." }
    },
    "Lemonade Braids": {
      en: { nom: "Lemonade Braids", desc: "Stunning side-swept braided style inspired by iconic trends." },
      fr: { nom: "Lemonade Braids", desc: "Superbe style de tresses sur le côté inspiré des dernières tendances." }
    }
  };

  // 1. CHARGEMENT DE LA LANGUE DEPUIS LE LOCALSTORAGE AU DEMARRAGE
  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("nel_beauty_lang") || "fr";
    setLangue(langueSauvegardee);
  }, []);

  // 2. CHARGEMENT DU DICTIONNAIRE LORS DU CHANGEMENT DE LANGUE
  useEffect(() => {
    async function chargerTraductions() {
      const dict = await getDictionary(langue);
      setT(dict);
    }
    chargerTraductions();
  }, [langue]);

  // 3. RECUPERATION DES DONNEES
  useEffect(() => {
    async function fetchCoiffures() {
      try {
        const res = await fetch("http://localhost:8000/api/produits/");
        if (!res.ok) throw new Error("Erreur de connexion");
        const data = await res.json();
        setCoiffures(data);
      } catch (error) {
        console.error("Erreur :", error);
        setErreur("Impossible de charger le catalogue.");
      } finally {
        setChargement(false);
      }
    }
    fetchCoiffures();
  }, []);

  // Fonction pour changer de langue et assurer la persistance
  const changerLangue = (nouvelleLangue) => {
    setLangue(nouvelleLangue);
    localStorage.setItem("nel_beauty_lang", nouvelleLangue); // 👑 Sauvegarde le choix !
  };

  // --- LOGIQUE DE FILTRE ET TRI ---
  const coiffuresFiltrées = coiffures
    .filter((c) => {
      const catProduit = (c.type || c.categorie || "").trim().toUpperCase();
      const filtreNettoyé = categorieFiltre.trim().toUpperCase();
      return filtreNettoyé === "TOUT" || catProduit.includes(filtreNettoyé);
    })
    .sort((a, b) => {
      if (triPrix === "PETIT_GRAND") return parseFloat(a.prix) - parseFloat(b.prix);
      if (triPrix === "GRAND_PETIT") return parseFloat(b.prix) - parseFloat(a.prix);
      return 0;
    });

  const getImagePath = (nomDjango) => {
    return imageMap[nomDjango] || "https://via.placeholder.com/400x300/8b5a2b/ffffff?text=Photo+Disponible";
  };

  if (!t) return <div className="text-center mt-20">Loading / Chargement...</div>;
  if (chargement) return <div className="text-center mt-20">Chargement du salon...</div>;
  if (erreur) return <div className="text-center mt-20 text-red-500">{erreur}</div>;

  return (
    <main className="min-h-screen bg-[#faf8f5] font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 bg-white shadow-sm border-b border-gray-100">
        <h1 className="text-3xl font-extrabold text-[#3d2b1f] tracking-tight text-center">Nel Beauty</h1>
        
        <div className="flex gap-6 items-center">
          {/* --- LE BOUTON DISCRET FR | EN MAINTENANT PERSISTANT --- */}
          <div className="flex items-center gap-1 text-xs font-bold tracking-widest text-gray-400">
            <button 
              onClick={() => changerLangue("fr")} 
              className={`hover:text-[#8b5a2b] transition ${langue === "fr" ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]" : ""}`}
            >
              FR
            </button>
            <span>|</span>
            <button 
              onClick={() => changerLangue("en")} 
              className={`hover:text-[#8b5a2b] transition ${langue === "en" ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]" : ""}`}
            >
              EN
            </button>
          </div>

          <Link href="/register" className="text-[#8b5a2b] font-bold hover:underline text-sm">
            {t.nav.register}
          </Link>
          <Link href="/login">
            <button className="bg-[#8b5a2b] text-white px-6 py-2 rounded-full font-bold hover:bg-[#6b4423] transition shadow-sm">
              {t.nav.login}
            </button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-black text-[#3d2b1f] mb-4">{t.home.title}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.home.subtitle}</p>
        </header>

        {/* --- BARRE DE FILTRE & TRI --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 border-b border-gray-200 pb-1">
          <div className="flex flex-wrap justify-center gap-4">
            {["TOUT", "TRESSE", "NAPPY", "TISSAGE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieFiltre(cat)}
                className={`px-6 py-2 text-[16px] font-bold tracking-[0.2em] transition-all duration-300 ${
                  categorieFiltre === cat
                    ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]"
                    : "text-gray-400 hover:text-[#3d2b1f]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative border-b border-gray-300">
            <select
              value={triPrix}
              onChange={(e) => setTriPrix(e.target.value)}
              className="appearance-none bg-transparent pr-8 pl-2 py-2 text-xs font-bold uppercase tracking-widest text-[#3d2b1f] outline-none cursor-pointer focus:border-[#8b5a2b]"
            >
              <option value="DEFAUT">Trier par : Nouveautés</option>
              <option value="PETIT_GRAND">Prix : plus petit au plus grand</option>
              <option value="GRAND_PETIT">Prix : plus grand au plus petit</option>
            </select>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400">▼</span>
          </div>
        </div>

        {/* --- GRILLE DE PRODUITS --- */}
        {!chargement && !erreur && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {coiffuresFiltrées.map((coiffure) => (
              <div key={coiffure.id} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100 mb-6 shadow-sm">
                  <img
                    src={getImagePath(coiffure.nom)} 
                    alt={coiffure.nom || "Style"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8b5a2b]">
                      {coiffure.type || coiffure.categorie || "Style"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 flex-grow flex flex-col">
                  <h3 className="text-2xl font-bold text-[#3d2b1f] group-hover:text-[#8b5a2b] transition-colors">
                    {translationMap[coiffure.nom?.trim()]?.[langue]?.nom || coiffure.nom}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {translationMap[coiffure.nom?.trim()]?.[langue]?.desc || coiffure.description || "Aucune description disponible."}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-dashed border-gray-200 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500 font-bold">★</span>
                      <span className="text-gray-700 font-bold text-xs">
                        {coiffure.avis && coiffure.avis.length > 0 
                          ? (coiffure.avis.reduce((acc, curr) => acc + curr.note, 0) / coiffure.avis.length).toFixed(1)
                          : "5.0"}
                      </span>
                      <span className="text-gray-400 text-xs">
                        ({coiffure.avis ? coiffure.avis.length : 0})
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setCoiffurePourLireAvis(coiffure)}
                        className="text-[#8b5a2b] font-semibold hover:underline text-xs"
                      >
                        {langue === "fr" ? `Lire (${coiffure.avis ? coiffure.avis.length : 0})` : `Read (${coiffure.avis ? coiffure.avis.length : 0})`}
                      </button>
                      <button 
                        onClick={() => setCoiffurePourLaisserAvis(coiffure)}
                        className="bg-[#f8f1e9] text-[#8b5a2b] px-3 py-1 rounded-full font-bold text-xs hover:bg-[#ecdccb] transition"
                      >
                        ✍️ {langue === "fr" ? "Noter" : "Rate"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-end mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {langue === "fr" ? "À partir de" : "Starting from"}
                      </span>
                      <span className="text-3xl font-black text-[#3d2b1f]">{coiffure.prix} $</span>
                    </div>
                    <Link 
                      href={`/reserver/${coiffure.id}`} 
                      className="bg-[#3d2b1f] text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      {langue === "fr" ? "Réserver" : "Book Now"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!chargement && coiffuresFiltrées.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 italic">
              {langue === "fr" ? "Aucun modèle ne correspond à votre sélection." : "No models match your selection."}
            </p>
          </div>
        )}
      </div>

      {/* --- POP-UP POUR LIRE LES AVIS --- */}
      {coiffurePourLireAvis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setCoiffurePourLireAvis(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-[#3d2b1f] mb-4">
              {langue === "fr" ? "Avis clients — " : "Customer reviews — "}
              {translationMap[coiffurePourLireAvis.nom?.trim()]?.[langue]?.nom || coiffurePourLireAvis.nom}
            </h3>
            <div className="space-y-4">
              {coiffurePourLireAvis.avis && coiffurePourLireAvis.avis.length > 0 ? (
                coiffurePourLireAvis.avis.map((a, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-800 text-sm">{a.nom_cliente}</span>
                      <span className="text-yellow-500 text-xs">{"★".repeat(a.note)}</span>
                    </div>
                    <p className="text-gray-600 text-xs italic">"{a.commentaire}"</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic text-center py-6">
                  {langue === "fr" ? "Aucun avis pour le moment. Soyez la première !" : "No reviews yet. Be the first one!"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- POP-UP POUR LAISSER UN AVIS --- */}
      {coiffurePourLaisserAvis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setCoiffurePourLaisserAvis(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
            <h4 className="font-bold text-[#3d2b1f] mb-4 text-lg">
              {langue === "fr" ? "Laisser une note pour : " : "Leave a review for: "}
              {translationMap[coiffurePourLaisserAvis.nom?.trim()]?.[langue]?.nom || coiffurePourLaisserAvis.nom}
            </h4>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData();
                formData.append("produit", coiffurePourLaisserAvis.id);
                formData.append("nom_cliente", e.target.nom.value);
                formData.append("note", e.target.note.value);
                formData.append("commentaire", e.target.commentaire.value);
                
                if (e.target.photo && e.target.photo.files[0]) {
                  formData.append("photo", e.target.photo.files[0]);
                }

                const res = await fetch("http://localhost:8000/api/avis/", {
                  method: "POST",
                  body: formData, 
                });

                if(res.ok) {
                  alert(langue === "fr" ? "Merci beaucoup pour votre avis ! ❤️" : "Thank you so much for your review! ❤️");
                  setCoiffurePourLaisserAvis(null);
                  window.location.reload();
                } else {
                  alert(langue === "fr" ? "Erreur lors de l'envoi de l'avis." : "Error while sending your review.");
                }
              }}
            >
              <input 
                name="nom" 
                type="text" 
                placeholder={langue === "fr" ? "Votre nom" : "Your name"} 
                required 
                className="w-full p-3 border rounded-xl mb-3 text-sm outline-none focus:ring-1 focus:ring-[#8b5a2b]" 
              />
              <select name="note" className="w-full p-3 border rounded-xl mb-3 text-sm outline-none focus:ring-1 focus:ring-[#8b5a2b]">
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
                <option value="2">⭐⭐ (2/5)</option>
                <option value="1">⭐ (1/5)</option>
              </select>
              <textarea 
                name="commentaire" 
                placeholder={langue === "fr" ? "Racontez votre expérience..." : "Tell us about your experience..."} 
                required 
                className="w-full p-3 border rounded-xl mb-3 h-24 text-sm outline-none focus:ring-1 focus:ring-[#8b5a2b]"
              ></textarea>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">
                  {langue === "fr" ? "Ajouter une photo du résultat (optionnel) :" : "Add a photo of the result (optional):"}
                </label>
                <input name="photo" type="file" accept="image/*" className="text-xs text-gray-500 w-full" />
              </div>
              <button type="submit" className="w-full bg-[#8b5a2b] text-white p-3 rounded-xl font-bold text-sm hover:bg-[#3d2b1f] transition">
                {langue === "fr" ? "Publier mon avis" : "Publish my review"}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer langue={langue} />
    </main>
  );
}