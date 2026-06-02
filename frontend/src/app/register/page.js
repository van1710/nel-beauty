"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Pour rediriger l'utilisateur après

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chargement, setChargement] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setChargement(true);

    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          password: password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Compte créé ! Un mail de confirmation a été envoyé à " + email);
        router.push("/login"); // Redirection vers la connexion
      } else {
        alert(data.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (error) {
      alert("Impossible de contacter le serveur Django.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border">
        <h1 className="text-3xl font-black text-center mb-8 text-gray-800">Inscription</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 border rounded-xl bg-blue-50 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            disabled={chargement}
            className={`w-full ${chargement ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-4 rounded-xl font-bold text-lg transition`}
          >
            {chargement ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Déjà un compte ? 
            <Link href="/login" className="font-bold text-black hover:underline ml-1">Se connecter</Link>
          </p>
        </div>
      </div>
    </main>
  );
}