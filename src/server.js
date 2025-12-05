import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './libs/db.js';
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { verifyToken } from './middlewares/authMiddleware.js';
import swaggerUI from 'swagger-ui-express';
import YAML from "yaml";
import fs from 'fs';

dotenv.config()
const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cookieParser());

//swagger
const swaggerDocs = YAML.parse(fs.readFileSync("./src/openapi.yaml", "utf-8"));
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(verifyToken);
app.use("/api/user", userRoute);

connectDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log(`- Server: http://localhost:${PORT}\n- Swagger: http://localhost:${PORT}/api-docs`)
    })    
})
