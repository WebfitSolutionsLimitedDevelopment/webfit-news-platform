'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ArticleAudioPlayer.module.css';

type Status='idle'|'playing'|'paused'|'unsupported';

function splitForSpeech(text:string){
  const normalized=text.replace(/\s+/g,' ').trim();
  if(!normalized)return[];
  const sentences=normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)??[normalized];
  const chunks:string[]=[];
  let current='';

  for(const sentence of sentences){
    const next=`${current} ${sentence}`.trim();
    if(next.length<=420){
      current=next;
      continue;
    }
    if(current)chunks.push(current);
    if(sentence.length<=420){
      current=sentence.trim();
      continue;
    }
    const words=sentence.trim().split(/\s+/);
    current='';
    for(const word of words){
      const wordNext=`${current} ${word}`.trim();
      if(wordNext.length>420&&current){
        chunks.push(current);
        current=word;
      }else{
        current=wordNext;
      }
    }
  }
  if(current)chunks.push(current);
  return chunks;
}

function AccessibilityIcon(){
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="21"/>
    <circle cx="24" cy="14" r="3.5" className={styles.iconFill}/>
    <path d="M13 20.5c6.9 2 15.1 2 22 0M24 21v15M24 25l-7 11M24 25l7 11" className={styles.iconStroke}/>
  </svg>;
}

export function ArticleAudioPlayer({text}:{text:string}){
  const [status,setStatus]=useState<Status>('idle');
  const [rate,setRate]=useState(1);
  const [voice,setVoice]=useState<SpeechSynthesisVoice|null>(null);
  const indexRef=useRef(0);
  const chunksRef=useRef<string[]>([]);
  const rateRef=useRef(rate);
  const playerRef=useRef<HTMLDivElement>(null);
  const stoppedRef=useRef(false);

  useEffect(()=>{rateRef.current=rate;},[rate]);

  useEffect(()=>{
    if(typeof window==='undefined'||!('speechSynthesis'in window)){
      setStatus('unsupported');
      return;
    }

    const chooseVoice=()=>{
      const voices=window.speechSynthesis.getVoices();
      const preferred=
        voices.find(v=>v.lang.toLowerCase()==='en-nz')||
        voices.find(v=>v.lang.toLowerCase()==='en-au')||
        voices.find(v=>v.lang.toLowerCase()==='en-gb')||
        voices.find(v=>v.lang.toLowerCase().startsWith('en'));
      setVoice(preferred||null);
    };

    chooseVoice();
    window.speechSynthesis.addEventListener('voiceschanged',chooseVoice);
    return()=>{
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('voiceschanged',chooseVoice);
    };
  },[]);

  const speakChunk=(index:number)=>{
    if(stoppedRef.current||index>=chunksRef.current.length){
      setStatus('idle');
      indexRef.current=0;
      return;
    }

    indexRef.current=index;
    const utterance=new SpeechSynthesisUtterance(chunksRef.current[index]);
    utterance.lang=voice?.lang||'en-NZ';
    utterance.rate=rateRef.current;
    if(voice)utterance.voice=voice;
    utterance.onend=()=>speakChunk(index+1);
    utterance.onerror=()=>setStatus('idle');
    window.speechSynthesis.speak(utterance);
  };

  const play=()=>{
    if(status==='unsupported')return;

    if(status==='paused'){
      window.speechSynthesis.resume();
      setStatus('playing');
      return;
    }

    window.speechSynthesis.cancel();
    stoppedRef.current=false;
    chunksRef.current=splitForSpeech(text);
    indexRef.current=0;
    if(!chunksRef.current.length)return;
    setStatus('playing');
    speakChunk(0);
  };

  const pause=()=>{
    if(status!=='playing')return;
    window.speechSynthesis.pause();
    setStatus('paused');
  };

  const stop=()=>{
    stoppedRef.current=true;
    window.speechSynthesis.cancel();
    indexRef.current=0;
    setStatus('idle');
  };

  const changeRate=(value:number)=>{
    const wasActive=status==='playing'||status==='paused';
    const restartAt=indexRef.current;
    rateRef.current=value;
    setRate(value);

    if(wasActive){
      stoppedRef.current=true;
      window.speechSynthesis.cancel();
      stoppedRef.current=false;
      setStatus('playing');
      speakChunk(restartAt);
    }
  };

  const bringPlayerIntoView=()=>{
    playerRef.current?.scrollIntoView({behavior:'smooth',block:'center'});
    window.setTimeout(()=>playerRef.current?.focus(),350);
  };

  return <>
    <div
      ref={playerRef}
      className={styles.player}
      tabIndex={-1}
      aria-label="Listen to this article"
    >
      <div className={styles.intro}>
        <span className={styles.speakerIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.4-.9a5 5 0 0 1 0 7.8l1.4 1.5a7 7 0 0 0 0-10.8l-1.4 1.5Z"/></svg>
        </span>
        <div>
          <strong>Listen to this article</strong>
          <span>{status==='playing'?'Reading aloud':status==='paused'?'Paused':'Audio accessibility'}</span>
        </div>
      </div>

      {status==='unsupported'?
        <p className={styles.unsupported}>Audio reading is not supported by this browser.</p>
      :
        <div className={styles.controls}>
          {status==='playing'?
            <button type="button" onClick={pause} aria-label="Pause article audio">
              <span aria-hidden="true">Ⅱ</span> Pause
            </button>
          :
            <button type="button" className={styles.primary} onClick={play} aria-label={status==='paused'?'Resume article audio':'Play article audio'}>
              <span aria-hidden="true">▶</span> {status==='paused'?'Resume':'Play'}
            </button>
          }
          <button type="button" onClick={stop} disabled={status==='idle'} aria-label="Stop article audio">Stop</button>
          <label className={styles.speed}>
            <span>Speed</span>
            <select value={rate} onChange={event=>changeRate(Number(event.target.value))} aria-label="Reading speed">
              <option value={0.8}>0.8x</option>
              <option value={1}>1x</option>
              <option value={1.2}>1.2x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </label>
        </div>
      }
    </div>

    <button
      type="button"
      className={styles.floating}
      onClick={bringPlayerIntoView}
      aria-label="Accessibility: listen to this article"
      title="Accessibility: listen to this article"
    >
      <AccessibilityIcon/>
    </button>
  </>;
}
