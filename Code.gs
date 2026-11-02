// Hisaab backend — Google Sheet (Extensions > Apps Script) mein paste karein.
const TOKEN = 'APNA-PASSWORD-YAHAN-LIKHEIN';   // <-- isay badal dein, wahi app ke Setup mein dalna hai
const SKIP = /^(Sheet1|ReadMe.*|Expenses|Income)$/;  // purani sheets app ko nahi bheji jatin
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function norm(v){if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');if(v===true)return 'TRUE';if(v===false)return 'FALSE';return v}
function doGet(e){
  if(e.parameter.token!==TOKEN)return out({ok:false,err:'token'});
  const sheets={};
  SpreadsheetApp.getActive().getSheets().forEach(s=>{
    const n=s.getName();if(SKIP.test(n))return;
    const v=s.getDataRange().getValues();if(!v.length)return;
    const cols=v[0].map(String).filter(String);
    sheets[n]={cols,rows:v.slice(1).filter(r=>r[0]!=='').map(r=>Object.fromEntries(cols.map((c,i)=>[c,norm(r[i])])))};
  });
  return out({ok:true,sheets});
}
function doPost(e){
  const b=JSON.parse(e.postData.contents);
  if(b.token!==TOKEN)return out({ok:false,err:'token'});
  const L=LockService.getScriptLock();L.waitLock(20000);
  try{
    const ss=SpreadsheetApp.getActive();
    (b.ops||[]).forEach(o=>{
      const s=ss.getSheetByName(o.sheet);if(!s)return;
      const v=s.getDataRange().getValues(),cols=v[0].map(String),id=String(o.op==='del'?o.id:o.row[cols[0]]);
      let i=v.findIndex((r,k)=>k>0&&String(r[0])===id);
      if(o.op==='del'){if(i>0)s.deleteRow(i+1);return}
      if(i<0){i=v.findIndex((r,k)=>k>0&&r[0]==='');if(i<0)i=v.length}
      s.getRange(i+1,1,1,cols.length).setValues([cols.map(c=>o.row[c]===undefined?'':o.row[c])]);
    });
  }finally{L.releaseLock()}
  return out({ok:true});
}
