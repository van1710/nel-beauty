"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-green-100">
        
        {/* Icône de succès animée */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-3xl font-black text-[#3d2b1f] mb-4">Paiement Réussi !</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Merci pour votre confiance. Votre acompte a été bien reçu et votre créneau pour <strong>Nel Beauty</strong> est désormais réservé. 
        </p>

        <div className="bg-[#f8f1e9] p-4 rounded-2xl mb-8 text-sm text-[#8b5a2b] font-medium">
          Un e-mail de confirmation vous a été envoyé. Le reste du paiement se fera directement au salon.
        </div>

        <Link 
          href="/" 
          className="block w-full bg-[#3d2b1f] text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}