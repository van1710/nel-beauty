import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. On récupère les données envoyées par ton formulaire React (nom, email, motDePasse, et la langue active)
    const { email, motDePasse, langue } = await request.json();

    const langueActive = langue || "fr";

    // 2. ON APPELLE TON BACKEND DJANGO (Port 8000) au lieu de MongoDB
    const res = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: motDePasse,
        langue: langueActive, // On transmet la langue à Django pour le mail !
      }),
    });

    const data = await res.json();

    // 3. Si Django renvoie une erreur (ex: l'utilisateur existe déjà)
    if (!res.ok) {
      return NextResponse.json(
        { message: data.error || (langueActive === "en" ? "An error occurred." : "Une erreur est survenue.") },
        { status: res.status }
      );
    }

    // 4. On renvoie le signal de succès reçu de Django
    return NextResponse.json(
      { message: langueActive === "en" ? "Account created successfully!" : "Utilisateur créé avec succès !" }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.log("Erreur dans la passerelle API register : ", error);
    return NextResponse.json(
      { message: "Impossible de joindre le serveur Django." },
      { status: 500 }
    );
  }
}