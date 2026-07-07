async function hlApi(path, options={}){const res=await fetch(`${window.HL_API_BASE}${path}`,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options}); if(!res.ok) throw new Error(await res.text()); return res.json();}
async function hlGetData(){const r=await hlApi('/data?t='+Date.now()); return r.data||{};}
async function hlSaveData(data){return hlApi('/data',{method:'PUT',body:JSON.stringify({data,clientId:'shop-admin-ui'})});}
