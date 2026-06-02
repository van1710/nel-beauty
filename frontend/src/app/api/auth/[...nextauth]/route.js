import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},

      async authorize(credentials) {
        // On récupère les infos du formulaire React
        const { email, password } = credentials; 

        try {
          // ON APPELLE TON BACKEND DJANGO (Port 8000)
          const res = await fetch("http://127.0.0.1:8000/api/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: email, // Django utilise 'username'
              password: password,
            }),
          });

          const user = await res.json();
              
          // Si Django répond que c'est OK (Statut 200)
          if (res.ok && user) {
            return {
              id: user.id,
              email: email,
              name: email,
            };
          }

          // Si les identifiants sont faux ou le serveur Django injoignable
          return null; 

        } catch (error) {
          console.log("Erreur de connexion au serveur Django: ", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };