const API_BASE="/api";

let qrScanner=null;
let qrScanning=false;
let currentQrContent="";
let currentAnalysis=null;

const $=id=>document.getElementById(id);

const scanInput=$("scanInput");
const charCount=$("charCount");
const analyzeMessageButton=$("analyzeMessageButton");
const scanQrButton=$("scanQrButton");
const heroScanButton=$("heroScanButton");
const scannerSection=$("scanner-section");
const closeScannerButton=$("closeScannerButton");
const cameraError=$("cameraError");
const cameraPanel=$("cameraPanel");
const cameraVideo=$("cameraVideo");
const scannerStatus=$("scannerStatus");
const scannerStatusDot=$("scannerStatusDot");
const torchButton=$("torchButton");
const unsupportedPanel=$("unsupportedPanel");
const manualQrInput=$("manualQrInput");
const analyzeManualQrButton=$("analyzeManualQrButton");
const resultSection=$("result-section");
const resultStatus=$("resultStatus");
const resultTitle=$("resultTitle");
const riskScore=$("riskScore");
const riskLevel=$("riskLevel");
const riskBar=$("riskBar");
const contentType=$("contentType");
const decodedContent=$("decodedContent");
const reasonList=$("reasonList");
const recommendation=$("recommendation");
const virusTotalStatus=$("virusTotalStatus");
const virusTotalStats=$("virusTotalStats");
const vtMalicious=$("vtMalicious");
const vtSuspicious=$("vtSuspicious");
const vtHarmless=$("vtHarmless");
const vtUndetected=$("vtUndetected");
const urlActions=$("urlActions");
const openLinkButton=$("openLinkButton");
const upiDetails=$("upiDetails");
const upiId=$("upiId");
const upiPayee=$("upiPayee");
const upiAmount=$("upiAmount");
const upiCurrency=$("upiCurrency");
const historyList=$("historyList");
const totalScans=$("totalScans");
const lowScans=$("lowScans");
const mediumScans=$("mediumScans");
const highScans=$("highScans");
const criticalScans=$("criticalScans");
const reportButton=$("reportButton");
const toast=$("toast");

function showToast(message){
    if(!toast)return;
    toast.textContent=message;
    toast.classList.remove("hidden");
    clearTimeout(window.toastTimer);
    window.toastTimer=setTimeout(()=>toast.classList.add("hidden"),3500);
}

async function apiRequest(url,options={}){
    const response=await fetch(API_BASE+url,{
        ...options,
        headers:{
            "Content-Type":"application/json",
            ...(options.headers||{})
        }
    });
    const text=await response.text();
    let data={};
    try{
        data=text?JSON.parse(text):{};
    }catch{
        throw new Error("Server returned an invalid response.");
    }
    if(!response.ok){
        throw new Error(data.message||data.error||`Request failed (${response.status})`);
    }
    return data;
}

function setLoading(button,loading,text){
    if(!button)return;
    if(loading){
        button.dataset.originalText=button.textContent;
        button.disabled=true;
        button.textContent=text;
    }else{
        button.disabled=false;
        button.textContent=button.dataset.originalText||button.textContent;
    }
}

function updateCharacterCount(){
    if(scanInput&&charCount)charCount.textContent=scanInput.value.length;
}

function showScanner(){
    if(!scannerSection)return;
    scannerSection.classList.remove("hidden");
    scannerSection.scrollIntoView({behavior:"smooth",block:"start"});
    startQrScanner();
}

