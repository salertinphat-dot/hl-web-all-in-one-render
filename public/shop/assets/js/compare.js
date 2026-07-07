function hlCompareRows(items){return ['name','sku','category','brand','salePrice','stock','warranty'].map(k=>({key:k,values:(items||[]).map(x=>x?.[k]||'')}));}
