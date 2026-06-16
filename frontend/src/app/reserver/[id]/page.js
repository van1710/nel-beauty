"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "../../dictionaries/get-dictionary"; // 👑 Utilisation de ton helper

export default function ReservationPage() {
  const params = useParams(); 
  const [coiffure, setCoiffure] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [datesOccupees, setDatesOccupees] = useState([]); 
  
  // États pour la gestion bilingue
  const [langue, setLangue] = useState("fr");
  const [dict, setDict] = useState({});

  const aujourdhui = new Date().toISOString().split('T')[0];

  // 1. Charger la langue depuis le localStorage au montage de la page
  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("nel_beauty_lang") || "fr";
    setLangue(langueSauvegardee);
  }, []);

  // 2. Charger le dictionnaire de traduction correspondant
  useEffect(() => {
    getDictionary(langue).then((data) => {
      setDict(data);
    });
  }, [langue]);

  // 3. Récupération des détails de la coiffure et des créneaux occupés
  useEffect(() => {
    async function fetchData() {
      try {
        const resCoiffure = await fetch(`http://localhost:8000/api/produits/${params.id}/`);
        const dataCoiffure = await resCoiffure.json();
        setCoiffure(dataCoiffure);

        const resDates = await fetch("http://localhost:8000/api/dates-occupees/");
        const dataDates = await resDates.json();
        setDatesOccupees(dataDates.datesOccupees || []);

        setChargement(false);
      } catch (error) {
        console.error("Erreur de chargement", error);
        setChargement(false);
      }
    }
    fetchData();
  }, [params.id]);

  const payerAcompte = async () => {
    if (!date || !heure) {
      alert(langue === "en" ? "⚠️ Please choose a date and time first!" : "⚠️ Choisis d'abord une date et une heure !");
      return;
    }

    setChargement(true);
    try {
      const response = await fetch("http://localhost:8000/api/creer-session-paiement/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          produit_id: params.id, 
          date, 
          heure,
          langue: langue // 👑 TRANSMISSION CRITIQUE : Envoie la langue à Django pour Stripe et l'e-mail !
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe : " + (data.error || "Impossible de créer la session"));
      }
    } catch (error) {
      alert(langue === "en" ? "Network error during payment connection." : "Erreur réseau lors de la connexion au paiement.");
    } finally {
      setChargement(false);
    }
  };

  // Attendre le chargement complet du dictionnaire pour éviter tout crash au rendu
  if (!dict.reservation) return <div className="text-center mt-20">Loading...</div>;

  if (chargement && !coiffure) return <div className="text-center mt-20">{dict.reservation.chargement_seance}</div>;
  if (!coiffure) return <div className="text-center mt-20">{dict.reservation.modele_introuvable}</div>;

  const prixBase = parseFloat(coiffure.prix);
  const prixApresPromo = prixBase * 0.70;
  const montantAcompte = (prixApresPromo * 0.30).toFixed(2);
  const resteAPayer = (prixApresPromo - montantAcompte).toFixed(2);

  return (
    <main className="min-h-screen bg-[#faf8f5] p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border mb-12">
        
        {/* Gauche : Détails Prix */}
        <div className="md:w-1/2 bg-[#f8f1e9] p-10">
          <Link href="/" className="text-[#8b5a2b] font-bold mb-8 inline-block">
            {dict.reservation.retour}
          </Link>
          <h1 className="text-4xl font-black text-[#3d2b1f] mb-4">
            {langue === "en" && coiffure.nom_en ? coiffure.nom_en : (coiffure.nom_fr || coiffure.nom)}
          </h1>
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
             <div className="flex justify-between text-red-600 font-bold">
               <span>{dict.reservation.prix_promo} :</span>
               <span>{prixApresPromo.toFixed(2)} $</span>
             </div>
             <div className="bg-[#3d2b1f] text-white p-4 rounded-xl flex justify-between items-center">
               <span>{dict.reservation.acompte} :</span>
               <span className="text-2xl font-black">{montantAcompte} $</span>
             </div>
             <p className="text-xs text-gray-400 text-center uppercase tracking-tighter">
               {dict.reservation.reste_payer} : {resteAPayer} $
             </p>
          </div>
        </div>

        {/* Droite : Formulaire */}
        <div className="md:w-1/2 p-10 bg-white">
          <h2 className="text-2xl font-bold mb-8 text-gray-800">{dict.reservation.votre_rdv}</h2>
          <div className="space-y-6">
            
            {/* Sélecteur de date */}
            <input 
              type="date" 
              min={aujourdhui} 
              className="w-full p-4 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#8b5a2b]" 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                setHeure(""); 
              }} 
            />

            {/* Sélecteur d'heures dynamique avec blocage */}
            <select 
              className="w-full p-4 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#8b5a2b]" 
              value={heure} 
              disabled={!date} 
              onChange={(e) => setHeure(e.target.value)}
            >
              <option value="">
                {date ? dict.reservation.choisir_heure : dict.reservation.selectionner_date}
              </option>
              
              {date && (() => {
                const dateSelectionnee = new Date(date + "T00:00:00");
                const jourSemaine = dateSelectionnee.getDay(); 
                const estWeekend = jourSemaine === 0 || jourSemaine === 6;

                const listeHeures = estWeekend 
                  ? ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
                  : ["16:00", "17:00", "18:00"];

                return listeHeures.map(h => {
                  const estPris = datesOccupees.includes(`${date}T${h}`);

                  return (
                    <option key={h} value={h} disabled={estPris}>
                      {h} {estPris ? ` - ${dict.reservation.deja_reserve}` : ""}
                    </option>
                  );

 
                });
              })()}
            </select>

            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 shadow-sm italic">
              {dict.reservation.note_annulation}
            </div>

            <button 
              onClick={payerAcompte} 
              disabled={!date || !heure || chargement} 
              className="w-full bg-[#8b5a2b] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#3d2b1f] transition shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {chargement ? dict.reservation.connexion : `${dict.reservation.bouton_payer} (${montantAcompte} $)`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}