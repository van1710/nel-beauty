"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link"; // Import manquant ajouté

export default function MesReservations() {
  const { data: session, status } = useSession();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (status === "loading") {
    return <p className="p-10 text-center text-gray-500">Vérification de votre compte...</p>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 mb-4">Oups ! Vous n'êtes pas connecté.</p>
        <Link href="/login" className="text-blue-500 underline">Retourner à la connexion</Link>
      </div>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[60vh]">
      <h1 className="text-3xl font-black mb-6 text-gray-800">Mes Rendez-vous ✨</h1>
      
      {loading ? (
        <p>Chargement de vos données...</p>
      ) : reservations.length > 0 ? (
        <div className="grid gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="border p-4 rounded-xl shadow-sm bg-white border-l-4 border-l-[#8b5a2b]">
               <p className="font-bold text-lg text-gray-800">{res.coiffure}</p>
               <p className="text-sm text-gray-600">📅 {res.date} à {res.heure}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">
            Vous n'avez aucune réservation prévue pour le moment. 😊
          </p>
          <Link 
            href="/" 
            className="inline-block mt-4 bg-[#8b5a2b] hover:bg-[#6d4622] text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Prendre un rendez-vous
          </Link>
        </div>
      )}
    </main>
  );
}