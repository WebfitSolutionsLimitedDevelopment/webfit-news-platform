/** Remembers the newsroom's "Add Webfit News logo" choice on this device. On unless switched off. */
const KEY='wf-watermark';
export function watermarkOn():boolean{try{return localStorage.getItem(KEY)!=='0'}catch{return true}}
export function setWatermarkOn(on:boolean){try{localStorage.setItem(KEY,on?'1':'0')}catch{}}
