import app from "./app.js";
import { getEnv } from "./config/env.js";
 const env = getEnv();
 
const port =  env.PORT || 3000 
   app.get("/health", (req, res) => {
     res.json({ status: "ok" });
   });
app.listen(Number(port), '0.0.0.0',()=> {
console.log(`App is ruuning on ${port}`)
})
