"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "../dictionaries/get-dictionary";

export default function PaiementReussiPage() {
  const [langue, setLangue] = useState("fr");
  const [dict, setDict] = useState({});

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // 1. Détecter la langue au chargement de l'écran
  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("nel_beauty_lang") || "fr";
    setLangue(langueSauvegardee);
  }, []);

  // 2. Charger les bons textes depuis les fichiers JSON
  useEffect(() => {
    getDictionary(langue).then((data) => {
      setDict(data);
    });
  }, [langue]);

  // 3. Communiquer avec Django pour confirmer le paiement et envoyer l'e-mail
  useEffect(() => {
    if (sessionId) {
      fetch(`http://127.0.0.1:8000/api/confirmer-paiement/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then((res) => {
          if (res.ok) {
            console.log("Django a validé la réservation et envoyé le mail avec succès.");
          } else {
            console.error("Erreur renvoyée par le serveur Django lors de la validation.");
          }
        })
        .catch((err) => console.error("Erreur réseau lors de la confirmation :", err));
    }
  }, [sessionId]);

  // Éviter les crashs pendant le chargement du dictionnaire JSON
  if (!dict.paiement_reussi) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center border border-gray-100 flex flex-col items-center">
        
        {/* Rond vert avec le crochet de succès */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-green-600 text-2xl font-bold">✓</span>
        </div>

        {/* Titre de la page */}
        <h1 className="text-3xl font-black text-[#3d2b1f] mb-4">
          {dict.paiement_reussi.titre}
        </h1>

        {/* Message de confirmation */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
          {dict.paiement_reussi.message_principal}
        </p>

        {/* Note d'information pour le salon */}
        <div className="bg-[#f8f1e9] text-[#3d2b1f] p-4 rounded-2xl text-xs font-semibold leading-relaxed mb-8 w-full">
          {dict.paiement_reussi.note_salon}
        </div>

        {/* Bouton de retour */}
        <Link href="/" className="w-full">
          <button className="w-full bg-[#3d2b1f] hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all text-sm shadow-md">
            {dict.paiement_reussi.bouton_retour}
          </button>
        </Link>
      </div>
    </main>
  );
}