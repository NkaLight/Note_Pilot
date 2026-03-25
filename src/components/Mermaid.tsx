"use client";
import {useEffect, useRef} from "react";
import mermaid from "mermaid";

mermaid.initialize({startOnLoad:false, theme:"neutral"});

export function Mermaid({chart}:{chart:string}){
    const ref = useRef<HTMLDivElement|null>(null);
    useEffect(()=>{
        if(!ref.current) return;
        mermaid.render(`mermaid-${Math.random().toString(36).slice(2)}`, chart).then(({svg})=>{
            if(ref.current) ref.current.innerHTML = svg;
        })
        .catch(()=>{
            if(ref.current)ref.current.innerHTML = "<p>Invalid diagram</p>";
        });     
    },[chart]);
    return (
    <div ref={ref}></div>
    );
}