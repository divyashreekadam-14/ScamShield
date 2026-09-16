const suspiciousTlds=[".xyz",".top",".click",".work",".zip",".tk",".ml",".ga",".cf",".gq",".cam",".buzz",".live",".icu",".rest"];
const shortenedDomains=["bit.ly","tinyurl.com","t.co","goo.gl","is.gd","cutt.ly","rb.gy","shorturl.at","ow.ly","buff.ly"];
const urlRegex=/https?:\/\/[^\s<>"']+/gi;

function cleanUrl(url){
return url.replace(/[),.!?;:'"]+$/g,"");
}

function extractUrls(input){
const matches=String(input||"").match(urlRegex)||[];
return [...new Set(matches.map(cleanUrl))];
}

function getDomain(url){
try{
return new URL(url).hostname.toLowerCase();
}catch{
return "";
}
}

function isIpAddress(hostname){
return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(hostname);
}

function isSuspiciousDomain(url){
const domain=getDomain(url);
return suspiciousTlds.some(tld=>domain.endsWith(tld));
}

function isShortenedUrl(url){
const domain=getDomain(url);
return shortenedDomains.some(item=>domain===item||domain.endsWith("."+item));
}

function parseUpi(text){
if(!/^upi:\/\/pay/i.test(String(text).trim())){
return null;
}

try{
const parsed=new URL(String(text).trim());

return{
upiId:parsed.searchParams.get("pa")||"",
payeeName:parsed.searchParams.get("pn")||"",
amount:parsed.searchParams.get("am")||"",
currency:parsed.searchParams.get("cu")||"INR",
transactionNote:parsed.searchParams.get("tn")||""
};
}catch{
return null;
}
}

function isUpiPaymentQr(text){
return /^upi:\/\/pay/i.test(String(text).trim());
}

function isRecognizedPaymentQr(text){
const value=String(text||"").trim().toLowerCase();

if(isUpiPaymentQr(value)){
return true;
}

if(
value.includes("phonepe")||
value.includes("paytm")||
value.includes("googlepay")||
value.includes("gpay")||
value.includes("tez")||
value.includes("bhim")||
value.includes("upi")
){
return true;
}

return false;
}

function classifyQrContent(input){
const text=String(input||"").trim();

if(isUpiPaymentQr(text)){
return{
contentType:"upi",
upi:parseUpi(text),
urls:[]
};
}

if(/^https?:\/\//i.test(text)){
return{
contentType:"url",
upi:null,
urls:[text]
};
}

if(/^tel:/i.test(text)){
return{
contentType:"telephone",
upi:null,
urls:[]
};
}

if(/^mailto:/i.test(text)){
return{
contentType:"email",
upi:null,
urls:[]
};
}

if(/^sms:/i.test(text)){
return{
contentType:"sms",
upi:null,
urls:[]
};
}

return{
contentType:"unknown",
upi:null,
urls:extractUrls(text)
};
}

function getRiskLevel(score){
if(score>=80){
return"CRITICAL";
}

if(score>=60){
return"HIGH";
}

if(score>=30){
return"MEDIUM";
}

return"LOW";
}

function getRecommendation(level){
if(level==="CRITICAL"){
return"Do not open this QR destination or make a payment. Verify it through an official source.";
}

if(level==="HIGH"){
return"Do not interact with this QR. Verify the source before continuing.";
}

if(level==="MEDIUM"){
return"Proceed carefully and verify the QR source before continuing.";
}

return"This payment QR appears genuine based on the current checks. Verify the recipient before making the payment.";
}

function analyzeUpiQr(input){
const upi=parseUpi(input);

if(!upi){
return{
riskScore:80,
riskLevel:"CRITICAL",
reasons:["Invalid UPI payment QR detected."],
recommendation:"Do not make this payment because the UPI information could not be verified.",
extractedUrls:[],
contentType:"upi",
qrInfo:null
};
}

if(!upi.upiId){
return{
riskScore:80,
riskLevel:"CRITICAL",
reasons:["UPI payment address is missing."],
recommendation:"Do not make this payment because the UPI payment address is missing.",
extractedUrls:[],
contentType:"upi",
qrInfo:{
contentType:"upi",
upi
}
};
}

return{
riskScore:0,
riskLevel:"LOW",
reasons:["Recognized UPI payment QR detected."],
recommendation:"This payment QR appears genuine based on the current checks. Verify the recipient before making the payment.",
extractedUrls:[],
contentType:"upi",
qrInfo:{
contentType:"upi",
upi
}
};
}

function analyzeQr(input){
const text=String(input||"").trim();
const qrInfo=classifyQrContent(text);

if(isUpiPaymentQr(text)){
return analyzeUpiQr(text);
}

const urls=extractUrls(text);

if(urls.length>0){
let score=0;
const reasons=[];

for(const url of urls){
const domain=getDomain(url);

if(isIpAddress(domain)){
score+=30;
reasons.push("QR contains an IP address instead of a normal domain.");
}

if(isShortenedUrl(url)){
score+=25;
reasons.push("QR contains a shortened URL.");
}

if(isSuspiciousDomain(url)){
score+=35;
reasons.push("QR contains a suspicious or unusual domain.");
}

try{
const parsed=new URL(url);

if(parsed.protocol!=="https:"){
score+=20;
reasons.push("QR destination does not use HTTPS.");
}

const suspiciousWords=[
"login",
"verify",
"verification",
"kyc",
"refund",
"cashback",
"reward",
"prize",
"winner",
"claim",
"urgent",
"bank",
"account",
"suspended",
"blocked",
"payment"
];

let matches=0;

for(const word of suspiciousWords){
if(url.toLowerCase().includes(word)){
matches++;
}
}

if(matches>=2){
score+=30;
reasons.push("QR destination contains multiple suspicious keywords.");
}else if(matches===1){
score+=15;
reasons.push("QR destination contains a suspicious keyword.");
}
}catch{
score+=30;
reasons.push("QR contains an invalid URL.");
}
}

score=Math.min(100,score);

if(score<60){
score=60;
}

if(score>=80){
return{
riskScore:Math.min(100,score),
riskLevel:"CRITICAL",
reasons:reasons.length?reasons:["Suspicious QR destination detected."],
recommendation:getRecommendation("CRITICAL"),
extractedUrls:urls,
contentType:"qr",
qrInfo
};
}

return{
riskScore:score,
riskLevel:"HIGH",
reasons:reasons.length?reasons:["Suspicious QR destination detected."],
recommendation:getRecommendation("HIGH"),
extractedUrls:urls,
contentType:"qr",
qrInfo
};
}

if(isRecognizedPaymentQr(text)){
return{
riskScore:0,
riskLevel:"LOW",
reasons:["Recognized UPI/payment QR detected."],
recommendation:"This payment QR appears genuine based on the current checks. Verify the recipient before making the payment.",
extractedUrls:[],
contentType:"qr",
qrInfo
};
}

return{
riskScore:80,
riskLevel:"CRITICAL",
reasons:["QR content is not a recognized UPI or supported payment QR."],
recommendation:"Do not interact with this QR. The QR does not contain recognized payment information.",
extractedUrls:[],
contentType:"qr",
qrInfo
};
}

function analyzeContent(input,requestedType="message"){
const value=String(input||"").trim();

if(!value){
throw new Error("Input cannot be empty");
}

if(requestedType==="qr"){
return analyzeQr(value);
}

let score=0;
const reasons=[];

function addReason(reason,points){
if(!reasons.includes(reason)){
reasons.push(reason);
score+=points;
}
}

const urgencyPatterns=[
/\burgent\b/i,
/\bimmediately\b/i,
/\bverify now\b/i,
/\bact now\b/i,
/\bclick now\b/i,
/\bwithin\s+\d+\s*(minutes?|hours?|days?)\b/i,
/\bexpires?\s+(today|soon|now)\b/i
];

const threatPatterns=[
/\baccount\s+(blocked|suspended|closed)\b/i,
/\bpolice\b/i,
/\barrest\b/i,
/\bpenalty\b/i,
/\blegal action\b/i
];

const otpPatterns=[
/\botp\b/i,
/\bone[-\s]?time password\b/i
];

const passwordPatterns=[
/\bpassword\b/i,
/\bpasswd\b/i,
/\bLogin password\b/i
];

const pinPatterns=[
/\bin pin\b/i,
/\batm pin\b/i
];

const cvvPatterns=[
/\bcvv\b/i,
/\bcvc\b/i
];

const bankPatterns=[
/\bbank details?\b/i,
/\baccount number\b/i,
/\bcard details?\b/i,
/\bcredit card\b/i,
/\bdebit card\b/i
];

const rewardPatterns=[
/\bwinner\b/i,
/\bwon\b/i,
/\bprize\b/i,
/\blottery\b/i,
/\breward\b/i,
/\bcashback\b/i,
/\bfree gift\b/i
];

const paymentPatterns=[
/\bupi\b/i,
/\bpayment\b/i,
/\bpay\b/i,
/\btransaction\b/i,
/\bmoney\b/i,
/\btransfer\b/i
];

if(urgencyPatterns.some(pattern=>pattern.test(value))){
addReason("Urgent or pressure-based language",12);
}

if(threatPatterns.some(pattern=>pattern.test(value))){
addReason("Threat or account-suspension language",15);
}

if(otpPatterns.some(pattern=>pattern.test(value))){
addReason("Requests or mentions OTP information",18);
}

if(passwordPatterns.some(pattern=>pattern.test(value))){
addReason("Requests or mentions password information",18);
}

if(pinPatterns.some(pattern=>pattern.test(value))){
addReason("Requests or mentions PIN information",18);
}

if(cvvPatterns.some(pattern=>pattern.test(value))){
addReason("Requests or mentions CVV/CVC information",18);
}

if(bankPatterns.some(pattern=>pattern.test(value))){
addReason("Requests for banking or card details",18);
}

if(rewardPatterns.some(pattern=>pattern.test(value))){
addReason("Prize, reward, lottery or cashback language",10);
}

if(paymentPatterns.some(pattern=>pattern.test(value))){
addReason("Payment or money-related request",6);
}

if(/\b(kyc|aadhaar|pan)\b/i.test(value)){
addReason("Sensitive identity or KYC information mentioned",10);
}

if(/\bclick\s+(here|now)\b/i.test(value)){
addReason("Suspicious call-to-action to click",10);
}

const urls=extractUrls(value);

for(const url of urls){
try{
const parsed=new URL(url);
const hostname=parsed.hostname.toLowerCase();

if(isIpAddress(hostname)){
addReason("URL uses an IP address instead of a normal domain",20);
}

if(isShortenedUrl(url)){
addReason("Shortened URL detected",15);
}

if(isSuspiciousDomain(url)){
addReason("Suspicious or unusual domain detected",20);
}

if(parsed.protocol!=="https:"){
addReason("URL does not use HTTPS",8);
}
}catch{
addReason("Invalid or suspicious URL format",10);
}
}

const uppercaseLetters=value.match(/[A-Z]/g)||[];
const alphabeticLetters=value.match(/[A-Za-z]/g)||[];

if(
alphabeticLetters.length>=20&&
uppercaseLetters.length/alphabeticLetters.length>=0.65
){
addReason("Excessive capital letters detected",7);
}

const exclamationCount=(value.match(/!/g)||[]).length;

if(exclamationCount>=3){
addReason("Excessive exclamation marks detected",5);
}

score=Math.min(100,Math.max(0,score));

const riskLevel=getRiskLevel(score);

return{
riskScore:score,
riskLevel,
reasons:reasons.length?reasons:["No major scam indicators were detected by the current rule set."],
recommendation:getRecommendation(riskLevel),
extractedUrls:urls,
contentType:requestedType,
qrInfo:null
};
}

function combineVirusTotalResult(analysis,virusTotal){
if(analysis.contentType==="upi"){
return analysis;
}

let score=analysis.riskScore;

if(virusTotal&&virusTotal.status==="available"){
const malicious=Number(virusTotal.malicious||0);
const suspicious=Number(virusTotal.suspicious||0);

if(malicious>0){
score=Math.max(85,score);

if(!analysis.reasons.includes("VirusTotal detected malicious activity")){
analysis.reasons.push("VirusTotal detected malicious activity");
}
}

if(suspicious>0){
score=Math.max(70,score);

if(!analysis.reasons.includes("VirusTotal reported suspicious activity")){
analysis.reasons.push("VirusTotal reported suspicious activity");
}
}
}

score=Math.min(100,Math.max(0,score));

analysis.riskScore=score;
analysis.riskLevel=getRiskLevel(score);
analysis.recommendation=getRecommendation(analysis.riskLevel);

return analysis;
}

module.exports={
analyzeContent,
combineVirusTotalResult,
extractUrls,
classifyQrContent,
getRiskLevel
};