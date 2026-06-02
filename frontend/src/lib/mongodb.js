import mongoose from "mongoose";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connecté à MongoDB avec succès !");
  } catch (error) {
    console.log("Erreur de connexion à MongoDB : ", error);
  }
};