async function startQrScanner(){
    stopQrScanner();

    if(typeof Html5Qrcode==="undefined"){
        showCameraError("QR scanner library could not be loaded. Please check your internet connection and refresh the page.");
        return;
    }

    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
        showUnsupported();
        return;
    }

    if(cameraError)cameraError.classList.add("hidden");
    if(unsupportedPanel)unsupportedPanel.classList.add("hidden");
    if(cameraPanel)cameraPanel.classList.remove("hidden");

    let reader=$("qr-reader");

    if(!reader){
        reader=document.createElement("div");
        reader.id="qr-reader";

        if(cameraVideo){
            const wrapper=cameraVideo.parentElement;
            if(wrapper){
                cameraVideo.remove();
                wrapper.insertBefore(reader,wrapper.firstChild);
            }else if(cameraPanel){
                cameraPanel.insertBefore(reader,cameraPanel.firstChild);
            }
        }else if(cameraPanel){
            cameraPanel.insertBefore(reader,cameraPanel.firstChild);
        }
    }

    reader.innerHTML="";
    reader.style.width="100%";

    qrScanner=new Html5Qrcode("qr-reader");

    try{
        scannerStatus.textContent="Starting camera...";
        if(scannerStatusDot)scannerStatusDot.classList.add("active");

        await qrScanner.start(
            {facingMode:"environment"},
            {
                fps:10,
                qrbox:{width:250,height:250},
                aspectRatio:1
            },
            decodedText=>{
                if(qrScanning)return;
                qrScanning=true;
                currentQrContent=decodedText;
                scannerStatus.textContent="QR code detected!";
                stopQrScanner();
                analyzeQrContent(decodedText);
            },
            ()=>{}
        );

        qrScanning=false;
        scannerStatus.textContent="Point your camera at a QR code";
        if(torchButton)torchButton.classList.add("hidden");

        try{
            const cameras=await Html5Qrcode.getCameras();
            if(cameras&&cameras.length>1&&torchButton){
                torchButton.classList.remove("hidden");
            }
        }catch{}

    }catch(error){
        qrScanning=false;
        console.error(error);
        showCameraError("Camera could not start. Please allow camera permission and make sure you are using http://localhost:5000.");
    }
}

async function stopQrScanner(){
    qrScanning=false;

    if(qrScanner){
        try{
            await qrScanner.stop();
        }catch{}
        try{
            qrScanner.clear();
        }catch{}
        qrScanner=null;
    }

    if(scannerStatus)scannerStatus.textContent="QR scanner stopped";
    if(scannerStatusDot)scannerStatusDot.classList.remove("active");
    if(torchButton)torchButton.classList.add("hidden");
}

function closeScanner(){
    stopQrScanner();
    if(scannerSection)scannerSection.classList.add("hidden");
}

function showCameraError(message){
    if(cameraError){
        cameraError.textContent=message;
        cameraError.classList.remove("hidden");
    }
    if(scannerStatus)scannerStatus.textContent="QR scanner unavailable";
    if(scannerStatusDot)scannerStatusDot.classList.remove("active");
}

function showUnsupported(){
    if(cameraPanel)cameraPanel.classList.add("hidden");
    if(unsupportedPanel)unsupportedPanel.classList.remove("hidden");
    if(scannerStatus)scannerStatus.textContent="QR scanner unavailable";
}

async function analyzeMessage(){
    const input=scanInput?scanInput.value.trim():"";

    if(!input){
        showToast("Please enter a message to analyze.");
        return;
    }

    setLoading(analyzeMessageButton,true,"Analyzing...");

    try{
        const data=await apiRequest("/scans",{
            method:"POST",
            body:JSON.stringify({
                input,
                type:"message"
            })
        });

        const analysis=data.analysis||data;
        displayAnalysis(analysis,input,"MESSAGE");
        loadHistory();
        loadStats();
    }catch(error){
        console.error(error);
        showToast(error.message||"Unable to analyze the message.");
    }finally{
        setLoading(analyzeMessageButton,false);
    }
}

async function analyzeQrContent(content){
    if(!content){
        showToast("No QR content was detected.");
        return;
    }

    currentQrContent=content;
    setLoading(analyzeManualQrButton,true,"Analyzing...");

    try{
        const data=await apiRequest("/scans",{
            method:"POST",
            body:JSON.stringify({
                input:content,
                type:"qr"
            })
        });

        const analysis=data.analysis||data;
        displayAnalysis(analysis,content,"QR");
        loadHistory();
        loadStats();

        if(scannerSection)scannerSection.classList.add("hidden");
        if(resultSection)resultSection.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){
        console.error(error);
        showToast(error.message||"QR analysis failed.");
    }finally{
        setLoading(analyzeManualQrButton,false);
    }
}

async function analyzeManualQr(){
    const content=manualQrInput?manualQrInput.value.trim():"";

    if(!content){
        showToast("Please paste QR content first.");
        return;
    }

    await analyzeQrContent(content);
}

function getScore(analysis){
    const value=Number(analysis?.riskScore);
    return Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
}

