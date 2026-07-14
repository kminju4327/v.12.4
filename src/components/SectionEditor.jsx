import {useState} from "react";

export default function SectionEditor({section,onSave,onClose,onAIImproveRequest,aiResult}){
 const [data,setData]=useState(section||{});
 const [aiInstruction,setAiInstruction]=useState("");
 const [aiLoading,setAiLoading]=useState(false);
 const update=(k,v)=>setData({...data,[k]:v});
 return <div style={{padding:20}}>
  <h3>Section Editor</h3>
  <label>제목</label>
  <input value={data.title||""} onChange={e=>update("title",e.target.value)} style={{width:"100%"}}/>
  <label>본문</label>
  <textarea value={data.body||""} onChange={e=>update("body",e.target.value)} style={{width:"100%",minHeight:100}}/>
  <label>핵심 포인트</label>
  <textarea value={(data.items||[]).join("\n")} onChange={e=>update("items",e.target.value.split("\n").filter(Boolean))} style={{width:"100%"}}/>
  <div style={{marginTop:20}}>
   <h4>✨ AI 개선 요청</h4>
   <textarea
    value={aiInstruction}
    onChange={e=>setAiInstruction(e.target.value)}
    placeholder="예: 더 프리미엄한 브랜드 느낌으로 변경"
    style={{width:"100%",minHeight:80}}
   />
   <button disabled={aiLoading} onClick={async()=>{
    if(!onAIImproveRequest) return;
    setAiLoading(true);
    try { await onAIImproveRequest({section,data,instruction:aiInstruction}); }
    finally { setAiLoading(false); }
   }}>{aiLoading ? "AI 개선 중..." : "AI 개선 요청"}</button>
  </div>

  {aiResult && <div style={{marginTop:20,padding:12,border:"1px solid #ddd",borderRadius:10,background:"#faf7f0"}}>
   <h4>✨ AI 개선 결과</h4>
   <p><b>제목</b></p><p>{aiResult.title}</p>
   <p><b>본문</b></p><p>{aiResult.body}</p>
   <button onClick={()=>onSave({...data,title:aiResult.title,body:aiResult.body})}>적용</button>
  </div>}
  <button onClick={()=>onSave(data)}>저장</button>
  <button onClick={onClose}>취소</button>
 </div>
}
