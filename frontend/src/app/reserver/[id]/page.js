"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReservationPage() {
  const params = useParams(); 
  const [coiffure, setCoiffure] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [datesOccupees, setDatesOccupees] = useState([]); // 👈 Stockage des RDV déjà pris

  const aujourdhui = new Date().toISOString().split('T')[0];

  // 1. Récupération des détails de la coiffure ET des créneaux occupés
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch de la coiffure
        const resCoiffure = await fetch(`http://localhost:8000/api/produits/${params.id}/`);
        const dataCoiffure = await resCoiffure.json();
        setCoiffure(dataCoiffure);

        // Fetch des dates occupées
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
      alert("⚠️ Choisis d'abord une date et une heure !");
      return;
    }

    setChargement(true);
    try {
      const response = await fetch("http://localhost:8000/api/creer-session-paiement/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit_id: params.id, date, heure }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe : " + (data.error || "Impossible de créer la session"));
      }
    } catch (error) {
      alert("Erreur réseau lors de la connexion au paiement.");
    } finally {
      setChargement(false);
    }
  };

  if (chargement && !coiffure) return <div className="text-center mt-20">Chargement de votre séance...</div>;
  if (!coiffure) return <div className="text-center mt-20">Modèle introuvable.</div>;

  const prixBase = parseFloat(coiffure.prix);
  const prixApresPromo = prixBase * 0.70;
  const montantAcompte = (prixApresPromo * 0.30).toFixed(2);
  const resteAPayer = (prixApresPromo - montantAcompte).toFixed(2);

  return (
    <main className="min-h-screen bg-[#faf8f5] p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border mb-12">
        
        {/* Gauche : Détails Prix */}
        <div className="md:w-1/2 bg-[#f8f1e9] p-10">
          <Link href="/" className="text-[#8b5a2b] font-bold mb-8 inline-block">← Retour</Link>
          <h1 className="text-4xl font-black text-[#3d2b1f] mb-4">{coiffure.nom_fr || coiffure.nom}</h1>
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
             <div className="flex justify-between text-red-600 font-bold">
               <span>Prix avec Promo (-30%) :</span>
               <span>{prixApresPromo.toFixed(2)} $</span>
             </div>
             <div className="bg-[#3d2b1f] text-white p-4 rounded-xl flex justify-between items-center">
               <span>Acompte (30%) :</span>
               <span className="text-2xl font-black">{montantAcompte} $</span>
             </div>
             <p className="text-xs text-gray-400 text-center uppercase tracking-tighter">Reste à payer au salon : {resteAPayer} $</p>
          </div>
        </div>

        {/* Droite : Formulaire */}
        <div className="md:w-1/2 p-10 bg-white">
          <h2 className="text-2xl font-bold mb-8 text-gray-800">Votre Rendez-vous</h2>
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
                {date ? "Choisir l'heure" : "Sélectionnez d'abord une date"}
              </option>
              
              {date && (() => {
                const dateSelectionnee = new Date(date + "T00:00:00");
                const jourSemaine = dateSelectionnee.getDay(); 
                const estWeekend = jourSemaine === 0 || jourSemaine === 6;

                // Liste des heures selon le jour
                const listeHeures = estWeekend 
                  ? ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
                  : ["16:00", "17:00", "18:00"];

                return listeHeures.map(h => {
                  // 2. On vérifie si la combinaison Date + Heure exacte existe dans l'API
                  const estPris = datesOccupees.includes(`${date}T${h}`);

                  return (
                    <option key={h} value={h} disabled={estPris}>
                      {h} {estPris ? " (Déjà réservé - Complet)" : " (Disponible)"}
                    </option>
                  );
                });
              })()}
            </select>

            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 shadow-sm italic">
              Annulation gratuite jusqu'à 24h avant le RDV. Passé ce délai, l'acompte est conservé.
            </div>

            <button 
              onClick={payerAcompte} 
              disabled={!date || !heure || chargement} 
              className="w-full bg-[#8b5a2b] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#3d2b1f] transition shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {chargement ? "Connexion..." : `Payer l'acompte (${montantAcompte} $)`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}