function getLevel(analysis,score){
    if(analysis?.riskLevel)return String(analysis.riskLevel).toUpperCase();
    if(score>=80)return"CRITICAL";
    if(score>=60)return"HIGH";
    if(score>=30)return"MEDIUM";
    return"LOW";
}

function displayAnalysis(analysis,input,type){
    currentAnalysis=analysis;

    const score=getScore(analysis);
    const level=getLevel(analysis,score);
    const reasons=Array.isArray(analysis?.reasons)?analysis.reasons:[];
    const rec=analysis?.recommendation||getRecommendation(level);
    const urls=Array.isArray(analysis?.extractedUrls)?analysis.extractedUrls:[];

    if(resultSection)resultSection.classList.remove("hidden");

    if(riskScore)riskScore.textContent=score;
    if(riskLevel)riskLevel.textContent=level;
    if(contentType)contentType.textContent=type;
    if(decodedContent)decodedContent.textContent=input||"";

    if(riskBar){
        riskBar.style.width=score+"%";
    }

    if(resultStatus){
        resultStatus.textContent=level+" RISK";
        resultStatus.className="result-status "+level.toLowerCase();
    }

    if(resultTitle){
        resultTitle.textContent=getResultTitle(level);
    }

    if(reasonList){
        reasonList.innerHTML="";
        if(reasons.length){
            reasons.forEach(reason=>{
                const li=document.createElement("li");
                li.textContent=reason;
                reasonList.appendChild(li);
            });
        }else{
            const li=document.createElement("li");
            li.textContent="No major scam indicators were detected.";
            reasonList.appendChild(li);
        }
    }

    if(recommendation)recommendation.textContent=rec;

    displayVirusTotal(analysis?.virusTotal);

    displayUpi(input);

    if(urlActions){
        if(urls.length||isUrl(input)){
            urlActions.classList.remove("hidden");
            if(openLinkButton){
                openLinkButton.onclick=()=>{
                    const target=urls[0]||input;
                    if(isSafeForOpening(target))window.open(target,"_blank","noopener,noreferrer");
                    else showToast("This link is considered risky and will not be opened.");
                };
            }
        }else{
            urlActions.classList.add("hidden");
        }
    }
}

function getResultTitle(level){
    if(level==="CRITICAL")return"Critical Scam Risk Detected";
    if(level==="HIGH")return"High Scam Risk Detected";
    if(level==="MEDIUM")return"Potentially Suspicious Content";
    return"Content Appears Low Risk";
}

function getRecommendation(level){
    if(level==="CRITICAL")return"Do not click links, scan further, share OTPs, send money, or provide personal information.";
    if(level==="HIGH")return"Do not interact with this content until you independently verify the sender or website.";
    if(level==="MEDIUM")return"Be careful and verify the sender, website, payment request, or offer before proceeding.";
    return"No major scam indicators were detected. Continue to verify unexpected messages before trusting them.";
}

function displayVirusTotal(vt){
    if(!virusTotalStatus)return;

    if(!vt){
        virusTotalStatus.textContent="Not checked";
        if(virusTotalStats)virusTotalStats.classList.add("hidden");
        return;
    }

    if(vt.status==="unavailable"||vt.status==="error"){
        virusTotalStatus.textContent=vt.message||"VirusTotal unavailable";
        if(virusTotalStats)virusTotalStats.classList.add("hidden");
        return;
    }

    const stats=vt.stats||vt.data?.attributes?.last_analysis_stats;

    if(stats){
        virusTotalStatus.textContent="VirusTotal analysis completed";
        if(vtMalicious)vtMalicious.textContent=stats.malicious||0;
        if(vtSuspicious)vtSuspicious.textContent=stats.suspicious||0;
        if(vtHarmless)vtHarmless.textContent=stats.harmless||0;
        if(vtUndetected)vtUndetected.textContent=stats.undetected||0;
        if(virusTotalStats)virusTotalStats.classList.remove("hidden");
    }else{
        virusTotalStatus.textContent="VirusTotal result received";
        if(virusTotalStats)virusTotalStats.classList.add("hidden");
    }
}

