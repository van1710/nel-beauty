"use client";
import { useState } from "react";
import { signIn } from "next-auth/react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chargement, setChargement] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setChargement(true);
    
    try {
      // Connexion via NextAuth
      const result = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false, 
      });

      if (result?.error) {
        alert("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      } else {
        alert("Bienvenue chez Nel Beauty !");
        // On utilise replace pour forcer le rafraîchissement de la session
        window.location.replace("/mes-reservations");
      }
    } catch (error) {
      alert("Erreur : Impossible de joindre le service d'authentification.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border">
        <h1 className="text-3xl font-black text-center mb-8 text-gray-800">Connexion</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 border rounded-xl bg-blue-50 outline-none focus:ring-2 focus:ring-[#8b5a2b]" 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-[#8b5a2b]" 
            required 
          />
          
          <button 
            type="submit" 
            disabled={chargement}
            className={`w-full ${chargement ? 'bg-gray-400' : 'bg-[#8b5a2b] hover:bg-[#3d2b1f]'} text-white py-4 rounded-xl font-bold text-lg transition`}
          >
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            onClick={() => {
                const mail = prompt("Entrez votre email pour recevoir un mot de passe temporaire :");
                if(mail) {
                    fetch("http://127.0.0.1:8000/api/reset-password/", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({ email: mail })
                    })
                    .then(res => {
                      if(res.ok) alert("Vérifiez vos mails ! Un code temporaire a été envoyé.");
                      else alert("Utilisateur non trouvé.");
                    });
                }
            }}
            className="text-sm text-gray-500 hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Pas de compte ? 
            <Link href="/register" className="font-bold text-black hover:underline ml-1">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}