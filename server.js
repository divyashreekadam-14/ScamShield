const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const path=require("path");
const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const dotenv=require("dotenv");
const connectDB=require("./config/db");
const scanRoutes=require("./routes/scanRoutes");
const reportRoutes=require("./routes/reportRoutes");
const errorHandler=require("./middleware/errorHandler");

dotenv.config();

const app=express();
const PORT=process.env.PORT||5000;
const frontendPath=path.join(__dirname,"..","frontend");

connectDB();

app.use(helmet({
    crossOriginResourcePolicy:{policy:"cross-origin"}
}));

app.use(cors({
    origin:true,
    methods:["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders:["Content-Type"]
}));

app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({extended:true,limit:"10kb"}));

const apiLimiter=rateLimit({
    windowMs:15*60*1000,
    max:100,
    standardHeaders:true,
    legacyHeaders:false,
    message:{
        success:false,
        message:"Too many requests. Please try again later."
    }
});

app.use("/api",apiLimiter);

app.use("/frontend",express.static(frontendPath));
app.use("/html5-qrcode",express.static(path.join(__dirname,"node_modules","html5-qrcode")));

app.get("/",(req,res)=>{
    res.sendFile(path.join(frontendPath,"index.html"));
});

app.get("/api/health",(req,res)=>{
    res.json({
        success:true,
        message:"ScamShield API is running",
        timestamp:new Date().toISOString()
    });
});

app.use("/api/scans",scanRoutes);
app.use("/api/reports",reportRoutes);

app.use((req,res)=>{
    res.status(404).json({
        success:false,
        message:"Route not found"
    });
});

app.use(errorHandler);

app.listen(PORT,"0.0.0.0",()=>{
    console.log(`🛡️ ScamShield server running on port ${PORT}`);
    console.log(`🌐 Desktop: http://localhost:${PORT}`);
    console.log(`📱 Phone: http://192.168.31.126:${PORT}`);
});
