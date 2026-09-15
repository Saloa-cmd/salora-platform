import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const gold = '#c7a15a';
const cream = '#f5efe4';

const ProductFilm = ({productName, productNameAr, imageUrl, price, tagline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  const zoom = interpolate(frame, [0, 450], [1.03, 1.14], {extrapolateRight: 'clamp'});
  const fade = interpolate(frame, [0, 22, 390, 445], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{backgroundColor:'#080808', color:cream, fontFamily:'Arial, sans-serif', overflow:'hidden'}}>
    <Img src={imageUrl} style={{position:'absolute', width:'100%', height:'100%', objectFit:'cover', transform:`scale(${zoom})`, opacity:.78}} />
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.12) 20%,rgba(0,0,0,.35) 52%,rgba(0,0,0,.96) 100%)'}} />
    <div style={{position:'absolute', top:100, left:72, letterSpacing:8, fontSize:28, fontWeight:700, color:gold, opacity:fade}}>SALORA</div>
    <div style={{position:'absolute', left:72, right:72, bottom:150, opacity:fade, transform:`translateY(${(1-enter)*50}px)`}}>
      <div style={{fontSize:30, letterSpacing:5, color:gold, marginBottom:24}}>{tagline}</div>
      <div style={{fontSize:76, lineHeight:1.03, fontWeight:800, maxWidth:900}}>{productName}</div>
      <div dir="rtl" style={{fontSize:46, marginTop:18, fontWeight:600}}>{productNameAr}</div>
      <div style={{width:110, height:4, background:gold, margin:'34px 0 26px'}} />
      <div style={{fontSize:34, letterSpacing:2}}>{Number(price).toFixed(3)} OMR</div>
    </div>
  </AbsoluteFill>;
};

export const RemotionRoot = () => <Composition
  id="SaloraProductPreview"
  component={ProductFilm}
  durationInFrames={450}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{
    productName:'Pistachio Latte',
    productNameAr:'لاتيه فستق',
    imageUrl:'https://xikqnzvfnquiqyybkyvw.supabase.co/storage/v1/object/public/salora-product-media/salora/products/pistachio-latte/4b686cd0fda44852.webp',
    price:1.6,
    tagline:'TASTE THE HARMONY'
  }}
/>;