function displayUpi(input){
    if(!upiDetails)return;

    if(!input||!input.toLowerCase().startsWith("upi://pay")){
        upiDetails.classList.add("hidden");
        return;
    }

    const params=new URLSearchParams(input.split("?")[1]||"");

    if(upiId)upiId.textContent=params.get("pa")||"-";
    if(upiPayee)upiPayee.textContent=params.get("pn")||"-";
    if(upiAmount)upiAmount.textContent=params.get("am")||"-";
    if(upiCurrency)upiCurrency.textContent=params.get("cu")||"INR";

    upiDetails.classList.remove("hidden");
}

function isUrl(value){
    if(!value)return false;
    try{
        const url=new URL(value);
        return url.protocol==="http:"||url.protocol==="https:";
    }catch{
        return false;
    }
}

function isSafeForOpening(value){
    try{
        const url=new URL(value);
        return url.protocol==="http:"||url.protocol==="https:";
    }catch{
        return false;
    }
}

async function loadHistory(){
    if(!historyList)return;

    try{
        const data=await apiRequest("/scans");
        const scans=Array.isArray(data)?data:(data.scans||[]);

        historyList.innerHTML="";

        if(!scans.length){
            historyList.innerHTML="<div class='empty-history'>No scans yet.</div>";
            return;
        }

        scans.forEach(scan=>{
            const item=document.createElement("div");
            item.className="history-item";

            const score=Number(scan.riskScore)||0;
            const level=String(scan.riskLevel||getLevel({},score)).toUpperCase();
            const type=String(scan.type||"message").toUpperCase();
            const text=scan.input||"";
            const date=scan.createdAt?new Date(scan.createdAt).toLocaleString():"";

            item.innerHTML=`
                <div class="history-main">
                    <div class="history-type">${type}</div>
                    <div class="history-content">${escapeHtml(text.substring(0,150))}${text.length>150?"...":""}</div>
                    <div class="history-date">${escapeHtml(date)}</div>
                </div>
                <div class="history-risk ${level.toLowerCase()}">
                    <strong>${score}</strong>
                    <span>${level}</span>
                </div>
            `;

            historyList.appendChild(item);
        });
    }catch(error){
        console.error("History error:",error);
    }
}

async function loadStats(){
    try{
        const data=await apiRequest("/scans/stats");

        const stats=data.stats||data;

        if(totalScans)totalScans.textContent=stats.total||0;
        if(lowScans)lowScans.textContent=stats.low||stats.LOW||0;
        if(mediumScans)mediumScans.textContent=stats.medium||stats.MEDIUM||0;
        if(highScans)highScans.textContent=stats.high||stats.HIGH||0;
        if(criticalScans)criticalScans.textContent=stats.critical||stats.CRITICAL||0;
    }catch(error){
        console.error("Stats error:",error);
    }
}

async function reportScam(){
    const input=currentQrContent||(scanInput?scanInput.value.trim():"");

    if(!input){
        showToast("Analyze something before reporting it.");
        return;
    }

    const reason=prompt("Why do you think this content is suspicious?");

    if(reason===null)return;

    try{
        await apiRequest("/reports",{
            method:"POST",
            body:JSON.stringify({
                input,
                reason:reason.trim()||"Suspicious content"
            })
        });

        showToast("Suspicious content reported successfully.");
    }catch(error){
        console.error(error);
        showToast(error.message||"Unable to submit report.");
    }
}

function escapeHtml(value){
    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

async function checkServer(){
    try{
        await apiRequest("/health");
        console.log("ScamShield backend connected.");
    }catch(error){
        console.error("Backend connection error:",error);
    }
}

if(scanInput){
    scanInput.addEventListener("input",updateCharacterCount);
    updateCharacterCount();
}

if(analyzeMessageButton){
    analyzeMessageButton.addEventListener("click",analyzeMessage);
}

if(scanQrButton){
    scanQrButton.addEventListener("click",showScanner);
}

if(heroScanButton){
    heroScanButton.addEventListener("click",showScanner);
}

if(closeScannerButton){
    closeScannerButton.addEventListener("click",closeScanner);
}

if(analyzeManualQrButton){
    analyzeManualQrButton.addEventListener("click",analyzeManualQr);
}

if(reportButton){
    reportButton.addEventListener("click",reportScam);
}

if(manualQrInput){
    manualQrInput.addEventListener("keydown",event=>{
        if(event.ctrlKey&&event.key==="Enter")analyzeManualQr();
    });
}

window.addEventListener("beforeunload",()=>{
    stopQrScanner();
});

loadHistory();
loadStats();
checkServer();