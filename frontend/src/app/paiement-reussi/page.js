"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "../dictionaries/get-dictionary";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [langue, setLangue] = useState("fr");
  const [dict, setDict] = useState<any>({});
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // Évite que Next.js n'exécute le fetch en doublon en mode développement (StrictMode)
  const fetchExecute = useRef(false);

  // 1. Détecter la langue au chargement
  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("nel_beauty_lang") || "fr";
    setLangue(langueSauvegardee);
  }, []);

  // 2. Charger les textes depuis tes fichiers JSON
  useEffect(() => {
    getDictionary(langue).then((data) => {
      setDict(data);
    });
  }, [langue]);

  // 3. Envoyer le session_id à Django pour confirmer le rendez-vous et envoyer le mail
  useEffect(() => {
    if (!sessionId || fetchExecute.current) return;
    
    fetchExecute.current = true;

    async function validerReservation() {
      try {
        // Appelle la route Django avec le préfixe /api/ et le slash '/' obligatoire à la fin
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/confirmer-paiement/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        // Empêche le crash JSON si Django renvoie par accident du HTML (ex: Erreur 404/500)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Le serveur a renvoyé du HTML au lieu de JSON.");
        }

        const data = await res.json();

        if (res.ok && data.status === "success") {
          console.log("Django a confirmé la commande avec succès !");
          setBackendError(false);
        } else {
          console.error("Erreur renvoyée par Django :", data.error);
          setBackendError(true);
        }
      } catch (err) {
        console.error("Erreur réseau ou parsing :", err);
        setBackendError(true);
      } finally {
        setLoadingBackend(false);
      }
    }

    validerReservation();
  }, [sessionId]);

  // Éviter les crashs d'affichage pendant le chargement initial du dictionnaire
  if (!dict.paiement_reussi) {
    return <div className="text-center mt-20 font-medium text-gray-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100 flex flex-col items-center">
        
        {loadingBackend ? (
          /* Écran de transition pendant que Django traite la demande */
          <div className="py-10">
            <div className="w-12 h-12 border-4 border-[#3d2b1f] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-[#3d2b1f] mb-2">Confirmation en cours...</h2>
            <p className="text-gray-500 text-sm">Nous finalisons la sécurisation de votre créneau horaire.</p>
          </div>
        ) : backendError ? (
          /* Affichage en cas de problème de communication ou d'indisponibilité */
          <div className="w-full flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-red-600 text-3xl font-bold">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-red-700 mb-4">Erreur de synchronisation</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-8 font-medium">
              Le paiement a été perçu par Stripe, mais votre salon n'a pas pu valider automatiquement le rendez-vous. Pas d'inquiétude, contactez le support avec votre ID Stripe.
            </p>
            <Link href="/" className="w-full">
              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-md">
                Retour à l'accueil
              </button>
            </Link>
          </div>
        ) : (
          /* Écran final de succès - Tout s'est déroulé à la perfection */
          <div className="w-full flex flex-col items-center">
            {/* Icône de succès */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            {/* Titre traduit */}
            <h1 className="text-3xl font-black text-[#3d2b1f] mb-4">
              {dict.paiement_reussi.titre}
            </h1>

            {/* Message principal traduit */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
              {dict.paiement_reussi.message_principal}
            </p>

            {/* Note informative pour le salon */}
            <div className="bg-[#f8f1e9] text-[#3d2b1f] p-4 rounded-2xl text-xs font-semibold leading-relaxed mb-8 w-full">
              {dict.paiement_reussi.note_salon}
            </div>

            {/* Bouton de retour traduit */}
            <Link href="/" className="w-full">
              <button className="w-full bg-[#3d2b1f] hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all text-sm shadow-md">
                {dict.paiement_reussi.bouton_retour}
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}