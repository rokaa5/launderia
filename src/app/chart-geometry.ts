export interface SeriesPoint {label:string;value:number;title?:string}
export interface ChartTick {label:string}
export interface NormalizedBar {label:string;value:number;heightPct:number;title:string}
export interface CurveGeometry {linePath:string;areaPath:string;stepLinePath:string;stepAreaPath:string;singlePointY:number|null;points:{x:number;y:number;label:string;title:string}[];max:number;yTicks:string[];xLabels:string[]}

/** Format compact axis tick without overflowing narrow chart gutters. */
export function compactAxisValue(value:number,prefix='',suffix=''):string {
  if(!Number.isFinite(value)||value<=0)return `${prefix}0${suffix}`;
  if(value>=1_000_000)return `${prefix}${(value/1_000_000).toFixed(1).replace(/\.0$/,'')}M${suffix}`;
  if(value>=1_000)return `${prefix}${(value/1_000).toFixed(1).replace(/\.0$/,'')}k${suffix}`;
  if(value<1)return `${prefix}${Number(value.toFixed(1))}${suffix}`;
  return `${prefix}${Math.round(value)}${suffix}`;
}

/** Build normalized capsule bars relative to the largest value in the series. */
export function buildBarGeometry(series:SeriesPoint[],prefix='',suffix=''):{bars:NormalizedBar[];max:number;yTicks:string[]} {
  const max=Math.max(2,...series.map(s=>s.value));
  const yTicks=[compactAxisValue(max,prefix,suffix),compactAxisValue(max/2,prefix,suffix),compactAxisValue(0,prefix,suffix)];
  const bars=series.map(s=>({
    label:s.label,
    value:s.value,
    heightPct:s.value<=0?4:Math.max(10,Math.round((s.value/max)*92)),
    title:s.title||`${s.label}: ${prefix}${Math.round(s.value)}${suffix}`
  }));
  return {bars,max,yTicks};
}

/** Build monotone-clamped cubic Bezier and stepped-area SVG paths on a 0..100 coordinate canvas. */
export function buildCurveGeometry(series:SeriesPoint[],prefix='',suffix='',fixedMax?:number):CurveGeometry {
  const rawMax=Math.max(...series.map(s=>s.value),0);
  const max=fixedMax!==undefined?Math.max(fixedMax,rawMax||1):Math.max(2,rawMax);
  const yTicks=[compactAxisValue(max,prefix,suffix),compactAxisValue(max/2,prefix,suffix),compactAxisValue(0,prefix,suffix)];
  const xLabels=pickXLabels(series);
  if(!series.length){
    return {linePath:'',areaPath:'',stepLinePath:'',stepAreaPath:'',singlePointY:null,points:[],max,yTicks,xLabels};
  }
  const mapY=(v:number)=>Number((92-(Math.min(max,Math.max(0,v))/max)*82).toFixed(2));
  if(series.length===1){
    const y=mapY(series[0].value);
    return {
      linePath:`M 0 ${y} L 100 ${y}`,
      areaPath:`M 0 ${y} L 100 ${y} L 100 100 L 0 100 Z`,
      stepLinePath:`M 0 ${y} L 100 ${y}`,
      stepAreaPath:`M 0 ${y} L 100 ${y} L 100 100 L 0 100 Z`,
      singlePointY:y,
      points:[{x:50,y,label:series[0].label,title:series[0].title||''}],
      max,yTicks,xLabels
    };
  }
  const pts=series.map((s,i)=>({
    x:Number(((i/(series.length-1))*100).toFixed(2)),
    y:mapY(s.value),
    label:s.label,
    title:s.title||''
  }));
  const linePath=monotonePath(pts);
  const areaPath=`${linePath} L ${pts[pts.length-1].x} 100 L ${pts[0].x} 100 Z`;
  const {stepLinePath,stepAreaPath}=buildStepPaths(pts);
  return {linePath,areaPath,stepLinePath,stepAreaPath,singlePointY:null,points:pts,max,yTicks,xLabels};
}

function pickXLabels(series:SeriesPoint[]):string[] {
  if(!series.length)return [];
  if(series.length<=5)return series.map(s=>s.label);
  const mid=Math.floor((series.length-1)/2);
  return [series[0].label,series[mid].label,series[series.length-1].label];
}

function monotonePath(pts:{x:number;y:number}[]):string {
  const n=pts.length;
  const slopes=pts.slice(0,-1).map((p,i)=>(pts[i+1].y-p.y)/Math.max(0.001,pts[i+1].x-p.x));
  const tangents=pts.map((_,i)=>{
    if(i===0)return slopes[0];
    if(i===n-1)return slopes[n-2];
    const s0=slopes[i-1],s1=slopes[i];
    return s0*s1<=0?0:(s0+s1)/2;
  });
  let d=`M ${pts[0].x} ${pts[0].y}`;
  for(let i=0;i<n-1;i++){
    const dx=(pts[i+1].x-pts[i].x)/3;
    const c1x=Number((pts[i].x+dx).toFixed(2));
    const c1y=clampCoord(pts[i].y+tangents[i]*dx);
    const c2x=Number((pts[i+1].x-dx).toFixed(2));
    const c2y=clampCoord(pts[i+1].y-tangents[i+1]*dx);
    d+=` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${pts[i+1].x} ${pts[i+1].y}`;
  }
  return d;
}

function clampCoord(y:number):number {
  return Number(Math.min(96,Math.max(4,y)).toFixed(2));
}

function buildStepPaths(pts:{x:number;y:number}[]):{stepLinePath:string;stepAreaPath:string} {
  const n=pts.length;
  const width=100/n;
  let line='';
  for(let i=0;i<n;i++){
    const x0=Number((i*width).toFixed(2));
    const x1=Number(((i+1)*width).toFixed(2));
    const y=pts[i].y;
    line+=i===0?`M ${x0} ${y} H ${x1}`:` V ${y} H ${x1}`;
  }
  return {stepLinePath:line,stepAreaPath:`${line} V 100 H 0 Z`};
}
