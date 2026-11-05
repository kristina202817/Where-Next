const sharp=require('sharp');const fs=require('fs');const p='/workspaces/default/code/public/assets/';
(async()=>{for(const f of fs.readdirSync(p).filter(f=>f.endsWith('.png'))){
 const big=fs.statSync(p+f).size>1e6;
 await sharp(p+f).resize({width:big?1600:1440,withoutEnlargement:true}).jpeg({quality:82,mozjpeg:true}).toFile(p+'opt/'+f.replace('.png','.jpg'));}})();
