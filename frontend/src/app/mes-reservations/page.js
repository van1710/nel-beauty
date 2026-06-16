"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
// 👑 On importe le helper que tu as déjà dans ton projet !
import { getDictionary } from "../dictionaries/get-dictionary";

export default function MesReservations() {
  const { data: session, status } = useSession();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Gestion de la langue et du dictionnaire
  const [langue, setLangue] = useState("fr");
  const [dict, setDict] = useState({});

  // 1. Charger la langue DEPUIS le localStorage au montage
  useEffect(() => {
    const langueSauvegardee = localStorage.getItem("nel_beauty_lang") || "fr";
    setLangue(langueSauvegardee);
  }, []);

  // 2. Utiliser ton fichier get-dictionary pour charger les textes de manière propre
  useEffect(() => {
    getDictionary(langue).then((data) => {
      setDict(data);
    });
  }, [langue]);

  // 3. Récupération des réservations de l'utilisateur connecté
  useEffect(() => {
    if (status === "authenticated") {
      fetch("http://127.0.0.1:8000/api/mes-reservations/", {
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          setReservations(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  // Éviter les crashs pendant que le dictionnaire charge
  if (!dict.mes_reservations) {
    return <p className="p-10 text-center text-gray-500">Chargement...</p>;
  }

  if (status === "loading") {
    return <p className="p-10 text-center text-gray-500">{dict.mes_reservations.verification_compte}</p>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 mb-4">{dict.mes_reservations.non_connecte}</p>
        <Link href="/login" className="text-blue-500 underline">
          {dict.mes_reservations.retour_connexion}
        </Link>
      </div>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[60vh]">
      <h1 className="text-3xl font-black mb-6 text-gray-800">
        {dict.mes_reservations.titre} ✨
      </h1>
      
      {loading ? (
        <p>{dict.mes_reservations.chargement_donnees}</p>
      ) : reservations.length > 0 ? (
        <div className="grid gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="border p-4 rounded-xl shadow-sm bg-white border-l-4 border-l-[#8b5a2b]">
               <p className="font-bold text-lg text-gray-800">
                 {langue === "en" && res.coiffure_en ? res.coiffure_en : res.coiffure}
               </p>
               <p className="text-sm text-gray-600">
                 📅 {res.date} {dict.mes_reservations.a} {res.heure}
               </p>
               <p className="text-xs text-gray-400 mt-1">Ref: {res.numero}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">
            {dict.mes_reservations.aucune_reservation} 😊
          </p>
          <Link 
            href="/" 
            className="inline-block mt-4 bg-[#8b5a2b] hover:bg-[#6d4622] text-white px-6 py-3 rounded-xl font-bold transition"
          >
            {dict.mes_reservations.bouton_rdv}
          </Link>
        </div>
      )}
    </main>
  );
}