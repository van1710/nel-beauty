"use client";
import { useState } from "react";

export default function Footer({ langue }) {
  const [showModal, setShowModal] = useState(false);
  
  // --- ÉTATS POUR L'ANNULATION ---
  const [emailAnnul, setEmailAnnul] = useState("");
  const [numCmd, setNumCmd] = useState("");
  const [enChargement, setEnChargement] = useState(false);

  const mapUrl = "https://www.google.com/maps/search/?api=1&query=801+Promenade+de+l+Aviation+Ottawa+ON+K1K+4R3";

  // On force la variable en minuscules au cas où page.js envoie "FR" ou "EN"
  const langueCode = langue ? langue.toLowerCase() : "fr";

  // --- DICTIONNAIRE DE TRADUCTION ---
  const t = {
    fr: {
      description: "Spécialiste en tresses à Ottawa-Gatineau. Sublimer votre beauté naturelle est notre passion.",
      btnAnnuler: "Annuler une réservation",
      nousTrouver: "Nous trouver",
      infosPratiques: "Infos Pratiques",
      lunVen: "Lun-Ven :",
      samedi: "Samedi :",
      dimanche: "Dimanche :",
      noteAnnulation: "* Annulation gratuite jusqu'à 24h avant. Passé ce délai, l'acompte est conservé.",
      titreModal: "Annulation",
      sousTitreModal: "Règle des 24h applicable",
      placeholderEmail: "Email utilisé lors de la réservation",
      placeholderCmd: "Numéro de commande (ex: #1234)",
      btnVerif: "Vérifier l'annulation",
      chargement: "Vérification...",
      alerteChamps: "Veuillez remplir tous les champs.",
      alerteErreurReseau: "Impossible de joindre le serveur Django."
    },
    en: {
      description: "Braid specialist in Ottawa-Gatineau. Enhancing your natural beauty is our passion.",
      btnAnnuler: "Cancel a reservation",
      nousTrouver: "Find us",
      infosPratiques: "Practical Info",
      lunVen: "Mon-Fri:",
      samedi: "Saturday:",
      dimanche: "Sunday:",
      noteAnnulation: "* Free cancellation up to 24h before. After this delay, the deposit is kept.",
      titreModal: "Cancellation",
      sousTitreModal: "24-hour rule applies",
      placeholderEmail: "Email used during booking",
      placeholderCmd: "Order number (e.g., NB-A1B2C3)",
      btnVerif: "Verify cancellation",
      chargement: "Checking...",
      alerteChamps: "Please fill in all fields.",
      alerteErreurReseau: "Unable to reach the Django server."
    }
  };

  // Sélection de la langue active
  const text = t[langueCode] || t.fr;

  // --- FONCTION D'ANNULATION ---
  const verifierAnnulation = async () => {
    if (!emailAnnul || !numCmd) {
      alert(text.alerteChamps);
      return;
    }

    setEnChargement(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/verifier-annulation/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailAnnul, 
          numero_commande: numCmd,
          langue: langueCode // Transmet la langue au backend Django pour l'e-mail bilingue
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        // Alerte bilingue claire mentionnant l'envoi du courriel
        alert(
          langueCode === "en" 
            ? "Success: Your cancellation has been confirmed. A confirmation email has been sent to you with your refund details." 
            : "Succès : Annulation confirmée. Un e-mail de confirmation vous a été envoyé avec les détails de votre remboursement."
        );
        setShowModal(false);
        setEmailAnnul("");
        setNumCmd("");
      } else {
        const msgParDefaut = langueCode === "en" 
          ? "Reservation not found or deadline exceeded." 
          : "Réservation introuvable ou délai dépassé.";
        alert((langueCode === "en" ? "Error: " : "Erreur : ") + (data.message || msgParDefaut));
      }
    } catch (error) {
      alert(text.alerteErreurReseau);
    } finally {
      setEnChargement(false);
    }
  };

  return (
    <footer className="bg-[#3d2b1f] text-[#f8f1e9] pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* 1. Identité & Annulation */}
        <div>
          <h3 className="text-2xl font-black mb-4 italic text-white">Nel Beauty</h3>
          <p className="text-sm opacity-70 leading-relaxed mb-6">
            {text.description}
          </p> 
          <button 
            onClick={() => setShowModal(true)}
            className="text-xs border border-amber-500/50 text-amber-500 px-4 py-2 rounded-full hover:bg-amber-500 hover:text-[#3d2b1f] transition-all font-bold uppercase tracking-widest"
          >
            {text.btnAnnuler}
          </button>
        </div>

        {/* 2. Contact & Adresse */}
        <div>
          <h4 className="font-bold mb-6 uppercase tracking-widest text-sm text-amber-500 underline decoration-amber-500/30 underline-offset-8">
            {text.nousTrouver}
          </h4>
          <ul className="text-sm space-y-4 opacity-80 font-medium">
            <li>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start hover:text-amber-300 transition-colors">
                <span className="mr-3 text-lg">📍</span> 
                86 RUE FRONT, Gatineau, QC, J9H 6E9
              </a>
            </li>
            <li>
              <div className="flex items-start">
                <span className="mr-3 text-lg">📞</span>
                <div className="flex flex-col space-y-1">
                  <a href="tel:+18196655961" className="hover:text-amber-300 transition-colors">+1 (819) 665-5961</a>
                  <a href="tel:+18195807355" className="hover:text-amber-300 transition-colors">+1 (819) 580-7355</a>
                </div>
              </div>
            </li>
            <li>
              <a href="mailto:contact@nelbeauty.ca" className="flex items-center hover:text-amber-300 transition-colors">
                <span className="mr-3 text-lg">✉️</span>
                nelbeauty86@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* 3. Politique & Horaires */}
        <div>
          <h4 className="font-bold mb-6 uppercase tracking-widest text-sm text-amber-500 underline decoration-amber-500/30 underline-offset-8">
            {text.infosPratiques}
          </h4>
          <ul className="text-sm space-y-3 opacity-80">
            <li className="flex justify-between font-bold text-white">
              <span>{text.lunVen}</span> <span>16h00 - 18h00</span>
            </li>
            <li className="flex justify-between font-bold text-white">
              <span>{text.samedi}</span> <span>8h00 - 16h00</span>
            </li>
            <li className="flex justify-between font-bold text-white">
              <span>{text.dimanche}</span> <span>8h00 - 16h00</span>
            </li>
            <li className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-[11px] leading-tight italic text-amber-200">
              {text.noteAnnulation}
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center">
        <p className="text-[10px] opacity-40 uppercase tracking-[0.2em]">
          © 2026 Nel Beauty | Vanel Blaise-Socrate
        </p>
      </div>

      {/* --- MODAL DE FORMULAIRE D'ANNULATION --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white text-[#3d2b1f] p-8 rounded-3xl max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black mb-2 italic">{text.titreModal}</h2>
            <p className="text-xs text-gray-500 mb-6 font-medium uppercase tracking-tight">{text.sousTitreModal}</p>
            
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder={text.placeholderEmail} 
                value={emailAnnul}
                onChange={(e) => setEmailAnnul(e.target.value)}
                className="w-full p-4 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
              />
              <input 
                type="text" 
                placeholder={text.placeholderCmd} 
                value={numCmd}
                onChange={(e) => setNumCmd(e.target.value)}
                className="w-full p-4 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
              />
              <button 
                onClick={verifierAnnulation}
                disabled={enChargement}
                className={`w-full ${enChargement ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3d2b1f] hover:bg-black'} text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all`}
              >
                {enChargement ? text.chargement : text.btnVerif}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}