import express from "express";
import cors from "cors";
import router from "./router.js";

const app = express();

app.use(cors());
app.use(express.json());

// rotas
app.use(router);

// porta do Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});